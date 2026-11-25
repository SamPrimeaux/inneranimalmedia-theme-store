// Public commerce membership and release approval come from D1, not the build inventory.
// legacy_product_id is the pre-consolidation compatibility link; no legacy table is queried.
const SLUG=/^[a-z][a-z0-9-]{0,63}$/;
const VERSION=/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const HASH=/^[a-f0-9]{64}$/;
export async function loadThemeCatalog(db, packageDescriptors=[]) {
  if(!db)throw Error('theme_catalog_database_unavailable');
  const {results}=await db.prepare(`
    SELECT p.id,p.slug,p.title,p.description,p.image_url,p.price_cents,
      r.id AS release_id,r.sku,r.version,r.r2_key,r.sha256,r.compatible_schema_version
    FROM products p JOIN cms_sites s ON s.id=p.site_id
    LEFT JOIN agentsam_product_releases r ON r.product_slug=p.slug
      AND (r.product_id=CAST(p.id AS TEXT) OR r.product_id=p.legacy_product_id)
      AND r.artifact_kind='theme_zip' AND r.channel='release'
      AND r.release_status='published' AND r.review_status='approved' AND r.r2_bucket='theme-store'
    WHERE s.id=? AND s.status='active' AND p.status='active' AND p.product_kind='theme'
    ORDER BY p.title,p.id,r.published_at_unix DESC,r.created_at_unix DESC,r.id DESC
  `).bind('theme-store').all();
  const records=new Map(), releases=[];
  for(const row of results){
    if(!SLUG.test(row.slug)||typeof row.title!=='string'||!row.title.trim()||!Number.isSafeInteger(row.price_cents)||row.price_cents<0)continue;
    const approved=VERSION.test(row.version||'')&&HASH.test(row.sha256||'')&&row.compatible_schema_version==='2'&&
      typeof row.sku==='string'&&row.sku.length>0&&row.r2_key==='releases/'+row.slug+'/'+row.version+'/'+row.sha256+'.zip';
    if(approved)releases.push({slug:row.slug,version:row.version,sha256:row.sha256});
    if(records.has(row.id))continue;
    // Package-owned technical descriptors can enrich an exact release only.
    // They can never add a listing or override a database product or release.
    const d=approved?packageDescriptors.find(t=>t.slug===row.slug&&t.version===row.version&&t.release?.sha256===row.sha256):undefined;
    const image=typeof row.image_url==='string'&&(/^https:\/\/[^\s<>"']+$/.test(row.image_url)||/^\/(?!\/)[^\s<>"']+$/.test(row.image_url))?row.image_url:'';
    records.set(row.id,{
      slug:row.slug,sku:approved?row.sku:'',name:row.title,summary:row.description||'',
      category:d?.category||'Uncategorized',tags:d?.tags||[],pages:d?.pages||[],industries:d?.industries||[],
      features:d?.features||[],catalogSizes:d?.catalogSizes||[],colorway:d?.colorway||'paper',
      version:approved?row.version:'',publisher:d?.publisher||'',priceUsd:row.price_cents/100,
      cardImage:image,sortOrder:records.size,previewBuild:d?.previewBuild||'package',minCmsSchema:'2',
      ...(d?.previewAlias?{previewAlias:d.previewAlias}:{}),
      release:approved?{status:'published',sha256:row.sha256,storageKey:row.r2_key}:{status:'preview',sha256:null,storageKey:null}
    });
  }
  return {themes:[...records.values()],releases};
}
