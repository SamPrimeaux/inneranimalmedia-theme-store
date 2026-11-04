import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Maximize2, Minimize2, Monitor, Smartphone, Check, Layers } from 'lucide-react';
import type { ThemeRecord } from './catalog';
import './theme-experience.css';

type Device = 'desktop' | 'mobile';
const devices: Device[] = ['desktop', 'mobile'];
export function ThemeExperience({ theme, onBack, onTry }: {
  theme: ThemeRecord;
  onBack: () => void;
  onTry: () => void;
}) {
  const stage = useRef<HTMLElement>(null);
  const starting = new URLSearchParams(location.search);
  const [device, setDevice] = useState<Device>(starting.get('device') === 'mobile' ? 'mobile' : 'desktop');
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const ready = theme.downloadReady === true && theme.release.status === 'published';
  useEffect(() => {
    const sync = () => setExpanded(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useEffect(() => { setLoaded(false); setPreviewError(false); }, [theme.slug, theme.version]);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('device', device);
    url.searchParams.set('expanded', expanded ? '1' : '0');
    history.replaceState(history.state, '', url);
  }, [device, expanded]);
  const fullscreen = () => {
    if (document.fullscreenElement === stage.current) void document.exitFullscreen();
    else void stage.current?.requestFullscreen();
  };
  const price = theme.priceUsd === 0 ? 'Free' : theme.priceUsd != null ? '$' + theme.priceUsd.toFixed(2) : null;
  const canDemo = !!theme.previewUrl;
  return <main className="experience-detail">
    <section ref={stage} className="experience-stage" aria-label={theme.name + ' interactive preview'}>
      <div className="experience-toolbar">
        <button className="experience-back" onClick={() => expanded ? fullscreen() : onBack()} aria-label="Back to themes"><ArrowLeft size={20}/></button>
        <div className="experience-device-switch" aria-label="Preview device">
          {devices.map(d => <button type="button" key={d} aria-label={d + ' preview'} aria-pressed={device === d} className={device === d ? 'active' : ''} onClick={() => setDevice(d)}>
            {d === 'desktop' ? <Monitor size={18}/> : <Smartphone size={18}/>}
          </button>)}
        </div>
        <div className="experience-toolbar-actions">
          <button type="button" onClick={fullscreen} aria-label={expanded ? 'Exit fullscreen' : 'Expand preview'} title={expanded ? 'Exit fullscreen' : 'Expand preview'}>{expanded ? <Minimize2 size={19}/> : <Maximize2 size={19}/>}</button>
          {ready && <button className="experience-toolbar-try" onClick={onTry}>Try theme <ArrowRight size={15}/></button>}
        </div>
      </div>
      <div className={'experience-frame-outer ' + device}>
        <div className="experience-frame">
          {canDemo ? <>
            {!loaded && !previewError && <div className="experience-loading" aria-live="polite">Opening the live demo…</div>}
            <iframe src={theme.previewUrl!} onLoad={() => setLoaded(true)} onError={() => setPreviewError(true)} title={theme.name + ' live demo'} loading="eager" referrerPolicy="no-referrer-when-downgrade"/>
          </> : <div className="experience-loading" role="alert">This demo is unavailable.</div>}
        </div>
      </div>
      <div className="experience-action-bar">
        <div className="experience-product-identity">
          <strong>{theme.name}</strong>{price && <span>{price}</span>}
        </div>
        <div className="experience-action-buttons">
          {canDemo && <a href={theme.previewUrl!} rel="noopener noreferrer" target="_blank" className="experience-demo-button">View demo <ExternalLink size={15}/></a>}
          {ready && <button className="experience-try-button" onClick={onTry}>Try theme <ArrowRight size={15}/></button>}
        </div>
      </div>
    </section>
    <div className="experience-content">
      <nav className="experience-content-nav" aria-label="Product sections">
        <strong>{theme.name}</strong><div><a href="#overview">Overview</a><a href="#features">Features</a><a href="#included">Included</a></div>
      </nav>
      <section className="experience-overview" id="overview">
        <div><p className="experience-kicker">Website theme / {theme.category}</p><h1>{theme.name}</h1><p className="experience-subtitle">{theme.summary}</p></div>
        <div className="experience-overview-side"><span>Designed by {theme.publisher}</span><span>{price}</span></div>
      </section>
      <section className="experience-features" id="features">
        <div><p className="experience-kicker">The experience</p><h2>{theme.editorial?.headline || 'Make it yours.'}</h2><p>{theme.editorial?.body || theme.summary}</p></div>
        <div className="experience-feature-grid">
          {(theme.editorial?.notes?.length ? theme.editorial.notes : ['Edit the real layouts and content you see in the preview.', 'Adapt the typography, spacing, colors and media to your brand.', 'Build on a versioned starter while keeping your own draft independent.']).map((note, index) =>
            <article key={index}><span>0{index + 1}</span><p>{note}</p></article>)}
        </div>
      </section>
      <section className="experience-included" id="included">
        <div><p className="experience-kicker">Inside the package</p><h2>Explore every page.</h2><p>Preview the page types and navigation before adding a copy to your site.</p></div>
        <div className="experience-page-grid">{theme.pages.map(page => <span key={page}><Layers size={16}/>{page}</span>)}</div>
      </section>
      <div className="experience-bottom-cta">
        <strong>{theme.name}</strong>{price && <span>{price}</span>}
        {canDemo && <a href={theme.previewUrl!} target="_blank" rel="noopener noreferrer">View demo <ExternalLink size={15}/></a>}
        {ready && <button onClick={onTry}>Try theme <ArrowRight size={15}/></button>}
      </div>
    </div>
  </main>;
}
