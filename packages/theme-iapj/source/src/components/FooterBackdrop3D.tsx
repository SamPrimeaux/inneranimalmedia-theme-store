import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function detectOpposingFooterDarkMode(): boolean {
  if (typeof document === "undefined") return true;
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return false; // Dark page -> Light footer -> Dark GLB
  if (explicit === "light") return true; // Light page -> Dark footer -> Light GLB
  const osDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return !osDark;
}

export function FooterBackdrop3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement("canvas").getContext("webgl2");
        if (!probe) return true;
        const ext = probe.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 11.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0xdbe0ff, 0x1e1e26, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(-5, 6, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb9afff, 1.35);
    rimLight.position.set(6, -3, 4);
    scene.add(rimLight);

    // Composite multi-part procedural sculptural GLB-equivalent group
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(-2.3, -0.3, 0);
    scene.add(sculptureGroup);

    const primaryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdce0ec,
      roughness: 0.34,
      metalness: 0.26,
      clearcoat: 0.55,
      clearcoatRoughness: 0.25,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xb8acff),
    });

    const secondaryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc5c9d8,
      roughness: 0.58,
      metalness: 0.14,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
    });

    const accentMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9d86e9,
      roughness: 0.28,
      metalness: 0.45,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    });

    // Part 1: Sweeping main organic ribbon (TubeGeometry)
    const curveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6.2, -3.4, -1.6),
      new THREE.Vector3(-3.0, -0.8, 1.2),
      new THREE.Vector3(-0.8, 2.3, -0.5),
      new THREE.Vector3(2.4, 3.6, -2.0),
      new THREE.Vector3(5.6, 1.2, -3.2),
    ]);
    const geoA = new THREE.TubeGeometry(curveA, 96, 1.05, 28, false);
    const meshA = new THREE.Mesh(geoA, primaryMaterial);
    sculptureGroup.add(meshA);

    // Part 2: Intertwined counter-sweeping ribbon
    const curveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.8, 2.4, -2.2),
      new THREE.Vector3(-2.6, 0.2, 0.2),
      new THREE.Vector3(-0.6, -2.8, 1.4),
      new THREE.Vector3(3.2, -3.2, -1.0),
    ]);
    const geoB = new THREE.TubeGeometry(curveB, 84, 0.82, 24, false);
    const meshB = new THREE.Mesh(geoB, secondaryMaterial);
    sculptureGroup.add(meshB);

    // Part 3: Sculpted architectural torus-knot core
    const geoC = new THREE.TorusKnotGeometry(2.15, 0.48, 128, 24, 2, 3);
    const meshC = new THREE.Mesh(geoC, primaryMaterial);
    meshC.position.set(-1.1, -0.5, -1.4);
    meshC.rotation.set(0.5, 0.3, -0.4);
    sculptureGroup.add(meshC);

    // Part 4: Slender accent orbital arc
    const curveD = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, -1.2, 1.8),
      new THREE.Vector3(-1.4, 1.5, 1.6),
      new THREE.Vector3(1.8, 0.4, 0.4),
      new THREE.Vector3(4.2, -2.4, -1.6),
    ]);
    const geoD = new THREE.TubeGeometry(curveD, 72, 0.22, 16, false);
    const meshD = new THREE.Mesh(geoD, accentMaterial);
    sculptureGroup.add(meshD);

    // Apply opposing color-tone palette (Dark footer -> Light GLB | Light footer -> Dark GLB)
    const applyOpposingTone = () => {
      const isDarkFooter = detectOpposingFooterDarkMode();
      if (isDarkFooter) {
        // Dark Footer Canvas -> Light Satin Silver / Luminous Alabaster GLB
        primaryMaterial.color.setHex(0xe1e4f0);
        primaryMaterial.roughness = 0.32;
        primaryMaterial.metalness = 0.24;
        primaryMaterial.sheenColor.setHex(0xc4b5fd);

        secondaryMaterial.color.setHex(0xc2c7d8);
        secondaryMaterial.roughness = 0.54;
        secondaryMaterial.metalness = 0.16;

        accentMaterial.color.setHex(0xb39df5);
        accentMaterial.roughness = 0.26;

        keyLight.intensity = 1.75;
        rimLight.color.setHex(0xc8baff);
        rimLight.intensity = 1.3;
        hemiLight.intensity = 0.95;
      } else {
        // Light Footer Canvas -> Deep Obsidian / Graphite Charcoal GLB
        primaryMaterial.color.setHex(0x1b1b22);
        primaryMaterial.roughness = 0.36;
        primaryMaterial.metalness = 0.34;
        primaryMaterial.sheenColor.setHex(0x52487a);

        secondaryMaterial.color.setHex(0x2d2d37);
        secondaryMaterial.roughness = 0.56;
        secondaryMaterial.metalness = 0.2;

        accentMaterial.color.setHex(0x4b3d85);
        accentMaterial.roughness = 0.28;

        keyLight.intensity = 2.0;
        rimLight.color.setHex(0x8c7ae6);
        rimLight.intensity = 1.15;
        hemiLight.intensity = 0.75;
      }
    };

    applyOpposingTone();

    const observer = new MutationObserver(applyOpposingTone);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    mediaQuery?.addEventListener("change", applyOpposingTone);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1200;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Pre-allocated animation state (zero GC in loop)
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== "function") {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        sculptureGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.18;
        sculptureGroup.rotation.x = Math.cos(elapsed * 0.12) * 0.08;
        meshC.rotation.z = -0.4 + elapsed * 0.05;
      }

      renderer.render(scene, camera);

      if (prefersReducedMotion) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      mediaQuery?.removeEventListener("change", applyOpposingTone);
      resizeObserver.disconnect();
      geoA.dispose();
      geoB.dispose();
      geoC.dispose();
      geoD.dispose();
      primaryMaterial.dispose();
      secondaryMaterial.dispose();
      accentMaterial.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-45"
    />
  );
}
