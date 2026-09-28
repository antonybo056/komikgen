// Arka planlar, nesneler, konuşma balonları ve efekt yazıları
(function () {
  const OUT = '#1d1d1f';
  const { shade, esc } = window.Characters;
  const FONT = "'Comic Sans MS', 'Comic Neue', 'Chalkboard SE', cursive";
  const IMPACT = "Impact, 'Arial Black', sans-serif";

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }
  function hash(str) {
    let h = 2166136261;
    for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  const f2 = (n) => Math.round(n * 10) / 10;

  // ---------- Arka planlar ----------
  const BACKGROUNDS = {
    duz: 'Düz renk',
    degrade: 'Degrade',
    gokyuzu: 'Gökyüzü',
    park: 'Park',
    sehir: 'Şehir',
    gece: 'Gece',
    ofis: 'Ofis',
    sinif: 'Sınıf',
    oda: 'Oda',
    plaj: 'Plaj',
    patlama: 'Aksiyon ışınları',
    hiz: 'Hız çizgileri',
    noktali: 'Pop-art noktalar',
    resim: 'Resim (dosyadan)'
  };
  const BG_DEFAULT_COLORS = {
    duz: ['#ffffff', '#ffffff'],
    degrade: ['#ffd6e0', '#c7e9ff'],
    patlama: ['#ffd23f', '#ff9f1c'],
    noktali: ['#ff6b8b', '#ffffff'],
    oda: ['#f7d9c4', '#b98b62'],
    hiz: ['#ffffff', '#1d1d1f']
  };

  function cloud(x, y, s) {
    return `<g transform="translate(${f2(x)},${f2(y)}) scale(${f2(s)})" fill="#fff" opacity="0.95"><ellipse cx="0" cy="0" rx="34" ry="16"/><circle cx="-14" cy="-10" r="16"/><circle cx="10" cy="-14" r="20"/><circle cx="26" cy="-4" r="13"/></g>`;
  }
  function tree(x, gy, s) {
    return `<g transform="translate(${f2(x)},${f2(gy)}) scale(${f2(s)})" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"><rect x="-8" y="-70" width="16" height="70" fill="#8b5a2b"/><circle cx="0" cy="-92" r="36" fill="#4caf50"/><circle cx="-24" cy="-72" r="22" fill="#43a047"/><circle cx="24" cy="-72" r="22" fill="#43a047"/></g>`;
  }
  function skyGrad(id, a, b) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  }

  function background(bg, w, h, uid) {
    const kind = bg.kind || 'duz';
    const c1 = bg.color || '#ffffff';
    const c2 = bg.color2 || '#ffffff';
    const R = rng(hash(uid));
    const gy = h * 0.78;
    let defs = '';
    let s = '';
    switch (kind) {
      case 'duz':
        s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
        break;
      case 'degrade':
        defs = skyGrad(`${uid}g`, c1, c2);
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        break;
      case 'gokyuzu':
        defs = skyGrad(`${uid}g`, '#7ec4f2', '#e3f4ff');
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        for (let i = 0; i < 4; i++) s += cloud(w * (0.12 + i * 0.26 + R() * 0.08), h * (0.12 + R() * 0.3), 0.7 + R() * 0.8);
        s += `<rect y="${gy}" width="${w}" height="${h - gy}" fill="#86cf6f"/><path d="M0,${gy} L${w},${gy}" stroke="#5d9e4a" stroke-width="4"/>`;
        break;
      case 'park': {
        defs = skyGrad(`${uid}g`, '#8fd0f7', '#e8f7ff');
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        s += cloud(w * 0.2, h * 0.15, 0.9) + cloud(w * 0.75, h * 0.1, 0.7);
        s += `<ellipse cx="${w * 0.2}" cy="${gy}" rx="${w * 0.45}" ry="${h * 0.2}" fill="#9fd98a"/><ellipse cx="${w * 0.85}" cy="${gy}" rx="${w * 0.4}" ry="${h * 0.16}" fill="#a9df95"/>`;
        s += `<rect y="${gy}" width="${w}" height="${h - gy}" fill="#79c267"/>`;
        s += `<path d="M${w * 0.35},${h} Q${w * 0.5},${gy + (h - gy) * 0.4} ${w * 0.6},${gy} L${w * 0.66},${gy} Q${w * 0.6},${gy + (h - gy) * 0.4} ${w * 0.55},${h} Z" fill="#e3cf9f"/>`;
        const ts = Math.min(w, h) / 380;
        s += tree(w * 0.1, gy + 6, ts * 1.1) + tree(w * 0.88, gy + 4, ts) + tree(w * 0.72, gy - 2, ts * 0.7);
        break;
      }
      case 'sehir': {
        defs = skyGrad(`${uid}g`, '#ffd9a8', '#fff3e0');
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        let x = -10;
        const cols = ['#8ea8c3', '#6c8aa8', '#a3b8cc', '#7d97b3', '#5f7a96'];
        while (x < w) {
          const bw = w * (0.08 + R() * 0.1);
          const bh = h * (0.3 + R() * 0.4);
          const col = cols[Math.floor(R() * cols.length)];
          s += `<rect x="${f2(x)}" y="${f2(gy - bh)}" width="${f2(bw)}" height="${f2(bh)}" fill="${col}" stroke="${OUT}" stroke-width="2"/>`;
          for (let wy = gy - bh + 12; wy < gy - 20; wy += 22)
            for (let wx = x + 8; wx < x + bw - 14; wx += 18)
              s += `<rect x="${f2(wx)}" y="${f2(wy)}" width="9" height="12" fill="${R() > 0.35 ? '#fff6c9' : shade(col, -0.25)}"/>`;
          x += bw + 4;
        }
        s += `<rect y="${gy}" width="${w}" height="${h - gy}" fill="#b0b0b0"/><rect y="${gy}" width="${w}" height="8" fill="#d0d0d0" stroke="${OUT}" stroke-width="2"/>`;
        break;
      }
      case 'gece': {
        defs = skyGrad(`${uid}g`, '#0b1d3a', '#34507f');
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        for (let i = 0; i < Math.round((w * h) / 6000); i++)
          s += `<circle cx="${f2(R() * w)}" cy="${f2(R() * gy * 0.8)}" r="${f2(0.8 + R() * 1.8)}" fill="#fff" opacity="${f2(0.5 + R() * 0.5)}"/>`;
        const mr = Math.min(w, h) * 0.09;
        s += `<circle cx="${w * 0.8}" cy="${h * 0.2}" r="${mr}" fill="#fff4c2"/><circle cx="${w * 0.8 + mr * 0.3}" cy="${h * 0.2 - mr * 0.2}" r="${mr * 0.2}" fill="#efe2a8"/>`;
        let x = -10;
        while (x < w) {
          const bw = w * (0.07 + R() * 0.09);
          const bh = h * (0.18 + R() * 0.3);
          s += `<rect x="${f2(x)}" y="${f2(gy - bh)}" width="${f2(bw)}" height="${f2(bh + h - gy)}" fill="#14213d"/>`;
          for (let wy = gy - bh + 10; wy < gy - 10; wy += 20)
            for (let wx = x + 7; wx < x + bw - 12; wx += 16) if (R() > 0.6) s += `<rect x="${f2(wx)}" y="${f2(wy)}" width="8" height="10" fill="#ffd166"/>`;
          x += bw + 3;
        }
        s += `<rect y="${gy}" width="${w}" height="${h - gy}" fill="#0d1526"/>`;
        break;
      }
      case 'ofis': {
        const fy = h * 0.8;
        s = `<rect width="${w}" height="${h}" fill="#ece6d9"/><rect y="${fy}" width="${w}" height="${h - fy}" fill="#9aa5b1"/><path d="M0,${fy} L${w},${fy}" stroke="${OUT}" stroke-width="3"/>`;
        const ww = w * 0.28;
        const wh = h * 0.36;
        const wx = w * 0.08;
        const wy = h * 0.14;
        s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#bfe6ff" stroke="${OUT}" stroke-width="4"/>`;
        s += cloud(wx + ww * 0.35, wy + wh * 0.35, 0.6);
        s += `<path d="M${wx + ww / 2},${wy} L${wx + ww / 2},${wy + wh} M${wx},${wy + wh / 2} L${wx + ww},${wy + wh / 2}" stroke="${OUT}" stroke-width="4"/>`;
        const cr = Math.min(w, h) * 0.06;
        const cx = w * 0.78;
        const cy = h * 0.22;
        s += `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="#fff" stroke="${OUT}" stroke-width="3"/><path d="M${cx},${cy} L${cx},${cy - cr * 0.7} M${cx},${cy} L${cx + cr * 0.5},${cy}" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>`;
        s += `<rect x="${w * 0.55}" y="${h * 0.14}" width="${w * 0.12}" height="${h * 0.2}" fill="#fff" stroke="${OUT}" stroke-width="3"/><path d="M${w * 0.57},${h * 0.3} L${w * 0.6},${h * 0.24} L${w * 0.62},${h * 0.27} L${w * 0.65},${h * 0.18}" fill="none" stroke="#e63946" stroke-width="3"/>`;
        break;
      }
      case 'sinif': {
        const fy = h * 0.8;
        s = `<rect width="${w}" height="${h}" fill="#f4e8c8"/><rect y="${fy}" width="${w}" height="${h - fy}" fill="#c9a36b"/><path d="M0,${fy} L${w},${fy}" stroke="${OUT}" stroke-width="3"/>`;
        const bx = w * 0.12;
        const by = h * 0.1;
        const bw = w * 0.76;
        const bh = h * 0.45;
        s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#2f5d50" stroke="#8b5a2b" stroke-width="10"/>`;
        s += `<text x="${bx + bw * 0.08}" y="${by + bh * 0.3}" font-family="${FONT}" font-size="${Math.max(14, bh * 0.14)}" fill="#f1f1f1" opacity="0.85">2 + 2 = 4</text>`;
        s += `<text x="${bx + bw * 0.08}" y="${by + bh * 0.6}" font-family="${FONT}" font-size="${Math.max(12, bh * 0.1)}" fill="#f1f1f1" opacity="0.7">a² + b² = c²</text>`;
        s += `<rect x="${bx + bw * 0.7}" y="${by + bh - 6}" width="${bw * 0.12}" height="6" fill="#fff"/>`;
        break;
      }
      case 'oda': {
        const fy = h * 0.78;
        s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
        for (let x = 20; x < w; x += 40) s += `<rect x="${x}" y="0" width="14" height="${fy}" fill="${shade(c1, 0.25)}"/>`;
        s += `<rect y="${fy}" width="${w}" height="${h - fy}" fill="${c2}"/>`;
        for (let x = 0; x < w; x += 70) s += `<path d="M${x},${fy} L${x},${h}" stroke="${shade(c2, -0.25)}" stroke-width="2"/>`;
        s += `<path d="M0,${fy} L${w},${fy}" stroke="${OUT}" stroke-width="3"/>`;
        const px = w * 0.62;
        const py = h * 0.15;
        const pw = w * 0.2;
        const ph = h * 0.25;
        s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#bde0fe" stroke="#8b5a2b" stroke-width="8"/><path d="M${px + 4},${py + ph - 4} L${px + pw * 0.4},${py + ph * 0.45} L${px + pw * 0.65},${py + ph * 0.7} L${px + pw * 0.8},${py + ph * 0.55} L${px + pw - 4},${py + ph - 4} Z" fill="#6a994e"/>`;
        s += `<circle cx="${px + pw * 0.25}" cy="${py + ph * 0.3}" r="${pw * 0.08}" fill="#ffd166"/>`;
        break;
      }
      case 'plaj': {
        defs = skyGrad(`${uid}g`, '#5ec3f5', '#d8f3ff');
        s = `<rect width="${w}" height="${h}" fill="url(#${uid}g)"/>`;
        const sr = Math.min(w, h) * 0.1;
        s += `<circle cx="${w * 0.82}" cy="${h * 0.18}" r="${sr}" fill="#ffd23f" stroke="#f4a261" stroke-width="4"/>`;
        s += cloud(w * 0.22, h * 0.16, 0.8);
        const sy = h * 0.5;
        s += `<rect y="${sy}" width="${w}" height="${h - sy}" fill="#2f9fd8"/>`;
        for (let y = sy + 16; y < gy; y += 22)
          s += `<path d="M${w * 0.1 + R() * w * 0.5},${y} q10,-6 20,0 t20,0" fill="none" stroke="#bfe9ff" stroke-width="3" stroke-linecap="round"/>`;
        s += `<path d="M0,${gy - 10} Q${w * 0.3},${gy - 30} ${w * 0.6},${gy - 12} T${w},${gy - 16} L${w},${h} L0,${h} Z" fill="#f3d9a4"/>`;
        break;
      }
      case 'patlama': {
        s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.hypot(w, h);
        const n = 28;
        for (let i = 0; i < n; i += 2) {
          const a1 = (i / n) * Math.PI * 2;
          const a2 = ((i + 1) / n) * Math.PI * 2;
          s += `<path d="M${cx},${cy} L${f2(cx + Math.cos(a1) * r)},${f2(cy + Math.sin(a1) * r)} L${f2(cx + Math.cos(a2) * r)},${f2(cy + Math.sin(a2) * r)} Z" fill="${c2}"/>`;
        }
        break;
      }
      case 'hiz': {
        s = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.hypot(w, h);
        for (let i = 0; i < 90; i++) {
          const a = R() * Math.PI * 2;
          const inner = Math.min(w, h) * (0.28 + R() * 0.15);
          const wd = 0.004 + R() * 0.012;
          const p1 = [cx + Math.cos(a) * inner, cy + Math.sin(a) * inner];
          const p2 = [cx + Math.cos(a - wd) * r, cy + Math.sin(a - wd) * r];
          const p3 = [cx + Math.cos(a + wd) * r, cy + Math.sin(a + wd) * r];
          s += `<path d="M${f2(p1[0])},${f2(p1[1])} L${f2(p2[0])},${f2(p2[1])} L${f2(p3[0])},${f2(p3[1])} Z" fill="${c2}"/>`;
        }
        break;
      }
      case 'noktali':
        defs = `<pattern id="${uid}p" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4.5" fill="${c2}" opacity="0.55"/></pattern>`;
        s = `<rect width="${w}" height="${h}" fill="${c1}"/><rect width="${w}" height="${h}" fill="url(#${uid}p)"/>`;
        break;
      case 'resim':
        s = `<rect width="${w}" height="${h}" fill="#ddd"/>`;
        if (bg.image) s += `<image href="${bg.image}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`;
        else s += `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="Arial" font-size="16" fill="#777">Resim seçin</text>`;
        break;
    }
    return (defs ? `<defs>${defs}</defs>` : '') + s;
  }

  // ---------- Nesneler ----------
  const st = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
  const OBJECTS = {
    masa: { ad: 'Masa', w: 240, h: 120, svg: `<rect x="4" y="4" width="232" height="18" rx="3" fill="#a0673d" ${st}/><rect x="20" y="22" width="14" height="94" fill="#7a4a28" ${st}/><rect x="206" y="22" width="14" height="94" fill="#7a4a28" ${st}/><rect x="140" y="22" width="60" height="44" fill="#8c5831" ${st}/><circle cx="170" cy="44" r="3" fill="${OUT}"/>` },
    sandalye: { ad: 'Sandalye', w: 90, h: 150, svg: `<rect x="10" y="4" width="14" height="140" fill="#7a4a28" ${st}/><rect x="10" y="10" width="70" height="40" rx="6" fill="#c0392b" ${st}/><rect x="6" y="80" width="80" height="14" rx="3" fill="#a0673d" ${st}/><rect x="70" y="94" width="12" height="52" fill="#7a4a28" ${st}/>` },
    laptop: { ad: 'Dizüstü', w: 130, h: 90, svg: `<path d="M20,4 L110,4 L110,66 L20,66 Z" fill="#3a3f47" ${st}/><rect x="28" y="12" width="74" height="46" fill="#7fd1ff"/><path d="M6,66 L124,66 L128,84 L2,84 Z" fill="#b8bec6" ${st}/><path d="M50,72 L80,72" stroke="#7a818a" stroke-width="3"/>` },
    bitki: { ad: 'Saksı bitki', w: 80, h: 140, svg: `<path d="M40,90 Q10,60 14,20 Q34,40 40,90 Z M40,90 Q70,56 66,14 Q46,40 40,90 Z M40,90 Q30,40 44,6 Q54,44 40,90 Z" fill="#4caf50" ${st}/><path d="M16,88 L64,88 L58,136 L22,136 Z" fill="#d9774a" ${st}/><rect x="12" y="82" width="56" height="12" rx="3" fill="#c0643c" ${st}/>` },
    agac: { ad: 'Ağaç', w: 160, h: 260, svg: `<path d="M68,256 L72,150 L88,150 L92,256 Z" fill="#8b5a2b" ${st}/><circle cx="80" cy="96" r="60" fill="#4caf50" ${st}/><circle cx="40" cy="130" r="34" fill="#43a047" ${st}/><circle cx="120" cy="130" r="34" fill="#43a047" ${st}/><circle cx="80" cy="60" r="38" fill="#57bb5b"/>` },
    kedi: { ad: 'Kedi', w: 110, h: 100, svg: `<path d="M84,86 Q108,80 104,54 Q102,44 94,48" fill="none" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/><path d="M84,86 Q108,80 104,54 Q102,44 94,48" fill="none" stroke="#f4a261" stroke-width="4" stroke-linecap="round"/><ellipse cx="56" cy="74" rx="32" ry="24" fill="#f4a261" ${st}/><path d="M26,30 L30,6 L46,20 L64,20 L80,6 L84,30 Q88,56 56,58 Q22,56 26,30 Z" fill="#f4a261" ${st}/><circle cx="44" cy="34" r="4" fill="${OUT}"/><circle cx="68" cy="34" r="4" fill="${OUT}"/><path d="M52,42 L60,42 L56,46 Z" fill="#e35d78"/><path d="M56,46 Q52,52 48,48 M56,46 Q60,52 64,48" fill="none" stroke="${OUT}" stroke-width="2"/><path d="M30,42 L16,40 M30,46 L16,48 M82,42 L96,40 M82,46 L96,48" stroke="${OUT}" stroke-width="1.5"/>` },
    ampul: { ad: 'Fikir ampulü', w: 80, h: 110, svg: `<path d="M40,8 L40,0 M12,22 L6,16 M68,22 L74,16 M4,50 L-4,50 M76,50 L84,50" stroke="#f4a261" stroke-width="4" stroke-linecap="round"/><path d="M40,16 Q70,16 70,48 Q70,64 54,76 L54,86 L26,86 L26,76 Q10,64 10,48 Q10,16 40,16 Z" fill="#ffe066" ${st}/><rect x="26" y="86" width="28" height="18" rx="3" fill="#aaa" ${st}/><path d="M32,60 L36,48 L44,48 L48,60" fill="none" stroke="#f4a261" stroke-width="3"/>` },
    kalp: { ad: 'Kalp', w: 70, h: 64, svg: `<path d="M35,60 C-10,32 4,-4 35,16 C66,-4 80,32 35,60 Z" fill="#ef476f" ${st}/><ellipse cx="20" cy="20" rx="6" ry="4" fill="#fff" opacity="0.6"/>` },
    soru: { ad: 'Soru işareti', w: 50, h: 80, svg: `<text x="25" y="72" text-anchor="middle" font-family="${IMPACT}" font-size="84" fill="#f4a261" stroke="${OUT}" stroke-width="3" paint-order="stroke">?</text>` },
    unlem: { ad: 'Ünlem', w: 40, h: 80, svg: `<text x="20" y="72" text-anchor="middle" font-family="${IMPACT}" font-size="84" fill="#e63946" stroke="${OUT}" stroke-width="3" paint-order="stroke">!</text>` },
    yildiz: { ad: 'Yıldız', w: 70, h: 70, svg: `<polygon points="35,3 44,25 67,26 49,41 55,64 35,51 15,64 21,41 3,26 26,25" fill="#ffd23f" ${st}/>` },
    para: { ad: 'Para kesesi', w: 80, h: 90, svg: `<path d="M28,20 Q40,30 52,20 L48,10 Q40,14 32,10 Z" fill="#a67c52" ${st}/><path d="M30,22 Q4,46 10,72 Q16,88 40,88 Q64,88 70,72 Q76,46 50,22 Z" fill="#c8a063" ${st}/><text x="40" y="70" text-anchor="middle" font-family="${IMPACT}" font-size="30" fill="#2d6a4f">₺</text>` }
  };

  function objectSvg(kind) {
    return (OBJECTS[kind] || OBJECTS.kalp).svg;
  }

  // ---------- Metin ölçümü ----------
  const ctx = document.createElement('canvas').getContext('2d');
  function measure(text, size, bold, family) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${family || FONT}`;
    return ctx.measureText(text).width;
  }
  function wrap(text, size, bold, maxW, family) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) {
        out.push('');
        continue;
      }
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (measure(test, size, bold, family) <= maxW || !line) line = test;
        else {
          out.push(line);
          line = word;
        }
      }
      out.push(line);
    }
    return out;
  }

  // ---------- Balonlar ----------
  const BUBBLES = {
    konusma: 'Konuşma (oval)',
    kutu: 'Konuşma (kutu)',
    dusunce: 'Düşünce',
    bagirma: 'Bağırma',
    fisilti: 'Fısıltı',
    anlatici: 'Anlatıcı kutusu'
  };

  function bubbleGeom(it) {
    const fs = it.fontSize || 20;
    const text = it.upper ? String(it.text || '').toLocaleUpperCase('tr-TR') : String(it.text || '');
    const oval = it.style === 'konusma' || it.style === 'dusunce' || it.style === 'bagirma' || it.style === 'fisilti';
    const k = it.style === 'bagirma' ? 0.62 : it.style === 'dusunce' ? 0.68 : 0.74;
    const tw = oval ? it.w * k : it.w - 30;
    const lines = wrap(text, fs, it.bold, Math.max(20, tw));
    const lh = fs * 1.22;
    const th = lines.length * lh;
    let h = oval ? th / (it.style === 'bagirma' ? 0.56 : 0.66) + 18 : th + 26;
    h = Math.max(h, oval ? 60 : 40);
    return { lines, lh, h, fs };
  }

  function ellipsePath(cx, cy, rx, ry) {
    return `M${f2(cx - rx)},${f2(cy)} A${f2(rx)},${f2(ry)} 0 1 0 ${f2(cx + rx)},${f2(cy)} A${f2(rx)},${f2(ry)} 0 1 0 ${f2(cx - rx)},${f2(cy)} Z`;
  }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
  }

  function bubbleSvg(it) {
    const g = bubbleGeom(it);
    const { x, y, w } = it;
    const h = g.h;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const fill = it.fill || '#ffffff';
    const stroke = it.stroke || OUT;
    const sw = it.strokeWidth || 3;
    const tail = it.tailOn !== false && it.style !== 'anlatici' && it.tail;
    let body = '';
    let tailD = '';
    let extra = '';

    const tx = tail ? it.tail.x : cx;
    const ty = tail ? it.tail.y : cy;
    const dx = tx - cx;
    const dy = ty - cy;
    const dl = Math.hypot(dx, dy) || 1;
    const nx = -dy / dl;
    const ny = dx / dl;

    switch (it.style) {
      case 'kutu':
        body = roundRect(x, y, w, h, 18);
        break;
      case 'anlatici':
        body = roundRect(x, y, w, h, 2);
        break;
      case 'bagirma': {
        const R = rng(hash(it.id));
        const n = Math.max(14, Math.round((w + h) / 26));
        let p = '';
        for (let i = 0; i < n * 2; i++) {
          const a = (i / (n * 2)) * Math.PI * 2;
          const k = i % 2 ? 0.78 + R() * 0.06 : 1.0 + R() * 0.1;
          p += `${i ? 'L' : 'M'}${f2(cx + Math.cos(a) * (w / 2) * k)},${f2(cy + Math.sin(a) * (h / 2) * k)} `;
        }
        body = p + 'Z';
        break;
      }
      case 'dusunce': {
        const rx = w / 2;
        const ry = h / 2;
        const n = Math.max(9, Math.round((w + h) / 34));
        const pts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          pts.push([cx + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.86]);
        }
        let p = `M${f2(pts[0][0])},${f2(pts[0][1])} `;
        for (let i = 0; i < n; i++) {
          const b = pts[(i + 1) % n];
          const a = pts[i];
          const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.62;
          p += `A${f2(r)},${f2(r)} 0 0 1 ${f2(b[0])},${f2(b[1])} `;
        }
        body = p + 'Z';
        break;
      }
      default:
        body = ellipsePath(cx, cy, w / 2, h / 2);
    }

    if (tail) {
      if (it.style === 'dusunce') {
        const rx = (w / 2) * 0.95;
        const ry = (h / 2) * 0.95;
        const ux = dx / dl;
        const uy = dy / dl;
        const re = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
        const ex = cx + ux * re;
        const ey = cy + uy * re;
        const span = Math.max(0, dl - re);
        const base = Math.max(6, g.fs * 0.5);
        [
          [0.25, 1],
          [0.6, 0.7],
          [0.92, 0.45]
        ].forEach(([t, k]) => {
          if (span > 4)
            extra += `<circle cx="${f2(ex + ux * span * t)}" cy="${f2(ey + uy * span * t)}" r="${f2(base * k)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
        });
      } else {
        const bw = Math.min(w, h) * (it.style === 'bagirma' ? 0.22 : 0.16);
        const b1 = [cx + nx * bw, cy + ny * bw];
        const b2 = [cx - nx * bw, cy - ny * bw];
        if (it.style === 'bagirma') {
          tailD = `M${f2(b1[0])},${f2(b1[1])} L${f2(tx)},${f2(ty)} L${f2(b2[0])},${f2(b2[1])} Z`;
        } else {
          const mx = (cx + tx) / 2 + nx * bw * 0.6;
          const my = (cy + ty) / 2 + ny * bw * 0.6;
          tailD = `M${f2(b1[0])},${f2(b1[1])} Q${f2(mx + nx * bw * 0.3)},${f2(my + ny * bw * 0.3)} ${f2(tx)},${f2(ty)} Q${f2(mx - nx * bw * 0.4)},${f2(my - ny * bw * 0.4)} ${f2(b2[0])},${f2(b2[1])} Z`;
        }
      }
    }

    let shape;
    if (it.style === 'fisilti') {
      const dash = `stroke-dasharray="${sw * 3},${sw * 2.2}"`;
      shape =
        (tailD ? `<path d="${tailD}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash} stroke-linejoin="round"/>` : '') +
        `<path d="${body}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
    } else {
      const strokeAttr = `fill="${fill}" stroke="${stroke}" stroke-width="${sw * 2}" stroke-linejoin="round"`;
      shape =
        `<path d="${body}" ${strokeAttr}/>` +
        (tailD ? `<path d="${tailD}" ${strokeAttr}/>` : '') +
        `<path d="${body}" fill="${fill}"/>` +
        (tailD ? `<path d="${tailD}" fill="${fill}"/>` : '');
    }

    const tcol = it.textColor || OUT;
    const startY = cy - (g.lines.length * g.lh) / 2 + g.lh / 2;
    let text = `<text font-family="${FONT}" font-size="${g.fs}" ${it.bold ? 'font-weight="bold"' : ''} text-anchor="middle" fill="${tcol}">`;
    g.lines.forEach((ln, i) => {
      text += `<tspan x="${f2(cx)}" y="${f2(startY + i * g.lh)}" dominant-baseline="central">${esc(ln) || ' '}</tspan>`;
    });
    text += '</text>';
    return { svg: extra + shape + text, h };
  }

  // ---------- Efekt yazıları ----------
  const EFFECT_SHAPES = { patlama: 'Patlama', bulut: 'Bulut', yok: 'Sadece yazı' };
  function effectSvg(it) {
    const { x, y, w, h } = it;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const text = String(it.text || '');
    let s = '';
    if (it.shape === 'patlama') {
      const R = rng(hash(it.id));
      const n = 12;
      let p = '';
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
        const k = i % 2 ? 0.62 + R() * 0.08 : 0.95 + R() * 0.08;
        p += `${i ? 'L' : 'M'}${f2(cx + Math.cos(a) * (w / 2) * k)},${f2(cy + Math.sin(a) * (h / 2) * k)} `;
      }
      s += `<path d="${p}Z" fill="${it.fill}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`;
    } else if (it.shape === 'bulut') {
      const pts = [];
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * w * 0.4, cy + Math.sin(a) * h * 0.36]);
      }
      let p = `M${f2(pts[0][0])},${f2(pts[0][1])} `;
      for (let i = 0; i < n; i++) {
        const b = pts[(i + 1) % n];
        const a = pts[i];
        const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.6;
        p += `A${f2(r)},${f2(r)} 0 0 1 ${f2(b[0])},${f2(b[1])} `;
      }
      s += `<path d="${p}Z" fill="${it.fill}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`;
    }
    const inner = it.shape === 'yok' ? 0.95 : 0.62;
    const tw = measure(text || 'A', 100, true, IMPACT) / 100;
    const fs = Math.max(8, Math.min(h * (it.shape === 'yok' ? 0.8 : 0.4), (w * inner) / tw));
    s += `<text x="${f2(cx)}" y="${f2(cy)}" text-anchor="middle" dominant-baseline="central" font-family="${IMPACT}" font-size="${f2(fs)}" fill="${it.color}" stroke="${OUT}" stroke-width="${f2(fs * 0.09)}" paint-order="stroke" stroke-linejoin="round" transform="rotate(${-6} ${f2(cx)} ${f2(cy)})">${esc(text)}</text>`;
    return s;
  }

  window.Scene = {
    FONT,
    BACKGROUNDS,
    BG_DEFAULT_COLORS,
    background,
    OBJECTS,
    objectSvg,
    BUBBLES,
    bubbleGeom,
    bubbleSvg,
    EFFECT_SHAPES,
    effectSvg
  };
})();
