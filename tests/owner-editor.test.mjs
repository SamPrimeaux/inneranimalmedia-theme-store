import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveOwnedThemeStoreEditor } from '../src/owner-editor.mjs';

const owner={id:'theme-store',slug:'theme-store',source:'shared-d1',can_edit:true,can_publish:true};
test('CMS editing is granted only by the authenticated authorized inventory',()=>{
  const editor=resolveOwnedThemeStoreEditor({sites:[owner]});
  assert.equal(editor.site_id,'theme-store');
  assert.equal(editor.pages_href,'https://agentsam.inneranimalmedia.com/admin/pages?site_id=theme-store');
  assert.equal(editor.globals_href,'https://agentsam.inneranimalmedia.com/admin/theme-editor?site_id=theme-store&slug=site-shell&page_id=cmsp_theme_store_site_shell');
  assert.equal(resolveOwnedThemeStoreEditor({sites:[{...owner,can_publish:false}]}).site_id,'theme-store');
});
test('guests, foreign sites, and unverified permissions cannot see owner editor',()=>{
  for(const bad of [
    null,{}, {sites:null},{sites:[]},{sites:[{...owner,can_edit:false}]},
    {sites:[{...owner,can_edit:'true'}]},{sites:[{...owner,id:'app-store'}]},
    {sites:[{...owner,slug:'other'}]},{sites:[{...owner,source:'worker'}]},
    {sites:[{...owner,role:'viewer',can_edit:false}]}
  ])assert.equal(resolveOwnedThemeStoreEditor(bad),null);
});
test('account UI and worker use the authorized inventory rather than a site_id query or hardcoded account',()=>{
  const worker=readFileSync(new URL('../src/worker.ts',import.meta.url),'utf8');
  const menu=readFileSync(new URL('../src/AccountMenu.tsx',import.meta.url),'utf8');
  assert.match(worker,/\/api\/admin\/cms\/sites/);
  assert.match(worker,/resolveOwnedThemeStoreEditor\(await inventoryResponse\.json\(\)\)/);
  assert.match(worker,/cache-control':'private, no-store/);
  assert.match(menu,/state\.editor\?\.site_id==='theme-store'/);
  assert.doesNotMatch(menu,/au_871d/);
});

test('host-scoped sessions can navigate to the protected AgentSam editor without duplicating authentication',()=>{
  const menu=readFileSync(new URL('../src/AccountMenu.tsx',import.meta.url),'utf8');
  const guest=menu.split('if(!state.authenticated||!state.user)return ')[1]?.split('const person=')[0]||'';
  assert.match(guest,/className="account-manage"/);
  assert.match(guest,/href="\/studio"/);
  assert.match(menu,/href="\/studio\?panel=globals"/);
  const studio=readFileSync(new URL('../src/StoreStudio.tsx',import.meta.url),'utf8');
  assert.match(studio,/api\/account\/me/);
  assert.match(studio,/account\.editor\?\.site_id === 'theme-store'/);
  assert.match(studio,/<iframe/);
  assert.doesNotMatch(guest,/onClick=\{.*fetch/);
});
