import { useEffect, useRef } from 'react';
import { bus, heroBounds, prefersReduced } from '../lib/bus.js';
import { loadThree, webglAvailable } from './loadThree.js';

// A deep field of gold dust motes behind the cream page. Three depth layers parallax with
// scroll, drift with the mouse, and brighten and stretch a little with scroll speed.
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uVel;
  uniform vec2 uMouse;
  uniform float uPixel;
  uniform float uAspect;
  attribute float aSeed;
  attribute float aDepth;
  attribute float aSize;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float depth = aDepth;                       // 0 far .. 1 near
    // slow rise, side to side sway, scroll parallax (near layers move more)
    p.y += uTime * (0.012 + 0.03 * aSeed) - uScroll * (0.25 + 1.1 * depth);
    p.x += sin(uTime * 0.25 + aSeed * 40.0) * 0.04 * (0.4 + depth);
    p.y = mod(p.y + 1.15, 2.3) - 1.15;          // wrap vertically
    p.xy += uMouse * (0.015 + 0.05 * depth);
    p.x *= uAspect;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float speed = clamp(abs(uVel) * 0.04, 0.0, 1.0);
    gl_PointSize = aSize * uPixel * (0.6 + depth * 1.4) * (1.0 + speed * 0.6);
    float twinkle = 0.65 + 0.35 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 60.0);
    vAlpha = (0.18 + 0.55 * depth) * twinkle * (1.0 + speed * 0.8);
  }
`;
const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    // on cream, motes are warm gold specks seen in sunlight (normal blending, low alpha)
    gl_FragColor = vec4(uColor, a * vAlpha * 0.55);
  }
`;

export default function GoldDust() {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReduced() || !webglAvailable()) return;
    const canvas = ref.current;
    let disposed = false;
    let cleanup = () => {};

    loadThree().then(({ THREE }) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      renderer.setPixelRatio(dpr);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 2;

      const count = window.innerWidth < 768 ? 260 : 820;
      const pos = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      const depth = new Float32Array(count);
      const size = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() * 2 - 1) * 1.05;
        pos[i * 3 + 1] = Math.random() * 2.3 - 1.15;
        pos[i * 3 + 2] = 0;
        seed[i] = Math.random();
        const d = Math.random();
        depth[i] = d * d;                        // most motes far away, a few close
        size[i] = 1.4 + Math.random() * 2.8;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      const uniforms = {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uVel: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uPixel: { value: dpr },
        uAspect: { value: 1 },
        uColor: { value: new THREE.Color('#c8902e') },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      scene.add(new THREE.Points(geo, mat));

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        // positions live in -1..1; widen them to the viewport so the field fills any shape
        camera.left = -w / h;
        camera.right = w / h;
        camera.updateProjectionMatrix();
        uniforms.uAspect.value = w / h;
      };
      resize();
      window.addEventListener('resize', resize);

      const mouse = { x: 0, y: 0 };
      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      // Only after the film: the hero has its own atmosphere.
      let raf = null;
      let visible = false;
      let last = 0;
      const frame = (t) => {
        const dt = Math.min(50, t - (last || t)) / 1000;
        last = t;
        uniforms.uTime.value += dt;
        uniforms.uScroll.value = bus.y / window.innerHeight * 0.35;
        uniforms.uVel.value += (bus.velocity - uniforms.uVel.value) * 0.12;
        uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * 0.04;
        uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * 0.04;
        renderer.render(scene, camera);
        raf = visible && !document.hidden ? requestAnimationFrame(frame) : null;
      };
      const check = () => {
        const { exit } = heroBounds();
        const show = window.scrollY > exit - window.innerHeight * 0.5;
        if (show !== visible) {
          visible = show;
          canvas.classList.toggle('is-on', show);
        }
        if (visible && raf === null && !document.hidden) {
          last = 0;
          raf = requestAnimationFrame(frame);
        }
      };
      window.addEventListener('scroll', check, { passive: true });
      document.addEventListener('visibilitychange', check);
      check();

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('scroll', check);
        document.removeEventListener('visibilitychange', check);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className="gold-dust" ref={ref} aria-hidden="true" />;
}
