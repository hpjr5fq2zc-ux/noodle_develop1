# Screen inventory: captures every screen/state of the DEV app into review/img/.
# Run from the repo root:  python3 review/capture.py   (read-only: never edits the app)
import json, os, re, subprocess, sys, time, socket, urllib.request
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'review', 'img'); os.makedirs(OUT, exist_ok=True)
KEY = 'noodle-dev-v1'
_s = socket.socket(); _s.bind(('127.0.0.1', 0)); PORT = _s.getsockname()[1]; _s.close()
URL = 'http://127.0.0.1:%d/index.html' % PORT
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '-d', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: urllib.request.urlopen(URL, timeout=1); break
    except Exception: time.sleep(0.2)

META = []; MISSED = []; N = [0]
SIZES = {'portrait': (390, 844), 'landscape': (844, 390), 'small': (375, 667)}

def base_save(**kw):
    s = {'safe': {'done': True, 'areas': {}, 'care': False}, 'guideDone': True, 'profile': {'done': True, 'likes': {}, 'active': 1, 'base': 0}}
    s.update(kw); return s
def partway():
    import datetime
    log, hist = {}, {}
    today = datetime.date.today()
    fams = ['push', 'legs', 'core', 'stretch']
    for i in range(0, 12, 2):
        d = today - datetime.timedelta(days=i); k = '%d-%02d-%02d' % (d.year, d.month, d.day)
        log[k] = {'m': 12, 'f': {fams[i // 2 % 4]: 3}, 'mv': [], 'nw': []}; hist[k] = fams[i // 2 % 4]
    return base_save(levels={'push': 1, 'pull': 0, 'legs': 1, 'core': 1, 'balance': 0, 'dance': 0, 'strikes': 0, 'stretch': 1, 'mobility': 0, 'freezes': 0, 'splits': 0, 'crawls': 0, 'flow': 0},
        stones={'push': 3, 'legs': 2, 'core': 2, 'stretch': 1}, sessions=9, fb=5, tried={'Wall push-up': 1, 'Chair squat': 1}, log=log, history=hist,
        profile={'done': True, 'likes': {'push': True, 'stretch': True}, 'active': 1, 'base': 0})
def _unlock():
    s = partway(); s['levels'].update({'balance': 2, 'dance': 2}); s['seen'] = {}; return s
def _care():
    return base_save(safe={'done': True, 'areas': {'wrists': True, 'knees': True}, 'care': True})
STATES = {'unlock': _unlock(), 'care': _care(), 'clean': None, 'dayone': base_save(), 'partway': partway(), 'demo': 'DEMO'}

class Sess:
    def __init__(self, b, state, orient, calm=False, bigtext=False, size=None):
        self.state, self.orient, self.calm, self.bigtext = state, orient, calm, bigtext
        w, h = SIZES[size or orient]
        self.size = size or orient
        self.ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1.5)
        self.pg = self.ctx.new_page(); self.pg.set_default_timeout(3500)
        self.errs = []; self.pg.on('pageerror', lambda e: self.errs.append(str(e)))
        st = STATES[state]
        if st == 'DEMO': self.pg.goto(URL + '?demo=full')
        else:
            self.pg.goto(URL); self.pg.wait_for_timeout(300)
            if st is not None:
                self.pg.evaluate("([k,v])=>localStorage.setItem(k,JSON.stringify(v))", [KEY, st]); self.pg.reload()
        self.pg.wait_for_timeout(1000)
        if calm: self.set(calm=True)
    def set(self, **kw):
        self.pg.evaluate("o=>window.__noodle.setState(o)", kw); self.pg.wait_for_timeout(500)
    def shot(self, area, name, how, scroll=0):
        pg = self.pg
        if self.bigtext:
            pg.evaluate("""()=>{document.querySelectorAll('#dc-root *').forEach(e=>{const c=parseFloat(getComputedStyle(e).fontSize);if(c&&e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim()))e.style.setProperty('font-size',(c*1.3)+'px','important')})}""")
        pg.wait_for_timeout(450)
        N[0] += 1
        tag = self.orient if self.size == self.orient else self.size
        if self.calm: tag += '-calm'
        if self.bigtext: tag += '-bigtext'
        fn = '%03d-%s-%s-%s' % (N[0], area, name, tag)
        pg.screenshot(path=os.path.join(OUT, fn + '.png'))
        META.append({'file': fn, 'area': area, 'name': name, 'how': how, 'state': self.state, 'orient': tag})
        print('   shot', fn, flush=True)
    def do(self, what, fn):
        try: fn(); self.pg.wait_for_timeout(450); return True
        except Exception as e:
            MISSED.append('%s (%s, %s): %s' % (what, self.state, self.orient, str(e).splitlines()[0][:110])); return False
    def btn(self, name, exact=False, scope=None):
        loc = (self.pg.locator(scope) if scope else self.pg)
        return loc.get_by_role('button', name=name, exact=exact).first
    def tab(self, name): self.pg.get_by_role('tab', name=re.compile('^' + name + '$', re.I)).first.click()
    def close(self): self.ctx.close()

# ---------------------------------------------------------------- scenarios
def first_launch(s):
    s.shot('01-setup', 'safety-welcome', 'Fresh install: first screen, safety check sheet')
    s.do('safety Yes', lambda: s.btn('Yes', True).click()); s.shot('01-setup', 'safety-yes', 'Safety check: tapped Yes')
    s.do('safety areas', lambda: (s.btn('Wrists', True).click(), s.btn('Knees', True).click())); s.shot('01-setup', 'safety-areas-picked', 'Safety check: Wrists + Knees picked')
    s.do('lets move', lambda: s.btn("Let's move").click()); s.shot('01-setup', 'interests', "Safety check > Let's move > interests sheet")
    I = '.intro'
    s.do('interests pick', lambda: (s.btn('Strength', scope=I).click(), s.btn('Dance', scope=I).click(), s.btn('Just starting', scope=I).click()))
    s.shot('01-setup', 'interests-picked', 'Interests: Strength + Dance + Just starting')
    s.do('sounds good', lambda: s.btn('Sounds good', scope=I).click()); s.pg.wait_for_timeout(500)
    for i in range(1, 5):
        s.shot('01-setup', 'guide-%d' % i, 'Guide step %d' % i)
        if not s.do('guide next', lambda: s.pg.locator('.gd').get_by_role('button').last.click()): break
        if s.pg.locator('.gd').count() == 0: break
    s.pg.wait_for_timeout(600)

def home(s, label):
    s.shot('02-home', 'move-default', 'Move tab (default)')
    for mo in ['Morning', 'Midday', 'Main', 'Evening']:
        if s.do('moment ' + mo, lambda mo=mo: s.tab(mo)): s.shot('02-home', 'moment-' + mo.lower(), 'Move tab > ' + mo + ' tab')
    s.do('pet', lambda: s.btn('Pet Noodle').click()); s.shot('02-home', 'pet-noodle', 'Tap Noodle on Move tab (petting)')
    s.do('main', lambda: s.tab('Main'))

def workout(s):
    s.do('main', lambda: s.tab('Main'))
    if s.do('just2', lambda: s.pg.locator('.ck-tiny').click()):
        s.shot('03-workout', 'session-just2min', 'Move > Main > "Just 2 minutes"')
        s.do('back', lambda: s.btn('Back').click())
    s.do('main', lambda: s.tab('Main'))
    s.do('go', lambda: s.pg.locator('.ck-go').click())
    s.shot('03-workout', 'session-preview', 'Move > GO (session preview with swap buttons)')
    s.do('scroll', lambda: s.pg.evaluate("()=>{const e=[...document.querySelectorAll('#dc-root *')].filter(x=>x.scrollHeight>x.clientHeight+20&&getComputedStyle(x).overflowY!='visible').pop();if(e)e.scrollTop=9999}")); s.shot('03-workout', 'session-preview-scrolled', 'Session preview scrolled to the bottom')
    s.do('scrollback', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>x.scrollTop=0)"))
    if s.do('start', lambda: s.btn(re.compile('^start$', re.I)).click()):
        s.pg.wait_for_timeout(900)
        s.shot('03-workout', 'player', 'Player: timer + animation')
        if s.do('how', lambda: s.pg.get_by_text(re.compile('^(how|steps|show steps|instructions)', re.I)).first.click()): s.shot('03-workout', 'player-instructions-open', 'Player: instructions open')
        else: s.do('swipe', lambda: s.set(paused=True))
        s.set(paused=True); s.shot('03-workout', 'player-paused', 'Player: paused'); s.set(paused=False)
        s.do('next', lambda: s.btn('Next move').click()); s.pg.wait_for_timeout(500)
        s.shot('03-workout', 'player-next-move', 'Player: after Next move')
        s.set(resting=True, askFb=True, remaining=12); s.shot('03-workout', 'rest-feedback', 'Rest screen with Easy / Just right / Hard')
        s.do('fb', lambda: s.btn('Just right').click()); s.shot('03-workout', 'rest-feedback-answered', 'Rest screen after answering')
        s.set(askFb=False, fbMsg='')
        s.do('end', lambda: s.btn('End workout').click()); s.pg.wait_for_timeout(900)
        s.shot('03-workout', 'done', 'End screen (Nice work!)')
        s.do('scroll', lambda: s.pg.evaluate("()=>{const e=[...document.querySelectorAll('#dc-root *')].filter(x=>x.scrollHeight>x.clientHeight+20&&getComputedStyle(x).overflowY!='visible').pop();if(e)e.scrollTop=9999}")); s.shot('03-workout', 'done-scrolled', 'End screen scrolled')
        s.do('share', lambda: s.btn('Share this session').click()); s.shot('03-workout', 'done-share', 'End screen after tapping Share (poster)')

def paths(s):
    s.do('paths', lambda: s.btn('Paths').first.click())
    s.shot('04-paths', 'grid', 'Paths tab')
    s.do('scroll', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>{if(x.scrollHeight>x.clientHeight+20)x.scrollTop=9999})")); s.shot('04-paths', 'grid-scrolled', 'Paths tab scrolled to the bottom')
    s.do('top', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>x.scrollTop=0)"))
    if s.do('search', lambda: s.pg.locator('input').first.fill('hip')): s.shot('04-paths', 'search', 'Paths > search "hip"'); s.do('clear', lambda: s.pg.locator('input').first.fill(''))
    if s.do('quest', lambda: s.btn(re.compile('^Do it')).click()): s.shot('04-paths', 'weekly-quest-go', 'Paths > weekly quest "Do it"'); s.do('b', lambda: s.pg.go_back())
    if s.do('open push', lambda: s.btn(re.compile('^Push path')).click()):
        s.shot('04-paths', 'detail-stones', 'Path detail: Push stone trail')
        s.do('scroll', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>{if(x.scrollHeight>x.clientHeight+20)x.scrollTop=9999})")); s.shot('04-paths', 'detail-stones-scrolled', 'Path detail scrolled down the trail')
        s.do('top', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>x.scrollTop=0)"))
        if s.do('peek', lambda: s.pg.get_by_text(re.compile('harder move|peek|ahead', re.I)).first.click()): s.shot('04-paths', 'peek-harder', 'Path detail: peek at harder moves')
        if s.do('stone', lambda: s.pg.get_by_role('button', name=re.compile('^(Beginner|Easy|Starter)')).first.click()): s.shot('04-paths', 'move-detail', 'Move detail (from a stone)')
        s.do('back', lambda: s.pg.evaluate("()=>window.__noodle.setState({moveOpen:null,screen:'paths'})"))
    s.do('close', lambda: s.btn('Back to all paths').click())

def paths_hidden(s):
    # hidden path locked tile tapped, then unlocked-but-unseen (flip-in) tile
    s.do('paths', lambda: s.btn('Paths').first.click())
    s.do('tap locked', lambda: s.btn(re.compile('Freezes|Splits|Crawls|Flow footwork')).first.click()); s.shot('04-paths', 'hidden-locked-hint', 'Paths: tapping a hidden path before it unlocks (hint)')

def you(s):
    s.do('you', lambda: s.btn('You').first.click()); s.pg.wait_for_timeout(500)
    for t in ['Noodle', 'Month', 'Body', 'Moves']:
        if s.do('You ' + t, lambda t=t: s.tab(t)):
            s.shot('05-you', t.lower(), 'You > ' + t)
            s.do('scroll', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>{if(x.scrollHeight>x.clientHeight+20)x.scrollTop=9999})"))
            s.shot('05-you', t.lower() + '-scrolled', 'You > ' + t + ' scrolled down')
            s.do('top', lambda: s.pg.evaluate("()=>document.querySelectorAll('#dc-root *').forEach(x=>x.scrollTop=0)"))
    s.do('noodle tab', lambda: s.tab('Noodle'))
    if s.do('trick', lambda: s.btn('Ask Noodle to do a trick').click()): s.pg.wait_for_timeout(600); s.shot('05-you', 'noodle-trick', 'You > Noodle: asked for a trick')
    s.do('month', lambda: s.tab('Month'))
    if s.do('day', lambda: s.pg.locator('[aria-label*="day" i]').first.click()): s.shot('05-you', 'month-day-picked', 'You > Month: tapped a day')
    s.do('body', lambda: s.tab('Body'))
    if s.do('region', lambda: s.pg.locator('[aria-label="Back of body"]').click()): s.shot('05-you', 'body-back', 'You > Body: back view')
    s.do('moves', lambda: s.tab('Moves'))
    if s.do('move', lambda: s.pg.locator('button').filter(has_text=re.compile('[A-Za-z]{4}')).nth(8).click()): s.shot('05-you', 'moves-open', 'You > Moves: opened one')

def settings(s):
    s.do('you', lambda: s.btn('You').first.click())
    if not s.do('open settings', lambda: s.btn('Settings').click()): return
    s.shot('06-settings', 'top', 'You > gear icon (Settings)')
    for i, y in enumerate([400, 900, 99999], 1):
        s.do('scroll', lambda y=y: s.pg.evaluate("y=>{const e=document.querySelector('.yo-sheet');if(e)e.scrollTop=y}", y)); s.shot('06-settings', 'scroll-%d' % i, 'Settings scrolled (part %d)' % i)
    s.do('scrolltop', lambda: s.pg.evaluate("()=>{const e=document.querySelector('.yo-sheet');if(e)e.scrollTop=0}"))
    if s.do('calm', lambda: s.btn('Calm mode (less motion)').click()): s.shot('06-settings', 'calm-on', 'Settings: Calm mode switched on'); s.do('calm off', lambda: s.btn('Calm mode (less motion)').click())
    s.do('rest', lambda: s.pg.evaluate("()=>{const e=document.querySelector('.yo-sheet');if(e)e.scrollTop=99999}"))
    if s.do('backup', lambda: s.btn('Save backup').click()): s.shot('06-settings', 'backup-message', 'Settings > Save backup (message line)')
    if s.do('reset', lambda: s.pg.get_by_role('button', name=re.compile('reset|start over|erase', re.I)).first.click()): s.shot('06-settings', 'reset-armed', 'Settings > reset tapped once (asks to confirm)'); s.do('disarm', lambda: s.set(resetArm=False))

def settings_subs(s):
    for rx, nm, how in [('interests|about you|edit', 'sub-interests', 'Settings > interests editor'), ('guide|how it works|replay', 'sub-guide', 'Settings > replay the guide'), ('safety|body check', 'sub-safety', 'Settings > safety check')]:
        s.pg.reload(); s.pg.wait_for_timeout(900)
        s.do('you', lambda: s.btn('You').first.click())
        if not s.do('settings', lambda: s.btn('Settings').click()): continue
        s.do('scroll', lambda: s.pg.evaluate("()=>{const e=document.querySelector('.yo-sheet');if(e)e.scrollTop=99999}"))
        if s.do(nm, lambda: s.pg.get_by_role('button', name=re.compile(rx, re.I)).last.click()): s.shot('06-settings', nm, how)

def key(s):
    """The handful of screens used for the small-phone, Calm-mode and large-text passes."""
    s.shot('02-home', 'move-default', 'Move tab')
    s.do('go', lambda: s.pg.locator('.ck-go').click()); s.shot('03-workout', 'session-preview', 'Session preview')
    if s.do('start', lambda: s.btn(re.compile('^start$', re.I)).click()):
        s.pg.wait_for_timeout(800); s.shot('03-workout', 'player', 'Player')
        s.set(resting=True, askFb=True, remaining=12); s.shot('03-workout', 'rest-feedback', 'Rest + feedback')
        s.set(askFb=False); s.do('end', lambda: s.btn('End workout').click()); s.pg.wait_for_timeout(800); s.shot('03-workout', 'done', 'End screen')
    s.pg.reload(); s.pg.wait_for_timeout(900)
    s.do('paths', lambda: s.btn('Paths').first.click()); s.shot('04-paths', 'grid', 'Paths tab')
    if s.do('open push', lambda: s.btn(re.compile('^Push path')).click()): s.shot('04-paths', 'detail-stones', 'Path detail')
    s.pg.reload(); s.pg.wait_for_timeout(900)
    s.do('you', lambda: s.btn('You').first.click()); s.shot('05-you', 'noodle', 'You > Noodle')
    for t in ['Month', 'Body', 'Moves']:
        if s.do(t, lambda t=t: s.tab(t)): s.shot('05-you', t.lower(), 'You > ' + t)
    if s.do('settings', lambda: s.btn('Settings').click()): s.shot('06-settings', 'top', 'Settings')

def run(name, fn, b, state, orient, **kw):
    t0 = time.time(); print('==', name, state, orient, kw, flush=True)
    s = Sess(b, state, orient, **kw)
    try: fn(s)
    except Exception as e: MISSED.append('%s (%s, %s) crashed: %s' % (name, state, orient, str(e).splitlines()[0][:120]))
    for e in s.errs: MISSED.append('PAGE ERROR in %s (%s, %s): %s' % (name, state, orient, e[:120]))
    s.close(); print('   %.0fs' % (time.time() - t0), flush=True)

def offline(s):
    s.pg.wait_for_timeout(1500); s.ctx.set_offline(True); s.pg.reload(); s.pg.wait_for_timeout(1500)
    s.shot('07-states', 'offline-reload', 'Network off, page reloaded (works offline via the service worker)')

def care(s):
    s.shot('07-states', 'gentle-mode-home', 'Home with the gentle-mode note (safety check says a sore area)')
    s.do('main', lambda: s.tab('Main')); s.do('go', lambda: s.pg.locator('.ck-go').click()); s.shot('07-states', 'gentle-mode-session', 'Session preview in gentle mode')

def unlock(s):
    s.do('paths', lambda: s.btn('Paths').first.click()); s.shot('04-paths', 'hidden-unlock-banner', 'Hidden path just unlocked: banner on Paths')
    s.do('banner', lambda: s.pg.locator('[onclick]').first.click())
    s.do('open', lambda: s.pg.evaluate("()=>{const s=window.__noodle.state;const f=['freezes','splits','crawls','flow'].find(k=>true);window.__noodle.setState({pathOpen:'freezes'})}")); s.shot('04-paths', 'hidden-unlock-detail', 'Hidden path (Freezes) opened for the first time')

if __name__ == '__main__':
    only = sys.argv[1] if len(sys.argv) > 1 else ''
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            for orient in ['portrait', 'landscape']:
                if only in ('', 'a'):
                    run('first launch', first_launch, b, 'clean', orient)
                    run('home empty', lambda s: home(s, 'empty'), b, 'dayone', orient)
                    run('paths empty', paths, b, 'dayone', orient)
                    run('you empty', you, b, 'dayone', orient)
                    run('settings', lambda s: (settings(s), settings_subs(s)), b, 'dayone', orient)
                    run('offline', offline, b, 'dayone', orient)
                if only in ('', 'b'):
                    run('home partway', lambda s: home(s, 'partway'), b, 'partway', orient)
                    run('workout partway', workout, b, 'partway', orient)
                    run('paths partway', paths, b, 'partway', orient)
                    run('you partway', you, b, 'partway', orient)
                    run('unlock', unlock, b, 'unlock', orient)
                if only in ('', 'c'):
                    run('home demo', lambda s: home(s, 'demo'), b, 'demo', orient)
                    run('workout demo', workout, b, 'demo', orient)
                    run('paths demo', paths, b, 'demo', orient)
                    run('you demo', you, b, 'demo', orient)
                    run('settings demo', settings, b, 'demo', orient)
                    run('hidden locked', paths_hidden, b, 'partway', orient)
                    run('gentle mode', care, b, 'care', orient)
            if only in ('', 'd'):
                run('small phone', key, b, 'partway', 'portrait', size='small')
                run('calm portrait', key, b, 'partway', 'portrait', calm=True)
                run('calm landscape', key, b, 'partway', 'landscape', calm=True)
                run('bigtext portrait', key, b, 'partway', 'portrait', bigtext=True)
                run('bigtext small', key, b, 'partway', 'portrait', bigtext=True, size='small')
            b.close()
    finally:
        srv.terminate()
        json.dump({'shots': META, 'missed': MISSED}, open(os.path.join(ROOT, 'review', 'meta-%s.json' % (only or 'all')), 'w'), indent=1)
        print('\nshots:', len(META)); print('\n'.join('MISSED ' + m for m in MISSED))
