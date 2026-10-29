# Taps through the real app in a browser (portrait + landscape) and fails on any error.
# Run from the repo root:  python3 tools/tests/smoke.py
import json, os, re, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
html = open(os.path.join(ROOT, 'app.js')).read()
KEY = re.search(r"localStorage\.getItem\('([^']+)'\)", html).group(1)
import socket, urllib.request
_s = socket.socket(); _s.bind(('127.0.0.1', 0)); PORT = _s.getsockname()[1]; _s.close()
URL = 'http://127.0.0.1:%d/index.html' % PORT
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '-d', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: urllib.request.urlopen(URL, timeout=1); break
    except Exception: time.sleep(0.2)
problems = []
def step(pg, what, fn):
    print('  -', what, flush=True)
    try: fn(); pg.wait_for_timeout(400)
    except Exception as e:
        problems.append(f'{what}: {str(e).splitlines()[0]}')
        try: pg.screenshot(path=os.path.join(ROOT, 'tools', 'tests', 'last-fail.png'))
        except Exception: pass
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in [(390, 844), (844, 390)]:
            pg = b.new_page(viewport={'width': w, 'height': h}); errs = []; pg.set_default_timeout(4000)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(URL); pg.wait_for_timeout(800)
            # first launch: safety check + interests
            step(pg, 'safety check', lambda: (pg.get_by_role('button', name='No', exact=True).click(), pg.get_by_role('button', name="Let's move").click()))
            step(pg, 'interests', lambda: (pg.locator('.intro').get_by_role('button', name=re.compile('Strength')).first.click(), pg.locator('.intro').get_by_role('button', name=re.compile('Just starting')).first.click(), pg.locator('.intro').get_by_role('button', name='Sounds good').click()))
            for _ in range(5): pg.keyboard.press('Escape')
            pg.evaluate("v=>{const o=JSON.parse(localStorage.getItem(v)||'{}');o.guideDone=true;localStorage.setItem(v,JSON.stringify(o))}", KEY); pg.reload(); pg.wait_for_timeout(800)
            for mo in ['Morning', 'Midday', 'Evening', 'Main']:
                step(pg, 'moment ' + mo, lambda mo=mo: pg.get_by_role('tab', name=mo).click())
            step(pg, 'build session', lambda: pg.locator('.ck-go').click())
            step(pg, 'start player', lambda: pg.get_by_role('button', name=re.compile('^start$', re.I)).click())
            step(pg, 'next move', lambda: pg.get_by_role('button', name='Next move').click())
            step(pg, 'answer how it felt', lambda: [pg.get_by_role('button', name='Just right').first.click() for _ in [0] if pg.get_by_role('button', name='Just right').count()])
            step(pg, 'end workout', lambda: pg.get_by_role('button', name='End workout').click())
            pg.goto(URL); pg.wait_for_timeout(800)
            step(pg, 'just 2 minutes', lambda: pg.locator('.ck-tiny').click())
            pg.goto(URL); pg.wait_for_timeout(800)
            step(pg, 'paths tab', lambda: pg.get_by_role('button', name='Paths').first.click())
            step(pg, 'open Push path', lambda: pg.get_by_role('button', name=re.compile('^Push path')).click())
            step(pg, 'next stone', lambda: pg.get_by_role('button', name=re.compile('Next stone')).click())
            step(pg, 'open a move', lambda: pg.get_by_role('button', name=re.compile('^Beginner')).first.click())
            pg.goto(URL); pg.wait_for_timeout(800)
            step(pg, 'you tab', lambda: pg.get_by_role('button', name='You').first.click())
            for t in ['Month', 'Body', 'Moves', 'Noodle']:
                step(pg, 'You ' + t, lambda t=t: pg.get_by_role('tab', name=t).click())
            step(pg, 'settings', lambda: pg.locator('[aria-label*="ettings"]').first.click())
            if errs: problems += [f'{w}x{h} page error: {e}' for e in errs]
            pg.close()
        b.close()
finally:
    srv.terminate()
print('\n'.join('  FAIL ' + x for x in problems) or '  no problems')
print('SMOKE ' + ('FAILED' if problems else 'ALL GOOD'))
sys.exit(1 if problems else 0)
