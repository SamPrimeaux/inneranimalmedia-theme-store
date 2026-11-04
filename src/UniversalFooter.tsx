import React from 'react';
import { ArrowUpRight, Facebook, Instagram, Youtube } from 'lucide-react';
import { FooterGLB } from './FooterGLB';
import type { FooterBlock, FooterData } from './footer.mjs';
import './footer.css';

const txt = (v:unknown) => typeof v === 'string' ? v : '';
const has = (v:unknown) => typeof v === 'string' && v.length > 0;
function children(data:FooterData,parent:string) {
  return data.blocks.filter(b=>b.parent===parent).sort((a,b)=>a.order-b.order);
}
function root(data:FooterData,type:FooterBlock['type']) {
  return data.blocks.filter(b=>b.parent===null&&b.type===type).sort((a,b)=>a.order-b.order);
}
function FooterLink({block}:{block:FooterBlock}) {
  const {label,href,icon_url} = block.settings;
  if (!has(label)) return null;
  const text = <>{has(icon_url)&&<img className="footer-link-icon" src={txt(icon_url)} alt="" loading="lazy" />}<span>{txt(label)}</span></>;
  return has(href) ? <a href={txt(href)}>{text}</a> : <span className="footer-unlinked">{text}</span>;
}
function FooterSocial({block}:{block:FooterBlock}) {
  const icon = txt(block.settings.icon);
  const label = txt(block.settings.label);
  const content = icon==='instagram' ? <Instagram size={19}/> : icon==='youtube' ? <Youtube size={19}/> : <Facebook size={19}/>;
  return has(block.settings.href)
    ? <a aria-label={label} href={txt(block.settings.href)} title={label} rel="noreferrer" target="_blank">{content}</a>
    : <span aria-label={label+' (link not connected)'} title={label+' — add your link in the CMS'}>{content}</span>;
}
export function Footer({ data }: { data:FooterData }) {
  const settings = data.section.settings;
  const cta = root(data,'cta')[0], contact=root(data,'contact')[0];
  const groups = root(data,'group'), social=root(data,'social-group')[0], utilities=root(data,'utilities')[0];
  const utilityItems = utilities ? children(data,utilities.key) : [];
  const copyright = utilityItems.find(b=>b.type==='copyright');
  const attribution = utilityItems.find(b=>b.type==='attribution');
  const policyLinks = utilityItems.filter(b=>b.type==='link');
  const css = {
    '--footer-bg':settings.background,
    '--footer-fg':settings.foreground,
    '--footer-muted':settings.muted,
    '--footer-rule':settings.divider,
    '--footer-max':settings.width,
    '--footer-glb-opacity':settings.glb_opacity
  } as React.CSSProperties;
  return <footer className="universal-footer" style={css}>
    {settings.glb_enabled&&settings.glb_url&&<FooterGLB url={settings.glb_url} tint={settings.glb_tint} animate={settings.glb_rotation}/>}
    <div className="universal-footer-inner">
      {cta&&cta.settings.enabled!==false&&<section className="footer-cta" aria-label="Next steps">
        <div><p className="footer-eyebrow">{txt(cta.settings.eyebrow)}</p><h2>{txt(cta.settings.heading)}</h2><p className="footer-cta-description">{txt(cta.settings.description)}</p></div>
        <div className="footer-cta-actions">
          {has(cta.settings.primary_href)&&has(cta.settings.primary_label)&&<a className="footer-action-primary" href={txt(cta.settings.primary_href)}>{txt(cta.settings.primary_label)} <ArrowUpRight size={17}/></a>}
          {has(cta.settings.secondary_href)&&has(cta.settings.secondary_label)&&<a className="footer-action-secondary" href={txt(cta.settings.secondary_href)}>{txt(cta.settings.secondary_label)}</a>}
        </div>
      </section>}
      <div className="footer-main">
        {contact&&<section className="footer-contact" aria-label="Contact">
          <div className="footer-identity">
            {has(contact.settings.logo_url)&&<img src={txt(contact.settings.logo_url)} alt={txt(contact.settings.logo_alt)} loading="lazy"/>}
            {has(contact.settings.brand_label)&&<span>{txt(contact.settings.brand_label)}</span>}
          </div>
          <h2>{txt(contact.settings.heading)}</h2>
          {has(contact.settings.description)&&<p className="footer-intro">{txt(contact.settings.description)}</p>}
          <div className="footer-contact-links">
            {has(contact.settings.email)&&<a href={'mailto:'+txt(contact.settings.email)}>{txt(contact.settings.email)}</a>}
            {has(contact.settings.phone)&&has(contact.settings.phone_href)&&<a href={txt(contact.settings.phone_href)}>{txt(contact.settings.phone)}</a>}
          </div>
        </section>}
        <div className="footer-navigation" aria-label="Footer navigation">
          {groups.map(group=><nav key={group.key} className="footer-link-group" aria-label={txt(group.settings.heading)}>
            <h3>{txt(group.settings.heading)}</h3>
            <ul>{children(data,group.key).filter(b=>b.type==='link').map(link=><li key={link.key}><FooterLink block={link}/></li>)}</ul>
          </nav>)}
          {social&&<div className="footer-social-group"><h3>{txt(social.settings.heading)}</h3>
            <div className="footer-social-icons">{children(data,social.key).filter(b=>b.type==='social-link').map(link=><FooterSocial key={link.key} block={link}/>)}</div>
          </div>}
        </div>
      </div>
      <div className="footer-utilities">
        <div className="footer-utility-links">
          {copyright&&<span>{txt(copyright.settings.text).replaceAll('{year}',String(new Date().getFullYear()))}</span>}
          {policyLinks.length>0&&<nav aria-label="Legal and policies">{policyLinks.map(link=><FooterLink key={link.key} block={link}/>)}</nav>}
        </div>
        {attribution&&<div className="footer-attribution">
          <span>{txt(attribution.settings.label)}</span>
          {has(attribution.settings.logo_url)&&(has(attribution.settings.href)
            ? <a href={txt(attribution.settings.href)} aria-label={txt(attribution.settings.logo_alt)}><img src={txt(attribution.settings.logo_url)} alt={txt(attribution.settings.logo_alt)} loading="lazy"/></a>
            : <img src={txt(attribution.settings.logo_url)} alt={txt(attribution.settings.logo_alt)} loading="lazy"/>)}
        </div>}
      </div>
    </div>
  </footer>;
}
