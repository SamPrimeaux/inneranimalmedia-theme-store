import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedStoreSettings, publishedStoreGlobal } from '../src/published-cms.mjs';

function fakeDb(records) {
  return {
    prepare(statement) {
      return { bind(...params) {
        return { async first() { return records(statement,params); } };
      } };
    },
  };
}
const site = {account_id:'owner-1',settings_json:JSON.stringify({store:{schema:'iam.theme-store-site.v1',brand:{label:'A'}}})};
const header = {content_version:4,content_hash:'a'.repeat(64),inline_content_json:JSON.stringify({schema:'iam.cms.global-header.v1',navigation:{items:[]}})};
test('Theme Store reads only its authoritative published CMS site and global',async()=>{
  const queries=[];
  const db=fakeDb((sql,args)=>{
    queries.push({sql,args});
    return sql.includes('FROM cms_globals') ? header : site;
  });
  assert.equal((await publishedStoreSettings(db)).brand.label,'A');
  assert.equal((await publishedStoreGlobal(db,'header')).schema,'iam.cms.global-header.v1');
  assert.match(queries[0].sql,/status='active'/);
  assert.match(queries[1].sql,/g.status='published'/);
  assert.match(queries[1].sql,/s.account_id=g.account_id/);
  assert.deepEqual(queries[1].args,['theme-store','theme-store','themes.inneranimalmedia.com','header','header']);
});
test('drafts and foreign or incomplete published globals never appear as live data',async()=>{
  const db=fakeDb((sql)=>sql.includes('FROM cms_globals')?null:site);
  await assert.rejects(publishedStoreGlobal(db,'header'),/cms_published_global_missing/);
  await assert.rejects(publishedStoreGlobal(db,'menu:unsafe'),/cms_global_key_invalid/);
  const invalid=fakeDb((sql)=>sql.includes('FROM cms_globals')?{...header,content_hash:'bad'}:site);
  await assert.rejects(publishedStoreGlobal(invalid,'footer'),/cms_published_global_invalid/);
  const mismatched=fakeDb((sql)=>sql.includes('FROM cms_globals')?header:site);
  await assert.rejects(publishedStoreGlobal(mismatched,'footer'),/cms_published_global_schema_mismatch/);
});
test('D1-unbound local preview explicitly uses compatibility snapshot',async()=>{
  assert.equal(await publishedStoreGlobal(undefined,'header'),null);
  assert.equal(await publishedStoreSettings(undefined),null);
});
