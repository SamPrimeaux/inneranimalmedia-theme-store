/** Public index of immutable, source-derived CMS install artifacts.
 * Entries can activate only alongside an approved published theme release.
 * This is the one common packaging contract for every theme.
 */
const HASH=/^[a-f0-9]{64}$/;
const SLUG=/^[a-z][a-z0-9-]{0,63}$/;
const VERSION=/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
export function verifiedInstallEntries(raw, themes) {
  if(raw?.schema!=='agentsam.website-theme-install-index.v1'||!Array.isArray(raw.packages)) return [];
  return raw.packages.filter(p=>{
    if(!p||!SLUG.test(p.slug||'')||!VERSION.test(p.version||'')||
       !HASH.test(p.sha256||'')||!HASH.test(p.project_sha256||'')||
       !Number.isSafeInteger(p.page_count)||p.page_count<1||p.page_count>80||
       !Number.isSafeInteger(p.manifest_page_count)||p.manifest_page_count<0||
       p.project_key!=='install-projects/'+p.slug+'/'+p.version+'/'+p.project_sha256+'.json')return false;
    const theme=themes.find(t=>t.slug===p.slug);
    return theme?.version===p.version&&theme?.release?.status==='published'&&
      theme.release.sha256===p.sha256&&
      theme.release.storageKey==='releases/'+p.slug+'/'+p.version+'/'+p.sha256+'.zip';
  }).map(p=>({
    slug:p.slug,version:p.version,sha256:p.sha256,project_sha256:p.project_sha256,
    project_key:p.project_key,page_count:p.page_count,manifest_page_count:p.manifest_page_count,
    project_url:'/api/themes/'+p.slug+'/'+p.version+'/project',
  }));
}

/** A release ZIP is not enough to activate Try: the same signed release must
 * also have a verified, editable, source-derived CMS install project.
 * Fail closed when the R2 index is unavailable; never advertise ZIP-only designs.
 */
export function hasEditableInstallProject(theme, entries) {
  return Array.isArray(entries) && entries.some(entry =>
    entry.slug === theme?.slug && entry.version === theme?.version &&
    entry.sha256 === theme?.release?.sha256 &&
    theme?.release?.status === 'published' &&
    Number.isSafeInteger(entry.page_count) && entry.page_count > 0);
}
