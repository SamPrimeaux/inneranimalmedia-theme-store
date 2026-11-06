import React, {useEffect,useState} from 'react';
import {ArrowLeft, ArrowUpRight, Images, PackageSearch} from 'lucide-react';
import './public-collections.css';
type Media={asset_id:string;url:string;alt:string};
type Product={id:string;slug:string;name:string;kind:string;summary:string;icon_url:string|null;cover_url:string|null;gallery:Media[];product_status:string;sort_order:number};
type Data={schema:string;site_id:string;collection:{slug:string;name:string;description:string;thumbnail_url:string|null};items:Product[]};
export function PublicCollectionPage({slug,productSlug,onProduct,onBack}:{slug:string;productSlug?:string;onProduct:(slug:string)=>void;onBack:()=>void}){
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  setData(null);setError(false);
  fetch('/api/collections/'+encodeURIComponent(slug),{signal:controller.signal})
   .then(async r=>{if(!r.ok)throw new Error('not published');return (await r.json()) as Data})
   .then(doc=>{if(!controller.signal.aborted)setData(doc)})
   .catch(()=>{if(!controller.signal.aborted)setError(true)});
  return()=>controller.abort();
 },[slug]);
 const product=data?.items.find(item=>item.slug===productSlug);
 if(!data&&!error)return <main className="public-collection-state shell"><p>Loading collection…</p></main>;
 if(error)return <main className="public-collection-state shell"><PackageSearch size={26}/><h1>This collection isn't published.</h1><p>Only approved public products are visible in the store.</p><button className="secondary-button" onClick={onBack}>Explore themes</button></main>;
 if(productSlug && !product)return <main className="public-collection-state shell"><h1>Product isn't published.</h1><p>No public listing is available under that address.</p><button className="secondary-button" onClick={()=>onProduct('')}>Back to collection</button></main>;
 if(product)return <main className="public-product-detail shell">
    <button className="public-collection-back" onClick={()=>onProduct('')}><ArrowLeft size={16}/> {data!.collection.name}</button>
    <div className="public-product-heading">
      {product.icon_url&&<img className="public-product-icon" src={product.icon_url} alt="" />}
      <div><p className="public-product-kicker">{data!.collection.name} / {product.kind}</p><h1>{product.name}</h1><p>{product.summary}</p></div>
    </div>
    {!!product.gallery.length&&<section className="public-product-media" aria-label={product.name+' gallery'}>
      <h2>Product gallery</h2><div>{product.gallery.map((asset,i)=><a key={asset.asset_id} href={asset.url} target="_blank" rel="noopener noreferrer" aria-label={'View image '+(i+1)}><img src={asset.url} alt={asset.alt||product.name} loading="lazy"/></a>)}</div>
    </section>}
    <p className="public-product-availability">This listing describes the product. Installation is offered only when a compatible, verified release is available.</p>
   </main>;
 return <main className="public-collection shell">
   <div className="public-collection-heading"><p className="eyebrow">Apps & extensions</p><h1>{data!.collection.name}</h1><p>{data!.collection.description || 'Explore published capabilities and integrations.'}</p></div>
   {data!.items.length?<div className="public-collection-grid">{data!.items.map(item=><a href={'/'+slug+'/'+item.slug+'/'} key={item.id} onClick={e=>{e.preventDefault();onProduct(item.slug)}}>
    <div className="public-collection-image">{item.cover_url?<img src={item.cover_url} alt={item.name} loading="lazy"/>:<Images size={28}/>}</div>
    <div className="public-collection-item"><strong>{item.icon_url&&<img src={item.icon_url} alt=""/>}{item.name}</strong><p>{item.summary}</p><span>View details <ArrowUpRight size={14}/></span></div>
   </a>)}</div>:<div className="public-collection-empty">
    <PackageSearch size={25}/><h2>No public releases yet</h2>
    <p>Existing app and integration projects remain private until their descriptions, media, permissions, and installable releases have been verified. Nothing is being listed here as installable prematurely.</p>
    <button className="secondary-button" onClick={onBack}>Explore published themes</button>
   </div>}
  </main>;
}
