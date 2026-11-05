import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, ChevronDown, ExternalLink, Globe, Menu, Search, X } from 'lucide-react';
import type { ThemeRecord } from './catalog';
import { availableFilters, filterThemes } from './filter-themes.mjs';
import { CatalogFilters, type FilterName, type FilterSelection } from './CatalogFilters';
import { ThemeCard } from './ThemeCard';
import { ThemeExperience } from './ThemeExperience';
import type { SiteDocument } from './site.mjs';
import type { FooterData } from './footer.mjs';
import { defaultFooter } from './footer.mjs';
import { Footer } from './UniversalFooter';
import './styles.css';
import './catalog.css';

type View = { kind: 'gallery' } | { kind: 'detail'; slug: string };
function initialView(): View {
  const match = location.pathname.match(/^\/themes\/([a-z0-9-]+)(?:\/preview)?\/?$/);
  return match ? {kind:'detail',slug:match[1]} : {kind:'gallery'};
}
function App({ themes, site, footer }: { themes: ThemeRecord[]; site: SiteDocument; footer: FooterData }) {
  const categoryLabels = site.categoryLabels;
  const categories = useMemo(() => ['All themes', ...Array.from(new Set(themes.map((theme) => theme.category)))], [themes]);
  const [view,setView] = useState<View>(initialView);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All themes');
  const [selection,setSelection] = useState<FilterSelection>({prices:[],industries:[],catalogSizes:[],features:[]});
  const [sort,setSort] = useState('featured');
  const facets = useMemo(()=>availableFilters(themes),[themes]);
  const toggleFilter = (name:FilterName,value:string) => setSelection(prev=>({
    ...prev,[name]:prev[name].includes(value)?prev[name].filter(x=>x!==value):[...prev[name],value],
  }));
  const clearFilters = () => {
    setQuery('');setCategory('All themes');setSort('featured');
    setSelection({prices:[],industries:[],catalogSizes:[],features:[]});
  };
  const [mobileMenu,setMobileMenu] = useState(false);
  const preferredSiteId = useRef(new URLSearchParams(window.location.search).get('site_id'));
  const filtered = useMemo(()=>filterThemes(themes.filter(t=>category==='All themes'||t.category===category),{
    query, ...selection, sort,
  }),[themes,category,query,selection,sort]);
  const selected = view.kind === 'detail' ? themes.find(t=>t.slug===view.slug) : undefined;
  const tryTheme = (theme:ThemeRecord) => {
    if (!theme.downloadReady || theme.release.status !== 'published') return;
    const destination = new URL('/sites', 'https://agentsam.inneranimalmedia.com');
    destination.searchParams.set('theme_sku', theme.sku);
    destination.searchParams.set('theme_version', theme.version);
    destination.searchParams.set('action', 'try');
    // Public Try always creates or resumes a private draft. A site selected
    // for browsing is never permission to alter that website.
    window.location.assign(destination.href);
  };
  function navigate(next:View) {
    setView(next);setMobileMenu(false);
    const destination=new URL(next.kind==='gallery'?'/':'/themes/'+next.slug+'/',location.origin);
    if(preferredSiteId.current)destination.searchParams.set('site_id',preferredSiteId.current);
    history.pushState({},'',destination.pathname+destination.search);
    window.scrollTo({top:0,behavior:'instant'});
  }
  React.useEffect(()=>{
    const handler=()=>{setView(initialView())};
    window.addEventListener('popstate',handler);
    return()=>window.removeEventListener('popstate',handler);
  },[]);
  React.useEffect(()=>{document.title=selected?selected.name+' — InnerAnimalMedia Themes':'Themes — InnerAnimalMedia'},[selected]);
  const isGallery = view.kind==='gallery';
  return <div className="app">
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/" onClick={e=>{e.preventDefault();navigate({kind:'gallery'})}} aria-label={site.brand.ariaLabel}>
          <span className="brand-monogram">{site.brand.monogram}<span className="brand-slash">/</span></span><span>{site.brand.label}</span>
        </a>
        <nav className={'top-nav '+(mobileMenu?'open':'')} aria-label="Main">
          <details className="browse-menu">
            <summary>{site.library.browseLabel}<ChevronDown size={14}/></summary>
            <div className="browse-options">{categories.map(c=><button key={c} type="button" onClick={e=>{
              setCategory(c);setMobileMenu(false);(e.currentTarget.closest('details') as HTMLDetailsElement).open=false;
              navigate({kind:'gallery'});
              setTimeout(()=>document.getElementById('browse-themes')?.scrollIntoView({behavior:'smooth'}),25);
            }}>{categoryLabels[c]||c}</button>)}</div>
          </details>
          <a href="#how-it-works" onClick={e=>{if(!isGallery){e.preventDefault();navigate({kind:'gallery'});setTimeout(()=>document.getElementById('how-it-works')?.scrollIntoView(),10)}}}>{site.nav.howItWorks}</a>
          <a href={site.nav.sitesHref} target="_blank" rel="noreferrer">{site.nav.sitesLabel} <ExternalLink size={13}/></a>
        </nav>
        <div className="header-actions"><span className="origin-note"><Globe size={14}/> {site.nav.originNote}</span><button aria-label="Toggle menu" className="mobile-nav-button" onClick={()=>setMobileMenu(v=>!v)}>{mobileMenu?<X size={21}/>:<Menu size={21}/>}</button></div>
      </div>
    </header>

    {isGallery ? <>
      <section className="hero shell">
        <div className="eyebrow">{site.hero.eyebrow}</div>
        <div className="hero-grid"><div><h1>{site.hero.headlineLead} <em>{site.hero.headlineEm}</em></h1></div><p>{site.hero.body}</p></div>
        <div className="hero-meta">{site.hero.points.map(point=><span key={point}><Check size={15}/> {point}</span>)}</div>
      </section>
      <main className="shell">
        <div className="catalog-bar" id="browse-themes">
          <div><div className="eyebrow muted">{site.library.eyebrow}</div><h2>{site.library.title}</h2></div>
          <div className="catalog-filters">
            <label className="search-field"><Search size={18}/><span className="sr-only">Search themes</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search themes" /></label>
            <label className="select-field"><span className="sr-only">Sort themes</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="featured">Featured</option><option value="name">Name A–Z</option>
                <option value="price-ascending">Price: low to high</option>
              </select><ChevronDown size={15}/></label>
          </div>
        </div>
        <div className="catalog-layout">
          <CatalogFilters facets={facets} selection={selection} onToggle={toggleFilter}
            onClear={clearFilters} labels={site.library.filters}/>
          <div className="catalog-results">
            <div className="result-count">{filtered.length} {filtered.length===1?'theme':'themes'}</div>
            <div className="theme-grid">
              {filtered.map(t=><ThemeCard key={t.slug} theme={t}
                onExplore={()=>navigate({kind:'detail',slug:t.slug})}
                onAdd={()=>t.downloadReady?tryTheme(t):navigate({kind:'detail',slug:t.slug})}/>)}
            </div>
            {!filtered.length&&<div className="no-results"><h3>No themes found</h3><p>Try a different filter.</p>
              <button className="secondary-button" onClick={clearFilters}>Clear filters</button></div>}
          </div>
        </div>
        <section className="how-it-works" id="how-it-works"><div><div className="eyebrow">{site.howItWorks.eyebrow}</div><h2>{site.howItWorks.title}</h2><p>{site.howItWorks.body}</p></div>
          <div className="steps">{site.howItWorks.steps.map((step,i)=><div key={step.title}><b>{String(i+1).padStart(2,'0')}</b><h3>{step.title}</h3><p>{step.body}</p></div>)}</div>
        </section>
      </main>
    </> : selected ? <ThemeExperience theme={selected} onBack={()=>navigate({kind:'gallery'})} onTry={()=>tryTheme(selected)} /> : <main className="shell no-results"><h1>Theme not found</h1><button onClick={()=>navigate({kind:'gallery'})}>Back to themes</button></main>}
    <Footer data={footer} />

  </div>;
}
/** Catalog (`/api/catalog`, generated from packages) and site copy/tokens (`/api/site`, published from the CMS). */
function Root() {
  const [data, setData] = useState<{ themes: ThemeRecord[]; site: SiteDocument; footer: FooterData } | null>(null);
  const [error, setError] = useState(false);
  React.useEffect(() => {
    Promise.all([
      fetch('/api/catalog').then(r => r.json() as Promise<{ products?: ThemeRecord[] }>),
      fetch('/api/site').then(r => r.json() as Promise<{ site?: SiteDocument }>),
      fetch('/api/footer').then(r => r.ok ? r.json() as Promise<{ footer?: FooterData }> : { footer: defaultFooter }).catch(() => ({ footer: defaultFooter })),
    ]).then(([catalog, siteRes, footerRes]) => {
      if (!catalog.products || !siteRes.site) throw new Error('bad payload');
      for (const [name, value] of Object.entries(siteRes.site.tokens)) document.documentElement.style.setProperty('--ts-' + name, value);
      setData({ themes: catalog.products, site: siteRes.site, footer: footerRes.footer || defaultFooter });
    }).catch(() => setError(true));
  }, []);
  if (error) return <main className="shell no-results"><h1>Catalog unavailable</h1><button onClick={() => location.reload()}>Try again</button></main>;
  if (!data) return <main className="shell no-results"><p>Loading themes…</p></main>;
  return <App themes={data.themes} site={data.site} footer={data.footer}/>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
