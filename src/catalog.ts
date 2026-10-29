export type ThemeCategory = 'Commerce' | 'Nonprofit' | 'Editorial' | 'Services' | 'Portfolio';
export type ReleaseState = 'preview' | 'published';
export type ThemeRecord = {
 slug: string; sku: string; name: string; summary: string;
 category: ThemeCategory; tags: string[]; pages: string[];
 colorway: 'wine' | 'violet' | 'paper'; version: string;
 publisher: string; priceUsd: number | null; previewUrl: string | null;
 minCmsSchema: '2';
 editorial?: {eyebrow: string; headline: string; body: string; notes: string[]};
 release: {status: ReleaseState; sha256: string | null; storageKey: string | null};
};
const base = {
 publisher:'InnerAnimalMedia',priceUsd:null,minCmsSchema:'2' as const,
 release:{status:'preview' as const,sha256:null,storageKey:null},
};
function product(slug:string,version:string,name:string,summary:string,category:ThemeCategory,tags:string[],pages:string[],colorway:ThemeRecord['colorway'],demo=true): ThemeRecord {
 return {...base,slug,version,name,summary,category,tags,pages,colorway,
 sku:'iam.theme.'+slug,previewUrl:demo?'https://agentsam.inneranimalmedia.com/themes/'+slug+'/demo/':null};
}
/**
 * Source: AgentSam SDK's original eight-theme gallery, plus Plain Jane Journal.
 * The catalog is a product listing, NOT a tenant, site, installation or CMS registry.
 * Versions reflect known package versions pending verified promotion.
 */
export const themes:ThemeRecord[]=[
 product('cypress','2.6.12','Cypress','A welcoming community website built for events, groups, giving and stories that bring people together.','Nonprofit',['Community','Events','Groups','Giving'],['Home','Visit','Events','Groups','Mission','Give'],'paper'),
 product('violet','2.6.13','Violet','Bold campaign storytelling with impact proof, donation moments and clear ways to participate.','Nonprofit',['Campaigns','Impact','Donations','Stories'],['Home','Campaigns','Stories','Impact','Get involved','Donate'],'violet'),
 product('grove','2.6.12','Grove','A tactile, gallery-led home-services website built around finished projects and confident quotes.','Services',['Home services','Gallery','Projects','Quotes'],['Home','Services','Our work','About','Contact'],'paper'),
 product('ember','2.6.12','Ember','Expressive e-commerce with bold product discovery and memorable shopping moments.','Commerce',['Products','Collections','Cart','Commerce'],['Home','Shop','Collection','Product','About','Contact'],'wine'),
 product('forge','2.6.12','Forge','A direct local-services site designed to turn trust and proof into calls and inquiries.','Services',['Local services','Leads','Contact','Trust'],['Home','Services','Projects','Reviews','Contact'],'wine'),
 product('harbor','2.6.12','Harbor','Measured and reassuring professional-service layouts for considered decisions.','Services',['Professional','Services','About','Trust'],['Home','Expertise','About','Insights','Contact'],'paper'),
 product('summit','2.6.12','Summit','Quiet, compelling portfolio pages with editorial pacing and considered work galleries.','Portfolio',['Portfolio','Case studies','Gallery','Story'],['Home','Work','Project','About','Contact'],'paper'),
 product('resolve','2.6.13','Resolve','A cinematic fashion storefront with curated collections, shoppable editorial and a striking visual rhythm.','Commerce',['Fashion','Products','Collections','Editorial'],['Home','Shop','Product','Collection','Editorial','About'],'wine'),
 {...product('plain-jane','0.1.0','Plain Jane Journal','A clean editorial starter for thoughtful writing, photography and personal stories.','Editorial',['Blog','Articles','Photography','Journal'],['Journal','Article','About','Photography','Contact','404'],'paper',true),
   previewUrl:'https://themes.inneranimalmedia.com/theme-packages/plain-jane/0.1.0/preview/',
   editorial:{
     eyebrow:'An editorial home for original ideas',
     headline:'A little more room for the story.',
     body:'Plain Jane Journal is built around generous typography, thoughtful pacing and quiet details. The original starter includes an essay index, article layouts, photography gallery and the essential supporting pages. It is the same source-led template previously hosted at this domain, now treated as a standalone product rather than the Theme Store itself.',
     notes:['Editorial home and individual story layouts are designed to be read, not just glanced at.','Photography pages and image galleries give visual work its own space.','Page metadata, original source assets and CMS section definitions are included in the source-backed preview archive.'],
   }},
];
export function findTheme(slug:string){return themes.find(theme=>theme.slug===slug)}
export function publicTheme(theme:ThemeRecord){
 return {...theme,downloadReady:theme.release.status==='published'&&!!theme.release.storageKey&&!!theme.release.sha256}
}
