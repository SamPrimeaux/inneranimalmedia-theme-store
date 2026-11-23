/* Revise owner scene experience. Stock theme does not bundle or mount this module. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const resource = file => new URL(file, import.meta.url).href;
export async function mountOwnerWorld(root) {
  if (!root) throw new Error('Owner world stage missing');
  let worldDispose = null;
  let circuitDispose = null;
  let footerDispose = null;
  let circuitObserver = null;
  let disposed = false;
  const cleanup = () => {
    disposed = true;
    circuitObserver?.disconnect();
    circuitDispose?.();
    footerDispose?.();
    worldDispose?.();
  };
  try {
    const response = await fetch(resource('scene-manifest.json'), {cache:'no-store'});
    if (!response.ok) throw new Error('Scene manifest HTTP ' + response.status);
    const manifest = await response.json();
    if (manifest.schema !== 'revise.owner-scene-pack.v1' || manifest.scenes.length !== 11) throw new Error('Scene pack manifest does not match source');
    if (disposed) return cleanup;
    root.innerHTML = `<div class="rr-world-environment" aria-hidden="true"><canvas id="world" data-revise-world-canvas></canvas></div><div class="rr-world-chapters">
    ${manifest.scenes.map((ch,i) => `<section class="rr-world-chapter${i%2?' rr-world-chapter--right':''}" data-scene="${i}" aria-labelledby="rr-world-title-${i}"><div class="rr-world-chapter__content"><span class="rr-kicker">${String(i+1).padStart(2,'0')} / ${manifest.scenes.length} · ${esc(ch.id)}</span><h2 id="rr-world-title-${i}">${esc(ch.heading)}</h2><p>${esc(ch.description)}</p></div><span class="rr-world-chapter__number">CAMERA ${String(i+1).padStart(2,'0')}</span></section>`).join('')}
    <section id="original-circuit-stage" class="rr-world-circuit" tabindex="0" aria-label="Interactive original circuit scene" data-state="idle"><div class="rr-world-circuit__copy"><span class="rr-kicker">NATIVE / IAM SCENE</span><h2>Interact with the original.</h2><p>Source model, authored behavior and runtime rendering—not a screenshot of the scene.</p><span>HOVER OR TAP TO EXPLORE ↗</span></div><div id="original-circuit-canvas" class="rr-world-circuit__canvas"></div><p id="original-circuit-error" role="alert" hidden></p></section>
    <section class="rr-world-footer"><canvas data-owner-footer-glb class="rr-world-footer__canvas" aria-hidden="true"></canvas><div class="rr-world-footer__copy"><span class="rr-kicker">13 / SOURCE GLB</span><h2>Motion with a purpose.</h2><p>A real model rendered and composed on demand, without copying an entire world into every storefront.</p></div></section>
    <section class="rr-world-outro"><span class="rr-kicker">BUILT FROM SOURCE</span><h2>One creative world.<br>Many ways to see it.</h2><p>The eleven camera positions, native scene, and footer GLB are independently registered. This owner profile is not part of the stock storefront distribution.</p><a href="${location.pathname.split('/pages/')[0]}/" data-link class="rr-button rr-button--dark">Return to Revise ↗</a></section></div>`;
    const worldModule = await import(resource('revise-world-runtime.mjs'));
    if (disposed) return cleanup;
    worldDispose = worldModule.mountReviseWorld(root, {sceneBase:resource('./')});
    const glbCanvas = root.querySelector('[data-owner-footer-glb]');
    import(resource('revise-footer-runtime.mjs')).then(module => { if(!disposed) footerDispose = module.mountOwnerFooterGlb(glbCanvas,resource('glb/inneranimalmediafooterglb.glb')); }).catch(error => console.error('[Revise] Footer scene:',error));
    const circuit = root.querySelector('#original-circuit-stage');
    const activateCircuit = async () => {
      if (disposed || !circuit) return;
      try {
        const module = await import(resource('revise-circuit-runtime.mjs'));
        if (disposed) return;
        circuitDispose = module.mountReviseCircuit(circuit, resource('./'));
      } catch (error) {
        const message = circuit.querySelector('#original-circuit-error');
        if (message) { message.hidden=false; message.textContent='The native scene could not be loaded.'; }
        console.error('[Revise] Source scene failed to load', error);
      }
    };
    if ('IntersectionObserver' in window) {
      circuitObserver = new IntersectionObserver(entries => {
        if (entries.some(entry=>entry.isIntersecting)) { circuitObserver.disconnect(); activateCircuit(); }
      }, {rootMargin:'220px'});
      circuitObserver.observe(circuit);
    } else activateCircuit();
  } catch (error) {
    console.error('[Revise owner world]', error);
    if (!disposed) root.innerHTML = '<section class="rr-world-error"><h1>Scene collection unavailable.</h1><p>The owner scene pack must be installed from its authoritative source before this experience can render.</p></section>';
  }
  return cleanup;
}
