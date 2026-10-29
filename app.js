
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { hint: '', seen: {}, levels: { push: 0, pull: 0, legs: 0, core: 0, balance: 0, dance: 0, strikes: 0, stretch: 0, mobility: 0, freezes: 0, splits: 0, crawls: 0, flow: 0 }, fb: 0, pathOpen: null, celebrate: false, moveOpen: null, moveFrom: 'session', query: '', tried: {}, history: {}, log: {}, safe: { done: false, areas: {}, care: null }, guideDone: false, guideStep: 0, sessions: 0, lvAtStart: 0, doneNote: '', doneFace: 'grin', rest: 15, seenTricks: {}, trickN: 0, trickName: '', selDay: null, bodySide: 'f', region: null, settingsOpen: false, resetArm: false, setMsg: '', collectHint: '', focus: null, triedAtStart: {}, calm: false, sound: true, chatter: true, resting: false, askFb: false, fbMsg: '', phrase: 0, visited: false, pets: 0, homePets: 0, petting: false, screen: 'checkin', time: 20, energy: 50, mood: 'Surprise', seed: 0, swaps: {}, idx: 0, remaining: 0, paused: false, expanding: false, expandColor: '#1556C2' };
  }
  componentDidMount() {
    this.timer = setInterval(() => this.tick(), 1000);
    try { const raw = localStorage.getItem('noodle-dev-v1'); if (raw) { const o = JSON.parse(raw); const keep = {}; ['levels', 'history', 'log', 'rest', 'seenTricks', 'safe', 'guideDone', 'sessions', 'tried', 'seen', 'fb', 'calm', 'sound', 'chatter', 'time', 'energy', 'mood'].forEach((k) => { if (o[k] !== undefined) keep[k] = o[k]; }); if (keep.history) keep.history = this.cleanHistory(keep.history); if (keep.levels) keep.levels = Object.assign({}, this.state.levels, keep.levels); this.setState(keep); } } catch (e) {}
  }
  componentDidUpdate() {
    const s = this.state;
    try { const o = {}; ['levels', 'history', 'log', 'rest', 'seenTricks', 'safe', 'guideDone', 'sessions', 'tried', 'seen', 'fb', 'calm', 'sound', 'chatter', 'time', 'energy', 'mood'].forEach((k) => { o[k] = s[k]; }); const str = JSON.stringify(o); if (str !== this._saved) { localStorage.setItem('noodle-dev-v1', str); this._saved = str; } } catch (e) {}
    const want = s.screen === 'player' && !s.paused;
    try {
      if (want && !this.lock && !this.locking && navigator.wakeLock) { this.locking = true; navigator.wakeLock.request('screen').then((l) => { this.lock = l; this.locking = false; l.addEventListener('release', () => { this.lock = null; }); }).catch(() => { this.locking = false; }); }
      if (!want && this.lock) { this.lock.release().catch(() => {}); this.lock = null; }
    } catch (e) {}
  }
  ensureAudio() { try { if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if (this.ac.state === 'suspended') this.ac.resume(); } catch (e) {} }
  tone(f, t, d, type, vol, f2) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  sfx(name) {
    if (!this.state.sound || !this.ac) return;
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
  safeOK(m) {
    const sf = this.state.safe || {}, ar = sf.areas || {}, mi = this.moveInfo()[m.n];
    if (!mi) return true;
    const an = mi.anim || 'stand', regs = mi.f.concat(mi.b);
    const WRIST = ['wallpush', 'incline', 'kneepush', 'pushup', 'decline', 'dip', 'pike', 'handstand', 'plank', 'sideplank', 'shouldertap', 'frogstand', 'mountain', 'burpee', 'sixstep', 'freeze', 'catcow', 'headstand', 'bear', 'crab', 'birddog', 'lsit'];
    const KNEE = ['pistol', 'bulgarian', 'lunge', 'nordic', 'cossack', 'skater', 'burpee', 'deepsquat', 'kneel', 'wallsit', 'pigeon', 'split', 'halfsplit'];
    const INVERT = ['handstand', 'headstand', 'freeze', 'frogstand'];
    if (ar.wrists && WRIST.indexOf(an) >= 0) return false;
    if (ar.shoulders && (INVERT.indexOf(an) >= 0 || (regs.indexOf('shoulders') >= 0 && mi.lvl >= 2))) return false;
    if (ar.back && (regs.indexOf('lowback') >= 0 || regs.indexOf('back') >= 0) && mi.lvl >= 2) return false;
    if (ar.knees && (KNEE.indexOf(an) >= 0 || (mi.fam === 'legs' && mi.lvl >= 2))) return false;
    if (sf.care && (INVERT.indexOf(an) >= 0 || mi.role === 'f' || mi.fam === 'freezes' || mi.lvl >= 3)) return false;
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
    const s = this.state, F = this.fams(), start = this.weekKey();
    const CH = [
      { id: 'new', t: 'Try 3 moves you have never done', goal: 3, mood: 'Surprise', count: (e) => e.nw.length },
      { id: 'dance', t: 'Sneak in 4 dance moves', goal: 4, mood: 'Dance', count: (e) => (e.f.dance || 0) + (e.f.freezes || 0) + (e.f.flow || 0) },
      { id: 'stretch', t: 'Give stretching some love: 5 stretches', goal: 5, mood: 'Stretch', count: (e) => (e.f.stretch || 0) + (e.f.splits || 0) },
      { id: 'mix', t: 'Move in 5 different families', goal: 5, mood: 'Surprise', distinct: true },
      { id: 'kick', t: 'Throw 4 strike moves', goal: 4, mood: 'Strikes', count: (e) => (e.f.strikes || 0) + (e.f.flow || 0) },
      { id: 'days', t: 'Move on 2 different days', goal: 2, mood: null, days: true }
    ];
    const wk = Math.floor(start.getTime() / 6048e5);
    const c = CH[((wk % CH.length) + CH.length) % CH.length];
    let n = 0; const fams = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const e = this.dayLog(this.dayKey(d)); if (!e) continue;
      if (c.days) n++; else if (c.distinct) Object.keys(e.f).forEach((k) => { if (F[k]) fams[k] = 1; }); else n += c.count(e);
    }
    if (c.distinct) n = Object.keys(fams).length;
    return Object.assign({}, c, { n: Math.min(n, c.goal), done: n >= c.goal });
  }
  shareCard() {
    const s = this.state, flat = this.flat(), art = this.noodleSvg(s.sessions);
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d');
    g.fillStyle = '#FFC20E'; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = '#1556C2'; g.beginPath(); g.arc(540, 1350, 380, Math.PI, 0); g.fill();
    g.fillStyle = '#E5282E'; g.beginPath(); g.arc(1010, 70, 150, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#161616'; g.font = '900 170px "Inter Tight", sans-serif'; g.fillText('NICE', 80, 330); g.fillText('WORK!', 80, 480);
    g.font = '800 44px "Inter Tight", sans-serif'; g.fillText(s.time + ' MIN  ·  ' + flat.length + ' MOVES', 86, 570);
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
  lvSum() { const L = this.state.levels; return Object.keys(L).reduce((x, k) => x + (L[k] || 0), 0); }
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
    ['levels', 'history', 'log', 'rest', 'seenTricks', 'safe', 'guideDone', 'sessions', 'tried', 'seen', 'fb', 'calm', 'sound', 'chatter', 'time', 'energy', 'mood'].forEach((k) => { o[k] = s[k]; });
    const name = 'noodle-backup-' + this.dayKey() + '.json';
    const blob = new Blob([JSON.stringify(o)], { type: 'application/json' });
    try { const file = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).then(() => this.setState({ setMsg: 'Backup saved.' })).catch(() => {}); return; } } catch (e) {}
    const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    this.setState({ setMsg: 'Backup saved to your downloads.' });
  }
  restore() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = () => {
      const f = i.files && i.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const o = JSON.parse(r.result); if (!o || o.app !== 'noodle') throw new Error('x');
          const keep = {}; ['levels', 'history', 'log', 'rest', 'seenTricks', 'safe', 'guideDone', 'sessions', 'tried', 'seen', 'fb', 'calm', 'sound', 'chatter', 'time', 'energy', 'mood'].forEach((k) => { if (o[k] !== undefined) keep[k] = o[k]; });
          if (keep.levels) keep.levels = Object.assign({}, this.state.levels, keep.levels);
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
      ['Woodchop', 'core', 2, 'v', '3 × 12 per side', 'woodchop', 'Hands clasped high on one side.', 'Chop down across your body and pivot the back foot.'],
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
      ['Towel pass-through', 'mobility', 1, 'v', '10', 'jointcircles', 'Hold a towel wide, arms straight.', 'Lift it over your head and behind you.', ['shoulders', 'chest'], ['shoulders']],
      ['Deep squat sit', 'mobility', 2, 'm', '1 min', 'deepsquat', 'Sink into your deepest squat, heels down.', 'Elbows push your knees out.', ['hips', 'legs'], ['glutes']],
      ["World's greatest stretch", 'mobility', 2, 'v', '3 per side', 'lowlunge', 'Long lunge, hand inside your front foot.', 'Rotate and reach the other arm up.', ['hips', 'legs', 'core'], ['hamstrings', 'back']],
      ['Spine waves', 'mobility', 2, 'v', '8 slow', 'wave', 'Roll down one vertebra at a time.', 'Roll back up from the bottom.', ['core'], ['back', 'lowback']],
      ['Wrist prep circuit', 'mobility', 2, 'v', '1 min', 'catcow', 'On all fours, rock gently over your hands.', 'Turn your fingers sideways, then back, and rock again.', ['arms'], ['arms']],
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
      ['Headstand freeze', 'freezes', 3, 'm', '5 tries, hold 3 s', 'headstand', 'From a tripod headstand, lift your legs.', 'Freeze them in a fun shape.'],
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
      ['3-minute flow round', 'flow', 4, 'm', '3 rounds of 3 min', 'bobweave', 'Footwork, punches, slips and kicks.', 'Keep moving the whole round.']
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
      chairfreeze: ['H30,58 N38,62 P56,72 E44,76 W34,89 K64,68 F70,89 e46,64 w50,70 k68,70 f74,89', 'H30,62 N37,66 P55,74 E44,78 W34,89 K62,58 F78,54 e45,66 w50,72 k66,60 f82,58', 2.6, null],
      squatjab: ['H48,42 N49,50 P40,70 E58,50 W66,44 K58,72 F50,89 e56,50 w60,42 k60,72 f54,89', 'H50,14 N50,23 P50,49 E62,22 W74,21 K48,69 F47,89 e54,32 w58,22 k52,69 f53,89', 1.1, null],
      godown: ['H50,14 N50,23 P50,49 E48,36 W47,48 K48,69 F47,89 e52,36 w53,48 k52,69 f53,89', 'H67,46 N59,51 P44,72 E61,64 W63,75 K64,73 F52,89 e62,63 w64,75 k64,71 f56,89', 2.4, null],
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
      headstand: ['H44,84 N45,76 P50,52 E36,80 W34,89 K40,64 F54,72 e38,80 w36,89 k42,64 f56,72', 'P50,48 K50,30 F51,12 k52,30 f53,12', 3],
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
    const B = this.bank();
    Object.keys(F).forEach((k) => { F[k].steps = [0, 1, 2, 3, 4].map((l) => { const m = B.find((x) => x.fam === k && x.lvl === l && x.role === 'm'); return m ? m.n : ''; }); });
    this._F = F;
    return F;
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
    Object.keys(F).forEach((k) => { if (F[k].hidden) { const p = F[k].parents; if ((levels[p[0]] || 0) >= 2 && (levels[p[1]] || 0) >= 2) U[k] = true; } });
    return U;
  }
  figure(name, calm) {
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
    const out = { dur: an[2] + 's', aria: 'Figure demonstrating ' + name, kt: '0;0.25;0.5;0.75;1', ks: '.45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1' };
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
    const key = JSON.stringify([s0.time, s0.energy, s0.mood, s0.seed, s0.swaps, s0.levels, s0.focus, s0.safe, new Date().getDate()]);
    if (this._pk === key) return this._pc;
    const target = s0.time * 60, extra = [0, 0, 0, 0];
    const order = s0.mood === 'Chill' ? [3, 2, 0] : [1, 2, 3, 1, 0];
    const count = (b) => b.reduce((x, y) => x + y.moves.length, 0);
    let out = this.planN(extra);
    for (let g = 0; g < 30 && this.planSecs(out) < target * 0.92; g++) {
      extra[order[g % order.length]]++;
      const nx = this.planN(extra);
      if (count(nx) > count(out)) out = nx;
      if (this.planSecs(out) > target * 1.08) break;
    }
    const tot = this.planSecs(out);
    if (tot < target * 0.92) { const f = Math.min(1.6, target / tot); out.forEach((b) => b.moves.forEach((m) => { m.secs = Math.round(m.secs * f / 5) * 5; })); }
    this._pk = key; this._pc = out;
    return out;
  }
  planN(extra) {
    const s = this.state, F = this.fams(), BK = this.bank(), U = this.unlocked(s.levels);
    const t = s.time;
    const n = (t <= 10 ? [1, 2, 1, 1] : t <= 20 ? [2, 3, 2, 2] : t <= 35 ? [2, 4, 2, 3] : [3, 5, 3, 3]).slice();
    if (s.energy < 34) { n[1] = Math.max(1, n[1] - 1); n[3] += 1; }
    if (s.energy >= 67) { n[1] += 1; }
    if (s.mood === 'Chill') { n[1] = 0; n[3] += 1; }
    extra.forEach((e, i) => { if (!(s.mood === 'Chill' && i === 1)) n[i] += e; });
    const lv = (k) => s.levels[k] || 0;
    const used = {};
    const MIx = this.moveInfo();
    const choose = (cands0, k) => {
      let cands = cands0;
      if (s.focus) { const fz = cands0.filter((m) => { const mi = MIx[m.n]; return mi && mi.f.concat(mi.b).indexOf(s.focus) >= 0 && !used[m.n]; }); if (fz.length) cands = fz; }
      const c = cands.filter((m) => !used[m.n] && this.safeOK(m));
      if (!c.length) return null;
      const m = c[(this.hash(k) + s.seed * 3 + (s.swaps[k] || 0)) % c.length];
      used[m.n] = true;
      return m;
    };
    const atLevel = (fam) => { const L = lv(fam); let c = BK.filter((m) => m.fam === fam && m.lvl === L); if (!c.length) c = BK.filter((m) => m.fam === fam && m.lvl <= L); return c; };
    const upTo = (fam) => BK.filter((m) => m.fam === fam && m.lvl <= lv(fam) + 1);
    const rot = ['push', 'pull', 'legs', 'core', 'balance'].concat(U.crawls ? ['crawls'] : []);
    const off = (s.seed + new Date().getDate()) % rot.length;
    const PLAY = {
      Dance: { name: 'Dance', fams: ['dance'].concat(U.freezes ? ['freezes'] : []), color: '#FFC20E', shape: 'quarter' },
      Strikes: { name: 'Strikes', fams: ['strikes'].concat(U.flow ? ['flow'] : []), color: '#161616', shape: 'tri' },
      Strength: { name: 'Extra strength', fams: rot.slice().reverse(), color: '#F26A0F', shape: 'square' },
      Stretch: { name: 'Extra stretch', fams: ['stretch'].concat(U.splits ? ['splits'] : []), color: '#F6A5A9', shape: 'arch', loose: true },
      Chill: { name: 'Easy mobility', fams: ['mobility'], color: '#0E8178', shape: 'pill', loose: true },
      Surprise: { name: 'Surprise', fams: ['dance', 'strikes'].concat(Object.keys(U)), color: '#1556C2', shape: 'half' }
    };
    const pl = PLAY[s.mood] || PLAY.Surprise;
    const blocks = [];
    const mk = (key, name, color, shape, picks) => blocks.push({ key, name, color, shape, moves: picks.filter(Boolean).map((m, i) => ({ id: key + i, n: m.n, rx: m.rx, block: name, fam: m.fam, color: F[m.fam].color, ink: F[m.fam].ink, pose: 'walk', secs: this.dur(m.rx), swapCount: s.swaps[key + i] || 0 })) });
    const warmPool = upTo('mobility').concat(BK.filter((m) => m.fam === 'cond' && m.role === 'w'));
    mk('warm', 'Warm up', '#0E8178', 'pill', Array.from({ length: n[0] }, (_, i) => choose(warmPool, 'warm' + i)));
    mk('strength', 'Strength', '#E5282E', 'circle', Array.from({ length: n[1] }, (_, i) => choose(atLevel(rot[(off + i) % rot.length]), 'strength' + i)));
    mk('play', pl.name, pl.color, pl.shape, Array.from({ length: n[2] }, (_, i) => { const fam = pl.fams[(s.seed + i) % pl.fams.length]; return choose(pl.loose ? upTo(fam) : atLevel(fam), 'play' + i); }));
    if (s.energy >= 67 && s.mood !== 'Chill') mk('finish', 'Finisher', '#C08A00', 'square', [choose(BK.filter((m) => m.fam === 'cond' && m.role === 'f'), 'finish0')]);
    const coolPool = upTo('stretch').concat(U.splits ? atLevel('splits') : []);
    mk('cool', 'Stretch & yoga', '#F6A5A9', 'arch', Array.from({ length: n[3] }, (_, i) => choose(coolPool, 'cool' + i)));
    return blocks.filter((b) => b.moves.length);
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
    const MS = { 1: "First session! I'm officially your dog now.", 3: 'Three sessions. I think this is a habit.', 5: "Five sessions. You're getting bendy.", 10: 'Ten sessions! Double digits, double wiggles.', 25: 'Twenty-five sessions. I am telling all the other dogs.', 50: 'Fifty sessions. Legend behavior.', 100: 'One hundred sessions. I need a bigger tail to wag.' };
    const DONE = ['That was a good wiggle.', 'My tail has not stopped.', 'You moved. That is the whole point.', 'Hydrate, human.', 'Same time never? Whenever works.', 'I would give you a treat but I ate it.', 'Your body says thanks. So do I.', 'Ten out of ten wiggles.'];
    let note = learned.length ? 'I learned a new trick: ' + learned[learned.length - 1][0] + '! Tap me on You to see it.' : MS[sessions] || (ups > 0 ? 'You leveled up ' + (ups === 1 ? 'once' : ups + ' times') + ' today. Look at you go.' : DONE[sessions % DONE.length]);
    const face = learned.length || MS[sessions] ? 'grin' : ups > 0 ? 'smirk' : 'smile';
    this.setState({ sessions, doneNote: note, doneFace: face });
    this.sfx('finish');
    this.transitionTo('done', '#FFC20E');
  }
  feedback(kind) {
    const s = this.state, f = this.flat();
    const m = f[s.idx]; const mi = m && this.moveInfo()[m.n];
    if (!mi) return;
    const levels = Object.assign({}, s.levels);
    const fam = this.fams()[mi.fam];
    let msg = 'Got it. Same level next time.';
    if (kind === 'easy' && levels[mi.fam] < 4) { levels[mi.fam] += 1; msg = 'Nice! ' + fam.name + ' moves up a step.'; }
    if (kind === 'hard' && levels[mi.fam] > 0) { levels[mi.fam] -= 1; msg = 'No worries, ' + fam.name + ' eases back a step.'; }
    if (kind === 'easy' && msg.indexOf('Nice') < 0) msg = 'You are at the top of ' + fam.name + '!';
    const was = this.unlocked(s.levels), now = this.unlocked(levels);
    if (Object.keys(now).some((k) => !was[k])) msg += ' A hidden path just unlocked!';
    if (msg.indexOf('Nice') === 0) this.sfx('level');
    this.setState({ levels, fb: s.fb + 1, askFb: false, fbMsg: msg });
  }
  openMove(name, from) { this.setState({ moveOpen: name, moveFrom: from }); this.transitionTo('move', '#FFFFFF'); }
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
    const phSize = Math.min(70, Math.floor(300 / (longest * 0.56)), ph.length > 3 ? 56 : 70);
    const tp = (s.time - 5) / 55 * 100;
    const ep = s.energy;
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
    const cur = flat[idx] || { n: '', rx: '', block: '', color: '#E5282E', ink: '#FFFFFF', pose: 'walk' };
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
    const toggleSt = (on, color) => ({
      track: 'width:52px;height:30px;padding:0;border:3px solid #161616;background:' + (on ? color : '#FFFFFF') + ';position:relative;transition:background .2s',
      knob: 'position:absolute;top:3px;left:' + (on ? 25 : 3) + 'px;width:18px;height:18px;background:#161616;transition:left .25s cubic-bezier(.3,1.6,.5,1)'
    });
    const U = this.unlocked(s.levels);
    const LAYOUT = [['push', 0, 0, 170, 150], ['pull', 170, 0, 100, 90], ['freezes', 270, 0, 80, 90], ['dance', 170, 90, 180, 60], ['legs', 0, 150, 110, 150], ['core', 110, 150, 130, 90], ['splits', 240, 150, 110, 90], ['crawls', 110, 240, 90, 60], ['strikes', 200, 240, 150, 60], ['stretch', 0, 300, 150, 170], ['balance', 150, 300, 110, 90], ['flow', 260, 300, 90, 90], ['mobility', 150, 390, 200, 80]];
    const cells = LAYOUT.map(([k, x, y, w, h]) => {
      const box = 'position:absolute;left:' + (x + 3) + 'px;top:' + (y + 3) + 'px;width:' + (w - 6) + 'px;height:' + (h - 6) + 'px;background:#FFFFFF;border:0;padding:0;overflow:hidden;text-align:left;cursor:pointer;font-family:Inter Tight,sans-serif';
      if (F[k].hidden && !U[k]) return { open: () => this.setState({ hint: 'Hidden path! Reach Intermediate in ' + F[F[k].parents[0]].name + ' and ' + F[F[k].parents[1]].name + ' to find out.' }), aria: 'Locked hidden path', box, fill: 'display:none', shape: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;color:#D6D6D6', name: '', label: 'display:none', lvl: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#D0D0D0', lvlName: '?' };
      const fm = F[k], lv = s.levels[k], full = lv >= 4;
      return {
        open: () => { const seen = Object.assign({}, s.seen); seen[k] = true; this.setState({ pathOpen: k, seen, hint: '' }); },
        aria: fm.name + ' path, ' + LVL[lv],
        box: box + (fm.hidden && !s.seen[k] ? ';animation:flipIn .7s cubic-bezier(.2,.9,.3,1.2) both' : ''),
        fill: 'position:absolute;left:0;right:0;bottom:0;height:' + ((lv + 1) * 20) + '%;background:' + fm.color + ';transition:height .7s cubic-bezier(.3,1.4,.5,1)',
        shape: 'position:absolute;left:9px;top:9px;' + this.shp(fm.shape, full ? fm.ink : fm.color, 18),
        name: fm.name,
        label: 'position:absolute;left:34px;right:6px;top:10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.1;color:' + (full ? fm.ink : '#161616'),
        lvl: 'position:absolute;left:9px;bottom:7px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + (((lv + 1) * 0.2 * h) >= 26 ? fm.ink : '#161616') + ';opacity:' + (h > 70 ? 1 : 0),
        lvlName: LVL[lv]
      };
    });
    const pk = s.pathOpen && F[s.pathOpen] ? s.pathOpen : 'push';
    const pf = F[pk], plv = s.levels[pk];
    const pdSteps = pf.steps.map((n, i) => ({
      n, here: i === plv,
      line: 'position:absolute;left:16px;top:' + (i === 0 ? 33 : 0) + 'px;bottom:' + (i === 4 ? 33 : 0) + 'px;width:4px;background:' + (i <= plv ? pf.color : '#E4E4E4'),
      dot: 'position:relative;flex:none;width:36px;height:36px;box-sizing:border-box;border-radius:50%;' + (i < plv ? 'background:' + pf.color : i === plv ? 'background:#FFFFFF;border:6px solid ' + pf.color : 'background:#FFFFFF;border:3px solid #E4E4E4'),
      text: 'font-size:17px;font-weight:' + (i === plv ? 900 : 600) + ';color:' + (i > plv ? '#8A8A8A' : '#161616')
    }));
    const mvName = s.moveOpen || 'Push-up';
    const mi = MI[mvName] || { fam: 'mobility', lvl: 0, role: 'v', cues: ['Move slowly and with control.', 'Breathe out on the effort.'], f: [], b: [] };
    const mf = F[mi.fam];
    const regionMap = (list, keys, color) => { const o = {}; keys.forEach((k) => { o[k] = list.indexOf(k) >= 0 ? color : '#E4E4E4'; }); return o; };
    const FK = ['shoulders', 'chest', 'arms', 'core', 'hips', 'legs'], BK = ['shoulders', 'arms', 'back', 'lowback', 'glutes', 'hamstrings'];
    const pretty = { shoulders: 'shoulders', chest: 'chest', arms: 'arms', core: 'core', hips: 'hips', legs: 'legs', back: 'upper back', lowback: 'lower back', glutes: 'glutes', hamstrings: 'hamstrings' };
    const works = []; mi.f.concat(mi.b).forEach((r) => { if (works.indexOf(pretty[r]) < 0) works.push(pretty[r]); });
    const fresh = Object.keys(U).filter((k) => !s.seen[k]);
    const mvFig = this.figure(mvName, s.calm);
    const mvSteps = F[mi.fam].steps;
    const mvEasier = mi.lvl > 0 ? mvSteps[mi.lvl - 1] : '';
    const mvHarder = mi.lvl < 4 ? (mi.role === 'm' ? mvSteps[mi.lvl + 1] : mvSteps[mi.lvl]) : '';
    const allMoves = Object.keys(MI);
    const q = s.query.trim().toLowerCase();
    const results = q ? allMoves.filter((n) => { const m = MI[n]; return n.toLowerCase().indexOf(q) >= 0 || F[m.fam].name.toLowerCase().indexOf(q) >= 0 || m.f.concat(m.b).some((r) => pretty[r].indexOf(q) >= 0); }).slice(0, 8) : [];
    const untried = allMoves.filter((n) => !s.tried[n]);
    const picks = [0, 1, 2].map((i) => untried[(s.seed * 3 + i * 7) % Math.max(1, untried.length)]).filter((n, i, a) => n && a.indexOf(n) === i);
    const now = new Date(), Y = now.getFullYear(), Mo = now.getMonth(), today = now.getDate();
    const firstDow = new Date(Y, Mo, 1).getDay(), dim = new Date(Y, Mo + 1, 0).getDate();
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dark = { '#161616': 1, '#1556C2': 1, '#E5282E': 1, '#0B7A3E': 1, '#6B3FA0': 1, '#0E8178': 1 };
    const selD = s.selDay || today;
    const calCells = [];
    for (let i = 0; i < firstDow; i++) calCells.push({ n: '', aria: 'empty', pick: () => {}, box: 'height:44px;border:0;padding:0;background:#161616', num: 'display:none' });
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
        num: 'position:absolute;left:4px;top:3px;font-size:9px;font-weight:800;color:' + (fs.length ? (dark[F[fs[0]].color] ? '#FFFFFF' : '#161616') : d > today ? '#B0B0B0' : '#595959')
      });
    }
    const sk = Y + '-' + (Mo + 1) + '-' + selD, se = this.dayLog(sk), selDate = new Date(Y, Mo, selD);
    const dayTitle = (selD === today ? 'Today · ' : '') + DAYN[selDate.getDay()] + ', ' + MONTHS[Mo].slice(0, 3) + ' ' + selD;
    let dayLine;
    if (se) dayLine = [se.m ? se.m + ' min' : '', se.mv.length ? se.mv.length + (se.mv.length === 1 ? ' move' : ' moves') : '', se.nw.length ? se.nw.length + ' new' : ''].filter(Boolean).join(' · ') || 'You moved.';
    else dayLine = selD > today ? "Hasn't happened yet." : selD === today ? 'Nothing yet today. Whenever you are ready.' : 'A rest day. Those count too.';
    const dayFams = se ? Object.keys(se.f).filter((k) => F[k]).sort((p, q) => se.f[q] - se.f[p]).map((k) => ({ name: F[k].name, shape: this.shp(F[k].shape, F[k].color, 12) })) : [];
    const dayMoves = se ? se.mv.slice(0, 12).map((n) => { const nw = se.nw.indexOf(n) >= 0; return { n: (nw ? '★ ' : '') + n, open: () => this.openMove(n, 'you'), box: 'border:0;padding:4px 8px;font:700 12px Inter Tight,sans-serif;cursor:pointer;' + (nw ? 'background:#FFC20E;color:#161616' : 'background:#F4F4F4;color:#161616') }; }) : [];
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
    const regionLine = !anyLog ? 'Your first session will light this up.' : rn === 0 ? 'No love here yet this week.' : rn <= 2 ? 'A little love this week (' + rn + (rn === 1 ? ' move' : ' moves') + ').' : rn <= 5 ? 'Nicely worked this week (' + rn + ' moves).' : 'Lots of love this week (' + rn + ' moves). Maybe let it rest.';
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
        moves: got.map((n) => ({ n, open: () => this.openMove(n, 'you'), box: 'border:0;padding:4px 8px;font:700 12px Inter Tight,sans-serif;background:#F4F4F4;color:#161616;cursor:pointer' }))
          .concat(ms.length > got.length ? [{ n: (ms.length - got.length) + ' still hiding', open: () => {}, box: 'border:2px dashed #D0D0D0;padding:2px 8px;font:700 12px Inter Tight,sans-serif;background:#FFFFFF;color:#8A8A8A' }] : [])
      };
    }).filter(Boolean);
    const lvSum = Object.keys(s.levels).reduce((x, k) => x + (s.levels[k] || 0), 0);
    const TR = this.tricks(), openT = TR.filter((t) => lvSum >= t[1]), nextT = TR.find((t) => lvSum < t[1]);
    const curT = TR.find((t) => t[0] === s.trickName);
    const tricks = TR.map((t) => {
      const on = lvSum >= t[1];
      return { t: on ? t[0] : '?', aria: on ? 'Trick: ' + t[0] : 'Locked trick', isNew: on && t[1] > 0 && !s.seenTricks[t[0]], go: () => (on ? this.doTrick(t[0]) : null),
        box: 'position:relative;height:26px;min-width:26px;padding:0 7px;border:0;font:800 11px Inter Tight,sans-serif;cursor:pointer;' + (on ? 'background:#161616;color:#FFFFFF' : 'background:#EFEFEF;color:#B0B0B0') };
    });
    const cT = toggleSt(s.calm, '#0E8178'), sT = toggleSt(s.sound, '#FFC20E'), chT = toggleSt(s.chatter, '#E5282E');
    const restLines = ['Sip some water!', 'Shake it out.', 'Breathe in... out.', 'You got this!', 'Roll your shoulders.', 'Wiggle your toes.', 'Nice one.', 'Unclench your jaw.', 'Long exhale...', 'Halfway-ish!'];
    const sessLines = ["Let's gooo!", 'Wiggle time!', 'Ready when you are!', 'Snoot boop for luck.', 'I stretched already.', 'This one looks fun.'];
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
      openEasier: () => this.setState({ moveOpen: mvEasier }),
      openHarder: () => this.setState({ moveOpen: mvHarder }),
      startAll: () => { this.ensureAudio(); this.sfx('start'); this.transitionTo('player', '#161616', { lvAtStart: this.lvSum(), triedAtStart: Object.assign({}, s.tried), idx: 0, remaining: per0, paused: false, resting: false, askFb: false, fbMsg: '' }); },
      rootClass: s.calm ? 'calm' : '',
      chatter: s.chatter,
      restLine: restLines[(s.idx + s.seed) % restLines.length],
      sessLine: sessLines[(s.seed + (s.sessions || 0)) % sessLines.length],
      petLine: petLines[(s.homePets || 0) % petLines.length],
      doneNote: s.doneNote || 'That was a good wiggle.', doneFaceSt: this.face(s.doneFace || 'grin', 44),
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
      pathsSub: s.fb < 3 ? 'Noodle is still learning your level. Tap Easy, Just right or Hard after moves and these fill in on their own.' : 'Your progress paints the picture. Tap a block to see its steps.',
      cells,
      nudgeText: s.hint ? s.hint : s.fb < 3 ? 'Not sure where you stand? No quiz needed. Just move and I will figure it out.' : 'Looking good! Tap a block to see what is next.',
      pathIsOpen: !!s.pathOpen,
      closePath: () => this.setState({ pathOpen: null, celebrate: false }),
      pd: { name: pf.name, lvlName: LVL[plv] + ' · step ' + (plv + 1) + ' of 5' },
      pdHead: 'position:relative;height:220px;flex:none;overflow:hidden;background:' + pf.color + ';color:' + pf.ink,
      pdBigShape: 'position:absolute;right:-30px;bottom:-30px;opacity:.25;' + this.shp(pf.shape, pf.ink, 170),
      pdSteps,
      celebrate: s.celebrate,
      pdNextLabel: plv < 4 ? 'Nailed it! Next step' : 'Mastered!',
      pdNext: () => { if (plv >= 4) return; const lv = Object.assign({}, s.levels); lv[pk] = plv + 1; clearTimeout(this.ct); this.setState({ levels: lv, celebrate: true }); this.ct = setTimeout(() => this.setState({ celebrate: false }), 1600); },
      pdEasier: () => { if (plv <= 0) return; const lv = Object.assign({}, s.levels); lv[pk] = plv - 1; this.setState({ levels: lv, celebrate: false }); },
      mvName, mvFam: { name: mf.name },
      mvStage: 'position:relative;height:340px;flex:none;overflow:hidden;background:' + mf.color + ';color:' + mf.ink,
      
      mvCues: mi.cues.map((c) => ({ t: c })),
      mvWorks: works.length ? works.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Whole body',
      mbf: regionMap(mi.f, FK, mf.color === '#161616' ? '#E5282E' : mf.color), mbb: regionMap(mi.b, BK, mf.color === '#161616' ? '#E5282E' : mf.color),
      mvFamShape: this.shp(mf.shape, mf.color, 22),
      mvOpenPath: go('paths', '#161616', { pathOpen: mi.fam }),
      closeMove: go(s.moveFrom, s.moveFrom === 'session' ? '#1556C2' : '#FFFFFF'),
      query: s.query, onQuery: (e) => this.setState({ query: e.target.value }),
      hasQuery: !!q, noQuery: !q,
      resultCount: results.length ? results.length + (results.length === 1 ? ' match' : ' matches') : 'No matches yet. Try hips, push or kick.',
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
      calCells, dayTitle, dayLine, dayFams, dayMoves,
      savePoster: () => this.savePoster(),
      bodyFlip: 'position:relative;width:120px;height:236px;animation:' + (side === 'f' ? 'flipA' : 'flipB') + ' .45s cubic-bezier(.2,.9,.3,1.1) both',
      bodyParts, flipBody: () => this.setState({ bodySide: side === 'f' ? 'b' : 'f', region: null }),
      flipLabel: side === 'f' ? 'Flip to back' : 'Flip to front', sideName: side === 'f' ? 'Front' : 'Back',
      regionName: pretty[region].replace(/^./, (c) => c.toUpperCase()), regionLine,
      regionGoLabel: 'Give your ' + pretty[region] + ' some love · 15 min',
      regionGo: go('session', '#1556C2', { focus: region, mood: 'Surprise', time: 15, energy: 50, swaps: {}, idx: 0, visited: true }),
      collection, collFams, foundCount: foundN + ' of ' + collection.length,
      foundBar: 'display:block;height:100%;background:#161616;width:' + Math.round(foundN / Math.max(1, collection.length) * 100) + '%',
      collectHint: 'Every move you try fills in a bar. Tap a family to see what you found.',
      tricks, trickCount: openT.length + ' of ' + TR.length,
      trickLine: !(s.sessions || Object.keys(s.log || {}).length) ? "Do your first session and I'll start learning tricks." : nextT ? 'Tap Noodle! Level up ' + (nextT[1] - lvSum) + ' more ' + (nextT[1] - lvSum === 1 ? 'time' : 'times') + ' to teach ' + nextT[0].toLowerCase() + '.' : 'Noodle knows every trick. Show-off.',
      doTrick: () => this.doTrick(),
      trickAnim: 'display:block;transform-origin:' + ((curT && curT[4]) || '50% 90%') + ';' + (curT && !s.calm ? 'animation:' + curT[2] + (s.trickN % 2 ? '' : '2') + ' ' + curT[3] + 's cubic-bezier(.3,.7,.4,1) both' : ''),
      settingsOpen: s.settingsOpen, openSettings: () => this.setState({ settingsOpen: true, setMsg: '', resetArm: false }), closeSettings: () => this.setState({ settingsOpen: false }),
      calmOn: s.calm ? 'true' : 'false', calmTrack: cT.track, calmKnob: cT.knob, toggleCalm: () => this.setState({ calm: !s.calm }),
      soundOn: s.sound ? 'true' : 'false', soundTrack: sT.track, soundKnob: sT.knob, toggleSound: () => { this.ensureAudio(); this.setState({ sound: !s.sound }); },
      chatterOn: s.chatter ? 'true' : 'false', chatterTrack: chT.track, chatterKnob: chT.knob, toggleChatter: () => this.setState({ chatter: !s.chatter }),
      restOpts: [10, 15, 30, 45].map((v) => ({ t: v + ' s', on: (s.rest || 15) === v ? 'true' : 'false', pick: () => this.setState({ rest: v }), box: 'flex:1;height:44px;font:800 14px Inter Tight,sans-serif;border:3px solid #161616;' + ((s.rest || 15) === v ? 'background:#161616;color:#FFFFFF' : 'background:#FFFFFF;color:#161616') })),
      backup: () => this.backup(), restore: () => this.restore(),
      resetLabel: s.resetArm ? 'Tap again to erase everything' : 'Reset progress',
      resetBox: 'margin-top:10px;width:100%;height:46px;font:800 14px Inter Tight,sans-serif;border:3px solid #E5282E;' + (s.resetArm ? 'background:#E5282E;color:#FFFFFF' : 'background:#FFFFFF;color:#E5282E'),
      resetAll: () => {
        if (!s.resetArm) { this.setState({ resetArm: true }); clearTimeout(this.rt); this.rt = setTimeout(() => this.setState({ resetArm: false }), 4000); return; }
        const lv = {}; Object.keys(s.levels).forEach((k) => { lv[k] = 0; });
        this._pk = null; this.setState({ levels: lv, history: {}, log: {}, tried: {}, seen: {}, seenTricks: {}, fb: 0, resetArm: false, selDay: null, setMsg: 'Fresh start. Noodle is ready when you are.' });
      },
      setMsg: s.setMsg,
      noodleArt: (() => { const n = this.noodleSvg(s.sessions); const w = Math.round(104 * n.w / 230); return 'display:block;width:' + w + 'px;height:' + Math.round(w * 144 / n.w) + 'px;background:url("' + n.uri + '") center/contain no-repeat'; })(),
      growLine: (() => { const n = this.noodleSvg(s.sessions), next = this.outfits().find((o) => (s.sessions || 0) < o[0]); const pct = Math.round(n.L / 140 * 100); return (pct ? 'Noodle is ' + pct + '% longer than when you met. ' : 'Noodle grows a little every session. ') + (next ? 'Next: ' + next[2] + ' at ' + next[0] + ' sessions.' : 'Fully dressed. Iconic.'); })(),
      ch: (() => { const c = this.challenge(); return { t: c.t, count: c.n + ' of ' + c.goal, done: c.done, todo: !c.done, segs: Array.from({ length: c.goal }, (_, i) => ({ s: 'flex:1;height:8px;background:' + (i < c.n ? '#0B7A3E' : '#E4E4E4') })), go: () => this.transitionTo('session', '#1556C2', Object.assign({ swaps: {}, idx: 0, visited: true, focus: null }, c.mood ? { mood: c.mood } : {})) }; })(),
      chFace: this.face('smirk', 34), chFaceDone: this.face('grin', 34),
      shareSession: () => this.shareCard(),
      showWelcome: !(s.safe && s.safe.done),
      showGuide: !!(s.safe && s.safe.done) && !s.guideDone,
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
      startBox: 'margin-top:18px;width:100%;height:58px;border:0;font:900 20px Inter Tight,sans-serif;' + (s.safe.care !== null && s.safe.care !== undefined ? 'background:#1556C2;color:#FFFFFF' : 'background:#E4E4E4;color:#8A8A8A'),
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
      onTime: (e) => this.setState({ time: Number(e.target.value) }),
      onEnergy: (e) => this.setState({ energy: Number(e.target.value) }),
      timeDot: 'display:block;border-radius:50%;background:#E5282E;transition:width .15s,height .15s;width:' + dot + 'px;height:' + dot + 'px',
      timeTrack: track(tp, '#E5282E'),
      energyTri: 'display:block;clip-path:polygon(50% 0,100% 100%,0 100%);transition:width .15s,height .15s,background .3s;background:' + eCol + ';height:' + triH + 'px;width:' + Math.round(triH * 1.1) + 'px',
      energyTrack: track(ep, eCol),
      go: () => this.transitionTo('session', '#1556C2', { swaps: {}, visited: true, focus: null }),
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
      summary: (s.focus ? pretty[s.focus] + ' focus' : s.mood === 'Chill' ? 'Chill day' : energyLabel + ' energy') + ' · ' + flat.length + ' moves' + (s.focus ? '' : ' · ' + (s.mood === 'Surprise' ? 'surprise' : s.mood.toLowerCase())),
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
