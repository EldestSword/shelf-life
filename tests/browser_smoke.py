"""Real browser acceptance: two engines, two phone sizes, all four screens and game flows."""
import json, os, pathlib, re, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
URL='http://127.0.0.1:4178'
checks=0
def expect(value, message):
    global checks
    assert value, message
    checks+=1
def settle(page): page.evaluate('navigator.locks ? navigator.locks.request(SHELF_STORAGE.KEY,()=>true) : Promise.resolve(true)')
def snap(page):
    settle(page)
    return page.evaluate('SHELF_APP.snapshot()')
def act(browser_page,name,**data):
    selector=f'[data-action="{name}"]'+''.join(f'[data-{k}="{v}"]' for k,v in data.items())
    inside=browser_page.locator('#modal[open] '+selector).filter(visible=True)
    (inside if inside.count() else browser_page.locator(selector).filter(visible=True)).first.click()
    settle(browser_page)
def shot(page,path):
    page.wait_for_function('()=>!document.querySelector("#toast").classList.contains("show")&&!document.querySelector("#particles").children.length')
    page.screenshot(path=str(path))
def close(page):
    if page.locator('dialog[open]').count(): act(page,'close')
def nav(page,name):
    close(page);act(page,'nav',page=name)
    page.wait_for_function('(name)=>SHELF_APP.page()===name',arg=name)
def fixture(page,**values):
    return page.evaluate('(values)=>{const s=SHELF_ENGINE.fresh(37);s.started=true;Object.assign(s,values);return SHELF_STORAGE.encode(s);}',values)
def import_save(page,text):
    close(page);act(page,'settings');act(page,'backup')
    page.locator('#import-file').set_input_files({'name':'library.json','mimeType':'application/json','buffer':text.encode()})
    page.locator('[data-action="confirm-import"]').wait_for()
    act(page,'confirm-import')
    page.wait_for_function('()=>(!document.querySelector("#modal").open)')
def fits(page,label):
    result=page.evaluate('''()=>{
      const main=document.querySelector('main').getBoundingClientRect(),nav=document.querySelector('nav').getBoundingClientRect();
      const section=[...document.querySelectorAll('.page')].find(e=>!e.hidden);
      const bad=[...section.querySelectorAll('button')].filter(e=>!e.disabled&&e.getClientRects().length).map(e=>({e,r:e.getBoundingClientRect()})).filter(({r})=>r.top<main.top-1||r.bottom>nav.top+1||r.left<0||r.right>innerWidth).map(({e})=>e.outerHTML.slice(0,130));
      const cut=[...section.querySelectorAll('.upgrade-card,.collection-card,.achievement-card,.req-person')].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>e.className);
      return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth,body:document.body.scrollHeight,bad,cut};
    }''')
    expect(result['scroll']==result['height'] and result['body']==result['height'] and result['sw']==result['width'],f'{label}: document overflow {result}')
    expect(not result['bad'],f'{label}: controls outside viewport {result}')
    expect(not result['cut'],f'{label}: clipped content {result}')

def start_server():
    child=subprocess.Popen(['node','scripts/serve.cjs'],cwd=ROOT,env={**os.environ,'PORT':'4178'},stdout=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(URL,timeout=1);return child
        except Exception: time.sleep(.1)
    child.terminate();raise RuntimeError('Test server failed to start')
server=None
try:
    server=start_server()
    with sync_playwright() as p:
        for engine in os.environ.get('SHELF_TEST_ENGINES','chromium,webkit').split(','):
            browser=getattr(p,engine).launch()
            for width,height in [(320,667),(390,844)]:
                context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=True,has_touch=True,accept_downloads=True)
                page=context.new_page();errors=[];remote=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda msg:errors.append(msg.text) if msg.type=='error' else None)
                page.on('request',lambda req:remote.append(req.url) if not req.url.startswith(URL) and not req.url.startswith('blob:') else None)
                page.goto(URL);page.locator('[data-action="start-tutorial"]').wait_for()
                fonts=page.evaluate("document.fonts.ready.then(()=>({atkinson:document.fonts.check('16px Atkinson'),fraunces:document.fonts.check('24px Fraunces')}))")
                expect(fonts=={'atkinson':True,'fraunces':True},f'Bundled fonts did not load: {fonts}')
                shot(page,OUT/f'{engine}-{width}-welcome.png')
                if engine=='chromium' and width==320:
                    act(page,'start-tutorial');expect(page.get_by_text('1 OF 4 · BOOKS').is_visible(),'Whole-game tutorial did not start')
                    act(page,'tile',index=0);act(page,'tile',index=1);expect(page.get_by_text('2 OF 4 · CHEESE').is_visible(),'Tutorial did not advance after book merge')
                    act(page,'tile',index=5);act(page,'tile',index=6);expect(page.get_by_text('3 OF 4 · VISITOR').is_visible(),'Tutorial did not advance after dish')
                    act(page,'serve');expect(page.get_by_text('4 OF 4 · JOURNAL').is_visible(),'Tutorial did not advance after service')
                    act(page,'nav',page='journal');expect(page.get_by_text('You’re ready').is_visible(),'Tutorial did not finish in Journal');close(page)
                    expect(snap(page)['served']==1,'Tutorial did not complete a real request')
                    page.evaluate('localStorage.clear()');page.reload();page.locator('[data-action="start-without-tutorial"]').wait_for()
                act(page,'start-without-tutorial')
                act(page,'help')
                for _ in range(3): act(page,'help-next')
                close(page)
                expect(snap(page)['started'],'Welcome did not save')
                initial=snap(page)
                expect(all(q['section'] in initial['unlockedSections'] and (not q['recipe'] or q['recipe'] in initial['unlockedRecipes']) for q in initial['requests']),'Starter request requires locked content')
                expect(page.locator('.req-person p').evaluate('el=>parseFloat(getComputedStyle(el).fontSize)')>=12,'Primary phone copy is too small')
                act(page,'request-next');act(page,'request-prev');act(page,'visitor-story',index=0);close(page)
                act(page,'need-info',kind='book');close(page)
                act(page,'request-prev');act(page,'need-info',kind='dish')
                expect(page.get_by_role('heading',name='The cheese pantry').is_visible(),'Dish requirement did not open the pantry')
                expect(page.get_by_text('Wensleydale with fruitcake').is_visible(),'Pantry did not open at the requested preparation')
                expect(page.locator('[data-action="stock-recipe"]').is_enabled(),'Starter preparation could not be stocked')
                close(page);act(page,'request-next')
                # A full merge, undo, re-merge, cheese preparation and visitor service, all through controls.
                act(page,'tile',index=0);act(page,'tile',index=1)
                expect(snap(page)['board'][1]=={'kind':'book','tier':2,'section':'fiction'},'Book merge failed')
                act(page,'undo');expect(snap(page)['board'][0]['tier']==1,'Undo failed')
                act(page,'tile',index=0);act(page,'tile',index=1)
                act(page,'tile',index=5);act(page,'tile',index=6)
                expect(snap(page)['board'][6]=={'kind':'dish','id':'manchego'},'Cheese preparation failed')
                act(page,'serve');expect(snap(page)['served']==1,'Visitor not served')
                expect(snap(page)['funds']==128,'Visitor reward incorrect')
                act(page,'deliver-book');act(page,'acquire-book',section='fiction');expect(any(x and x['kind']=='book' and x['section']=='fiction' for x in snap(page)['board']),'Paid subject order missing')
                for screen in ['play','library','vault','journal']:
                    nav(page,screen);fits(page,f'{engine} {width} {screen}')
                    shot(page,OUT/f'{engine}-{width}-{screen}.png')
                # Export via browser download, then import and compare the complete state.
                act(page,'settings');act(page,'backup')
                before=snap(page)
                with page.expect_download() as pending: act(page,'export')
                download=pending.value;dest=OUT/f'{engine}-{width}-backup.json';download.save_as(dest)
                data=dest.read_text(encoding='utf-8');expect(json.loads(data)['state']==before,'Export differs from current save')
                close(page);nav(page,'play');act(page,'deliver-book');act(page,'acquire-book',section='essays');import_save(page,data)
                expect(snap(page)==before,'Import round trip changed state')
                page.reload();page.wait_for_function('()=>(window.SHELF_APP)');expect(snap(page)==before,'Reload lost state')
                # Malformed imports leave the library unchanged.
                act(page,'settings');act(page,'backup')
                page.locator('#import-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{broken'})
                page.get_by_text('That save could not be opened').wait_for()
                expect(page.get_by_text('That save could not be opened').is_visible(),'Missing import error')
                expect(snap(page)==before,'Bad import overwrote state');close(page)
                # Touch pantry and every recipe page; long content stays within the modal.
                nav(page,'play');act(page,'pantry')
                for _ in range(page.evaluate('SHELF_CONTENT.recipes.length')):
                    for tab in [1,2,0]:act(page,'recipe-tab',index=tab)
                    act(page,'pantry-next')
                act(page,'stock-recipe');expect(len([x for x in snap(page)['board'] if x])>=2,'Pantry delivery failed')
                # Use a validated import fixture to test late content without hours of setup.
                rich=fixture(page,funds=100000,served=70,unlockedSections=page.evaluate('SHELF_CONTENT.sections.map(s=>s.id)'),unlockedRecipes=page.evaluate('SHELF_CONTENT.recipes.map(r=>r.id)'),daily={'date':page.evaluate('SHELF_ENGINE.dateKey()'),'served':3,'claimed':False})
                import_save(page,rich)
                act(page,'daily');act(page,'claim-daily');expect(snap(page)['funds']==100075,'Daily reward failed')
                # A late-game seven-component preparation is assembled through real taps.
                nav(page,'play');act(page,'pantry');act(page,'pantry-prev')
                expect(page.get_by_text('7 COMPONENTS',exact=True).is_visible(),'Advanced preparation complexity missing')
                act(page,'stock-recipe')
                advanced=[i for i,x in enumerate(snap(page)['board']) if x and x.get('id')=='huancaina']
                expect(len(advanced)==7,'Seven-component pantry delivery incomplete')
                assembly=advanced[0]
                for nxt in advanced[1:]:act(page,'tile',index=assembly);act(page,'tile',index=nxt);assembly=nxt
                expect(snap(page)['board'][assembly]=={'kind':'dish','id':'huancaina'},'Seven-component preparation failed')
                nav(page,'library');act(page,'room-info');close(page)
                room_versions=[]
                act(page,'upgrade-next');act(page,'upgrade-prev')
                upgrade_count=page.evaluate('SHELF_CONTENT.upgrades.length')
                for i in range(upgrade_count):
                    fits(page,f'{engine} {width} upgrade {i}')
                    room_html=page.locator('.library-scene .room-art').inner_html()
                    room_html=re.sub(r's\d+-','s-',room_html)
                    room_html=re.sub(r'data-upgrades="[^"]*"','data-upgrades=""',room_html)
                    room_versions.append(room_html)
                    act(page,'buy');close(page)
                    if i<upgrade_count-1:act(page,'upgrade-next')
                expect(len(set(room_versions))==upgrade_count,'Upgrades did not each change the room')
                expect(len(snap(page)['upgrades'])==upgrade_count,'Upgrades not purchased')
                for theme in ['sea-glass','midnight','teal']:act(page,'theme',theme=theme);expect(snap(page)['theme']==theme,'Palette did not change')
                shot(page,OUT/f'{engine}-{width}-complete-library.png')
                nav(page,'journal')
                for i in range(page.evaluate('SHELF_CONTENT.recipes.length')):
                    fits(page,f'{engine} {width} recipe {i}')
                    act(page,'recipe-details',index=i)
                    for tab in [1,2,0]:act(page,'recipe-tab',index=tab)
                    close(page);act(page,'journal-next')
                act(page,'journal-tab',tab='books')
                for i in range(page.evaluate('SHELF_CONTENT.sections.length')):fits(page,f'{engine} {width} catalogue {i}');act(page,'journal-next')
                act(page,'journal-tab',tab='people')
                for i in range(page.evaluate('SHELF_CONTENT.visitors.length')):fits(page,f'{engine} {width} visitor {i}');act(page,'journal-next')
                act(page,'journal-tab',tab='achievements')
                for i in range(3):
                    fits(page,f'{engine} {width} milestone {i}')
                    while page.locator('[data-action="claim-achievement"]:enabled').count():
                        page.locator('[data-action="claim-achievement"]:enabled').first.click();settle(page)
                    act(page,'journal-next')
                # Daily puzzle: invalid input, physical keyboard, partial solve and win.
                nav(page,'vault');act(page,'vault-help');close(page)
                targets=snap(page)['dailyPuzzle']['targets']
                page.keyboard.type('ZZZZZZZ');page.keyboard.press('Enter');expect(len(snap(page)['dailyPuzzle']['guesses'])==0,'Invalid guess used a turn')
                for _ in range(7):act(page,'key',key='BACK')
                for char in targets[0]:act(page,'key',key=char)
                act(page,'key',key='ENTER');expect(len(snap(page)['dailyPuzzle']['guesses'])==1,'Answer not submitted')
                expect(snap(page)['dailyPuzzle']['rewarded'],'Solved word was not rewarded')
                expect(page.locator('.answer-entry').count()==1,'Missing definition after win')
                expect(snap(page)['puzzles']==1,'Puzzle win missing')
                close(page);act(page,'puzzle-result');close(page)
                act(page,'vault-mode',mode='practice');act(page,'abandon-practice');act(page,'new-practice')
                expect(snap(page)['practiceCount']==1,'Practice replacement failed')
                guesses=page.evaluate('SHELF_WORDS.answers.filter(w=>!SHELF_APP.snapshot().practicePuzzle.targets.includes(w)).slice(0,6)')
                for word in guesses:page.keyboard.type(word);page.keyboard.press('Enter');settle(page);settle(page)
                expect(page.locator('.answer-entry').count()==1,'Missing definition after loss')
                expect(len(snap(page)['practicePuzzle']['guesses'])==6,'Practice loss did not finish')
                close(page);act(page,'new-practice');expect(snap(page)['practicePuzzle']['guesses']==[],'New word not fresh')
                # Settings and accessibility controls.
                act(page,'settings')
                for setting in ['sound','motion','contrast']:act(page,'toggle-setting',setting=setting)
                expect(snap(page)['settings']=={'sound':True,'motion':False,'contrast':True},'Settings missing')
                act(page,'about');act(page,'settings');act(page,'backup');act(page,'previous-save')
                expect(page.locator('[data-action="confirm-import"]').is_visible(),'Previous-save preview missing');act(page,'backup');close(page)
                act(page,'settings');act(page,'reset-confirm');act(page,'settings');close(page)
                # Full board recovery, swapping and actual drag gesture.
                nav(page,'play');import_save(page,fixture(page,board=[{'kind':'book','tier':1} for _ in range(20)]))
                act(page,'deliver-book');expect(len([i for i in snap(page)['board'] if i])==20,'Full board changed')
                act(page,'tile',index=0);act(page,'return-item');expect(snap(page)['board'][0] is None,'Full board cannot recover')
                act(page,'tile',index=1);act(page,'selected-info');close(page);act(page,'swap');act(page,'tile',index=0)
                expect(snap(page)['board'][1] is None,'Move did not leave space')
                start=page.locator('.tile[data-index="0"]').bounding_box();end=page.locator('.tile[data-index="2"]').bounding_box()
                page.mouse.move(start['x']+start['width']/2,start['y']+start['height']/2);page.mouse.down();page.mouse.move(end['x']+end['width']/2,end['y']+end['height']/2,steps=12);page.mouse.up()
                page.wait_for_function('()=>(SHELF_APP.snapshot().board[2].tier===2)')
                expect(snap(page)['board'][2]['tier']==2,'Drag merge failed')
                # Keyboard-only merging retains focus across rerenders.
                page.locator('.tile[data-index="3"]').focus();page.keyboard.press('Enter');settle(page);page.keyboard.press('ArrowRight');page.keyboard.press('Enter');settle(page)
                expect(snap(page)['board'][4]['tier']==2,'Keyboard merge failed')
                # Registered worker, complete cache, first offline reload and navigation.
                page.evaluate('navigator.serviceWorker.ready')
                page.wait_for_function('()=>(navigator.serviceWorker.controller!==null)')
                count=page.evaluate('caches.keys().then(async names=>(await (await caches.open(names[0])).keys()).length)')
                expect(count>=12,'Offline cache incomplete')
                offline_before=snap(page)
                if engine=='chromium':context.set_offline(True)
                else:
                    # WebKit on Windows fails inside set_offline before worker dispatch.
                    # A real server outage still proves that the worker supplies the shell.
                    server.terminate();server.wait(timeout=10);server=None
                page.reload();page.wait_for_function('()=>(window.SHELF_APP)')
                expect(snap(page)==offline_before,'Offline reload lost save')
                for screen in ['play','library','vault','journal']:nav(page,screen);fits(page,f'{engine} offline {width} {screen}')
                if engine=='chromium':context.set_offline(False)
                else:server=start_server()
                # Lou at actual phone size; inspect every expression in the real scene.
                act(page,'home');act(page,'open-library');fits(page,'Scene navigation')
                for mood in ['idle','pleased','unimpressed','celebratory']:
                    page.locator('.library-scene .lou-character').evaluate('(el,m)=>el.dataset.expression=m',mood)
                    expect(page.locator(f'.library-scene .expression-{mood}').is_visible(),'Missing Lou expression '+mood)
                    shot(page,OUT/f'{engine}-{width}-lou-{mood}.png')
                page.emulate_media(reduced_motion='reduce')
                expect(page.locator('.library-scene .lou-character').evaluate('el=>getComputedStyle(el).animationName')=='none','Reduced-motion preference ignored')
                page.set_viewport_size({'width':height,'height':width});expect(page.locator('.rotate-message').is_visible(),'Landscape message missing')
                expect(not errors,f'Console errors: {errors}')
                expect(not remote,f'Unexpected runtime network: {remote}')
                print(f'PASS {engine} {width}x{height}: screens, merges, campaign controls, vault, backups, offline, expressions',flush=True)
                context.close()
            # Concurrent tabs, protected by Web Locks where supported.
            ctx=browser.new_context();a=ctx.new_page();a.goto(URL);act(a,'start-without-tutorial');close(a)
            b=ctx.new_page();b.goto(URL);b.wait_for_function('()=>(window.SHELF_APP)')
            count=lambda page:len([x for x in snap(page)['board'] if x])
            original=count(a)
            a.evaluate('document.querySelector("[data-action=deliver-book]").click()');act(a,'acquire-book',section='fiction')
            b.evaluate('document.querySelector("[data-action=deliver-book]").click()');act(b,'acquire-book',section='essays')
            a.wait_for_function('(n)=>SHELF_APP.snapshot().board.filter(Boolean).length===n',arg=original+2)
            b.wait_for_function('(n)=>SHELF_APP.snapshot().board.filter(Boolean).length===n',arg=original+2)
            expect(snap(a)==snap(b),'Tabs diverged')
            ctx.close();browser.close()
    engines=os.environ.get('SHELF_TEST_ENGINES','chromium,webkit')
    (OUT/'browser-report.json').write_text(json.dumps({'assertions':checks,'engines':engines.split(','),'viewports':[[320,667],[390,844]],'passed':True},indent=2),encoding='utf-8')
    print(f'PASS: {checks} browser assertions across {engines}; screenshots in test-results.')
finally:
    if server:server.terminate();server.wait(timeout=10)
