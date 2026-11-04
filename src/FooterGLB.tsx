import React, { useEffect, useRef } from 'react';

export function FooterGLB({ url, tint, animate }: { url:string; tint:string; animate:boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    let removed = false;
    let cleanup = () => {};
    let observer: IntersectionObserver | undefined;
    const start = async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        if (removed || !canvas.isConnected) return;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'low-power' });
        renderer.setClearColor(0,0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
        const scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff,1.3));
        const key = new THREE.DirectionalLight(0xffffff,1.0);
        key.position.set(3,5,4); scene.add(key);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0,0,7);
        let frame = 0;
        let visible = true;
        let model: import('three').Group | undefined;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const resize = () => {
          const rect = canvas.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          renderer.setSize(rect.width,rect.height,false);
          camera.aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
          if (model) renderer.render(scene,camera);
        };
        const measure = new ResizeObserver(resize);
        measure.observe(canvas);
        resize();
        const color = new THREE.Color(tint);
        const loader = new GLTFLoader();
        loader.load(url, gltf => {
          if (removed) return;
          model = gltf.scene;
          model.traverse(node => {
            if (node instanceof THREE.Mesh) {
              node.material = new THREE.MeshStandardMaterial({ color, metalness:0.12, roughness:0.8, transparent:true, opacity:0.92 });
            }
          });
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const scale = 4.0 / Math.max(size.x,size.y,size.z,0.1);
          model.scale.setScalar(scale);
          bounds.setFromObject(model);
          model.position.sub(bounds.getCenter(new THREE.Vector3()));
          model.position.y -= 0.2;
          scene.add(model);
          const render = () => {
            if (removed || !model) return;
            if (visible) {
              if (animate && !reduced) model.rotation.y += 0.0016;
              renderer.render(scene,camera);
            }
            if (animate && !reduced) frame = requestAnimationFrame(render);
          };
          render();
        }, undefined, () => { /* Keep the footer readable without WebGL. */ });
        const visibility = new IntersectionObserver(entries => { visible = !!entries[0]?.isIntersecting; if (visible && model && (!animate || reduced)) renderer.render(scene,camera); },{threshold:0});
        visibility.observe(canvas);
        cleanup = () => {
          cancelAnimationFrame(frame);
          visibility.disconnect(); measure.disconnect();
          model?.traverse(node => {
            if (node instanceof THREE.Mesh) {
              node.geometry?.dispose();
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach(material=>material?.dispose());
            }
          });
          renderer.dispose();
        };
      } catch {
        // WebGL is progressive enhancement; the semantic footer still works.
      }
    };
    observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) { observer?.disconnect(); observer=undefined; void start(); }
    },{rootMargin:'240px'});
    observer.observe(canvas);
    return () => { removed=true; observer?.disconnect(); cleanup(); };
  }, [url,tint,animate]);
  return <canvas className="footer-glb-canvas" ref={canvasRef} aria-hidden="true" />;
}
