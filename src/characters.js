// Karakter çizimi. Her karakter 200x400 birimlik bir kutuya çizilir, ayaklar y≈400'dedir.
// Katman sırası: arka saç → bacaklar → gövde → baş/yüz → ön saç/aksesuar → kollar/eşyalar
(function () {
  const OUT = '#1d1d1f';

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
      Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)))
    );
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Seçenek listeleri ----------
  const HAIR_STYLES = {
    kisa: 'Kısa',
    yan: 'Yana taralı',
    diken: 'Dikenli',
    kivircik: 'Kıvırcık',
    uzun: 'Uzun',
    kakul: 'Kakül',
    topuz: 'Topuz',
    atkuyrugu: 'At kuyruğu',
    kel: 'Kel'
  };
  const TOPS = {
    tisort: 'Tişört',
    gomlek: 'Gömlek & kravat',
    ceket: 'Ceket',
    kazak: 'Kazak',
    kapusonlu: 'Kapüşonlu',
    elbise: 'Elbise'
  };
  const GLASSES = { yok: 'Yok', yuvarlak: 'Yuvarlak', kare: 'Köşeli', gunes: 'Güneş gözlüğü' };
  const BEARDS = { yok: 'Yok', biyik: 'Bıyık', sakal: 'Sakal', kecisakal: 'Keçi sakalı' };
  const HATS = { yok: 'Yok', bere: 'Bere', kep: 'Kep', tac: 'Taç' };
  const LEGS = { ayakta: 'Ayakta', yurume: 'Yürüme', kosma: 'Koşma', ziplama: 'Zıplama' };
  const GAZES = {
    oto: 'Duyguya göre',
    merkez: 'Karşıya',
    sol: 'Sola',
    sag: 'Sağa',
    yukari: 'Yukarı',
    asagi: 'Aşağı'
  };
  const GAZE_OFFSET = {
    merkez: [0, 0],
    sol: [-3.5, 0],
    sag: [3.5, 0],
    yukari: [0, -4],
    asagi: [0, 4],
    yukariSag: [3, -3.5]
  };
  const SKINS = ['#ffe0c4', '#f6d2b5', '#f1c7a0', '#e0ac7e', '#c68642', '#8d5a3b', '#5a3825'];

  const EMOTIONS = {
    notr: { ad: 'Nötr', eyes: 'open', brows: 'normal', mouth: 'neutral' },
    gulumseme: { ad: 'Gülümseme', eyes: 'open', brows: 'normal', mouth: 'smile' },
    mutlu: { ad: 'Mutlu', eyes: 'happy', brows: 'raised', mouth: 'bigSmile', extras: ['blush'] },
    kahkaha: { ad: 'Kahkaha', eyes: 'squeeze', brows: 'raised', mouth: 'laugh', extras: ['tearsJoy'] },
    gozkirpma: { ad: 'Göz kırpma', eyes: 'wink', brows: 'normal', mouth: 'smile' },
    dil: { ad: 'Dil çıkarma', eyes: 'wink', brows: 'raised', mouth: 'tongue' },
    asik: { ad: 'Aşık', eyes: 'heart', brows: 'raised', mouth: 'bigSmile', extras: ['blush'] },
    hayran: { ad: 'Hayran', eyes: 'star', brows: 'raised', mouth: 'bigSmile' },
    utangac: { ad: 'Utangaç', eyes: 'happy', brows: 'sad', mouth: 'smallSmile', extras: ['blush', 'blushLines'] },
    sirritma: { ad: 'Sırıtma', eyes: 'half', brows: 'oneRaised', mouth: 'smirk' },
    dusunceli: { ad: 'Düşünceli', eyes: 'open', brows: 'oneRaised', mouth: 'smirkFlat', gaze: 'yukariSag' },
    merakli: { ad: 'Meraklı', eyes: 'open', brows: 'oneRaised', mouth: 'openSmall', extras: ['question'] },
    saskin: { ad: 'Şaşkın', eyes: 'wide', brows: 'raised', mouth: 'open' },
    soke: { ad: 'Şoke', eyes: 'wide', brows: 'raised', mouth: 'shout', extras: ['lines', 'sweat'] },
    korkmus: { ad: 'Korkmuş', eyes: 'wide', brows: 'sad', mouth: 'wavy', extras: ['sweat'] },
    endiseli: { ad: 'Endişeli', eyes: 'open', brows: 'sad', mouth: 'wavy' },
    uzgun: { ad: 'Üzgün', eyes: 'open', brows: 'sad', mouth: 'sad', gaze: 'asagi' },
    aglama: { ad: 'Ağlama', eyes: 'squeeze', brows: 'sad', mouth: 'cry', extras: ['tears'] },
    hayalkirikligi: { ad: 'Hayal kırıklığı', eyes: 'half', brows: 'sad', mouth: 'sad', gaze: 'asagi' },
    kizgin: { ad: 'Kızgın', eyes: 'open', brows: 'angry', mouth: 'teeth', extras: ['vein'] },
    bagirma: { ad: 'Bağırma', eyes: 'open', brows: 'angry', mouth: 'shout' },
    sikilmis: { ad: 'Sıkılmış', eyes: 'roll', brows: 'flat', mouth: 'neutral' },
    yorgun: { ad: 'Yorgun', eyes: 'half', brows: 'sad', mouth: 'wavy', gaze: 'asagi' },
    uykulu: { ad: 'Uyuyor', eyes: 'closed', brows: 'flat', mouth: 'openSmall', extras: ['zzz'] },
    islik: { ad: 'Islık', eyes: 'closed', brows: 'raised', mouth: 'whistle', extras: ['notes'] }
  };

  // Kollar: [omuz, dirsek, el] ve el tipi. L = ekranın solundaki kol.
  const SH_L = [70, 152];
  const SH_R = [130, 152];
  const armDown = (side) =>
    side === 'L' ? { pts: [SH_L, [60, 205], [58, 255]], hand: 'fist' } : { pts: [SH_R, [140, 205], [142, 255]], hand: 'fist' };
  const arm = (side, elbow, hand, type = 'fist') => ({ pts: [side === 'L' ? SH_L : SH_R, elbow, hand], hand: type });

  const POSES = {
    normal: { ad: 'Normal', L: armDown('L'), R: armDown('R') },
    belde: { ad: 'Eller belde', L: arm('L', [36, 200], [68, 240]), R: arm('R', [164, 200], [132, 240]) },
    selam: { ad: 'El sallama', L: armDown('L'), R: arm('R', [170, 138], [176, 86], 'open') },
    anlatma: { ad: 'Anlatma', L: armDown('L'), R: arm('R', [162, 200], [186, 168], 'open') },
    isaretSag: { ad: 'Sağı gösterme', L: armDown('L'), R: arm('R', [162, 165], [194, 150], 'point') },
    isaretSol: { ad: 'Solu gösterme', L: arm('L', [38, 165], [6, 150], 'point'), R: armDown('R') },
    isaretYukari: { ad: 'Yukarıyı gösterme', L: armDown('L'), R: arm('R', [156, 118], [158, 70], 'point') },
    bravo: { ad: 'Bravo', L: armDown('L'), R: arm('R', [154, 212], [162, 172], 'thumb') },
    omuz: { ad: 'Omuz silkme', L: arm('L', [42, 196], [26, 160], 'open'), R: arm('R', [158, 196], [174, 160], 'open') },
    dusunme: { ad: 'Düşünme', L: arm('L', [62, 212], [122, 214]), R: arm('R', [148, 202], [112, 138]) },
    kollar: { ad: 'Kollar bağlı', L: arm('L', [60, 212], [128, 196]), R: arm('R', [140, 212], [72, 196]) },
    zafer: { ad: 'Zafer', L: arm('L', [38, 118], [30, 70]), R: arm('R', [162, 118], [170, 70]) },
    facepalm: { ad: 'Eyvah', L: armDown('L'), R: arm('R', [150, 205], [110, 84], 'open') },
    sus: { ad: 'Şşşt', L: armDown('L'), R: arm('R', [150, 212], [104, 124], 'finger') },
    kahve: { ad: 'Kahve içme', L: armDown('L'), R: arm('R', [152, 212], [150, 176]), prop: 'kahve' },
    telefon: { ad: 'Telefon', L: armDown('L'), R: arm('R', [148, 214], [122, 178]), prop: 'telefon', gaze: 'asagi' },
    kitap: { ad: 'Kitap okuma', L: arm('L', [62, 222], [80, 200]), R: arm('R', [138, 222], [120, 200]), prop: 'kitap', gaze: 'asagi' },
    pano: { ad: 'Pano tutma', L: arm('L', [50, 214], [58, 190]), R: arm('R', [150, 214], [142, 190]), prop: 'pano' },
    kosma: { ad: 'Koşma', L: arm('L', [44, 180], [42, 140]), R: arm('R', [158, 196], [168, 232]), legs: 'kosma' }
  };

  const LEG_POS = {
    ayakta: { L: [[86, 280], [85, 335], [84, 386]], R: [[114, 280], [115, 335], [116, 386]] },
    yurume: { L: [[86, 280], [76, 335], [64, 384]], R: [[114, 280], [124, 332], [136, 384]] },
    kosma: { L: [[86, 280], [64, 318], [48, 350]], R: [[114, 280], [128, 334], [140, 386]] },
    ziplama: { L: [[86, 280], [62, 322], [78, 362]], R: [[114, 280], [138, 322], [122, 362]] }
  };

  const PRESETS = [
    { id: 'ayse', ad: 'Ayşe', skin: '#f6d2b5', hair: 'uzun', hairColor: '#6b3e26', top: 'tisort', topColor: '#e85d75', bottomColor: '#3d5a80', shoeColor: '#2d2d2d', glasses: 'yok', beard: 'yok', hat: 'yok', hatColor: '#e63946', lashes: true },
    { id: 'mehmet', ad: 'Mehmet', skin: '#e0ac7e', hair: 'kisa', hairColor: '#2b2118', top: 'gomlek', topColor: '#8ec5e8', bottomColor: '#34495e', shoeColor: '#3b2a20', glasses: 'yok', beard: 'biyik', hat: 'yok', hatColor: '#1d3557', lashes: false },
    { id: 'zeynep', ad: 'Zeynep', skin: '#8d5a3b', hair: 'kivircik', hairColor: '#1e1410', top: 'elbise', topColor: '#f4a261', bottomColor: '#264653', shoeColor: '#7b2d26', glasses: 'yok', beard: 'yok', hat: 'yok', hatColor: '#e9c46a', lashes: true },
    { id: 'can', ad: 'Can', skin: '#f1c7a0', hair: 'diken', hairColor: '#e0b12a', top: 'kapusonlu', topColor: '#2a9d8f', bottomColor: '#264653', shoeColor: '#e63946', glasses: 'yok', beard: 'yok', hat: 'yok', hatColor: '#264653', lashes: false },
    { id: 'elif', ad: 'Elif', skin: '#ffe0c4', hair: 'atkuyrugu', hairColor: '#b5452a', top: 'kazak', topColor: '#9b5de5', bottomColor: '#22223b', shoeColor: '#22223b', glasses: 'yuvarlak', beard: 'yok', hat: 'yok', hatColor: '#9b5de5', lashes: true },
    { id: 'dede', ad: 'Ahmet Dede', skin: '#e8b98f', hair: 'kel', hairColor: '#d6d6d6', top: 'ceket', topColor: '#6d4c41', bottomColor: '#3e2723', shoeColor: '#1b1b1b', glasses: 'kare', beard: 'sakal', hat: 'yok', hatColor: '#5d4037', lashes: false },
    { id: 'deniz', ad: 'Deniz', skin: '#c68642', hair: 'topuz', hairColor: '#3a2a1f', top: 'tisort', topColor: '#ffd166', bottomColor: '#118ab2', shoeColor: '#f8f9fa', glasses: 'yok', beard: 'yok', hat: 'yok', hatColor: '#ef476f', lashes: true },
    { id: 'kerem', ad: 'Kerem Bey', skin: '#f0c8a0', hair: 'yan', hairColor: '#4a3526', top: 'ceket', topColor: '#2c3e50', bottomColor: '#2c3e50', shoeColor: '#111111', glasses: 'yok', beard: 'kecisakal', hat: 'yok', hatColor: '#2c3e50', lashes: false },
    { id: 'selin', ad: 'Selin', skin: '#fbe3cf', hair: 'kakul', hairColor: '#161616', top: 'gomlek', topColor: '#f1faee', bottomColor: '#e63946', shoeColor: '#161616', glasses: 'yok', beard: 'yok', hat: 'yok', hatColor: '#e63946', lashes: true },
    { id: 'ali', ad: 'Ali', skin: '#5a3825', hair: 'kisa', hairColor: '#111111', top: 'kazak', topColor: '#e76f51', bottomColor: '#3d405b', shoeColor: '#f4f1de', glasses: 'yok', beard: 'yok', hat: 'kep', hatColor: '#1d3557', lashes: false }
  ];

  // ---------- Parçalar ----------
  function limb(pts, color, w) {
    const d = 'M' + pts.map((p) => p.join(',')).join(' L');
    return (
      `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  function hairBack(c) {
    const f = `fill="${c.hairColor}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    switch (c.hair) {
      case 'uzun':
        return `<path d="M48,86 C42,18 158,18 152,86 L160,198 Q100,214 40,198 Z" ${f}/>`;
      case 'kakul':
        return `<path d="M50,86 C44,20 156,20 150,86 L154,142 Q100,152 46,142 Z" ${f}/>`;
      case 'topuz':
        return `<circle cx="100" cy="26" r="21" ${f}/>`;
      case 'atkuyrugu':
        return `<path d="M128,46 Q182,54 170,158 Q160,168 152,150 Q160,100 136,74 Z" ${f}/>`;
      case 'kivircik': {
        let s = '';
        for (let i = 0; i <= 12; i++) {
          const a = Math.PI * (0.9 + (i / 12) * 1.2);
          s += `<circle cx="${(100 + Math.cos(a) * 54).toFixed(1)}" cy="${(80 + Math.sin(a) * 50).toFixed(1)}" r="20" ${f}/>`;
        }
        return s + `<ellipse cx="100" cy="66" rx="54" ry="44" fill="${c.hairColor}"/>`;
      }
      default:
        return '';
    }
  }

  function hairFront(c) {
    const f = `fill="${c.hairColor}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    switch (c.hair) {
      case 'kisa':
        return `<path d="M55,92 C48,12 152,12 145,92 C143,74 136,62 122,58 C108,66 84,66 70,62 C62,70 57,80 55,92 Z" ${f}/>`;
      case 'yan':
        return `<path d="M55,92 C48,12 152,12 145,92 C144,70 134,58 118,56 Q90,62 60,78 Q57,84 55,92 Z" ${f}/>`;
      case 'diken':
        return `<path d="M55,90 L48,56 L64,62 L60,32 L80,46 L86,18 L100,40 L114,18 L120,44 L140,30 L136,58 L153,52 L145,90 C140,70 120,60 100,60 C80,60 60,70 55,90 Z" ${f}/>`;
      case 'uzun':
        return `<path d="M54,100 C46,8 154,8 146,100 C140,70 126,58 100,60 C80,58 62,70 54,100 Z" ${f}/>`;
      case 'kakul':
        return `<path d="M54,92 C48,12 152,12 146,92 L144,62 Q100,66 56,62 Z" ${f}/>`;
      case 'topuz':
      case 'atkuyrugu':
        return `<path d="M55,90 C50,10 150,10 145,90 C140,66 120,58 100,58 C80,58 60,66 55,90 Z" ${f}/>`;
      case 'kivircik': {
        let s = '';
        for (let i = 0; i < 6; i++) {
          const x = 64 + i * 14.4;
          const y = 52 - Math.sin((i / 5) * Math.PI) * 8;
          s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="${c.hairColor}"/>`;
        }
        return s;
      }
      case 'kel':
        return (
          `<path d="M55,100 Q51,82 60,72 Q63,86 61,100 Z" ${f}/>` +
          `<path d="M145,100 Q149,82 140,72 Q137,86 139,100 Z" ${f}/>`
        );
      default:
        return '';
    }
  }

  function hat(c) {
    const f = `fill="${c.hatColor}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    switch (c.hat) {
      case 'bere':
        return (
          `<path d="M52,70 C50,6 150,6 148,70 Z" ${f}/>` +
          `<rect x="48" y="60" width="104" height="18" rx="8" fill="${shade(c.hatColor, -0.2)}" stroke="${OUT}" stroke-width="3"/>` +
          `<circle cx="100" cy="14" r="10" fill="${shade(c.hatColor, 0.4)}" stroke="${OUT}" stroke-width="3"/>`
        );
      case 'kep':
        return (
          `<path d="M54,66 C54,14 146,14 146,66 Z" ${f}/>` +
          `<path d="M52,64 L164,64 Q176,70 162,78 L52,74 Z" fill="${shade(c.hatColor, -0.25)}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
          `<circle cx="100" cy="20" r="4" fill="${shade(c.hatColor, -0.3)}"/>`
        );
      case 'tac':
        return `<path d="M64,56 L60,20 L80,38 L100,12 L120,38 L140,20 L136,56 Z" fill="#ffc93c" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="42" r="5" fill="#e63946"/>`;
      default:
        return '';
    }
  }

  function eye(cx, cy, type, side, gz, skin, lashes) {
    const st = `stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round"`;
    const lash = lashes
      ? side === 'L'
        ? `<path d="M${cx - 8},${cy - 6} L${cx - 13},${cy - 10}" ${st}/>`
        : `<path d="M${cx + 8},${cy - 6} L${cx + 13},${cy - 10}" ${st}/>`
      : '';
    const openEye = (rx, ry, pr, off) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${OUT}" stroke-width="2.5"/>` +
      `<circle cx="${cx + off[0]}" cy="${cy + off[1]}" r="${pr}" fill="${OUT}"/>` +
      `<circle cx="${cx + off[0] + 1.5}" cy="${cy + off[1] - 1.5}" r="1.4" fill="#fff"/>`;
    switch (type) {
      case 'wide':
        return openEye(10, 12, 3, [gz[0] * 0.6, gz[1] * 0.6]) + lash;
      case 'happy':
        return `<path d="M${cx - 8},${cy + 3} Q${cx},${cy - 9} ${cx + 8},${cy + 3}" ${st}/>` + lash;
      case 'closed':
        return `<path d="M${cx - 8},${cy} Q${cx},${cy + 7} ${cx + 8},${cy}" ${st}/>` + lash;
      case 'squeeze':
        return side === 'L'
          ? `<path d="M${cx - 7},${cy - 6} L${cx + 6},${cy} L${cx - 7},${cy + 6}" ${st} stroke-linejoin="round"/>`
          : `<path d="M${cx + 7},${cy - 6} L${cx - 6},${cy} L${cx + 7},${cy + 6}" ${st} stroke-linejoin="round"/>`;
      case 'half':
        return (
          openEye(8, 10, 4.5, [gz[0], 3]) +
          `<rect x="${cx - 10}" y="${cy - 12}" width="20" height="11" fill="${skin}"/>` +
          `<path d="M${cx - 9},${cy - 1} L${cx + 9},${cy - 1}" ${st}/>`
        );
      case 'heart':
        return `<path d="M${cx},${cy + 9} C${cx - 16},${cy - 1} ${cx - 8},${cy - 13} ${cx},${cy - 5} C${cx + 8},${cy - 13} ${cx + 16},${cy - 1} ${cx},${cy + 9} Z" fill="#e8354a" stroke="${OUT}" stroke-width="2"/>`;
      case 'star': {
        let p = '';
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 4.5 : 11;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          p += `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)} `;
        }
        return `<polygon points="${p}" fill="#ffc93c" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>`;
      }
      case 'roll':
        return openEye(8, 10, 4.5, [0, -5.5]) + lash;
      case 'wink':
        return side === 'R' ? eye(cx, cy, 'happy', side, gz, skin, lashes) : openEye(8, 10, 4.5, gz) + lash;
      default:
        return openEye(8, 10, 4.5, gz) + lash;
    }
  }

  const BROWS = {
    normal: ['M72,70 Q82,64 92,69', 'M108,69 Q118,64 128,70'],
    raised: ['M72,63 Q82,56 92,62', 'M108,62 Q118,56 128,63'],
    angry: ['M72,63 L93,73', 'M107,73 L128,63'],
    sad: ['M72,72 L91,64', 'M109,64 L128,72'],
    flat: ['M72,70 L92,70', 'M108,70 L128,70'],
    oneRaised: ['M72,71 L92,71', 'M108,63 Q118,55 128,62']
  };

  function mouth(type) {
    const st = `stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    const dark = `fill="#6b1a28" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    const tongue = (d) => `<path d="${d}" fill="#f07c93"/>`;
    switch (type) {
      case 'neutral':
        return `<path d="M90,116 L110,116" ${st}/>`;
      case 'smile':
        return `<path d="M86,110 Q100,125 114,110" ${st}/>`;
      case 'smallSmile':
        return `<path d="M92,113 Q100,119 108,113" ${st}/>`;
      case 'bigSmile':
        return (
          `<path d="M84,108 Q100,111 116,108 Q114,129 100,129 Q86,129 84,108 Z" ${dark}/>` +
          `<path d="M87,110 Q100,112 113,110 L112,115 Q100,117 88,115 Z" fill="#fff"/>` +
          tongue('M92,125 Q100,118 108,125 Q100,129 92,125 Z')
        );
      case 'laugh':
        return (
          `<path d="M80,105 Q100,109 120,105 Q118,136 100,136 Q82,136 80,105 Z" ${dark}/>` +
          `<path d="M84,108 Q100,111 116,108 L115,113 Q100,115 85,113 Z" fill="#fff"/>` +
          tongue('M90,130 Q100,120 110,130 Q100,136 90,130 Z')
        );
      case 'sad':
        return `<path d="M88,121 Q100,109 112,121" ${st}/>`;
      case 'open':
        return `<ellipse cx="100" cy="118" rx="6" ry="8" ${dark}/>`;
      case 'openSmall':
        return `<ellipse cx="100" cy="117" rx="4" ry="3" ${dark}/>`;
      case 'shout':
        return `<ellipse cx="100" cy="119" rx="13" ry="12" ${dark}/>` + tongue('M91,126 Q100,119 109,126 Q100,131 91,126 Z');
      case 'teeth':
        return (
          `<rect x="85" y="110" width="30" height="12" rx="4" fill="#fff" stroke="${OUT}" stroke-width="3"/>` +
          `<path d="M86,116 L114,116 M93,110 L93,122 M100,110 L100,122 M107,110 L107,122" stroke="${OUT}" stroke-width="1.5"/>`
        );
      case 'wavy':
        return `<path d="M86,117 Q90,112 94,117 Q98,122 102,117 Q106,112 110,117 Q112,120 114,118" ${st}/>`;
      case 'smirk':
        return `<path d="M88,117 Q103,119 114,108" ${st}/>`;
      case 'smirkFlat':
        return `<path d="M90,117 L109,113" ${st}/>`;
      case 'tongue':
        return tongue('M95,116 Q95,131 102,131 Q109,131 108,116 Z') + `<path d="M95,120 Q95,131 102,131 Q109,131 108,119" fill="none" stroke="${OUT}" stroke-width="2.5"/>` + `<path d="M86,110 Q100,123 114,110" ${st}/>`;
      case 'whistle':
        return `<circle cx="104" cy="116" r="4.5" ${dark}/>`;
      case 'cry':
        return `<path d="M84,124 Q100,102 116,124 Q100,117 84,124 Z" ${dark}/>`;
      default:
        return `<path d="M90,116 L110,116" ${st}/>`;
    }
  }

  function extras(list, mirror) {
    // Aynalanmış karakterde yazılar ters görünmesin diye kendi merkezinde geri çevrilir
    const txt = (x, y, attrs, content) =>
      `<text x="${x}" y="${y}" text-anchor="middle" ${attrs}${mirror ? ` transform="translate(${2 * x},0) scale(-1,1)"` : ''}>${content}</text>`;
    let s = '';
    for (const e of list || []) {
      switch (e) {
        case 'blush':
          s += `<ellipse cx="70" cy="104" rx="9" ry="5" fill="#ff8fa3" opacity="0.65"/><ellipse cx="130" cy="104" rx="9" ry="5" fill="#ff8fa3" opacity="0.65"/>`;
          break;
        case 'blushLines':
          s += `<path d="M64,100 L60,108 M70,100 L66,108 M76,100 L72,108 M124,100 L120,108 M130,100 L126,108 M136,100 L132,108" stroke="#e35d78" stroke-width="2" stroke-linecap="round"/>`;
          break;
        case 'tears':
          s += `<path d="M76,96 Q72,116 78,134 M124,96 Q128,116 122,134" fill="none" stroke="#5ac8fa" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;
          break;
        case 'tearsJoy':
          s += `<path d="M64,86 Q56,98 62,102 Q70,100 64,86 Z M136,86 Q144,98 138,102 Q130,100 136,86 Z" fill="#8fd3ff" stroke="${OUT}" stroke-width="1.5"/>`;
          break;
        case 'sweat':
          s += `<path d="M146,48 Q156,64 146,70 Q136,64 146,48 Z" fill="#8fd3ff" stroke="${OUT}" stroke-width="2"/>`;
          break;
        case 'vein':
          s += `<g transform="translate(136,46)" stroke="#e63946" stroke-width="3" fill="none" stroke-linecap="round"><path d="M-9,-3 Q-3,-3 -3,-9"/><path d="M3,-9 Q3,-3 9,-3"/><path d="M9,3 Q3,3 3,9"/><path d="M-3,9 Q-3,3 -9,3"/></g>`;
          break;
        case 'zzz': {
          const a = 'font-family="Arial Black, Arial" font-weight="900" fill="#4a6fa5"';
          s += txt(147, 44, `${a} font-size="20"`, 'Z') + txt(162, 28, `${a} font-size="15"`, 'z') + txt(173, 16, `${a} font-size="11"`, 'z');
          break;
        }
        case 'notes':
          s += txt(124, 116, `font-family="Segoe UI Symbol, Arial" font-size="18" fill="${OUT}"`, '♪') + txt(137, 100, `font-family="Segoe UI Symbol, Arial" font-size="14" fill="${OUT}"`, '♫');
          break;
        case 'lines':
          s += `<path d="M84,44 L84,60 M94,40 L94,60 M104,40 L104,60 M114,44 L114,60" stroke="#6b7bd6" stroke-width="2.5" opacity="0.8"/>`;
          break;
        case 'question':
          s += txt(155, 44, `font-family="Arial Black, Arial" font-weight="900" font-size="30" fill="#f4a261" stroke="${OUT}" stroke-width="1.5"`, '?');
          break;
      }
    }
    return s;
  }

  function beard(c) {
    const col = c.hairColor === 'none' ? '#333' : c.hairColor;
    const f = `fill="${col}" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (c.beard) {
      case 'sakal':
        return `<path d="M57,92 Q56,146 100,146 Q144,146 143,92 Q140,122 122,124 Q112,106 100,106 Q88,106 78,124 Q60,122 57,92 Z" ${f}/>`;
      case 'biyik':
        return `<path d="M84,109 Q100,100 116,109 Q108,114 100,110 Q92,114 84,109 Z" ${f}/>`;
      case 'kecisakal':
        return `<path d="M90,127 Q100,146 110,127 Q100,131 90,127 Z" ${f}/>` + `<path d="M86,108 Q100,102 114,108 Q100,108 86,108 Z" ${f}/>`;
      default:
        return '';
    }
  }

  function glasses(type) {
    const st = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    const arms = `<path d="M69,84 L57,82 M131,84 L143,82 M95,86 Q100,82 105,86" fill="none" ${st}/>`;
    switch (type) {
      case 'yuvarlak':
        return `<circle cx="82" cy="87" r="13" fill="#fff" fill-opacity="0.15" ${st}/><circle cx="118" cy="87" r="13" fill="#fff" fill-opacity="0.15" ${st}/>` + arms;
      case 'kare':
        return `<rect x="68" y="77" width="28" height="20" rx="4" fill="#fff" fill-opacity="0.15" ${st}/><rect x="104" y="77" width="28" height="20" rx="4" fill="#fff" fill-opacity="0.15" ${st}/>` + arms;
      case 'gunes':
        return (
          `<path d="M66,78 L97,78 L95,92 Q82,100 70,92 Z" fill="#111" ${st}/><path d="M103,78 L134,78 L130,92 Q118,100 105,92 Z" fill="#111" ${st}/>` +
          `<path d="M72,82 L80,82" stroke="#fff" stroke-width="2" opacity="0.6"/><path d="M109,82 L117,82" stroke="#fff" stroke-width="2" opacity="0.6"/>` +
          arms
        );
      default:
        return '';
    }
  }

  function torso(c) {
    const body = `M72,142 Q100,136 128,142 Q142,147 139,168 L133,272 L67,272 L61,168 Q58,147 72,142 Z`;
    const col = c.topColor;
    const f = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    let s = '';
    if (c.top === 'kapusonlu') {
      s += `<path d="M70,146 Q70,124 100,124 Q130,124 130,146 Z" fill="${shade(col, -0.25)}" ${f}/>`;
    }
    if (c.top === 'elbise') {
      s += `<path d="M64,238 L136,238 L156,316 Q100,328 44,316 Z" fill="${col}" ${f}/>`;
    }
    s += `<path d="${body}" fill="${col}" ${f}/>`;
    s += `<rect x="90" y="124" width="20" height="22" fill="${c.skin}" stroke="${OUT}" stroke-width="3"/>`;
    switch (c.top) {
      case 'tisort':
      case 'elbise':
        s += `<path d="M86,141 Q100,156 114,141 Z" fill="${c.skin}" ${f}/>`;
        if (c.top === 'elbise') s += `<path d="M64,238 Q100,246 136,238" fill="none" stroke="${shade(col, -0.3)}" stroke-width="5"/>`;
        break;
      case 'gomlek':
        s += `<path d="M99,150 L105,150 L109,208 L102,218 L95,208 Z" fill="#c0392b" ${f}/>`;
        s += `<path d="M86,139 L101,153 L92,163 L81,145 Z" fill="#fff" ${f}/><path d="M114,139 L99,153 L108,163 L119,145 Z" fill="#fff" ${f}/>`;
        break;
      case 'ceket':
        s += `<path d="M86,140 L100,200 L114,140 Z" fill="#f4f4f4" ${f}/>`;
        s += `<path d="M98,152 L102,152 L104,190 L100,197 L96,190 Z" fill="#8e2c2c"/>`;
        s += `<path d="M86,140 L96,180 L82,168 Z M114,140 L104,180 L118,168 Z" fill="${shade(col, -0.25)}" ${f}/>`;
        s += `<circle cx="100" cy="216" r="3" fill="${OUT}"/><circle cx="100" cy="240" r="3" fill="${OUT}"/>`;
        break;
      case 'kazak':
        s += `<path d="M86,141 Q100,152 114,141" fill="none" stroke="${shade(col, -0.3)}" stroke-width="7"/>`;
        s += `<path d="M62,196 L138,196 M63,212 L137,212" stroke="${shade(col, 0.35)}" stroke-width="6"/>`;
        s += `<path d="M67,262 L133,262" stroke="${shade(col, -0.3)}" stroke-width="7"/>`;
        break;
      case 'kapusonlu':
        s += `<path d="M92,146 L90,176 M108,146 L110,176" stroke="#f4f4f4" stroke-width="3" stroke-linecap="round"/>`;
        s += `<path d="M78,226 L122,226 L128,258 L72,258 Z" fill="${shade(col, -0.12)}" ${f}/>`;
        break;
    }
    return s;
  }

  function hand(p, type, dir, skin) {
    let s = '';
    const fingerLen = 15;
    if (type === 'point' || type === 'thumb' || type === 'finger') {
      let d = dir;
      if (type === 'thumb' || type === 'finger') d = [0, -1];
      const tip = [p[0] + d[0] * fingerLen, p[1] + d[1] * fingerLen];
      const path = `M${p[0]},${p[1]} L${tip[0].toFixed(1)},${tip[1].toFixed(1)}`;
      s += `<path d="${path}" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="${path}" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>`;
    }
    const r = type === 'open' ? 11.5 : 9.5;
    s += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${skin}" stroke="${OUT}" stroke-width="3"/>`;
    if (type === 'open') {
      s += `<path d="M${p[0] - 5},${p[1] - 4} L${p[0] - 5},${p[1] + 2} M${p[0]},${p[1] - 5} L${p[0]},${p[1] + 2} M${p[0] + 5},${p[1] - 4} L${p[0] + 5},${p[1] + 2}" stroke="${shade(skin, -0.35)}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    return s;
  }

  function drawArm(a, c) {
    const [sh, el, hd] = a.pts;
    let s = '';
    const shortSleeve = c.top === 'tisort' || c.top === 'elbise';
    if (shortSleeve) {
      s += limb([sh, el, hd], c.skin, 15);
      const mid = [sh[0] + (el[0] - sh[0]) * 0.55, sh[1] + (el[1] - sh[1]) * 0.55];
      s += limb([sh, mid], c.topColor, 19);
    } else {
      s += limb([sh, el, hd], c.topColor, 17);
    }
    const dx = hd[0] - el[0];
    const dy = hd[1] - el[1];
    const len = Math.hypot(dx, dy) || 1;
    s += hand(hd, a.hand, [dx / len, dy / len], c.skin);
    return s;
  }

  function propBack(prop, pose, opts) {
    const f = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    if (prop === 'kitap') {
      return (
        `<path d="M72,176 L100,186 L128,176 L128,212 L100,222 L72,212 Z" fill="#e63946" ${f}/>` +
        `<path d="M76,176 L100,184 L124,176 L124,206 L100,214 L76,206 Z" fill="#fffdf5" ${f}/>` +
        `<path d="M100,184 L100,214" stroke="${OUT}" stroke-width="2"/>` +
        `<path d="M82,188 L95,192 M82,196 L95,200 M105,192 L118,188 M105,200 L118,196" stroke="#999" stroke-width="1.5"/>`
      );
    }
    if (prop === 'pano') {
      const text = esc(opts.boardText || '');
      const lines = text.split(/\n/).slice(0, 3);
      let t = '';
      lines.forEach((ln, i) => {
        t += `<text x="100" y="${196 + (i - (lines.length - 1) / 2) * 20}" text-anchor="middle" dominant-baseline="middle" font-family="Comic Sans MS, Arial" font-weight="bold" font-size="17" fill="${OUT}">${ln}</text>`;
      });
      if (opts.mirror) t = `<g transform="translate(200,0) scale(-1,1)">${t}</g>`;
      return `<rect x="46" y="156" width="108" height="80" rx="4" fill="#fffdf2" ${f}/>` + t;
    }
    return '';
  }

  function propFront(prop, pose) {
    const f = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    const h = pose.R.pts[2];
    if (prop === 'kahve') {
      return (
        `<path d="M${h[0] - 20},${h[1] - 32} q-4,-6 0,-12 M${h[0] - 12},${h[1] - 32} q-4,-6 0,-12" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M${h[0] - 4},${h[1] - 18} q10,0 10,8 q0,8 -10,8" fill="none" ${f}/>` +
        `<rect x="${h[0] - 28}" y="${h[1] - 26}" width="24" height="28" rx="4" fill="#fff" ${f}/>` +
        `<rect x="${h[0] - 28}" y="${h[1] - 16}" width="24" height="9" fill="#b07d4f"/>`
      );
    }
    if (prop === 'telefon') {
      return (
        `<rect x="${h[0] - 10}" y="${h[1] - 30}" width="20" height="34" rx="4" fill="#222" ${f}/>` +
        `<rect x="${h[0] - 6}" y="${h[1] - 26}" width="12" height="24" rx="2" fill="#7fd1ff"/>`
      );
    }
    return '';
  }

  // Tam karakter SVG içeriği (200x400 koordinatlarda)
  function render(c, opts = {}) {
    const emo = EMOTIONS[opts.emotion] || EMOTIONS.notr;
    const pose = POSES[opts.pose] || POSES.normal;
    const legsName = opts.legs && opts.legs !== 'oto' ? opts.legs : pose.legs || 'ayakta';
    const legs = LEG_POS[legsName] || LEG_POS.ayakta;
    const gazeName = opts.gaze && opts.gaze !== 'oto' ? opts.gaze : pose.gaze || emo.gaze || 'merkez';
    const gz = GAZE_OFFSET[gazeName] || [0, 0];
    const f = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;

    let s = hairBack(c);

    // Bacaklar ve ayakkabılar
    const dress = c.top === 'elbise';
    const legColor = dress ? c.skin : c.bottomColor;
    const legW = dress ? 13 : 20;
    for (const side of ['L', 'R']) {
      const pts = legs[side];
      s += limb(pts, legColor, legW);
    }
    for (const side of ['L', 'R']) {
      const foot = legs[side][2];
      const dx = side === 'L' ? -5 : 5;
      s += `<ellipse cx="${foot[0] + dx}" cy="${foot[1] + 6}" rx="15" ry="8" fill="${c.shoeColor}" ${f}/>`;
    }
    if (!dress) s += `<path d="M65,256 L135,256 L137,292 L63,292 Z" fill="${c.bottomColor}" ${f}/>`;
    s += `<path d="M65,262 L135,262" stroke="${shade(c.bottomColor, -0.35)}" stroke-width="5"/>`;

    s += torso(c);

    // Baş
    s += `<circle cx="57" cy="92" r="9" fill="${c.skin}" ${f}/><circle cx="143" cy="92" r="9" fill="${c.skin}" ${f}/>`;
    s += `<ellipse cx="100" cy="85" rx="44" ry="50" fill="${c.skin}" ${f}/>`;
    if (c.beard === 'sakal') s += beard(c);
    s += eye(82, 87, emo.eyes, 'L', gz, c.skin, c.lashes);
    s += eye(118, 87, emo.eyes, 'R', gz, c.skin, c.lashes);
    const brows = BROWS[emo.brows] || BROWS.normal;
    const browColor = c.hair === 'kel' ? shade(c.hairColor, -0.4) : shade(c.hairColor, -0.15);
    s += `<path d="${brows[0]}" fill="none" stroke="${browColor}" stroke-width="4" stroke-linecap="round"/><path d="${brows[1]}" fill="none" stroke="${browColor}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M100,95 Q105,103 98,105" fill="none" stroke="${shade(c.skin, -0.35)}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += mouth(emo.mouth);
    if (c.beard !== 'sakal') s += beard(c);
    s += extras(emo.extras, opts.mirror);
    s += hairFront(c);
    s += glasses(c.glasses);
    s += hat(c);

    // Kollar ve eşyalar
    s += propBack(pose.prop, pose, opts);
    s += drawArm(pose.L, c);
    s += drawArm(pose.R, c);
    s += propFront(pose.prop, pose);
    return s;
  }

  window.Characters = {
    OUT,
    shade,
    esc,
    render,
    PRESETS,
    EMOTIONS,
    POSES,
    HAIR_STYLES,
    TOPS,
    GLASSES,
    BEARDS,
    HATS,
    LEGS,
    GAZES,
    SKINS,
    WIDTH: 200,
    HEIGHT: 400
  };
})();
