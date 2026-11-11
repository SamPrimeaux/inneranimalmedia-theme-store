import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHeader,normalizeHeader,headerFromCmsRows} from '../src/header.mjs';
test('header is a site global, not an installable package',()=>{
 assert.equal(defaultHeader.section.type,'global-header');
 assert.equal(defaultHeader.blocks.length,3);
 assert.equal(defaultHeader.navigation.menu_name,'main');
 assert.ok(defaultHeader.navigation.items.some(x=>x.type==='browse'));
});
test('header projection accepts the existing CMS menu format',()=>{
 const dbRows=defaultHeader.blocks.map(block=>({block_key:block.key,block_type:block.type,sort_order:block.order,settings_json:JSON.stringify(block.settings)}));
 const menu={menu_name:'main',is_active:1,menu_items:JSON.stringify([
  {label:'Browse themes',href:'/themes/'},
  {label:'App embeds',href:'https://apps.inneranimalmedia.com/collections/embeds'},
  {label:'AgentSam Sites',href:'https://agentsam.inneranimalmedia.com/sites'}
 ])};
 const output=headerFromCmsRows({section_type:'global-header',section_data:JSON.stringify(defaultHeader.section.settings)},dbRows,menu);
 assert.equal(output.navigation.items.length,3);
 assert.equal(output.navigation.items[0].key,'browse-themes');
 assert.equal(output.navigation.items[0].type,'browse');
 assert.equal(output.navigation.items[1].type,'external');
 assert.equal(output.navigation.items[2].type,'external');
});
test('header rejects hostile navigation and malformed style values',()=>{
 const attack=structuredClone(defaultHeader);
 attack.navigation.items.push({key:'bad',label:'Bad',href:'javascript:alert(1)',type:'link'});
 attack.section.settings.background='url(javascript:evil)';
 attack.section.settings.height=20000;
 const safe=normalizeHeader(attack);
 assert.equal(safe.navigation.items.some(x=>x.key==='bad'),false);
 assert.equal(safe.section.settings.background,defaultHeader.section.settings.background);
 assert.equal(safe.section.settings.height,defaultHeader.section.settings.height);
});
