import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, LayoutTemplate, RefreshCw } from 'lucide-react';
import type { AccountState } from './AccountMenu';
import './store-studio.css';

type Panel = 'pages' | 'globals' | 'install';
const panelFromUrl = (): Panel => {
  const raw = new URLSearchParams(window.location.search).get('panel');
  return raw === 'install' || raw === 'globals' ? raw : 'pages';
};
function installerDestination() {
  const params=new URLSearchParams(window.location.search);
  const sku=params.get('theme_sku')||'';
  const version=params.get('theme_version')||'';
  // The release and CMS ownership are verified by AgentSam after selection.
  // This is navigation, not a write or an implicit site selection.
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(sku) || !/^[0-9]+[.][0-9]+[.][0-9]+$/.test(version)) return null;
  const target=new URL('/sites','https://agentsam.inneranimalmedia.com');
  target.searchParams.set('theme_sku',sku);
  target.searchParams.set('theme_version',version);
  target.searchParams.set('action','try');
  return target.href;
}

/**
 * Store-local, owner-gated host of the EXISTING AgentSam site-owned CMS editor.
 * No parallel editor, store-specific mutation API, or public-content fixture.
 * The iframe remains authenticated by the canonical AgentSam origin.
 */
export function StoreStudio() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [panel, setPanel] = useState<Panel>(panelFromUrl);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/account/me', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async r => r.ok ? await r.json() as AccountState : { authenticated: false })
      .then(value => { if (!controller.signal.aborted) setAccount(value as AccountState); })
      .catch(() => { if (!controller.signal.aborted) setAccount({ authenticated: false }); });
    return () => controller.abort();
  }, []);
  const editor = account?.authenticated && account.editor?.site_id === 'theme-store' ? account.editor : null;
  const installing=panel==='install';
  const installUrl=installing?installerDestination():null;
  const url = installing ? installUrl || '' : editor ? (panel === 'pages' ? editor.pages_href : editor.globals_href) : '';
  function select(next: Panel) {
    setPanel(next);
    setLoading(true);
    const search = new URLSearchParams({ panel: next });
    history.replaceState(history.state, '', '/studio?' + search);
  }
  return <div className="store-studio">
    <header className="store-studio-header">
      <a className="store-studio-back" href="/"><ArrowLeft size={16}/> Theme Store</a>
      <div><strong>{installing?'Start a theme draft':'Site Studio'}</strong><span>{installing?'Choose a site · Customize · Publish when ready':'Theme Store · Published CMS'}</span></div>
      <div className="store-studio-actions">
        <a href="/" target="_blank" rel="noreferrer"><ExternalLink size={15}/> View store</a>
        <button type="button" disabled={!url} onClick={() => { setLoading(true); setReload(x=>x+1); }}><RefreshCw size={16}/> Refresh editor</button>
      </div>
    </header>
    {installing && !installUrl ? <main className="store-studio-gate"><h1>Choose a published theme first</h1><p>Open a theme in this store to start an authorized draft.</p><a href="/">Browse themes</a></main>
      : installing ? <div className="store-studio-body">
          <nav className="store-studio-rail" aria-label="Theme installation">
            <a href="/" className="store-studio-rail-link">Browse another theme</a>
            <p>This is AgentSam's existing site and theme installer. Select a site explicitly before a private draft is created. Your published site remains unchanged.</p>
          </nav>
          <div className="store-studio-frame">
            {loading && <div className="store-studio-loading" role="status">Opening theme installer…</div>}
            <iframe key={'install-'+reload} src={url} title="AgentSam verified theme installation and site selection" onLoad={()=>setLoading(false)}
              referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        </div>
      : account === null ? <main className="store-studio-gate" role="status">Checking your CMS permissions…</main>
      : !account.authenticated ? <main className="store-studio-gate">
          <h1>Sign in to edit this site</h1>
          <p>The public theme catalog stays available. Editing requires your existing InnerAnimalMedia account and site permissions.</p>
          <a href="https://agentsam.inneranimalmedia.com/auth/login">Sign in with InnerAnimalMedia</a>
        </main>
      : !editor ? <main className="store-studio-gate">
          <h1>Theme Store editing isn't authorized</h1>
          <p>Your account is signed in, but AgentSam has not confirmed editable ownership of this CMS site. No content has changed.</p>
          <a href="/">Back to store</a>
        </main>
      : <div className="store-studio-body">
          <nav className="store-studio-rail" aria-label="Site editing areas">
            <button aria-current={panel==='pages'?'page':undefined} onClick={()=>select('pages')}><FileText size={16}/> Pages and templates</button>
            <button aria-current={panel==='globals'?'page':undefined} onClick={()=>select('globals')}><LayoutTemplate size={16}/> Header, logo and navigation</button>
            <p>Save and publish from the real CMS editor. Preview this store to verify your changes.</p>
          </nav>
          <div className="store-studio-frame">
            {loading&&<div className="store-studio-loading" role="status">Opening CMS editor…</div>}
            <iframe key={panel + '-' + reload} src={url} title="Site-owned Theme Store CMS editor" onLoad={()=>setLoading(false)}
              referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        </div>}
  </div>;
}
