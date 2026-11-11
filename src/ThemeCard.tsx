import React from 'react';
import { Eye } from 'lucide-react';
import type { ThemeRecord } from './catalog';

export function ThemeCard({ theme, onExplore, onAdd }: {
  theme: ThemeRecord;
  onExplore: () => void;
  onAdd: () => void;
}) {
  return <article className="theme-card">
    <button type="button" className={'theme-art '+theme.colorway} onClick={onExplore} aria-label={'Preview '+theme.name}>
      <div className="theme-art-image" style={{backgroundImage:'url('+theme.cardImage+')'}} />
      <span className="art-fallback" aria-hidden="true"><span>{theme.name.toUpperCase()}</span><strong>{theme.summary.split(' ').slice(0,4).join(' ')}</strong></span>
      <span className="art-preview"><Eye size={16}/> Preview</span>
    </button>
    <div className="card-bottom">
      <div className="card-names"><h3>{theme.iconUrl&&<img className="theme-card-icon" src={theme.iconUrl} alt="" loading="lazy"/>}{theme.name}</h3><p>by {theme.publisher}</p></div>
      <button type="button" className="card-add" onClick={onAdd} aria-label={(theme.installUrl?'Add ':'Preview ')+theme.name}>{theme.installUrl?'Add':'Preview'}</button>
    </div>
  </article>;
}
