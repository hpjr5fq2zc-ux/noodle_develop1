
// Keys saved to the phone, backed up and restored. ladV = which version of the path ladders the saved stones refer to.
const KEEP = ['levels', 'stones', 'history', 'log', 'rest', 'seenTricks', 'safe', 'chBonus', 'guideDone', 'sessions', 'profile', 'tried', 'seen', 'fb', 'calm', 'sound', 'chatter', 'time', 'energy', 'mood', 'ladV'];
const LAD_VERSION = 2;
// The ladders as they were at ladV 1: only the paths that changed. Used to keep a saved stone on the same move.
const LAD_V1 = {
  pull: ['Prone Y-T-W raises', 'Superman hold', 'Towel pull-apart', 'Towel isometric pull'],
  legs: ['Glute bridge', 'Calf raise', 'Chair squat', 'Wall sit'],
  core: ['Dead bug', 'Bird-dog', 'Knee plank', 'Knee side plank', 'Plank', 'Tucked hollow hold', 'Bear plank shoulder taps', 'Side plank', 'Plank shoulder taps', 'Hollow hold', 'Hollow rocks', 'Tuck L-sit on chairs', 'One-leg L-sit on chairs', 'L-sit']
};

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { ladV: LAD_VERSION, hint: '', seen: {}, levels: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, dance: 0, strikes: 0, stretch: 0, mobility: 0, freezes: 0, splits: 0, crawls: 0, flow: 0 }, stones: {}, fb: 0, pathOpen: null, celebrate: false, moveOpen: null, moveFrom: 'session', query: '', tried: {}, history: {}, log: {}, safe: { done: false, areas: {}, care: null }, guideDone: false, guideStep: 0, sessions: 0, profile: { done: false, likes: {}, active: null }, peek: null, lvAtStart: 0, doneNote: '', doneFace: 'grin', rest: 15, seenTricks: {}, trickN: 0, trickName: '', selDay: null, bodySide: 'f', region: null, settingsOpen: false, resetArm: false, setMsg: '', collectHint: '', focus: null, triedAtStart: {}, calm: false, sound: true, chatter: true, resting: false, askFb: false, fbMsg: '', phrase: 0, visited: false, pets: 0, homePets: 0, petting: false, screen: 'checkin', time: 20, energy: 50, mood: 'Surprise', seed: 0, swaps: {}, idx: 0, remaining: 0, paused: false, expanding: false, expandColor: '#1556C2' };
  }
  componentDidMount() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
    const unlock = () => { this.ensureAudio(); };
    ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));
    this.timer = setInterval(() => this.tick(), 1000);
    try { this.demo = /[?&]demo=full/.test(location.search); } catch (e) {}
    if (this.demo) { this.setState(this.demoState()); return; }
    try { const raw = localStorage.getItem(this.demo ? 'noodle-demo-full' : 'noodle-dev-v1'); if (raw) { const o = JSON.parse(raw); const keep = {}; KEEP.forEach((k) => { if (o[k] !== undefined) keep[k] = o[k]; }); if (keep.history) keep.history = this.cleanHistory(keep.history); if (keep.levels) keep.levels = Object.assign({}, this.state.levels, keep.levels); this.migrateSave(keep); this.setState(keep); } } catch (e) {}
  }
  componentDidUpdate() {
    const s = this.state;
    try { const o = {}; KEEP.forEach((k) => { o[k] = s[k]; }); const str = JSON.stringify(o); if (str !== this._saved) { localStorage.setItem(this.demo ? 'noodle-demo-full' : 'noodle-dev-v1', str); this._saved = str; } } catch (e) {}
    const want = s.screen === 'player' && !s.paused;
    try {
      if (want && !this.lock && !this.locking && navigator.wakeLock) { this.locking = true; navigator.wakeLock.request('screen').then((l) => { this.lock = l; this.locking = false; l.addEventListener('release', () => { this.lock = null; }); }).catch(() => { this.locking = false; }); }
      if (!want && this.lock) { this.lock.release().catch(() => {}); this.lock = null; }
    } catch (e) {}
  }
  ensureAudio() {
    try {
      // iPhone: mix with the user's music instead of stopping it
      if (navigator.audioSession && navigator.audioSession.type !== 'ambient') navigator.audioSession.type = 'ambient';
      if (!this.ac) {
        this.ac = new (window.AudioContext || window.webkitAudioContext)();
        const comp = this.ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4;
        this.master = this.ac.createGain(); this.master.gain.value = 1;
        this.master.connect(comp); comp.connect(this.ac.destination);
      }
      if (this.ac.state !== 'running') this.ac.resume();
      if (!this.unlocked) { // iOS needs a sound started inside a tap before any later sound can play
        const b = this.ac.createBuffer(1, 1, 22050), src = this.ac.createBufferSource(); src.buffer = b; src.connect(this.ac.destination); src.start(0);
        this.unlocked = true;
      }
    } catch (e) {}
  }
  tone(f, t, d, type, vol, f2) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.min(0.7, (vol || 0.2) * 2.4), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master || ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  sfx(name) {
    if (!this.state.sound) return;
    if (!this.ac) this.ensureAudio();
    if (!this.ac) return;
    if (this.ac.state !== 'running') { try { this.ac.resume(); } catch (e) {} }
    try {
      const t = this.ac.currentTime + 0.01, T = (f, dt, d, ty, v, f2) => this.tone(f, t + dt, d, ty, v, f2);
      if (name === 'tick') T(1250, 0, 0.06, 'triangle', 0.16);
      if (name === 'start') { T(523, 0, 0.16, 'triangle', 0.2); T(659, 0.09, 0.16, 'triangle', 0.2); T(784, 0.18, 0.3, 'triangle', 0.22); }
      if (name === 'done') { T(660, 0, 0.14, 'sine', 0.22); T(990, 0.1, 0.3, 'sine', 0.2); }
      if (name === 'go') { T(880, 0, 0.1, 'triangle', 0.2); T(1320, 0.08, 0.22, 'triangle', 0.2); }
      if (name === 'level') { [523, 659, 784, 1047].forEach((f, i) => T(f, i * 0.07, 0.22, 'square', 0.07)); T(1568, 0.3, 0.4, 'sine', 0.15); }
      if (name === 'finish') { [523, 659, 784].forEach((f, i) => T(f, i * 0.11, 0.2, 'triangle', 0.2)); T(1047, 0.33, 0.6, 'triangle', 0.24); T(523, 0.33, 0.6, 'sine', 0.12); }
      if (name === 'bark') { T(620, 0, 0.09, 'sawtooth', 0.08, 300); T(700, 0.15, 0.1, 'sawtooth', 0.08, 320); }
      if (name === 'pop') T(900, 0, 0.08, 'sine', 0.14, 1400);
    } catch (e) {}
  }
  beep(freq, dur) {
    if (!this.state.sound || !this.ac) return;
    try { const o = this.ac.createOscillator(), g = this.ac.createGain(), t0 = this.ac.currentTime; o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(this.ac.destination); o.start(t0); o.stop(t0 + dur + 0.05); } catch (e) {}
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.tt); clearTimeout(this.pt); clearTimeout(this.ct); }
  cleanHistory(h) {
    // remove the demo days the early version pre-filled
    const keys = ['push', 'dance', 'stretch', 'legs', 'strikes', 'core', 'mobility', 'pull', 'balance'], out = {};
    Object.keys(h || {}).forEach((k) => { const d = +k.split('-')[2]; const fake = (d * 7 + 3) % 10 < 6 && h[k] === keys[(d * 5) % 9]; if (!fake) out[k] = h[k]; });
    return out;
  }
  dayKey(dt) { dt = dt || new Date(); return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate(); }
  dayLog(k) {
    const s = this.state;
    if (s.log && s.log[k]) return s.log[k];
    if (s.history && s.history[k]) { const f = {}; f[s.history[k]] = 1; return { m: 0, f, mv: [], nw: [] }; }
    return null;
  }
  logSession(moves) {
    if (!moves.length) return;
    const s = this.state, MI = this.moveInfo(), F = this.fams(), k = this.dayKey();
    const prev = (s.log && s.log[k]) || this.dayLog(k) || { m: 0, f: {}, mv: [], nw: [] };
    const e = { m: prev.m, f: Object.assign({}, prev.f), mv: prev.mv.slice(), nw: prev.nw.slice() };
    let secs = 0;
    moves.forEach((mv) => {
      secs += mv.secs || 0;
      const mi = MI[mv.n]; if (mi && F[mi.fam] && mi.fam !== 'cond') e.f[mi.fam] = (e.f[mi.fam] || 0) + 1;
      if (e.mv.indexOf(mv.n) < 0) e.mv.push(mv.n);
      if (!s.triedAtStart[mv.n] && e.nw.indexOf(mv.n) < 0) e.nw.push(mv.n);
    });
    e.m += Math.max(1, Math.round(secs / 60));
    const log = Object.assign({}, s.log); log[k] = e;
    let top = null; Object.keys(e.f).forEach((x) => { if (!top || e.f[x] > e.f[top]) top = x; });
    const history = Object.assign({}, s.history); if (top) history[k] = top;
    this.setState({ log, history });
  }
  // Old saves point at stones by number. When a path's ladder changes, move each saved stone to the same move.
  migrateSave(keep) {
    if ((keep.ladV || 1) >= LAD_VERSION) return keep;
    if (keep.stones) {
      const F = this.fams(), stones = Object.assign({}, keep.stones);
      Object.keys(LAD_V1).forEach((k) => {
        const i = stones[k]; if (i === undefined || i === null || !F[k]) return;
        const nm = LAD_V1[k][i]; if (!nm) return;
        const ni = F[k].ladder.indexOf(nm); if (ni >= 0) stones[k] = ni;
      });
      keep.stones = stones;
    }
    keep.ladV = LAD_VERSION; return keep;
  }
  // Where a move is done: 'floor' (lying, kneeling, hands on the floor, upside down) or 'up' (standing, wall, chair, bed edge).
  pos(m) {
    const n = m.n || '', an = m.anim || 'stand';
    if (/^Doorframe row/.test(n)) return 'up';
    if (/desk row|Desk row|Under-desk|Scapular desk|One-arm row/.test(n)) return 'floor';
    const FLOOR = ['deadbug', 'birddog', 'plank', 'sideplank', 'kneepush', 'pushup', 'handrelease', 'decline', 'pike', 'ytw', 'superman', 'glutebridge', 'hollow', 'hollowtuck', 'hollowrock', 'lsit', 'bear', 'crab', 'childpose', 'butterfly', 'seatedfold', 'happybaby', 'twistlie', 'catcow', 'pelvictilt', 'pigeon', 'split', 'halfsplit', 'wheel', 'bridge', 'cobra', 'kneel', 'downdog', 'mountain', 'burpee', 'shouldertap', 'frogstand', 'handstand', 'headstand', 'tripodrest', 'tucktripod', 'hsfreeze', 'freeze', 'chairfreeze', 'turtle', 'legup', 'boat', 'lowlunge', 'pikebed', 'wallwalk', 'onearm', 'wristrock', 'sixstep', 'godown', 'hip9090', 'deepsquat', 'row'];
    return FLOOR.indexOf(an) >= 0 ? 'floor' : 'up';
  }
  // Test hook for comfort stages (the stage rules are wired into planning in the next batch). 1 = no floor and Foundation only, 4 = everything.
  stageOK(m, stage) {
    const st = stage || 4, mi = this.moveInfo()[m.n]; if (!mi) return true;
    if (st >= 4) return true;
    if (st === 1) return mi.lvl === 0 && this.pos(mi) === 'up';
    if (st === 2) return mi.lvl <= 1;
    return mi.lvl <= 2 || mi.fam === 'dance' || mi.fam === 'flow';
  }
  safeOK(m) {
    const sf = this.state.safe || {}, ar = sf.areas || {}, mi = this.moveInfo()[m.n];
    if (!mi) return true;
    const an = mi.anim || 'stand', regs = mi.f.concat(mi.b);
    const WRIST = ['wheel', 'handrelease', 'onearm', 'pseudo', 'downdog', 'pikebed', 'elevpike', 'wallwalk', 'turtle', 'chairfreeze', 'wallpush', 'incline', 'kneepush', 'pushup', 'decline', 'dip', 'pike', 'handstand', 'plank', 'sideplank', 'shouldertap', 'frogstand', 'mountain', 'burpee', 'sixstep', 'freeze', 'catcow', 'headstand', 'tripodrest', 'tucktripod', 'hsfreeze', 'bear', 'crab', 'birddog', 'lsit'];
    const KNEE = ['tuckjump', 'squatjump', 'warrior', 'chairpose', 'pistol', 'bulgarian', 'lunge', 'nordic', 'cossack', 'skater', 'burpee', 'deepsquat', 'kneel', 'wallsit', 'pigeon', 'split', 'halfsplit'];
    const INVERT = ['handstand', 'headstand', 'tripodrest', 'tucktripod', 'hsfreeze', 'freeze', 'frogstand', 'plow', 'shoulderstand', 'chairfreeze', 'turtle'];
    if (ar.wrists && WRIST.indexOf(an) >= 0) return false;
    if (ar.shoulders && (INVERT.indexOf(an) >= 0 || (regs.indexOf('shoulders') >= 0 && mi.lvl >= 2))) return false;
    if (ar.back && (regs.indexOf('lowback') >= 0 || regs.indexOf('back') >= 0) && mi.lvl >= 2) return false;
    if (ar.knees && (KNEE.indexOf(an) >= 0 || (mi.fam === 'legs' && mi.lvl >= 2))) return false;
    if (ar.back && ['wheel', 'plow', 'shoulderstand', 'dragonflag'].indexOf(an) >= 0) return false;
    if (sf.care && (INVERT.indexOf(an) >= 0 || ['tuckjump', 'squatjump', 'wheel'].indexOf(an) >= 0 || mi.role === 'f' || mi.fam === 'freezes' || mi.lvl >= 3)) return false;
    return true;
  }
  outfits() { return [[3, 'bandana', 'a bandana'], [10, 'shades', 'sunglasses'], [25, 'party', 'a party hat'], [50, 'crown', 'a crown'], [100, 'cape', 'a cape']]; }
  noodleSvg(sessions) {
    const L = Math.min(60, Math.round((sessions || 0) * 1.2)), X = (v) => v + L;
    const got = this.outfits().filter((o) => (sessions || 0) >= o[0]).map((o) => o[1]);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 ' + (230 + L) + ' 144">';
    if (got.indexOf('cape') >= 0) s += '<path d="M' + X(150) + ' 52 L60 40 L48 92 L' + X(140) + ' 74 Z" fill="#FFC20E"/>';
    s += '<path d="M44 62 L14 34 L50 52 Z" fill="#161616"/><rect x="56" y="84" width="12" height="26" rx="6" fill="#161616"/><rect x="78" y="84" width="12" height="26" rx="6" fill="#161616"/>';
    s += '<rect x="' + X(138) + '" y="84" width="12" height="26" rx="6" fill="#161616"/><rect x="' + X(160) + '" y="84" width="12" height="26" rx="6" fill="#161616"/>';
    s += '<rect x="40" y="50" width="' + (140 + L) + '" height="44" rx="22" fill="#E5282E"/><rect x="' + X(148) + '" y="50" width="10" height="44" fill="#FFC20E"/>';
    s += '<circle cx="' + X(176) + '" cy="46" r="24" fill="#E5282E"/><path d="M' + X(188) + ' 38 h22 a10 10 0 0 1 0 20 h-22 z" fill="#E5282E"/><circle cx="' + X(211) + '" cy="46" r="5" fill="#161616"/>';
    if (got.indexOf('bandana') >= 0) s += '<path d="M' + X(156) + ' 62 L' + X(190) + ' 64 L' + X(170) + ' 84 Z" fill="#1556C2"/>';
    s += '<ellipse cx="' + X(166) + '" cy="56" rx="8" ry="16" fill="#161616"/>';
    if (got.indexOf('shades') >= 0) s += '<rect x="' + X(176) + '" y="32" width="18" height="11" rx="3" fill="#161616"/><rect x="' + X(170) + '" y="35" width="8" height="3" fill="#161616"/>';
    else s += '<circle cx="' + X(184) + '" cy="38" r="3.5" fill="#161616"/>';
    if (got.indexOf('crown') >= 0) s += '<path d="M' + X(162) + ' 24 L' + X(164) + ' 4 L' + X(171) + ' 14 L' + X(177) + ' 0 L' + X(183) + ' 14 L' + X(190) + ' 4 L' + X(190) + ' 24 Z" fill="#FFC20E" stroke="#161616" stroke-width="3" stroke-linejoin="round"/>';
    else if (got.indexOf('party') >= 0) s += '<path d="M' + X(166) + ' 24 L' + X(188) + ' 24 L' + X(178) + ' -8 Z" fill="#1556C2"/><circle cx="' + X(178) + '" cy="-9" r="5" fill="#FFC20E"/>';
    s += '</svg>';
    return { uri: 'data:image/svg+xml,' + encodeURIComponent(s), w: 230 + L, L };
  }
  weekKey(dt) { const d = new Date(dt || new Date()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  challenge() {
    const s = this.state, F = this.fams(), MI = this.moveInfo(), start = this.weekKey(), wid = start.getTime();
    const CH = [
      { id: 'new', t: '3 moves you have never done', goal: 3, mood: 'Surprise', kind: 'new' },
      { id: 'dance', t: '4 dance moves', goal: 4, mood: 'Dance', fams: ['dance', 'freezes', 'flow'] },
      { id: 'stretch', t: '5 stretches', goal: 5, mood: 'Stretch', fams: ['stretch', 'splits'] },
      { id: 'mix', t: '5 different families', goal: 5, mood: 'Surprise', kind: 'fams' },
      { id: 'kick', t: '4 kicks or punches', goal: 4, mood: 'Strikes', fams: ['strikes', 'flow'] },
      { id: 'days', t: 'Move on 2 different days', goal: 2, mood: null, kind: 'days' },
      { id: 'bal', t: '3 balance moves', goal: 3, mood: 'Surprise', fams: ['balance', 'freezes'] },
      { id: 'core', t: '4 core moves', goal: 4, mood: 'Strength', fams: ['core', 'crawls'] },
      { id: 'legs', t: '5 leg moves', goal: 5, mood: 'Strength', fams: ['legs'] },
      { id: 'new5', t: '5 moves you have never done', goal: 5, mood: 'Surprise', kind: 'new' }
    ];
    const wk = Math.floor(wid / 6048e5), bonus = s.chBonus && s.chBonus.w === wid ? s.chBonus.n : 0;
    const c = CH[(((wk % CH.length) + CH.length) % CH.length + bonus) % CH.length];
    const found = [], add = (x) => { if (found.indexOf(x) < 0) found.push(x); };
    const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const e = this.dayLog(this.dayKey(d)); if (!e) continue;
      if (c.kind === 'days') add(DAY[i]);
      else if (c.kind === 'fams') Object.keys(e.f).forEach((k) => { if (F[k]) add(F[k].name); });
      else if (c.kind === 'new') (e.nw || []).forEach(add);
      else (e.mv || []).forEach((n) => { if (MI[n] && c.fams.indexOf(MI[n].fam) >= 0) add(n); });
    }
    const n = found.length;
    return Object.assign({}, c, { n: Math.min(n, c.goal), done: n >= c.goal, found: found.slice(0, c.goal), moves: !c.kind || c.kind === 'new', bonus, more: bonus < CH.length - 1, wid });
  }
  shareCard() {
    const s = this.state, flat = this.flat(), art = this.noodleSvg(s.sessions);
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d');
    g.fillStyle = '#FFC20E'; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = '#1556C2'; g.beginPath(); g.arc(540, 1350, 380, Math.PI, 0); g.fill();
    g.fillStyle = '#E5282E'; g.beginPath(); g.arc(1010, 70, 150, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#161616'; g.font = '900 170px "Inter Tight", sans-serif'; g.fillText('NICE', 80, 330); g.fillText('WORK!', 80, 480);
    g.font = '800 44px "Inter Tight", sans-serif'; const dv = s.doneVals || [this.sessTime(), flat.length]; g.fillText(dv[0] + ' MIN  ·  ' + dv[1] + (dv[1] === 1 ? ' MOVE' : ' MOVES'), 86, 570);
    g.font = '700 38px "Inter Tight", sans-serif'; const words = (s.doneNote || '').split(' '); let line = '', y = 650;
    words.forEach((w) => { if ((line + w).length > 34) { g.fillText(line, 86, y); y += 50; line = ''; } line += w + ' '; }); g.fillText(line, 86, y);
    g.fillStyle = '#FFFFFF'; g.font = '900 54px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.fillText('Noodle It Out', 540, 1290);
    const img = new Image();
    img.onload = () => {
      const w = 620, h = w * 144 / art.w; g.drawImage(img, 540 - w / 2, 1000 - h, w, h);
      c.toBlob((blob) => {
        if (!blob) return; const name = 'noodle-session.png';
        try { const file = new File([blob], name, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; } } catch (e) {}
        const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
      }, 'image/png');
    };
    img.src = art.uri;
  }
  likesMap() {
    return [
      ['strength', 'Strength', ['push', 'pull', 'legs', 'core'], 'Strength', 'circle', '#E5282E'],
      ['yoga', 'Yoga & stretching', ['stretch', 'mobility'], 'Stretch', 'arch', '#F6A5A9'],
      ['dance', 'Dance', ['dance'], 'Dance', 'quarter', '#FFC20E'],
      ['kicks', 'Boxing & kicks', ['strikes'], 'Strikes', 'tri', '#161616'],
      ['skills', 'Handstands & balance', ['balance'], 'Surprise', 'diamond', '#6B3FA0'],
      ['cardio', 'Getting sweaty', [], 'Surprise', 'square', '#F26A0F'],
      ['chill', 'Just loosening up', ['mobility', 'stretch'], 'Chill', 'pill', '#0E8178']
    ];
  }
  likedFams() { const lk = (this.state.profile || {}).likes || {}, o = {}; this.likesMap().forEach((r) => { if (lk[r[0]]) r[2].forEach((f) => { o[f] = 1; }); }); return o; }
  applyProfile() {
    const s = this.state, pr = s.profile, base = [0, 0, 1, 2][pr.active || 0];
    const fresh = Object.keys(s.levels).every((k) => !s.levels[k]) && !(s.sessions || 0);
    const upd = { profile: Object.assign({}, pr, { done: true }) };
    if (fresh) {
      const liked = this.likedFams(), F = this.fams(), lv = Object.assign({}, s.levels);
      Object.keys(lv).forEach((k) => { if (F[k] && !F[k].hidden) lv[k] = Math.min(3, base + (liked[k] && pr.active >= 2 ? 1 : 0)); });
      upd.levels = lv; upd.stones = {};
      upd.profile.base = Object.keys(lv).reduce((x, k) => x + (lv[k] || 0), 0);
      const first = this.likesMap().find((r) => pr.likes[r[0]]);
      if (first) upd.mood = first[3];
      if (pr.likes.cardio) upd.energy = 75; else if (pr.likes.chill) upd.energy = 25;
      upd.time = [10, 15, 20, 25][pr.active || 0];
      if (!pr.active) upd.energy = Math.min(upd.energy || 50, 35);
    }
    this._pk = null; this.setState(upd);
  }
  cardSwipe(dir) {
    const p = (this.state.mCard || 0) + dir;
    if (p < 0 || p > 2) return false;
    this.setState({ mCard: p, mDir: dir > 0 ? 'swl' : 'swr' });
    return true;
  }
  clarify() {
    // Plain-language "think of it as" + clear steps for moves whose names or motions are hard to picture.
    return {
      'Cloud hands': ['Slowly wiping a big window in front of your face.', 'Stand with feet wide and knees soft.', 'One hand floats up past your face while the other sweeps low past your belly.', 'Shift your weight toward the high hand, then switch. Slow, like moving through water.'],
      'Towel pass-through': ['Drawing a big rainbow over your head with a towel.', 'Hold a towel wide with both hands, arms straight in front of your hips.', 'Lift it up over your head and back behind you, arms staying straight.', 'Bring it back the same way. Grip wider if your shoulders pinch.'],
      'Wrist prep circuit': ['Gently warming your wrists before they carry weight.', 'Kneel on all fours, hands under shoulders, fingers forward.', 'Rock your shoulders forward past your hands, then back. 10 slow rocks.', 'Turn fingers sideways, then backward, and rock again.'],
      'Pelvic tilts': ['Flattening a grape under your low back, then letting it go.', 'Lie on your back, knees bent, feet flat.', 'Gently press your low back into the floor by tipping your hips up a little.', 'Release so your back arches slightly. Tiny, slow movements.'],
      'Neck isolations': ['A pigeon walking, but only your head moves.', 'Stand tall, shoulders relaxed and still.', 'Slide your head straight forward, then straight back, chin level.', 'Then slide it side to side. Small and smooth, never forced.'],
      'Chest isolations': ['Your chest is pulled by a string, front then back.', 'Stand with soft knees, hips still.', 'Push your chest forward, then pull it back so your upper back rounds.', 'Keep your shoulders down and your hips quiet.'],
      'Shoulder isolations': ['Shrugging one shoulder at a time to a beat.', 'Stand relaxed with soft knees.', 'Pop one shoulder up toward your ear and drop it.', 'Then the other. Keep your head and hips still.'],
      'Body roll': ['A wave rolling down your body from chest to hips.', 'Push your chest forward first.', 'Let the wave travel to your belly, then your hips.', 'Bend your knees as it reaches your hips. Start slow.'],
      'Bounce and rock': ['Nodding along to music, with your whole body.', 'Stand with feet hip-width, knees soft.', 'Bounce gently by bending your knees on every beat.', 'Let your chest rock forward and back with the bounce.'],
      'Two-step': ['The classic party side-step.', 'Step one foot out to the side.', 'Bring the other foot in to tap next to it.', 'Repeat to the other side. Add arm swings when it feels easy.'],
      'Indian step': ['A bouncy front-and-back step from breaking.', 'Kick one foot forward and tap it, as if stepping on a bug.', 'Hop back to center and do the other foot.', 'Arms swing loosely across your body.'],
      'Cross step': ['Crossing your feet like an X, then uncrossing.', 'Step one foot across the other.', 'Hop to uncross and land feet apart.', 'Switch which foot crosses in front.'],
      'Salsa rock': ['Rocking forward and back like a salsa basic.', 'Step one foot forward, shift your weight onto it.', 'Rock back onto the other foot.', 'Bring the front foot home. Repeat on the other side.'],
      'Low-impact running man': ['Running in place, but sliding instead of jumping.', 'Lift one knee up.', 'As that foot comes down, slide the other foot back.', 'Switch legs in a smooth rhythm.'],
      'Shuffle running man': ['The running man with a bounce.', 'Knee up, then hop as you slide the standing foot back.', 'Land on the lifted foot and switch.', 'Stay light on the balls of your feet.'],
      'Six-step': ['Walking in a circle around your hands, low to the ground.', 'Crouch with one hand on the floor.', 'Step your feet around your hands in 6 steps: cross, kick out, step behind, and so on.', 'Go slow until the pattern feels natural.'],
      'Three-step': ['A shorter, simpler six-step.', 'Crouch with one hand down.', 'Step one leg through, kick it out, and bring it back.', 'Switch sides. Three steps per side.'],
      'Kick-outs': ['Popping your legs out from a crouch.', 'Crouch with both hands on the floor.', 'Hop and kick both feet out to one side.', 'Hop them back under you and repeat to the other side.'],
      'CC footwork': ['Switching legs back and forth under your body.', 'Crouch with hands down, one leg bent under, the other out straight.', 'Hop and swap the legs.', 'Keep your hips low and the rhythm steady.'],
      'Coffee grinder': ['Sweeping one leg in a big circle like a clock hand.', 'Crouch low, hands down, one leg straight out.', 'Sweep that leg in a circle under you.', 'Hop the other foot over it as it passes.'],
      'Footwork freestyle': ['Mixing the floor steps you know, your way.', 'Start with six-step.', 'Add three-steps and kick-outs whenever you like.', 'Change direction to keep it fresh.'],
      'Toprock freestyle': ['Your own standing dance warm-up.', 'Start with the Indian step.', 'Mix in cross steps and arm styles.', 'No wrong moves. Just keep a beat.'],
      'Controlled go-down': ['Sitting into a deep crouch without falling.', 'From standing, bend your knees and sink down.', 'Reach your hands to the floor in front to catch yourself.', 'Stand back up the same way.'],
      'Toprock-to-floor transition': ['Going from standing dance to floor dance smoothly.', 'Do 8 counts of standing steps.', 'Sink down and catch yourself with your hands.', 'Flow straight into a few floor steps.'],
      'Baby freeze': ['Balancing sideways on one hand like a tripod.', 'Crouch, tuck one elbow into your side, the other against your knee.', 'Rest the side of your head on the floor near your hands.', 'Lean until your feet lift. Hold 3 seconds, then come down.'],
      'Footwork into baby freeze': ['Moving, then suddenly stopping in a freeze.', 'Do one round of six-step.', 'Drop into a baby freeze.', 'Hold it for a moment, then come out.'],
      'Elbow freeze': ['Balancing sideways on one bent arm.', 'Crouch and plant one elbow into your hip.', 'Lean onto that arm, the other hand helping on the floor.', 'Lift your feet and hold a few seconds.'],
      'Turtle freeze': ['Balancing flat like a turtle on both elbows.', 'Crouch and tuck both elbows into your stomach.', 'Lean forward onto your hands.', 'Lift both feet and hold.'],
      'Turtle shuffle': ['Turning in a circle while in the turtle freeze.', 'Hold the turtle freeze.', 'Shift weight from one hand to the other.', 'Take small hand steps to rotate.'],
      'Chair freeze': ['Leaning back on one hand like sitting in an invisible chair.', 'One hand on the floor, that elbow tucked into your lower back.', 'Lean back onto it and lift your feet.', 'Cross one leg over the other and hold.'],
      'Air chair prep': ['Building toward the chair freeze, one foot at a time.', 'Set up like the chair freeze.', 'Lift one foot, then the other.', 'Hold a second, then come down safely.'],
      'Freeze chains': ['Linking freezes like beads on a string.', 'Hit one freeze and hold it.', 'Move through a few floor steps.', 'Hit a second freeze. Try for three.'],
      'Tripod headstand': ['Making a triangle with your head and hands.', 'Put your hands and the top of your head down in a triangle.', 'Walk your feet in and rest your knees on your elbows.', 'Lift your legs slowly. Come down the same way.'],
      'Tuck to tripod': ['The first step of a headstand.', 'Set up the head-and-hands triangle.', 'Rest your knees on your elbows and hold.', 'That is the whole move. Come down slowly.'],
      'Stance and jab': ['A boxer flicking the light switch on and off.', 'Stand with one foot forward, fists by your cheeks.', 'Snap your front hand straight out and back.', 'Your other hand stays guarding your face.'],
      'Jab-cross': ['One-two: a quick punch, then a strong one.', 'Jab with your front hand.', 'Then punch with your back hand, turning your back hip and heel.', 'Bring both hands back to your face.'],
      'Hooks and uppercuts': ['Hooks swing sideways, uppercuts scoop up.', 'Hook: bend your elbow at shoulder height and swing in a curve.', 'Uppercut: dip slightly and drive your fist upward.', 'Turn your hips with every punch.'],
      'Elbow strikes': ['Using your elbow like a short swinging hammer.', 'Raise your elbow to shoulder height.', 'Swing it across your body, turning your hips.', 'Keep the other hand guarding.'],
      'Slip and roll': ['Dodging a punch, then ducking under one.', 'Slip: lean your head slightly to one side.', 'Roll: bend your knees and dip under in a U shape.', 'Come up on the other side, hands up.'],
      'Bob and weave': ['Ducking under a swing, side to side.', 'Bend your knees to lower your head.', 'Move in a U shape to the other side.', 'Rise up with your hands still guarding.'],
      'Slip-slip-cross': ['Dodge, dodge, punch back.', 'Lean your head left, then right.', 'As you come back to center, throw a cross.', 'Hands back to your face.'],
      'Teep push kick': ['Pushing a door open with your foot.', 'Lift your knee high.', 'Push the ball of your foot straight forward.', 'Pull it back and set it down.'],
      'Front and round kick': ['Front kick goes straight, round kick swings around.', 'Front: lift the knee, then extend the foot forward.', 'Round: pivot your standing foot and swing your shin around.', 'Bring the leg back to your stance each time.'],
      'Side kick': ['Stomping out to the side with your heel.', 'Lift your knee toward your chest.', 'Turn sideways and drive your heel straight out.', 'Pull it back before you set it down.'],
      'Knee strikes': ['Bringing your knee up hard into a target.', 'Hands up as if holding someone in front of you.', 'Drive one knee up, pulling your hands down.', 'Switch knees.'],
      'Switch kick combo': ['Punch, swap feet, kick.', 'Throw a jab and a cross.', 'Quickly swap your stance with a little hop.', 'Round kick with the leg that is now in back.'],
      'Slow spinning back kick': ['Turning around and stomping backward.', 'Turn your back to the target and look over your shoulder.', 'Lift your knee and drive your heel straight back.', 'Turn back to face forward. Slow and controlled.'],
      'Combos with slips': ['Punching and dodging together.', 'Throw a jab and cross.', 'Slip your head to one side.', 'Throw a hook back. Keep the rhythm.'],
      'Guard bounce': ['A boxer bouncing while waiting.', 'Feet staggered, hands up by your cheeks.', 'Bounce lightly on the balls of your feet.', 'Stay relaxed and keep your hands up.'],
      'Bouncing stance': ['A boxer bouncing while waiting.', 'Feet staggered, hands up by your cheeks.', 'Bounce lightly, shifting weight front to back.', 'Stay relaxed.'],
      'Pendulum step': ['Swinging back and forth like a clock pendulum.', 'Hands up, light on your feet.', 'Hop forward, then back, keeping your stance.', 'Small and quick.'],
      'Switch stance drill': ['Swapping which foot is in front, with a hop.', 'Stand in your fighting stance.', 'Hop and swap your feet.', 'Hands stay up the whole time.'],
      'Angle steps': ['Stepping off to the side to change angles.', 'From your stance, step diagonally forward.', 'Pivot to face the same direction.', 'Step back and repeat to the other side.'],
      'Prone Y-T-W raises': ['Lying face down and making the letters Y, T and W with your arms.', 'Lie face down, forehead on a towel.', 'Lift your arms in a Y shape, then a T, then a W.', 'Thumbs up, squeeze your shoulder blades, small lifts.'],
      'Reverse snow angel': ['A snow angel, but lying face down.', 'Lie face down, arms by your sides, hovering.', 'Sweep your arms overhead along the floor.', 'Sweep them back down to your hips.'],
      'Superman hold': ['Flying like Superman, lying on your belly.', 'Lie face down, arms stretched forward.', 'Lift your arms, chest and legs a little off the floor.', 'Hold while breathing. Look down, not up.'],
      'Prone swimmers': ['Swimming on the floor, face down.', 'Lie face down, arms overhead and hovering.', 'Sweep your arms down to your hips.', 'Sweep them back overhead. Slow.'],
      'Scapular desk pulls': ['Pulling your shoulder blades together without bending your arms.', 'Hang under a sturdy desk, arms straight.', 'Squeeze your shoulder blades so your chest rises a little.', 'Relax and repeat. Arms stay straight.'],
      'Towel floor pull': ['Rowing a towel across the floor, face down.', 'Lie face down holding a towel in front of you.', 'Pull it toward your chest, elbows sliding back.', 'Reach it forward again.'],
      'Tucked hollow hold': ['Becoming a banana, with knees bent.', 'Lie on your back, press your low back down.', 'Lift your shoulders, bring your knees in, reach forward.', 'Hold while breathing.'],
      'Hollow hold': ['Becoming a banana, belly button down.', 'Lie on your back, press your low back into the floor.', 'Lift your shoulders and legs a little, arms overhead.', 'Hold. Bend your knees if your back lifts.'],
      'Hollow rocks': ['Rocking like a rocking chair in the banana shape.', 'Hold the hollow shape.', 'Rock gently from shoulders to hips.', 'Keep the shape. Do not bend in the middle.'],
      'Dead bug': ['A bug on its back, moving opposite arm and leg.', 'Lie on your back, arms up, knees bent over hips.', 'Lower one arm overhead and the opposite leg toward the floor.', 'Return, then switch. Low back stays down.'],
      'Bird-dog': ['A dog pointing: one arm forward, other leg back.', 'On hands and knees, back flat.', 'Reach one arm forward and the opposite leg back.', 'Hold a breath, return, switch sides.'],
      'Russian twist': ['Passing something side to side while seated.', 'Sit, lean back a little, feet on the floor.', 'Turn your chest to one side, hands by your hip.', 'Turn to the other side. Lift your feet to make it harder.'],
      'Woodchop': ['Chopping wood diagonally across your body.', 'Hands clasped high on one side.', 'Pull them down across your body to the opposite knee.', 'Pivot your back foot as you chop.'],
      'Bent-knee windshield wipers': ['Your knees are wipers going side to side.', 'Lie on your back, arms out wide, knees up over hips.', 'Lower both knees to one side.', 'Bring them back up and over. Shoulders stay down.'],
      'Straight-leg windshield wipers': ['Wipers, with straight legs.', 'Lie on your back, arms wide, legs straight up.', 'Lower your legs to one side.', 'Bring them back through the middle.'],
      'Tuck L-sit on chairs': ['Lifting yourself off the seat between two chairs.', 'Hands on two sturdy chairs, arms straight.', 'Push down so your bottom lifts.', 'Tuck your knees up and hold.'],
      'L-sit': ['Making an L shape, held up by your hands.', 'Hands on the floor or two chairs beside your hips.', 'Press down and lift your bottom.', 'Hold your legs straight out in front.'],
      'Dragon flag negative': ['A slow-motion plank falling back down from your shoulders.', 'Lie on your back, hold the bed frame behind your head.', 'Lift your body straight up so only your shoulders touch.', 'Lower as one piece, slowly.'],
      'Push-up negative': ['The lowering half of a push-up, done slowly.', 'Start at the top of a push-up, body in one straight line.', 'Lower your chest for a slow count of 3.', 'At the bottom, drop your knees and push back up to start again.'],
      'Incline one-arm push-up': ['A one-arm push-up with your hand up on the bed.', 'One hand on the edge of the bed, feet wide apart for balance.', 'Put your free hand behind your back or on your hip.', 'Lower slowly, keeping your hips level, then press back up.'],
      'One-leg L-sit on chairs': ['An L-sit with one knee still tucked in.', 'Hands on two sturdy chairs, push down to lift your bottom off the seat.', 'Keep one knee tucked to your chest.', 'Straighten the other leg out in front and hold it level.'],
      'Frog stand, toes down': ['The frog stand with your toes still touching the floor.', 'Squat down, hands flat on the floor shoulder-width apart.', 'Rest your knees on the backs of your elbows.', 'Lean forward until your toes feel light, without lifting them yet.'],
      'Heel pulls off the wall': ['Learning to balance away from the wall, one heel at a time.', 'Get into your wall handstand with your hands a little closer to the wall.', 'Squeeze your legs and gently pull one heel off the wall.', 'When that feels steady, try both heels for a second, then touch back.'],
      'Baby freeze, toes down': ['A baby freeze with both feet still touching the floor.', 'Crouch, hands on the floor, one elbow tucked into your side.', 'Rest the other knee against your other elbow.', 'Lean until your head lightly touches the floor and your feet feel light.'],
      'Tripod knee rest': ['The first half of a tripod headstand.', 'Make a triangle with your head and hands on something soft.', 'Walk your feet in close, toes on the floor.', 'Rest one knee on an elbow, then the other, and hold.'],
      'Frog stand': ['Balancing like a frog on your hands.', 'Squat down, hands flat on the floor.', 'Rest your knees on the backs of your elbows.', 'Lean forward until your feet lift.'],
      'Crow pose': ['A tighter frog stand, knees high on your arms.', 'Squat, hands down, knees high on your upper arms.', 'Look forward and lean in.', 'Lift one foot, then both.'],
      'Side crow': ['Crow pose, but twisted to the side.', 'Squat and twist so both knees face one side.', 'Plant your hands and rest your knees on one arm.', 'Lean in until your feet float.'],
      'Pike hold on the bed': ['An upside-down V, with feet up on the bed.', 'Hands on the floor, feet on the bed.', 'Walk your hands in so your hips stack over your shoulders.', 'Hold, pressing the floor away.'],
      '90/90 hip switches': ['Rotating your knees like windshield wipers while seated.', 'Sit with both knees bent at right angles, one in front, one to the side.', 'Rotate both knees to the other side.', 'Use your hands behind you for balance.'],
      'No-hands 90/90 transitions': ['The 90/90 switch, no hands.', 'Sit tall in the 90/90 position.', 'Switch sides without leaning on your hands.', 'Lift your chest as you rotate.'],
      'Cossack squat': ['A side lunge where one leg stays straight.', 'Wide stance, toes slightly out.', 'Sit down into one leg, the other straight with toes up.', 'Shift to the other side.'],
      'Cossack flow': ['Gliding low from side to side.', 'Wide stance.', 'Sink into one side, then glide through the middle.', 'Stay low as you shift.'],
      'Jefferson curl': ['Rolling down your spine one bone at a time.', 'Stand tall, chin tucked.', 'Roll down slowly, vertebra by vertebra, letting your arms hang.', 'Roll back up the same way. Go gently.'],
      "World's greatest stretch": ['A lunge, a twist and a reach, all in one.', 'Step into a long lunge.', 'Put the same-side hand down inside your front foot.', 'Rotate and reach the other arm up. Switch sides.'],
      'Open book': ['Your arms open like the covers of a book.', 'Lie on your side, knees bent, arms together in front.', 'Open the top arm across to the other side, eyes following.', 'Close the book. Repeat.'],
      'Cat-cow': ['A cat arching its back, then a cow dropping its belly.', 'On hands and knees.', 'Round your back up and tuck your chin (cat).', 'Drop your belly and lift your chest (cow). Slow, with your breath.'],
      'Thread the needle': ['Sliding your arm under your body to rest.', 'On hands and knees.', 'Slide one arm under your chest along the floor.', 'Rest your shoulder and ear down. Switch sides.'],
      'Pancake': ['Folding forward with your legs wide.', 'Sit with your legs wide.', 'Walk your hands forward, chest long.', 'Breathe and stay. Only go as far as feels okay.'],
      'Pancake good mornings': ['Bowing forward and back, legs wide.', 'Sit legs wide, hands behind your head.', 'Hinge forward with a long back.', 'Sit back up tall.'],
      'Lizard': ['A very low lunge, hands inside the front foot.', 'Step into a low lunge.', 'Put both hands inside your front foot.', 'Lower onto your forearms if it feels good.'],
      'Frog stretch': ['A frog lying down, knees wide.', 'On hands and knees, slide your knees wide apart.', 'Keep your shins in line with each other.', 'Gently rock your hips back.'],
      'Happy baby': ['A baby on its back holding its feet.', 'Lie on your back, knees toward your armpits.', 'Hold the outsides of your feet.', 'Gently rock side to side.'],
      'Sphinx': ['Lying on your belly propped up on your forearms.', 'Lie face down, elbows under your shoulders.', 'Lift your chest, forearms on the floor.', 'Relax your belly and low back.'],
      'Puppy pose': ['A puppy stretching with its bottom up.', 'Start on hands and knees.', 'Walk your hands forward, hips staying over your knees.', 'Let your chest melt toward the floor.'],
      'Pigeon pose': ['Sitting with one shin across the front, one leg back.', 'From hands and knees, bring one knee forward behind your wrist.', 'Slide the other leg straight back.', 'Fold forward only as far as feels good.'],
      'King pigeon prep': ['Pigeon, reaching back for your back foot.', 'Set up in pigeon.', 'Bend your back knee.', 'Reach back for that foot only if it comes easily.'],
      'Sun salutation': ['A short yoga flow from standing to the floor and back.', 'Reach up, then fold down.', 'Step back to a plank, lower to cobra.', 'Push back to downward dog, then walk up to standing.'],
      'Cat crawl': ['Crawling quietly like a cat.', 'Hands and feet down, knees just off the floor.', 'Move your opposite hand and foot together.', 'Small, quiet steps.'],
      'Crocodile crawl': ['Crawling low like a crocodile.', 'Hold the bottom of a push-up.', 'Bring one knee toward the same elbow and reach forward.', 'Crawl forward, staying low.'],
      'Gorilla shuffle': ['Moving sideways like a gorilla.', 'Deep squat, hands on the floor in front.', 'Shift your weight onto your hands.', 'Hop your feet sideways past your hands.'],
      'Crab reach': ['A crab reaching over its body.', 'Sit, hands behind you, lift your hips (crab).', 'Reach one arm over your body to the other side.', 'Come back and switch.'],
      'Inchworm walk': ['An inchworm stretching out and scrunching up.', 'Fold down and put your hands on the floor.', 'Walk your hands out to a plank.', 'Walk your feet in toward your hands.'],
      'Bear hold': ['A bear about to move, holding still.', 'On hands and knees, toes tucked.', 'Lift your knees an inch off the floor.', 'Hold, back flat.'],
      'Bear crawl': ['Walking on hands and feet like a bear.', 'Bear position, knees just off the floor.', 'Move opposite hand and foot forward.', 'Small steps, hips low.'],
      'Lateral bear crawl': ['Bear crawling sideways.', 'Bear position, knees just off the floor.', 'Step your hand and foot to the side together.', 'Go a few steps, then come back.'],
      'Crab walk': ['Walking like a crab, belly up.', 'Sit, hands behind you, feet flat.', 'Lift your hips.', 'Walk on hands and feet.'],
      'Crawl flow': ['Mixing crawls without stopping.', 'Bear crawl forward.', 'Turn into a crab walk.', 'Flip back to bear. Keep moving.'],
      'Reverse Nordic': ['Leaning back from your knees like a tipping plank.', 'Kneel tall, body straight from knees to head.', 'Lean back slowly, keeping hips straight.', 'Come back up. Only lean as far as you can control.'],
      'Archer push-up': ['A push-up where one arm does most of the work.', 'Hands very wide.', 'Lower toward one hand while the other arm stays straight.', 'Press up, then switch sides.'],
      'Pseudo-planche push-up': ['A push-up leaning forward like a superhero landing.', 'Hands by your waist, fingers turned out.', 'Lean your shoulders forward past your hands.', 'Do push-ups while keeping that lean.'],
      'Pike push-up': ['A push-up in an upside-down V.', 'Hips high, hands and feet on the floor.', 'Bend your elbows to lower your head toward the floor.', 'Press back up.'],
      'Wall walk-up': ['Walking up the wall backwards with your feet.', 'Start in a plank with feet against the wall.', 'Walk your feet up the wall as your hands walk in.', 'Go as high as you control, then walk down.'],
      'Kick-up practice': ['Practicing the kick into a handstand, safely.', 'Face the wall, hands down a little away from it.', 'Kick one leg up, the other follows.', 'Land softly. Small kicks first.'],
      'Burpee walk-out': ['A burpee with no jumping.', 'Squat and put your hands down.', 'Walk your feet back to a plank.', 'Walk them back in and stand up.'],
      'Step-out plank jack': ['A jumping jack in a plank, but stepping.', 'Hold a plank.', 'Step one foot out wide, then the other.', 'Step them back in. Hips stay level.'],
      'Skater steps': ['A speed skater, without the jumping.', 'Take a big step to one side.', 'Swing the other leg behind you and reach across.', 'Step to the other side.']
    };
  }
  youSwipe(dir) {
    const p = (this.state.yPanel || 0) + dir;
    if (p < 0 || p > 3) return false;
    this.setState({ yPanel: p, yDir: dir > 0 ? 'swl' : 'swr' });
    return true;
  }
  lvSum() { const L = this.state.levels; return Math.max(0, Object.keys(L).reduce((x, k) => x + (L[k] || 0), 0) - ((this.state.profile && this.state.profile.base) || 0)); }
  demoState() {
    const F = this.fams(), BK = this.bank(), levels = {}, stones = {}, seen = {}, tried = {}, seenTricks = {}, log = {}, history = {};
    Object.keys(F).forEach((k) => { levels[k] = 4; stones[k] = Math.max(0, F[k].ladder.length - 1); seen[k] = true; });
    BK.forEach((m) => { tried[m.n] = 1; });
    this.tricks().forEach((t) => { seenTricks[t[0]] = true; });
    const fams = ['push', 'legs', 'dance', 'stretch', 'strikes', 'core', 'balance', 'mobility', 'pull'];
    const today = new Date();
    for (let i = 0; i < 80; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (i > 6 && (i * 7) % 10 < 3) continue;
      const fa = fams[i % fams.length], fb = fams[(i + 3) % fams.length], f = {}; f[fa] = 4; f[fb] = 2;
      const mv = BK.filter((m) => m.fam === fa || m.fam === fb).slice(0, 6).map((m) => m.n);
      const k = this.dayKey(d); log[k] = { m: 20, f, mv, nw: i < 7 ? mv.slice(0, 2) : [] }; history[k] = fa;
    }
    return { levels, stones, seen, tried, seenTricks, log, history, sessions: 120, fb: 60, safe: { done: true, areas: {}, care: false }, guideDone: true, profile: { done: true, likes: {}, active: 2, base: 0 }, chBonus: null };
  }
  tricks() {
    return [['Sit', 0, 'trSit', 0.9], ['Wag', 1, 'trWag', 0.8], ['Hop', 2, 'trHop', 1.0], ['Spin', 4, 'trSpin', 0.9], ['Roll over', 6, 'trRoll', 1.1], ['Bow', 9, 'trBow', 1.2], ['Dance', 12, 'trDance', 1.4], ['Handstand', 16, 'trHand', 1.8, '82% 96%'], ['Moonwalk', 20, 'trMoon', 1.6], ['Backflip', 26, 'trFlip', 1.2, '50% 55%'], ['Play dead', 30, 'trDead', 1.8, '50% 60%'], ['Zoomies', 34, 'trZoom', 1.4], ['Sneeze', 38, 'trSneeze', 0.9]];
  }
  doTrick(name) {
    const s = this.state, T = this.tricks();
    const lv = Object.keys(s.levels).reduce((x, k) => x + (s.levels[k] || 0), 0);
    const open = T.filter((t) => lv >= t[1]);
    const t = name ? T.find((x) => x[0] === name) : open[(s.trickN * 7 + 3) % open.length];
    if (!t || lv < t[1]) return;
    const seenTricks = Object.assign({}, s.seenTricks); seenTricks[t[0]] = true;
    this.sfx(t[0] === 'Sneeze' ? 'pop' : 'bark');
    this.setState({ trickN: s.trickN + 1, trickName: t[0], seenTricks });
  }
  savePoster() {
    const s = this.state, F = this.fams(), now = new Date(), Y = now.getFullYear(), Mo = now.getMonth();
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = '#161616'; g.font = '900 120px "Inter Tight", sans-serif'; g.fillText(MONTHS[Mo].toUpperCase(), 70, 190);
    g.font = '800 34px "Inter Tight", sans-serif'; g.fillStyle = '#595959'; g.fillText(Y + '  ·  NOODLE', 76, 250);
    const first = new Date(Y, Mo, 1).getDay(), dim = new Date(Y, Mo + 1, 0).getDate();
    const gx = 70, gy = 310, cw = (940 - 6 * 10) / 7, ch = 150, gap = 10;
    g.fillStyle = '#161616'; const rows = Math.ceil((first + dim) / 7); g.fillRect(gx - gap, gy - gap, 940 + 2 * gap, rows * (ch + gap) + gap);
    let moved = 0, mins = 0;
    for (let d = 1; d <= dim; d++) {
      const i = first + d - 1, x = gx + (i % 7) * (cw + gap), y = gy + Math.floor(i / 7) * (ch + gap);
      const e = this.dayLog(Y + '-' + (Mo + 1) + '-' + d);
      g.fillStyle = '#FFFFFF'; g.fillRect(x, y, cw, ch);
      if (e) {
        moved++; mins += e.m || 0;
        const fs = Object.keys(e.f).filter((k) => F[k]).sort((p, q) => e.f[q] - e.f[p]).slice(0, 3);
        if (fs.length === 1) { g.fillStyle = F[fs[0]].color; g.fillRect(x, y, cw, ch); }
        else if (fs.length === 2) { g.fillStyle = F[fs[0]].color; g.fillRect(x, y, cw * 0.6, ch); g.fillStyle = F[fs[1]].color; g.fillRect(x + cw * 0.6 + gap, y, cw * 0.4 - gap, ch); g.fillStyle = '#161616'; g.fillRect(x + cw * 0.6, y, gap, ch); }
        else if (fs.length === 3) { g.fillStyle = F[fs[0]].color; g.fillRect(x, y, cw * 0.6, ch); g.fillStyle = '#161616'; g.fillRect(x + cw * 0.6, y, gap, ch); g.fillStyle = F[fs[1]].color; g.fillRect(x + cw * 0.6 + gap, y, cw * 0.4 - gap, ch * 0.5); g.fillStyle = '#161616'; g.fillRect(x + cw * 0.6 + gap, y + ch * 0.5, cw * 0.4 - gap, gap); g.fillStyle = F[fs[2]].color; g.fillRect(x + cw * 0.6 + gap, y + ch * 0.5 + gap, cw * 0.4 - gap, ch * 0.5 - gap); }
      }
    }
    const found = Object.keys(s.tried).length;
    g.fillStyle = '#161616'; g.font = '900 54px "Inter Tight", sans-serif';
    const by = gy + rows * (ch + gap) + 110;
    g.fillText(moved + (moved === 1 ? ' day' : ' days') + ' moved', 70, by);
    g.font = '700 34px "Inter Tight", sans-serif'; g.fillStyle = '#595959';
    g.fillText((mins ? mins + ' minutes  ·  ' : '') + found + ' moves found', 72, by + 56);
    const name = 'noodle-' + MONTHS[Mo].toLowerCase() + '-' + Y + '.png';
    c.toBlob((blob) => {
      if (!blob) return;
      try { const file = new File([blob], name, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; } } catch (e) {}
      const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    }, 'image/png');
  }
  backup() {
    const s = this.state, o = { app: 'noodle', v: 1, saved: new Date().toISOString() };
    KEEP.forEach((k) => { o[k] = s[k]; });
    const name = 'noodle-backup-' + this.dayKey() + '.json';
    const blob = new Blob([JSON.stringify(o)], { type: 'application/json' });
    try { const file = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).then(() => this.setState({ setMsg: 'Backup saved.' })).catch(() => {}); return; } } catch (e) {}
    const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    this.setState({ setMsg: 'Backup saved to your downloads.' });
  }
  remindCal(slot) {
    const T = { morning: [8, 0, 'Morning wake-up'], midday: [12, 30, 'Midday reset'], evening: [21, 0, 'Evening wind-down'] }[slot];
    const d = new Date(); d.setDate(d.getDate() + 1);
    const p = (n) => String(n).padStart(2, '0'), day = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    const st = day + 'T' + p(T[0]) + p(T[1]) + '00', en = day + 'T' + p(T[0]) + p(T[1] + 10 >= 60 ? T[1] - 50 : T[1] + 10) + '00';
    const en2 = T[1] + 10 >= 60 ? day + 'T' + p(T[0] + 1) + p(T[1] - 50) + '00' : en;
    const url = location.href.split('#')[0].split('?')[0];
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Noodle//EN', 'BEGIN:VEVENT', 'UID:noodle-' + slot + '-' + Date.now() + '@noodle', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART:' + st, 'DTEND:' + en2, 'RRULE:FREQ=DAILY', 'SUMMARY:Noodle: ' + T[2], 'DESCRIPTION:Even 2 minutes counts. ' + url, 'URL:' + url,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Time to noodle!', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const l = document.createElement('a'); l.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); l.download = 'noodle-' + slot + '.ics';
    document.body.appendChild(l); l.click(); l.remove();
    this.setState({ setMsg: 'Open the file to add it to your calendar. Delete the event anytime to stop.' });
  }
  shareFriend() {
    const url = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');
    const text = 'Come wiggle with me and Noodle';
    try { if (navigator.share) { navigator.share({ title: 'Noodle', text, url }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard.writeText(text + ': ' + url); this.setState({ shareMsg: 'Link copied!' }); } catch (e) {}
  }
  restore() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = () => {
      const f = i.files && i.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const o = JSON.parse(r.result); if (!o || o.app !== 'noodle') throw new Error('x');
          const keep = {}; KEEP.forEach((k) => { if (o[k] !== undefined) keep[k] = o[k]; });
          if (keep.levels) keep.levels = Object.assign({}, this.state.levels, keep.levels);
          this.migrateSave(keep);
          keep.setMsg = 'Welcome back! Your progress is restored.'; this._pk = null; this.setState(keep);
        } catch (e) { this.setState({ setMsg: "That file isn't a Noodle backup." }); }
      };
      r.readAsText(f);
    };
    i.click();
  }
  seedHistory() {
    const h = {}, today = new Date().getDate();
    const keys = ['push', 'dance', 'stretch', 'legs', 'strikes', 'core', 'mobility', 'pull', 'balance'];
    const n = new Date(), pre = n.getFullYear() + '-' + (n.getMonth() + 1) + '-';
    for (let d = 1; d < today; d++) { if ((d * 7 + 3) % 10 < 6) h[pre + d] = keys[(d * 5) % 9]; }
    return h;
  }
  bankRows() {
    return [
      ['Push-up negative', 'push', 1, 'v', '3 × 5', 'pushup', 'Start at the top of a push-up.', 'Lower for 3 slow seconds, then drop your knees to come back up.', ['chest', 'shoulders', 'arms', 'core'], ['arms']],
      ['Incline one-arm push-up', 'push', 3, 'v', '3 × 5 each side', 'incline', 'One hand on the edge of the bed, feet wide.', 'Lower slowly and keep your hips square.', ['chest', 'shoulders', 'arms', 'core'], ['arms']],
      ['One-leg L-sit on chairs', 'core', 3, 'v', '5 × 10 s', 'lsit', 'Hands on two sturdy chairs, one knee tucked.', 'Straighten the other leg and hold it level.', ['core', 'hips', 'arms'], []],
      ['Frog stand, toes down', 'balance', 1, 'v', '5 × 10 s', 'frogstand', 'Knees on the backs of your elbows, toes still on the floor.', 'Lean forward until your toes feel light.', ['shoulders', 'arms', 'core'], ['shoulders']],
      ['Heel pulls off the wall', 'balance', 3, 'v', '5 tries', 'handstand', 'In your wall handstand, hands a little closer to the wall.', 'Ease one heel off the wall, then both, for a second.', ['shoulders', 'arms', 'core'], ['shoulders']],
      ['Baby freeze, toes down', 'dance', 3, 'v', '5 × 5 s', 'freeze', 'Baby freeze setup, both toes stay on the floor.', 'Lean onto your head and arm until your feet feel light.', ['shoulders', 'arms', 'core'], []],
      ['Tripod knee rest', 'freezes', 0, 'v', '5 × 10 s', 'tripodrest', 'Head and hands make a triangle on something soft, toes on the floor.', 'Walk in and rest one knee, then both, on your elbows.', ['shoulders', 'core'], ['shoulders']],
      ['Wall push-up', 'push', 0, 'm', '3 × 12', 'wallpush', 'Hands on the wall at shoulder height.', 'Chest to the wall, then push away.'],
      ['Wide wall push-up', 'push', 0, 'v', '3 × 12', 'wallpush', 'Hands wider than your shoulders.', 'Keep your body in one straight line.'],
      ['Close-hand wall push-up', 'push', 0, 'v', '3 × 10', 'wallpush', 'Hands close together under your chest.', 'Elbows brush your ribs as you lower.'],
      ['Incline push-up', 'push', 1, 'm', '3 × 10', 'incline', 'Hands on a sturdy desk, body straight.', 'Lower your chest to the edge, then press away.'],
      ['Knee push-up', 'push', 1, 'v', '3 × 10', 'kneepush', 'Knees down, hips in line with your shoulders.', 'Chest to a fist above the floor.'],
      ['Bed-height incline push-up', 'push', 1, 'v', '3 × 10', 'incline', 'Hands on the bed frame.', 'Lower surface means harder, so go slow.'],
      ['Bench dip', 'push', 1, 'v', '3 × 10', 'dip', 'Hands on the bed edge behind you.', 'Lower until your elbows reach about 90 degrees.', ['arms', 'chest'], ['arms']],
      ['Push-up', 'push', 2, 'm', '3 × 8', 'pushup', 'Squeeze glutes and brace so your hips do not sag.', 'Chest to a fist above the floor every rep.'],
      ['Wide push-up', 'push', 2, 'v', '3 × 8', 'pushup', 'Hands about one and a half shoulder widths apart.', 'Same straight body line.'],
      ['Diamond push-up', 'push', 2, 'v', '3 × 6', 'pushup', 'Thumbs and index fingers touch under your chest.', 'Elbows stay close to your ribs.', ['arms', 'chest'], ['arms']],
      ['Hand-release push-up', 'push', 2, 'v', '3 × 6', 'handrelease', 'Lower all the way and lift your hands briefly.', 'Press back up as one solid piece.'],
      ['Chair dip', 'push', 2, 'v', '3 × 8', 'dip', 'Hands on two sturdy chairs, arms straight.', 'Lean slightly forward and lower with control.', ['arms', 'chest'], ['arms']],
      ['Archer push-up', 'push', 3, 'm', '3 × 5 per side', 'pushup', 'Hands very wide.', 'Lower toward one hand while the other arm stays straight.'],
      ['Decline push-up', 'push', 3, 'v', '3 × 8', 'decline', 'Feet on the bed, hands on the floor.', 'Keep your hips from piking up.', ['chest', 'shoulders', 'arms'], ['shoulders']],
      ['Pike push-up', 'push', 3, 'v', '3 × 8', 'pike', 'Hips high in an upside-down V.', 'Lower your head toward the floor, then press up.', ['shoulders', 'arms'], ['shoulders', 'arms']],
      ['Pseudo-planche push-up', 'push', 3, 'v', '3 × 6', 'pseudo', 'Hands by your waist, fingers turned out.', 'Lean your shoulders past your hands the whole rep.', ['shoulders', 'chest', 'core'], ['arms']],
      ['One-arm push-up', 'push', 4, 'm', '3 × 3 per side', 'onearm', 'Feet wide, free hand behind your back.', 'Fight the twist so your hips stay square.', ['chest', 'shoulders', 'arms', 'core'], ['arms']],
      ['Elevated pike push-up', 'push', 4, 'v', '3 × 6', 'elevpike', 'Feet on the bed so your hips stack over your shoulders.', 'Your head travels just in front of your hands.', ['shoulders', 'arms'], ['shoulders', 'arms']],
      ['Wall handstand push-up negative', 'push', 4, 'v', '3 × 3', 'handstand', 'Kick up to the wall.', 'Lower your head to a folded towel over 4 seconds.', ['shoulders', 'arms'], ['shoulders', 'arms']],

      ['Prone Y-T-W raises', 'pull', 0, 'm', '2 × 8 each shape', 'ytw', 'Lie face down, forehead on a towel.', 'Lift your arms in a Y, then a T, then a W.', [], ['back', 'shoulders']],
      ['Towel pull-apart', 'pull', 0, 'v', '3 × 20 s', 'pullapart', 'Hold a towel at chest height, arms straight.', 'Pull outward as hard as you can and hold.', ['shoulders'], ['back', 'shoulders']],
      ['Superman hold', 'pull', 0, 'v', '3 × 20 s', 'superman', 'Lie face down, arms reaching forward.', 'Lift your arms, chest and legs and look at the floor.', [], ['back', 'lowback', 'glutes']],
      ['Under-desk row, knees bent', 'pull', 1, 'm', '3 × 8', 'row', 'Lie under a sturdy desk and grip the edge.', 'Pull your chest up with your knees bent and feet flat.'],
      ['Towel floor pull', 'pull', 1, 'v', '3 × 6', 'ytw', 'Lie face down on a towel on a smooth floor.', 'Pull yourself forward with your forearms.'],
      ['Reverse snow angel', 'pull', 1, 'v', '3 × 10', 'ytw', 'Lie face down, arms by your sides.', 'Sweep your arms overhead and back without touching down.', [], ['back', 'shoulders']],
      ['Under-desk row, legs straight', 'pull', 2, 'm', '3 × 8', 'row', 'Body straight from heels to head.', 'Pull until your chest nearly touches the edge.'],
      ['Paused desk row', 'pull', 2, 'v', '3 × 6', 'row', 'Pull up and hold 2 seconds at the top.', 'Squeeze your shoulder blades together.'],
      ['Close-grip desk row', 'pull', 2, 'v', '3 × 8', 'row', 'Hands close together on the edge.', 'Elbows travel close to your body.'],
      ['Archer desk row', 'pull', 3, 'm', '3 × 5 per side', 'row', 'Hands wide on the edge.', 'Pull toward one hand while the other arm straightens.'],
      ['Feet-up desk row', 'pull', 3, 'v', '3 × 8', 'row', 'Heels up on the bed so your body is level.', 'Pull your chest to the edge.'],
      ['Slow-negative desk row', 'pull', 3, 'v', '3 × 6', 'row', 'Pull up normally.', 'Take 4 full seconds to lower.'],
      ['One-arm desk row', 'pull', 4, 'm', '3 × 4 per side', 'row', 'One hand on the edge, feet wide for balance.', 'Pull without letting your hips twist.'],
      ['One-arm row negative', 'pull', 4, 'v', '3 × 3 per side', 'row', 'Get to the top with two hands.', 'Let go with one and lower slowly.'],
      ['Feet-up archer row', 'pull', 4, 'v', '3 × 4 per side', 'row', 'Heels on the bed, hands wide.', 'Pull toward one hand at a time.'],

      ['Chair squat', 'legs', 0, 'm', '3 × 10', 'chairsquat', 'Sit down to a chair, then stand.', 'Push through your whole foot.'],
      ['Wall sit', 'legs', 0, 'v', '3 × 30 s', 'wallsit', 'Back flat on the wall, thighs level.', 'Knees over ankles, breathe steadily.', ['legs'], ['glutes']],
      ['Glute bridge', 'legs', 0, 'v', '3 × 15', 'glutebridge', 'Lie on your back, feet flat.', 'Drive through your heels and squeeze at the top.', ['hips'], ['glutes', 'hamstrings', 'lowback']],
      ['Calf raise', 'legs', 0, 'v', '3 × 20', 'calf', 'Rise as high as you can.', 'Pause, then lower slowly.', ['legs'], ['hamstrings']],
      ['Bodyweight squat', 'legs', 1, 'm', '3 × 15', 'squat', 'Feet shoulder width, toes slightly out.', 'Sit down until your thighs are at least level.'],
      ['Reverse lunge', 'legs', 1, 'v', '3 × 10 per side', 'lunge', 'Step back and lower the back knee.', 'Push through the front heel to stand.'],
      ['Split squat', 'legs', 1, 'v', '3 × 10 per side', 'lunge', 'Long stance, back heel up.', 'Drop the back knee straight down.'],
      ['Single-leg glute bridge', 'legs', 1, 'v', '3 × 10 per side', 'glutebridge', 'One foot down, the other leg straight up.', 'Lift without letting your hips tilt.', ['hips'], ['glutes', 'hamstrings']],
      ['Bulgarian split squat', 'legs', 2, 'm', '3 × 8 per side', 'bulgarian', 'Back foot on the bed.', 'Take 3 seconds on the way down.'],
      ['Cossack squat', 'legs', 2, 'v', '3 × 6 per side', 'cossack', 'Wide stance, sit down into one leg.', 'Keep the other leg straight, toes up.'],
      ['Single-leg calf raise', 'legs', 2, 'v', '3 × 12 per side', 'calf', 'Hold a wall for balance.', 'Full range, slow on the way down.', ['legs'], ['hamstrings']],
      ['Hip thrust', 'legs', 2, 'v', '3 × 12', 'glutebridge', 'Shoulders against the bed edge.', 'Lift your hips until your body is a flat table.', ['hips'], ['glutes', 'hamstrings']],
      ['Pistol squat to the bed', 'legs', 3, 'm', '3 × 5 per side', 'pistol', 'Squat on one leg down to the bed.', 'The other leg reaches forward.'],
      ['Assisted shrimp squat', 'legs', 3, 'v', '3 × 5 per side', 'lunge', 'Hold your back foot, other hand on a wall.', 'Lower the back knee to a pillow.'],
      ['Single-leg Romanian deadlift', 'legs', 3, 'v', '3 × 8 per side', 'rdl', 'Hinge at the hip on one leg.', 'Back leg and chest move together like a seesaw.', ['hips'], ['hamstrings', 'glutes', 'lowback']],
      ['Reverse Nordic', 'legs', 3, 'v', '3 × 6', 'nordic', 'Kneel on something soft, body straight.', 'Lean back slowly, then pull yourself up.', ['legs', 'core'], []],
      ['Pistol squat', 'legs', 4, 'm', '3 × 5 per side', 'pistol', 'Full depth on one leg.', 'Arms forward to balance.'],
      ['Shrimp squat', 'legs', 4, 'v', '3 × 4 per side', 'lunge', 'Hold your back foot behind you.', 'Touch the back knee down and stand.'],
      ['Slow pistol', 'legs', 4, 'v', '3 × 3 per side', 'pistol', 'Five seconds down.', 'Pause at the bottom, then rise.'],

      ['Dead bug', 'core', 0, 'm', '3 × 8 per side', 'deadbug', 'Low back pressed into the floor.', 'Lower the opposite arm and leg slowly.'],
      ['Bird-dog', 'core', 0, 'v', '3 × 8 per side', 'birddog', 'On all fours, reach one arm and the opposite leg.', 'Keep your hips level.', ['core'], ['lowback', 'glutes']],
      ['Knee plank', 'core', 0, 'v', '3 × 20 s', 'plank', 'Forearms down, knees down.', 'Straight line from head to knees.'],
      ['Plank', 'core', 1, 'm', '3 × 30 s', 'plank', 'Elbows under your shoulders.', 'Squeeze your glutes, no sagging.'],
      ['Knee side plank', 'core', 1, 'v', '3 × 20 s per side', 'sideplank', 'Elbow under shoulder, knees bent.', 'Lift your hips into a straight line.'],
      ['Tucked hollow hold', 'core', 1, 'v', '3 × 20 s', 'hollowtuck', 'Low back pressed down.', 'Knees tucked, arms reaching forward.'],
      ['Hollow hold', 'core', 2, 'm', '3 × 20 s', 'hollow', 'Arms overhead, legs low and straight.', 'Your low back stays glued to the floor.'],
      ['Side plank', 'core', 2, 'v', '3 × 30 s per side', 'sideplank', 'Feet stacked, hips high.', 'Hold one straight line.'],
      ['Russian twist', 'core', 2, 'v', '3 × 20', 'twist', 'Lean back about 45 degrees, chest up.', 'Rotate your hands side to side.'],
      ['Plank shoulder taps', 'core', 2, 'v', '3 × 10 per side', 'shouldertap', 'High plank, feet wide.', 'Tap the opposite shoulder without rocking.', ['core', 'shoulders'], []],
      ['Woodchop', 'core', 0, 'v', '3 × 12 per side', 'woodchop', 'Hands clasped high on one side.', 'Chop down across your body and pivot the back foot.'],
      ['Tuck L-sit on chairs', 'core', 3, 'm', '3 × 10 s', 'lsit', 'Hands on two chairs, arms locked.', 'Push down and lift your tucked knees.', ['core', 'hips', 'arms'], []],
      ['Bent-knee windshield wipers', 'core', 3, 'v', '3 × 8 per side', 'wipers', 'On your back, arms out, knees up.', 'Lower both knees to one side and back.'],
      ['Hollow rocks', 'core', 3, 'v', '3 × 15', 'hollowrock', 'Hold the hollow shape.', 'Rock gently from shoulders to hips.'],
      ['Side plank reach-through', 'core', 3, 'v', '3 × 8 per side', 'sideplank', 'From a side plank, reach under your body.', 'Rotate back up to the start.'],
      ['L-sit', 'core', 4, 'm', '3 × 10 s', 'lsit', 'Legs straight and level.', 'Push your shoulders down hard.', ['core', 'hips', 'arms'], []],
      ['Dragon flag negative', 'core', 4, 'v', '3 × 3', 'dragonflag', 'Hold the bed frame behind your head.', 'Lower your straight body as one piece.'],
      ['Straight-leg windshield wipers', 'core', 4, 'v', '3 × 6 per side', 'wipers', 'Legs straight up.', 'Lower them side to side, shoulders down.'],
      ['V-up', 'core', 4, 'v', '3 × 10', 'vup', 'Start flat with arms overhead.', 'Fold up to touch your toes, then lower slowly.'],

      ['Single-leg stand', 'balance', 0, 'm', '2 × 30 s per side', 'singleleg', 'Stand tall on one foot.', 'Fix your eyes on one spot.', ['legs', 'core'], []],
      ['Eyes-closed single-leg stand', 'balance', 0, 'v', '2 × 20 s per side', 'singleleg', 'Find your balance, then close your eyes.', 'Hover a hand near a wall.', ['legs', 'core'], []],
      ['Heel-to-toe walk', 'balance', 0, 'v', '2 lengths of the room', 'march', 'Heel touches toe on every step.', 'Arms out, slow and steady.', ['legs', 'core'], []],
      ['Tiptoe balance', 'balance', 0, 'v', '3 × 20 s', 'calf', 'Rise onto your toes.', 'Hold still without wobbling.', ['legs', 'core'], []],
      ['Frog stand', 'balance', 1, 'm', '5 × 10 s', 'frogstand', 'Knees rest on the backs of your elbows.', 'Lean forward until your feet float.'],
      ['Wall plank walk', 'balance', 1, 'v', '3 × 3 steps', 'wallwalk', 'From a plank, walk your feet a little way up the wall.', 'Walk back down with control.'],
      ['Crow pose', 'balance', 1, 'v', '5 × 10 s', 'frogstand', 'Knees high on your upper arms.', 'Look forward, not down.'],
      ['Wall handstand', 'balance', 2, 'm', '3 × 20 s', 'handstand', 'Walk your feet up, chest facing the wall.', 'Push the floor away, ears between your arms.'],
      ['Pike hold on the bed', 'balance', 2, 'v', '3 × 20 s', 'pikebed', 'Feet on the bed, hips high.', 'Stack your shoulders over your hands.'],
      ['Wall walk-up', 'balance', 2, 'v', '3 × 3', 'handstand', 'Walk your feet up and your hands in.', 'Walk back out and down slowly.'],
      ['Wall handstand, 60 s', 'balance', 3, 'm', '3 × 30 to 60 s', 'handstand', 'Squeeze your glutes and point your toes.', 'Breathe steadily.'],
      ['Wall shoulder taps', 'balance', 3, 'v', '3 × 6 per side', 'handstand', 'Chest to the wall in a handstand.', 'Shift and tap one shoulder at a time.'],
      ['Kick-up practice', 'balance', 3, 'v', '10 tries', 'handstand', 'Practice the cartwheel bail first.', 'Kick up lightly and find the balance point.'],
      ['Freestanding handstand', 'balance', 4, 'm', '10 attempts', 'handstand', 'Balance with your fingertips.', 'Short, frequent tries beat long ones.'],
      ['30-second freestanding hold', 'balance', 4, 'v', '5 tries', 'handstand', 'Kick up and hold the balance.', 'Work toward 30 seconds over time.'],
      ['Handstand walk', 'balance', 4, 'v', '5 tries', 'handstand', 'Lean a little so you start to fall forward.', 'Step your hands to catch it.'],

      ['March in place', 'cond', 0, 'w', '1 min', 'march', 'Knees up to hip height.', 'Swing your arms.'],
      ['Quiet fast feet', 'cond', 0, 'f', '3 × 20 s', 'jog', 'Tiny quick steps on the balls of your feet.', 'Stay light and quiet.'],
      ['Squat-to-stand speed reps', 'cond', 0, 'f', '3 × 15', 'squat', 'Fast up, controlled down.', 'Swing your arms to help.'],
      ['Step-out plank jack', 'cond', 0, 'f', '3 × 12', 'mountain', 'High plank, step one foot out, then the other.', 'Step back in, no hopping.'],
      ['Slow mountain climbers', 'cond', 0, 'w', '3 × 10 per side', 'mountain', 'High plank, hips level.', 'Bring one knee to your chest at a time.'],
      ['Shadow jog', 'cond', 0, 'w', '1 min', 'jog', 'Jog in place, landing softly.', 'Swing your arms.'],
      ['Skater steps', 'cond', 0, 'f', '3 × 10 per side', 'skater', 'Step wide to one side and reach across.', 'No jumping, just big steps.'],
      ['Burpee walk-out', 'cond', 0, 'f', '3 × 6', 'burpee', 'Hands down, walk your feet back to a plank.', 'Walk them back in and stand tall.'],

      ['Stance and jab', 'strikes', 0, 'm', '2 rounds of 1 min', 'jab', 'Lead foot forward, hands by your cheeks.', 'Snap the lead hand out and straight back.'],
      ['Guard bounce', 'strikes', 0, 'v', '2 rounds of 1 min', 'groove', 'Light bounce on the balls of your feet.', 'Hands stay up the whole time.', ['legs', 'shoulders'], []],
      ['Jab-cross', 'strikes', 0, 'v', '2 rounds of 1 min', 'jab', 'Jab, then turn your hip into the rear hand.', 'Breathe out sharply on each punch.'],
      ['Hooks and uppercuts', 'strikes', 1, 'm', '2 rounds of 1 min', 'hook', 'Hook: elbow up, turn your whole body.', 'Uppercut: dip, then drive up through your legs.'],
      ['Slip and roll', 'strikes', 1, 'v', '2 rounds of 1 min', 'bobweave', 'Slip your head off-line to one side.', 'Roll under in a U shape, hands up.', ['legs', 'core'], []],
      ['Squat to jabs', 'strikes', 1, 'v', '3 × 12', 'squatjab', 'Squat with your hands guarding your face.', 'Stand and throw two jabs.', ['legs', 'shoulders'], ['glutes']],
      ['Front and round kick', 'strikes', 2, 'm', '3 × 8 per side', 'frontkick', 'Lift the knee first, then extend.', 'For the round kick, pivot your standing foot.', ['hips', 'legs', 'core'], []],
      ['Knee strikes', 'strikes', 2, 'v', '2 × 20', 'knee', 'Reach forward like grabbing a shoulder.', 'Drive the knee up as your hands pull down.', ['core', 'hips'], []],
      ['Side kick', 'strikes', 2, 'v', '3 × 8 per side', 'roundkick', 'Chamber the knee toward your chest.', 'Drive the heel straight out to the side.', ['hips', 'legs'], ['glutes']],
      ['Elbow strikes', 'strikes', 2, 'v', '2 rounds of 1 min', 'hook', 'Short, sharp elbows at head height.', 'Turn your hips into each one.'],
      ['Combos with slips', 'strikes', 3, 'm', '3 rounds of 2 min', 'jab', 'Jab, cross, slip, hook.', 'Reset your stance after each combo.'],
      ['Kick-punch combo', 'strikes', 3, 'v', '3 rounds of 2 min', 'frontkick', 'Jab, cross, then a roundhouse.', 'Hands come straight back to guard.'],
      ['Low switch kick', 'strikes', 3, 'v', '3 × 8 per side', 'roundkick', 'A small step to switch stance.', 'Kick low and controlled, no jumping.'],
      ['Full 3-minute rounds', 'strikes', 4, 'm', '4 rounds of 3 min', 'jab', 'Mix punches, kicks and slips.', 'Rest 1 minute between rounds.'],
      ['Flurry finisher', 'strikes', 4, 'v', '4 × 30 s', 'jab', 'All-out fast punches for 30 seconds.', 'Stay light on your feet.'],

      ['Bounce and rock', 'dance', 0, 'm', '2 rounds of 1 min', 'groove', 'Bend your knees to the beat.', 'Let your chest rock forward and back.'],
      ['Two-step', 'dance', 0, 'v', '2 rounds of 1 min', 'twostep', 'Step side to side, tapping your feet together.', 'Add arm swings once it feels easy.'],
      ['Shoulder isolations', 'dance', 0, 'v', '2 × 30 s', 'shoulderiso', 'Keep your hips still.', 'Pop one shoulder up at a time.', ['shoulders'], ['shoulders']],
      ['Body roll', 'dance', 0, 'v', '2 × 8', 'bodyroll', 'Lead with your chest, then belly, then hips.', 'Slow and smooth.', ['core'], ['back']],
      ['Indian step', 'dance', 1, 'm', '2 rounds of 1 min', 'indianstep', 'Kick one foot forward and cross it back.', 'Bounce, arms loose.'],
      ['Cross step', 'dance', 1, 'v', '2 rounds of 1 min', 'indianstep', 'Cross one foot over the other.', 'Open back out with a bounce.'],
      ['Salsa rock', 'dance', 1, 'v', '2 rounds of 1 min', 'indianstep', 'Rock one foot forward and back.', 'Swing your arms across your body.'],
      ['Low-impact running man', 'dance', 1, 'v', '2 × 30 s', 'march', 'Slide one foot back as the other knee lifts.', 'Keep it low and quiet.'],
      ['Six-step', 'dance', 2, 'm', '5 slow rounds', 'sixstep', 'Hands on the floor, step your feet around in a circle.', 'Six steps around and back to the start.', ['shoulders', 'arms', 'core', 'legs'], []],
      ['Three-step', 'dance', 2, 'v', '5 slow rounds', 'sixstep', 'A shorter circle of three steps.', 'Stay low with your hands planted.', ['shoulders', 'arms', 'core', 'legs'], []],
      ['Kick-outs', 'dance', 2, 'v', '3 × 8', 'sixstep', 'From a crouch, shoot both legs out.', 'Hop them back in, hands planted.', ['shoulders', 'core', 'legs'], []],
      ['Controlled go-down', 'dance', 2, 'v', '6 tries', 'godown', 'From standing, sink into a crouch.', 'Your hands catch you, no dropping.'],
      ['Baby freeze', 'dance', 3, 'm', '5 tries, hold 3 s', 'freeze', 'Tuck one elbow into your side, the other against your knee.', 'Lean until your head touches lightly, then lift your feet.', ['shoulders', 'arms', 'core'], []],
      ['CC footwork', 'dance', 3, 'v', '4 rounds', 'sixstep', 'Swing one leg through under your body.', 'Switch sides with a little hop of the hands.', ['shoulders', 'core', 'legs'], []],
      ['Footwork into baby freeze', 'dance', 3, 'v', '4 tries', 'freeze', 'Do one six-step.', 'Drop straight into the freeze.', ['shoulders', 'arms', 'core'], []],
      ['Chair freeze', 'dance', 4, 'm', '5 tries, hold 3 s', 'chairfreeze', 'Elbow into your lower back, other hand on the floor.', 'Cross your legs into a seated shape in the air.', ['shoulders', 'arms', 'core'], []],
      ['Toprock-to-floor transition', 'dance', 4, 'v', '4 tries', 'godown', 'Toprock for 8 counts.', 'Drop into footwork without stopping.'],

      ['Joint circles', 'mobility', 0, 'm', '5 each way per joint', 'jointcircles', 'Neck, shoulders, wrists, hips, ankles.', 'Slow, controlled circles.', ['shoulders', 'hips'], ['shoulders']],
      ['Arm circles', 'mobility', 0, 'v', '30 s each way', 'jointcircles', 'Arms straight out to the sides.', 'Small circles that grow bigger, then reverse.', ['shoulders'], ['shoulders']],
      ['Hip circles', 'mobility', 0, 'v', '5 each way', 'hipcircle', 'Hands on hips, feet planted.', 'Draw big slow circles with your pelvis.', ['hips'], ['glutes', 'lowback']],
      ['Ankle rocks', 'mobility', 0, 'v', '10 per side', 'lowlunge', 'Half-kneel facing a wall.', 'Drive the front knee toward the wall, heel down.', ['legs'], []],
      ['90/90 hip switches', 'mobility', 1, 'm', '8 per side', 'hip9090', 'Sit with both knees bent at 90 degrees.', 'Rotate both knees to the other side.', ['hips'], ['glutes']],
      ['Cat-cow', 'mobility', 1, 'v', '10 slow', 'catcow', 'On all fours, round your back up.', 'Then let your belly drop and look up.', ['core'], ['back', 'lowback']],
      ['Open book', 'mobility', 1, 'v', '8 per side', 'twistlie', 'Lie on your side, knees bent, arms together.', 'Open the top arm across and follow it with your eyes.', ['chest'], ['back']],
      ['Towel pass-through', 'mobility', 1, 'v', '10', 'passthrough', 'Hold a towel wide, arms straight.', 'Lift it over your head and behind you.', ['shoulders', 'chest'], ['shoulders']],
      ['Deep squat sit', 'mobility', 2, 'm', '1 min', 'deepsquat', 'Sink into your deepest squat, heels down.', 'Elbows push your knees out.', ['hips', 'legs'], ['glutes']],
      ["World's greatest stretch", 'mobility', 2, 'v', '3 per side', 'lowlunge', 'Long lunge, hand inside your front foot.', 'Rotate and reach the other arm up.', ['hips', 'legs', 'core'], ['hamstrings', 'back']],
      ['Spine waves', 'mobility', 2, 'v', '8 slow', 'wave', 'Roll down one vertebra at a time.', 'Roll back up from the bottom.', ['core'], ['back', 'lowback']],
      ['Wrist prep circuit', 'mobility', 2, 'v', '1 min', 'wristrock', 'On all fours, rock gently over your hands.', 'Turn your fingers sideways, then back, and rock again.', ['arms'], ['arms']],
      ['Deep squat with rotations', 'mobility', 3, 'm', '2 min', 'deepsquat', 'Sit in a deep squat.', 'Reach one arm up and rotate, then switch.', ['hips', 'legs', 'core'], ['back', 'glutes']],
      ['Jefferson curl', 'mobility', 3, 'v', '2 × 6 slow', 'fold', 'Stand tall and tuck your chin.', 'Curl down one vertebra at a time, then roll up.', [], ['back', 'lowback', 'hamstrings']],
      ['Wall walk-down', 'mobility', 3, 'v', '3 tries', 'bridge', 'Back to a wall, reach overhead.', 'Walk your hands down the wall toward a bridge.', ['shoulders', 'chest', 'hips'], ['back']],
      ['Bridge', 'mobility', 4, 'm', '3 × 10 s', 'bridge', 'Hands by your ears, feet flat.', 'Push up into an arch.', ['shoulders', 'chest', 'hips'], ['back', 'glutes']],
      ['No-hands 90/90 transitions', 'mobility', 4, 'v', '8 per side', 'hip9090', 'Sit tall in a 90/90.', 'Switch sides without using your hands.', ['hips', 'core'], ['glutes']],

      ['Toe reach', 'stretch', 0, 'm', '45 s', 'fold', 'Soft knees, hinge at your hips.', 'Let your hands hang toward your toes.', [], ['hamstrings', 'lowback']],
      ['Low lunge', 'stretch', 1, 'm', '45 s per side', 'lowlunge', 'Back knee down on something soft.', 'Sink your hips forward, chest tall.', ['hips', 'legs'], []],
      ['Pigeon pose', 'stretch', 2, 'm', '45 s per side', 'pigeon', 'Front shin across, back leg long behind you.', 'Fold forward only as far as feels good.', ['hips'], ['glutes']],
      ['Half splits', 'stretch', 3, 'm', '45 s per side', 'halfsplit', 'Back knee down, front leg straight.', 'Hinge forward over the front leg, back flat.', [], ['hamstrings']],
      ['Pancake', 'stretch', 4, 'm', '60 s', 'seatedfold', 'Sit in a wide straddle.', 'Hinge forward from your hips, chest toward the floor.', ['hips', 'legs'], ['hamstrings', 'lowback']],
      ['Lizard', 'stretch', 2, 'v', '45 s per side', 'lowlunge', 'Low lunge with both hands inside the front foot.', 'Lower onto your forearms if it feels good.', ['hips', 'legs'], []],
      ['Butterfly', 'stretch', 0, 'v', '45 s', 'butterfly', 'Soles together, knees falling out.', 'Sit tall and hinge forward gently.', ['hips', 'legs'], []],
      ['Frog stretch', 'stretch', 2, 'v', '45 s', 'childpose', 'On all fours, slide your knees wide.', 'Ease your hips back toward your heels.', ['hips', 'legs'], []],
      ['Happy baby', 'stretch', 1, 'v', '45 s', 'happybaby', 'On your back, hold your feet, knees wide.', 'Rock gently side to side.', ['hips'], ['lowback']],
      ['Standing fold', 'stretch', 0, 'v', '45 s', 'fold', 'Feet hip width, knees soft.', 'Let your head and arms hang.', [], ['hamstrings', 'lowback']],
      ['Seated forward fold', 'stretch', 1, 'v', '45 s', 'seatedfold', 'Legs straight out in front.', 'Reach forward with a long back.', [], ['hamstrings', 'lowback']],
      ['Lying towel stretch', 'stretch', 0, 'v', '30 s per side', 'legup', 'On your back, loop a towel around one foot.', 'Raise the straight leg until you feel a stretch.', [], ['hamstrings']],
      ['Downward dog', 'stretch', 1, 'v', '45 s', 'downdog', 'Hips high, hands and feet planted.', 'Press your chest toward your thighs.', ['shoulders'], ['hamstrings', 'back']],
      ["Child's pose", 'stretch', 0, 'v', '60 s', 'childpose', 'Knees wide, sit back toward your heels.', 'Reach your arms long and breathe slowly.', [], ['back', 'lowback', 'shoulders']],
      ['Lying twist', 'stretch', 0, 'v', '30 s per side', 'twistlie', 'On your back, drop both knees to one side.', 'Arms wide, shoulders stay down.', ['core'], ['lowback', 'back']],
      ['Cobra', 'stretch', 1, 'v', '30 s', 'cobra', 'Lie face down, hands under your shoulders.', 'Press your chest up, hips stay down.', ['core', 'chest'], ['lowback']],
      ['Sphinx', 'stretch', 0, 'v', '45 s', 'cobra', 'Lie face down on your forearms.', 'Lift your chest and relax your lower back.', ['core'], ['lowback']],
      ['Thread the needle', 'stretch', 1, 'v', '30 s per side', 'catcow', 'On all fours, slide one arm under your body.', 'Rest your shoulder and ear on the floor.', ['shoulders'], ['back', 'shoulders']],
      ['Doorway chest stretch', 'stretch', 0, 'v', '30 s per side', 'armstretch', 'Forearm on a door frame at shoulder height.', 'Step through until your chest opens.', ['chest', 'shoulders'], []],
      ['Cross-body shoulder stretch', 'stretch', 0, 'v', '30 s per side', 'armstretch', 'Pull one arm across your chest.', 'Keep that shoulder down.', ['shoulders'], ['shoulders', 'back']],
      ['Overhead triceps stretch', 'stretch', 0, 'v', '30 s per side', 'armstretch', 'Hand behind your head, other hand on the elbow.', 'Stand tall and breathe.', ['arms'], ['arms']],
      ['Puppy pose', 'stretch', 1, 'v', '45 s', 'childpose', 'On all fours, walk your hands forward.', 'Melt your chest toward the floor, hips high.', ['shoulders', 'chest'], ['back']],
      ['Standing quad stretch', 'stretch', 0, 'v', '30 s per side', 'quad', 'Hold your ankle behind you.', 'Knees together, hips pushed slightly forward.', ['legs', 'hips'], []],
      ['Wall calf stretch', 'stretch', 0, 'v', '30 s per side', 'calfwall', 'Back leg straight, heel down.', 'Lean into the wall.', [], ['hamstrings']],
      ['Kneeling shin stretch', 'stretch', 1, 'v', '30 s', 'kneel', 'Kneel with the tops of your feet flat.', 'Sit back toward your heels.', ['legs'], []],

      ['Tripod headstand', 'freezes', 0, 'm', '5 × 10 s', 'headstand', 'Head and hands make a triangle on a soft surface.', 'Walk your feet in and lift your knees onto your elbows.'],
      ['Elbow freeze', 'freezes', 1, 'm', '5 tries, hold 3 s', 'freeze', 'Plant one elbow into your hip.', 'Balance your body sideways on that arm.'],
      ['Turtle freeze', 'freezes', 2, 'm', '5 tries, hold 3 s', 'turtle', 'Both elbows tucked into your stomach.', 'Lean forward and lift both feet.'],
      ['Headstand freeze', 'freezes', 3, 'm', '5 tries, hold 3 s', 'hsfreeze', 'From a tripod headstand, lift your legs.', 'Freeze them in a fun shape.'],
      ['Freeze chains', 'freezes', 4, 'm', '4 tries', 'freeze', 'Link two or three freezes.', 'Move through footwork between them.'],
      ['Lizard hold, 60 s', 'splits', 0, 'm', '60 s per side', 'lowlunge', 'Low lunge, both hands inside the front foot.', 'Breathe and sink a little deeper.'],
      ['Front-split slide', 'splits', 1, 'm', '45 s per side', 'split', 'Hands on books on both sides.', 'Slide the front heel forward a little at a time.'],
      ['Front split, hands on books', 'splits', 2, 'm', '45 s per side', 'split', 'Lower as far as is comfortable.', 'Hips stay square to the front.'],
      ['Side-split prep', 'splits', 3, 'm', '45 s', 'cossack', 'Wide horse stance, hands on the floor.', 'Slide your feet wider bit by bit.'],
      ['Full front split', 'splits', 4, 'm', '30 s per side', 'split', 'Warm up first with lunges.', 'Settle all the way down only when it feels easy.'],
      ['Bear hold', 'crawls', 0, 'm', '3 × 20 s', 'bear', 'On all fours, lift your knees an inch.', 'Back flat, hold still.'],
      ['Bear crawl', 'crawls', 1, 'm', '3 lengths of the room', 'bear', 'Knees hover just off the floor.', 'Move opposite hand and foot together.'],
      ['Crab walk', 'crawls', 2, 'm', '3 lengths of the room', 'crab', 'Sit, hands behind you, lift your hips.', 'Walk forward and back with hips high.'],
      ['Lateral bear crawl', 'crawls', 3, 'm', '3 lengths each way', 'bear', 'Bear position, move sideways.', 'Keep your hips low and level.'],
      ['Crawl flow', 'crawls', 4, 'm', '3 rounds of 1 min', 'crab', 'Move from bear to crab and back.', 'Smooth transitions, no stopping.'],
      ['Bouncing stance', 'flow', 0, 'm', '2 rounds of 1 min', 'groove', 'Light bounce, hands up.', 'Shift your weight front to back.'],
      ['Bob and weave', 'flow', 1, 'm', '2 rounds of 1 min', 'bobweave', 'Bend your knees to duck under.', 'Come up on the other side.'],
      ['Angle steps', 'flow', 2, 'm', '2 rounds of 1 min', 'skater', 'Pivot on your front foot.', 'Step out to a new angle and reset.'],
      ['Footwork with combos', 'flow', 3, 'm', '3 rounds of 2 min', 'jab', 'Move, then throw a combo.', 'Move again right after.'],
      ['3-minute flow round', 'flow', 4, 'm', '3 rounds of 3 min', 'bobweave', 'Footwork, punches, slips and kicks.', 'Keep moving the whole round.'],
      // ---- added: yoga & stretch depth ----
      ['Warrior I', 'stretch', 1, 'v', '30 s per side', 'warrior', 'Long lunge, back heel down and turned out.', 'Reach both arms overhead, hips facing forward.', ['legs', 'hips', 'shoulders'], []],
      ['Warrior flow', 'stretch', 1, 'v', '5 slow rounds per side', 'warrior', 'Start in Warrior I with arms up.', 'Open your arms wide to Warrior II, then back, with your breath.', ['legs', 'hips', 'shoulders'], []],
      ['Tree pose', 'stretch', 1, 'v', '30 s per side', 'tree', 'Foot on your calf or inner thigh, never on the knee.', 'Hands at your chest, or reach up like branches.', ['legs', 'core'], []],
      ['Chair pose', 'stretch', 1, 'v', '3 × 20 s', 'chairpose', 'Sit back like a chair is behind you.', 'Arms by your ears, weight in your heels.', ['legs', 'shoulders'], ['glutes']],
      ['Forward fold, hands clasped', 'stretch', 1, 'v', '30 s', 'fold', 'Interlace your hands behind your back.', 'Fold forward and let your arms fall toward the floor.', ['shoulders', 'chest'], ['hamstrings']],
      ['Wide-leg forward fold', 'stretch', 2, 'v', '45 s', 'fold', 'Feet wide, toes turned slightly in.', 'Fold from the hips, hands to the floor.', [], ['hamstrings', 'lowback']],
      ['Low lunge twist', 'stretch', 2, 'v', '30 s per side', 'lowlunge', 'From a low lunge, plant one hand inside your front foot.', 'Open the other arm to the ceiling.', ['hips', 'core'], ['back']],
      ['Sun salutation', 'stretch', 2, 'v', '4 slow rounds', 'downdog', 'Reach up, fold, step back to plank, cobra, downward dog.', 'Move with your breath, one breath per shape.', ['shoulders', 'core'], ['hamstrings', 'back']],
      ['Dancer pose', 'stretch', 2, 'v', '20 s per side', 'dancer', 'Hold one ankle behind you.', 'Kick into your hand and tip forward, other arm reaching.', ['legs', 'hips', 'shoulders'], []],
      ['Boat pose', 'stretch', 2, 'v', '3 × 20 s', 'boat', 'Sit tall and lean back a little.', 'Lift your shins, arms reaching forward.', ['core', 'hips'], []],
      ['Butterfly fold', 'stretch', 2, 'v', '45 s', 'butterfly', 'Soles of your feet together.', 'Fold forward from your hips, back long.', ['hips'], ['lowback']],
      ['King pigeon prep', 'stretch', 3, 'v', '30 s per side', 'pigeon', 'From pigeon, bend your back knee.', 'Reach back for that foot only if it comes easily.', ['hips', 'legs'], ['glutes']],
      ['Lizard with quad pull', 'stretch', 3, 'v', '30 s per side', 'lowlunge', 'From lizard, bend your back knee.', 'Reach back for the foot gently.', ['hips', 'legs'], []],
      ['Plow pose', 'stretch', 3, 'v', '30 s', 'plow', 'On your back, roll your legs over your head.', 'Toes toward the floor behind you, neck relaxed.', [], ['back', 'lowback', 'hamstrings']],
      ['Shoulder stand', 'stretch', 4, 'v', '30 s', 'shoulderstand', 'From plow, lift your legs straight up.', 'Hands on your back, weight on your shoulders, not your neck.', ['core'], ['back', 'shoulders']],
      ['Wheel pose', 'stretch', 4, 'v', '3 × 10 s', 'wheel', 'Hands by your ears, fingers toward your shoulders.', 'Press up through hands and feet, chest lifting.', ['chest', 'shoulders'], ['back', 'glutes']],
      ['Pancake with reach', 'stretch', 4, 'v', '45 s', 'seatedfold', 'Legs wide, sit tall.', 'Walk your hands forward and breathe into it.', ['hips'], ['hamstrings', 'lowback']],
      // ---- added: hidden paths ----
      ['Tuck to tripod', 'freezes', 1, 'v', '5 tries', 'tucktripod', 'Head and hands make a triangle, knees rest on your elbows.', 'Hold the tuck, then slowly come down.', ['shoulders', 'core'], ['shoulders']],
      ['Turtle shuffle', 'freezes', 3, 'v', '3 tries', 'turtle', 'Hold the turtle.', 'Shift your weight hand to hand to turn in a circle.', ['shoulders', 'arms', 'core'], []],
      ['Air chair prep', 'freezes', 4, 'v', '5 tries', 'chairfreeze', 'One hand down, that elbow tucked into your hip.', 'Lean back and lift your feet one at a time.', ['shoulders', 'arms', 'core'], ['lowback']],
      ['Half split rocks', 'splits', 0, 'v', '10 per side', 'halfsplit', 'Back knee down, front leg straight.', 'Gently rock forward and back.', [], ['hamstrings']],
      ['Frog rocks', 'splits', 1, 'v', '10 slow rocks', 'childpose', 'Knees wide, shins in line with each other.', 'Rock your hips back and forth.', ['hips'], []],
      ['Pigeon to split slide', 'splits', 3, 'v', '45 s per side', 'split', 'Start in pigeon.', 'Slide the back leg long and the front leg straighter.', ['hips', 'legs'], ['hamstrings']],
      ['Inchworm walk', 'crawls', 0, 'v', '5 slow reps', 'downdog', 'Fold down and walk your hands out to plank.', 'Walk your feet toward your hands.', ['shoulders', 'core'], ['hamstrings']],
      ['Crab reach', 'crawls', 1, 'v', '6 per side', 'crab', 'From crab, lift your hips.', 'Reach one arm over to the opposite side.', ['shoulders', 'hips'], ['glutes']],
      ['Gorilla shuffle', 'crawls', 2, 'v', '3 × 6', 'deepsquat', 'Deep squat, hands down in front.', 'Hop your feet sideways past your hands.', ['legs', 'shoulders'], ['glutes']],
      ['Pendulum step', 'flow', 1, 'v', '2 rounds of 1 min', 'groove', 'Hands up, light on your feet.', 'Swing your weight front to back like a pendulum.', ['legs'], []],
      ['Switch stance drill', 'flow', 2, 'v', '2 rounds of 1 min', 'skater', 'Small hop to swap your front foot.', 'Hands stay up as you switch.', ['legs'], ['glutes']],
      ['Slip-slip-cross', 'flow', 3, 'v', '3 × 10', 'bobweave', 'Slip left, slip right.', 'Fire a cross as you come back to center.', ['core', 'shoulders'], []],
      // ---- added: harder finishers (level-gated) ----
      ['Plank jacks', 'cond', 1, 'f', '3 × 15', 'mountain', 'High plank.', 'Jump your feet wide and back, hips level.'],
      ['Mountain climbers', 'cond', 1, 'f', '3 × 20 s', 'mountain', 'Knees drive toward your chest.', 'Fast, with hips steady.'],
      ['Squat jumps', 'cond', 1, 'f', '3 × 10', 'squatjump', 'Squat down, then jump straight up.', 'Land soft with bent knees.'],
      ['Skater hops', 'cond', 2, 'f', '3 × 10 per side', 'skater', 'Jump side to side.', 'Land softly on one leg.'],
      ['Bear crawl sprints', 'cond', 2, 'f', '4 × 20 s', 'bear', 'Knees just off the floor.', 'Quick small steps forward and back.'],
      ['Burpee', 'cond', 2, 'f', '3 × 8', 'burpee', 'Squat, hands down, jump back to plank.', 'Jump your feet in and hop up.'],
      ['Tuck jumps', 'cond', 3, 'f', '3 × 6', 'tuckjump', 'Jump and pull your knees up.', 'Land soft and quiet.'],
      ['Lunge jumps', 'cond', 3, 'f', '3 × 6 per side', 'lunge', 'Lunge low, jump, switch legs in the air.', 'Land soft with both knees bent.'],
      ['Burpee tuck jump', 'cond', 4, 'f', '3 × 6', 'tuckjump', 'A full burpee.', 'Finish with a tuck jump instead of a hop.'],
      // ---- added: pro tier + pull ----
      ['Coffee grinder', 'dance', 4, 'v', '4 rounds per side', 'sixstep', 'Hands down, one leg straight out.', 'Sweep it in a circle and hop the other leg over it.', ['legs', 'shoulders', 'core'], []],
      ['Footwork freestyle', 'dance', 4, 'v', '3 rounds of 1 min', 'sixstep', 'Mix six-step, three-step and kick-outs.', 'Change direction whenever you like.', ['legs', 'shoulders', 'core'], []],
      ['Toprock freestyle', 'dance', 3, 'v', '2 rounds of 1 min', 'indianstep', 'Indian step and cross step.', 'Add your own arm style.', ['legs'], []],
      ['Shuffle running man', 'dance', 2, 'v', '2 rounds of 1 min', 'march', 'Knee up, then slide that foot back as you land.', 'Keep it bouncy and light.', ['legs', 'core'], []],
      ['Teep push kick', 'strikes', 1, 'v', '10 per side', 'frontkick', 'Lift the knee high.', 'Push the ball of your foot straight out.', ['hips', 'core'], []],
      ['Switch kick combo', 'strikes', 4, 'v', '3 × 6 per side', 'roundkick', 'Jab, cross, quick switch.', 'Round kick off the back leg.', ['hips', 'legs', 'core'], []],
      ['Slow spinning back kick', 'strikes', 4, 'v', '5 per side', 'roundkick', 'Turn your back and look over your shoulder.', 'Drive the heel straight back.', ['hips', 'legs', 'core'], ['glutes']],
      ['Cossack flow', 'mobility', 3, 'v', '6 per side', 'cossack', 'Wide stance.', 'Glide low from one side to the other.', ['hips', 'legs'], ['hamstrings']],
      ['Pancake good mornings', 'mobility', 4, 'v', '8 slow reps', 'seatedfold', 'Sit with legs wide, hands behind your head.', 'Hinge forward with a long back, then sit tall.', ['hips'], ['hamstrings', 'lowback']],
      ['Bridge rotations', 'mobility', 4, 'v', '4 per side', 'wheel', 'From bridge, shift onto one hand.', 'Rotate through, then come back to bridge.', ['shoulders', 'chest'], ['back']],
      ['Towel isometric pull', 'pull', 0, 'v', '5 × 10 s', 'pullapart', 'Stand on the middle of a towel.', 'Pull the ends up hard and hold.', ['arms'], ['back', 'shoulders']],
      ['Prone swimmers', 'pull', 1, 'v', '3 × 8', 'superman', 'Lie face down, arms overhead.', 'Sweep your arms down to your hips and back.', [], ['back', 'shoulders']],
      ['Doorframe row', 'pull', 1, 'v', '3 × 10', 'row', 'Hold both sides of a doorframe.', 'Lean back, then pull your chest to the frame.', ['arms'], ['back', 'shoulders']],
      ['Scapular desk pulls', 'pull', 1, 'v', '3 × 10', 'row', 'Hang under the desk, arms straight.', 'Squeeze your shoulder blades without bending your arms.', [], ['back']],
      ['Desk row pulses', 'pull', 2, 'v', '3 × 15', 'row', 'Top half of the row only.', 'Quick and controlled.', ['arms'], ['back']],
      ['One-arm doorframe row', 'pull', 3, 'v', '3 × 6 per side', 'row', 'One hand on the doorframe edge.', 'Lean back and pull, hips square.', ['arms', 'core'], ['back']],
      // ---- added: a few more everywhere ----
      ['Staggered push-up', 'push', 2, 'v', '3 × 6 per side', 'pushup', 'One hand a little forward, one back.', 'Switch the stagger each set.'],
      ['Push-up with shoulder taps', 'push', 2, 'v', '3 × 6', 'shouldertap', 'Do a push-up.', 'At the top, tap each shoulder without rocking.', ['chest', 'shoulders', 'core'], []],
      ['Five-second push-up', 'push', 3, 'v', '3 × 4', 'pushup', 'Take five full seconds down.', 'Pause just above the floor, then press.'],
      ['Sumo squat', 'legs', 1, 'v', '3 × 12', 'squat', 'Feet wide, toes out.', 'Knees track over your toes.', ['legs', 'hips'], ['glutes']],
      ['Lateral lunge', 'legs', 2, 'v', '3 × 8 per side', 'cossack', 'Big step to the side.', 'Sit back into that hip, other leg straight.', ['legs', 'hips'], ['glutes']],
      ['Wall sit march', 'legs', 2, 'v', '3 × 20 s', 'wallsit', 'Hold a wall sit.', 'Lift one foot at a time without sliding.', ['legs', 'core'], []],
      ['Plank to downward dog', 'core', 1, 'v', '3 × 8', 'downdog', 'Start in a plank.', 'Push your hips up and back, then return.', ['core', 'shoulders'], ['hamstrings']],
      ['Bear plank shoulder taps', 'core', 1, 'v', '3 × 8 per side', 'bear', 'Knees hover an inch off the floor.', 'Tap opposite shoulders, hips still.', ['core', 'shoulders'], []],
      ['Single-leg reach', 'balance', 1, 'v', '8 per side', 'rdl', 'Stand on one leg.', 'Reach forward to tap the floor, then stand tall.', ['legs', 'core'], ['hamstrings', 'glutes']],
      ['Tree pose, eyes closed', 'balance', 2, 'v', '20 s per side', 'tree', 'Find your tree pose.', 'Close your eyes and stay soft.', ['legs', 'core'], []],
      ['Cat crawl', 'crawls', 1, 'v', '3 × 8 steps', 'bear', 'Hands and feet down, knees just off the floor.', 'Move opposite hand and foot together, quietly.', ['shoulders', 'core'], []],
      ['Frog jumps', 'crawls', 2, 'v', '3 × 5', 'squatjump', 'Deep squat, hands touch the floor.', 'Jump forward and land back in the squat.', ['legs'], ['glutes']],
      ['Crocodile crawl', 'crawls', 3, 'v', '3 × 6 steps', 'pushup', 'Hold the bottom of a push-up.', 'Crawl forward, knee toward elbow, staying low.', ['chest', 'shoulders', 'core'], []],
      ['Neck isolations', 'dance', 0, 'v', '2 × 30 s', 'neckslide', 'Shoulders still.', 'Slide your head forward, back and side to side.', ['shoulders'], []],
      ['Chest isolations', 'dance', 1, 'v', '2 × 30 s', 'bodyroll', 'Hips still.', 'Push your chest forward, then pull it back.', ['core', 'chest'], ['back']],
      ['Cloud hands', 'mobility', 0, 'v', '2 min', 'cloudhands', 'Soft knees, shift your weight side to side.', 'Arms float past your face like clouds, slow breath.', ['shoulders', 'core'], []],
      ['Pelvic tilts', 'mobility', 0, 'v', '10 slow reps', 'pelvictilt', 'On your back, knees bent.', 'Gently rock your low back flat, then arch a little.', ['core', 'hips'], ['lowback']],
      ['Locomotion warm-up', 'cond', 0, 'w', '2 min', 'march', 'Skip, side-shuffle, walk backwards.', 'Change it up every 20 seconds.'],
      ['Side crow', 'balance', 3, 'v', '5 tries, hold 5 s', 'frogstand', 'Twist and stack both knees on one arm.', 'Lean forward until your feet float.', ['shoulders', 'arms', 'core'], []],
    ];
  }
  animRows() {
    const S = 'H50,14 N50,23 P50,49 E48,36 W47,48 K48,69 F47,89 e52,36 w53,48 k52,69 f53,89';
    const FR = 'H50,14 N50,23 P50,49 K46,69 F44,89 k54,69 f56,89';
    const JA = 'H49,15 N48,24 P47,49 E56,33 W57,22 K54,68 F58,89 e44,34 w48,22 k42,68 f37,89';
    const PU = 'H19,57 N26,61 P55,73 E26,75 W26,89 K72,81 F88,88 e29,75 w29,89 k72,80 f88,87';
    const BD = 'H22,58 N28,62 P58,62 E28,75 W28,89 K58,89 F72,89 e30,75 w30,89 k60,89 f74,89';
    const YT = 'H18,84 N26,85 P55,86 E14,86 W5,85 K72,87 F88,87 e16,86 w7,85 k72,87 f88,87';
    const LY = 'H12,84 N20,85 P46,86 E30,88 W40,88';
    const FS = 'H30,66 N36,62 P56,50 E38,76 W38,89 K44,70 F60,89 e40,76 w40,89 k46,70 f62,89';
    const SQB = 'H48,42 N49,50 P40,70 E58,50 W68,50 K58,72 F50,89 e58,51 w68,51 k60,72 f54,89';
    return {
      stand: [S, 'H50,15 N50,24', 3],
      wallpush: ['H36,22 N41,30 P53,57 E31,31 W20,32 K57,73 F61,89 e33,32 w21,34 k59,73 f63,89', 'H30,26 N35,33 P51,59 E30,40 e32,41', 2.4, { wall: 18 }],
      incline: ['H21,32 N28,37 P56,61 E28,49 W27,60 K71,75 F86,89 e30,49 w29,60 k72,75 f87,89', 'H23,43 N30,48 P57,67 E37,53 e39,53 K72,78 k73,78', 2.2, { box: [6, 60, 24, 30] }],
      kneepush: ['H19,59 N26,62 P52,74 E26,75 W26,89 K70,88 F86,80 e29,75 w29,89 k72,88 f88,80', 'H21,76 N28,79 P54,82 E35,81 e37,81', 2.2],
      pushup: [PU, 'H21,76 N28,79 P56,82 E35,80 e37,80 K72,85 k72,85', 2.2],
      decline: ['H19,62 N26,64 P55,60 E26,76 W26,89 K71,58 F86,56 e29,76 w29,89 k71,57 f86,55', 'H21,80 N28,80 P56,66 E35,82 e37,82 K72,60 k72,60', 2.2, { box: [72, 58, 24, 32] }],
      dip: ['H31,30 N29,38 P34,62 E28,49 W27,60 K58,64 F60,89 e30,49 w29,60 k60,64 f62,89', 'H33,42 N31,50 P33,72 E20,52 e22,52 K58,68 k60,68', 2.2, { box: [4, 60, 26, 30] }],
      pike: ['H27,66 N31,58 P52,32 E28,73 W24,89 K64,60 F76,89 e30,73 w26,89 k66,60 f78,89', 'H22,81 N28,71 P50,38 E34,79 e36,79', 2.4],
      handstand: ['H50,72 N50,63 P51,38 E50,76 W50,89 K52,22 F53,7 e52,76 w52,89 k54,22 f55,7', 'H50,70 N50,61 P52,37 K53,21 F55,6 k55,21 f57,6', 3, { wall: 60 }],
      ytw: [YT, 'H17,81 N26,84 E15,79 W7,72 e17,79 w9,72', 2.4],
      superman: [YT, 'H17,80 N26,83 E15,78 W6,74 e17,78 w8,74 K72,83 F88,78 k72,83 f88,78', 2.4],
      pullapart: [FR + ' E44,32 W48,34 e56,32 w52,34', 'E36,28 W26,30 e64,28 w74,30', 2.2],
      row: ['H22,64 N29,66 P58,77 E30,56 W30,47 K74,83 F88,89 e32,56 w32,47 k74,83 f88,89', 'H24,52 N31,54 P60,70 E42,50 e44,50 K75,79 k75,79', 2, { bar: [10, 50, 46] }],
      chairsquat: [S + ' E57,34 W67,34 e57,35 w67,35', 'H52,40 N50,48 P36,66 E58,48 W68,48 e58,49 w68,49 K56,70 F48,89 k58,70 f52,89', 2.6, { box: [20, 66, 20, 24] }],
      squat: [S + ' E57,34 W67,34 e57,35 w67,35', SQB, 2.4],
      wallsit: ['H33,34 N33,43 P33,64 E40,52 W46,58 K54,64 F54,89 e42,52 w48,58 k56,64 f56,89', 'H33,35 N33,44', 3, { wall: 26 }],
      glutebridge: [LY + ' K60,70 F70,89 e30,88 w40,88 k62,70 f72,89 P46,86', 'P46,72 K60,66 k62,66', 2.2],
      calf: [S, 'H50,10 N50,19 P50,45 E48,32 W47,44 K48,66 e52,32 w53,44 k52,66', 1.6],
      lunge: ['H50,14 N50,23 P50,48 E48,35 W47,47 K56,68 F58,89 e52,35 w53,47 k44,68 f38,89', 'H50,30 N50,39 P48,63 E47,51 W46,62 K62,70 F60,89 e51,51 w52,62 k40,86 f26,88', 2.4],
      bulgarian: ['H52,16 N52,25 P50,50 E50,37 W49,49 K60,68 F60,89 e54,37 w55,49 k40,66 f22,70', 'H52,30 N52,39 P46,64 E50,51 W49,62 K64,70 e54,51 w55,62 k36,82', 2.6, { box: [12, 70, 22, 20] }],
      cossack: ['H50,26 N50,35 P50,60 E44,46 W48,56 K34,70 F26,89 e56,46 w52,56 k66,70 f74,89', 'H36,38 N38,47 P34,74 E40,58 W46,64 K24,74 e44,58 w50,64 k60,80 f78,86', 2.8],
      pistol: [S + ' E56,32 W66,32 e56,33 w66,33 k58,60 f70,62', 'H56,52 N55,60 P44,78 E64,62 W74,62 K58,76 F50,89 e64,63 w74,63 k66,82 f84,82', 3],
      rdl: ['H50,14 N50,23 P52,49 E50,36 W50,48 K52,69 F52,89 e54,36 w54,48 k56,68 f58,88', 'H24,40 N32,42 P54,48 E33,52 W33,62 K54,69 F54,89 e35,52 w35,62 k70,46 f86,44', 2.8],
      nordic: ['H50,33 N50,42 P50,68 E45,54 W57,51 K50,88 F30,88 e46,54 w58,52 k52,88 f32,88', 'H16,45 N22,52 P38,72 E22,65 W32,59 K50,88 F30,88 e22,65 w33,60 k52,88 f32,88', 2.8],
      deadbug: [LY + ' E22,72 W22,62 K46,70 F58,70 e24,72 w24,62 k48,70 f60,70 H12,82 N20,82 P46,84', 'E12,74 W4,70 K56,78 F72,82', 2.4],
      birddog: [BD, 'E18,60 W8,58 K72,62 F88,62', 2.4],
      plank: ['H20,70 N28,73 P56,75 E28,88 W16,88 K72,81 F88,88 e30,88 w18,88 k72,81 f88,88', 'H20,69 N28,72 P56,73', 3],
      sideplank: ['H22,62 N28,66 P56,76 E28,80 W28,89 K72,82 F88,88 e36,60 w42,52 k72,82 f88,88', 'P56,70 e34,56 w38,46', 2.6],
      hollow: ['H16,80 N24,82 P50,86 E14,78 W4,74 K68,82 F86,78 e16,78 w6,74 k68,82 f86,78', 'H16,76 N24,80 K68,84 F86,82 k68,84 f86,82', 1.8],
      twist: ['H38,46 N41,54 P52,82 E50,64 W60,66 K66,70 F78,82 e52,64 w62,66 k66,70 f78,82', 'H36,46 E34,64 W26,68 e36,64 w28,68', 1.6],
      shouldertap: [PU, 'E30,72 W27,64', 1.8],
      woodchop: [FR + ' E60,16 W68,8 e60,18 w66,10', 'H46,22 N47,30 E40,44 W32,56 e42,46 w34,58 K42,72 k54,72', 1.8],
      lsit: ['H40,30 N40,39 P42,60 E40,50 W40,62 K56,58 F70,60 e42,50 w42,62 k56,58 f70,60', 'K56,56 F70,56 k56,56 f70,56', 3, { box: [26, 62, 40, 28] }],
      wipers: [LY + ' e30,88 w40,88 P46,86 K48,66 F50,48 k50,66 f52,48', 'K56,70 F68,58 k58,70 f70,58', 2.4],
      vup: [LY + ' P48,86 E10,84 W2,84 K68,86 F86,86 e10,84 w2,84 k68,86 f86,86', 'H34,62 N38,70 P50,84 E46,60 W58,52 K62,66 F70,52 e46,60 w58,52 k62,66 f70,52', 2],
      singleleg: ['H50,14 N50,23 P50,49 E40,34 W32,40 K49,69 F49,89 e60,34 w68,40 k58,58 f54,72', 'H51,14 N51,23', 3],
      march: [S, 'K56,58 F54,74 E44,36 W40,44 e58,38 w64,44', 1.2],
      jog: ['H52,12 N52,21 P50,47 E48,33 W44,45 K69,52 F66,72 e48,34 w60,36 k50,67 f49,87', 'H52,12 N52,21 P50,47 E48,34 W60,36 K50,67 F49,87 e48,33 w44,45 k69,52 f66,72', 0.7, null, 'H52,14 N51,23 P50,49 E47,35 W50,47 K56,68 F54,88 e48,36 w52,47 k53,69 f48,88'],
      frogstand: [FS, 'H27,72 N34,66 P54,52 K42,72 F62,76 k44,72 f64,76', 2.6],
      mountain: [PU, 'P54,70 K44,78 F50,86', 1],
      skater: [FR + ' E44,36 W40,46 e56,36 w60,46', 'H40,22 N41,31 P42,54 E34,40 W30,50 e50,40 w58,46 K34,70 F30,89 k54,72 f62,86', 1.6],
      burpee: [S, PU, 2.4],
      jab: [JA, 'E64,24 W76,22', 1],
      groove: [S, 'H50,18 N50,27 P50,53 K54,70 k56,70 E46,40 e54,40', 0.8],
      hook: [JA, 'H50,16 N50,25 E62,26 W58,20', 1.2],
      bobweave: [JA, 'H54,32 N52,40 P48,58 E58,46 W58,36 e48,46 w52,36 K56,72 k42,72', 1.6],
      frontkick: [JA, 'H44,16 N44,25 P46,50 K60,54 F80,48', 1.4],
      knee: [JA, 'K58,46 F54,64 E60,44 W58,50', 1.2],
      roundkick: [JA, 'H42,18 N43,27 P47,50 K62,46 F82,40 E38,32 W32,36', 1.4],
      indianstep: [S, 'F64,84 K58,70 E42,36 W36,44 e58,36 w62,42', 0.9],
      sixstep: ['H26,59 N34,63 P58,72 E35,76 W36,88 K38,69 F42,89 e38,75 w42,87 k60,92 f80,89', 'H26,59 N34,63 P58,72 E35,76 W36,88 K58,92 F78,89 e38,75 w42,87 k38,70 f44,89', 1.4, null, 'H26,55 N34,59 P58,69 E35,72 W36,84 K39,74 F52,89 e38,72 w41,83 k43,82 f62,89'],
      freeze: [FS, 'H36,84 N42,76 P58,58 E46,74 W44,89 K62,62 F76,56 e48,74 w46,89 k64,64 f78,60', 2.6],
      jointcircles: [FR + ' E38,25 W28,25 e62,25 w72,25', 'E42,15 W40,5 e58,15 w60,5', 2],
      hipcircle: [FR + ' E42,40 W46,48 e58,40 w54,48', 'H47,14 N48,23 P55,48 E44,40 W50,47 e60,40 w58,47', 1.6],
      lowlunge: ['H50,32 N50,40 P50,64 E50,52 W52,62 K64,70 F64,89 e52,52 w54,62 k40,86 f26,88', 'H54,38 N53,46 P53,70 E57,58 W60,66 e59,58 w62,66 K67,72', 3],
      hip9090: ['H43,49 N43,58 P46,84 E38,70 W33,81 K62,72 F75,87 e39,70 w35,82 k63,74 f79,87', 'H43,49 N43,58 P46,84 E38,70 W33,81 K66,83 F47,88 e39,70 w35,82 k66,86 f46,89', 2.4],
      catcow: [BD + ' H24,70 N28,62', 'H20,54 N28,64 P58,64', 3],
      twistlie: [LY + ' e30,88 w40,88 P46,86 K58,70 F66,86 k60,70 f68,86', 'K64,80 F70,88 k66,80 f72,88', 3],
      deepsquat: [SQB, 'H48,44 N49,52', 3],
      handrelease: ['H23,60 N31,63 P55,73 E29,76 W26,88 K72,80 F89,89 e30,76 w29,88 k72,80 f90,88', 'H20,84 N28,85 P54,86 E16,82 W4,79 K71,87 F88,88 e18,82 w6,79 k71,87 f88,88', 2.4, null],
      onearm: ['H23,60 N31,63 P55,73 E29,76 W26,88 K72,80 F89,89 e43,58 w46,70 k72,80 f90,88', 'H17,76 N26,78 P52,81 E37,85 W26,89 K70,84 F90,88 e36,69 w45,77 k69,84 f89,89', 2.6, null],
      pseudo: ['H21,63 N29,67 P54,74 E36,78 W42,89 K71,80 F89,89 e37,78 w43,88 k71,80 f89,88', 'H16,77 N24,79 P50,83 E37,78 W42,89 K69,86 F89,88 e37,79 w44,89 k69,85 f89,87', 2.4, null],
      downdog: ['H25,73 N31,66 P48,46 E26,77 W22,89 K55,67 F62,89 e28,77 w24,89 k57,67 f64,89', 'H25,73 N31,66 P48,46 E26,77 W22,89 K60,64 F58,84 e28,77 w24,89 k57,67 f64,89', 2.6, null],
      pikebed: ['H24,72 N30,65 P46,46 E28,77 W28,89 K62,58 F78,71 e30,77 w30,89 k64,58 f80,71', 'H24,73 N30,66 P46,47 E28,77 W28,89 K62,59 F78,71 e30,77 w30,89 k64,59 f80,71', 3, { box: [66, 72, 30, 18] }],
      elevpike: ['H24,72 N30,65 P46,46 E28,77 W28,89 K62,58 F78,71 e30,77 w30,89 k64,58 f80,71', 'H24,81 N30,74 P48,54 E39,80 W28,89 K63,61 F78,71 e41,80 w30,89 k65,61 f80,71', 2.6, { box: [66, 72, 30, 18] }],
      wallwalk: ['H23,60 N31,63 P55,73 E29,76 W26,88 K70,80 F87,90 e30,76 w29,88 k70,80 f87,89', 'H21,72 N30,70 P54,60 E36,82 W26,89 K69,73 F86,62 e38,81 w29,89 k68,74 f86,66', 3, { wall: 88 }],
      hollowtuck: ['H16,78 N24,81 P50,86 E34,76 W44,72 K58,70 F70,78 e36,76 w46,72 k60,70 f72,78', 'H16,77 N24,80 P50,86 E34,75 W44,71 K60,68 F72,74 e36,75 w46,71 k62,68 f74,74', 1.8, null],
      hollowrock: ['H18,72 N25,78 P50,87 E12,70 W3,66 K69,84 F88,80 e14,70 w5,66 k69,84 f88,80', 'H14,84 N22,86 P48,86 E9,84 W0,82 K66,78 F84,70 e11,84 w2,82 k66,78 f84,70', 1.3, null],
      dragonflag: ['H14,84 N22,84 P30,59 E12,82 W5,87 K42,42 F54,25 e14,82 w7,87 k44,42 f56,25', 'H14,84 N22,84 P47,76 E12,82 W5,87 K66,70 F86,64 e14,82 w7,87 k66,70 f86,64', 3.2, null],
      bodyroll: ['H56,14 N54,23 P48,48 E48,34 W46,46 K48,68 F47,88 e48,34 w50,46 k51,68 f53,88', 'H45,18 N47,27 P53,52 E48,40 W50,52 K57,72 F47,89 e50,39 w54,51 k61,70 f53,89', 1.8, null, 'H50,16 N50,25 P51,51 E49,38 W48,50 K55,71 F47,89 e51,38 w52,50 k58,70 f53,89'],
      shoulderiso: ['H50,13 N50,23 P50,49 E51,36 W52,48 K49,69 F47,89 e51,36 w53,48 k52,69 f53,89', 'H51,14 N50,23 P50,49 E43,34 W54,40 K49,69 F47,89 e51,36 w52,48 k52,69 f53,89', 0.9, null],
      twostep: ['H50,15 N50,24 P48,50 E40,32 W42,44 K51,70 F46,89 e48,37 w58,44 k56,68 f60,88', 'H50,15 N50,24 P52,50 E48,37 W58,44 K51,70 F42,88 e40,32 w42,44 k58,69 f56,89', 1.0, null],
      turtle: ['H19,64 N28,66 P54,70 E35,77 W34,89 K46,88 F66,89 e34,78 w38,89 k48,89 f68,89', 'H22,72 N28,70 P52,66 E40,76 W34,89 K48,80 F66,76 e42,76 w38,89 k50,81 f68,77', 2.4, null],
      chairfreeze: ['H32,86 N40,82 E52,77 W52,89 e44,70 w50,60 P64,72 K83,70 F84,89 k82,71 f82,89', 'K70,52 F89,56 k82,64 f72,50', 2.6, null],
      squatjab: ['H48,42 N49,50 P40,70 E58,50 W66,44 K58,72 F50,89 e56,50 w60,42 k60,72 f54,89', 'H50,14 N50,23 P50,49 E62,22 W74,21 K48,69 F47,89 e54,32 w58,22 k52,69 f53,89', 1.1, null],
      godown: ['H50,14 N50,23 P50,49 E48,36 W47,48 K48,69 F47,89 e52,36 w53,48 k52,69 f53,89', 'H67,46 N59,51 P44,72 E61,64 W63,75 K64,73 F52,89 e62,63 w64,75 k64,71 f56,89', 2.4, null],
      warrior: ['H51,26 N51,35 P50,61 E55,23 W53,11 K68,69 F72,89 e56,23 w55,11 k41,79 f24,89', 'H50,28 N50,37 P49,63 E63,37 W75,37 K68,70 F73,89 e37,37 w25,37 k43,82 f24,89', 3.2],
      tree: ['H50,14 N50,23 P50,49 E45,35 W57,34 K64,60 F46,68 e46,35 w58,35 k51,69 f52,89', 'H50,13 N50,22 P50,48 E54,10 W52,-2 K64,59 F46,67 e55,10 w54,-2 k51,68 f52,88', 3],
      chairpose: ['H56,33 N52,41 P40,64 E59,30 W65,20 K59,70 F52,89 e60,31 w67,21 k59,69 f55,89', 'H55,35 N51,43 P39,66 E58,32 W64,22 K59,70 F52,89 e59,33 w66,23 k59,69 f55,89', 2.6],
      boat: ['H33,54 N38,62 P50,84 E50,66 W62,64 K67,73 F84,66 e52,66 w64,64 k69,74 f86,67', 'H32,56 N37,64 P50,84 E49,68 W61,66 K66,70 F80,54 e51,68 w63,66 k68,71 f82,55', 3],
      wheel: ['H26,76 N30,66 P54,56 E26,77 W24,89 K70,68 F74,89 e28,77 w26,89 k72,69 f76,89', 'H26,72 N31,63 P54,53 E27,76 W24,89 K71,66 F74,89 e29,76 w26,89 k73,67 f76,89', 3],
      dancer: ['H54,14 N52,23 P50,49 E44,36 W38,48 K42,64 F34,48 e60,30 w70,24 k52,69 f53,89', 'H74,27 N66,32 P48,50 E54,39 W42,38 K30,52 F36,34 e78,28 w90,24 k51,69 f53,89', 3.2],
      plow: ['H21,87 N30,86 P44,62 E42,88 W54,88 K28,66 F10,78 e44,88 w56,88 k30,67 f12,79', 'H21,87 N30,86 P43,61 E42,88 W54,88 K26,68 F8,84 e44,88 w56,88 k28,69 f10,85', 3],
      shoulderstand: ['H21,87 N30,86 P36,61 E44,80 W40,70 K39,41 F41,21 e42,80 w40,70 k41,41 f43,21', 'H21,87 N30,86 P35,60 E43,79 W39,69 K37,40 F38,20 e45,79 w41,69 k39,40 f40,20', 3],
      tuckjump: ['H48,42 N49,50 P40,70 E40,58 W36,66 K58,72 F50,89 e42,58 w38,66 k60,72 f54,89', 'H51,10 N50,19 P49,45 E58,10 W62,0 K66,40 F54,54 e60,10 w64,0 k68,41 f56,55', 0.9],
      squatjump: ['H48,42 N49,50 P40,70 E40,58 W36,66 K58,72 F50,89 e42,58 w38,66 k60,72 f54,89', 'H50,4 N50,13 P50,39 E52,1 W53,-11 K49,59 F48,79 e54,1 w55,-11 k52,59 f53,79', 1.0],
      cloudhands: ['H47,17 N47,26 P46,52 E58,32 W61,18 K48,71 F44,89 e55,34 w60,44 k56,71 f58,89', 'H53,17 N53,26 P54,52 E60,34 W64,44 K46,71 F44,89 e64,32 w66,18 k58,71 f58,89', 4, null],
      passthrough: ['H50,14 N50,23 P50,49 E55,35 W58,46 K49,69 F48,89 e56,35 w59,46 k52,69 f53,89', 'H50,14 N50,23 P50,49 E40,34 W31,43 K49,69 F48,89 e41,34 w32,43 k52,69 f53,89', 4, null, 'H50,14 N50,23 P50,49 E51,10 W52,-2 K49,69 F48,89 e53,10 w54,-2 k52,69 f53,89'],
      wristrock: ['H24,60 N31,64 P56,70 E30,76 W30,89 K58,89 F76,89 e32,76 w32,89 k60,89 f78,89', 'H16,64 N23,67 P50,72 E25,78 W30,89 K58,89 F76,89 e27,78 w32,89 k60,89 f78,89', 3, null],
      pelvictilt: ['H12,84 N20,85 P46,86 E30,88 W40,88 K60,70 F70,89 e30,88 w40,88 k62,70 f72,89', 'H12,84 N20,85 P46,83 E30,88 W40,88 K60,69 F70,89 e30,88 w40,88 k62,69 f72,89', 3, null],
      neckslide: ['H55,14 N51,23 P50,49 E46,34 W44,46 K48,69 F47,89 e54,34 w56,46 k52,69 f53,89', 'H46,14 N49,23 P50,49 E46,34 W44,46 K48,69 F47,89 e54,34 w56,46 k52,69 f53,89', 1.6, null],
      wave: ['H57,16 N53,25 P47,50 E51,38 W49,49 K51,70 F47,89 e52,38 w51,50 k53,69 f53,89', 'H46,16 N48,24 P53,50 E49,37 W50,49 K53,70 F47,89 e50,37 w52,49 k57,70 f53,89', 2.4],
      fold: ['H50,14 N50,23 P50,49 E48,36 W47,48 K49,69 F47,89 e49,36 w49,48 k52,69 f53,89', 'H63,80 N61,72 P48,49 E50,78 W57,88 K48,69 F47,89 e51,79 w59,88 k51,69 f53,89', 3],
      bridge: [LY + ' E18,78 W20,89 e20,78 w22,89 P46,86 K60,70 F70,89 k62,70 f72,89 H14,84 N22,85', 'H22,76 N26,66 P50,48 E22,78 W20,89 K66,64 F70,89 e24,78 w22,89 k68,64 f72,89', 3],
      pigeon: ['H44,40 N44,48 P44,80 E46,62 W48,76 K60,84 F48,88 e42,62 w40,76 k30,86 f10,88', 'H64,74 N56,72 E66,80 W76,86 e64,80 w74,86', 3.4],
      halfsplit: ['H44,34 N44,42 P44,66 E44,54 W44,64 K44,88 F30,88 e46,54 w46,64 k60,80 f78,88', 'H62,58 N56,56 E60,70 W64,80 e62,70 w66,80', 3],
      seatedfold: ['H28,50 N30,58 P30,84 E40,66 W48,72 K50,84 F70,84 e40,66 w48,72 k50,84 f70,84', 'H50,70 N44,72 E56,78 W66,82 e56,78 w66,82', 3.4],
      butterfly: ['H50,44 N50,52 P50,82 E44,66 W48,82 K34,74 F48,86 e56,66 w52,82 k66,74 f52,86', 'H50,48 N50,56 K30,82 k70,82', 2.4],
      happybaby: [LY + ' E36,72 W44,60 e38,72 w46,60 P46,86 K42,66 F46,54 k50,66 f54,54', 'P46,84 K40,68 k52,68', 2.6],
      legup: [LY + ' E34,76 W44,66 e36,76 w46,66 P46,86 K60,80 F76,88 k62,86 f78,88', 'K54,66 F58,46 W56,52 E40,70', 3],
      childpose: ['H50,40 N50,48 P52,76 E50,60 W50,72 K66,88 F46,88 e52,60 w52,72 k68,88 f48,88', 'H78,82 N70,78 P50,78 E82,84 W92,86 e82,84 w92,86', 3],
      cobra: [YT, 'H18,64 N24,70 E24,80 W20,89 e26,80 w22,89', 3],
      armstretch: [FR + ' E42,36 W40,46 e58,36 w60,46', 'E56,28 W64,26 e48,30 w56,28', 3],
      quad: [S + ' w44,52 k48,70 f40,58', 'H50,13 N50,22', 3],
      calfwall: ['H34,22 N38,30 P50,56 E30,30 W20,30 K58,72 F64,89 e32,30 w21,30 k44,72 f44,89', 'H30,24 N35,32 P48,58', 3, { wall: 18 }],
      kneel: ['H52,32 N52,40 P52,64 E52,50 W52,60 K52,88 F30,88 e54,50 w54,60 k54,88 f32,88', 'H50,38 N50,46 P46,70', 3],
      headstand: ['H46,84 N46,75 E58,77 W58,89 e57,77 w57,89 P53,51 K60.5,69.5 F68,88 k59.5,69.5 f67,88', 'P46,49 K46,29 F46,9 k47,29 f47,9', 3.4, null, 'P53,51 K60,69 F44,62 k59,69 f43,62'],
      tripodrest: ['H46,84 N46,75 E58,77 W58,89 e57,77 w57,89 P53,51 K60.5,69.5 F68,88 k59.5,69.5 f67,88', 'P53,51 K60,69 F44,62', 2.8],
      tucktripod: ['H46,84 N46,75 E58,77 W58,89 e57,77 w57,89 P53,51 K60.5,69.5 F68,88 k59.5,69.5 f67,88', 'P53,51 K60,69 F44,62 k59,69 f43,62', 2.8],
      hsfreeze: ['H46,84 N46,75 E58,77 W58,89 e57,77 w57,89 P53,51 K60,69 F44,62 k59,69 f43,62', 'P46,49 K51,30 F56,11 k36,33 f52,29', 2.6],
      split: ['H50,38 N50,46 P50,72 E44,60 W40,80 K66,82 F78,86 e56,60 w60,80 k36,82 f22,88', 'H50,48 N50,56 P50,82 E42,68 W38,86 K68,88 F88,88 k32,88 f12,88', 3.4],
      bear: ['H24,58 N30,62 P60,60 E30,75 W30,89 K62,76 F72,89 e32,75 w32,89 k58,76 f68,89', 'E36,75 W38,89 K56,76 F66,89 e28,75 w26,89 k62,76 f74,89', 1.2],
      crab: ['H70,52 N64,58 P40,64 E66,74 W68,89 K28,70 F22,89 e64,74 w66,89 k30,70 f24,89', 'E62,74 W60,89 K32,70 F28,89', 1.2]
    };
  }
  hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 9973; return h; }
  fams() {
    if (this._F) return this._F;
    const F = {
      push: { name: 'Push', color: '#E5282E', ink: '#FFFFFF', shape: 'circle', f: ['chest', 'shoulders', 'arms'], b: ['arms'] },
      pull: { name: 'Pull', color: '#1556C2', ink: '#FFFFFF', shape: 'half', f: ['arms'], b: ['back', 'shoulders', 'arms'] },
      legs: { name: 'Legs', color: '#F26A0F', ink: '#161616', shape: 'square', f: ['legs', 'hips'], b: ['glutes', 'hamstrings'] },
      core: { name: 'Core', color: '#0B7A3E', ink: '#FFFFFF', shape: 'ring', f: ['core'], b: ['lowback'] },
      balance: { name: 'Balance', color: '#6B3FA0', ink: '#FFFFFF', shape: 'diamond', f: ['shoulders', 'arms', 'core'], b: ['shoulders'] },
      dance: { name: 'Dance', color: '#FFC20E', ink: '#161616', shape: 'quarter', f: ['legs', 'core'], b: ['glutes'] },
      strikes: { name: 'Strikes', color: '#161616', ink: '#FFFFFF', shape: 'tri', f: ['shoulders', 'core'], b: ['back'] },
      stretch: { name: 'Stretch & yoga', color: '#F6A5A9', ink: '#161616', shape: 'arch', f: ['hips'], b: ['hamstrings', 'lowback'] },
      mobility: { name: 'Mobility', color: '#0E8178', ink: '#FFFFFF', shape: 'pill', f: ['hips'], b: ['back'] },
      cond: { name: 'Conditioning', color: '#C08A00', ink: '#161616', shape: 'square', f: ['legs', 'core'], b: ['glutes'] },
      freezes: { name: 'Freezes', color: '#A2332B', ink: '#FFFFFF', shape: 'cross', hidden: true, parents: ['balance', 'dance'], f: ['shoulders', 'arms', 'core'], b: ['shoulders'] },
      splits: { name: 'Splits', color: '#9B7FD1', ink: '#161616', shape: 'semi', hidden: true, parents: ['stretch', 'mobility'], f: ['hips', 'legs'], b: ['hamstrings'] },
      crawls: { name: 'Crawls & travel', color: '#6E7B1E', ink: '#FFFFFF', shape: 'peak', hidden: true, parents: ['core', 'legs'], f: ['shoulders', 'core', 'legs'], b: ['glutes'] },
      flow: { name: 'Flow footwork', color: '#3FA7E0', ink: '#161616', shape: 'dot', hidden: true, parents: ['strikes', 'dance'], f: ['legs', 'core'], b: ['glutes'] }
    };
    const LAD = {
      push: ['Wall push-up', 'Wide wall push-up', 'Close-hand wall push-up', 'Bed-height incline push-up', 'Incline push-up', 'Knee push-up', 'Push-up negative', 'Push-up', 'Wide push-up', 'Hand-release push-up', 'Diamond push-up', 'Decline push-up', 'Pike push-up', 'Archer push-up', 'Incline one-arm push-up', 'One-arm push-up'],
      pull: ['Towel pull-apart', 'Towel isometric pull', 'Prone Y-T-W raises', 'Superman hold', 'Reverse snow angel', 'Prone swimmers', 'Doorframe row', 'Under-desk row, knees bent', 'Under-desk row, legs straight', 'Paused desk row', 'Slow-negative desk row', 'Feet-up desk row', 'Archer desk row', 'One-arm row negative', 'One-arm desk row'],
      legs: ['Chair squat', 'Calf raise', 'Wall sit', 'Glute bridge', 'Bodyweight squat', 'Reverse lunge', 'Split squat', 'Single-leg glute bridge', 'Lateral lunge', 'Bulgarian split squat', 'Cossack squat', 'Pistol squat to the bed', 'Assisted shrimp squat', 'Pistol squat', 'Shrimp squat'],
      core: ['Woodchop', 'Dead bug', 'Bird-dog', 'Knee plank', 'Knee side plank', 'Plank', 'Tucked hollow hold', 'Bear plank shoulder taps', 'Side plank', 'Plank shoulder taps', 'Hollow hold', 'Hollow rocks', 'Tuck L-sit on chairs', 'One-leg L-sit on chairs', 'L-sit'],
      balance: ['Single-leg stand', 'Heel-to-toe walk', 'Tiptoe balance', 'Eyes-closed single-leg stand', 'Single-leg reach', 'Wall plank walk', 'Frog stand, toes down', 'Frog stand', 'Pike hold on the bed', 'Wall walk-up', 'Wall handstand', 'Wall shoulder taps', 'Wall handstand, 60 s', 'Heel pulls off the wall', 'Kick-up practice', 'Freestanding handstand'],
      dance: ['Bounce and rock', 'Two-step', 'Shoulder isolations', 'Body roll', 'Indian step', 'Cross step', 'Low-impact running man', 'Shuffle running man', 'Controlled go-down', 'Three-step', 'Six-step', 'Kick-outs', 'Baby freeze, toes down', 'Baby freeze', 'Footwork into baby freeze', 'Chair freeze'],
      strikes: ['Stance and jab', 'Guard bounce', 'Jab-cross', 'Hooks and uppercuts', 'Slip and roll', 'Teep push kick', 'Knee strikes', 'Front and round kick', 'Side kick', 'Elbow strikes', 'Kick-punch combo', 'Combos with slips', 'Low switch kick', 'Switch kick combo', 'Full 3-minute rounds'],
      mobility: ['Joint circles', 'Arm circles', 'Hip circles', 'Pelvic tilts', 'Cat-cow', 'Open book', '90/90 hip switches', 'Towel pass-through', "World's greatest stretch", 'Deep squat sit', 'Spine waves', 'Deep squat with rotations', 'Cossack flow', 'Wall walk-down', 'Bridge', 'Bridge rotations'],
      stretch: ['Toe reach', 'Standing fold', 'Butterfly', "Child's pose", 'Low lunge', 'Downward dog', 'Seated forward fold', 'Happy baby', 'Lizard', 'Frog stretch', 'Pigeon pose', 'Wide-leg forward fold', 'Half splits', 'King pigeon prep', 'Pancake', 'Wheel pose'],
      freezes: ['Tripod knee rest', 'Tripod headstand', 'Tuck to tripod', 'Elbow freeze', 'Turtle freeze', 'Turtle shuffle', 'Headstand freeze', 'Air chair prep', 'Freeze chains'],
      splits: ['Lizard hold, 60 s', 'Half split rocks', 'Frog rocks', 'Front-split slide', 'Front split, hands on books', 'Pigeon to split slide', 'Side-split prep', 'Full front split'],
      crawls: ['Bear hold', 'Inchworm walk', 'Cat crawl', 'Bear crawl', 'Crab reach', 'Crab walk', 'Frog jumps', 'Gorilla shuffle', 'Lateral bear crawl', 'Crocodile crawl', 'Crawl flow'],
      flow: ['Bouncing stance', 'Pendulum step', 'Bob and weave', 'Switch stance drill', 'Angle steps', 'Slip-slip-cross', 'Footwork with combos', '3-minute flow round']
    };
    const B = this.bank();
    Object.keys(F).forEach((k) => { const l = (LAD[k] || []).map((n) => B.find((x) => x.n === n)).filter((x) => x); F[k].ladder = l.map((x) => x.n); F[k].lvls = l.map((x) => x.lvl); });
    Object.keys(F).forEach((k) => { F[k].steps = [0, 1, 2, 3, 4].map((l) => { const m = B.find((x) => x.fam === k && x.lvl === l && x.role === 'm'); return m ? m.n : ''; }); });
    this._F = F;
    return F;
  }
  stone(k, st) {
    const s = st || this.state, F = this.fams()[k];
    if (!F || !F.ladder.length) return 0;
    const v = (s.stones || {})[k];
    if (v !== undefined && v !== null) return Math.max(0, Math.min(F.ladder.length - 1, v));
    const L = (s.levels || {})[k] || 0, i = F.lvls.findIndex((x) => x >= L);
    return i < 0 ? F.ladder.length - 1 : i;
  }
  moveStone(k, d) {
    const s = this.state, F = this.fams()[k], cur = this.stone(k), nx = Math.max(0, Math.min(F.ladder.length - 1, cur + d));
    const stones = Object.assign({}, s.stones); stones[k] = nx;
    const levels = Object.assign({}, s.levels); levels[k] = F.lvls[nx];
    return { stones, levels, moved: nx !== cur, lvChanged: levels[k] !== s.levels[k], top: nx === F.ladder.length - 1 };
  }
  bank() {
    if (this._B) return this._B;
    this._B = this.bankRows().map((r) => ({ n: r[0], fam: r[1], lvl: r[2], role: r[3], rx: r[4], anim: r[5], cues: [r[6], r[7]], f: r[8], b: r[9] }));
    return this._B;
  }
  moveInfo() {
    if (this._MI) return this._MI;
    const F = this.fams(), MI = {};
    this.bank().forEach((m) => { MI[m.n] = Object.assign({}, m, { f: m.f || F[m.fam].f, b: m.b || F[m.fam].b }); });
    this._MI = MI;
    return MI;
  }
  unlocked(levels) {
    const F = this.fams(), U = {};
    Object.keys(F).forEach((k) => { if (F[k].hidden) { const p = F[k].parents; if ((levels[p[0]] || 0) >= 2 && (levels[p[1]] || 0) >= 2 && ((this.state && this.state.sessions) || 0) >= 3) U[k] = true; } });
    return U;
  }
  figure(name, calm, slow) {
    const MI = this.moveInfo(), A = this.animRows(), F = this.fams();
    const mv = MI[name];
    const an = A[(mv && mv.anim) || 'stand'] || A.stand;
    const parse = (str) => { const o = {}; str.trim().split(/\s+/).forEach((tok) => { const xy = tok.slice(1).split(',').map(Number); o[tok[0]] = xy; }); return o; };
    const pa = parse(an[0]), pb = parse(an[1]);
    const derive = (o, explicit) => {
      const map = { e: 'E', w: 'W', k: 'K', f: 'F' }, off = { e: [2.5, 0], w: [2.5, 0], k: [1.5, -1], f: [1.5, -1] };
      Object.keys(map).forEach((fk) => { if (!explicit[fk]) o[fk] = [o[map[fk]][0] + off[fk][0], o[map[fk]][1] + off[fk][1]]; });
      return o;
    };
    const a = derive(Object.assign({}, pa), pa);
    const b = derive(Object.assign({}, a, pb), Object.assign({}, pa, pb));
    const torso = mv ? F[mv.fam].color : '#E5282E';
    const SEG = [['P', 'k'], ['k', 'f'], ['N', 'e'], ['e', 'w'], ['N', 'P'], ['H', 'N'], ['P', 'K'], ['K', 'F'], ['N', 'E'], ['E', 'W']];
    // in-between pose: limbs swing in arcs (keeps their length); planted hands/feet stay put
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);
    const lerpA = (x, y) => { let d = y - x; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return x + d / 2; };
    const seg = (root, ja, jb, ra, rb) => { const l = (dist(ra, ja) + dist(rb, jb)) / 2, t = lerpA(ang(ra, ja), ang(rb, jb)); return [root[0] + l * Math.cos(t), root[1] + l * Math.sin(t)]; };
    const ik2 = (root, target, l1, l2, side) => {
      let D = Math.max(Math.abs(l1 - l2) + 0.05, Math.min(dist(root, target), l1 + l2 - 0.05));
      const t = ang(root, target) - side * Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + D * D - l2 * l2) / (2 * l1 * D))));
      return [root[0] + l1 * Math.cos(t), root[1] + l1 * Math.sin(t)];
    };
    const m = {};
    m.P = [(a.P[0] + b.P[0]) / 2, (a.P[1] + b.P[1]) / 2];
    m.N = seg(m.P, a.N, b.N, a.P, b.P); m.H = seg(m.N, a.H, b.H, a.N, b.N);
    [['N', 'E', 'W'], ['N', 'e', 'w'], ['P', 'K', 'F'], ['P', 'k', 'f']].forEach(([R, J, T]) => {
      if (dist(a[T], b[T]) < 1.5) {
        const cr = (a[J][0] - a[R][0]) * (a[T][1] - a[R][1]) - (a[J][1] - a[R][1]) * (a[T][0] - a[R][0]);
        m[T] = [(a[T][0] + b[T][0]) / 2, (a[T][1] + b[T][1]) / 2];
        m[J] = ik2(m[R], m[T], (dist(a[R], a[J]) + dist(b[R], b[J])) / 2, (dist(a[J], a[T]) + dist(b[J], b[T])) / 2, cr >= 0 ? 1 : -1);
      } else { m[J] = seg(m[R], a[J], b[J], a[R], b[R]); m[T] = seg(m[J], a[T], b[T], a[J], b[J]); }
    });
    Object.keys(m).forEach((k) => { m[k] = [Math.round(m[k][0] * 10) / 10, Math.round(m[k][1] * 10) / 10]; });
    if (an[4]) Object.assign(m, parse(an[4]));
    const vals = (x, y, mm) => calm ? [x, x, x, x, x].join(';') : [x, mm, y, mm, x].join(';');
    const out = { dur: (an[2] * (slow ? 2.5 : 1)) + 's', aria: 'Figure demonstrating ' + name, kt: '0;0.25;0.5;0.75;1', ks: '.45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1' };
    SEG.forEach(([p, q], i) => {
      out['s' + i] = {
        x1: a[p][0], y1: a[p][1], x2: a[q][0], y2: a[q][1],
        ax1: vals(a[p][0], b[p][0], m[p][0]), ay1: vals(a[p][1], b[p][1], m[p][1]), ax2: vals(a[q][0], b[q][0], m[q][0]), ay2: vals(a[q][1], b[q][1], m[q][1]),
        c: i < 4 ? '#C4C4C4' : i === 4 ? torso : '#161616',
        w: i < 4 ? 5.5 : i === 4 ? 10 : i === 5 ? 5 : 6
      };
    });
    out.hx = a.H[0]; out.hy = a.H[1]; out.ahx = vals(a.H[0], b.H[0], m.H[0]); out.ahy = vals(a.H[1], b.H[1], m.H[1]);
    const pr = an[3] || {};
    out.wx = pr.wall || -20; out.wo = pr.wall ? 1 : 0;
    const bx = pr.box || [-50, -50, 1, 1]; out.bx = bx[0]; out.by = bx[1]; out.bw = bx[2]; out.bh = bx[3]; out.bo = pr.box ? 1 : 0;
    const br = pr.bar || [-20, -10, -20]; out.rx1 = br[0]; out.rx2 = br[1]; out.ry = br[2]; out.ro = pr.bar ? 1 : 0;
    return out;
  }
  dogHead(expr, w) {
    const eyes = {
      calm: '<circle cx="41" cy="27" r="3.5" fill="#161616"/><circle cx="59" cy="27" r="3.5" fill="#161616"/>',
      happy: '<path d="M36 28 q5 -6 10 0 M54 28 q5 -6 10 0" fill="none" stroke="#161616" stroke-width="3" stroke-linecap="round"/>',
      wow: '<circle cx="41" cy="26" r="5.5" fill="#FFFFFF" stroke="#161616" stroke-width="2"/><circle cx="59" cy="26" r="5.5" fill="#FFFFFF" stroke="#161616" stroke-width="2"/><circle cx="42" cy="27" r="2.6" fill="#161616"/><circle cx="60" cy="27" r="2.6" fill="#161616"/>',
      wink: '<circle cx="41" cy="27" r="3.5" fill="#161616"/><path d="M54 27 h10" stroke="#161616" stroke-width="3" stroke-linecap="round"/>',
      dizzy: '<path d="M37 23 l8 8 M45 23 l-8 8 M55 23 l8 8 M63 23 l-8 8" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/>',
      sleepy: '<path d="M36 28 q5 4 10 0 M54 28 q5 4 10 0" fill="none" stroke="#161616" stroke-width="3" stroke-linecap="round"/>'
    }[expr] || '';
    const tongue = expr === 'happy' || expr === 'wink' ? '<path d="M46 50 h8 v5 a4 4 0 0 1 -8 0 z" fill="#E5282E" stroke="#161616" stroke-width="1.5"/>' : expr === 'wow' ? '<ellipse cx="50" cy="51" rx="3" ry="3.5" fill="#161616"/>' : '';
    const earUp = expr === 'wow' || expr === 'happy';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70">' + (earUp ? '<ellipse cx="25" cy="28" rx="8" ry="15" fill="#161616" transform="rotate(-25 25 28)"/><ellipse cx="75" cy="28" rx="8" ry="15" fill="#161616" transform="rotate(25 75 28)"/>' : '<ellipse cx="27" cy="36" rx="8" ry="16" fill="#161616"/><ellipse cx="73" cy="36" rx="8" ry="16" fill="#161616"/>') + '<circle cx="50" cy="32" r="24" fill="#E5282E"/><ellipse cx="50" cy="44" rx="12" ry="9" fill="#FFC20E"/><circle cx="50" cy="39" r="4.5" fill="#161616"/>' + eyes + tongue + '</svg>';
    return 'display:block;flex:none;width:' + w + 'px;height:' + Math.round(w * 0.7) + 'px;background:url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27') + '") center/contain no-repeat';
  }
  park() {
    const s = this.state, h = new Date().getHours(), night = h >= 20 || h < 6, dusk = !night && h >= 17, ses = s.sessions || 0;
    const start = this.weekKey(); let days = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); if (this.dayLog(this.dayKey(d))) days++; }
    const C = night ? { sky: '#1B2A55', hill: '#26496B', ground: '#0A4D2A', tree: '#0A5E57' } : dusk ? { sky: '#F8D9B8', hill: '#8CC7A6', ground: '#0B7A3E', tree: '#0E8178' } : { sky: '#DCEBFA', hill: '#9ED3B3', ground: '#0B7A3E', tree: '#0E8178' };
    let g = '';
    if (night) { g += '<circle cx="340" cy="40" r="16" fill="#F4F4F4"/><circle cx="347" cy="35" r="14" fill="' + C.sky + '"/>'; [[40, 30], [90, 55], [150, 22], [210, 48], [260, 18], [300, 70], [375, 60], [120, 85]].forEach((p) => { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="#FFFFFF"/>'; }); }
    else if (dusk) g += '<circle cx="300" cy="112" r="20" fill="#F26A0F"/>';
    else g += '<circle cx="340" cy="42" r="20" fill="#FFC20E"/>';
    g += '<ellipse cx="115" cy="165" rx="110" ry="58" fill="' + C.hill + '"/><ellipse cx="318" cy="165" rx="80" ry="44" fill="' + C.hill + '"/><rect x="-400" y="160" width="1200" height="30" fill="' + C.ground + '"/>';
    if (ses >= 25) g += '<path d="M210 22 l11 13 l-11 13 l-11 -13 z" fill="#E5282E"/><path d="M210 48 q6 9 -2 16 q-6 7 2 14" fill="none" stroke="#161616" stroke-width="1.5"/><path d="M221 35 L345 158" stroke="#161616" stroke-width="1" opacity=".45"/>';
    if (ses >= 10) g += '<ellipse cx="290" cy="179" rx="38" ry="7" fill="#1556C2"/><circle cx="293" cy="174" r="5.5" fill="#FFC20E"/><circle cx="298" cy="168" r="3.6" fill="#FFC20E"/><path d="M301 168 l4 1 l-4 2 z" fill="#F26A0F"/>';
    if (ses >= 50) g += '<rect x="112" y="163" width="44" height="10" fill="#E5282E"/><rect x="120" y="163" width="6" height="10" fill="#FFFFFF"/><rect x="134" y="163" width="6" height="10" fill="#FFFFFF"/><rect x="148" y="163" width="6" height="10" fill="#FFFFFF"/>';
    if (ses >= 5) g += '<rect x="318" y="134" width="50" height="5" fill="#C08A00"/><rect x="318" y="147" width="50" height="5" fill="#C08A00"/><rect x="322" y="139" width="3" height="21" fill="#161616"/><rect x="361" y="139" width="3" height="21" fill="#161616"/>';
    const FC = ['#E5282E', '#FFC20E', '#F6A5A9', '#1556C2', '#FFFFFF', '#F26A0F', '#6B3FA0'];
    for (let i = 0; i < days; i++) { const x = 116 + i * 20, y = 177 + (i % 2) * 5; g += '<path d="M' + x + ' ' + (y + 9) + ' V' + y + '" stroke="#161616" stroke-width="1.6"/><circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + FC[i] + '"/><circle cx="' + x + '" cy="' + y + '" r="1.6" fill="#161616"/>'; }
    const uri = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + svg + '</svg>').replace(/'/g, '%27') + '")';
    const tree = 'viewBox="0 0 84 112"><rect x="37" y="58" width="10" height="54" fill="#161616"/><circle cx="42" cy="42" r="38" fill="' + C.tree + '"/>' + (night ? '' : '<circle cx="28" cy="34" r="4" fill="#E5282E"/><circle cx="55" cy="26" r="4" fill="#E5282E"/><circle cx="50" cy="55" r="4" fill="#E5282E"/>');
    const U = [[5, 'a bench'], [10, 'a pond (with a duck)'], [25, 'a kite'], [50, 'a picnic']], nx = U.find((u) => ses < u[0]);
    return { bg: 'position:relative;height:190px;overflow:hidden;border-bottom:3px solid #161616;background:' + uri('viewBox="0 0 400 190">' + g) + ' center bottom/auto 100% no-repeat, linear-gradient(to top, ' + C.ground + ' 0 30px, ' + C.sky + ' 30px)', tree: 'display:block;width:84px;height:112px;background:' + uri(tree) + ' center/contain no-repeat', days, night,
      next: (days ? days + (days === 1 ? ' flower' : ' flowers') + ' this week, one for each day you moved. ' : 'A flower grows for each day you move this week. ') + (nx ? 'Coming soon: ' + nx[1] + ' at ' + nx[0] + ' sessions.' : 'The park is complete!') };
  }
  nudgeLines() {
    const s = this.state, F = this.fams(), c = this.challenge(), h = new Date().getHours(), L = [];
    if (c.done) L.push('We did the week thing!!', 'I want a bonus round. Do you?');
    else if (c.n > 0) L.push(c.n + ' down! I am counting on my paws.');
    else L.push('Sniff sniff. Which one smells fun?');
    if (h < 10) L.push('Morning sniffs are the best sniffs.'); else if (h >= 21) L.push('Sleepy sniffs...');
    const best = Object.keys(F).filter((k) => !F[k].hidden && F[k].ladder.length).sort((p, q) => this.stone(q) - this.stone(p))[0];
    if (best && this.stone(best) > 2) L.push(F[best].name + ' is looking strong. I checked.');
    L.push('Pick one! Any one!', 'I like the yellow one. It looks like cheese.', 'I sat on Balance once. Fell over.', 'Psst. Some paths are hiding.', 'Stones are my second favorite thing. After snacks.', 'I am a very long dog.', 'Boop me again.', 'Do you think I could do a handstand?');
    return L;
  }
  face(expr, z) {
    const m = {
      smile: '<path d="M13 25 Q20 32 27 25" fill="none" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/>',
      smirk: '<path d="M16 28 Q22 29 27 24" fill="none" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/>',
      grin: '<path d="M10 22 H30 A10 10 0 0 1 10 22 Z" fill="#FFFFFF" stroke="#161616" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 22 V30 M20 22 V32 M25 22 V30" stroke="#161616" stroke-width="1.8"/>',
      oof: '<path d="M12 28 l3.2 -3 l3.2 3 l3.2 -3 l3.2 3 l3.2 -3" fill="none" stroke="#161616" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    const look = { left: -3, right: 3 };
    const ex = expr.split('-'), mouth = ex[0], dx = look[ex[1]] || 0, up = expr === 'grin' ? -2 : 0;
    const eyes = mouth === 'grin'
      ? '<path d="M10 15 q4 -5 8 0 M22 15 q4 -5 8 0" fill="none" stroke="#161616" stroke-width="2.6" stroke-linecap="round"/>'
      : '<circle cx="' + (14 + dx) + '" cy="' + (16 + up) + '" r="3.4" fill="#161616"/><circle cx="' + (26 + dx) + '" cy="' + (16 + up) + '" r="3.4" fill="#161616"/>' + (mouth === 'smirk' ? '<path d="M' + (10 + dx) + ' 10 l7 1.5 M' + (22 + dx) + ' 11.5 l7 -1.5" stroke="#161616" stroke-width="2.2" stroke-linecap="round"/>' : '');
    const blush = '<ellipse cx="9" cy="' + (mouth === 'grin' ? 20 : 23) + '" rx="3.6" ry="2.4" fill="#E5282E"/><ellipse cx="31" cy="' + (mouth === 'grin' ? 20 : 23) + '" rx="3.6" ry="2.4" fill="#E5282E"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.4" fill="#FFC20E" stroke="#161616" stroke-width="2.4"/>' + blush + eyes + (m[mouth] || m.smile) + '</svg>';
    return 'display:block;flex:none;width:' + z + 'px;height:' + z + 'px;background:url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27') + '") center/contain no-repeat';
  }
  shp(kind, color, z) {
    const base = 'display:block;flex:none;width:' + z + 'px;height:' + z + 'px;';
    if (kind === 'circle') return base + 'border-radius:50%;background:' + color;
    if (kind === 'half') return 'display:block;flex:none;width:' + z + 'px;height:' + (z / 2) + 'px;border-radius:' + z + 'px ' + z + 'px 0 0;background:' + color;
    if (kind === 'square') return base + 'background:' + color;
    if (kind === 'ring') return base + 'box-sizing:border-box;border-radius:50%;border:' + Math.round(z * 0.28) + 'px solid ' + color;
    if (kind === 'diamond') return base + 'background:' + color + ';transform:rotate(45deg) scale(.74)';
    if (kind === 'quarter') return base + 'border-top-right-radius:100%;background:' + color;
    if (kind === 'tri') return base + 'clip-path:polygon(0 100%,100% 0,100% 100%);background:' + color;
    if (kind === 'arch') return base + 'border-radius:0 0 ' + (z / 2) + 'px ' + (z / 2) + 'px;background:' + color;
    if (kind === 'cross') return base + 'clip-path:polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%);background:' + color;
    if (kind === 'semi') return 'display:block;flex:none;width:' + z + 'px;height:' + (z / 2) + 'px;border-radius:0 0 ' + z + 'px ' + z + 'px;background:' + color;
    if (kind === 'peak') return base + 'clip-path:polygon(50% 0,100% 100%,0 100%);background:' + color;
    if (kind === 'dot') return base + 'border-radius:50%;background:' + color;
    if (kind === 'pill') return 'display:block;flex:none;width:' + z + 'px;height:' + Math.round(z * 0.55) + 'px;border-radius:' + z + 'px;background:' + color;
    return base + 'background:' + color;
  }
  pools() {
    return {
      warm: [['Arm circles', '30 s each way'], ["World's greatest stretch", '3 per side'], ['Hip circles', '5 each way'], ['Leg swings', '10 per side'], ['Inchworm', '5 slow reps']],
      strength: [['Incline push-up', '3 × 10'], ['Under-desk row', '3 × 8'], ['Cossack squat', '3 × 6 per side'], ['Glute bridge', '3 × 15'], ['Side plank', '3 × 20 s per side'], ['Pike push-up', '3 × 6'], ['Hollow hold', '3 × 20 s']],
      dance: [['Indian step', '2 rounds of 1 min'], ['Baby freeze', '5 tries, hold 3 s'], ['Six-step', '5 slow rounds'], ['Kick-outs', '3 × 8']],
      strikes: [['Jab-cross', '2 rounds of 1 min'], ['Front kick', '10 per side'], ['Hooks', '2 rounds of 1 min'], ['Knee strikes', '2 × 20']],
      stretch: [['Low lunge', '45 s per side'], ["Child's pose", '60 s'], ['Pigeon pose', '45 s per side'], ['Butterfly', '45 s'], ['Lying twist', '30 s per side']],
      mobility: [['90/90 hip switch', '8 per side'], ['Spine waves', '8 slow reps'], ['Deep squat hold', '60 s'], ['Shoulder circles', '10 each way'], ['Cossack squat', '6 per side']]
    };
  }
  dur(rx) {
    const t = String(rx || '').toLowerCase(), side = /per side|each way|each side/.test(t) ? 2 : 1;
    let m, secs;
    if ((m = t.match(/(\d+)\s*rounds? of (\d+)\s*min/))) secs = m[1] * m[2] * 60 + (m[1] - 1) * 15;
    else if ((m = t.match(/(\d+)\s*×\s*(\d+)\s*s\b/))) secs = m[1] * m[2] * side + (m[1] - 1) * 20;
    else if ((m = t.match(/(\d+)\s*×\s*(\d+)/))) secs = m[1] * m[2] * 3 * side + (m[1] - 1) * 30;
    else if ((m = t.match(/(\d+)\s*min/))) secs = m[1] * 60 * (side === 2 && !/each way/.test(t) ? 2 : 1);
    else if ((m = t.match(/(\d+)\s*s\b/))) secs = m[1] * side;
    else if ((m = t.match(/(\d+)\s*tries/))) secs = m[1] * 20;
    else if ((m = t.match(/(\d+)\s*slow rounds/))) secs = m[1] * 30;
    else if ((m = t.match(/(\d+)/))) secs = m[1] * 3 * side;
    else secs = 60;
    return Math.min(330, Math.max(20, Math.round(secs / 5) * 5));
  }
  planSecs(blocks) { return blocks.reduce((a, b) => a + b.moves.reduce((x, m) => x + m.secs + 15, 0), 0); }
  plan() {
    const s0 = this.state;
    const key = JSON.stringify([s0.tiny, this.moment(), s0.time, s0.energy, s0.mood, s0.seed, s0.swaps, s0.levels, s0.stones, s0.focus, s0.safe, s0.profile, new Date().getDate()]);
    if (this._pk === key) return this._pc;
    const R = this.recipe(), target = this.sessTime() * 60, extra = R.map(() => 0);
    const order = [];
    R.forEach((b, i) => { for (let w = 0; w < (b.grow || 0); w++) order.push(i); });
    if (!order.length) order.push(0);
    const count = (b) => b.reduce((x, y) => x + y.moves.length, 0);
    let out = this.planN(extra);
    for (let g = 0; g < 30 && this.planSecs(out) < target * 0.92; g++) {
      extra[order[g % order.length]]++;
      const nx = this.planN(extra);
      if (count(nx) > count(out)) out = nx;
      if (this.planSecs(out) > target * 1.08) break;
    }
    // Short sessions: drop the least important moves first, then trim sets.
    const cnt = () => out.reduce((x, b) => x + b.moves.length, 0);
    const prio = ['finish', 'cool', 'warm', 'wake', 'loose', 'bal', 'leg', 'core', 'floor'];
    for (let g = 0; g < 20 && this.planSecs(out) > target * 1.15 && cnt() > 2; g++) {
      const b = prio.map((k) => out.find((x) => x.key === k && x.moves.length)).find(Boolean) || out.slice().reverse().find((x) => x.moves.length > 1);
      if (!b) break;
      b.moves.pop(); out = out.filter((x) => x.moves.length);
    }
    const over = this.planSecs(out);
    if (over > target * 1.15) { const f = Math.max(0.55, target / over); out.forEach((b) => b.moves.forEach((m) => { m.secs = Math.max(20, Math.round(m.secs * f / 5) * 5); m.rx = m.secs + ' s, easy pace'; })); }
    if (s0.tiny) out.forEach((b) => b.moves.forEach((m) => { m.secs = 30; m.rx = m.secs + ' s, easy pace'; }));
    const tot = this.planSecs(out);
    if (tot < target * 0.92) { const f = Math.min(1.6, target / tot); out.forEach((b) => b.moves.forEach((m) => { m.secs = Math.round(m.secs * f / 5) * 5; })); }
    this._pk = key; this._pc = out;
    return out;
  }
  moment() {
    if (this.state.moment) return this.state.moment;
    const h = new Date().getHours();
    return h >= 5 && h < 10 ? 'morning' : h >= 21 || h < 5 ? 'evening' : 'main';
  }
  sessTime() { if (this.state.tiny) return 2; const m = this.moment(); return m === 'morning' ? 8 : m === 'midday' ? 6 : m === 'evening' ? 12 : this.state.time; }
  recipe() {
    if (this.state.tiny) return [
      { key: 'tloose', name: 'Loosen up', kind: 'tinyLoose', n: 1, grow: 0 },
      { key: 'tmove', name: 'One easy move', kind: 'tinyMove', n: 1, grow: 0 },
      { key: 'tbreathe', name: 'Breathe out', kind: 'gentle', n: 1, grow: 0 }
    ];
    const mo = this.moment();
    if (mo === 'morning') return [
      { key: 'wake', name: 'Wake up', kind: 'mobility', n: 2, grow: 1 },
      { key: 'move', name: 'Get the blood moving', kind: 'warm', n: 1, grow: 1 },
      { key: 'reach', name: 'Big morning stretch', kind: 'yogaStand', n: 1, grow: 1 }
    ];
    if (mo === 'midday') return [
      { key: 'desk', name: 'Unstick', kind: 'deskMob', n: 2, grow: 1 },
      { key: 'open', name: 'Open up', kind: 'deskStretch', n: 1, grow: 1 },
      { key: 'legs', name: 'Wake the legs', kind: 'quickLegs', n: 1, grow: 0 }
    ];
    if (mo === 'evening') return [
      { key: 'slow', name: 'Slow down', kind: 'gentle', n: 2, grow: 1 },
      { key: 'floor', name: 'Floor stretch', kind: 'yogaFloor', n: 2, grow: 2 },
      { key: 'rest', name: 'Rest', kind: 'restPose', n: 1, grow: 0 }
    ];
    // Each mood is its own kind of session. grow = how eagerly a block gets extra moves when there's more time.
    const s = this.state, t = this.sessTime(), tier = t <= 10 ? 0 : t <= 20 ? 1 : t <= 35 ? 2 : 3, e = s.energy;
    const fin = (min) => (e >= min ? [{ key: 'finish', name: 'Finisher', kind: 'finish', count: [1, 1, 1, 1], grow: 0 }] : []);
    const R = {
      Surprise: [
        { key: 'warm', name: 'Warm up', kind: 'warm', count: [1, 2, 2, 3], grow: 1 },
        { key: 'str', name: 'Strength', kind: 'strength', count: [1, 2, 3, 4], grow: 2 },
        { key: 'play', name: 'Surprise', kind: 'surprise', count: [1, 2, 3, 4], grow: 2 }
      ].concat(fin(67)).concat([{ key: 'cool', name: 'Stretch & yoga', kind: 'cool', count: [1, 2, 2, 3], grow: 1 }]),
      Strength: [
        { key: 'warm', name: 'Warm up', kind: 'warm', count: [1, 2, 2, 2], grow: 1 },
        { key: 'up', name: 'Upper body', kind: 'upper', count: [1, 2, 3, 4], grow: 3 },
        { key: 'low', name: 'Legs & core', kind: 'lower', count: [1, 2, 3, 4], grow: 3 }
      ].concat(fin(45)).concat([{ key: 'cool', name: 'Cool down', kind: 'cool', count: [1, 1, 2, 2], grow: 1 }]),
      Dance: [
        { key: 'warm', name: 'Loosen up', kind: 'danceWarm', count: [1, 2, 2, 2], grow: 1 },
        { key: 'top', name: 'Toprock', kind: 'toprock', count: [2, 2, 3, 4], grow: 3 },
        { key: 'floor', name: 'Floor work', kind: 'floor', count: [0, 1, 2, 3], grow: 2 },
        { key: 'leg', name: 'Dancer strength', kind: 'dancerStrength', count: [0, 1, 1, 2], grow: 1 },
        { key: 'cool', name: 'Stretch out', kind: 'cool', count: [1, 1, 2, 2], grow: 1 }
      ],
      Strikes: [
        { key: 'warm', name: 'Get loose', kind: 'fightWarm', count: [1, 2, 2, 2], grow: 1 },
        { key: 'rounds', name: 'Rounds', kind: 'strikes', count: [2, 3, 4, 5], grow: 3 },
        { key: 'core', name: 'Fighter core', kind: 'core', count: [0, 1, 2, 2], grow: 1 }
      ].concat(fin(34)).concat([{ key: 'cool', name: 'Cool down', kind: 'cool', count: [1, 1, 1, 2], grow: 1 }]),
      Stretch: [
        { key: 'wake', name: 'Wake up', kind: 'mobility', count: [1, 1, 2, 2], grow: 1 },
        { key: 'flow', name: 'Yoga flow', kind: 'yogaStand', count: [1, 2, 3, 4], grow: 3 },
        { key: 'bal', name: 'Balance', kind: 'yogaBalance', count: [0, 1, 1, 1], grow: 0 },
        { key: 'deep', name: 'Deep stretch', kind: 'yogaFloor', count: [1, 2, 3, 4], grow: 3 }
      ],
      Chill: [
        { key: 'loose', name: 'Breathe & loosen', kind: 'mobility', count: [2, 3, 4, 5], grow: 2 },
        { key: 'gentle', name: 'Gentle stretch', kind: 'gentle', count: [1, 2, 3, 4], grow: 2 }
      ]
    };
    return (R[s.mood] || R.Surprise).map((b) => Object.assign({}, b, { n: b.count[tier] }));
  }
  planN(extra) {
    const s = this.state, F = this.fams(), BK = this.bank(), U = this.unlocked(s.levels), MIx = this.moveInfo();
    const R = this.recipe();
    // Energy changes difficulty, not just length: low energy works one level easier, Chill is always easy.
    const ease = s.mood === 'Chill' || s.energy < 34 ? 1 : 0;
    const lv = (k) => Math.max(0, (s.levels[k] || 0) - ease);
    const used = {};
    const choose = (cands0, k, again) => {
      let cands = cands0;
      if (s.focus) { const fz = cands0.filter((m) => { const mi = MIx[m.n]; return mi && mi.f.concat(mi.b).indexOf(s.focus) >= 0 && !used[m.n]; }); if (fz.length) cands = fz; }
      const ok = (m) => this.safeOK(m) && !(F[m.fam].hidden && !U[m.fam]);
      let c = cands.filter((m) => !used[m.n] && ok(m));
      if (!c.length && again) c = cands.filter((m) => ok(m) && (used[m.n] || 0) < 2); // rounds and flows can repeat a move once
      if (!c.length) return null;
      const m = c[(this.hash(k) + s.seed * 3 + (s.swaps[k] || 0)) % c.length];
      used[m.n] = (used[m.n] || 0) + 1;
      return m;
    };
    const onLadder = (fam, ahead) => { const Fm = F[fam]; if (!Fm.ladder || !Fm.ladder.length) return null; const st = Math.max(0, this.stone(fam) - ease * 2); const lo = ahead ? st : Math.max(0, st - 1), hi = Math.min(Fm.ladder.length - 1, ahead ? st + 1 : st); const c = []; for (let i = lo; i <= hi; i++) { const m = BK.find((x) => x.n === Fm.ladder[i]); if (m) c.push(m); } if (c.some((m) => this.safeOK(m))) return c; for (let i = lo - 1; i >= 0; i--) { const m = BK.find((x) => x.n === Fm.ladder[i]); if (m && this.safeOK(m)) { c.push(m); if (c.filter((x) => this.safeOK(x)).length >= 2) break; } } return c.length ? c : null; };
    const atLevel = (fam, ahead) => { const lad = onLadder(fam, ahead); if (lad) return lad; const L = lv(fam); let c = BK.filter((m) => m.fam === fam && m.lvl === L); if (!c.length) c = BK.filter((m) => m.fam === fam && m.lvl <= L); return c; };
    const upTo = (fam) => BK.filter((m) => m.fam === fam && m.lvl <= lv(fam));
    const withAnim = (pool, anims, fallback) => { const p = pool.filter((m) => anims.indexOf(m.anim) >= 0); return p.length ? p : fallback || pool; };
    const off = (s.seed + new Date().getDate()) % 4;
    const liked = Object.keys(this.likedFams());
    const surpriseFams = (() => { const lf = liked.filter((k) => ['dance', 'strikes', 'balance', 'stretch', 'mobility'].indexOf(k) >= 0); return (lf.length ? lf.concat(lf) : []).concat(['dance', 'strikes', 'balance']).concat(Object.keys(U)); })();
    const TOP = ['groove', 'indianstep', 'twostep', 'bodyroll', 'shoulderiso', 'march', 'wave'];
    const FLOOR = ['sixstep', 'freeze', 'godown', 'chairfreeze', 'turtle', 'headstand', 'tripodrest', 'tucktripod', 'hsfreeze'];
    const STAND = ['warrior', 'tree', 'chairpose', 'dancer', 'downdog', 'fold', 'lowlunge', 'quad', 'calfwall', 'armstretch'];
    const pick = (kind, i, k) => {
      const rot = (arr) => arr[(off + i) % arr.length];
      switch (kind) {
        case 'warm': return choose(upTo('mobility').concat(BK.filter((m) => m.fam === 'cond' && m.role === 'w')), k);
        case 'strength': return choose(atLevel(rot(['push', 'legs', 'pull', 'core', 'balance'].concat(U.crawls ? ['crawls'] : []))), k);
        case 'upper': return choose(atLevel(rot(['push', 'pull'])), k);
        case 'lower': return choose(atLevel(rot(['legs', 'core', 'legs', 'balance'].concat(U.crawls ? ['crawls'] : []))), k);
        case 'surprise': { const fam = surpriseFams[(s.seed + i) % surpriseFams.length]; return choose(atLevel(fam, true), k); }
        case 'cool': return choose(upTo('stretch').concat(U.splits ? atLevel('splits') : []), k);
        case 'danceWarm': return choose(BK.filter((m) => (m.fam === 'mobility' && m.lvl <= Math.min(1, lv('mobility'))) || (m.fam === 'cond' && m.role === 'w')), k);
        case 'toprock': return choose(withAnim(upTo('dance'), TOP), k, true);
        case 'floor': { const pool = upTo('dance').concat(U.freezes ? upTo('freezes') : []); const fl = pool.filter((m) => FLOOR.indexOf(m.anim) >= 0); return fl.length ? choose(fl, k) : null; }
        case 'dancerStrength': return choose(atLevel(rot(['legs', 'core'])), k);
        case 'fightWarm': return choose(BK.filter((m) => (m.fam === 'cond' && m.role === 'w') || (m.fam === 'mobility' && m.lvl === 0)), k);
        case 'strikes': return choose(i % 3 === 2 && U.flow ? upTo('flow') : upTo('strikes'), k, true);
        case 'core': return choose(atLevel('core'), k);
        case 'mobility': return choose(upTo('mobility'), k, true);
        case 'yogaStand': return choose(withAnim(upTo('stretch'), STAND), k, true);
        case 'yogaBalance': return choose(BK.filter((m) => (m.fam === 'balance' && ['singleleg', 'tree'].indexOf(m.anim) >= 0) || m.anim === 'tree' || m.anim === 'dancer').filter((m) => m.lvl <= lv(m.fam) + 1), k);
        case 'yogaFloor': return choose(upTo('stretch').filter((m) => STAND.indexOf(m.anim) < 0).concat(U.splits ? upTo('splits') : []), k, true);
        case 'tinyLoose': return choose(BK.filter((m) => m.fam === 'mobility' && m.lvl === 0), k);
        case 'tinyMove': return choose(BK.filter((m) => ['legs', 'push', 'dance', 'core'].indexOf(m.fam) >= 0 && m.lvl === 0 && m.role !== 'f'), k);
        case 'gentle': return choose(BK.filter((m) => m.fam === 'stretch' && m.lvl <= Math.min(1, lv('stretch'))), k, true);
        case 'deskMob': return choose(BK.filter((m) => m.fam === 'mobility' && m.lvl <= 1 && ['jointcircles', 'twistlie', 'catcow', 'wave', 'hipcircle'].indexOf(m.anim) >= 0), k);
        case 'deskStretch': return choose(BK.filter((m) => m.fam === 'stretch' && m.lvl <= 1 && ['armstretch', 'quad', 'calfwall', 'fold', 'lowlunge'].indexOf(m.anim) >= 0), k);
        case 'quickLegs': return choose(BK.filter((m) => (m.fam === 'legs' || m.fam === 'balance') && m.lvl === 0), k);
        case 'restPose': return choose(BK.filter((m) => ['childpose', 'twistlie', 'happybaby'].indexOf(m.anim) >= 0 && m.lvl <= 1), k);
        case 'finish': return choose(BK.filter((m) => m.fam === 'cond' && m.role === 'f' && m.lvl <= Math.round((lv('push') + lv('pull') + lv('legs') + lv('core')) / 4)), k);
      }
      return null;
    };
    const blocks = [];
    R.forEach((b, bi) => {
      const count = b.n + (extra[bi] || 0);
      const picks = Array.from({ length: count }, (_, i) => pick(b.kind, i, b.key + i)).filter(Boolean);
      if (!picks.length) return;
      const lead = F[picks[0].fam] || F.push;
      blocks.push({ key: b.key, name: b.name, color: lead.color, shape: lead.shape, moves: picks.map((m, i) => ({ id: b.key + i, n: m.n, rx: m.rx, block: b.name, fam: m.fam, color: F[m.fam].color, ink: F[m.fam].ink, pose: 'walk', secs: this.dur(m.rx), swapCount: s.swaps[b.key + i] || 0 })) });
    });
    return blocks;
  }
  flat() { return this.plan().reduce((a, b) => a.concat(b.moves), []); }
  secsAt(i) { const f = this.flat(); return f[i] ? f[i].secs : 30; }
  per() { return this.secsAt(this.state.idx); }
  swipeTo(screen, extra) {
    const order = ['checkin', 'paths', 'you'];
    const dir = order.indexOf(screen) >= order.indexOf(this.state.screen) ? 'swl' : 'swr';
    this.setState(Object.assign({ screen, swipe: dir, expanding: false }, extra || {}));
  }
  transitionTo(screen, color, extra) {
    this.setState({ expanding: true, expandColor: color });
    clearTimeout(this.tt);
    this.tt = setTimeout(() => this.setState(Object.assign({ screen, expanding: false }, extra || {})), 360);
  }
  tick() {
    const s = this.state;
    if (s.screen !== 'player' || s.paused) return;
    if (s.remaining > 1) { if (s.remaining <= 4) this.sfx('tick'); this.setState({ remaining: s.remaining - 1 }); return; }
    this.sfx(s.resting ? 'go' : 'done');
    if (s.resting) this.endRest(); else this.finishMove();
  }
  isStrengthMove(m) {
    const mi = m && this.moveInfo()[m.n];
    return !!mi && ['push', 'pull', 'legs', 'core', 'balance'].indexOf(mi.fam) >= 0;
  }
  finishMove() {
    const f = this.flat(), s = this.state;
    const tried = Object.assign({}, s.tried); if (f[s.idx]) tried[f[s.idx].n] = true;
    if (s.idx + 1 >= f.length) { this.finish(tried); return; }
    this.setState({ tried, resting: true, remaining: s.rest || 15, askFb: this.isStrengthMove(f[s.idx]), fbMsg: '' });
  }
  endRest() { this.setState({ resting: false, askFb: false, idx: this.state.idx + 1, remaining: this.secsAt(this.state.idx + 1) }); }
  skip() {
    const f = this.flat(), s = this.state;
    if (s.resting) { this.endRest(); return; }
    if (s.idx + 1 >= f.length) { this.finish(s.tried); return; }
    this.setState({ idx: s.idx + 1, remaining: this.secsAt(s.idx + 1), askFb: false, fbMsg: '' });
  }
  finish(tried) {
    const plan = this.plan(), F = this.fams(), MI = this.moveInfo();
    const play = plan.find((b) => b.key === 'play') || plan[0];
    const famKey = (play && play.moves[0] && MI[play.moves[0].n]) ? MI[play.moves[0].n].fam : 'push';
    const history = Object.assign({}, this.state.history); const nd = new Date(); history[nd.getFullYear() + '-' + (nd.getMonth() + 1) + '-' + nd.getDate()] = F[famKey] ? famKey : 'push';
    this.setState({ tried: tried || this.state.tried, history, resting: false, askFb: false });
    this.logSession(this.flat());
    const sessions = (this.state.sessions || 0) + 1, lv = this.lvSum(), T = this.tricks();
    const learned = T.filter((t) => t[1] > (this.state.lvAtStart || 0) && t[1] <= lv);
    const ups = lv - (this.state.lvAtStart || 0);
    const MS = { 1: "First session! I'm officially your dog now.", 3: 'Three! I counted on my paws.', 5: 'Five! I ran out of paws.', 10: 'Ten sessions! Double digits, double wiggles.', 25: 'Twenty-five sessions. I am telling all the other dogs.', 50: 'Fifty. I made you a crown. Then I ate it.', 100: 'One hundred sessions. I need a bigger tail to wag.' };
    const DONE = ['That was a good wiggle.', 'My tail has not stopped.', 'Zoomies!', 'Hydrate, human.', 'I need a nap now.', 'I would give you a treat but I ate it.', 'Can we do the wiggly one again?', 'Ten out of ten wiggles.', 'I did all of it too. Mostly.'];
    let note = learned.length ? 'I learned a new trick: ' + learned[learned.length - 1][0] + '! Come see on You.' : MS[sessions] || (ups > 0 ? 'You went up ' + (ups === 1 ? 'a level' : ups + ' levels') + ' today! I did a spin.' : DONE[sessions % DONE.length]);
    const face = learned.length || MS[sessions] ? 'grin' : ups > 0 ? 'smirk' : 'smile';
    const fl = this.flat(), nw = fl.filter((m) => !(this.state.triedAtStart || {})[m.n]).length;
    this.setState({ sessions, doneNote: note, doneFace: face, doneVals: [Math.max(1, Math.round(this.planSecs(this.plan()) / 60)), fl.length, nw, Math.max(0, ups)], doneTick: this.state.calm ? 99 : 0 });
    clearInterval(this.ct);
    if (!this.state.calm) {
      this.ct = setInterval(() => {
        const t = (this.state.doneTick || 0) + 1;
        if ([16, 22, 28, 34].indexOf(t) >= 0) this.sfx('pop');
        this.setState({ doneTick: t });
        if (t >= 40) clearInterval(this.ct);
      }, 60);
    }
    this.sfx('finish');
    this.transitionTo('done', '#FFC20E');
  }
  feedback(kind) {
    const s = this.state, f = this.flat();
    const m = f[s.idx]; const mi = m && this.moveInfo()[m.n];
    if (!mi) return;
    const fam = this.fams()[mi.fam], LV = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
    let levels = s.levels, stones = s.stones || {};
    let msg = 'Okay!';
    if (fam.ladder.length && (kind === 'easy' || kind === 'hard')) {
      const r = this.moveStone(mi.fam, kind === 'easy' ? 1 : -1);
      if (r.moved) { levels = r.levels; stones = r.stones; }
      if (kind === 'easy') msg = !r.moved ? 'Top of ' + fam.name + '! I cannot even do that.' : r.lvChanged ? fam.name + ' reaches ' + LV[levels[mi.fam]] + '! I did a spin.' : 'Wheee! ' + fam.name + ' moves one stone.';
      else msg = r.moved ? 'Okay, one stone back on ' + fam.name + '.' : 'Okay! Gentle it is.';
    }
    const was = this.unlocked(s.levels), now = this.unlocked(levels);
    if (Object.keys(now).some((k) => !was[k])) msg += ' Wait... I smell a hidden path!';
    if (msg.indexOf('Nice') === 0) this.sfx('level');
    this.setState({ levels, stones, fb: s.fb + 1, askFb: false, fbMsg: msg });
  }
  scrollStone() { setTimeout(() => { try { const el = document.querySelector('.pd-trail .hopper'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }, 60); }
  openMove(name, from) { this.setState({ moveOpen: name, moveFrom: from, mCard: 0, mDir: '' }); this.transitionTo('move', '#FFFFFF'); }
  renderVals() {
    const s = this.state;
    const PHRASES = [
      ["How's", 'your', 'body?'], ['Feeling', 'bendy?'], ["Let's get", 'noodly.'], ['Ready', 'to', 'wiggle?'],
      ['Loosen up,', 'butter-', 'cup.'], ['Bend,', "don't", 'break.'], ['Long dog,', 'long', 'stretch.'],
      ['Every', 'body', 'counts.'], ['Move', 'now,', 'snack', 'later.'], ['Wiener', 'takes', 'all.'],
      ['Stretch', 'it out,', 'champ.'], ["Today's", 'vibe?']
    ];
    const ph = PHRASES[s.phrase % PHRASES.length];
    const longest = Math.max.apply(null, ph.map((l) => l.length));
    const phSize = Math.min(62, Math.floor(300 / (longest * 0.56)), ph.length > 3 ? 56 : 70);
    const tp = (s.time - 5) / 55 * 100;
    const ep = s.energy;
    const tCol = s.time <= 15 ? '#0E8178' : s.time <= 35 ? '#1556C2' : '#E5282E';
    const eCol = ep < 34 ? '#FFC20E' : ep < 67 ? '#F26A0F' : '#E5282E';
    const triH = Math.round(22 + ep * 0.34);
    const dot = Math.round(18 + (s.time - 5) * 0.72);
    const track = (p, c) => 'position:absolute;left:0;right:0;top:17px;height:10px;border-radius:5px;background:linear-gradient(to right,' + c + ' ' + p + '%,#E6E6E6 ' + p + '%)';
    const energyLabel = ep < 34 ? 'Low' : ep < 67 ? 'Medium' : 'High';
    const shapes = {
      Surprise: 'display:block;width:44px;height:22px;border-radius:22px 22px 0 0;background:#1556C2',
      Strength: 'display:block;width:40px;height:40px;border-radius:50%;background:#E5282E',
      Dance: 'display:block;width:40px;height:40px;border-top-right-radius:100%;background:#FFC20E',
      Strikes: 'display:block;width:40px;height:40px;clip-path:polygon(0 100%,100% 0,100% 100%);background:#161616',
      Stretch: 'display:block;width:40px;height:40px;border-radius:0 0 20px 20px;background:#F6A5A9',
      Chill: 'display:block;width:44px;height:24px;border-radius:44px;background:#0E8178'
    };
    const moods = Object.keys(shapes).map((l) => {
      const on = s.mood === l;
      return {
        l, on: on ? 'true' : 'false',
        pick: () => this.setState({ mood: l }),
        shape: shapes[l] + ';transition:transform .3s cubic-bezier(.2,.9,.3,1.3);transform:' + (on ? 'scale(1.15) rotate(-8deg)' : 'none'),
        lab: 'font-size:12px;font-weight:' + (on ? 800 : 500) + ';color:' + (on ? '#161616' : '#595959'),
        bar: 'display:block;height:4px;border-radius:2px;background:#161616;transition:width .3s;width:' + (on ? 22 : 0) + 'px'
      };
    });
    const mini = {
      ring: 'display:block;width:22px;height:22px;border-radius:50%;border:6px solid #0B7A3E;box-sizing:border-box',
      circle: 'display:block;width:22px;height:22px;border-radius:50%;background:#E5282E',
      quarter: 'display:block;width:22px;height:22px;border-top-right-radius:100%;background:#FFC20E',
      tri: 'display:block;width:22px;height:22px;clip-path:polygon(0 100%,100% 0,100% 100%);background:#F26A0F',
      arch: 'display:block;width:22px;height:22px;border-radius:0 0 11px 11px;background:#F6A5A9'
    };
    const plan = this.plan();
    const blocks = plan.map((b, bi) => ({
      name: b.name,
      count: b.moves.length + (b.moves.length === 1 ? ' move' : ' moves'),
      shape: this.shp(b.shape, b.color, 22),
      delay: 'animation-delay:' + (0.15 + bi * 0.08) + 's',
      moves: b.moves.map((m) => ({
        n: m.n, rx: m.rx, swapLabel: 'Swap ' + m.n, open: () => this.openMove(m.n, 'session'), shape: this.shp(this.fams()[m.fam].shape, this.fams()[m.fam].color, 14),
        row: 'display:flex;align-items:center;gap:10px;padding:8px 20px;border-left:0;animation:' + (m.swapCount % 2 ? 'swapA' : 'swapB') + ' .35s ease-out both',
        swap: () => { const sw = Object.assign({}, this.state.swaps); sw[m.id] = (sw[m.id] || 0) + 1; this.setState({ swaps: sw }); }
      }))
    }));
    const flat = plan.reduce((a, b) => a.concat(b.moves), []);
    const per = flat[s.idx] ? flat[s.idx].secs : 30, per0 = flat[0] ? flat[0].secs : 30;
    const idx = Math.min(s.idx, flat.length - 1);
    const cur0 = flat[idx] || { n: '', rx: '', block: '', color: '#E5282E', ink: '#FFFFFF', pose: 'walk' };
    const cur = Object.assign({}, cur0, { like: (this.clarify()[cur0.n] || [''])[0] });
    const C = 2 * Math.PI * 62;
    const frac = s.remaining / (s.resting ? (s.rest || 15) : per);
    const mm = Math.floor(s.remaining / 60), ss = s.remaining % 60;
    const confColors = ['#E5282E', '#FFC20E', '#1556C2', '#0B7A3E', '#F6A5A9', '#F26A0F'];
    const confShapes = ['border-radius:50%', 'border-top-right-radius:100%', 'clip-path:polygon(50% 0,100% 100%,0 100%)', 'border-radius:0', 'border-radius:14px 14px 0 0'];
    const confetti = [];
    for (let i = 0; i < 16; i++) {
      const x = (i * 53 + 17) % 360, y = i % 2 ? 560 + (i * 37) % 110 : 40 + (i * 97) % 140;
      const sz = 14 + (i * 7) % 18;
      confetti.push({ style: 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + (i % 5 === 4 ? sz / 2 : sz) + 'px;background:' + confColors[i % 6] + ';' + confShapes[i % 5] + ';animation-delay:' + (i * 0.05) + 's' });
    }
    const F = this.fams(), MI = this.moveInfo();
    const LVL = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const go = (screen, color, extra) => () => this.transitionTo(screen, color, extra);
    const toggleSt = (on) => ({
      track: 'width:52px;height:30px;padding:0;border:3px solid ' + (on ? '#1556C2' : '#161616') + ';background:' + (on ? '#1556C2' : '#FFFFFF') + ';position:relative;transition:background .2s',
      knob: 'position:absolute;top:3px;left:' + (on ? 25 : 3) + 'px;width:18px;height:18px;background:' + (on ? '#FFFFFF' : '#161616') + ';transition:left .25s cubic-bezier(.3,1.6,.5,1)'
    });
    const U = this.unlocked(s.levels);
    const LAYOUT = [['push', 0, 0, 170, 150], ['pull', 170, 0, 100, 90], ['freezes', 270, 0, 80, 90], ['dance', 170, 90, 180, 60], ['legs', 0, 150, 110, 150], ['core', 110, 150, 130, 90], ['splits', 240, 150, 110, 90], ['crawls', 110, 240, 90, 60], ['strikes', 200, 240, 150, 60], ['stretch', 0, 300, 150, 170], ['balance', 150, 300, 110, 90], ['flow', 260, 300, 90, 90], ['mobility', 150, 390, 200, 80]];
    const cells = LAYOUT.map(([k, x, y, w, h]) => {
      const box = 'position:absolute;left:' + (x + 3) + 'px;top:' + (y + 3) + 'px;width:' + (w - 6) + 'px;height:' + (h - 6) + 'px;background:#FFFFFF;border:0;padding:0;overflow:hidden;text-align:left;cursor:pointer;font-family:Inter Tight,sans-serif';
      if (F[k].hidden && !U[k]) return { open: () => this.setState({ hint: 'Something is hiding in here. It smells like ' + F[F[k].parents[0]].name + ' and ' + F[F[k].parents[1]].name + '.' }), aria: 'Locked hidden path', box, fill: 'display:none', shape: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;color:#D6D6D6', name: '', label: 'display:none', lvl: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#D0D0D0', lvlName: '?' };
      const fm = F[k], lv = s.levels[k], frac = fm.ladder.length ? (this.stone(k) + 1) / fm.ladder.length : (lv + 1) / 5, full = frac >= 1;
      return {
        open: () => { const seen = Object.assign({}, s.seen); seen[k] = true; this.setState({ pathOpen: k, seen, hint: '' }); this.scrollStone(); },
        aria: fm.name + ' path, ' + LVL[lv],
        box: box + (fm.hidden && !s.seen[k] ? ';animation:flipIn .7s cubic-bezier(.2,.9,.3,1.2) both' : ''),
        fill: 'position:absolute;left:0;right:0;bottom:0;height:' + Math.round(frac * 100) + '%;background:' + fm.color + ';transition:height .7s cubic-bezier(.3,1.4,.5,1)',
        shape: 'position:absolute;left:9px;top:9px;' + this.shp(fm.shape, full ? fm.ink : fm.color, 18),
        name: w < 100 ? ({ crawls: 'Crawls', flow: 'Footwork' }[k] || fm.name) : fm.name,
        label: (w < 100 ? 'position:absolute;left:9px;right:4px;top:31px;font-size:10px;letter-spacing:.04em;' : 'position:absolute;left:34px;right:6px;top:10px;font-size:11px;letter-spacing:.08em;') + 'font-weight:800;text-transform:uppercase;line-height:1.1;color:' + (full ? fm.ink : '#161616'),
        lvl: 'position:absolute;left:9px;bottom:7px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + ((frac * h) >= 26 ? fm.ink : '#161616') + ';opacity:' + (h > 70 ? 1 : 0),
        lvlName: LVL[lv]
      };
    });
    const pk = s.pathOpen && F[s.pathOpen] ? s.pathOpen : 'push';
    const pf = F[pk], plv = s.levels[pk];
    const pst = this.stone(pk), LV5 = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
    const TXp = [26, 58, 74, 42], ROW = 66, TOP0 = 34, nS = pf.ladder.length;
    const sx = (i) => TXp[i % 4], sy = (i) => TOP0 + i * ROW;
    const curve = (k) => { let d = 'M' + sx(0) + ' ' + sy(0); for (let i = 1; i <= k; i++) { const my = (sy(i - 1) + sy(i)) / 2; d += ' C' + sx(i - 1) + ' ' + my + ' ' + sx(i) + ' ' + my + ' ' + sx(i) + ' ' + sy(i); } return d; };
    const trail = pf.ladder.map((n, i) => {
      const done = i < pst, here = i === pst, right = sx(i) < 50, lvl = pf.lvls[i], first = i === 0 || pf.lvls[i - 1] !== lvl;
      const sz = here ? 50 : first ? 36 : 28;
      return {
        n, here, lvl: first || here ? (here ? 'You are here · ' : '') + LV5[lvl] : '', aria: LV5[lvl] + ': ' + n,
        open: () => this.openMove(n, 'paths'),
        box: 'position:absolute;left:' + sx(i) + '%;top:' + sy(i) + 'px;width:' + sz + 'px;height:' + sz + 'px;margin:-' + sz / 2 + 'px 0 0 -' + sz / 2 + 'px;border:0;padding:0;background:transparent;cursor:pointer',
        shape: 'position:absolute;left:0;top:0;width:' + sz + 'px;height:' + sz + 'px;box-sizing:border-box;border-radius:' + (pf.shape === 'square' || pf.shape === 'diamond' ? '6px' : '50%') + ';' + (done ? 'background:' + pf.color : here ? 'background:' + pf.color + ';box-shadow:0 0 0 5px #FFFFFF,0 0 0 8px ' + pf.color : 'background:#FFFFFF;border:3px solid ' + (first ? '#BDBDBD' : '#E4E4E4')),
        label: 'position:absolute;top:' + (sz / 2 - (first || here ? 17 : 9)) + 'px;' + (right ? 'left:' + (sz + 12) + 'px;text-align:left' : 'right:' + (sz + 12) + 'px;text-align:right') + ';width:160px;display:flex;flex-direction:column;font:' + (here ? 900 : first ? 800 : 600) + ' ' + (here ? 15 : 14) + 'px Inter Tight,sans-serif;line-height:1.1;color:' + (i > pst ? '#595959' : '#161616'),
        sub: 'font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-top:3px;color:' + (here ? pf.color === '#FFC20E' ? '#8A6A00' : pf.color : '#595959'),
        dog: 'position:absolute;top:' + (sz / 2 - 17) + 'px;' + (right ? 'left:-44px' : 'left:' + (sz + 10) + 'px') + ';' + this.face('grin', 34)
      };
    });
    const trailH = TOP0 * 2 + (nS - 1) * ROW;
    const mvName = s.moveOpen || 'Push-up';
    const mi = MI[mvName] || { fam: 'mobility', lvl: 0, role: 'v', cues: ['Move slowly and with control.', 'Breathe out on the effort.'], f: [], b: [] };
    const mf = F[mi.fam];
    const regionMap = (list, keys, color) => { const o = {}; keys.forEach((k) => { o[k] = list.indexOf(k) >= 0 ? color : '#E4E4E4'; }); return o; };
    const FK = ['shoulders', 'chest', 'arms', 'core', 'hips', 'legs'], BK = ['shoulders', 'arms', 'back', 'lowback', 'glutes', 'hamstrings'];
    const pretty = { shoulders: 'shoulders', chest: 'chest', arms: 'arms', core: 'core', hips: 'hips', legs: 'legs', back: 'upper back', lowback: 'lower back', glutes: 'glutes', hamstrings: 'hamstrings' };
    const works = []; mi.f.concat(mi.b).forEach((r) => { if (works.indexOf(pretty[r]) < 0) works.push(pretty[r]); });
    const fresh = Object.keys(U).filter((k) => !s.seen[k]);
    const mvFig = this.figure(mvName, s.calm, s.slowMo);
    const CL = this.clarify(), mcl = CL[mvName];
    const mvSteps = F[mi.fam].steps;
    const mLad = F[mi.fam].ladder || [], mIdx = mLad.indexOf(mvName);
    const mvEasier = mIdx > 0 ? mLad[mIdx - 1] : mIdx < 0 && mi.lvl > 0 ? mvSteps[mi.lvl - 1] : '';
    const mvHarder = mIdx >= 0 ? mLad[mIdx + 1] || '' : mi.lvl < 4 ? (mi.role === 'm' ? mvSteps[mi.lvl + 1] : mvSteps[mi.lvl]) : '';
    const allMoves = Object.keys(MI);
    const q = s.query.trim().toLowerCase();
    const results = q ? allMoves.filter((n) => { const m = MI[n]; return n.toLowerCase().indexOf(q) >= 0 || F[m.fam].name.toLowerCase().indexOf(q) >= 0 || m.f.concat(m.b).some((r) => pretty[r].indexOf(q) >= 0); }).slice(0, 8) : [];
    const untried = allMoves.filter((n) => !s.tried[n]);
    const likedF = this.likedFams();
    const reachable = untried.filter((n) => { const m = MI[n]; return m.fam !== 'cond' && !(F[m.fam].hidden && !U[m.fam]) && m.lvl <= (s.levels[m.fam] || 0) && this.safeOK({ n }); });
    const pool = reachable.filter((n) => likedF[MI[n].fam]).length >= 3 ? reachable.filter((n) => likedF[MI[n].fam]) : reachable.length >= 3 ? reachable : untried;
    const picks = [0, 1, 2].map((i) => pool[(s.seed * 3 + i * 7) % Math.max(1, pool.length)]).filter((n, i, a) => n && a.indexOf(n) === i);
    const now = new Date(), Y = now.getFullYear(), Mo = now.getMonth(), today = now.getDate();
    const firstDow = new Date(Y, Mo, 1).getDay(), dim = new Date(Y, Mo + 1, 0).getDate();
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dark = { '#161616': 1, '#1556C2': 1, '#E5282E': 1, '#0B7A3E': 1, '#6B3FA0': 1, '#0E8178': 1 };
    const selD = s.selDay || today;
    const calCells = [];
    for (let i = 0; i < firstDow; i++) calCells.push({ n: '', aria: 'empty', pick: () => {}, box: 'height:44px;border:0;padding:0;background:#F4F4F4', num: 'display:none' });
    for (let d = 1; d <= dim; d++) {
      const e = this.dayLog(Y + '-' + (Mo + 1) + '-' + d);
      const fs = e ? Object.keys(e.f).filter((k) => F[k]).sort((p, q) => e.f[q] - e.f[p]).slice(0, 3) : [];
      let bg = d > today ? '#F4F4F4' : '#FFFFFF';
      if (fs.length === 1) bg = F[fs[0]].color;
      if (fs.length === 2) bg = 'linear-gradient(90deg,' + F[fs[0]].color + ' 0 60%,#161616 60% calc(60% + 3px),' + F[fs[1]].color + ' calc(60% + 3px))';
      if (fs.length === 3) bg = 'linear-gradient(90deg,' + F[fs[0]].color + ' 0 60%,#161616 60% calc(60% + 3px),transparent calc(60% + 3px)),linear-gradient(180deg,' + F[fs[1]].color + ' 0 50%,#161616 50% calc(50% + 3px),' + F[fs[2]].color + ' calc(50% + 3px))';
      const sel = d === selD, isT = d === today;
      calCells.push({
        n: d, aria: MONTHS[Mo] + ' ' + d + (fs.length ? ', moved' : ''),
        pick: () => this.setState({ selDay: d }),
        box: 'position:relative;height:44px;border:0;padding:0;background:' + bg + ';cursor:pointer;' + (sel ? 'box-shadow:inset 0 0 0 3px ' + (fs.length ? '#FFFFFF' : '#161616') + ',inset 0 0 0 5px #161616;' : isT ? 'box-shadow:inset 0 0 0 2px #161616;' : ''),
        num: 'position:absolute;left:4px;top:3px;font-size:9px;font-weight:800;color:' + (fs.length ? (dark[F[fs[0]].color] ? '#FFFFFF' : '#161616') : d > today ? '#757575' : '#595959')
      });
    }
    const sk = Y + '-' + (Mo + 1) + '-' + selD, se = this.dayLog(sk), selDate = new Date(Y, Mo, selD);
    const dayTitle = (selD === today ? 'Today · ' : '') + DAYN[selDate.getDay()] + ', ' + MONTHS[Mo].slice(0, 3) + ' ' + selD;
    let dayLine;
    if (se) dayLine = [se.m ? se.m + ' min' : '', se.mv.length ? se.mv.length + (se.mv.length === 1 ? ' move' : ' moves') : '', se.nw.length ? se.nw.length + ' new' : ''].filter(Boolean).join(' · ') || 'You moved.';
    else dayLine = selD > today ? "Hasn't happened yet." : selD === today ? 'Nothing yet today.' : 'Nap day.';
    const dayFams = se ? Object.keys(se.f).filter((k) => F[k]).sort((p, q) => se.f[q] - se.f[p]).map((k) => ({ name: F[k].name, shape: this.shp(F[k].shape, F[k].color, 12) })) : [];
    const dayOrder = se ? se.nw.concat(se.mv.filter((n) => se.nw.indexOf(n) < 0)) : [];
    const dayMore = dayOrder.length > 4 ? '+' + (dayOrder.length - 4) + ' more' : '';
    const dayMoves = se ? dayOrder.slice(0, 4).map((n) => { const nw = se.nw.indexOf(n) >= 0; return { n: (nw ? '★ ' : '') + n, open: () => this.openMove(n, 'you'), box: 'border:0;padding:4px 8px;font:700 12px Inter Tight,sans-serif;cursor:pointer;' + (nw ? 'background:#FFC20E;color:#161616' : 'background:#F4F4F4;color:#161616') }; }) : [];
    const reg = {}; let daysMoved = 0;
    for (let k = 0; k < 7; k++) {
      const dt = new Date(Y, Mo, today - k), e = this.dayLog(this.dayKey(dt)); if (!e) continue; daysMoved++;
      if (e.mv.length) e.mv.forEach((n) => { const mi = MI[n]; if (mi) mi.f.concat(mi.b).forEach((r) => { reg[r] = (reg[r] || 0) + 1; }); });
      else Object.keys(e.f).forEach((fk) => { if (F[fk]) F[fk].f.concat(F[fk].b).forEach((r) => { reg[r] = (reg[r] || 0) + 2; }); });
    }
    const side = s.bodySide;
    const PARTS = side === 'f'
      ? [['arms', 12, 68, 14, 60, 7], ['arms', 94, 68, 14, 60, 7], ['shoulders', 18, 44, 24, 24, 12], ['shoulders', 78, 44, 24, 24, 12], ['chest', 40, 44, 40, 34, 6], ['core', 42, 82, 36, 40, 6], ['hips', 40, 126, 40, 22, 6], ['legs', 40, 152, 18, 80, 9], ['legs', 62, 152, 18, 80, 9]]
      : [['arms', 12, 68, 14, 60, 7], ['arms', 94, 68, 14, 60, 7], ['shoulders', 18, 44, 24, 24, 12], ['shoulders', 78, 44, 24, 24, 12], ['back', 40, 44, 40, 40, 6], ['lowback', 42, 88, 36, 34, 6], ['glutes', 40, 126, 40, 22, 6], ['hamstrings', 40, 152, 18, 80, 9], ['hamstrings', 62, 152, 18, 80, 9]];
    const sideRegs = PARTS.map((p) => p[0]).filter((x, i, arr) => arr.indexOf(x) === i);
    const region = s.region && sideRegs.indexOf(s.region) >= 0 ? s.region : sideRegs.slice().sort((p, q) => (reg[p] || 0) - (reg[q] || 0))[0];
    const heat = (r) => { const n = reg[r] || 0; return n === 0 ? '#E4E4E4' : n <= 2 ? '#F6A5A9' : n <= 5 ? '#F2575C' : '#E5282E'; };
    const bodyParts = [{ aria: 'head', pick: () => {}, box: 'position:absolute;left:46px;top:6px;width:28px;height:28px;border-radius:50%;border:0;padding:0;background:#E4E4E4' }].concat(PARTS.map((p) => ({
      aria: pretty[p[0]] + ', ' + (reg[p[0]] || 0) + ' this week',
      pick: () => this.setState({ region: p[0] }),
      box: 'position:absolute;left:' + p[1] + 'px;top:' + p[2] + 'px;width:' + p[3] + 'px;height:' + p[4] + 'px;border-radius:' + p[5] + 'px;border:0;padding:0;cursor:pointer;background:' + heat(p[0]) + ';' + (p[0] === region ? 'box-shadow:0 0 0 3px #161616;z-index:2' : '')
    })));
    const rn = reg[region] || 0;
    const anyLog = Object.keys(s.log || {}).length > 0;
    const regionLine = !anyLog ? 'Nothing here yet.' : rn === 0 ? 'Not this week yet.' : rn <= 2 ? 'A little this week (' + rn + (rn === 1 ? ' move' : ' moves') + ').' : rn <= 5 ? 'Worked this week (' + rn + ' moves).' : 'Lots this week (' + rn + ' moves).';
    const famOrder = Object.keys(F).filter((k) => k !== 'cond');
    const collection = [];
    famOrder.forEach((fk) => allMoves.filter((n) => MI[n].fam === fk).forEach((n) => {
      const got = !!s.tried[n];
      collection.push({ got, aria: got ? n : 'Undiscovered ' + F[fk].name + ' move', shape: this.shp(F[fk].shape, got ? F[fk].color : '#E4E4E4', 14), open: got ? () => this.openMove(n, 'you') : () => this.setState({ collectHint: 'Still hiding: a ' + F[fk].name + ' move. Keep moving to find it.' }) });
    }));
    const foundN = collection.filter((c) => c.got).length;
    const collFams = famOrder.map((fk) => {
      const ms = allMoves.filter((n) => MI[n].fam === fk).sort((p, q) => MI[p].lvl - MI[q].lvl);
      if (!ms.length) return null;
      const got = ms.filter((n) => s.tried[n]), open = s.collOpen === fk;
      const locked = F[fk].hidden && !U[fk];
      return {
        name: locked ? '???' : F[fk].name, shape: this.shp(F[fk].shape, got.length ? F[fk].color : '#D0D0D0', 14),
        count: got.length + '/' + ms.length, open, openAttr: open ? 'true' : 'false',
        toggle: () => this.setState({ collOpen: open ? null : fk }),
        segs: ms.map((n) => ({ s: 'flex:1;height:8px;background:' + (s.tried[n] ? F[fk].color : '#EAEAEA') })),
        moves: got.map((n) => ({ n, open: () => this.openMove(n, 'you'), box: 'border:0;padding:4px 8px;font:700 12px Inter Tight,sans-serif;background:#F4F4F4;color:#161616;cursor:pointer' })),
        ready: locked ? [] : ms.filter((n) => !s.tried[n] && MI[n].lvl <= (s.levels[fk] || 0)).slice(0, 6).map((n) => ({ n, open: () => this.openMove(n, 'you'), box: 'border:2px solid ' + F[fk].color + ';padding:2px 8px;font:700 12px Inter Tight,sans-serif;background:#FFFFFF;color:#161616;cursor:pointer' })),
        ahead: ms.filter((n) => !s.tried[n] && MI[n].lvl > (s.levels[fk] || 0)),
        peekOpen: s.peek === fk && !locked,
        peekLabel: (() => { const n = ms.filter((x) => !s.tried[x] && MI[x].lvl > (s.levels[fk] || 0)).length; return locked ? n + ' moves unlock with this path' : n ? (s.peek === fk ? 'Hide harder moves' : 'Peek at ' + n + ' harder ' + (n === 1 ? 'move' : 'moves')) : 'Nothing harder left. Wow.'; })(),
        peekGo: () => { if (!locked) this.setState({ peek: s.peek === fk ? null : fk }); },
        peekMoves: (() => { const ah = ms.filter((n) => !s.tried[n] && MI[n].lvl > (s.levels[fk] || 0)); const nl = ah.length ? Math.min.apply(null, ah.map((n) => MI[n].lvl)) : 0; return ah.filter((n) => MI[n].lvl === nl).map((n) => ({ n, open: () => this.openMove(n, 'you') })); })(),
        nextLvl: (() => { const ah = ms.filter((n) => !s.tried[n] && MI[n].lvl > (s.levels[fk] || 0)); return ah.length ? ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Pro'][Math.min.apply(null, ah.map((n) => MI[n].lvl))] : ''; })(),
        laterLine: (() => { const ah = ms.filter((n) => !s.tried[n] && MI[n].lvl > (s.levels[fk] || 0)); if (!ah.length) return ''; const nl = Math.min.apply(null, ah.map((n) => MI[n].lvl)); const more = ah.filter((n) => MI[n].lvl > nl).length; return more ? 'and ' + more + ' more after that.' : 'That is everything here.'; })(),
        hasReady: !locked && ms.some((n) => !s.tried[n] && MI[n].lvl <= (s.levels[fk] || 0)),
        readyMore: (() => { const n = ms.filter((x) => !s.tried[x] && MI[x].lvl <= (s.levels[fk] || 0)).length - 6; return n > 0 ? '+' + n + ' more at your level' : ''; })(),
        hasGot: got.length > 0
      };
    }).filter(Boolean);
    const lvSum = this.lvSum();
    const TR = this.tricks(), openT = TR.filter((t) => lvSum >= t[1]), nextT = TR.find((t) => lvSum < t[1]);
    const curT = TR.find((t) => t[0] === s.trickName);
    const tricks = TR.filter((t) => lvSum >= t[1] || t === nextT).map((t) => {
      const on = lvSum >= t[1];
      return { t: on ? t[0] : '?', aria: on ? 'Trick: ' + t[0] : 'Locked trick', isNew: on && t[1] > 0 && !s.seenTricks[t[0]], go: () => (on ? this.doTrick(t[0]) : null),
        box: 'position:relative;height:26px;min-width:26px;padding:0 7px;border:0;font:800 11px Inter Tight,sans-serif;cursor:pointer;' + (on ? 'background:#161616;color:#FFFFFF' : 'background:#EFEFEF;color:#757575') };
    });
    const cT = toggleSt(s.calm, '#0E8178'), sT = toggleSt(s.sound, '#FFC20E'), chT = toggleSt(s.chatter, '#E5282E');
    const restLines = ['Water break! Slurp.', 'Shake shake shake.', 'Breathe in... out.', 'Pant pant pant.', 'I am lying down for a sec.', 'I am wiggling my toes.', 'Nice one.', 'Big sigh.', 'Halfway-ish!', 'Was that a squirrel?'];
    const sessLines = ["Let's gooo!", 'Wiggle time!', 'Is it wiggle time?', 'Snoot boop for luck.', 'I stretched already.', 'This one looks fun.'];
    const petLines = ['Hehe.', 'More please.', 'Best human.', '*happy wiggle*', 'Again!', 'Ears too!'];
    return {
      hasBanner: fresh.length > 0,
      bannerText: fresh.length ? 'New path unlocked: ' + F[fresh[0]].name + '!' : '',
      bannerShape: fresh.length ? this.shp(F[fresh[0]].shape, F[fresh[0]].color, 22) : '',
      bannerGo: () => { if (!fresh.length) return; const seen = Object.assign({}, s.seen); seen[fresh[0]] = true; this.setState({ pathOpen: fresh[0], seen }); },
      mfg: mvFig,
      pfg: this.figure(cur.n, s.calm),
      hasEasier: !!mvEasier && mvEasier !== mvName, hasHarder: !!mvHarder && mvHarder !== mvName,
      mvEasier, mvHarder,
      openEasier: () => this.setState({ moveOpen: mvEasier, mCard: 0, mDir: 'swr' }),
      openHarder: () => this.setState({ moveOpen: mvHarder, mCard: 0, mDir: 'swl' }),
      startAll: () => { this.ensureAudio(); this.sfx('start'); this.transitionTo('player', '#161616', { lvAtStart: this.lvSum(), triedAtStart: Object.assign({}, s.tried), idx: 0, remaining: per0, paused: false, resting: false, askFb: false, fbMsg: '' }); },
      rootClass: s.calm ? 'calm' : '',
      chatter: s.chatter,
      restLine: s.idx === 0 ? 'Huff huff. The start always makes me huff.' : s.idx === 1 ? 'Okay. My legs woke up.' : restLines[(s.idx + s.seed) % restLines.length],
      sessLine: sessLines[(s.seed + (s.sessions || 0)) % sessLines.length],
      petLine: petLines[(s.homePets || 0) % petLines.length],
      doneStats: [['Minutes', '#E5282E', '#FFFFFF'], ['Moves', '#1556C2', '#FFFFFF'], ['New', '#FFC20E', '#161616'], ['Level-ups', '#FFFFFF', '#161616']].map((d, i) => {
        const val = (s.doneVals || [0, 0, 0, 0])[i], start = 10 + i * 6, p = Math.max(0, Math.min(1, ((s.doneTick || 0) - start) / 6));
        const shown = p > 0;
        return { l: d[0], v: Math.round(val * p), box: 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:74px;margin:0 ' + (i < 3 ? 3 : 0) + 'px 0 0;background:' + d[1] + ';color:' + d[2] + ';transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .2s;opacity:' + (shown ? 1 : 0.15) + ';transform:scale(' + (p >= 1 ? 1 : shown ? 1.12 : 0.85) + ')' };
      }),
      friendGo: () => this.shareFriend(), shareMsg: s.shareMsg || 'Wiggle with a friend →',
      doneNote: (() => { try { const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); const inst = navigator.standalone || matchMedia('(display-mode: standalone)').matches; if (ios && !inst && [2, 4].indexOf(s.sessions || 0) >= 0) return 'Put me on your Home Screen? I like it there. (Share, then Add to Home Screen)'; } catch (e) {} return s.doneNote || 'That was a good wiggle.'; })(), doneFaceSt: this.face(s.doneFace || 'grin', 44),
      showUpNext: !s.askFb && !s.fbMsg,
      askFb: s.askFb, hasFbMsg: !!s.fbMsg && !s.askFb, fbMsg: s.fbMsg,
      lastMove: cur.n,
      fbEasy: () => { this.setState({ fbKind: 'easy' }); this.feedback('easy'); }, fbRight: () => { this.setState({ fbKind: 'right' }); this.feedback('right'); }, fbHard: () => { this.setState({ fbKind: 'hard' }); this.feedback('hard'); },
      faceEasy: this.face('smirk', 20), faceRight: this.face('smile', 20), faceHard: this.face('oof', 20),
      fbFace: this.face(s.fbKind === 'easy' ? 'smirk' : s.fbKind === 'hard' ? 'oof' : 'grin', 26),
      youFace: this.face('grin', 24),
      navHome: () => this.swipeTo('checkin', { pathOpen: null, groove: !s.groove, grooveN: (s.grooveN || 0) + 1 }),
      moveWord: s.groove ? 'Groove' : 'Move',
      navDog: 'display:block;transform-origin:50% 90%;' + (s.grooveN && !s.calm ? 'animation:' + (s.groove ? 'trDance' : 'trHop') + (s.grooveN % 2 ? '' : '2') + ' ' + (s.groove ? '1.1s' : '.8s') + ' cubic-bezier(.3,.7,.4,1) both' : ''),
      navPaths: () => this.swipeTo('paths', { pathOpen: null, query: '' }),
      navExplore: () => this.swipeTo('explore', { query: '' }),
      navYou: () => this.swipeTo('you'),
      tabClass: s.swipe || 'a-screen',
      isPaths: s.screen === 'paths', isMove: s.screen === 'move', isExplore: s.screen === 'explore', isYou: s.screen === 'you',
      pathsSub: 'Tap a path to see its stones.',
      cells,
      nudgeText: s.hint ? s.hint : (() => { const n = s.nudgeN || 0; if (n >= 12) return n % 2 ? 'Okay okay, I am dizzy.' : 'Hehe. Stop. (Do not stop.)'; const L = this.nudgeLines(); return L[n % L.length]; })(),
      nudgeHead: this.dogHead(s.hint ? 'wow' : (s.nudgeN || 0) >= 12 ? 'dizzy' : new Date().getHours() >= 21 && !s.nudgeN ? 'sleepy' : ['calm', 'happy', 'wink', 'wow', 'happy', 'calm'][(s.nudgeN || 0) % 6], 54),
      park: this.park(),
      treeCls: s.parkTree ? (s.parkTree % 2 ? 'tshake1' : 'tshake2') : '', appleCls: s.parkTree ? (s.parkTree % 2 ? 'afall1' : 'afall2') : 'anone',
      ballCls: s.parkBall ? (s.parkBall % 2 ? 'bbounce1' : 'bbounce2') : '',
      treeTap: () => { this.sfx('pop'); this.setState({ parkTree: (s.parkTree || 0) + 1 }); },
      ballTap: () => { this.sfx('bark'); this.setState({ parkBall: (s.parkBall || 0) + 1 }); },
      nudgeHop: (s.nudgeN || 0) % 2 ? 'nhop1' : (s.nudgeN ? 'nhop2' : ''),
      nudgeTap: () => { const n = (s.nudgeN || 0) + 1; this.sfx(n % 3 === 0 ? 'pop' : 'bark'); this.setState({ nudgeN: n, hint: '' }); },
      pathIsOpen: !!s.pathOpen,
      closePath: () => this.setState({ pathOpen: null, celebrate: false }),
      pd: { name: pf.name, lvlName: LVL[plv] + ' · stone ' + (pst + 1) + ' of ' + nS },
      pdHead: 'position:relative;height:220px;flex:none;overflow:hidden;background:' + pf.color + ';color:' + pf.ink,
      pdBigShape: 'position:absolute;right:-30px;bottom:-30px;opacity:.25;' + this.shp(pf.shape, pf.ink, 170),
      trail, trailPath: curve(nS - 1), trailDone: curve(pst), trailColor: pf.color, trailH: 'position:relative;height:' + trailH + 'px', trailView: '0 0 100 ' + trailH, trailCount: 'Stone ' + (pst + 1) + ' of ' + nS,
      celebrate: s.celebrate,
      pdNextLabel: pst < nS - 1 ? 'Got it! Next stone' : 'Mastered!',
      pdNext: () => { const r = this.moveStone(pk, 1); if (!r.moved) return; clearTimeout(this.ct); if (r.lvChanged) this.sfx('level'); this.setState({ levels: r.levels, stones: r.stones, celebrate: r.lvChanged ? 'LEVEL UP!' : 'NICE!' }); this.ct = setTimeout(() => this.setState({ celebrate: false }), 1600); this.scrollStone(); },
      pdEasier: () => { const r = this.moveStone(pk, -1); if (!r.moved) return; this.setState({ levels: r.levels, stones: r.stones, celebrate: false }); this.scrollStone(); },
      mvName, mvTitleSize: mvName.length > 26 ? 30 : mvName.length > 18 ? 34 : 40, mvFam: { name: mf.name },
      mvStage: 'position:relative;min-height:340px;flex:none;overflow:hidden;display:flex;flex-direction:column;background:' + mf.color + ';color:' + mf.ink,
      
      mvCues: (mcl ? mcl.slice(1) : mi.cues).map((c) => ({ t: c })),
      mvLike: mcl ? mcl[0] : '', hasLike: !!mcl,
      toggleSlow: () => this.setState({ slowMo: !s.slowMo }), slowLabel: s.slowMo ? 'Slow-mo on' : 'Tap for slow-mo',
      mvWorks: works.length ? works.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Whole body',
      mbf: regionMap(mi.f, FK, mf.color === '#161616' ? '#E5282E' : mf.color), mbb: regionMap(mi.b, BK, mf.color === '#161616' ? '#E5282E' : mf.color),
      mvFamShape: this.shp(mf.shape, mf.color, 22),
      mvOpenPath: go('paths', '#161616', { pathOpen: mi.fam }),
      closeMove: go(s.moveFrom, s.moveFrom === 'session' ? '#1556C2' : '#FFFFFF'),
      query: s.query, onQuery: (e) => this.setState({ query: e.target.value }),
      hasQuery: !!q, noQuery: !q,
      resultCount: results.length ? results.length + (results.length === 1 ? ' match' : ' matches') : 'Nothing found. Try hips, push or kick.',
      results: results.map((n) => ({ n, fam: F[MI[n].fam].name, shape: this.shp(F[MI[n].fam].shape, F[MI[n].fam].color, 18), open: () => this.openMove(n, 'paths') })),
      famTiles: Object.keys(F).filter((k) => k !== 'cond' && (!F[k].hidden || U[k])).map((k, i) => ({
        name: F[k].name,
        box: 'height:104px;border:0;padding:10px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;text-align:left;cursor:pointer;font-family:Inter Tight,sans-serif;background:' + F[k].color + ';color:' + F[k].ink + ';animation-delay:' + (i * 0.04) + 's',
        shape: this.shp(F[k].shape, F[k].ink, 28),
        open: go('paths', '#161616', { pathOpen: k })
      })),
      picks: picks.map((n) => ({ n, shape: this.shp(F[MI[n].fam].shape, F[MI[n].fam].color, 18), open: () => this.openMove(n, 'paths') })),
      monthName: MONTHS[Mo] + ' ' + Y,
      dow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => ({ t: x })),
      calCells, dayTitle, dayLine, dayFams, dayMoves, dayMore,
      savePoster: () => this.savePoster(),
      bodyFlip: 'position:relative;width:120px;height:236px;animation:' + (side === 'f' ? 'flipA' : 'flipB') + ' .45s cubic-bezier(.2,.9,.3,1.1) both',
      bodyParts, flipBody: () => this.setState({ bodySide: side === 'f' ? 'b' : 'f', region: null }),
      flipLabel: side === 'f' ? 'Flip to back' : 'Flip to front', sideName: side === 'f' ? 'Front' : 'Back',
      regionName: pretty[region].replace(/^./, (c) => c.toUpperCase()), regionLine,
      regionGoLabel: 'Give your ' + pretty[region] + ' some love · 15 min',
      regionGo: go('session', '#1556C2', { focus: region, mood: 'Surprise', time: 15, energy: 50, swaps: {}, idx: 0, visited: true }),
      yTabs: [['Noodle', 'circle', '#E5282E'], ['Month', 'square', '#1556C2'], ['Body', 'peak', '#F26A0F'], ['Moves', 'diamond', '#6B3FA0']].map((t, i) => { const on = (s.yPanel || 0) === i; return { t: t[0], on: on ? 'true' : 'false', shape: this.shp(t[1], on ? t[2] : '#C8C8C8', 12), go: () => { if (!on) this.setState({ yPanel: i, yDir: i > (s.yPanel || 0) ? 'swl' : 'swr' }); }, box: 'height:42px;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:center;gap:6px;font:800 12px Inter Tight,sans-serif;letter-spacing:.06em;text-transform:uppercase;transition:color .3s;color:' + (on ? '#161616' : '#595959') }; }),
      yBar: 'position:absolute;bottom:-3px;height:3px;width:25%;background:#161616;transition:left .45s cubic-bezier(.22,.9,.28,1);left:' + ((s.yPanel || 0) * 25) + '%',
      mTabs: ['How', 'Works', 'Level'].map((t, i) => { const on = (s.mCard || 0) === i; return { t, on: on ? 'true' : 'false', go: () => { if (!on) this.setState({ mCard: i, mDir: i > (s.mCard || 0) ? 'swl' : 'swr' }); }, box: 'height:40px;border:0;background:transparent;padding:0;font:800 12px Inter Tight,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:' + (on ? '#161616' : '#595959') }; }),
      mBar: 'position:absolute;bottom:-3px;height:3px;width:33.34%;background:#161616;transition:left .45s cubic-bezier(.22,.9,.28,1);left:' + ((s.mCard || 0) * 33.33) + '%',
      mc0: (s.mCard || 0) === 0, mc1: s.mCard === 1, mc2: s.mCard === 2, mSlide: s.mDir || 'a-up',
      yp0: (s.yPanel || 0) === 0, yp1: s.yPanel === 1, yp2: s.yPanel === 2, yp3: s.yPanel === 3,
      ySlide: s.yDir || 'a-up',
      sheetBody: s.sheet === 'body', sheetMoves: s.sheet === 'moves',
      openBody: () => this.setState({ sheet: 'body' }), openMoves: () => this.setState({ sheet: 'moves' }), closeSheet: () => this.setState({ sheet: null }),
      foundN, foundTotal: collection.length,
      bodyBars: ['shoulders', 'chest', 'arms', 'core', 'back', 'hips', 'legs', 'glutes'].map((r) => ({ s: 'flex:1;background:' + (reg[r] ? '#E5282E' : '#E4E4E4') + ';height:' + Math.max(4, Math.min(34, (reg[r] || 0) * 6)) + 'px' })),
      bodyTileLine: (() => { const ks = Object.keys(reg); if (!ks.length) return 'Nothing yet this week'; const top = ks.sort((p, q) => reg[q] - reg[p])[0]; return 'Most worked: ' + pretty[top]; })(),
      collection, collFams, foundCount: foundN + ' of ' + collection.length,
      foundBar: 'display:block;height:100%;background:#161616;width:' + Math.round(foundN / Math.max(1, collection.length) * 100) + '%',
      collectHint: 'Moves you have tried. Tap a family to see them.',
      tricks, trickCount: openT.length + ' of ' + TR.length,
      trickLine: !(s.sessions || Object.keys(s.log || {}).length) ? "I don't know any tricks yet." : nextT ? 'Tap me! ' + (nextT[1] - lvSum) + ' more ' + (nextT[1] - lvSum === 1 ? 'level' : 'levels') + ' and I learn ' + nextT[0].toLowerCase() + '.' : 'Noodle knows every trick. Show-off.',
      doTrick: () => this.doTrick(),
      trickAnim: 'display:block;transform-origin:' + ((curT && curT[4]) || '50% 90%') + ';' + (curT && !s.calm ? 'animation:' + curT[2] + (s.trickN % 2 ? '' : '2') + ' ' + curT[3] + 's cubic-bezier(.3,.7,.4,1) both' : ''),
      settingsOpen: s.settingsOpen, openSettings: () => this.setState({ settingsOpen: true, setMsg: '', resetArm: false }), closeSettings: () => this.setState({ settingsOpen: false }),
      calmOn: s.calm ? 'true' : 'false', calmTrack: cT.track, calmKnob: cT.knob, toggleCalm: () => this.setState({ calm: !s.calm }),
      soundOn: s.sound ? 'true' : 'false', soundTrack: sT.track, soundKnob: sT.knob, toggleSound: () => { this.ensureAudio(); const on = !s.sound; this.setState({ sound: on }); if (on) setTimeout(() => this.sfx('level'), 30); },
      testSound: () => { this.ensureAudio(); if (!s.sound) this.setState({ sound: true }); setTimeout(() => this.sfx('finish'), 30); },
      chatterOn: s.chatter ? 'true' : 'false', chatterTrack: chT.track, chatterKnob: chT.knob, toggleChatter: () => this.setState({ chatter: !s.chatter }),
      calOpts: [['morning', 'Morning'], ['midday', 'Midday'], ['evening', 'Evening']].map((o) => ({ t: o[1], pick: () => this.remindCal(o[0]), box: 'flex:1;height:44px;font:800 14px Inter Tight,sans-serif;border:3px solid #161616;background:#FFFFFF;color:#161616' })),
      restOpts: [10, 15, 30, 45].map((v) => ({ t: v + ' s', on: (s.rest || 15) === v ? 'true' : 'false', pick: () => this.setState({ rest: v }), box: 'flex:1;height:44px;font:800 14px Inter Tight,sans-serif;border:3px solid #161616;' + ((s.rest || 15) === v ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616') })),
      backup: () => this.backup(), restore: () => this.restore(),
      resetLabel: s.resetArm ? 'Tap again to erase everything' : 'Reset progress',
      resetBox: 'margin-top:10px;width:100%;height:46px;font:800 14px Inter Tight,sans-serif;border:3px solid #E5282E;' + (s.resetArm ? 'background:#E5282E;color:#FFFFFF' : 'background:#FFFFFF;color:#E5282E'),
      resetAll: () => {
        if (!s.resetArm) { this.setState({ resetArm: true }); clearTimeout(this.rt); this.rt = setTimeout(() => this.setState({ resetArm: false }), 4000); return; }
        const lv = {}; Object.keys(s.levels).forEach((k) => { lv[k] = 0; });
        this._pk = null; this.setState({ levels: lv, stones: {}, history: {}, log: {}, tried: {}, seen: {}, seenTricks: {}, fb: 0, resetArm: false, selDay: null, setMsg: 'All clear. Hi again!' });
      },
      setMsg: s.setMsg,
      noodleArt: (() => { const n = this.noodleSvg(s.sessions); const w = Math.round(104 * n.w / 230); return 'display:block;width:' + w + 'px;height:' + Math.round(w * 144 / n.w) + 'px;background:url("' + n.uri + '") center/contain no-repeat'; })(),
      growLine: (() => { const n = this.noodleSvg(s.sessions), next = this.outfits().find((o) => (s.sessions || 0) < o[0]); const pct = Math.round(n.L / 140 * 100); return (pct ? 'Noodle is ' + pct + '% longer than when you met. ' : 'Noodle grows a little every session. ') + (next ? 'Next: ' + next[2] + ' at ' + next[0] + ' sessions.' : 'Fully dressed. Iconic.'); })(),
      ch: (() => { const c = this.challenge(); return { t: c.t, label: c.bonus ? 'This week · bonus ' + c.bonus : 'This week', count: c.n + ' of ' + c.goal, done: c.done, todo: !c.done, hasFound: c.found.length > 0, more: c.done && c.more, allDone: c.done && !c.more,
        found: c.found.map((x) => ({ t: x, open: () => { if (c.moves) this.openMove(x, 'paths'); }, box: 'border:2px solid #161616;background:#FFFFFF;padding:2px 7px;font:700 11px Inter Tight,sans-serif;color:#161616' })),
        another: () => { this.sfx('pop'); this.setState({ chBonus: { w: c.wid, n: c.bonus + 1 } }); }, segs: Array.from({ length: c.goal }, (_, i) => ({ s: 'flex:1;height:8px;background:' + (i < c.n ? '#0B7A3E' : '#E4E4E4') })), go: () => this.transitionTo('session', '#1556C2', Object.assign({ swaps: {}, idx: 0, visited: true, focus: null }, c.mood ? { mood: c.mood } : {})) }; })(),
      chFace: this.face('smirk', 34), chFaceDone: this.face('grin', 34),
      shareSession: () => this.shareCard(),
      showWelcome: !(s.safe && s.safe.done),
      showProfile: !!(s.safe && s.safe.done) && !(s.profile && s.profile.done),
      showGuide: !!(s.safe && s.safe.done) && !!(s.profile && s.profile.done) && !s.guideDone,
      likeChips: this.likesMap().map((r) => { const on = !!(s.profile.likes || {})[r[0]]; return { t: r[1], on: on ? 'true' : 'false', shape: this.shp(r[4], on ? '#FFFFFF' : r[5], 16), pick: () => { const likes = Object.assign({}, s.profile.likes); if (on) delete likes[r[0]]; else likes[r[0]] = true; this.setState({ profile: Object.assign({}, s.profile, { likes }) }); }, box: 'height:44px;padding:0 12px;display:flex;align-items:center;gap:8px;font:800 14px Inter Tight,sans-serif;border:3px solid #161616;' + (on ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616') }; }),
      activeOpts: [['Just starting', 'New to this, or back after a long break'], ['Sometimes', 'I move a few times a month'], ['Most weeks', 'I work out or play sports regularly'], ['A lot', 'Training is part of my life']].map((o, i) => { const on = s.profile.active === i; return { t: o[0], d: o[1], on: on ? 'true' : 'false', pick: () => this.setState({ profile: Object.assign({}, s.profile, { active: i }) }), box: 'width:100%;min-height:52px;padding:6px 12px;text-align:left;font-family:Inter Tight,sans-serif;border:3px solid #161616;display:flex;flex-direction:column;justify-content:center;' + (on ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616') }; }),
      profileReady: s.profile.active !== null && s.profile.active !== undefined,
      profileBtn: 'margin-top:16px;width:100%;height:58px;flex:none;border:0;font:900 20px Inter Tight,sans-serif;' + (s.profile.active !== null && s.profile.active !== undefined ? 'background:#1556C2;color:#FFFFFF' : 'background:#E4E4E4;color:#595959'),
      profileGo: () => { if (s.profile.active === null || s.profile.active === undefined) return; this.applyProfile(); },
      editProfile: () => this.setState({ profile: Object.assign({}, s.profile, { done: false }), settingsOpen: false }),
      profileSummary: (() => { const lk = this.likesMap().filter((r) => (s.profile.likes || {})[r[0]]).map((r) => r[1].toLowerCase()); return lk.length ? 'Into ' + lk.join(', ') : 'Anything goes'; })(),
      g0: (s.guideStep || 0) === 0, g1: s.guideStep === 1, g2: s.guideStep === 2,
      guideDots: [0, 1, 2].map((i) => ({ s: 'display:block;width:' + (i === (s.guideStep || 0) ? 22 : 8) + 'px;height:8px;border-radius:4px;transition:width .3s;background:' + (i === (s.guideStep || 0) ? '#161616' : '#D0D0D0') })),
      guideNext: () => { if ((s.guideStep || 0) >= 2) this.setState({ guideDone: true, guideStep: 0 }); else this.setState({ guideStep: (s.guideStep || 0) + 1 }); },
      guideNextLabel: (s.guideStep || 0) >= 2 ? "Let's go!" : 'Next',
      guideSkip: () => this.setState({ guideDone: true, guideStep: 0 }),
      replayGuide: () => this.setState({ guideDone: false, guideStep: 0, settingsOpen: false }),
      gEasy: this.face('smirk', 30), gRight: this.face('smile', 30), gHard: this.face('oof', 30), gGrin: this.face('grin', 40),
      safeAreas: ['wrists', 'shoulders', 'back', 'knees'].map((k) => { const on = !!(s.safe.areas || {})[k]; return { t: k.replace(/^./, (c) => c.toUpperCase()), on: on ? 'true' : 'false', pick: () => { const areas = Object.assign({}, s.safe.areas); if (on) delete areas[k]; else areas[k] = true; this._pk = null; this.setState({ safe: Object.assign({}, s.safe, { areas }) }); }, box: 'height:44px;padding:0 14px;font:800 14px Inter Tight,sans-serif;border:3px solid #161616;' + (on ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616') }; }),
      careYes: () => { this._pk = null; this.setState({ safe: Object.assign({}, s.safe, { care: true }) }); },
      careNo: () => { this._pk = null; this.setState({ safe: Object.assign({}, s.safe, { care: false }) }); },
      careYesBox: 'flex:1;height:48px;font:800 15px Inter Tight,sans-serif;border:3px solid #161616;' + (s.safe.care === true ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616'),
      careNoBox: 'flex:1;height:48px;font:800 15px Inter Tight,sans-serif;border:3px solid #161616;' + (s.safe.care === false ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616'),
      careNote: s.safe.care === true,
      startBox: 'margin-top:18px;width:100%;height:58px;border:0;font:900 20px Inter Tight,sans-serif;' + (s.safe.care !== null && s.safe.care !== undefined ? 'background:#1556C2;color:#FFFFFF' : 'background:#E4E4E4;color:#595959'),
      finishWelcome: () => { if (s.safe.care === null || s.safe.care === undefined) return; this.setState({ safe: Object.assign({}, s.safe, { done: true }), settingsOpen: false }); },
      openSafety: () => this.setState({ safe: Object.assign({}, s.safe, { done: false }) }),
      safetySummary: (() => { const ar = Object.keys(s.safe.areas || {}); const bits = []; if (ar.length) bits.push('Going easy on ' + ar.join(', ')); if (s.safe.care) bits.push('gentle mode on'); return bits.length ? bits.join(' · ') : 'Nothing to avoid'; })(),
      phraseLines: ph.map((l) => ({ t: l })),
      phEven: s.phrase % 2 === 0, phOdd: s.phrase % 2 === 1,
      phraseAria: ph.join(' ') + ' (tap for another)',
      nextPhrase: () => this.setState({ phrase: s.phrase + 1 }),
      phraseStyle: 'border:0;background:transparent;padding:0;text-align:left;cursor:pointer;color:#161616;font-family:Inter Tight,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:-.035em;line-height:.86;font-size:' + phSize + 'px',
      isCheckin: s.screen === 'checkin', isSession: s.screen === 'session', isPlayer: s.screen === 'player', isDone: s.screen === 'done',
      moods, time: s.time, energy: s.energy, energyLabel,
      sessMins: this.sessTime(),
      isMain: this.moment() === 'main', notMain: this.moment() !== 'main', moMorning: this.moment() === 'morning', moMidday: this.moment() === 'midday', moEvening: this.moment() === 'evening',
      tapSky: () => {
        clearTimeout(this.skt);
        const n = (s.skyPop || 0) + 1;
        if (s.skyOn) { this.setState({ skyOn: false, skyPop: n }); return; } // tap again to hide the face
        this.sfx(this.moment() === 'evening' ? 'pop' : 'bark');
        this.setState({ skyOn: true, skyPop: n });
        this.skt = setTimeout(() => this.setState({ skyOn: false }), 3000);
      },
      skyFace: (s.skyOn ? 'sky-on ' : '') + (s.skyPop ? (s.skyPop % 2 ? 'sp1' : 'sp2') : ''),
      bounceWord: () => { this.sfx('pop'); this.setState({ wordN: (s.wordN || 0) + 1 }); },
      wordAnim: s.wordN ? (s.wordN % 2 ? 'wb1' : 'wb2') : '',
      moTabs: [['morning', 'Morning', 'half', '#FFC20E'], ['midday', 'Midday', 'circle', '#F26A0F'], ['main', 'Main', 'square', '#E5282E'], ['evening', 'Evening', 'arch', '#1556C2']].map((t) => { const on = this.moment() === t[0]; return { t: t[1], on: on ? 'true' : 'false', shape: (t[0] === 'evening' ? 'display:block;width:11px;height:11px;border-radius:50%;box-shadow:inset 3px -2px 0 0 ' + (on ? t[3] : '#C8C8C8') : this.shp(t[2], on ? t[3] : '#C8C8C8', 11)), go: () => { if (!on) { this._pk = null; this.setState({ moment: t[0], swaps: {} }); } }, box: 'height:42px;border:0;background:transparent;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:800 10px Inter Tight,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:' + (on ? '#161616' : '#595959') }; }),
      moBar: 'position:absolute;bottom:-3px;height:3px;width:25%;background:#161616;transition:left .45s cubic-bezier(.22,.9,.28,1);left:' + (['morning', 'midday', 'main', 'evening'].indexOf(this.moment()) * 25) + '%',
      moCard: (() => {
        const M = { morning: ['Morning wake-up', 'Gentle joints, a little blood flow, one big stretch.', '#FFC20E', '#161616'], midday: ['Midday reset', 'Unstick from the desk. Neck, back, hips, legs.', '#F26A0F', '#161616'], evening: ['Evening wind-down', 'Slow stretches to wind down.', '#1556C2', '#FFFFFF'] }[this.moment()] || ['', '', '#FFFFFF', '#161616'];
        const fl = this.flat();
        return { tint: { morning: '#FFF8E2', midday: '#FFF0E6', evening: '#E9F0FC' }[this.moment()] || '#F4F4F4', title: M[0], line: this.sessTime() + ' min · ' + fl.length + ' moves', desc: M[1], moves: fl.slice(0, 4).map((m) => ({ n: m.n, shape: this.shp(this.fams()[m.fam].shape, this.fams()[m.fam].color, 9) })).concat(fl.length > 4 ? [{ n: '+' + (fl.length - 4) + ' more', shape: 'display:none' }] : []) };
      })(),
      onTime: (e) => this.setState({ time: Number(e.target.value) }),
      onEnergy: (e) => this.setState({ energy: Number(e.target.value) }),
      timeDot: 'display:block;border-radius:50%;background:' + tCol + ';transition:width .15s,height .15s,background .3s;width:' + dot + 'px;height:' + dot + 'px',
      timeTrack: track(tp, tCol),
      timeWrap: 'position:relative;height:44px;--th:' + tCol,
      energyWrap: 'position:relative;height:44px;--th:' + eCol,
      energyTri: 'display:block;clip-path:polygon(50% 0,100% 100%,0 100%);transition:width .15s,height .15s,background .3s;background:' + eCol + ';height:' + triH + 'px;width:' + Math.round(triH * 1.1) + 'px',
      energyTrack: track(ep, eCol),
      go: () => this.transitionTo('session', '#1556C2', { swaps: {}, visited: true, focus: null, tiny: false }),
      tinyGo: () => { this._pk = null; this.transitionTo('session', '#1556C2', { swaps: {}, visited: true, focus: null, tiny: true }); },
      petHome: () => { this.ensureAudio(); this.sfx('bark'); clearTimeout(this.pt); this.setState({ homePets: s.homePets + 1, petting: true }); this.pt = setTimeout(() => this.setState({ petting: false }), 1300); },
      petting: s.petting,
      petWiggle: 'display:block;transform-origin:50% 100%;' + (s.homePets ? 'animation:' + (s.homePets % 2 ? 'wiggleA' : 'wiggleB') + ' .7s cubic-bezier(.3,.7,.4,1) both' : ''),
      openEyes: 'transition:opacity .15s;opacity:' + (s.petting ? 0 : 1),
      happyEyes: 'transition:opacity .15s;opacity:' + (s.petting ? 1 : 0),
      blush: 'transition:opacity .2s;opacity:' + (s.petting ? 1 : 0),
      earL: 'transform-box:fill-box;transform-origin:50% 0;transition:transform .3s cubic-bezier(.3,1.6,.5,1);transform:rotate(' + (s.petting ? 18 : 0) + 'deg)',
      earR: 'transform-box:fill-box;transform-origin:50% 0;transition:transform .3s cubic-bezier(.3,1.6,.5,1);transform:rotate(' + (s.petting ? -18 : 0) + 'deg)',
      heartsBox: 'position:absolute;left:0;top:0;width:96px;height:0;pointer-events:none',
      checkinClass: (s.swipe && s.screen === 'checkin' ? s.swipe : 'a-screen') + (s.visited ? ' quick' : ''),
      pet: () => this.setState({ pets: s.pets + 1 }),
      petStyle: s.pets ? 'animation:' + (s.pets % 2 ? 'hop' : 'hopB') + ' .7s cubic-bezier(.3,.7,.4,1) both' : '',
      home: () => this.transitionTo('checkin', '#FFFFFF', { idx: 0 }),
      shuffle: () => this.setState({ seed: s.seed + 1, swaps: {} }),
      summary: (s.tiny ? 'Just 2 minutes' : this.moment() !== 'main' ? { morning: 'Morning wake-up', midday: 'Midday reset', evening: 'Evening wind-down' }[this.moment()] : s.focus ? pretty[s.focus] + ' focus' : s.mood === 'Chill' ? 'Chill day' : energyLabel + ' energy') + ' · ' + flat.length + ' moves' + (s.focus ? '' : ' · ' + (s.mood === 'Surprise' ? 'surprise' : s.mood.toLowerCase())),
      blocks,
      start: () => { this.ensureAudio(); this.sfx('start'); }, startGo: () => this.transitionTo('player', '#161616', { lvAtStart: this.lvSum(), triedAtStart: Object.assign({}, s.tried), idx: 0, remaining: per0, paused: false, resting: false, askFb: false, fbMsg: '' }),
      stage: 'position:relative;height:500px;flex:none;overflow:hidden;color:' + (s.resting ? '#161616' : cur.ink) + ';background:' + (s.resting ? '#EDEDED' : cur.color) + ';transition:background .5s,color .5s',
      blockLabel: 'margin:0;font-size:12px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;opacity:.85',
      cur, pEven: !s.resting && idx % 2 === 0, pOdd: !s.resting && idx % 2 === 1,
      isStretchPose: cur.pose === 'stretch', isWalkPose: cur.pose !== 'stretch',
      segs: flat.map((m, i) => ({ style: 'flex:1;height:6px;border-radius:3px;transition:background .3s;background:' + (i < idx ? cur.ink : i === idx ? cur.ink : 'rgba(127,127,127,.35)') + ';opacity:' + (i === idx ? 1 : i < idx ? .7 : 1) })),
      ring: 'stroke:' + (s.resting ? '#161616' : cur.color === '#F6A5A9' ? '#E5282E' : cur.color === '#FFC20E' ? '#F26A0F' : cur.color) + ';stroke-dasharray:' + C + ';stroke-dashoffset:' + (C * (1 - frac)) + ';transition:stroke-dashoffset 1s linear',
      clock: mm + ':' + (ss < 10 ? '0' : '') + ss,
      pauseText: s.paused ? 'Resume' : 'Pause',
      pauseLabel: s.paused ? 'Resume' : 'Pause',
      togglePause: () => this.setState({ paused: !s.paused }),
      next: () => this.skip(),
      prev: () => this.setState(s.resting ? { resting: false, askFb: false, remaining: per } : { idx: Math.max(0, idx - 1), remaining: this.secsAt(Math.max(0, idx - 1)) }),
      exitPlayer: () => { const done = flat.slice(0, s.idx + (s.resting ? 1 : 0)); this.logSession(done); this.transitionTo('session', '#1556C2', { idx: 0 }); },
      upNext: idx + 1 < flat.length ? flat[idx + 1].n : 'Finish!',
      resting: s.resting,
      confetti,
      doneSummary: s.time + ' min · ' + flat.length + ' moves',
      expanding: s.expanding,
      expandStyle: 'background:' + s.expandColor
    };
  }
}

bootNoodle(Component);
