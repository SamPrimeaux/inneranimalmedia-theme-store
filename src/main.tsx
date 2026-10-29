import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink, Eye, Filter, Globe, Menu, Monitor, Search, ShieldCheck, Smartphone, Tablet, X } from 'lucide-react';
import { themes, type ThemeRecord } from './catalog';
import './styles.css';

type Device = 'desktop' | 'tablet' | 'mobile';
type View = { kind: 'gallery' } | { kind: 'detail'; slug: string };
const categories = ['All themes', ...Array.from(new Set(themes.map((theme) => theme.category)))];
const categoryLabels: Record<string, string> = { All: 'All themes', Commerce: 'Commerce / fashion', Nonprofit: 'Nonprofit & campaigns', Editorial: 'Editorial / journal' };
const cardImage = (slug: string) => '/previews/' + slug + '.webp';
function initialView(): View {
  const match = location.pathname.match(/^\/themes\/([a-z0-9-]+)\/?$/);
  return match ? {kind:'detail',slug:match[1]} : {kind:'gallery'};
}
function App() {
  const [view,setView] = useState<View>(initialView);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All themes');
  const [mobileMenu,setMobileMenu] = useState(false);
  const [device,setDevice] = useState<Device>('desktop');
  const [installOpen,setInstallOpen] = useState(false);
  const [expanded,setExpanded] = useState(false);
  const filtered = useMemo(() => themes.filter(t => (category==='All themes'||t.category===category) &&
    [t.name,t.summary,t.category,...t.tags].join(' ').toLowerCase().includes(query.toLowerCase())),[category,query]);
  const selected = view.kind === 'detail' ? themes.find(t=>t.slug===view.slug) : undefined;
  function navigate(next:View) {
    setView(next);setInstallOpen(false);setDevice('desktop');setMobileMenu(false);
    history.pushState({},'',next.kind==='gallery'?'/':'/themes/'+next.slug+'/');
    window.scrollTo({top:0,behavior:'instant'});
  }
  React.useEffect(()=>{
    const handler=()=>{setView(initialView());setInstallOpen(false)};
    window.addEventListener('popstate',handler);
    return()=>window.removeEventListener('popstate',handler);
  },[]);
  React.useEffect(()=>{document.title=selected?selected.name+' — InnerAnimalMedia Themes':'Themes — InnerAnimalMedia'},[selected]);
  const isGallery = view.kind==='gallery';
  return <div className="app">
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/" onClick={e=>{e.preventDefault();navigate({kind:'gallery'})}} aria-label="InnerAnimalMedia Themes home">
          <span className="brand-monogram">IA<span className="brand-slash">/</span></span><span>THEME STORE</span>
        </a>
        <nav className={'top-nav '+(mobileMenu?'open':'')} aria-label="Main">
          <a href="/" onClick={e=>{e.preventDefault();navigate({kind:'gallery'})}}>Discover</a>
          <a href="#how-it-works" onClick={e=>{if(!isGallery){e.preventDefault();navigate({kind:'gallery'});setTimeout(()=>document.getElementById('how-it-works')?.scrollIntoView(),10)}}}>How it works</a>
          <a href="https://agentsam.inneranimalmedia.com/sites" target="_blank" rel="noreferrer">AgentSam Sites <ExternalLink size={13}/></a>
        </nav>
        <div className="header-actions"><span className="origin-note"><Globe size={14}/> Built for your CMS</span><button aria-label="Toggle menu" className="mobile-nav-button" onClick={()=>setMobileMenu(v=>!v)}>{mobileMenu?<X size={21}/>:<Menu size={21}/>}</button></div>
      </div>
    </header>

    {isGallery ? <>
      <section className="hero shell">
        <div className="eyebrow">InnerAnimalMedia / design systems</div>
        <div className="hero-grid"><div><h1>Find the right <em>starting point.</em></h1></div><p>Real, responsive website experiences built to become your own. Explore the design first; add it to AgentSam only when it feels right.</p></div>
        <div className="hero-meta"><span><Check size={15}/> Original theme designs</span><span><Check size={15}/> Editable CMS v2 direction</span><span><Check size={15}/> Preview before install</span></div>
      </section>
      <main className="shell">
        <div className="catalog-bar"><div><div className="eyebrow muted">Curated library</div><h2>Browse themes <span className="count">{filtered.length}</span></h2></div>
          <div className="catalog-filters"><label className="search-field"><Search size={18}/><span className="sr-only">Search themes</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search themes" /></label>
            <label className="select-field"><Filter size={17}/><span className="sr-only">Filter by category</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{categoryLabels[c]||c}</option>)}</select><ChevronDown size={15}/></label>
          </div>
        </div>
        <div className="theme-grid">
          {filtered.map(t=><article key={t.slug} className="theme-card">
            <button className={'theme-art '+t.colorway} onClick={()=>navigate({kind:'detail',slug:t.slug})} aria-label={'Preview '+t.name}>
              <div className="theme-art-image" style={{backgroundImage:'url('+cardImage(t.slug)+')'}}/>
              <span className="art-fallback" aria-hidden="true"><span>{t.name.toUpperCase()}</span><strong>{t.summary.split(' ').slice(0,4).join(' ')}</strong></span>
              <span className="art-preview"><Eye size={16}/> Preview theme</span>
            </button>
            <div className="card-bottom"><div className="card-names"><span className="theme-category">{t.category}</span><h3>{t.name}</h3><p>{t.summary}</p><div className="tags">{t.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div></div>
              <button className="square-arrow" aria-label={'View '+t.name} onClick={()=>navigate({kind:'detail',slug:t.slug})}><ArrowRight size={19}/></button>
            </div>
          </article>)}
        </div>
        {!filtered.length&&<div className="no-results"><h3>No themes found</h3><p>Try a different keyword or category.</p><button className="secondary-button" onClick={()=>{setQuery('');setCategory('All themes')}}>Clear filters</button></div>}
        <section className="how-it-works" id="how-it-works"><div><div className="eyebrow">Designed to get out of your way</div><h2>Choose. Add. Make it yours.</h2><p>Theme Store holds the products. AgentSam holds your site and its drafts. A theme can change completely without its original product package being overwritten.</p></div>
          <div className="steps"><div><b>01</b><h3>Explore</h3><p>Browse the themes and inspect a responsive preview.</p></div><div><b>02</b><h3>Add to drafts</h3><p>Install a private, editable copy into your authorized AgentSam site.</p></div><div><b>03</b><h3>Customize</h3><p>Edit sections, tokens, forms and content in the real CMS v2 editor.</p></div></div>
        </section>
      </main>
    </> : selected ? <main className="detail-shell">
      <div className="shell breadcrumb"><button onClick={()=>navigate({kind:'gallery'})}><ArrowLeft size={16}/> All themes</button><span>/</span><span>{selected.category}</span><span>/</span><b>{selected.name}</b></div>
      <div className="shell detail-header"><div><div className="eyebrow">{selected.category} / Original design</div><h1>{selected.name}<span className="version">v{selected.version}</span></h1><p>{selected.summary}</p><div className="detail-features">{selected.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
        <div className="header-cta"><button className="light-button" onClick={()=>document.getElementById('live-preview')?.scrollIntoView({behavior:'smooth'})}><Eye size={17}/> View demo</button><button className="primary-button" onClick={()=>setInstallOpen(true)}>Add to AgentSam <ArrowRight size={17}/></button></div></div>
      <section className="preview-surface" id="live-preview"><div className="preview-controls"><div className="preview-title"><span className="live-indicator"/><b>{selected.name} preview</b><span>Responsive storefront</span></div><div className="device-group" aria-label="Device size">{([['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]] as const).map(([d,Icon])=><button key={d} className={device===d?'active':''} aria-label={d+' preview'} aria-pressed={device===d} onClick={()=>setDevice(d)}><Icon size={17}/></button>)}</div><div className="view-actions"><button className="secondary-button" onClick={()=>setExpanded(v=>!v)}>{expanded?'Standard view':'Expand preview'}</button>{selected.demoUrl&&<a href={selected.demoUrl} target="_blank" rel="noreferrer" className="secondary-button" aria-label="Open original live demo"><ExternalLink size={16}/></a>}</div></div>
      <div className={'preview-stage '+(expanded?'wide':'')}><div className={'preview-browser '+device}><div className="browser-bar"><span/><span/><span/><small>{selected.demoUrl??'Preview not yet hosted'}</small></div>{selected.demoUrl?
        <iframe title={selected.name+' live interactive theme demo'} src={selected.demoUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>:
        <div className={'preview-missing '+selected.colorway}><h2>{selected.name}</h2><p>Interactive demo is being prepared. The package is available in the catalog for inspection.</p></div>
      }</div></div></section>
      <section className="shell included"><div><div className="eyebrow">Inside the theme</div><h2>Ready to make your own.</h2><p>Includes the starter layout and interaction patterns shown in the demo. Connecting content and installing to a site are separate actions.</p></div><div className="included-content"><h3>Page templates</h3><div className="page-tags">{selected.pages.map(p=><span key={p}><Check size={14}/>{p}</span>)}</div><div className="compat-note"><ShieldCheck size={20}/><div><b>CMS v2 target</b><span>Theme Store supplies the release. AgentSam handles site permissions, draft creation and editing.</span></div></div></div></section>
      <div className="sticky-detail-cta"><div><strong>{selected.name}</strong><span>by {selected.publisher}</span></div><div><button className="light-button" onClick={()=>document.getElementById('live-preview')?.scrollIntoView({behavior:'smooth'})}>View demo</button><button className="primary-button" onClick={()=>setInstallOpen(true)}>Add theme <ArrowRight size={16}/></button></div></div>
    </main> : <main className="shell no-results"><h1>Theme not found</h1><button onClick={()=>navigate({kind:'gallery'})}>Back to themes</button></main>}
    <footer className="site-footer"><div className="shell"><div><span className="brand-monogram">IA<span className="brand-slash">/</span></span><p>Original, adaptable website starting points.<br/>Made for the InnerAnimalMedia ecosystem.</p></div><span>© {new Date().getFullYear()} InnerAnimalMedia · Theme Store</span></div></footer>
    {installOpen&&selected&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)setInstallOpen(false)}}>
      <div className="install-modal" role="dialog" aria-modal="true" aria-labelledby="add-title"><div className="modal-heading"><div><div className="eyebrow">Private installation</div><h2 id="add-title">Add {selected.name} to AgentSam</h2></div><button className="icon-button" onClick={()=>setInstallOpen(false)} aria-label="Close"><X size={18}/></button></div><p>The next step is to select an authorized site in AgentSam. Installation creates a separate draft; it does not publish or replace your current theme.</p><div className="install-summary"><b>{selected.name} · v{selected.version}</b><span>{selected.pages.length} starter page layouts · CMS v2 target</span></div><p className="boundary-note">The site-scoped installation handoff is not connected yet. This action opens the existing AgentSam Sites workspace for setup and does not claim to install or save a draft.</p><a className="primary-button full" href={'https://agentsam.inneranimalmedia.com/sites?theme_sku='+encodeURIComponent(selected.sku)+'&theme_version='+encodeURIComponent(selected.version)} target="_blank" rel="noreferrer">Continue to AgentSam Sites <ExternalLink size={16}/></a><button className="secondary-button full" onClick={()=>setInstallOpen(false)}>Keep browsing</button></div>
    </div>}
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
