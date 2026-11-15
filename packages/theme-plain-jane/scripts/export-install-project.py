#!/usr/bin/env python3
"""Compile IAPJ's authored React experience into AgentSam's real editable project.

The authoritative source and distributable artifact live in this Theme Store.
The section extraction and renderer contract come from the SDK, not a fork of
its visual editor. This is a release-time authoring step, not a runtime dependency.

Usage:
  python3 packages/theme-plain-jane/scripts/export-install-project.py \
    --contract /path/to/agentsam-sdk/apps/ecommerce-cms-agentsam/frontend/theme-editor/project.mjs

Requires `pip install playwright` and `python -m playwright install chromium`.
"""
import argparse
import hashlib
import http.server
import json
import os
from pathlib import Path
import re
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
CANONICAL = 'https://themes.inneranimalmedia.com/iapj/'
ORIGINAL = '/themes/plain-jane/demo/'

class SiteServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)
    def do_GET(self):
        route = self.path.split('?', 1)[0]
        if not route.startswith(ORIGINAL):
            return self.send_error(404, 'invalid_source_route')
        relative = route[len(ORIGINAL):]
        self.path = relative if relative and (SITE / relative).is_file() else 'index.html'
        return super().do_GET()
    def log_message(self, *args):
        pass

def export(contract: Path):
    if not (SITE / 'index.html').exists():
        raise RuntimeError('IAPJ authored production site is missing')
    if not contract.is_file():
        raise RuntimeError('The canonical AgentSam theme-editor project.mjs contract is required')
    source = contract.read_text(encoding='utf-8')
    if "agentsam.theme-project.v1" not in source or 'function extractThemePage' not in source or 'function renderThemePage' not in source:
        raise RuntimeError('Unsupported version of the AgentSam theme-project contract')
    # Load the same editor implementation that will edit this output. This
    # prevents an independent, drifting HTML-to-CMS implementation here.
    runtime = re.sub(r'^export\s+', '', source, flags=re.MULTILINE)
    manifest = json.loads((SITE / 'iapj-cms-manifest.json').read_text())
    package = json.loads((ROOT / 'package.json').read_text())
    if manifest['theme'] != 'plain-jane' or manifest['sourceTheme'] != 'iapj' or len(manifest['pages']) != 31:
        raise RuntimeError('unexpected IAPJ source manifest; do not create a partial release')
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), SiteServer)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    pages = []
    evidence = []
    base = f'http://127.0.0.1:{server.server_address[1]}' + ORIGINAL
    try:
        with sync_playwright() as browser_engine:
            try:
                browser = browser_engine.chromium.launch(headless=True, args=['--no-sandbox'])
            except Exception:
                # Developer Macs commonly have Chrome but no Playwright cache.
                browser = browser_engine.chromium.launch(channel='chrome', headless=True, args=['--no-sandbox'])
            tab = browser.new_page(viewport={'width': 1440, 'height': 900})
            errors = []
            tab.on('pageerror', lambda error: errors.append(str(error)))
            for entry in manifest['pages']:
                route = entry['path'].strip('/')
                url = base + (route + '/' if route else '')
                errors.clear()
                response = tab.goto(url, wait_until='load', timeout=20000)
                tab.wait_for_timeout(80)
                if not response or response.status != 200 or errors:
                    raise RuntimeError(f'render failed for {entry["slug"]}: {errors[:2]}')
                html = tab.content()
                # The source app is React. Keeping its hydration script inside
                # a CMS snapshot would erase user edits after each navigation.
                tab.evaluate("() => document.querySelectorAll('script').forEach(node => node.remove())")
                # Source links must navigate the recipient's own site, not
                # return them to the provider's /iapj/ preview. Static CSS,
                # fonts and bundled image URLs remain immutable CDN assets.
                tab.evaluate("""(prefix) => {
                  for (const link of document.querySelectorAll('a[href]')) {
                    const raw=link.getAttribute('href');
                    if (raw === prefix.slice(0,-1)) link.setAttribute('href','/');
                    else if(raw && raw.startsWith(prefix))
                      link.setAttribute('href','/' + raw.slice(prefix.length));
                  }
                }""", ORIGINAL)
                html = tab.content().replace(ORIGINAL, CANONICAL)
                # Presets remain templates. Their links resolve inside an
                # installed site, not back into the provider's public demo.
                tab.add_script_tag(content=runtime)
                out = tab.evaluate('''([html,slug,title,base]) => {
                  const page = extractThemePage(html,{slug,title,baseUrl:base});
                  const actual = renderThemePage(page,{}, {baseUrl:base});
                  if(!actual.includes('<!DOCTYPE html>'))throw Error('cms_page_render_failed');
                  return {page,renderedLength:actual.length};
                }''', [html, entry['slug'], entry['title'], CANONICAL])
                page = out['page']
                # Editor navigation maps the same authored route as a user
                # published site. No shared Theme Store link is baked in.
                page['route'] = '/' + (route + '/' if route else '')
                page['sourceRoute'] = route
                page['sourceOrigin'] = 'authored-iapj-react-render'
                if not page['sections'] or not any(s['schema'].get('fields') or s['schema'].get('blocks') for s in page['sections']):
                    raise RuntimeError('noneditable_source_page:' + entry['slug'])
                if not any(s.get('zone') == 'HEADER' for s in page['sections']):
                    raise RuntimeError('missing_source_header:' + entry['slug'])
                pages.append(page)
                evidence.append({'slug': entry['slug'], 'route': route,
                    'sections': len(page['sections']),
                    'fields': sum(len(s['schema'].get('fields', [])) for s in page['sections']),
                    'blocks': sum(len(s['schema'].get('blocks', [])) for s in page['sections'])})
            browser.close()
    finally:
        server.shutdown()
    project = {
        'schema': 'agentsam.theme-project.v1',
        'id': 'theme_plain-jane',
        'name': 'InnerAnimal Plain Jane',
        'version': '0.1.0',
        'revision': 0,
        'sourceThemeId': 'plain-jane',
        'sourcePackage': '@inneranimalmedia/theme-plain-jane',
        'sourcePackageVersion': package['version'],
        'sourcePreviewUrl': CANONICAL,
        # Immutable ZIP digest is independently filled by the release script;
        # this detached install project is NOT included in the release ZIP.
        'sourceReleaseSha256': '0' * 64,
        'sourceCmsManifestSchema': 'agentsam.cms-source-manifest.v1',
        'sourceManifestPageCount': len(manifest['pages']),
        'sourceRoutesNotRendered': [],
        'sourcePagesDetected': len(manifest['pages']),
        'sourceAssetErrors': [],
        'tokens': {},
        'pages': pages,
    }
    data = json.dumps(project, ensure_ascii=False, separators=(',', ':')) + '\n'
    if len(data.encode()) > 8 * 1024 * 1024:
        raise RuntimeError('CMS project exceeds the 8MB authenticated save limit')
    if len(pages) != 31:
        raise RuntimeError('not all authored routes became editable pages')
    (ROOT / 'install-project.json').write_text(data)
    print(json.dumps({'pages': len(pages), 'sections': sum(x['sections'] for x in evidence),
        'fields': sum(x['fields'] for x in evidence), 'bytes': len(data.encode()),
        'sha256': hashlib.sha256(data.encode()).hexdigest(),
        'sourceEditorContract': str(contract), 'evidence': evidence}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--contract', type=Path, required=True)
    args = parser.parse_args()
    export(args.contract)
