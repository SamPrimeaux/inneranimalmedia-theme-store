import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { selectVerifiedThemeReleases, planProductReleaseSql } from '../scripts/product-release-registry.mjs';

const x='a'.repeat(64), y='b'.repeat(64);
const idx={schema:'agentsam.website-theme-install-index.v1',packages:[{
  slug:'plain-jane',version:'0.3.0',sha256:x,project_sha256:y,
  project_key:'install-projects/plain-jane/0.3.0/'+y+'.json',
  project_url:'/api/themes/plain-jane/0.3.0/project',page_count:46,manifest_page_count:31,
}]};
const cat={schema:'iam.theme-catalog.v1',products:[{slug:'plain-jane',version:'0.3.0',
  release:{status:'published',sha256:x,storageKey:'releases/plain-jane/0.3.0/'+x+'.zip'}}]};
test('live verified release is authoritative, unrelated or stale release is rejected',()=>{
  const [entry]=selectVerifiedThemeReleases(idx,cat);
  assert.equal(entry.pageCount,46);
  assert.equal(entry.projectHash,y);
  assert.throws(()=>selectVerifiedThemeReleases(idx,{...cat,products:[{...cat.products[0],version:'0.1.0'}]}),
    /unverified_catalog_release|missing_or_duplicate_verified_install/);
  assert.throws(()=>selectVerifiedThemeReleases(idx,{...cat,products:[{...cat.products[0],
    release:{...cat.products[0].release,storageKey:'releases/plain-jane/latest.zip'}}]}),
    /unverified_catalog_release/);
  assert.throws(()=>selectVerifiedThemeReleases(idx,cat,{only:'../secrets'}),/invalid_theme_slug/);
  const withPreview={...cat,products:[...cat.products,{slug:'unfinished',version:'0.1.0',
    release:{status:'preview',sha256:x,storageKey:'releases/unfinished/0.1.0/'+x+'.zip'}}]};
  assert.equal(selectVerifiedThemeReleases(idx,withPreview).length,1);
  assert.throws(()=>selectVerifiedThemeReleases(idx,withPreview,{only:'unfinished'}),
    /unverified_catalog_release/);
});
test('existing product receives immutable new release; old release remains; replay is idempotent',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE agentsam_products (id TEXT PRIMARY KEY,slug TEXT,kind TEXT,version TEXT,
    source_type TEXT,source_id TEXT,package_name TEXT,metadata TEXT DEFAULT '{}',
    status TEXT,catalog_visibility TEXT,updated_at INTEGER);
    CREATE TABLE agentsam_product_releases (id TEXT PRIMARY KEY,product_id TEXT,product_slug TEXT,sku TEXT,
     version TEXT,channel TEXT,release_status TEXT,review_status TEXT,artifact_kind TEXT,
     r2_bucket TEXT,r2_key TEXT,sha256 TEXT,byte_size INTEGER,package_name TEXT,
     preview_url TEXT,compatible_schema_version TEXT,metadata_json TEXT,published_at_unix INTEGER);
    INSERT INTO agentsam_products(id,slug,kind,version,status,catalog_visibility,metadata)
    VALUES('p','plain-jane','theme','0.1.0','production','public','{}');
    INSERT INTO agentsam_product_releases(id,product_id,product_slug,version,r2_key,sha256,release_status)
    VALUES('old','p','plain-jane','0.1.0','old.zip','oldhash','published');`);
  const record={...selectVerifiedThemeReleases(idx,cat)[0],byteSize:12345};
  const sql=planProductReleaseSql([record]);
  db.exec(sql); db.exec(sql);
  const releases=db.prepare('SELECT id,version,sha256 FROM agentsam_product_releases ORDER BY version').all();
  assert.equal(releases.length,2);
  assert.equal(releases[0].version,'0.1.0');
  assert.equal(releases[1].version,'0.3.0');
  assert.equal(releases[1].sha256,x);
  assert.equal(db.prepare("SELECT version FROM agentsam_products WHERE id='p'").get().version,'0.3.0');
  db.close();
});
test('same release ID cannot be silently rewritten with another immutable checksum',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE agentsam_products(id TEXT PRIMARY KEY,slug TEXT,kind TEXT,version TEXT,source_type TEXT,source_id TEXT,package_name TEXT,metadata TEXT,status TEXT,catalog_visibility TEXT,updated_at INTEGER);
  CREATE TABLE agentsam_product_releases(id TEXT PRIMARY KEY,product_id TEXT,product_slug TEXT,sku TEXT,version TEXT,channel TEXT,release_status TEXT,review_status TEXT,artifact_kind TEXT,r2_bucket TEXT,r2_key TEXT,sha256 TEXT,byte_size INTEGER,package_name TEXT,preview_url TEXT,compatible_schema_version TEXT,metadata_json TEXT,published_at_unix INTEGER);
  INSERT INTO agentsam_products(id,slug,kind,version,metadata) VALUES('p','plain-jane','theme','0.1.0','{}');
  INSERT INTO agentsam_product_releases(id,product_id,version,sha256,r2_key,release_status)
  VALUES('release_theme_plain_jane_0_3_0','p','0.3.0','tampered','tampered.zip','staged');`);
  db.exec(planProductReleaseSql([{...selectVerifiedThemeReleases(idx,cat)[0],byteSize:1234}]));
  assert.equal(db.prepare("SELECT version FROM agentsam_products WHERE id='p'").get().version,'0.1.0');
  assert.equal(db.prepare("SELECT sha256 FROM agentsam_product_releases WHERE version='0.3.0'").get().sha256,'tampered');
  db.close();
});

test('installer publisher synchronizes registry only after the verified remote index', async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../scripts/publish-install-projects.mjs',import.meta.url),'utf8');
  const verified=source.indexOf("if(hash(await readFile(checked))!==hash(content))");
  const synced=source.indexOf("scripts/register-product-releases.mjs");
  assert.ok(verified>=0 && synced>verified);
  assert.match(source,/args\.push\('--only=' \+ only\)/);
  assert.match(source,/theme_registry_sync_failed/);
  const registrar=readFileSync(new URL('../scripts/register-product-releases.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(registrar,/staged-releases\.json/);
  assert.match(registrar,/registry_d1_readback_mismatch/);
});
