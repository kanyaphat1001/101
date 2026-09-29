// ---------- ข้อมูลตั้งต้น: แม่สี 3 สี ----------
const PRIMARY_COLORS = [
  { name: 'แดง', rgb: [224, 49, 49] },
  { name: 'เหลือง', rgb: [255, 209, 70] },
  { name: 'น้ำเงิน', rgb: [37, 72, 190] },
];

// แถบชื่อสีตามค่า Hue (องศา 0-360) แบ่งละเอียดขึ้นให้ได้ชื่อหลากหลาย
const HUE_BANDS = [
  { max: 10, name: 'แดง' },
  { max: 20, name: 'แดงส้ม' },
  { max: 35, name: 'ส้ม' },
  { max: 48, name: 'ส้มเหลือง' },
  { max: 60, name: 'เหลือง' },
  { max: 75, name: 'เหลืองมะนาว' },
  { max: 95, name: 'มะกอก' },
  { max: 115, name: 'เขียวอมเหลือง' },
  { max: 135, name: 'เขียว' },
  { max: 155, name: 'เขียวมรกต' },
  { max: 172, name: 'เขียวหยก' },
  { max: 188, name: 'ฟ้าทะเล' },
  { max: 205, name: 'ฟ้า' },
  { max: 222, name: 'ฟ้าน้ำเงิน' },
  { max: 240, name: 'น้ำเงิน' },
  { max: 258, name: 'น้ำเงินคราม' },
  { max: 272, name: 'คราม' },
  { max: 288, name: 'ม่วง' },
  { max: 302, name: 'ม่วงบานเย็น' },
  { max: 316, name: 'บานเย็น' },
  { max: 330, name: 'ชมพูม่วง' },
  { max: 345, name: 'ชมพู' },
  { max: 355, name: 'กุหลาบ' },
  { max: 361, name: 'แดง' },
];

// คำขยายเพิ่มเติมไว้แก้ปัญหาชื่อซ้ำเมื่อสีเยอะขึ้นเรื่อย ๆ
const EXTRA_ADJECTIVES = [
  'สด', 'นวล', 'หม่น', 'ประกาย', 'ทึม', 'ใส', 'มัว', 'ดิน', 'ฝุ่น', 'หวาน',
  'อมควัน', 'อมทอง', 'อมเทา', 'เรือง', 'ซีด', 'แก่', 'อ่อนละมุน', 'เข้มขลับ', 'สนิม', 'พาสเทล',
];

let palette = [];       // {id, name, rgb, hex}
let usedNames = new Set();
let selected = [];      // เก็บ id ที่เลือกไว้ (สูงสุด 2)
let nextId = 0;
let ratio = 50;         // % ของสีที่ 1 (สีที่ 2 = 100 - ratio)

// ---------- แปลงค่าสี ----------
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

// ผสมสีแบบลบ (คล้ายสีสีน้ำ/สีโปสเตอร์) ผ่าน CMY แทนการเฉลี่ย RGB ตรง ๆ
// weightA = สัดส่วนของสี a (0-1) เช่น 0.7 คือใส่สี a 70% สี b 30%
function mixRgb(a, b, weightA = 0.5) {
  const wA = Math.min(1, Math.max(0, weightA));
  const wB = 1 - wA;
  const toCmy = ([r, g, b]) => [1 - r / 255, 1 - g / 255, 1 - b / 255];
  const [c1, m1, y1] = toCmy(a);
  const [c2, m2, y2] = toCmy(b);
  const c = c1 * wA + c2 * wB, m = m1 * wA + m2 * wB, y = y1 * wA + y2 * wB;
  const mixed = [(1 - c) * 255, (1 - m) * 255, (1 - y) * 255];
  return mixed.map(v => Math.max(0, Math.min(255, v)));
}

// ---------- ตั้งชื่อสีภาษาไทย ----------
function hueName(h) {
  const band = HUE_BANDS.find(b => h < b.max);
  return band ? band.name : 'แดง';
}

function baseColorName(rgb) {
  const { h, s, l } = rgbToHsl(rgb);
  if (s < 12) {
    if (l > 85) return 'ขาว';
    if (l < 15) return 'ดำ';
    return 'เทา';
  }
  const hue = hueName(h);
  let modifier = '';
  if (l < 30) modifier = 'เข้ม';
  else if (l > 72) modifier = 'อ่อน';
  else if (s < 30) modifier = 'หม่น';
  return modifier ? `${hue}${modifier}` : hue;
}

function uniqueColorName(rgb) {
  const base = baseColorName(rgb);
  if (!usedNames.has(base)) return base;
  for (const adj of EXTRA_ADJECTIVES) {
    const candidate = `${base}${adj}`;
    if (!usedNames.has(candidate)) return candidate;
  }
  // กันชื่อซ้ำขั้นสุดท้าย: ใส่ลำดับต่อท้าย
  let n = 2;
  while (usedNames.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

// ---------- จัดการ state / UI ----------
function addColor(name, rgb) {
  const c = { id: nextId++, name, rgb, hex: rgbToHex(rgb) };
  palette.push(c);
  usedNames.add(name);
  return c;
}

function init() {
  palette = [];
  usedNames = new Set();
  selected = [];
  nextId = 0;
  PRIMARY_COLORS.forEach(p => addColor(p.name, p.rgb));
  document.getElementById('resultCard').hidden = true;
  renderPalette();
  renderSlots();
}

function renderPalette() {
  const wrap = document.getElementById('palette');
  wrap.innerHTML = '';
  palette.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'swatch' + (selected.includes(c.id) ? ' selected' : '');
    btn.style.background = c.hex;
    btn.textContent = c.name;
    btn.setAttribute('aria-pressed', selected.includes(c.id));
    btn.addEventListener('click', () => toggleSelect(c.id));
    wrap.appendChild(btn);
  });
  document.getElementById('countBadge').textContent = `${palette.length} สี`;
}

function renderSlots() {
  ['A', 'B'].forEach((key, i) => {
    const slot = document.getElementById('slot' + key);
    const id = selected[i];
    const c = palette.find(p => p.id === id);
    slot.classList.toggle('filled', !!c);
    slot.style.background = c ? c.hex : '';
    slot.innerHTML = `<span class="slot-label">${c ? c.name : 'สีที่ ' + (i + 1)}</span>`;
  });
  const ready = selected.length === 2;
  document.getElementById('mixBtn').disabled = !ready;
  document.getElementById('dishWrap').hidden = !ready;
  document.getElementById('ratioRow').hidden = !ready;
  if (ready) updateDish();
}

function currentPair() {
  const a = palette.find(p => p.id === selected[0]);
  const b = palette.find(p => p.id === selected[1]);
  return [a, b];
}

function updateDish() {
  const [a, b] = currentPair();
  if (!a || !b) return;
  const preview = mixRgb(a.rgb, b.rgb, ratio / 100);
  document.getElementById('dish').style.background = rgbToHex(preview);
  document.getElementById('ratioLabelA').textContent = `${a.name} ${ratio}%`;
  document.getElementById('ratioLabelB').textContent = `${b.name} ${100 - ratio}%`;
}

function toggleSelect(id) {
  if (selected.includes(id)) {
    selected = selected.filter(x => x !== id);
  } else {
    if (selected.length === 2) selected.shift();
    selected.push(id);
  }
  ratio = 50; // เลือกคู่ใหม่ทุกครั้ง เริ่มที่สัดส่วนเท่ากันก่อน
  document.getElementById('ratioSlider').value = 50;
  renderPalette();
  renderSlots();
}

function mixSelected() {
  if (selected.length !== 2) return;
  const [a, b] = currentPair();
  const rgb = mixRgb(a.rgb, b.rgb, ratio / 100);
  const name = uniqueColorName(rgb);
  const created = addColor(name, rgb);

  document.getElementById('resultSwatch').style.background = created.hex;
  document.getElementById('resultName').textContent = created.name;
  document.getElementById('resultHex').textContent =
    `จาก ${a.name} ${ratio}% + ${b.name} ${100 - ratio}% → ${created.hex}`;
  const card = document.getElementById('resultCard');
  card.hidden = false;
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';

  selected = [];
  renderPalette();
  renderSlots();
}

document.getElementById('mixBtn').addEventListener('click', mixSelected);
document.getElementById('resetBtn').addEventListener('click', init);
document.getElementById('ratioSlider').addEventListener('input', (e) => {
  ratio = Number(e.target.value);
  updateDish();
});

init();

// ---------- PWA: ลงทะเบียน service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
