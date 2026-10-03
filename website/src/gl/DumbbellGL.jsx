import { useEffect, useRef } from 'react';
import { bus, prefersReduced } from '../lib/bus.js';
import { loadThree, visibilityGate, warmUp, webglAvailable } from './loadThree.js';

// A Spline-style hero object built in three.js: a glossy dumbbell with soft rounded plates
// (lathe profiles), a gold knurled handle and a soft contact shadow. It floats, turns with
// scroll, leans toward the mouse, and can be grabbed and spun (with inertia).
export default function DumbbellGL({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!webglAvailable()) return;
    const canvas = ref.current;
    const reduced = prefersReduced();
    let disposed = false;
    let cleanup = () => {};

    loadThree().then(({ THREE, RoomEnvironment }) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.05;

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
      scene.environment = env;
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0.6, 8.2);
      camera.lookAt(0, 0, 0);

      // ---- materials: clay-soft charcoal plates, polished gold steel, brushed collars
      const plateMat = new THREE.MeshPhysicalMaterial({ color: '#2a2622', roughness: 0.42, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.18 });
      const rimMat = new THREE.MeshPhysicalMaterial({ color: '#c8902e', roughness: 0.25, metalness: 1, envMapIntensity: 0.8 });
      const handleMat = new THREE.MeshPhysicalMaterial({ color: '#e0ac4c', roughness: 0.32, metalness: 1, envMapIntensity: 0.7 });
      const collarMat = new THREE.MeshPhysicalMaterial({ color: '#d8d2c6', roughness: 0.3, metalness: 1, envMapIntensity: 0.9 });

      // a rounded plate: lathe a soft-edged profile around the bar axis
      const plateGeo = (radius, width) => {
        const r = 0.18; // edge rounding
        const pts = [new THREE.Vector2(0.16, -width / 2)];
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
          const a = -Math.PI / 2 + (s / steps) * (Math.PI / 2);
          pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, -width / 2 + r + Math.sin(a) * r));
        }
        for (let s = 0; s <= steps; s++) {
          const a = (s / steps) * (Math.PI / 2);
          pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, width / 2 - r + Math.sin(a) * r));
        }
        pts.push(new THREE.Vector2(0.16, width / 2));
        const g = new THREE.LatheGeometry(pts, 64);
        g.rotateZ(Math.PI / 2); // lathe runs along Y; the bar runs along X
        return g;
      };

      const bell = new THREE.Group();
      const geos = [];
      const add = (geo, mat, x) => {
        geos.push(geo);
        const m = new THREE.Mesh(geo, mat);
        m.position.x = x;
        bell.add(m);
        return m;
      };
      // handle with knurling rings
      const handle = new THREE.CylinderGeometry(0.13, 0.13, 2.2, 32);
      handle.rotateZ(Math.PI / 2);
      add(handle, handleMat, 0);
      const ring = new THREE.TorusGeometry(0.135, 0.012, 8, 32);
      ring.rotateY(Math.PI / 2);
      for (let i = -6; i <= 6; i++) add(ring, handleMat, i * 0.07);
      for (const side of [-1, 1]) {
        const collar = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 32);
        collar.rotateZ(Math.PI / 2);
        add(collar, collarMat, side * 1.04);
        add(plateGeo(0.95, 0.26), plateMat, side * 1.28);
        add(plateGeo(0.78, 0.2), plateMat, side * 1.53);
        add(plateGeo(0.6, 0.16), plateMat, side * 1.73);
        const rim = new THREE.TorusGeometry(0.93, 0.035, 12, 64);
        rim.rotateY(Math.PI / 2);
        add(rim, rimMat, side * (1.28 + side * 0.13));
        const end = new THREE.CylinderGeometry(0.17, 0.17, 0.2, 32);
        end.rotateZ(Math.PI / 2);
        add(end, collarMat, side * 1.9);
      }
      const pivot = new THREE.Group();
      pivot.add(bell);
      scene.add(pivot);

      // soft contact shadow (radial gradient texture on a floor plane)
      const sc = document.createElement('canvas');
      sc.width = sc.height = 128;
      const sctx = sc.getContext('2d');
      const grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(60,40,15,0.55)');
      grad.addColorStop(1, 'rgba(60,40,15,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(sc);
      const shadowGeo = new THREE.PlaneGeometry(5.2, 1.6);
      const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.35;
      scene.add(shadow);

      const key = new THREE.DirectionalLight('#fff1d6', 2.4);
      key.position.set(3, 5, 4);
      const rimLight = new THREE.DirectionalLight('#ffb54d', 2.2);
      rimLight.position.set(-4, 2, -3);
      scene.add(key, rimLight, new THREE.AmbientLight('#fff6e6', 0.35));

      const resize = () => {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.fov = r.width / r.height < 1.2 ? 38 : 30; // narrow boxes (phones) pull back
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      // ---- interaction: mouse lean, drag to spin with inertia
      const mouse = { x: 0, y: 0 };
      let spin = 0;
      let spinVel = 0;
      let dragging = false;
      let lastX = 0;
      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        if (dragging) {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          spinVel = dx * 0.012;
          spin += spinVel;
        }
      };
      const onDown = (e) => {
        dragging = true;
        lastX = e.clientX;
        canvas.setPointerCapture?.(e.pointerId);
        canvas.classList.add('is-grabbing');
      };
      const onUp = () => {
        dragging = false;
        canvas.classList.remove('is-grabbing');
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      canvas.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);

      let raf = null;
      let running = false;
      let rx = 0;
      let rz = 0;
      let last = performance.now();
      const start = last;
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = (now - start) / 1000;
        if (!dragging) {
          spinVel *= Math.pow(0.04, dt); // inertia that settles in about a second
          spin += spinVel;
        }
        const scroll = bus.y * 0.0016; // turns as the page scrolls past
        const idle = reduced ? 0 : t * 0.25;
        pivot.rotation.y = -0.5 + spin + scroll + idle;
        rx += ((reduced ? 0 : mouse.y * 0.25) + 0.18 - rx) * 0.06;
        rz += ((reduced ? 0 : -mouse.x * 0.18) - rz) * 0.06;
        pivot.rotation.x = rx;
        pivot.rotation.z = rz;
        const bob = reduced ? 0 : Math.sin(t * 1.4) * 0.12;
        pivot.position.y = bob;
        shadow.scale.setScalar(1 - bob * 0.6);
        shadowMat.opacity = 0.9 - bob * 1.5;
        renderer.render(scene, camera);
        canvas.classList.add('is-live');
        raf = running ? requestAnimationFrame(frame) : null;
      };
      const stopWarm = warmUp(() => {
        renderer.compile(scene, camera);
        renderer.render(scene, camera);
      });
      const stopGate = visibilityGate(canvas, (on) => {
        running = on;
        if (on && raf === null) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      });

      cleanup = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        stopWarm();
        stopGate();
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        geos.forEach((g) => g.dispose());
        [plateMat, rimMat, handleMat, collarMat, shadowMat].forEach((m) => m.dispose());
        shadowGeo.dispose();
        shadowTex.dispose();
        env.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className={`dumbbell-gl ${className}`} ref={ref} aria-label="3D dumbbell you can spin" role="img" />;
}
