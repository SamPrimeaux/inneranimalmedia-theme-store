import test from 'node:test';
import assert from 'node:assert/strict';
import { availableFilters, filterThemes } from '../src/filter-themes.mjs';

const themes = [
  {name:'Resolve',summary:'Fashion store',publisher:'InnerAnimalMedia',category:'Commerce',
    tags:['Fashion'],pages:['Home','Product'],industries:['Clothing'],catalogSizes:['Small catalog','Large catalog'],
    features:['Product pages','Collections'],priceUsd:null},
  {name:'Journal',summary:'Editorial site',publisher:'InnerAnimalMedia',category:'Editorial',
    tags:['Blog'],pages:['Home','Blog'],industries:['Editorial'],catalogSizes:[],
    features:['Blog'],priceUsd:0},
  {name:'Premium',summary:'Large retail',publisher:'InnerAnimalMedia',category:'Commerce',
    tags:[],pages:['Home','Shop'],industries:['Clothing'],catalogSizes:['Large catalog'],
    features:['Collections'],priceUsd:200},
];
test('builds facets from canonical package metadata',()=>{
  assert.deepEqual(availableFilters(themes).catalogSizes,['Large catalog','Small catalog']);
  assert.deepEqual(availableFilters(themes).industries,['Clothing','Editorial']);
});
test('price never treats an unknown price as free',()=>{
  assert.deepEqual(filterThemes(themes,{prices:['Free']}).map(t=>t.name),['Journal']);
  assert.deepEqual(filterThemes(themes,{prices:['Paid']}).map(t=>t.name),['Premium']);
  assert.deepEqual(filterThemes(themes,{prices:['Not listed']}).map(t=>t.name),['Resolve']);
});
test('multi-select is OR within a facet and AND across facets',()=>{
  assert.deepEqual(filterThemes(themes,{industries:['Clothing'],catalogSizes:['Large catalog'],
    features:['Collections']}).map(t=>t.name),['Resolve','Premium']);
  assert.deepEqual(filterThemes(themes,{industries:['Clothing','Editorial'],prices:['Free']})
    .map(t=>t.name),['Journal']);
});
test('name search and sorting work without modifying source order',()=>{
  assert.deepEqual(filterThemes(themes,{query:'fashion'}).map(t=>t.name),['Resolve']);
  assert.deepEqual(filterThemes(themes,{sort:'price-ascending'}).map(t=>t.name),['Journal','Premium','Resolve']);
  assert.equal(themes[0].name,'Resolve');
});
