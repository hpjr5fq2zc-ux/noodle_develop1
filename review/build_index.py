# Compresses review/img/*.png (<300 KB each) and writes review/index.html + review/screens.md from review/meta-all.json
import json, os, collections
from PIL import Image
R = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(R, 'img')
meta = json.load(open(os.path.join(R, 'meta-all.json')))
shots = meta['shots']; missed = meta['missed']
for s in shots:
    p = os.path.join(IMG, s['file'] + '.png')
    if not os.path.exists(p): s['ext'] = None; continue
    im = Image.open(p).convert('RGB'); s['ext'] = 'png'
    im.quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(p, optimize=True)
    if os.path.getsize(p) > 300 * 1024:
        j = os.path.join(IMG, s['file'] + '.jpg'); q = 82
        while True:
            im.save(j, quality=q, optimize=True)
            if os.path.getsize(j) <= 300 * 1024 or q < 40: break
            q -= 8
        os.remove(p); s['ext'] = 'jpg'
shots = [s for s in shots if s['ext']]
AREAS = {'01-setup': 'First launch and setup', '02-home': 'Move tab (Home)', '03-workout': 'A whole workout', '04-paths': 'Paths', '05-you': 'You (Noodle, Month, Body, Moves)', '06-settings': 'Settings and sub-screens', '07-states': 'Other states (offline, gentle mode)'}
STATE = {'clean': 'Clean save (first launch)', 'dayone': 'Day-one user: setup done, no history', 'partway': 'Partway user: 9 sessions, a few stones, 6 days of history', 'demo': 'Fully unlocked demo (?demo=full)', 'unlock': 'Partway user with a hidden path just unlocked', 'care': 'Day-one user with the gentle-mode (care) safety setting'}
def label(s): return s['orient']
by = collections.OrderedDict((a, []) for a in AREAS)
for s in shots: by.setdefault(s['area'], []).append(s)
h = ['<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Noodle screen inventory</title>',
'<style>body{font:15px/1.4 system-ui,sans-serif;margin:0;padding:20px;background:#f4f1ea;color:#161616}h1{font-size:34px;margin:0 0 6px}h2{margin:34px 0 10px;border-top:4px solid #161616;padding-top:10px}',
'.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;align-items:start}.c{background:#fff;border:2px solid #161616;padding:6px}.c img{width:100%;display:block;border:1px solid #ddd}.c b{display:block;margin-top:6px;font-size:13px}.c small{color:#595959;font-size:11px;display:block}',
'.w{grid-column:span 2}.f{margin:8px 0;display:flex;gap:6px;flex-wrap:wrap}.f button{border:2px solid #161616;background:#fff;padding:6px 10px;font-weight:700;cursor:pointer}.f button.on{background:#1556C2;color:#fff}a{color:#1556C2}</style>',
'<h1>Noodle screen inventory</h1><p>%d screenshots of the DEV app. Tap a picture to see it full size. See <a href="screens.md">screens.md</a> for how to reach each one.</p>' % len(shots),
'<div class="f" id="f"></div>']
for a, lst in by.items():
    if not lst: continue
    h.append('<h2>%s <small>(%d)</small></h2><div class="g">' % (AREAS.get(a, a), len(lst)))
    for s in lst:
        wide = 'landscape' in s['orient']
        h.append('<div class="c%s" data-o="%s" data-s="%s"><a href="img/%s.%s"><img loading="lazy" src="img/%s.%s" alt="%s"></a><b>%s</b><small>%s · %s</small></div>' % (' w' if wide else '', s['orient'], s['state'], s['file'], s['ext'], s['file'], s['ext'], s['name'], s['name'], STATE[s['state']].split(':')[0], s['orient']))
    h.append('</div>')
if missed:
    h.append('<h2>Not captured / problems</h2><ul>' + ''.join('<li>%s</li>' % m for m in missed) + '</ul>')
h.append('''<script>var f=document.getElementById('f'),cs=[].slice.call(document.querySelectorAll('.c')),o={};
function add(k,vals){vals.forEach(function(v){var b=document.createElement('button');b.textContent=v;b.onclick=function(){o[k]=o[k]===v?null:v;[].forEach.call(f.children,function(x){x.className=(o[x.dataset.k]===x.textContent)?'on':''});cs.forEach(function(c){var ok=true;for(var q in o){if(o[q]&&c.dataset[q]!==o[q]&&!(q==='o'&&c.dataset.o.indexOf(o[q])===0))ok=false}c.style.display=ok?'':'none'})};b.dataset.k=k;f.appendChild(b)})}
var u=function(a){return a.filter(function(v,i){return a.indexOf(v)===i})};
add('o',u(cs.map(function(c){return c.dataset.o}))); add('s',u(cs.map(function(c){return c.dataset.s})))</script>''')
open(os.path.join(R, 'index.html'), 'w').write('\n'.join(h))
m = ['# Noodle screen inventory', '', 'Captured from the DEV app by `review/capture.py` (read-only; no app files changed). %d screenshots in `review/img/`.' % len(shots), '',
'**Save states used**', ''] + ['- `%s`: %s' % (k, v) for k, v in STATE.items()] + ['', '**Sizes**: portrait 390x844, landscape 844x390, small phone 375x667. Suffix `-calm` = Calm mode on. Suffix `-bigtext` = text enlarged 30% (simulated, see notes).', '']
for a, lst in by.items():
    if not lst: continue
    m += ['## ' + AREAS.get(a, a), '', '| Image | Screen | How to reach it | Save state | Orientation |', '|---|---|---|---|---|']
    for s in lst: m.append('| %s.%s | %s | %s | %s | %s |' % (s['file'], s['ext'], s['name'], s['how'], s['state'], s['orient']))
    m.append('')
m += ['## Not captured / problems', ''] + (['- ' + x for x in missed] or ['- none'])
open(os.path.join(R, 'screens.md'), 'w').write('\n'.join(m) + '\n')
print(len(shots), 'shots; max size KB', max(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG)) // 1024)
