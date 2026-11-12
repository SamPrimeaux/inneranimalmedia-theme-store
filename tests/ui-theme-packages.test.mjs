import test from 'node:test';
import assert from 'node:assert/strict';
import {parseUiThemePackagePath,serveUiThemePackage} from '../src/ui-theme-packages.mjs';
const slug='custom-iam-studio-dark-521972c85d';
const hash='55bba821be7acefc9f5db9a2064ed560c67521c5f50b5d1c2509271d236b156a';
const prefix='cms/ui-themes/v1/'+slug+'/'+hash.slice(0,16)+'/';
const url='https://themes.inneranimalmedia.com/api/ui-themes/'+slug+'/'+hash.slice(0,16)+'/theme.css';
function environment(rowOverrides={}){
  const row={id:'theme-9ecfee0f309797fcf3f5b7efbd3045b5',slug,account_id:'account-owner',visibility:'private',status:'active',css_r2_bucket:'theme-store',css_r2_key:prefix+'theme.css',compiled_css_hash:hash,...rowOverrides};
  const calls=[];
  return {calls,env:{
    DB:{prepare(q){calls.push(['sql',q]);return{bind(s){calls.push(['bind',s]);return{first:async()=>row}}}}},
    THEME_PACKAGES:{get:async key=>{calls.push(['r2',key]);return{body:new Response('theme-body').body,httpEtag:'"etag"'}}},
  }};
}
test('accept only expected immutable filenames and strict path segments',()=>{
 assert.deepEqual(parseUiThemePackagePath(new URL(url).pathname),{slug,digest:hash.slice(0,16),file:'theme.css'});
 for(const p of ['/api/ui-themes/../etc/passwd','/api/ui-themes/x/a.txt','/api/ui-themes/'+slug+'/'+hash.slice(0,16)+'/password.json','/api/ui-themes/'+slug+'/'+hash.slice(0,15)+'/theme.css'])assert.equal(parseUiThemePackagePath(p),null);
});
test('private theme cannot be fetched without account authorization',async()=>{
 const {env,calls}=environment();
 const result=await serveUiThemePackage(new Request(url),env,async()=>false);
 assert.equal(result.status,404);
 assert.equal(result.headers.get('cache-control'),'private, no-store');
 assert.equal(calls.filter(([kind])=>kind==='r2').length,0);
});
test('private owner can read current package; response never caches',async()=>{
 const {env,calls}=environment();
 const result=await serveUiThemePackage(new Request(url),env,async()=>true);
 assert.equal(result.status,200);
 assert.equal(await result.text(),'theme-body');
 assert.equal(result.headers.get('cache-control'),'private, no-store, max-age=0');
 assert.equal(result.headers.get('x-theme-css-hash'),hash);
 assert.deepEqual(calls.filter(([kind])=>kind==='r2'),[['r2',prefix+'theme.css']]);
});
test('public unowned theme serves immutable content and HEAD',async()=>{
 const {env}=environment({account_id:null,visibility:'public'});
 const result=await serveUiThemePackage(new Request(url,{method:'HEAD'}),env);
 assert.equal(result.status,200);
 assert.equal(await result.text(),'');
 assert.match(result.headers.get('cache-control'),/immutable/);
});
test('stale hash, wrong bucket, archived, and mismatched prefix all reject',async()=>{
 for(const overrides of [{compiled_css_hash:'a'.repeat(64)},{css_r2_bucket:'inneranimalmedia'},{status:'archived'},{css_r2_key:'old-key'}]){
  const {env,calls}=environment(overrides);
  const result=await serveUiThemePackage(new Request(url),env,async()=>true);
  assert.equal(result.status,404);
  assert.equal(calls.some(([type])=>type==='r2'),false);
 }
});
test('unavailable D1 refuses even public theme',async()=>{
 const result=await serveUiThemePackage(new Request(url),{THEME_PACKAGES:{get:async()=>null}});
 assert.equal(result.status,503);
});

