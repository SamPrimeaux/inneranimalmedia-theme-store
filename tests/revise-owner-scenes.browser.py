"""Revise local visual acceptance: real hero, eleven source camera stops, native scene and GLB.
Run while local Theme Store serves port 4321; no production publishing.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path

BASE = 'http://127.0.0.1:4321/theme-packages/revise/0.1.3/preview/'
OUTPUT = Path('/tmp/revise-owner-visual-acceptance')
OUTPUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,
        executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader'])
    for width,height in [(1440,900),(390,844),(320,700)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
        page=context.new_page()
        errors=[]
        failed=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('requestfailed',lambda request:failed.append(request.url))
        result=page.goto(BASE,wait_until='domcontentloaded',timeout=25000)
        page.locator('.rr-home-hero--campaign img').wait_for(timeout=15000)
        page.wait_for_timeout(250)
        logo=page.locator('.rr-wordmark img')
        page.wait_for_function("() => {const img=document.querySelector('.rr-wordmark img'); return img && img.complete && img.naturalWidth>0;}",timeout=15000)
        assert logo.get_attribute('src').endswith('revise-custom-wordmark.svg')
        page.locator('[data-menu-toggle]').click()
        page.wait_for_function("() => {const img=document.querySelector('.rr-menu__mark'); return img && img.complete && img.naturalWidth>0;}",timeout=15000)
        assert page.locator('.rr-menu').get_attribute('data-open') == 'true'
        page.locator('[data-menu-close]').click()
        img=page.locator('.rr-home-hero--campaign img')
        assert 'revise-campaign-hero.webp' in img.get_attribute('src')
        page.wait_for_function("() => {const img=document.querySelector('.rr-home-hero--campaign img'); return img && img.complete && img.naturalWidth>0;}",timeout=15000)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), ('home overflow',width)
        page.locator('.rr-identity-gallery').scroll_into_view_if_needed()
        page.wait_for_function("() => [...document.querySelectorAll('.rr-identity-gallery img')].length===5 && [...document.querySelectorAll('.rr-identity-gallery img')].every(img=>img.complete && img.naturalWidth>0)",timeout=15000)
        if width == 1440: page.screenshot(path=str(OUTPUT/'revise-new-hero-desktop.png'))
        if width == 390: page.screenshot(path=str(OUTPUT/'revise-new-hero-mobile.png'))
        result=page.goto(BASE+'pages/world/?owner=1',wait_until='domcontentloaded',timeout=25000)
        page.locator('.rr-world-chapter').first.wait_for(timeout=20000)
        assert page.locator('.rr-world-chapter').count()==11
        assert page.locator('.rr-world-environment canvas').count()==1
        page.wait_for_timeout(2000)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),('world overflow',width)
        if width == 1440: page.screenshot(path=str(OUTPUT/'revise-owner-world-desktop.png'))
        if width == 390: page.screenshot(path=str(OUTPUT/'revise-owner-world-mobile.png'))
        print('world',width, {
          'status':page.locator('.rr-world-environment').get_attribute('class'),
          'native':page.locator('#original-circuit-stage').count(),
          'footer_glb':page.locator('[data-owner-footer-glb]').count(),
          'errors':errors[:4],
          'request_failures':failed[:4]
        })
        assert not errors,('runtime errors',width,errors)
        page.close()
        context.close()
    context=browser.new_context(viewport={'width':1440,'height':900})
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'products/',wait_until='networkidle',timeout=25000)
    page.locator('[data-filter="service"]').click()
    assert page.locator('.rr-product-card').count()==2, 'Service filter should select the two authored service offerings'
    page.locator('.rr-product-card').first.locator('a').first.click()
    page.wait_for_url('**/products/brand-direction/')
    page.locator('[data-add-to-cart]').click()
    assert page.locator('.rr-bag-count').first.inner_text()=='1', 'Add-to-bag must update the live preview count'
    page.goto(BASE+'cart/',wait_until='networkidle',timeout=25000)
    assert page.locator('.rr-cart-line').count()==1
    assert 'Brand Direction Intensive' in page.locator('body').inner_text()
    assert not errors,('storefront runtime errors',errors)
    print('commerce', {'service_filter':2,'cart_lines':1,'runtime_errors':errors})
    context.close()
    browser.close()
print('PASS: Hero, custom vector identity, five image studies, product filtering/cart, owner 11-chapter scene and mobile layouts.')
