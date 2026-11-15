/**
 * Offline export of IAPJ-authored routes into a preview-only CMS source manifest.
 * Content remains owned by IAPJ. This manifest does not claim CMS writes work.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'source');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'src/content/site.manifest.json'),'utf8'));
const articlesFile=path.join(source,'src/data/articles.ts');
const code=fs.readFileSync(articlesFile,'utf8');
const ast=ts.createSourceFile(articlesFile,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const getString=(node,key)=>{
 if(!node||!ts.isObjectLiteralExpression(node))return undefined;
 const prop=node.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast).replace(/['"]/g,'')===key);
 return prop&&ts.isPropertyAssignment(prop)&&ts.isStringLiteralLike(prop.initializer)?prop.initializer.text:undefined;
};
let articles=[];
for(const statement of ast.statements){
 if(!ts.isVariableStatement(statement))continue;
 for(const dec of statement.declarationList.declarations){
  if(dec.name.getText(ast)!=='articles'||!dec.initializer||!ts.isArrayLiteralExpression(dec.initializer))continue;
  articles=dec.initializer.elements.map(n=>({
   slug:getString(n,'slug'),title:getString(n,'title'),
   canonicalPath:getString(n,'canonicalPath'),category:getString(n,'category'),
   excerpt:getString(n,'excerpt'),mediaRef:getString(n,'coverImageRef')
  })).filter(n=>n.slug&&n.title);
 }
}
if(articles.length<6)throw Error('IAPJ source articles missing: refuse incomplete CMS preview manifest');
const guidesDir=path.join(source,'src/content/ux-guide');
const guides=fs.readdirSync(guidesDir).filter(name=>name.endsWith('.md')).map(name=>{
 const raw=fs.readFileSync(path.join(guidesDir,name),'utf8');
 const front=raw.match(/^---\s*\n([\s\S]*?)\n---/);
 if(!front)throw Error('missing markdown frontmatter: '+name);
 const pick=key=>front[1].match(new RegExp('^'+key+':\\s*(.*)$','m'))?.[1]?.replace(/^["']|["']$/g,'').trim();
 return {slug:pick('slug')||name.slice(0,-3),title:pick('title')||name.slice(0,-3),
  canonicalPath:pick('route')||('/blog/ux-guide/'+name.slice(0,-3)),
  category:'ui-ux',excerpt:pick('dek')||'',mediaRef:null,contentSource:'src/content/ux-guide/'+name};
});
const definitions=[
 'iapj-header','iapj-brand-logo','iapj-blog-index','iapj-category-grid',
 'iapj-article-hero','iapj-article-body','iapj-rich-markdown',
 'iapj-editorial-media','iapj-quote','iapj-gallery','iapj-work-gallery',
 'iapj-about','iapj-search','iapj-footer','iapj-footer-backdrop'
];
const pages=[];const seen=new Set();
function add(slug,title,pathValue,type,body,detail={}){
 const clean=pathValue.replace(/^\/+|\/+$/g,'');
 if(!/^[a-z0-9/-]*$/.test(clean))throw Error('unsafe IAPJ path: '+clean);
 if(seen.has(clean))throw Error('duplicate IAPJ path: '+clean);
 seen.add(clean);
 const keys=['iapj-header',body,'iapj-footer'];
 pages.push({
  slug,source_slug:slug,title,page_type:type,path:clean,template_key:'plain-jane/'+type,
  status:'draft',sourceOrigin:'iapj-authored-source',
  source:detail.contentSource||'src/data/articles.ts',
  requiresRuntimeAdapter:true,
  sections:keys.map((key,i)=>({
   id:'iapj-'+slug.replace(/[^a-z0-9-]/g,'-')+'-'+i,
   key:'iapj-'+slug.replace(/[^a-z0-9-]/g,'-')+'-'+i,
   definition_key:key,template_sku:'tpl-'+key+'-default',
   content:{title,route:'/'+clean,category:detail.category||null,
    excerpt:detail.excerpt||'',mediaRef:detail.mediaRef||null},
   blocks:[],sort_order:i,status:'draft'
  }))
 });
}
add('home','IAPJ editorial home','', 'blog','iapj-blog-index',{contentSource:'src/pages/BlogIndex.tsx'});
add('blog','Blog','blog','blog','iapj-blog-index',{contentSource:'src/pages/BlogIndex.tsx'});
add('about','About','about','about','iapj-about',{contentSource:'src/pages/About.tsx'});
add('work','Work & Photography','work','portfolio','iapj-work-gallery',{contentSource:'src/pages/Photography.tsx'});
add('photography','Photography','photography','portfolio','iapj-work-gallery',{contentSource:'src/pages/Photography.tsx'});
add('search','Search','search','search','iapj-search',{contentSource:'src/pages/Search.tsx'});
for(const category of manifest.navigation.categories||[]){
 if(category.slug==='all')continue;
 add('category-'+category.slug,category.label,'blog/category/'+category.slug,'category','iapj-category-grid',
 {category:category.slug,contentSource:'src/pages/BlogCategory.tsx'});
}
for(const item of [...articles,...guides]){
 add('post-'+item.slug,item.title,item.canonicalPath||'/blog/'+item.slug,'post',
 item.contentSource?'iapj-rich-markdown':'iapj-article-body',item);
}
// Export the real Vite-emitted local image URLs, never /src/assets/ paths.
const builtFiles=fs.readdirSync(path.join(root,'site','assets'));
const mediaCatalog=Object.fromEntries(Object.entries(manifest.mediaCatalog).map(([key,entry])=>{
  const src=entry.url||'';
  const match=src.match(/^\/src\/assets\/images\/([^/]+)\.(jpg|jpeg|png|webp)$/);
  if(!match)return [key,{...entry}];
  const [_,stem,ext]=match;
  const candidates=builtFiles.filter(file=>file.startsWith(stem+'-')&&file.endsWith('.'+ext));
  if(candidates.length!==1)throw Error('IAPJ media asset was not emitted exactly once: '+key+' '+src);
  return [key,{...entry,url:'/themes/plain-jane/demo/assets/'+candidates[0]}];
}));
const output={
 schema:'agentsam.cms-source-manifest.v1',theme:'plain-jane',sourceTheme:'iapj',
 editorScope:'account',editorProject:'install-project.json',sourceInventoryOnly:true,
 source:'SamPrimeaux/inneranimalmedia-theme-store',sourceSeed:'SamPrimeaux/iapj',contentModel:'IAPJ React/TypeScript + Markdown',
 definitions,pages,
 mediaCatalog,
 notice:'Source-route inventory; the separately generated install-project.json contains native editable HTML sections, fields and blocks.'
};
const out=path.join(root,'site','iapj-cms-manifest.json');
fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log('IAPJ manifest:',pages.length,'pages,',definitions.length,'component keys');
