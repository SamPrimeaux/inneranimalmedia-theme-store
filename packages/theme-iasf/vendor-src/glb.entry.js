import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight,
  Color, MeshStandardMaterial, Mesh, Box3, Vector3
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Vanilla port of the Theme Store's FooterGLB: progressive, lazy, WebGL-optional.
 * mount(canvas, { url, tint, opacity, rotation, animate }) -> { destroy }
 */
function mount(canvas, opts) {
  const o = Object.assign({ url: '', tint: '#ffffff', opacity: 0.92, rotation: 0.0016, animate: true }, opts || {});
  if (!canvas || !o.url) return { destroy() {} };
  let removed = false, frame = 0, visible = true, model, renderer, io, ro;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) { return { destroy() {} }; }
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 1.3));
  const key = new DirectionalLight(0xffffff, 1.0); key.position.set(3, 5, 4); scene.add(key);
  const camera = new PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 0, 7);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spin = o.animate && !reduced;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    if (model) renderer.render(scene, camera);
  };
  ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const color = new Color(o.tint);
  new GLTFLoader().load(o.url, (gltf) => {
    if (removed) return;
    model = gltf.scene;
    model.traverse((n) => {
      if (n instanceof Mesh) n.material = new MeshStandardMaterial({ color, metalness: 0.12, roughness: 0.8, transparent: true, opacity: o.opacity });
    });
    const b = new Box3().setFromObject(model);
    const s = b.getSize(new Vector3());
    model.scale.setScalar(4.0 / Math.max(s.x, s.y, s.z, 0.1));
    b.setFromObject(model);
    model.position.sub(b.getCenter(new Vector3()));
    model.position.y -= 0.2;
    scene.add(model);
    canvas.setAttribute('data-ready', 'true');
    const tick = () => {
      if (removed || !model) return;
      if (visible) { if (spin) model.rotation.y += o.rotation; renderer.render(scene, camera); }
      if (spin) frame = requestAnimationFrame(tick);
    };
    tick();
  }, undefined, () => { /* footer stays readable without the model */ });
  io = new IntersectionObserver((e) => { visible = !!(e[0] && e[0].isIntersecting); if (visible && model && !spin) renderer.render(scene, camera); });
  io.observe(canvas);
  return {
    destroy() {
      removed = true; cancelAnimationFrame(frame); io && io.disconnect(); ro && ro.disconnect();
      model && model.traverse((n) => { if (n instanceof Mesh) { n.geometry && n.geometry.dispose(); n.material && n.material.dispose(); } });
      renderer && renderer.dispose();
    }
  };
}
window.IasfGLB = { mount };
