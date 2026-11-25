import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { loadThemeCatalog } from '../src/db-catalog.mjs';

function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(`
 CREATE TABLE cms_sites(id TEXT,status TEXT);
 CREATE TABLE products(id INTEGER,slug TEXT,title TEXT,description TEXT,image_url TEXT,price_cents INTEGER,site_id TEXT,status TEXT,product_kind TEXT,legacy_product_id TEXT);
 CREATE TABLE agentsam_product_releases(id TEXT,product_id TEXT,product_slug TEXT,sku TEXT,version TEXT,r2_key TEXT,sha256 TEXT,compatible_schema_version TEXT,artifact_kind TEXT,channel TEXT,release_status TEXT,review_status TEXT,r2_bucket TEXT,published_at_unix INTEGER,created_at_unix INTEGER);
 INSERT INTO cms_sites VALUES('theme-store','active'),('app-store','active');
 INSERT INTO products VALUES(1,'alpha','Database name','Database copy','/alpha.webp',100,'theme-store','active','theme','old-alpha'),
 (2,'draft','Draft','',NULL,0,'theme-store','draft','theme','old-draft'),
 (3,'foreign','Foreign','',NULL,0,'app-store','active','theme','old-foreign'),
 (4,'new','New theme','',NULL,0,'theme-store','active','theme',NULL);
 `);
 const insert=sql.prepare("INSERT INTO agentsam_product_releases VALUES(?,?,?,?,?,?,?,'2','theme_zip','release',?,?,'theme-store',?,?)");
 const add=(id,product,slug,version,hash,state,review,t)=>insert.run(id,product,slug,'iam.theme.'+slug,version,'releases/'+slug+'/'+version+'/'+hash+'.zip',hash,state,review,t,t);
 add('r1','old-alpha','alpha','1.0.0','a'.repeat(64),'published','approved',1);
 add('r2','old-alpha','alpha','2.0.0','b'.repeat(64),'published','approved',2);
 add('r3','old-alpha','alpha','3.0.0','c'.repeat(64),'published','unreviewed',3);
 add('r4','4','new','1.0.0','d'.repeat(64),'published','approved',4);
 const db={prepare(q){const st=sql.prepare(q);return {bind(...args){return {async all(){return {results:st.all(...args)}}}}}}};
 return {sql,db};
}
test('D1 decides publication, price, copy and approved artifact identity; package-only records never appear',async()=>{
 const {sql,db}=fixture();
 try{
 const descriptors=[{slug:'alpha',version:'2.0.0',name:'Baked name',priceUsd:0,category:'Services',pages:['Home'],release:{sha256:'b'.repeat(64)}},{slug:'baked',version:'9.0.0'}];
 const {themes,releases}=await loadThemeCatalog(db,descriptors);
 assert.deepEqual(themes.map(t=>t.slug),['alpha','new']);
 assert.equal(themes[0].name,'Database name');
 assert.equal(themes[0].priceUsd,1);
 assert.equal(themes[0].version,'2.0.0');
 assert.equal(themes[0].release.sha256,'b'.repeat(64));
 assert.equal(themes[0].category,'Services');
 assert.equal(themes[1].version,'1.0.0');
 assert.equal(releases.some(r=>r.version==='3.0.0'),false);
 sql.exec("UPDATE products SET status='draft' WHERE id=1");
 assert.deepEqual((await loadThemeCatalog(db,descriptors)).themes.map(t=>t.slug),['new']);
 }finally{sql.close()}
});
test('database unavailable never falls back to package inventory',async()=>{
 await assert.rejects(loadThemeCatalog(undefined,[{slug:'baked'}]),/database_unavailable/);
});
