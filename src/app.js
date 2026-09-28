// KomikGen editörü: durum, çizim, sürükle-bırak, özellikler paneli, dosya işlemleri
(function () {
  const C = window.Characters;
  const S = window.Scene;
  const esc = C.esc;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = (n) => Math.round(n * 10) / 10;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const native = window.native || {
    onMenu() {},
    setDirty() {},
    confirm: async (m) => window.confirm(m),
    saveProject: async () => null,
    openProject: async () => null,
    openImage: async () => null,
    exportFile: async () => null,
    copyImage: async () => false
  };

  const stage = $('#stage');
  const workspace = $('#workspace');
  const propsEl = $('#props');

  // ---------- Sabitler ----------
  const third = 1 / 3;
  const LAYOUTS = {
    1: { ad: 'Tek panel', r: [[0, 0, 1, 1]] },
    '2y': { ad: '2 yan yana', r: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
    '3y': { ad: '3 yan yana', r: [[0, 0, third, 1], [third, 0, third, 1], [2 * third, 0, third, 1]] },
    genis: { ad: 'Geniş + dar', r: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 1]] },
    '2d': { ad: '2 alt alta', r: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
    '3d': { ad: '3 alt alta', r: [[0, 0, 1, third], [0, third, 1, third], [0, 2 * third, 1, third]] },
    4: { ad: '2 × 2', r: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
    '1+2': { ad: '1 üstte, 2 altta', r: [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
    '2+1': { ad: '2 üstte, 1 altta', r: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]] },
    6: {
      ad: '3 × 2',
      r: [[0, 0, third, 0.5], [third, 0, third, 0.5], [2 * third, 0, third, 0.5], [0, 0.5, third, 0.5], [third, 0.5, third, 0.5], [2 * third, 0.5, third, 0.5]]
    }
  };
  const PAGE_SIZES = {
    serit: { ad: 'Yatay şerit (1500×560)', w: 1500, h: 560 },
    yatay: { ad: 'Yatay (1200×750)', w: 1200, h: 750 },
    kare: { ad: 'Kare (1000×1000)', w: 1000, h: 1000 },
    dikey: { ad: 'Dikey / A4 (900×1270)', w: 900, h: 1270 },
    insta: { ad: 'Instagram (1080×1350)', w: 1080, h: 1350 }
  };
  const BUBBLE_TEXT = {
    konusma: 'Merhaba!',
    kutu: 'Sana bir şey söyleyeceğim.',
    dusunce: 'Hmm...',
    bagirma: 'HAYIR!',
    fisilti: 'Psst... bir sır vereyim mi?',
    anlatici: 'O sırada...'
  };
  const EFFECT_PRESETS = [
    { text: 'POW!', shape: 'patlama', color: '#ffd23f', fill: '#e63946' },
    { text: 'BOOM!', shape: 'patlama', color: '#ffffff', fill: '#ff8c1a' },
    { text: 'VAY!', shape: 'bulut', color: '#ff6b6b', fill: '#fff3b0' },
    { text: 'BAM!', shape: 'patlama', color: '#e63946', fill: '#ffd23f' },
    { text: 'ZZZ...', shape: 'yok', color: '#5b7cfa', fill: '#ffffff' },
    { text: 'HAHAHA', shape: 'yok', color: '#ffd23f', fill: '#ffffff' }
  ];
  const HAIR_COLORS = ['#111111', '#2b2118', '#4a3526', '#6b3e26', '#b5452a', '#e0b12a', '#d6d6d6', '#7a4bc4'];
  const CLOTH_COLORS = ['#e85d75', '#ff8c42', '#ffd166', '#06d6a0', '#2a9d8f', '#118ab2', '#3d5a80', '#9b5de5', '#2c3e50', '#f1faee', '#6d4c41', '#e63946'];

  // ---------- Durum ----------
  let state;
  let selection = null; // {kind:'item', panelId, id} | {kind:'panel', panelId}
  let zoom = 1;
  let filePath = null;
  let dirty = false;
  let history = [];
  let hIndex = -1;
  let charTab = 'ifade';
  let drag = null;
  let renderQueued = false;

  function blankPanel(bg) {
    return { id: 'p' + uid(), bg: bg || { kind: 'duz', color: '#ffffff', color2: '#ffffff' }, items: [] };
  }

  function blankState() {
    return {
      page: { w: 1500, h: 560, layout: '3y', gutter: 18, border: 4, borderColor: '#1d1d1f', bg: '#ffffff', radius: 0 },
      panels: [blankPanel(), blankPanel(), blankPanel()]
    };
  }

  // ---------- Geometri ----------
  function panelRects(st = state) {
    const { w: W, h: H, gutter: g, layout } = st.page;
    const rects = (LAYOUTS[layout] || LAYOUTS['1']).r;
    return rects.map(([fx, fy, fw, fh]) => {
      let x0 = g + fx * (W - 2 * g);
      let x1 = g + (fx + fw) * (W - 2 * g);
      let y0 = g + fy * (H - 2 * g);
      let y1 = g + (fy + fh) * (H - 2 * g);
      if (fx > 0.001) x0 += g / 2;
      if (fx + fw < 0.999) x1 -= g / 2;
      if (fy > 0.001) y0 += g / 2;
      if (fy + fh < 0.999) y1 -= g / 2;
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    });
  }

  function panelIndex(panelId) {
    return state.panels.findIndex((p) => p.id === panelId);
  }
  function panelRect(panelId) {
    return panelRects()[panelIndex(panelId)];
  }
  function findItem(id) {
    for (const panel of state.panels) {
      const index = panel.items.findIndex((i) => i.id === id);
      if (index >= 0) return { panel, item: panel.items[index], index };
    }
    return null;
  }
  function selectedItem() {
    return selection && selection.kind === 'item' ? findItem(selection.id) : null;
  }
  function selectedPanel() {
    return selection ? state.panels.find((p) => p.id === selection.panelId) : null;
  }

  function itemBox(it) {
    if (it.type === 'character') return { x: it.x, y: it.y, w: 200 * it.scale, h: 400 * it.scale };
    if (it.type === 'bubble') return { x: it.x, y: it.y, w: it.w, h: S.bubbleGeom(it).h };
    return { x: it.x, y: it.y, w: it.w, h: it.h };
  }

  // ---------- Çizim ----------
  function itemSvg(it) {
    const b = itemBox(it);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    let inner = '';
    switch (it.type) {
      case 'character': {
        const mir = it.mirror ? ' translate(200,0) scale(-1,1)' : '';
        inner = `<g transform="translate(${r1(it.x)},${r1(it.y)}) scale(${it.scale})${mir}">${C.render(it.look, {
          emotion: it.emotion,
          pose: it.pose,
          legs: it.legs,
          gaze: it.gaze,
          boardText: it.boardText,
          mirror: it.mirror
        })}</g>`;
        break;
      }
      case 'bubble':
        inner = S.bubbleSvg(it).svg;
        break;
      case 'effect':
        inner = S.effectSvg(it);
        break;
      case 'object': {
        const o = S.OBJECTS[it.kind] || S.OBJECTS.kalp;
        const mir = it.mirror ? `transform="translate(${o.w},0) scale(-1,1)"` : '';
        inner = `<svg x="${r1(it.x)}" y="${r1(it.y)}" width="${r1(it.w)}" height="${r1(it.h)}" viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="none" overflow="visible"><g ${mir}>${o.svg}</g></svg>`;
        break;
      }
      case 'image': {
        const mir = it.mirror ? `transform="translate(${r1(2 * cx)},0) scale(-1,1)"` : '';
        inner = `<g ${mir}><image href="${it.href}" x="${r1(it.x)}" y="${r1(it.y)}" width="${r1(it.w)}" height="${r1(it.h)}" preserveAspectRatio="none"/></g>`;
        break;
      }
    }
    const rot = it.rotate ? ` transform="rotate(${it.rotate} ${r1(cx)} ${r1(cy)})"` : '';
    return `<g class="item" data-id="${it.id}"${rot}>${inner}</g>`;
  }

  function pageSvg(withOverlay) {
    const p = state.page;
    let s = `<rect width="${p.w}" height="${p.h}" fill="${p.bg}"/>`;
    panelRects().forEach((pr, i) => {
      const panel = state.panels[i];
      if (!panel) return;
      const rad = p.radius || 0;
      s += `<g data-panel="${panel.id}" transform="translate(${r1(pr.x)},${r1(pr.y)})">`;
      s += `<clipPath id="clip-${panel.id}"><rect width="${r1(pr.w)}" height="${r1(pr.h)}" rx="${rad}"/></clipPath>`;
      s += `<g clip-path="url(#clip-${panel.id})">${S.background(panel.bg, pr.w, pr.h, 'bg' + panel.id)}`;
      for (const it of panel.items) s += itemSvg(it);
      s += `</g>`;
      if (p.border > 0)
        s += `<rect x="${p.border / 2}" y="${p.border / 2}" width="${r1(pr.w - p.border)}" height="${r1(pr.h - p.border)}" rx="${Math.max(0, rad - p.border / 2)}" fill="none" stroke="${p.borderColor}" stroke-width="${p.border}" pointer-events="none"/>`;
      s += `</g>`;
    });
    if (withOverlay) s += overlaySvg();
    return s;
  }

  function overlaySvg() {
    if (!selection) return '';
    const pr = panelRect(selection.panelId);
    if (!pr) return '';
    const k = 1 / zoom;
    const blue = '#3d8bfd';
    if (selection.kind === 'panel') {
      return `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" fill="none" stroke="${blue}" stroke-width="${3 * k}" stroke-dasharray="${8 * k} ${5 * k}" pointer-events="none"/>`;
    }
    const found = findItem(selection.id);
    if (!found) return '';
    const it = found.item;
    const b = itemBox(it);
    const x = pr.x + b.x;
    const y = pr.y + b.y;
    const cx = x + b.w / 2;
    const cy = y + b.h / 2;
    const handle = (hx, hy, type, fill = '#fff') =>
      `<circle data-handle="${type}" cx="${hx}" cy="${hy}" r="${7 * k}" fill="${fill}" stroke="${blue}" stroke-width="${2 * k}"/>`;
    let s = '';
    if (it.type === 'bubble' && it.tailOn !== false && it.style !== 'anlatici' && it.tail) {
      const tx = pr.x + it.tail.x;
      const ty = pr.y + it.tail.y;
      s += `<path d="M${cx},${cy} L${tx},${ty}" stroke="#ffb703" stroke-width="${1.5 * k}" stroke-dasharray="${4 * k} ${4 * k}" pointer-events="none"/>`;
      s += handle(tx, ty, 'tail', '#ffb703');
    }
    s += `<g transform="rotate(${it.rotate || 0} ${cx} ${cy})">`;
    s += `<rect x="${x}" y="${y}" width="${b.w}" height="${b.h}" fill="none" stroke="${blue}" stroke-width="${1.5 * k}" stroke-dasharray="${6 * k} ${4 * k}" pointer-events="none"/>`;
    if (it.type !== 'bubble') {
      s += `<path d="M${cx},${y} L${cx},${y - 26 * k}" stroke="${blue}" stroke-width="${1.5 * k}" pointer-events="none"/>`;
      s += handle(cx, y - 26 * k, 'rotate');
    }
    s += handle(x + b.w, y + b.h, 'scale');
    s += `</g>`;
    return s;
  }

  function render() {
    const p = state.page;
    stage.setAttribute('viewBox', `0 0 ${p.w} ${p.h}`);
    stage.setAttribute('width', Math.round(p.w * zoom));
    stage.setAttribute('height', Math.round(p.h * zoom));
    stage.innerHTML = pageSvg(true);
    $('#zoomLabel').textContent = Math.round(zoom * 100) + '%';
  }
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      render();
    });
  }

  // ---------- Geçmiş ----------
  function commit() {
    const snap = JSON.stringify(state);
    if (history[hIndex] === snap) return;
    history = history.slice(0, hIndex + 1);
    history.push(snap);
    if (history.length > 150) history.shift();
    hIndex = history.length - 1;
    setDirty(true);
  }
  function resetHistory() {
    history = [JSON.stringify(state)];
    hIndex = 0;
  }
  function restore(i) {
    hIndex = i;
    state = JSON.parse(history[i]);
    if (selection && !selectedPanel()) selection = null;
    if (selection && selection.kind === 'item' && !findItem(selection.id)) selection = null;
    setDirty(true);
    render();
    renderProps();
  }
  function undo() {
    if (hIndex > 0) restore(hIndex - 1);
  }
  function redo() {
    if (hIndex < history.length - 1) restore(hIndex + 1);
  }

  function setDirty(v) {
    dirty = v;
    const name = filePath ? filePath.split(/[\\/]/).pop() : 'Adsız';
    const title = `${name}${dirty ? ' •' : ''} — KomikGen`;
    document.title = title;
    native.setDirty(dirty, title);
  }

  // ---------- Öğe ekleme ----------
  function targetPanel() {
    return selectedPanel() || state.panels[0];
  }
  function select(sel) {
    selection = sel;
    render();
    renderProps();
    updateStatus();
  }

  function newCharacter(look, name, pr, panel, extra = {}) {
    const scale = r1((pr.h * 0.72) / 400 * 100) / 100;
    const count = panel.items.filter((i) => i.type === 'character').length;
    const w = 200 * scale;
    const slots = [0.3, 0.7, 0.5, 0.15, 0.85];
    const cx = pr.w * slots[count % slots.length];
    return {
      id: 'i' + uid(),
      type: 'character',
      name,
      look: { ...look },
      emotion: 'gulumseme',
      pose: 'normal',
      legs: 'oto',
      gaze: 'oto',
      boardText: 'Merhaba!',
      scale,
      mirror: count % 2 === 1,
      rotate: 0,
      x: Math.round(cx - w / 2),
      y: Math.round(pr.h - 400 * scale - pr.h * 0.02),
      ...extra
    };
  }

  function addItem(panel, item) {
    panel.items.push(item);
    commit();
    select({ kind: 'item', panelId: panel.id, id: item.id });
  }

  function addCharacter(presetId) {
    const preset = C.PRESETS.find((p) => p.id === presetId) || C.PRESETS[0];
    const panel = targetPanel();
    const pr = panelRect(panel.id);
    const { id, ad, ...look } = preset;
    addItem(panel, newCharacter(look, ad, pr, panel));
  }

  function randomLook() {
    const hair = pick(Object.keys(C.HAIR_STYLES));
    const top = pick(Object.keys(C.TOPS));
    const long = ['uzun', 'kakul', 'topuz', 'atkuyrugu'].includes(hair) || top === 'elbise';
    return {
      skin: pick(C.SKINS),
      hair,
      hairColor: pick(HAIR_COLORS),
      top,
      topColor: pick(CLOTH_COLORS),
      bottomColor: pick(['#264653', '#3d5a80', '#22223b', '#2c3e50', '#6d4c41', '#e63946', '#118ab2']),
      shoeColor: pick(['#1b1b1b', '#f4f1de', '#e63946', '#3b2a20']),
      glasses: Math.random() < 0.25 ? pick(['yuvarlak', 'kare', 'gunes']) : 'yok',
      beard: !long && Math.random() < 0.3 ? pick(['biyik', 'sakal', 'kecisakal']) : 'yok',
      hat: Math.random() < 0.15 ? pick(['bere', 'kep', 'tac']) : 'yok',
      hatColor: pick(CLOTH_COLORS),
      lashes: long
    };
  }

  function addRandomCharacter() {
    const panel = targetPanel();
    const pr = panelRect(panel.id);
    const names = ['Umut', 'Ece', 'Berk', 'Defne', 'Emre', 'Nil', 'Kaan', 'Ada', 'Mert', 'Su'];
    addItem(
      panel,
      newCharacter(randomLook(), pick(names), pr, panel, {
        emotion: pick(Object.keys(C.EMOTIONS)),
        pose: pick(['normal', 'belde', 'selam', 'anlatma', 'bravo', 'omuz', 'kollar'])
      })
    );
  }

  function makeBubble(style, panel, pr, text) {
    const w = Math.round(clamp(pr.w * 0.46, 150, 340));
    const item = {
      id: 'i' + uid(),
      type: 'bubble',
      style,
      text: text || BUBBLE_TEXT[style] || '',
      fontSize: 20,
      bold: style === 'bagirma',
      upper: false,
      tailOn: style !== 'anlatici',
      fill: style === 'anlatici' ? '#fff3b0' : '#ffffff',
      textColor: '#1d1d1f',
      x: 0,
      y: 0,
      w,
      tail: null
    };
    const h = S.bubbleGeom(item).h;
    const bubblesBefore = panel.items.filter((i) => i.type === 'bubble').length;
    if (style === 'anlatici') {
      item.x = 14;
      item.y = 14 + bubblesBefore * 20;
      item.tail = { x: 60, y: h + 60 };
      return item;
    }
    // Konuşmacı: henüz balonu olmayan en son karakter, yoksa en son eklenen
    const chars = panel.items.filter((i) => i.type === 'character');
    const head = (c) => ({ x: c.x + 100 * c.scale, y: c.y + 30 * c.scale });
    const bubbles = panel.items.filter((i) => i.type === 'bubble');
    const hasBubble = (c) => bubbles.some((b) => b.tail && Math.hypot(b.tail.x - head(c).x, b.tail.y - head(c).y) < 140 * c.scale);
    const speaker = [...chars].reverse().find((c) => !hasBubble(c)) || chars[chars.length - 1];
    const anchorX = speaker ? head(speaker).x : pr.w / 2;

    // Mevcut balonlarla en az çakışan konumu seç
    const faces = chars.map((c) => ({ x: c.x + 40 * c.scale, y: c.y, w: 120 * c.scale, h: 150 * c.scale }));
    const boxes = [...bubbles.map(itemBox), ...faces];
    const overlap = (x, y) =>
      boxes.reduce((sum, b) => sum + Math.max(0, Math.min(x + w, b.x + b.w) - Math.max(x, b.x)) * Math.max(0, Math.min(y + h, b.y + b.h) - Math.max(y, b.y)), 0);
    const xs = [anchorX - w / 2, 10, pr.w - w - 10].map((x) => clamp(x, 10, Math.max(10, pr.w - w - 10)));
    const ys = [10, ...boxes.map((b) => b.y + b.h + 12)].map((y) => clamp(y, 10, Math.max(10, pr.h - h - 10)));
    let best = null;
    for (const y of ys)
      for (const x of xs) {
        const score = overlap(x, y) * 10 + Math.abs(x + w / 2 - anchorX) + y * 0.5;
        if (!best || score < best.score) best = { x, y, score };
      }
    item.x = Math.round(best.x);
    item.y = Math.round(best.y);
    if (speaker) {
      // Kuyruk ağza doğru uzanır ama yüzün üstüne binmeden durur
      const mx = speaker.x + 100 * speaker.scale;
      const my = speaker.y + 115 * speaker.scale;
      const bx = item.x + w / 2;
      const by = item.y + h / 2;
      const dist = Math.hypot(mx - bx, my - by) || 1;
      const len = Math.max(Math.min(w, h) / 2 + 25, dist - 60 * speaker.scale);
      item.tail = { x: Math.round(bx + ((mx - bx) / dist) * len), y: Math.round(by + ((my - by) / dist) * len) };
    } else {
      item.tail = { x: Math.round(item.x + w * 0.35), y: Math.round(item.y + h + 50) };
    }
    return item;
  }

  function addBubble(style) {
    const panel = targetPanel();
    addItem(panel, makeBubble(style, panel, panelRect(panel.id)));
  }

  function addEffect(i) {
    const panel = targetPanel();
    const pr = panelRect(panel.id);
    const e = EFFECT_PRESETS[i] || EFFECT_PRESETS[0];
    const w = Math.round(clamp(pr.w * 0.36, 120, 260));
    const h = Math.round(w * 0.7);
    addItem(panel, { id: 'i' + uid(), type: 'effect', ...e, x: Math.round((pr.w - w) / 2), y: Math.round(pr.h * 0.08), w, h, rotate: 0 });
  }

  function addObject(kind) {
    const panel = targetPanel();
    const pr = panelRect(panel.id);
    const o = S.OBJECTS[kind];
    const k = clamp((pr.h * 0.3) / o.h, 0.4, 2);
    const w = Math.round(o.w * k);
    const h = Math.round(o.h * k);
    const grounded = ['masa', 'sandalye', 'bitki', 'agac', 'kedi'].includes(kind);
    addItem(panel, {
      id: 'i' + uid(),
      type: 'object',
      kind,
      x: Math.round((pr.w - w) / 2),
      y: Math.round(grounded ? pr.h - h - pr.h * 0.03 : pr.h * 0.15),
      w,
      h,
      rotate: 0,
      mirror: false
    });
  }

  async function addImage() {
    const href = await native.openImage();
    if (!href) return;
    const img = new Image();
    img.src = href;
    await img.decode().catch(() => {});
    const panel = targetPanel();
    const pr = panelRect(panel.id);
    const iw = img.naturalWidth || 200;
    const ih = img.naturalHeight || 200;
    const k = Math.min((pr.w * 0.5) / iw, (pr.h * 0.5) / ih, 1);
    const w = Math.round(iw * k);
    const h = Math.round(ih * k);
    addItem(panel, { id: 'i' + uid(), type: 'image', href, x: Math.round((pr.w - w) / 2), y: Math.round((pr.h - h) / 2), w, h, rotate: 0, mirror: false });
  }

  // ---------- Seçili öğe işlemleri ----------
  function deleteSelected() {
    const f = selectedItem();
    if (!f) return;
    f.panel.items.splice(f.index, 1);
    commit();
    select({ kind: 'panel', panelId: f.panel.id });
  }
  function duplicateSelected() {
    const f = selectedItem();
    if (!f) return;
    const copy = JSON.parse(JSON.stringify(f.item));
    copy.id = 'i' + uid();
    copy.x += 24;
    copy.y += 24;
    if (copy.tail) copy.tail = { x: copy.tail.x + 24, y: copy.tail.y + 24 };
    f.panel.items.push(copy);
    commit();
    select({ kind: 'item', panelId: f.panel.id, id: copy.id });
  }
  function reorder(dir) {
    const f = selectedItem();
    if (!f) return;
    const items = f.panel.items;
    const to = dir > 0 ? items.length - 1 : 0;
    items.splice(f.index, 1);
    items.splice(to, 0, f.item);
    commit();
    render();
  }

  function setLayout(id) {
    const n = LAYOUTS[id].r.length;
    const removed = state.panels.slice(n);
    const apply = () => {
      state.page.layout = id;
      while (state.panels.length < n) state.panels.push(blankPanel());
      state.panels = state.panels.slice(0, n);
      if (selection && !selectedPanel()) selection = null;
      commit();
      render();
      renderProps();
    };
    if (removed.some((p) => p.items.length)) {
      native.confirm(`Bu düzende ${removed.length} panel kaldırılacak ve içindekiler silinecek. Devam edilsin mi?`).then((ok) => ok && apply());
    } else apply();
  }

  // ---------- Fare etkileşimi ----------
  function toPage(e) {
    const pt = stage.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(stage.getScreenCTM().inverse());
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = toPage(e);
    const handleEl = e.target.closest('[data-handle]');
    const itemEl = e.target.closest('.item');
    const panelEl = e.target.closest('[data-panel]');
    if (handleEl && selection && selection.kind === 'item') {
      startDrag(handleEl.dataset.handle, p, e);
      return;
    }
    if (itemEl && panelEl) {
      const id = itemEl.dataset.id;
      if (!selection || selection.id !== id) select({ kind: 'item', panelId: panelEl.dataset.panel, id });
      startDrag('move', p, e);
      return;
    }
    if (panelEl) select({ kind: 'panel', panelId: panelEl.dataset.panel });
    else select(null);
  });

  function startDrag(mode, p, e) {
    const f = selectedItem();
    if (!f) return;
    stage.setPointerCapture(e.pointerId);
    const pr = panelRect(f.panel.id);
    const box = itemBox(f.item);
    drag = { mode, start: p, pr, orig: JSON.parse(JSON.stringify(f.item)), box, moved: false };
  }

  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const f = selectedItem();
    if (!f) return;
    const it = f.item;
    const o = drag.orig;
    const p = toPage(e);
    const dx = p.x - drag.start.x;
    const dy = p.y - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) * zoom < 2) return;
    drag.moved = true;
    const lx = p.x - drag.pr.x;
    const ly = p.y - drag.pr.y;
    const b = drag.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    if (drag.mode === 'move') {
      it.x = Math.round(o.x + dx);
      it.y = Math.round(o.y + dy);
      if (e.shiftKey && o.tail) it.tail = { x: Math.round(o.tail.x + dx), y: Math.round(o.tail.y + dy) };
      else if (o.tail) it.tail = { ...o.tail };
    } else if (drag.mode === 'tail') {
      it.tail = { x: Math.round(lx), y: Math.round(ly) };
    } else if (drag.mode === 'rotate') {
      let a = (Math.atan2(ly - cy, lx - cx) * 180) / Math.PI + 90;
      if (a > 180) a -= 360;
      a = e.shiftKey ? Math.round(a / 15) * 15 : Math.round(a);
      it.rotate = a;
    } else if (drag.mode === 'scale') {
      let ratio;
      if (!o.rotate) {
        const rw = (lx - b.x) / b.w;
        const rh = (ly - b.y) / b.h;
        ratio = it.type === 'bubble' ? rw : Math.max(rw, rh);
        if (it.type === 'effect' && !e.shiftKey) {
          it.w = Math.max(30, Math.round(lx - b.x));
          it.h = Math.max(20, Math.round(ly - b.y));
          queueRender();
          return;
        }
      } else {
        const d0 = Math.hypot(b.x + b.w - cx, b.y + b.h - cy);
        ratio = Math.hypot(lx - cx, ly - cy) / d0;
      }
      ratio = Math.max(0.1, ratio);
      if (it.type === 'character') {
        it.scale = Math.round(clamp(o.scale * ratio, 0.1, 5) * 100) / 100;
      } else if (it.type === 'bubble') {
        it.w = Math.round(clamp(o.w * ratio, 60, 1400));
      } else {
        it.w = Math.max(10, Math.round(o.w * ratio));
        it.h = Math.max(10, Math.round(o.h * ratio));
      }
      if (o.rotate) {
        const nb = itemBox(it);
        it.x = Math.round(cx - nb.w / 2);
        it.y = Math.round(cy - nb.h / 2);
      }
    }
    queueRender();
  });

  stage.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const wasMoved = drag.moved;
    const mode = drag.mode;
    drag = null;
    stage.releasePointerCapture(e.pointerId);
    if (!wasMoved) return;
    if (mode === 'move') movePanelIfNeeded();
    commit();
    render();
    renderProps();
  });

  // Öğe başka bir panelin üstüne bırakılırsa o panele taşınır
  function movePanelIfNeeded() {
    const f = selectedItem();
    if (!f) return;
    const rects = panelRects();
    const from = panelIndex(f.panel.id);
    const b = itemBox(f.item);
    const px = rects[from].x + b.x + b.w / 2;
    const py = rects[from].y + b.y + b.h / 2;
    const to = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (to < 0 || to === from) return;
    const ox = rects[from].x - rects[to].x;
    const oy = rects[from].y - rects[to].y;
    const it = f.item;
    it.x = Math.round(it.x + ox);
    it.y = Math.round(it.y + oy);
    if (it.tail) it.tail = { x: Math.round(it.tail.x + ox), y: Math.round(it.tail.y + oy) };
    f.panel.items.splice(f.index, 1);
    state.panels[to].items.push(it);
    selection = { kind: 'item', panelId: state.panels[to].id, id: it.id };
  }

  stage.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.item')) return;
    const input = $('#f-text');
    if (input) {
      input.focus();
      input.select();
    }
  });

  workspace.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    },
    { passive: false }
  );

  function setZoom(z) {
    zoom = clamp(z, 0.1, 4);
    render();
  }
  function zoomFit() {
    const ww = workspace.clientWidth - 80;
    const wh = workspace.clientHeight - 80;
    setZoom(Math.min(ww / state.page.w, wh / state.page.h));
  }

  // ---------- Klavye ----------
  window.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === 'Escape') {
      if (typing) document.activeElement.blur();
      else select(null);
      return;
    }
    if (typing) return;
    const f = selectedItem();
    if ((e.key === 'Delete' || e.key === 'Backspace') && f) {
      e.preventDefault();
      deleteSelected();
    } else if (f && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      f.item.x += d[0];
      f.item.y += d[1];
      render();
      clearTimeout(keyCommitTimer);
      keyCommitTimer = setTimeout(commit, 400);
    }
  });
  let keyCommitTimer;

  // ---------- Özellikler paneli ----------
  const F = {
    range: (bind, label, min, max, step, val, unit = '') =>
      `<div class="field"><label>${label}<span class="val" data-unit="${unit}">${val}${unit}</span></label><input type="range" data-bind="${bind}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`,
    color: (bind, label, val) => `<div class="field"><label>${label}</label><input type="color" data-bind="${bind}" value="${val}"></div>`,
    select: (bind, label, options, val, rerender) =>
      `<div class="field"><label>${label}</label><select data-bind="${bind}"${rerender ? ' data-rerender' : ''}>${Object.entries(options)
        .map(([k, v]) => `<option value="${k}"${k === val ? ' selected' : ''}>${esc(v)}</option>`)
        .join('')}</select></div>`,
    check: (bind, label, val, rerender) =>
      `<label class="check"><input type="checkbox" data-bind="${bind}"${val ? ' checked' : ''}${rerender ? ' data-rerender' : ''}> ${label}</label>`,
    text: (bind, label, val, id) => `<div class="field"><label>${label}</label><input type="text" data-bind="${bind}" value="${esc(val)}"${id ? ` id="${id}"` : ''}></div>`,
    textarea: (bind, label, val, id) =>
      `<div class="field"><label>${label}</label><textarea data-bind="${bind}"${id ? ` id="${id}"` : ''} spellcheck="false">${esc(val)}</textarea></div>`,
    swatches: (act, colors, val) =>
      `<div class="swatches">${colors.map((c) => `<button class="swatch${c === val ? ' active' : ''}" style="background:${c}" data-act="${act}" data-val="${c}" title="${c}"></button>`).join('')}</div>`
  };

  const svgThumb = (viewBox, content) => `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

  function actionsHtml() {
    return `<div class="actions">
      <button data-cmd="duplicate">Çoğalt</button>
      <button data-cmd="delete" class="danger">Sil</button>
      <button data-cmd="front">Öne getir</button>
      <button data-cmd="back">Arkaya gönder</button>
    </div>`;
  }

  function renderProps() {
    const f = selectedItem();
    let h = '';
    if (!selection) h = pageProps();
    else if (selection.kind === 'panel') h = panelProps(selectedPanel());
    else if (f) {
      const it = f.item;
      if (it.type === 'character') h = characterProps(it);
      else if (it.type === 'bubble') h = bubbleProps(it);
      else if (it.type === 'effect') h = effectProps(it);
      else h = objectProps(it);
    }
    propsEl.innerHTML = h;
  }

  function pageProps() {
    const p = state.page;
    const sizeKey = Object.keys(PAGE_SIZES).find((k) => PAGE_SIZES[k].w === p.w && PAGE_SIZES[k].h === p.h) || 'ozel';
    const sizes = Object.fromEntries(Object.entries(PAGE_SIZES).map(([k, v]) => [k, v.ad]));
    sizes.ozel = 'Özel boyut';
    let layouts = '';
    for (const [k, l] of Object.entries(LAYOUTS)) {
      const rects = l.r.map(([x, y, w, hh]) => `<rect x="${x * 160 + 4}" y="${y * 100 + 4}" width="${w * 160 - 8}" height="${hh * 100 - 8}" fill="#fff" stroke="#1d1d1f" stroke-width="3"/>`).join('');
      layouts += `<div class="tile${p.layout === k ? ' active' : ''}" data-act="layout" data-val="${k}">${svgThumb('0 0 160 100', `<rect width="160" height="100" fill="#ddd"/>${rects}`)}${l.ad}</div>`;
    }
    return `<div class="props-title"><h3>Sayfa</h3><span class="chip">${p.w} × ${p.h}</span></div>
      <p class="hint">Bir panele tıklayarak arka planını değiştirebilirsin.</p>
      <h4>Panel düzeni</h4><div class="grid layouts">${layouts}</div>
      <h4>Boyut</h4>
      <div class="field"><select data-act="pageSize">${Object.entries(sizes).map(([k, v]) => `<option value="${k}"${k === sizeKey ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="row">
        <div class="field"><label>Genişlik</label><input type="number" min="200" max="5000" data-bind="page.w" value="${p.w}"></div>
        <div class="field"><label>Yükseklik</label><input type="number" min="200" max="5000" data-bind="page.h" value="${p.h}"></div>
      </div>
      <h4>Görünüm</h4>
      ${F.range('page.gutter', 'Panel aralığı', 0, 80, 1, p.gutter, ' px')}
      ${F.range('page.border', 'Çerçeve kalınlığı', 0, 16, 1, p.border, ' px')}
      ${F.range('page.radius', 'Köşe yuvarlaklığı', 0, 60, 1, p.radius, ' px')}
      <div class="row">${F.color('page.borderColor', 'Çerçeve rengi', p.borderColor)}${F.color('page.bg', 'Sayfa rengi', p.bg)}</div>`;
  }

  function panelProps(panel) {
    const bg = panel.bg;
    let tiles = '';
    for (const [k, name] of Object.entries(S.BACKGROUNDS)) {
      const cols = S.BG_DEFAULT_COLORS[k] || [];
      const sample = { kind: k, color: bg.kind === k ? bg.color : cols[0], color2: bg.kind === k ? bg.color2 : cols[1], image: bg.kind === k ? bg.image : null };
      tiles += `<div class="tile${bg.kind === k ? ' active' : ''}" data-act="bgkind" data-val="${k}">${svgThumb('0 0 160 100', S.background(sample, 160, 100, 'th' + k))}${name}</div>`;
    }
    const twoColor = ['degrade', 'patlama', 'hiz', 'noktali', 'oda'].includes(bg.kind);
    const oneColor = bg.kind === 'duz';
    const idx = panelIndex(panel.id) + 1;
    return `<div class="props-title"><h3>Panel ${idx}</h3><span class="chip">${panel.items.length} öğe</span></div>
      <p class="hint">Soldan karakter, balon veya nesne ekle; bu panele yerleşir.</p>
      <h4>Arka plan</h4><div class="grid bgs">${tiles}</div>
      ${oneColor ? `<div style="margin-top:10px">${F.color('bg.color', 'Renk', bg.color)}</div>` : ''}
      ${twoColor ? `<div class="row" style="margin-top:10px">${F.color('bg.color', 'Renk 1', bg.color)}${F.color('bg.color2', 'Renk 2', bg.color2)}</div>` : ''}
      ${bg.kind === 'resim' ? `<button class="wide" data-act="pickBgImage">Resim seç…</button>` : ''}
      <div class="actions"><button data-act="clearPanel" class="danger" style="grid-column:span 2">Paneli temizle</button></div>`;
  }

  function characterProps(it) {
    const tabs = { ifade: 'İfade', poz: 'Poz', gorunum: 'Görünüm', ayar: 'Ayarlar' };
    let h = `<div class="props-title"><h3>${esc(it.name || 'Karakter')}</h3><span class="chip">Karakter</span></div>`;
    h += `<div class="subtabs">${Object.entries(tabs).map(([k, v]) => `<button data-act="subtab" data-val="${k}" class="${charTab === k ? 'active' : ''}">${v}</button>`).join('')}</div>`;
    if (charTab === 'ifade') {
      h += `<div class="grid faces">`;
      for (const [k, e] of Object.entries(C.EMOTIONS)) {
        h += `<div class="tile${it.emotion === k ? ' active' : ''}" data-act="emotion" data-val="${k}" title="${e.ad}">${svgThumb('36 6 128 146', C.render(it.look, { emotion: k, pose: 'normal', gaze: it.gaze }))}${e.ad}</div>`;
      }
      h += `</div><div style="margin-top:10px">${F.select('item.gaze', 'Bakış yönü', C.GAZES, it.gaze)}</div>`;
    } else if (charTab === 'poz') {
      h += `<div class="grid poses">`;
      for (const [k, p] of Object.entries(C.POSES)) {
        h += `<div class="tile${it.pose === k ? ' active' : ''}" data-act="pose" data-val="${k}" title="${p.ad}">${svgThumb('-22 4 244 406', C.render(it.look, { emotion: it.emotion, pose: k, boardText: '' }))}${p.ad}</div>`;
      }
      h += `</div><div style="margin-top:10px">${F.select('item.legs', 'Bacaklar', { oto: 'Poza göre', ...C.LEGS }, it.legs)}</div>`;
      if (it.pose === 'pano') h += F.textarea('item.boardText', 'Pano yazısı', it.boardText || '', 'f-text');
    } else if (charTab === 'gorunum') {
      const l = it.look;
      const presets = Object.fromEntries([['', '— Hazır görünüm uygula —'], ...C.PRESETS.map((p) => [p.id, p.ad])]);
      h += `<div class="field"><select data-act="lookPreset">${Object.entries(presets).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>`;
      h += F.text('item.name', 'Ad', it.name || '');
      h += `<div class="field"><label>Ten rengi</label>${F.swatches('skin', C.SKINS, l.skin)}</div>`;
      h += `<div class="row">${F.select('item.look.hair', 'Saç modeli', C.HAIR_STYLES, l.hair)}${F.color('item.look.hairColor', 'Saç rengi', l.hairColor)}</div>`;
      h += `<div class="field">${F.swatches('hairColor', HAIR_COLORS, l.hairColor)}</div>`;
      h += `<div class="row">${F.select('item.look.top', 'Üst giyim', C.TOPS, l.top)}${F.color('item.look.topColor', 'Üst rengi', l.topColor)}</div>`;
      h += `<div class="row">${F.color('item.look.bottomColor', 'Pantolon', l.bottomColor)}${F.color('item.look.shoeColor', 'Ayakkabı', l.shoeColor)}</div>`;
      h += `<div class="row">${F.select('item.look.glasses', 'Gözlük', C.GLASSES, l.glasses)}${F.select('item.look.beard', 'Sakal', C.BEARDS, l.beard)}</div>`;
      h += `<div class="row">${F.select('item.look.hat', 'Şapka', C.HATS, l.hat)}${F.color('item.look.hatColor', 'Şapka rengi', l.hatColor)}</div>`;
      h += F.check('item.look.lashes', 'Kirpik', l.lashes);
      h += `<button class="wide" data-cmd="randomize">🎲 Rastgele görünüm</button>`;
    } else {
      h += F.range('item.scale', 'Boyut', 0.2, 3, 0.01, it.scale, '×');
      h += F.range('item.rotate', 'Döndür', -180, 180, 1, it.rotate || 0, '°');
      h += F.check('item.mirror', 'Aynala (ters çevir)', it.mirror);
      h += `<p class="hint">İpucu: Köşedeki mavi tutamaçla boyutlandır, üstteki tutamaçla döndür.</p>`;
    }
    return h + actionsHtml();
  }

  function bubbleProps(it) {
    return `<div class="props-title"><h3>Balon</h3><span class="chip">${S.BUBBLES[it.style]}</span></div>
      ${F.textarea('item.text', 'Metin', it.text, 'f-text')}
      ${F.select('item.style', 'Balon tipi', S.BUBBLES, it.style, true)}
      ${F.range('item.fontSize', 'Yazı boyutu', 10, 64, 1, it.fontSize, ' px')}
      ${F.range('item.w', 'Genişlik', 60, 900, 1, it.w, ' px')}
      <div class="row">${F.check('item.bold', 'Kalın', it.bold)}${F.check('item.upper', 'BÜYÜK HARF', it.upper)}</div>
      ${it.style !== 'anlatici' ? F.check('item.tailOn', 'Kuyruk göster', it.tailOn !== false, true) : ''}
      <div class="row">${F.color('item.fill', 'Balon rengi', it.fill)}${F.color('item.textColor', 'Yazı rengi', it.textColor)}</div>
      <p class="hint">Sarı tutamacı sürükleyerek kuyruğu konuşan karaktere yönelt. Shift ile taşırsan kuyruk da birlikte gelir.</p>
      ${actionsHtml()}`;
  }

  function effectProps(it) {
    return `<div class="props-title"><h3>Efekt yazısı</h3><span class="chip">Efekt</span></div>
      ${F.text('item.text', 'Yazı', it.text, 'f-text')}
      ${F.select('item.shape', 'Şekil', S.EFFECT_SHAPES, it.shape, true)}
      <div class="row">${F.color('item.color', 'Yazı rengi', it.color)}${it.shape !== 'yok' ? F.color('item.fill', 'Şekil rengi', it.fill) : ''}</div>
      ${F.range('item.rotate', 'Döndür', -180, 180, 1, it.rotate || 0, '°')}
      <p class="hint">Köşe tutamacı serbest boyutlandırır; Shift ile orantılı.</p>
      ${actionsHtml()}`;
  }

  function objectProps(it) {
    const title = it.type === 'image' ? 'Resim' : (S.OBJECTS[it.kind] || {}).ad || 'Nesne';
    return `<div class="props-title"><h3>${esc(title)}</h3><span class="chip">${it.type === 'image' ? 'Resim' : 'Nesne'}</span></div>
      ${F.range('item.rotate', 'Döndür', -180, 180, 1, it.rotate || 0, '°')}
      ${F.check('item.mirror', 'Aynala (ters çevir)', it.mirror)}
      ${actionsHtml()}`;
  }

  function bindTarget(path) {
    const [root, ...keys] = path.split('.');
    let obj;
    if (root === 'item') obj = selectedItem()?.item;
    else if (root === 'page') obj = state.page;
    else if (root === 'bg') obj = selectedPanel()?.bg;
    if (!obj) return null;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    return { obj, key: keys[keys.length - 1] };
  }

  function readInput(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'range' || el.type === 'number') return parseFloat(el.value);
    return el.value;
  }

  propsEl.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset.bind) return;
    const t = bindTarget(el.dataset.bind);
    if (!t) return;
    let v = readInput(el);
    if (el.type === 'number' && (isNaN(v) || v < 50)) return;
    t.obj[t.key] = v;
    if (el.type === 'range') {
      const span = el.parentElement.querySelector('.val');
      if (span) span.textContent = v + span.dataset.unit;
    }
    queueRender();
  });

  propsEl.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act) return handleAct(el.dataset.act, el.value);
    if (!el.dataset.bind) return;
    commit();
    render();
    if (el.hasAttribute('data-rerender') || el.type === 'number' || el.tagName === 'SELECT') renderProps();
  });

  document.addEventListener('click', (e) => {
    const cmdEl = e.target.closest('[data-cmd]');
    if (cmdEl) return runCmd(cmdEl.dataset.cmd);
    const actEl = e.target.closest('[data-act]');
    if (actEl && actEl.tagName !== 'SELECT') return handleAct(actEl.dataset.act, actEl.dataset.val);
    const addEl = e.target.closest('[data-add]');
    if (addEl) {
      const v = addEl.dataset.val;
      if (addEl.dataset.add === 'char') addCharacter(v);
      if (addEl.dataset.add === 'bubble') addBubble(v);
      if (addEl.dataset.add === 'effect') addEffect(+v);
      if (addEl.dataset.add === 'object') addObject(v);
      return;
    }
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      $$('#leftTabs button').forEach((b) => b.classList.toggle('active', b === tab));
      $$('[data-tab-body]').forEach((s) => s.classList.toggle('hidden', s.dataset.tabBody !== tab.dataset.tab));
    }
  });

  async function handleAct(act, val) {
    const f = selectedItem();
    const it = f && f.item;
    const panel = selectedPanel();
    switch (act) {
      case 'subtab':
        charTab = val;
        renderProps();
        return;
      case 'emotion':
      case 'pose':
        if (!it) return;
        it[act] = val;
        if (act === 'pose' && val === 'kosma') it.legs = 'oto';
        break;
      case 'skin':
        if (!it) return;
        it.look.skin = val;
        break;
      case 'hairColor':
        if (!it) return;
        it.look.hairColor = val;
        break;
      case 'lookPreset': {
        const p = C.PRESETS.find((x) => x.id === val);
        if (!p || !it) return;
        const { id, ad, ...look } = p;
        it.look = { ...look };
        it.name = ad;
        break;
      }
      case 'layout':
        return setLayout(val);
      case 'pageSize': {
        const s = PAGE_SIZES[val];
        if (!s) return;
        state.page.w = s.w;
        state.page.h = s.h;
        commit();
        render();
        renderProps();
        zoomFit();
        return;
      }
      case 'bgkind': {
        if (!panel) return;
        const cols = S.BG_DEFAULT_COLORS[val];
        const keep = panel.bg.image;
        panel.bg = { kind: val, color: cols ? cols[0] : '#ffffff', color2: cols ? cols[1] : '#ffffff', image: keep };
        if (val === 'resim' && !keep) {
          const img = await native.openImage();
          if (img) panel.bg.image = img;
        }
        break;
      }
      case 'pickBgImage': {
        if (!panel) return;
        const img = await native.openImage();
        if (!img) return;
        panel.bg.image = img;
        break;
      }
      case 'clearPanel':
        if (!panel || !panel.items.length) return;
        if (!(await native.confirm('Bu paneldeki tüm öğeler silinsin mi?'))) return;
        panel.items = [];
        break;
      default:
        return;
    }
    commit();
    render();
    renderProps();
  }

  // ---------- Sol panel ızgaraları ----------
  function buildLibrary() {
    $('#presetGrid').innerHTML = C.PRESETS.map(
      (p) =>
        `<div class="tile" data-add="char" data-val="${p.id}">${svgThumb('10 0 180 240', C.render(p, { emotion: 'gulumseme', pose: 'normal' }))}${esc(p.ad)}</div>`
    ).join('');

    $('#bubbleGrid').innerHTML = Object.entries(S.BUBBLES)
      .map(([k, name]) => {
        const sample = { id: 'th' + k, style: k, text: 'Merhaba!', fontSize: 18, w: 130, x: 15, y: 8, fill: k === 'anlatici' ? '#fff3b0' : '#fff', tailOn: k !== 'anlatici', tail: { x: 45, y: 104 } };
        return `<div class="tile" data-add="bubble" data-val="${k}">${svgThumb('0 0 160 110', `<rect width="160" height="110" fill="#e9eef5"/>${S.bubbleSvg(sample).svg}`)}${name}</div>`;
      })
      .join('');

    $('#effectGrid').innerHTML = EFFECT_PRESETS.map((e, i) => {
      const sample = { id: 'ef' + i, ...e, x: 10, y: 5, w: 140, h: 90 };
      return `<div class="tile" data-add="effect" data-val="${i}">${svgThumb('0 0 160 100', `<rect width="160" height="100" fill="#e9eef5"/>${S.effectSvg(sample)}`)}${esc(e.text)}</div>`;
    }).join('');

    $('#objectGrid').innerHTML = Object.entries(S.OBJECTS)
      .map(([k, o]) => {
        const pad = Math.max(o.w, o.h) * 0.12;
        return `<div class="tile" data-add="object" data-val="${k}">${svgThumb(`${-pad} ${-pad} ${o.w + pad * 2} ${o.h + pad * 2}`, o.svg)}${o.ad}</div>`;
      })
      .join('');
    $$('#objectGrid .tile svg').forEach((s) => (s.style.aspectRatio = '1'));
  }

  // ---------- Dosya işlemleri ----------
  async function confirmDiscard() {
    return !dirty || native.confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam edilsin mi?');
  }

  async function newDoc() {
    if (!(await confirmDiscard())) return;
    state = blankState();
    filePath = null;
    selection = null;
    resetHistory();
    setDirty(false);
    render();
    renderProps();
    zoomFit();
  }

  async function save(forceDialog) {
    const content = JSON.stringify({ app: 'KomikGen', version: 1, state }, null, 1);
    const p = await native.saveProject({ content, filePath, forceDialog });
    if (!p) return;
    filePath = p;
    setDirty(false);
    toast('Kaydedildi: ' + p.split(/[\\/]/).pop());
  }

  async function openDoc() {
    if (!(await confirmDiscard())) return;
    const r = await native.openProject();
    if (!r) return;
    try {
      const data = JSON.parse(r.content);
      if (!data.state || !data.state.page || !Array.isArray(data.state.panels)) throw new Error('format');
      state = data.state;
      filePath = r.filePath;
      selection = null;
      resetHistory();
      setDirty(false);
      render();
      renderProps();
      zoomFit();
    } catch {
      toast('Bu dosya geçerli bir KomikGen projesi değil.');
    }
  }

  function exportSvgString() {
    const p = state.page;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">${pageSvg(false)}</svg>`;
  }

  async function rasterize(type = 'image/png', scale = 2) {
    const p = state.page;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(exportSvgString());
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(p.w * scale);
    canvas.height = Math.round(p.h * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, 0.92);
  }

  async function exportAs(ext) {
    try {
      let saved;
      if (ext === 'svg') saved = await native.exportFile({ data: exportSvgString(), ext, encoding: 'utf8' });
      else saved = await native.exportFile({ data: await rasterize(ext === 'jpg' ? 'image/jpeg' : 'image/png'), ext, encoding: 'dataurl' });
      if (saved) toast('Dışa aktarıldı: ' + saved.split(/[\\/]/).pop());
    } catch (err) {
      toast('Dışa aktarma başarısız: ' + err.message);
    }
  }

  async function copyImage() {
    await native.copyImage(await rasterize('image/png', 2));
    toast('Resim panoya kopyalandı');
  }

  // ---------- Komutlar ----------
  function runCmd(cmd) {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    switch (cmd) {
      case 'new':
        return newDoc();
      case 'open':
        return openDoc();
      case 'save':
        return save(false);
      case 'saveAs':
        return save(true);
      case 'exportPng':
        return exportAs('png');
      case 'exportJpg':
        return exportAs('jpg');
      case 'exportSvg':
        return exportAs('svg');
      case 'copyImage':
        return copyImage();
      case 'undo':
        if (typing) document.activeElement.blur();
        return undo();
      case 'redo':
        if (typing) document.activeElement.blur();
        return redo();
      case 'duplicate':
        return duplicateSelected();
      case 'delete':
        return deleteSelected();
      case 'front':
        return reorder(1);
      case 'back':
        return reorder(-1);
      case 'zoomIn':
        return setZoom(zoom * 1.2);
      case 'zoomOut':
        return setZoom(zoom / 1.2);
      case 'zoomFit':
        return zoomFit();
      case 'addRandomChar':
        return addRandomCharacter();
      case 'addImage':
        return addImage();
      case 'randomize': {
        const f = selectedItem();
        if (!f || f.item.type !== 'character') return toast('Önce bir karakter seç');
        f.item.look = randomLook();
        commit();
        render();
        renderProps();
        return;
      }
    }
  }
  native.onMenu(runCmd);

  // ---------- Durum çubuğu / bildirim ----------
  function updateStatus() {
    const f = selectedItem();
    let msg = 'Bir panele tıkla ve soldan karakter, balon ya da nesne ekle. Ctrl + tekerlek ile yakınlaştır.';
    if (selection && selection.kind === 'panel') msg = `Panel ${panelIndex(selection.panelId) + 1} seçili — sağdan arka plan seçebilirsin.`;
    if (f) msg = 'Sürükleyerek taşı · Köşeden boyutlandır · Del: sil · Ctrl+D: çoğalt · Oklar: ince ayar · Başka panele sürükleyerek taşıyabilirsin';
    $('#status').textContent = msg;
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2400);
  }

  // ---------- Örnek komik ----------
  function demoState() {
    const st = blankState();
    const [p1, p2, p3] = st.panels;
    p1.bg = { kind: 'park' };
    p2.bg = { kind: 'ofis' };
    p3.bg = { kind: 'patlama', color: '#ffd23f', color2: '#ffb000' };
    const preset = (id) => {
      const { id: _, ad, ...look } = C.PRESETS.find((p) => p.id === id);
      return { look, name: ad };
    };
    const ayse = preset('ayse');
    const mehmet = preset('mehmet');
    const ch = (who, x, y, scale, extra) => ({ id: 'i' + uid(), type: 'character', ...who, emotion: 'gulumseme', pose: 'normal', legs: 'oto', gaze: 'oto', boardText: 'Merhaba!', scale, mirror: false, rotate: 0, x, y, ...extra });
    const bubble = (style, x, y, w, text, tail, extra) => ({ id: 'i' + uid(), type: 'bubble', style, text, fontSize: 19, bold: false, upper: false, tailOn: true, fill: '#ffffff', textColor: '#1d1d1f', x, y, w, tail, ...extra });

    p1.items.push(ch(ayse, 40, 150, 0.92, { pose: 'selam', emotion: 'mutlu' }));
    p1.items.push(ch(mehmet, 250, 150, 0.92, { mirror: true, emotion: 'merakli' }));
    p1.items.push(bubble('konusma', 14, 12, 270, 'Selam Mehmet! Kendi çizgi romanını yapabileceğini biliyor muydun?', { x: 140, y: 170 }));

    p2.items.push(ch(mehmet, 150, 150, 0.92, { pose: 'dusunme', emotion: 'dusunceli' }));
    p2.items.push(bubble('dusunce', 190, 14, 270, 'Karakter seç, duygu seç, poz ver... Bu kadar kolay mı?', { x: 265, y: 176 }));

    p3.items.push(ch(ayse, 30, 214, 0.76, { pose: 'zafer', emotion: 'kahkaha' }));
    p3.items.push(ch(mehmet, 250, 214, 0.76, { pose: 'bravo', emotion: 'mutlu', mirror: true }));
    p3.items.push({ id: 'i' + uid(), type: 'effect', ...EFFECT_PRESETS[2], text: 'VAY!', x: 24, y: 24, w: 200, h: 140, rotate: -8 });
    p3.items.push(bubble('kutu', 250, 30, 200, 'Hadi başlayalım!', { x: 330, y: 236 }, { fontSize: 21, bold: true }));
    return st;
  }

  // ---------- Başlat ----------
  state = demoState();
  resetHistory();
  setDirty(false);
  buildLibrary();
  render();
  renderProps();
  updateStatus();
  requestAnimationFrame(zoomFit);
  window.addEventListener('resize', () => {
    if (!drag) render();
  });
  // Geliştirici konsolundan erişim için
  window.KomikGen = { exportSvgString, rasterize, select, getState: () => state };
})();
