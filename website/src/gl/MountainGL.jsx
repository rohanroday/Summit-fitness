import { useEffect, useRef } from 'react';
import { prefersReduced } from '../lib/bus.js';
import { loadThree, visibilityGate, warmUp, webglAvailable } from './loadThree.js';

// The Summit mountain mark, extruded into solid polished gold with real reflections.
// mode "intro": builds itself (extrudes out of the screen and swings into place).
// mode "footer": floats, follows the mouse and turns a little with scroll.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 67">
  <path d="M2 64 60 3l58 61h-13L60 17 15 64z"/>
  <path d="M18 64 37 43l7 7-4 2 9-6-6 18z"/>
  <path d="M102 64 83 43l-7 7 4 2-9-6 6 18z"/>
  <path d="M40 64 60 41l20 23h-9L60 52 49 64z"/>
</svg>`;

export default function MountainGL({ mode = 'footer', className = '', onReady }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!webglAvailable()) return;
    const canvas = ref.current;
    const reduced = prefersReduced();
    let disposed = false;
    let cleanup = () => {};

    loadThree().then(({ THREE, SVGLoader, RoomEnvironment }) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // Neutral keeps the gold saturated; ACES washes metals toward silver.
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.05;

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.set(0, 0, 9);

      // Build the mark from its SVG paths.
      const data = new SVGLoader().parse(MARK);
      const shapes = data.paths.flatMap((p) => p.toShapes(true));
      const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 9,
        bevelEnabled: true,
        bevelThickness: 1.6,
        bevelSize: 1.1,
        bevelSegments: 4,
        curveSegments: 6,
      });
      geo.center();
      geo.scale(0.05, -0.05, 0.05); // SVG y points down
      // Metals take their colour from what they reflect, so tint both the base and the
      // reflections: a white studio environment alone reads as chrome.
      const gold = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f7b43c'),
        metalness: 1,
        roughness: 0.3,
        envMapIntensity: 0.42,
        emissive: new THREE.Color('#3d2405'),
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
        specularColor: new THREE.Color('#ffd27a'),
      });
      const mesh = new THREE.Mesh(geo, gold);
      const pivot = new THREE.Group();
      pivot.add(mesh);
      scene.add(pivot);

      const key = new THREE.DirectionalLight('#ffc061', 2.6);
      key.position.set(3, 4, 6);
      const rim = new THREE.DirectionalLight('#ff9f3a', 3);
      rim.position.set(-5, 2, -4);
      scene.add(key, rim, new THREE.AmbientLight('#3a2a14', 0.6));

      const resize = () => {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      const mouse = { x: 0, y: 0 };
      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      const start = performance.now();
      let raf = null;
      let running = false;
      let rx = 0;
      let ry = 0;
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const frame = (now) => {
        const t = (now - start) / 1000;
        if (mode === 'intro') {
          // extrude out of the screen and swing round into place over ~1.4s
          const k = reduced ? 1 : easeOut(Math.min(1, t / 1.4));
          mesh.scale.set(1, 1, Math.max(0.02, k));
          pivot.rotation.y = (1 - k) * -1.1 + Math.sin(t * 0.9) * 0.08 * k;
          pivot.rotation.x = (1 - k) * 0.5;
          pivot.position.y = (1 - k) * -0.4;
          gold.roughness = 0.5 - 0.28 * k;
        } else {
          // scroll adds a small turn measured from where the logo sits on screen (never the whole
          // page's scroll, which reached ~15000px by the footer and spun it onto its edge)
          const r = canvas.getBoundingClientRect();
          const local = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight));
          const ty = mouse.x * 0.45 + Math.sin(t * 0.5) * 0.15 + local * 0.35;
          const tx = mouse.y * 0.2 + 0.08;
          ry += (ty - ry) * 0.05;
          rx += (tx - rx) * 0.05;
          pivot.rotation.set(rx, ry, 0);
          pivot.position.y = Math.sin(t * 1.1) * 0.06;
        }
        renderer.render(scene, camera);
        if (!canvas.classList.contains('is-live')) canvas.classList.add('is-live');
        raf = running ? requestAnimationFrame(frame) : null;
      };
      const stopWarm = warmUp(() => {
        renderer.compile(scene, camera);
        renderer.render(scene, camera);
      });
      const stopGate = visibilityGate(canvas, (on) => {
        running = on && !(reduced && mode === 'footer');
        if (raf === null) raf = requestAnimationFrame(frame); // always draw at least once
      });
      onReady?.();

      cleanup = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        stopWarm();
        stopGate();
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        geo.dispose();
        gold.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return <canvas className={`mountain-gl ${className}`} ref={ref} aria-hidden="true" />;
}
