import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Source-backed decorative GLB, with proper visibility and disposal lifecycle. */
export function mountOwnerFooterGlb(canvas, modelUrl) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('A canvas is required');
  const parent = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38,1,.1,200);
  const hemi = new THREE.HemisphereLight(0xffffff,0x576c68,2.0);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff,2.5);
  key.position.set(5,7,7);
  scene.add(key);
  let model=null,raf=0,visible=false,disposed=false,last=0;
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function resize() {
    const w=parent.clientWidth,h=parent.clientHeight;
    if (!w||!h) return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    if (model) {
      const bounds = new THREE.Box3().setFromObject(model);
      const size=bounds.getSize(new THREE.Vector3());
      const distance=(Math.max(size.x/camera.aspect,size.y)/2)/Math.tan(camera.fov*Math.PI/360);
      camera.position.set(0,0,distance*1.5+size.z);
      camera.lookAt(0,0,0);
    }
    renderer.render(scene,camera);
  }
  function frame(now) {
    raf=0;
    if (!visible||disposed||document.hidden) return;
    if(model&&!reduced) {
      model.rotation.y+=Math.min(.05,(now-last)/1000*.12);
      renderer.render(scene,camera);
    }
    last=now;
    if(!reduced) raf=requestAnimationFrame(frame);
  }
  const observer=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if(visible && !raf) {last=performance.now();raf=requestAnimationFrame(frame);}
  },{rootMargin:'180px'});
  const ro=new ResizeObserver(resize);
  ro.observe(parent);
  observer.observe(parent);
  new GLTFLoader().load(modelUrl, gltf=>{
    if(disposed) return;
    model=gltf.scene;
    const box=new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(model);
    resize();
  },undefined,error=>console.error('[Revise] Footer GLB:',error));
  return () => {
    disposed=true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    observer.disconnect();
    scene.traverse(obj=>{
      obj.geometry?.dispose?.();
      if(obj.material) (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>m.dispose());
    });
    renderer.dispose();
  };
}
