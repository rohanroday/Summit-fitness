import { useEffect, useRef } from 'react';
import { bus, prefersReduced } from '../lib/bus.js';
import { loadThree, visibilityGate, warmUp, webglAvailable } from './loadThree.js';

// Draws the gym photos as WebGL planes sitting exactly on top of their <img> slots.
// While the strip travels sideways the planes bend like a sheet in the wind and split
// their colour slightly; hovering a photo zooms it gently with a ripple from the cursor.
// If WebGL is missing, the plain <img> tags simply stay visible.
const vert = /* glsl */ `
  uniform float uVel;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // bend: the middle of the photo lags behind its edges when the page scrolls fast
    float bend = sin(uv.x * 3.14159265);
    p.y += bend * uVel * 0.08;
    p.z += bend * abs(uVel) * 0.2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const frag = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uPlane;      // plane size in px
  uniform vec2 uImage;      // texture size in px
  uniform float uVel;
  uniform float uHover;
  uniform vec2 uMouse;      // 0..1 in plane space
  uniform float uRadius;    // corner radius in px
  uniform float uReveal;    // 0 hidden .. 1 shown (wipe up)
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float pa = uPlane.x / uPlane.y;
    float ia = uImage.x / uImage.y;
    vec2 s = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 uv = vUv;
    // hover: zoom toward the cursor with a soft ripple
    float d = distance(uv, uMouse);
    float ripple = sin(d * 28.0 - uHover * 6.0) * 0.006 * uHover * smoothstep(0.6, 0.0, d);
    vec2 zuv = (uv - uMouse) * (1.0 - 0.07 * uHover) + uMouse + ripple;
    vec2 tuv = coverUv(zuv);
    float shift = clamp(abs(uVel), 0.0, 1.0) * 0.012;
    vec4 col;
    col.r = texture2D(uTex, tuv + vec2(0.0, shift)).r;
    col.g = texture2D(uTex, tuv).g;
    col.b = texture2D(uTex, tuv - vec2(0.0, shift)).b;
    col.a = 1.0;
    // warm the photo a touch on hover
    col.rgb *= 1.0 + 0.06 * uHover * vec3(1.0, 0.9, 0.75);
    // rounded corners
    vec2 px = (vUv - 0.5) * uPlane;
    float sd = roundedBox(px, uPlane * 0.5, uRadius);
    float mask = 1.0 - smoothstep(-1.0, 0.5, sd);
    // reveal: a soft wipe rising from the bottom edge
    mask *= 1.0 - smoothstep(uReveal * 1.1 - 0.1, uReveal * 1.1, vUv.y);
    gl_FragColor = vec4(col.rgb, col.a * mask);
  }
`;

export default function GalleryGL({ hostRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReduced() || !webglAvailable()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    loadThree().then(({ THREE }) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      // ShaderMaterial does no colour conversion, so pass texture bytes straight through.
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
      const loader = new THREE.TextureLoader();
      const geo = new THREE.PlaneGeometry(1, 1, 32, 24);

      const imgs = [...host.querySelectorAll('.gym-img img')];
      const items = imgs.map((img) => {
        const uniforms = {
          uTex: { value: null },
          uPlane: { value: new THREE.Vector2(1, 1) },
          uImage: { value: new THREE.Vector2(16, 10) },
          uVel: { value: 0 },
          uHover: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uRadius: { value: 14 },
          uReveal: { value: 0 },
        };
        const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        scene.add(mesh);
        const item = { img, mesh, uniforms, mat, hover: 0, hoverTarget: 0, ready: false, revealStart: 0 };
        loader.load(img.currentSrc || img.src, (tex) => {
          if (disposed) return;
          tex.colorSpace = THREE.NoColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          item.stopWarm = warmUp(() => {
            renderer.initTexture(tex); // upload now, not on the first visible frame
            const was = mesh.visible; // compile() only looks at visible objects
            mesh.visible = true;
            renderer.compile(scene, camera);
            mesh.visible = was;
          });
          uniforms.uTex.value = tex;
          uniforms.uImage.value.set(tex.image.width, tex.image.height);
          item.ready = true;
          img.closest('.gym-img').classList.add('gl-on');
        });
        const slot = img.closest('.gym-img');
        const enter = () => (item.hoverTarget = 1);
        const leave = () => (item.hoverTarget = 0);
        const move = (e) => {
          const r = slot.getBoundingClientRect();
          uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
        };
        slot.addEventListener('pointerenter', enter);
        slot.addEventListener('pointerleave', leave);
        slot.addEventListener('pointermove', move);
        item.unbind = () => {
          slot.removeEventListener('pointerenter', enter);
          slot.removeEventListener('pointerleave', leave);
          slot.removeEventListener('pointermove', move);
        };
        return item;
      });

      let W = 0;
      let H = 0;
      const resize = () => {
        const r = canvas.getBoundingClientRect();
        W = r.width;
        H = r.height;
        renderer.setSize(W, H, false);
        camera.left = -W / 2;
        camera.right = W / 2;
        camera.top = H / 2;
        camera.bottom = -H / 2;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      let raf = null;
      let running = false;
      let vel = 0;
      const frame = (now) => {
        const cr = canvas.getBoundingClientRect();
        // page scroll speed from Lenis, eased so the bend breathes in and out
        vel += (Math.max(-1, Math.min(1, bus.velocity / 40)) - vel) * 0.12;
        for (const it of items) {
          const r = it.img.closest('.gym-img').getBoundingClientRect();
          const onScreen = r.right > cr.left - 50 && r.left < cr.right + 50 && r.bottom > cr.top && r.top < cr.bottom;
          it.mesh.visible = it.ready && onScreen;
          if (!it.mesh.visible) continue;
          if (!it.revealStart) it.revealStart = now;
          it.uniforms.uReveal.value = Math.min(1, (now - it.revealStart) / 900) ** 0.6;
          it.mesh.position.set(r.left - cr.left + r.width / 2 - W / 2, -(r.top - cr.top + r.height / 2) + H / 2, 0);
          it.mesh.scale.set(r.width, r.height, 1);
          it.uniforms.uPlane.value.set(r.width, r.height);
          it.hover += (it.hoverTarget - it.hover) * 0.08;
          it.uniforms.uHover.value = it.hover;
          it.uniforms.uVel.value = vel;
        }
        renderer.render(scene, camera);
        raf = running ? requestAnimationFrame(frame) : null;
      };
      const stopGate = visibilityGate(host, (on) => {
        running = on;
        if (on && raf === null) {
          raf = requestAnimationFrame(frame);
        }
      });

      cleanup = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        stopGate();
        ro.disconnect();
        items.forEach((it) => {
          it.unbind?.();
          it.stopWarm?.();
          it.mat.dispose();
          it.uniforms.uTex.value?.dispose();
          it.img.closest('.gym-img')?.classList.remove('gl-on');
        });
        geo.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [hostRef]);

  return <canvas className="gallery-gl" ref={canvasRef} aria-hidden="true" />;
}
