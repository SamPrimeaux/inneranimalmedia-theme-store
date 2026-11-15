/** IAPJ editorial product metadata. Promotion is gated by verified CMS installability. */
export const THEME=Object.freeze({
  id:'theme.plain-jane',slug:'plain-jane',displayName:'InnerAnimal Plain Jane',
  kind:'prebuild',family:'editorial-blog',version:'0.2.0',
  package:'@inneranimalmedia/theme-plain-jane',category:'Editorial / Blog',
  description:'A carefully crafted blog and portfolio featuring branded editorial publishing, media-rich articles, photography and searchable collections.',
  industries:['Publishing','Creator','Portfolio','Services'],
  pages:['Home','Blog','Article','About','Photography','Work','Search'],
  features:['Logical media assets','Search and category filters','Dark/light appearance','Editorial media','UI/UX guide','CMS source manifest'],
  installable:false,portable:true,prebuildRoot:'site',
  capabilityHints:['theme.site.shell','cms.source-manifest','cms.preview-only']
});
export function createTheme(){return structuredClone(THEME);}
export default createTheme;
