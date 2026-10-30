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


// ---- 6. comfort stages, hide settings and saved data (batch 1 of v2: the safety net) ----
section('6. Stages, doorway stones and old saves');
const visibleFams = Object.keys(F).filter((k) => k !== 'cond' && !F[k].hidden);
// every visible path has something doable at every comfort stage, also with a sore area or gentle mode
const SORE = [{}, { wrists: true }, { knees: true }, { back: true }, { shoulders: true }];
visibleFams.forEach((k) => {
  for (let stage = 1; stage <= 4; stage++) for (const sf of SORE) for (const care of [false, true]) {
    const c = fresh({ safe: { done: true, areas: sf, care } });
    const doable = F[k].ladder.map((n) => BK.find((m) => m.n === n)).filter((m) => m && c.stageOK(m, stage) && c.safeOK(m));
    // known gap: every push-up variant loads the wrists, so with sore wrists the Push path has no safe stone. The stage rules (next batch) must hide it for those users.
    if (k === 'push' && sf.wrists) { ok(doable.length === 0, 'known gap (expected): Push has no doable stone with sore wrists'); continue; }
    ok(doable.length >= 1, k + ': a doable stone at stage ' + stage + (care ? ' (gentle)' : '') + (Object.keys(sf).length ? ' with ' + Object.keys(sf)[0] + ' sore' : ''));
  }
  ok(c0.pos(BK.find((m) => m.n === F[k].ladder[0])) === 'up', k + ': first stone is a standing, wall or chair move (no floor)');
});
// every Home session still builds for each stage, gentle on and off, and with one whole family hidden (the stage and hide rules are wired in later; this guards them)
const HIDE = [null].concat(visibleFams);
let sc = 0;
for (let stage = 1; stage <= 4; stage++) for (const care of [false, true]) for (const hide of HIDE) for (const mo of ['main', 'morning', 'midday', 'evening']) {
  const hidden = { fams: {}, moves: {} }; if (hide) hidden.fams[hide] = true;
  const c = fresh({ stage, hidden, safe: { done: true, areas: {}, care }, moment: mo, sessions: 5 });
  const tag = 'stage ' + stage + (care ? ' gentle' : '') + ' ' + mo + (hide ? ' hiding ' + hide : '');
  let fl = []; try { fl = c.flat(); } catch (err) { ok(false, tag + ': building threw ' + err.message); continue; }
  if (hide && !['mobility', 'stretch', 'cond'].includes(hide)) ok(fl.every((m) => m.fam !== hide), tag + ': hidden family does not appear');
  if (stage === 1) ok(fl.every((m) => ['mobility', 'stretch', 'cond'].includes(m.fam) || c.stageOK(m, 1) || m.fam === hide), tag + ': stage 1 keeps to standing, wall and chair moves outside warm-up and cool-down');
  if (stage === 1 && !care && !hide && mo === 'main') ok(c.stageNow() === 1, 'stageNow reads the saved stage');
  sc++; ok(fl.length >= 2, tag + ': session has at least 2 moves'); ok(fl.every((m) => c.safeOK(m)), tag + ': session respects the safety check');
}
console.log('  built ' + sc + ' stage and hide sessions');
{
  const c1 = fresh({ stage: 4, sessions: 5, moment: 'main' }); const first = c1.flat().find((m) => !['mobility', 'stretch', 'cond'].includes(m.fam));
  const c2 = fresh({ stage: 4, sessions: 5, moment: 'main', hidden: { fams: {}, moves: { [first.n]: true } } });
  ok(!c2.flat().some((m) => m.n === first.n), 'a hidden move is left out of the session (' + first.n + ')');
  ok(c2.flat().length >= 2, 'session still builds with a move hidden');
}
// an old save (before the ladder change) loads and keeps each saved stone on the same move
{
  const oldStones = { core: 4, legs: 2, pull: 3, push: 5, dance: 7 };
  const m0 = new Comp({}); const got = m0.migrateSave({ stones: Object.assign({}, oldStones), levels: { core: 1 } });
  ok(F.core.ladder[got.stones.core] === 'Plank', 'old save: core stone stays on Plank');
  ok(F.legs.ladder[got.stones.legs] === 'Chair squat', 'old save: legs stone stays on Chair squat');
  ok(F.pull.ladder[got.stones.pull] === 'Towel isometric pull', 'old save: pull stone stays on Towel isometric pull');
  ok(got.stones.push === 5 && got.stones.dance === 7, 'old save: unchanged paths keep their stones');
  ok(got.ladV === 2, 'old save is marked as migrated');
  const again = m0.migrateSave(JSON.parse(JSON.stringify(got)));
  ok(JSON.stringify(again.stones) === JSON.stringify(got.stones), 'a migrated save is not migrated twice');
  const noStones = m0.migrateSave({ levels: {} }); ok(noStones.ladV === 2, 'old save with no stones still loads');
  store['noodle-dev-v1'] = JSON.stringify({ stones: oldStones, levels: { push: 1, core: 1 }, sessions: 4, safe: { done: true, areas: {}, care: false }, guideDone: true, profile: { done: true, likes: {}, active: 1 } });
  const lc = new Comp({}); let thrown = null; try { lc.componentDidMount(); } catch (e) { thrown = e; }
  ok(!thrown, 'an old saved file loads without errors'); ok(F.core.ladder[lc.stone('core')] === 'Plank' && lc.state.sessions === 4, 'an old saved file keeps its place after loading');
  delete store['noodle-dev-v1'];
}

// ---- 7. report only: lookalike animations and joint limits (listed, never failing) ----
// ---- 8. the Move screen: where are you, length, quiet, easier, evening without floor ----
section('8. Move screen options');
{
  let n = 0;
  for (const where of [null, 'bed', 'desk', 'floor', 'standing', 'out']) for (const len of ['2', '5', 'full']) for (const mo of ['morning', 'midday', 'main', 'evening']) for (const stage of [1, 3]) for (const quiet of [false, true]) {
    const c = fresh({ stage, where, len, tiny: len === '2', quiet, moment: mo, sessions: 5 });
    const tag = [where || 'anywhere', len, mo, 'stage ' + stage, quiet ? 'quiet' : ''].join(' ');
    let fl = []; try { fl = c.flat(); } catch (err) { ok(false, tag + ': threw ' + err.message); continue; }
    n++; ok(fl.length >= 2, tag + ': at least 2 moves'); if (quiet) ok(fl.every((m) => c.quietOK(m)), tag + ': quiet leaves out loud moves');
    if (len === '5') ok(c.planSecs(c.plan()) <= 5 * 60 * 1.3, tag + ': about 5 minutes (' + c.planSecs(c.plan()) + ' s)');
  }
  console.log('  built ' + n + ' option combinations');
  for (const stage of [1, 2]) { const c = fresh({ stage, moment: 'evening', sessions: 5 }); const fl = c.flat(); ok(fl.length >= 3 && fl.every((m) => c.pos(c.moveInfo()[m.n]) === 'up'), 'evening at stage ' + stage + ' has no floor moves (' + fl.map((m) => m.n + ':' + c.pos(c.moveInfo()[m.n])).join(', ') + ')'); }
  // Easier swaps the move for the next easier one in its family, for this session only
  const c = fresh({ stage: 4, moment: 'main', sessions: 5 }); const m0 = c.flat().find((m) => c.easierOf(m.n));
  if (m0) { const e = c.easierOf(m0.n); c.state.subs = { [m0.id]: e }; c._pk = null; ok(c.flat().some((m) => m.id === m0.id && m.n === e), 'Easier swaps ' + m0.n + ' for ' + e); }
  // time of day
  const t0 = global.Date; const at = (h) => { global.Date = class extends t0 { constructor(...a) { if (a.length) super(...a); else super(2026, 5, 10, h, 0, 0); } }; return fresh({}).moment(); };
  const r = [at(7), at(12), at(16), at(22), at(3)]; global.Date = t0;
  ok(r.join() === 'morning,midday,main,evening,evening', 'session by time of day (' + r.join() + ')');
}

section('7. Report only (does not fail the checks)');
{
  const byAnim = {}; BK.forEach((m) => { (byAnim[m.anim] = byAnim[m.anim] || new Set()).add(m.fam); });
  const looks = Object.keys(byAnim).filter((a) => byAnim[a].size > 1).map((a) => a + ' (' + [...byAnim[a]].join('+') + ')');
  { const c = fresh({}); const q = BK.filter((m) => !c.quietOK(m)).map((m) => m.n); console.log('  Quiet option leaves out ' + q.length + ' moves: ' + q.join(', ')); }
  console.log('  Animations shared across families: ' + (looks.length ? looks.length + ' -> ' + looks.join(', ') : 'none'));
  const P = (s) => { const d = {}; (s.match(/[A-Za-z]-?[\d.]+,-?[\d.]+/g) || []).forEach((x) => { const [px, py] = x.slice(1).split(',').map(Number); d[x[0]] = [px, py]; }); return d; };
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const BONES = [['N', 'E', 'upper arm'], ['E', 'W', 'forearm'], ['P', 'K', 'thigh'], ['K', 'F', 'shin'], ['N', 'e', 'upper arm (far)'], ['e', 'w', 'forearm (far)'], ['P', 'k', 'thigh (far)'], ['k', 'f', 'shin (far)']];
  const probs = [];
  Object.keys(AN).forEach((k) => {
    const poses = [AN[k][0], AN[k][1], typeof AN[k][2] === 'string' ? AN[k][2] : null].filter(Boolean).map(P);
    BONES.forEach(([a, b, nm]) => { const L = poses.filter((d) => d[a] && d[b]).map((d) => dist(d[a], d[b])); if (L.length > 1) { const lo = Math.min(...L), hi = Math.max(...L); if (lo > 3 && hi / lo > 1.3) probs.push(k + ': ' + nm + ' changes length (' + lo.toFixed(0) + ' to ' + hi.toFixed(0) + ')'); } });
    poses.forEach((d, i) => { if (d.H && d.P && d.K && d.F && Math.abs(d.P[1] - d.F[1]) > 2 * Math.abs(d.P[0] - d.F[0]) && d.H[1] < d.P[1]) { const face = Math.sign((d.N ? d.N[0] : d.H[0]) - d.P[0]) || 0; const t = (d.K[1] - d.P[1]) / (d.F[1] - d.P[1] || 1), lx = d.P[0] + t * (d.F[0] - d.P[0]); if (face && (d.K[0] - lx) * face < -4) probs.push(k + ': knee may bend backward in pose ' + (i + 1)); } });
  });
  console.log('  Joint-limit notes: ' + (probs.length ? probs.length + '\n    ' + probs.join('\n    ') : 'none'));
}

console.log('\n' + (fails ? 'FAILED: ' + fails + ' problems, ' : 'ALL GOOD: ') + passes + ' checks passed');
process.exit(fails ? 1 : 0);
