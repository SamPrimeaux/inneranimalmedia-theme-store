/**
 * Complete a source-verified website theme with editable system-page baselines.
 *
 * This is a pure install-document repair, not a replacement for the authored
 * site, and not an implementation of auth/checkout/commerce services.
 * Authored pages and original source sections must remain byte-for-byte intact.
 */
export const SYSTEM_PAGE_BASELINES = Object.freeze([
  {slug:'404',kind:'not_found',title:'404 page',heading:'Page not found',lead:'The page you are looking for may have moved.',requiresAdapter:null},
  {slug:'password',kind:'password',title:'Password page',heading:'Opening soon',lead:'This website is being prepared.',requiresAdapter:'password-gate'},
  {slug:'cart',kind:'cart',title:'Cart',heading:'Your cart',lead:'Connect the shopping cart to show current items.',requiresAdapter:'commerce-cart'},
  {slug:'product',kind:'product',title:'Default product',heading:'Product',lead:'Connect a product to show its details and purchasing options.',requiresAdapter:'commerce-product'},
  {slug:'collection',kind:'collection',title:'Default collection',heading:'Collection',lead:'Connect a collection to show its products.',requiresAdapter:'commerce-collection'},
  {slug:'collection-list',kind:'collection_list',title:'Collection list',heading:'Explore collections',lead:'Connect your collections to populate this page.',requiresAdapter:'commerce-collections'},
  {slug:'search',kind:'search',title:'Search',heading:'Search',lead:'Connect site search to find products, pages, and content.',requiresAdapter:'site-search'},
  {slug:'page',kind:'page',title:'Default page',heading:'Your page',lead:'Add content and sections to make this page your own.',requiresAdapter:null},
  {slug:'blog',kind:'blog',title:'Default blog',heading:'Journal',lead:'Connect your published articles to populate this page.',requiresAdapter:'cms-articles'},
  {slug:'article',kind:'article',title:'Default article',heading:'Article',lead:'Connect an article to display its authored content.',requiresAdapter:'cms-article'},
  {slug:'contact',kind:'contact',title:'Contact',heading:'Get in touch',lead:'Add your contact details or connect a working form.',requiresAdapter:null},
  {slug:'checkout',kind:'checkout',title:'Checkout',heading:'Checkout',lead:'Checkout requires an authorized commerce provider.',requiresAdapter:'commerce-checkout'},
  {slug:'account',kind:'customer_account',title:'Customer account',heading:'Your account',lead:'Account details are available after you sign in.',requiresAdapter:'customer-auth'},
  {slug:'sign-in',kind:'customer_sign_in',title:'Sign in',heading:'Welcome back',lead:'Sign in requires an authorized identity provider.',requiresAdapter:'customer-auth'},
  {slug:'sign-up',kind:'customer_sign_up',title:'Create account',heading:'Create an account',lead:'Registration requires an authorized identity provider.',requiresAdapter:'customer-auth'},
  {slug:'orders',kind:'customer_orders',title:'Orders',heading:'Your orders',lead:'Connect customer orders to view order history.',requiresAdapter:'commerce-orders'},
  {slug:'gift-card',kind:'gift_card',title:'Gift card',heading:'Gift card',lead:'Connect gift card redemption to your commerce provider.',requiresAdapter:'commerce-gift-card'}
]);

const FALLBACK_STYLES = [
  '.ia-system-page{min-height:65svh;display:grid;place-items:center;color:inherit;font:inherit;padding:clamp(64px,10vw,160px) clamp(20px,6vw,80px)}',
  '.ia-system-page__inner{width:min(100%,780px);margin-inline:auto}',
  '.ia-system-page__eyebrow{font-size:12px;font-weight:650;letter-spacing:.14em;text-transform:uppercase;opacity:.65}',
  '.ia-system-page h1{font:inherit;font-size:clamp(36px,6.5vw,88px);line-height:1.04;letter-spacing:-.045em;font-weight:700;margin:18px 0 24px;overflow-wrap:normal;word-break:normal}',
  '.ia-system-page p{font:inherit;font-size:clamp(16px,1.5vw,20px);line-height:1.55;opacity:.8;max-width:42ch;margin:0}',
  '.ia-system-page__action{display:inline-flex;align-items:center;gap:12px;border:1px solid currentColor;border-radius:5px;padding:13px 18px;margin-top:34px;text-decoration:none;color:inherit;transition:transform .25s ease,opacity .25s ease}',
  '.ia-system-page__action:hover{transform:translateY(-3px);opacity:.8}',
  '.ia-system-page__action:focus-visible{outline:3px solid currentColor;outline-offset:3px}',
  '@media(prefers-reduced-motion:reduce){.ia-system-page__action{transition:none}.ia-system-page__action:hover{transform:none}}'
].join('');

const escapeHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const sectionMarker = (section) => '<!--theme-section:' + section.key + '-->';

export function completeInstallProject(project) {
  if (!project || project.schema!=='agentsam.theme-project.v1' ||
      !Array.isArray(project.pages) || project.pages.length<1)
    throw Error('invalid_install_project_for_completion');
  // Preserve all authored pages, markup, styles and source metadata.
  const result=structuredClone(project);
  const existing=new Set(result.pages.map(page=>page.slug));
  const first=result.pages.find(page=>page.slug==='home') || result.pages[0];
  const sourceHead=(first.template.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'')
    .replace(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/gi,'');
  const chrome=first.sections.filter(section=>section.schema?.zone==='HEADER' ||
    section.schema?.zone==='FOOTER' || section.zone==='HEADER' || section.zone==='FOOTER');
  const headers=chrome.filter(section=>section.schema?.zone==='HEADER' || section.zone==='HEADER');
  const footers=chrome.filter(section=>section.schema?.zone==='FOOTER' || section.zone==='FOOTER');
  const added=[];
  for (const baseline of SYSTEM_PAGE_BASELINES) {
    if (existing.has(baseline.slug) || (baseline.slug==='404' && existing.has('not-found'))) continue;
    const key='system_'+baseline.slug.replace(/[^a-z0-9]/g,'_').replace(/^404$/,'not_found');
    const section={
      key,name:baseline.title,type:baseline.kind,zone:'BODY',sourceKind:'system-fallback',
      status:'draft',version:1,
      html:'<section class="ia-system-page" data-theme-section="'+key+'" data-theme-project-field="__section">'+
        '<div class="ia-system-page__inner">'+
        '<span class="ia-system-page__eyebrow" data-theme-project-field="eyebrow">'+escapeHtml(baseline.title)+'</span>'+
        '<h1 data-theme-project-field="heading">'+escapeHtml(baseline.heading)+'</h1>'+
        '<p data-theme-project-field="lead">'+escapeHtml(baseline.lead)+'</p>'+
        '<a class="ia-system-page__action" data-theme-project-field="link" href="/">'+
        '<span data-theme-project-field="button">Return home</span><span aria-hidden="true">↗</span></a>'+
        '</div></section>',
      content:{
        eyebrow:baseline.title,heading:baseline.heading,lead:baseline.lead,
        link:'/',button:'Return home',
        __editor:{templateKey:key,visibility:{enabled:true},blocks:[]}
      },
      schema:{
        key,label:baseline.title,zone:'BODY',sourceKind:'system-fallback',
        fields:[
          {key:'eyebrow',label:'Eyebrow',type:'text',group:'Content',binding:{}},
          {key:'heading',label:'Heading',type:'text',group:'Content',binding:{}},
          {key:'lead',label:'Description',type:'text',group:'Content',binding:{}},
          {key:'button',label:'Link label',type:'text',group:'Actions',binding:{}},
          {key:'link',label:'Link destination',type:'link',group:'Actions',binding:{attribute:'href'}}
        ],
        settings:[],blocks:[],capabilities:{reorder:false,duplicate:false,reusable:true}
      }
    };
    const sections=[...structuredClone(headers),section,...structuredClone(footers)];
    const template='<!doctype html><html lang="en"><head>'+sourceHead+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+escapeHtml(baseline.title)+'</title>'+
      '<style data-iam-system-baseline>'+FALLBACK_STYLES+'</style></head><body>'+
      headers.map(sectionMarker).join('')+
      '<main>'+sectionMarker(section)+'</main>'+
      footers.map(sectionMarker).join('')+'</body></html>';
    result.pages.push({
      slug:baseline.slug,title:baseline.title,page_type:baseline.kind,
      template_key:baseline.kind,status:'draft',
      assetBase:first.assetBase || '',sourceRoute:'/'+baseline.slug,
      sourceOrigin:'platform-system-baseline',isSystemFallback:true,
      ...(baseline.requiresAdapter ? {requiresRuntimeAdapter:baseline.requiresAdapter} : {}),
      template,sections
    });
    existing.add(baseline.slug);
    added.push(baseline.slug);
  }
  if (added.length) result.systemFallbacks=[
    ...(Array.isArray(result.systemFallbacks)?result.systemFallbacks:[]),
    ...added.filter(slug=>!(result.systemFallbacks||[]).includes(slug))
  ];
  if (result.pages.length>80) throw Error('install_project_page_limit_after_completion');
  return {project:result,added};
}
