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
import type { HeaderData } from './header.mjs';
import { defaultHeader } from './header.mjs';
import { Footer } from './UniversalFooter';
import { AccountMenu } from './AccountMenu';
import { StoreStudio } from './StoreStudio';
import { PublicCollectionPage } from './PublicCollectionPage';
import { marketplaceRedirect } from './marketplace-redirect.mjs';
import './styles.css';
import './catalog.css';
import './header-global.css';

type View = { kind: 'gallery' } | { kind: 'detail'; slug: string } | {kind:'collection';slug:string;productSlug?:string};
function initialView(): View {
  const collection = location.pathname.match(/^\/(apps|integrations)(?:\/([a-z0-9-]+))?\/?$/);
  if(collection)return {kind:'collection',slug:collection[1],productSlug:collection[2]};
  const match = location.pathname.match(/^\/themes\/([a-z0-9-]+)(?:\/preview)?\/?$/);
  return match ? {kind:'detail',slug:match[1]} : {kind:'gallery'};
}
function App({ themes, site, footer, header }: { themes: ThemeRecord[]; site: SiteDocument; footer: FooterData; header: HeaderData }) {
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
    const destination = new URL('/studio', window.location.origin);
    destination.searchParams.set('panel', 'install');
    destination.searchParams.set('theme_sku', theme.sku);
    destination.searchParams.set('theme_version', theme.version);
    // Keep the canonical AgentSam Sites installer INSIDE this store.
    // No site_id is inferred from browsing; explicit selection remains there.
    window.location.assign(destination.pathname + destination.search);
  };
  function navigate(next:View) {
    setView(next);setMobileMenu(false);
    const path=next.kind==='gallery'?'/':next.kind==='detail'?'/themes/'+next.slug+'/':'/'+next.slug+'/'+(next.productSlug?next.productSlug+'/':'');
    const destination=new URL(path,location.origin);
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
  const headerBrand = header.blocks.find(b=>b.type==='brand')?.settings || {};
  const headerUtility = header.blocks.find(b=>b.type==='utilities')?.settings || {};
  const headerSettings = header.section.settings;
  return <div className="app">
    <header className="site-header" style={{background:headerSettings.background,color:headerSettings.foreground,position:headerSettings.sticky?'sticky':'relative'}}>
      <div className="header-inner" style={{height:headerSettings.height}}>
        <a className="brand" href={String(headerBrand.href||'/')} onClick={e=>{if(headerBrand.href==='/'){e.preventDefault();navigate({kind:'gallery'})}}} aria-label={String(headerBrand.aria_label||'Theme Store home')}>
          {headerBrand.logo_url?<img className="header-site-logo" src={String(headerBrand.logo_url)} alt="" />:<span className="brand-monogram">{String(headerBrand.monogram||'IA')}<span className="brand-slash">/</span></span>}
          <span>{String(headerBrand.label||'THEME STORE')}</span>
        </a>
        <nav className={'top-nav '+(mobileMenu?'open':'')} aria-label="Main">
          {header.navigation.items.map(item=>item.type==='browse'
            ? <details className="browse-menu" key={item.key}>
                <summary>{item.label}<ChevronDown size={14}/></summary>
                <div className="browse-options">{categories.map(c=><button key={c} type="button" onClick={e=>{
                  setCategory(c);setMobileMenu(false);(e.currentTarget.closest('details') as HTMLDetailsElement).open=false;
                  navigate({kind:'gallery'});setTimeout(()=>document.getElementById('browse-themes')?.scrollIntoView({behavior:'smooth'}),25);
                }}>{categoryLabels[c]||c}</button>)}</div>
              </details>
            : <a key={item.key} href={item.href} target={item.type==='external'?'_blank':undefined} rel={item.type==='external'?'noreferrer':undefined}
                onClick={e=>{
                  if(item.href==='/themes/'||item.href==='/'){e.preventDefault();navigate({kind:'gallery'});}
                  if(item.href==='/#how-it-works'||item.href==='#how-it-works'||item.href==='/how-it-works/'){
                    e.preventDefault();
                    if(!isGallery)navigate({kind:'gallery'});
                    setTimeout(()=>document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'}),25);
                  }
                  setMobileMenu(false);
                }}>{item.label}{item.type==='external'&&<ExternalLink size={13}/>}</a>
          )}
        </nav>
        <div className="header-actions">
          <span className="origin-note">{headerUtility.show_globe!==false&&<Globe size={14}/>} {String(headerUtility.origin_note||'')}</span>
          <AccountMenu />
          <button aria-label="Toggle menu" className="mobile-nav-button" onClick={()=>setMobileMenu(v=>!v)}>{mobileMenu?<X size={21}/>:<Menu size={21}/>}</button>
        </div>
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
    </> : view.kind==='collection'
      ? <PublicCollectionPage slug={view.slug} productSlug={view.productSlug}
          onProduct={productSlug=>navigate({kind:'collection',slug:view.slug,productSlug:productSlug||undefined})}
          onBack={()=>navigate({kind:'gallery'})}/>
      : selected ? <ThemeExperience theme={selected} onBack={()=>navigate({kind:'gallery'})} onTry={()=>tryTheme(selected)} /> : <main className="shell no-results"><h1>Theme not found</h1><button onClick={()=>navigate({kind:'gallery'})}>Back to themes</button></main>}
    <Footer data={footer} />

  </div>;
}
/** Catalog (`/api/catalog`, generated from packages) and site copy/tokens (`/api/site`, published from the CMS). */
function Root() {
  const studioRoute = window.location.pathname === '/studio' || window.location.pathname === '/studio/';
  const [data, setData] = useState<{ themes: ThemeRecord[]; site: SiteDocument; footer: FooterData; header: HeaderData } | null>(null);
  const [error, setError] = useState(false);
  React.useEffect(() => {
    if (studioRoute) return;
    Promise.all([
      fetch('/api/catalog').then(r => r.json() as Promise<{ products?: ThemeRecord[] }>),
      fetch('/api/site').then(r => r.json() as Promise<{ site?: SiteDocument }>),
      fetch('/api/footer').then(r => r.ok ? r.json() as Promise<{ footer?: FooterData }> : { footer: defaultFooter }).catch(() => ({ footer: defaultFooter })),
      fetch('/api/header').then(r => r.ok ? r.json() as Promise<{ header?: HeaderData }> : { header: defaultHeader }).catch(() => ({ header: defaultHeader })),
    ]).then(([catalog, siteRes, footerRes, headerRes]) => {
      if (!catalog.products || !siteRes.site) throw new Error('bad payload');
      for (const [name, value] of Object.entries(siteRes.site.tokens)) document.documentElement.style.setProperty('--ts-' + name, value);
      setData({ themes: catalog.products, site: siteRes.site, footer: footerRes.footer || defaultFooter, header: headerRes.header || defaultHeader });
    }).catch(() => setError(true));
  }, [studioRoute]);
  if (studioRoute) return <StoreStudio/>;
  if (error) return <main className="shell no-results"><h1>Catalog unavailable</h1><button onClick={() => location.reload()}>Try again</button></main>;
  if (!data) return <main className="shell no-results"><p>Loading themes…</p></main>;
  return <App themes={data.themes} site={data.site} footer={data.footer} header={data.header}/>;
}
const marketplaceDestination = marketplaceRedirect(window.location.pathname);
if (marketplaceDestination) window.location.replace(marketplaceDestination);
else createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
