/* Noodle mini-runtime: renders the design-component template with Preact. */
(function () {
  var h = preact.h, render = preact.render;
  var tpl = document.getElementById('tpl').content;
  var roots = Array.prototype.filter.call(tpl.childNodes, function (n) { return n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()); });

  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var cur;
    for (var i = scopes.length - 1; i >= 0; i--) { if (scopes[i] && parts[0] in scopes[i]) { cur = scopes[i][parts[0]]; break; } }
    for (var j = 1; j < parts.length && cur != null; j++) cur = cur[parts[j]];
    return cur;
  }
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/, ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  function evalStr(v, scopes) {
    var m = v.match(WHOLE);
    if (m) return lookup(m[1], scopes);
    if (v.indexOf('{{') < 0) return v;
    return v.replace(ANY, function (_, p) { var r = lookup(p, scopes); return r == null ? '' : r; });
  }
  function walk(node, scopes) {
    if (node.nodeType === 3) { var tx = node.textContent; return tx.indexOf('{{') >= 0 ? String(evalStr(tx, scopes) == null ? '' : evalStr(tx, scopes)) : tx; }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    if (tag === 'helmet') return null;
    if (tag === 'sc-if') {
      return evalStr(node.getAttribute('value') || '', scopes) ? kids(node, scopes) : null;
    }
    if (tag === 'sc-for') {
      var list = evalStr(node.getAttribute('list') || '', scopes) || [];
      var as = node.getAttribute('as') || 'item';
      var out = [];
      list.forEach(function (item, i) { var sc = {}; sc[as] = item; sc.$index = i; out.push.apply(out, kids(node, scopes.concat([sc]))); });
      return out;
    }
    var props = {};
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], name = at.name;
      if (name.indexOf('hint-') === 0) continue;
      var val = evalStr(at.value, scopes);
      if (name.indexOf('on') === 0) {
        if (typeof val !== 'function') continue;
        if (name === 'onchange' && tag === 'input') name = 'onInput';
        else name = 'on' + name.charAt(2).toUpperCase() + name.slice(3);
      }
      if (val === undefined || val === null) continue;
      props[name] = val;
    }
    return h.apply(null, [tag, props].concat(kids(node, scopes)));
  }
  function kids(node, scopes) {
    var out = [];
    node.childNodes.forEach(function (c) { var r = walk(c, scopes); if (Array.isArray(r)) out.push.apply(out, r); else if (r !== null && r !== '') out.push(r); });
    return out;
  }

  var comp, mounted = false, queued = false;
  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  DCLogic.prototype.setState = function (u) {
    var patch = typeof u === 'function' ? u(this.state, this.props) : u;
    this.state = Object.assign({}, this.state, patch);
    schedule();
  };
  DCLogic.prototype.forceUpdate = function () { schedule(); };
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(draw); }
  var stage = document.getElementById('stage');
  function draw() {
    queued = false;
    var vals = comp.renderVals();
    var tree = [];
    roots.forEach(function (n) { var r = walk(n, [vals]); if (Array.isArray(r)) tree.push.apply(tree, r); else if (r) tree.push(r); });
    render(h('div', { id: 'dc-root' }, tree), stage);
    if (!mounted) { mounted = true; if (comp.componentDidMount) comp.componentDidMount(); }
    else if (comp.componentDidUpdate) comp.componentDidUpdate();
    bleedSoon();
  }
  window.bootNoodle = function (Component) { comp = new Component({}); window.__noodle = comp; draw(); };

  var lastLand = null;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)';
  document.body.appendChild(probe);
  function bounceShapes() {
    if (document.body.querySelector('.calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var els = document.querySelectorAll('#dc-root [aria-hidden="true"]:not(button *):not(.expand):not(.confetti)');
    var i = 0;
    Array.prototype.forEach.call(els, function (el) {
      if (!el.animate || el.closest('[aria-hidden="true"]') !== el && el.parentElement.closest('[aria-hidden="true"]')) return;
      var big = el.getBoundingClientRect().width > 120;
      var dx = ((i * 37) % 50 - 25) * (big ? 0.5 : 1), up = big ? 24 : 46;
      var k = [
        { translate: '0 0', scale: '1' },
        { translate: (dx * 0.4) + 'px 6px', scale: '1.12 0.86', offset: 0.12 },
        { translate: dx + 'px -' + up + 'px', scale: '0.94 1.08', offset: 0.38 },
        { translate: (dx * 0.3) + 'px 4px', scale: '1.08 0.9', offset: 0.62 },
        { translate: (-dx * 0.2) + 'px -' + (up * 0.3) + 'px', scale: '1', offset: 0.8 },
        { translate: '0 0', scale: '1' }
      ];
      try { el.animate(k, { duration: 900, delay: (i % 7) * 60, easing: 'ease-out' }); } catch (e) {}
      i++;
    });
  }
  function fit() {
    var land = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('wide', land);
    if (lastLand !== null && land !== lastLand) setTimeout(bounceShapes, 60);
    lastLand = land;
    var W = land ? 844 : 390, H = land ? 390 : 844;
    var cs = getComputedStyle(probe), sl = parseFloat(cs.paddingLeft) || 0, sr = parseFloat(cs.paddingRight) || 0;
    var aw = window.innerWidth - sl - sr;
    var s = Math.min(aw / W, window.innerHeight / H);
    stage.style.width = W + 'px'; stage.style.height = H + 'px';
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = (sl + Math.max(0, (aw - W * s) / 2)) + 'px';
    stage.style.top = Math.max(0, (window.innerHeight - H * s) / 2) + 'px';
    var left = parseFloat(stage.style.left), top = parseFloat(stage.style.top);
    gap = { l: left / s, r: (window.innerWidth - left - W * s) / s, t: top / s, b: (window.innerHeight - top - H * s) / s };
    bleedSoon();
  }
  // Phones are not exactly the app's shape, so the scaled app leaves thin strips at the screen edges.
  // Colored shapes and bars that touch an edge of the app get pushed or stretched to the real screen edge.
  var gap = { l: 0, r: 0, t: 0, b: 0 }, bleedQ = false;
  function bleedSoon() { if (bleedQ) return; bleedQ = true; requestAnimationFrame(function () { bleedQ = false; bleed(); }); }
  function solid(c) { var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return false; var v = m[1].split(',').map(parseFloat); if (v.length > 3 && v[3] < 0.05) return false; return !(v[0] > 250 && v[1] > 250 && v[2] > 250); }
  function bleed() {
    var W = stage.offsetWidth, H = stage.offsetHeight, any = gap.l > 0.5 || gap.r > 0.5 || gap.t > 0.5 || gap.b > 0.5;
    var els = stage.querySelectorAll('#dc-root *');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.offsetParent === null || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      var x = 0, y = 0, n = el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      var w = el.offsetWidth, hh = el.offsetHeight;
      var L = x <= 1, R = x + w >= W - 1, T = y <= 1, B = y + hh >= H - 1;
      var key = any && (L || R || T || B) ? [L, R, T, B, gap.l, gap.r, gap.t, gap.b].join() : '';
      if (el._bk === key) continue;
      if (!key) { if (el._bk) { el.style.translate = ''; if (el._bs) el.style.boxShadow = ''; el._bs = false; } el._bk = ''; continue; }
      var cs = getComputedStyle(el), bg = cs.backgroundColor;
      if (!solid(bg) || w < 8 || hh < 8) { el._bk = key; continue; }
      if (L && R) {
        if (cs.boxShadow === 'none' || el._bs) { el.style.boxShadow = (-gap.l) + 'px 0 0 0 ' + bg + ',' + gap.r + 'px 0 0 0 ' + bg + (T ? ',0 ' + (-gap.t) + 'px 0 0 ' + bg : '') + (B ? ',0 ' + gap.b + 'px 0 0 ' + bg : ''); el._bs = true; }
      } else {
        el.style.translate = ((L ? -gap.l : R ? gap.r : 0) | 0) + 'px ' + ((T ? -gap.t : B ? gap.b : 0) | 0) + 'px';
      }
      el._bk = key;
    }
  }
  window.addEventListener('resize', fit);window.addEventListener('orientationchange', function(){setTimeout(fit,200);});
  fit();
})();
