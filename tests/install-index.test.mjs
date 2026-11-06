import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedInstallEntries, hasEditableInstallProject } from '../src/install-index.mjs';
const hash='a'.repeat(64),project='b'.repeat(64),slug='revise',version='0.1.1';
const item={slug,version,sha256:hash,project_sha256:project,project_key:'install-projects/revise/0.1.1/'+project+'.json',page_count:5,manifest_page_count:5};
const themes=[{slug,version,release:{status:'published',sha256:hash,storageKey:'releases/revise/0.1.1/'+hash+'.zip'}}];
test('releases require both approved package and content-addressed editable project',()=>{
 const payload={schema:'agentsam.website-theme-install-index.v1',packages:[item]};
 assert.equal(verifiedInstallEntries(payload,themes).length,1);
 assert.equal(verifiedInstallEntries(payload,[{...themes[0],release:{status:'preview',sha256:null,storageKey:null}}]).length,0);
 assert.equal(verifiedInstallEntries(payload,[{...themes[0],release:{...themes[0].release,sha256:'c'.repeat(64)}}]).length,0);
 assert.equal(verifiedInstallEntries({...payload,packages:[{...item,project_key:'other'}]},themes).length,0);
});

test('public Try remains unavailable without matching editable source project',()=>{
 const ready=verifiedInstallEntries({schema:'agentsam.website-theme-install-index.v1',packages:[item]},themes);
 assert.equal(hasEditableInstallProject(themes[0],ready),true);
 assert.equal(hasEditableInstallProject(themes[0],null),false);
 assert.equal(hasEditableInstallProject(themes[0],[]),false);
 assert.equal(hasEditableInstallProject({...themes[0],version:'2.6.14'},ready),false);
 assert.equal(hasEditableInstallProject({...themes[0],release:{...themes[0].release,sha256:'e'.repeat(64)}},ready),false);
 assert.equal(hasEditableInstallProject({...themes[0],release:{...themes[0].release,status:'preview'}},ready),false);
});
