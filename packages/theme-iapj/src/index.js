/** IAPJ editorial product metadata. The Theme Store owns the editable source package and installed project contract. */
export const THEME=Object.freeze({
  id:'theme.iapj',slug:'iapj',displayName:'InnerAnimal Plain Jane',
  kind:'prebuild',family:'editorial-blog',version:'0.3.0',
  package:'@inneranimalmedia/theme-iapj',category:'Editorial / Blog',
  description:'A carefully crafted blog and portfolio featuring branded editorial publishing, media-rich articles, photography and searchable collections.',
  industries:['Publishing','Creator','Portfolio','Services'],
  pages:['Home','Blog','Article','About','Photography','Work','Search'],
  features:['Logical media assets','Search and category filters','Dark/light appearance','Editorial media','UI/UX guide','CMS source manifest'],
  installable:true,portable:true,prebuildRoot:'site',
  capabilityHints:['theme.site.shell','cms.source-manifest','cms.editable-project','cms.private-workspace']
});
export function createTheme(){return structuredClone(THEME);}
export default createTheme;
