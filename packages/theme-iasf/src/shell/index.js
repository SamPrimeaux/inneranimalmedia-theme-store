export { shellDefaults, shellSchema, mergeShellConfig, runtimeConfig, SHELL_VERSION } from './config.js';
export { renderHeader, esc } from './header.js';
export { renderFooter } from './footer.js';
export { renderSignature } from './signature.js';

import { runtimeConfig, shellDefaults } from './config.js';

/** Runtime script order matters: core → toast → pack → header → footer → loader. */
export const RUNTIME_SCRIPTS = Object.freeze(['core', 'toast', 'pack', 'header', 'footer', 'loader']);

/** JSON the browser runtime reads. `<` is escaped so config text can never close the tag. */
export function renderRuntimeConfig(config = shellDefaults) {
  const json = JSON.stringify(runtimeConfig(config)).replace(/</g, '\\u003c');
  return '<script type="application/json" id="iasf-config">' + json + '</script>';
}

/**
 * Tiny inline head script: marks the page "loading" before first paint so the
 * globe loader never flashes content, and always releases after maxMs even if
 * the runtime fails to load (never a stuck blank page).
 */
export function renderLoaderGate(loader = shellDefaults.loader) {
  if (!loader?.enabled || loader.mode === 'off') return '';
  const max = Math.max(1500, Number(loader.maxMs) || 6000) + 1000;
  const always = loader.mode === 'always';
  return (
    '<script>(function(){try{var d=document.documentElement;' +
    (always ? '' : "if(sessionStorage.getItem('iasf:loaded'))return;") +
    "d.classList.add('iasf-loading');setTimeout(function(){d.classList.remove('iasf-loading')}," + max + ');}catch(e){}})();</script>'
  );
}
