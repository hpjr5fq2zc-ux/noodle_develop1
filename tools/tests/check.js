// Automatic checks for Noodle. Run from the repo root:  node tools/tests/check.js
// Loads app.js with a tiny fake browser, then checks data, workouts, leveling and every screen.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; if (fails <= 40) console.log('  FAIL', msg); } };
const section = (t) => console.log('\n' + t);

// ---- fake browser ----
const store = {};
global.window = global; global.location = { href: 'https://example.test/noodle/index.html' };
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.document = { addEventListener() {}, querySelector: () => null, createElement: () => ({ click() {}, remove() {}, getContext: () => null }), body: { appendChild() {} } };
global.navigator = { userAgent: 'node', storage: null, maxTouchPoints: 0 };
global.matchMedia = () => ({ matches: false });
global.setTimeout = (f) => 0; global.clearTimeout = () => {}; global.setInterval = () => 0; global.clearInterval = () => {};
global.DCLogic = function (p) { this.props = p || {}; this.state = {}; };
DCLogic.prototype.setState = function (u) { Object.assign(this.state, typeof u === 'function' ? u(this.state) : u); };
let Comp; global.bootNoodle = (C) => { Comp = C; };
new Function(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'))();
const fresh = (extra) => { const c = new Comp({}); Object.assign(c.state, { safe: { done: true, areas: {}, care: false }, guideDone: true, profile: { done: true, likes: {}, active: 1 } }, extra || {}); return c; };

// ---- 1. move data ----
section('1. Moves, animations, instructions');
const c0 = fresh(), BK = c0.bank(), AN = c0.animRows(), CL = c0.clarify(), F = c0.fams();
const names = BK.map((m) => m.n);
ok(new Set(names).size === names.length, 'move names are unique (dupes: ' + names.filter((n, i) => names.indexOf(n) !== i).join(', ') + ')');
BK.forEach((m) => {
  ok(F[m.fam], m.n + ': family "' + m.fam + '" exists');
  ok(m.lvl >= 0 && m.lvl <= 4, m.n + ': level 0-4');
  ok(['m', 'v', 'w', 'f'].indexOf(m.role) >= 0, m.n + ': role');
  ok(m.anim && AN[m.anim], m.n + ': animation "' + m.anim + '" exists');
  ok(typeof m.rx === 'string' && m.rx.length > 0, m.n + ': has an amount');
  ok(c0.dur(m.rx) > 0, m.n + ': duration from "' + m.rx + '" is positive');
  let fig = null; try { fig = c0.figure(m.n, false, false); } catch (e) { fig = null; }
  ok(fig && fig.dur && Object.keys(fig).every((k) => !/NaN|undefined/.test(String(fig[k]))), m.n + ': figure draws with no broken numbers');
});
Object.keys(CL).forEach((n) => { ok(names.indexOf(n) >= 0, 'instructions for "' + n + '" match a real move'); ok(CL[n].length === 4 && CL[n].every((x) => x && x.length > 3), n + ': instructions have 4 parts'); });
Object.keys(AN).forEach((k) => { const a = AN[k]; ok(Array.isArray(a) && typeof a[0] === 'string' && typeof a[1] === 'string' && a[2] > 0, 'animation "' + k + '" is well formed'); });

// ---- 2. paths ----
section('2. Paths and stones');
Object.keys(F).forEach((k) => {
  const f = F[k];
  if (k === 'cond') return;
  ok(f.ladder.length >= 8, k + ': path has at least 8 stones (' + f.ladder.length + ')');
  ok(f.lvls.every((x, i) => i === 0 || x >= f.lvls[i - 1]), k + ': stones never get easier along the path');
  ok(f.lvls[0] === 0, k + ': path starts at Foundation');
  // walk the whole path one stone at a time
  const c = fresh(); let steps = 0;
  for (let i = 0; i < 40; i++) { const r = c.moveStone(k, 1); if (!r.moved) break; c.setState({ levels: r.levels, stones: r.stones }); steps++; }
  ok(steps === f.ladder.length - 1 && c.stone(k) === f.ladder.length - 1, k + ': can walk to the last stone');
  for (let i = 0; i < 40; i++) { const r = c.moveStone(k, -1); if (!r.moved) break; c.setState({ levels: r.levels, stones: r.stones }); }
  ok(c.stone(k) === 0 && (c.state.levels[k] || 0) === 0, k + ': can ease all the way back');
});

// ---- 3. workouts ----
section('3. Workouts for every kind of person');
const moments = ['main', 'morning', 'midday', 'evening', 'tiny'];
const LV = [0, 2, 4], ENERGY = [10, 50, 90], TIMES = [5, 20, 45], MOODS = ['Surprise', 'Strength', 'Dance', 'Strikes', 'Stretch', 'Chill'];
const SAFE = [{ done: true, areas: {}, care: false }, { done: true, areas: { wrists: true, knees: true }, care: false }, { done: true, areas: { back: true, shoulders: true }, care: true }];
let combos = 0;
for (const mo of moments) for (const lv of LV) for (const e of ENERGY) for (const t of TIMES) for (const mood of MOODS) for (const sf of SAFE) {
  if (mo !== 'main' && (t !== 20 || mood !== 'Surprise')) continue;
  const levels = {}; Object.keys(F).forEach((k) => { levels[k] = lv; });
  const c = fresh({ levels, energy: e, time: t, mood, safe: sf, moment: mo === 'tiny' ? 'main' : mo, tiny: mo === 'tiny', sessions: 5 });
  const tag = [mo, 'lvl' + lv, 'energy' + e, t + 'min', mood, Object.keys(sf.areas).join('+') || 'none', sf.care ? 'care' : ''].join(' ');
  let fl = []; try { fl = c.flat(); } catch (err) { ok(false, tag + ': building threw ' + err.message); continue; }
  combos++;
  ok(fl.length >= 2, tag + ': has at least 2 moves');
  ok(fl.every((m) => names.indexOf(m.n) >= 0), tag + ': every move is real');
  ok(fl.every((m) => c.safeOK(m)), tag + ': respects the safety check');
  ok(fl.every((m) => m.secs >= 15 && m.secs <= 600), tag + ': move lengths are sensible');
  const target = c.sessTime() * 60, secs = c.planSecs(c.plan());
  ok(secs >= target * 0.6 && secs <= target * 1.5, tag + ': length ' + Math.round(secs / 60) + ' min is close to ' + c.sessTime() + ' min');
}
console.log('  built ' + combos + ' workouts');

// ---- 4. every screen renders ----
section('4. Every screen renders');
const tryRender = (tag, st) => { const c = fresh(st); let v; try { v = c.renderVals(); } catch (e) { ok(false, tag + ': ' + e.message); return; } ok(v && typeof v === 'object', tag); };
['checkin', 'session', 'player', 'done', 'paths', 'you'].forEach((sc) => tryRender('screen ' + sc, { screen: sc }));
['morning', 'midday', 'main', 'evening'].forEach((mo) => tryRender('check-in ' + mo, { screen: 'checkin', moment: mo }));
Object.keys(F).forEach((k) => tryRender('path ' + k, { screen: 'paths', pathOpen: k, sessions: 10 }));
[0, 1, 2, 3].forEach((p) => tryRender('You panel ' + p, { screen: 'you', yPanel: p }));
tryRender('settings', { screen: 'you', settingsOpen: true });
tryRender('first launch', { safe: { done: false, areas: {}, care: null }, profile: { done: false, likes: {} } });
names.forEach((n) => tryRender('move card ' + n, { screen: 'move', moveOpen: n }));
[0, 1, 2, 3, 6].forEach((i) => tryRender('player step ' + i, { screen: 'player', idx: i, resting: i % 2 === 1 }));

// ---- 5. release hygiene ----
section('5. Files');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const vs = new Set((html.match(/\?v=\d+/g) || []));
ok(vs.size === 1, 'index.html uses one version number for its scripts');
if (fs.existsSync(path.join(ROOT, 'gallery.html'))) { const g = fs.readFileSync(path.join(ROOT, 'gallery.html'), 'utf8'); ok([...vs][0] && g.indexOf([...vs][0]) >= 0, 'gallery.html uses the same version'); }
ok(html.indexOf('fonts.googleapis') < 0, 'no Google Fonts (font is bundled)');
(sw.match(/'[^']+\.(js|html|png|woff2|webmanifest)'/g) || []).forEach((f) => { const p = f.slice(1, -1); ok(fs.existsSync(path.join(ROOT, p)), 'offline file exists: ' + p); });

console.log('\n' + (fails ? 'FAILED: ' + fails + ' problems, ' : 'ALL GOOD: ') + passes + ' checks passed');
process.exit(fails ? 1 : 0);
