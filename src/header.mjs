import defaults from './header.default.json' with { type:'json' };
const HEX=/^#[a-fA-F0-9]{6}$/;
const SAFE=/^(?:https:\/\/[^\s"'<>]+|\/[^\s"'<>]*|#[a-zA-Z0-9_-]+|mailto:[^\s"'<>@]+@[^\s"'<>@]+)$/;
const IMG=/^https:\/\/[^\s"'<>]+$/;
const STR=/^[a-z0-9][a-z0-9_-]{0,95}$/;
const value=(input,fallback='',limit=200)=>typeof input==='string'&&input.length<=limit?input.trim():fallback;
export function normalizeHeader(input){
  if(!input||typeof input!=='object'||input.schema!==defaults.schema)return structuredClone(defaults);
  const section=input.section?.settings||{};
  const base=defaults.section.settings;
  const settings={
    background:HEX.test(section.background)?section.background:base.background,
    foreground:HEX.test(section.foreground)?section.foreground:base.foreground,
    height:Number.isInteger(section.height)&&section.height>=50&&section.height<=115?section.height:base.height,
    sticky:typeof section.sticky==='boolean'?section.sticky:base.sticky
  };
  const defs={
    brand:['monogram','label','logo_url','aria_label','href'],
    navigation:['menu_name','browse_key'],
    utilities:['origin_note','show_globe']
  };
  const source=Array.isArray(input.blocks)?input.blocks:defaults.blocks;
  const blocks=[];const seen=new Set();
  for(const x of source.slice(0,20)){
    if(!x||!STR.test(x.key)||!defs[x.type]||seen.has(x.key))continue;
    seen.add(x.key);
    const fields={};
    for(const key of defs[x.type]){
      const fallback=defaults.blocks.find(b=>b.type===x.type)?.settings[key]??'';
      const v=x.settings?.[key];
      if(key==='show_globe') fields[key]=typeof v==='boolean'?v:fallback;
      else if(key==='href')fields[key]=typeof v==='string'&&(v===''||SAFE.test(v))?v:fallback;
      else if(key==='logo_url') fields[key]=typeof v==='string'&&(v===''||IMG.test(v))?v:fallback;
      else if(key==='menu_name'||key==='browse_key')fields[key]=typeof v==='string'&&STR.test(v)?v:fallback;
      else fields[key]=value(v,fallback,250);
    }
    blocks.push({key:x.key,type:x.type,order:Number.isInteger(x.order)?Math.min(10000,Math.max(0,x.order)):100,settings:fields});
  }
  const menu=input.navigation||{};
  const items=[];const unique=new Set();
  for(const item of (Array.isArray(menu.items)?menu.items:defaults.navigation.items).slice(0,32)){
    const label=value(item?.label,'',120);const href=value(item?.href,'',600);
    const derivedKey=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const key=value(item?.key,derivedKey,90);
    if(!STR.test(key)||!label||!SAFE.test(href)||unique.has(key))continue;
    unique.add(key);
    const inferredType=href==='https://agentsam.inneranimalmedia.com/sites'?'external':key==='browse-themes'?'browse':'link';
    const type=['browse','link','external'].includes(item.type)?item.type:inferredType;
    items.push({key,label,href,type});
  }
  return {schema:defaults.schema,section:{id:defaults.section.id,type:'global-header',settings},blocks,navigation:{menu_name:value(menu.menu_name,'main',90),items}};
}
export function headerFromCmsRows(section,blocks,menu){
  if(section?.section_type!=='global-header')throw new Error('global-header CMS section missing');
  if(!menu||menu.is_active!==1)throw new Error('active main menu missing');
  const navigation=JSON.parse(menu.menu_items||'[]');
  if(!Array.isArray(navigation)||!navigation.length)throw new Error('main menu has no links');
  return normalizeHeader({
    schema:defaults.schema,
    section:{settings:JSON.parse(section.section_data||'{}')},
    blocks:blocks.map(b=>({key:b.block_key,type:b.block_type,order:b.sort_order,settings:JSON.parse(b.settings_json||'{}')})),
    navigation:{menu_name:menu.menu_name,items:navigation.map((item,i)=>({
      key:item.key,
      label:item.label,
      href:item.href,
      type:item.type
    }))}
  });
}
export const defaultHeader=normalizeHeader(defaults);
