// Генерация фирменных ассетов: знак «СГ + пирамида» (векторная перерисовка логотипа
// клиента, 2026-09), favicon, apple-touch-icon, логотип 512, og.png (600×600).
// Знак — золото на тёмной плашке, как в исходном логотипе. Вывод:
//   public/img/logo.svg, public/favicon.svg, *.png и строка для LOGO_MARK (app/lib/icons.php).
// Запуск: node scripts/make-brand-assets.mjs  (после — вставить LOGO_MARK из вывода в icons.php)
import sharp from 'sharp';
import fs from 'fs';

const PLATE_1 = '#3b3e44', PLATE_2 = '#2a2d32';
const r = (n) => Math.round(n * 10) / 10;

// «С»: кольцо из двух эллипсов с радиальными срезами концов (±31°)
function letterC() {
  const cx = 130, cy = 134.5, oa = 130, ob = 135.5, ia = 59, ib = 76, ang = 31 * Math.PI / 180;
  const pt = (a, b, t) => { // точка эллипса в полярном направлении t
    const rr = 1 / Math.sqrt((Math.cos(t) / a) ** 2 + (Math.sin(t) / b) ** 2);
    return [r(cx + rr * Math.cos(t)), r(cy + rr * Math.sin(t))];
  };
  const [o1x, o1y] = pt(oa, ob, -ang), [o2x, o2y] = pt(oa, ob, ang);
  const [i1x, i1y] = pt(ia, ib, -ang), [i2x, i2y] = pt(ia, ib, ang);
  return `M${o1x} ${o1y}A${oa} ${ob} 0 1 0 ${o2x} ${o2y}L${i2x} ${i2y}A${ia} ${ib} 0 1 1 ${i1x} ${i1y}Z`;
}
// «Г»
const letterG = 'M295 0H501V62H365V267H295Z';
// Пирамида: вершина (530, 92), основание y=266, 4 полосы
function band(y1, y2) {
  const hw = (y) => 0.655 * (y - 92);
  return `M${r(530 - hw(y1))} ${y1}H${r(530 + hw(y1))}L${r(530 + hw(y2))} ${y2}H${r(530 - hw(y2))}Z`;
}

function markSvg(id, { plate = true, attrs = '' } = {}) {
  const g = (n) => `${id}${n}`;
  const defs = `<defs>`
    + `<linearGradient id="${g('p')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PLATE_1}"/><stop offset="1" stop-color="${PLATE_2}"/></linearGradient>`
    + `<linearGradient id="${g('g')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="270"><stop offset="0" stop-color="#e6cd92"/><stop offset=".45" stop-color="#cfae6f"/><stop offset="1" stop-color="#8f6a39"/></linearGradient>`
    + `<linearGradient id="${g('s')}" gradientUnits="userSpaceOnUse" x1="470" y1="0" x2="590" y2="0"><stop offset="0" stop-color="#a9aba8"/><stop offset="1" stop-color="#f4f4f1"/></linearGradient>`
    + `<linearGradient id="${g('c')}" gradientUnits="userSpaceOnUse" x1="430" y1="0" x2="630" y2="0"><stop offset="0" stop-color="#c9ab76"/><stop offset="1" stop-color="#eedcb8"/></linearGradient>`
    + `</defs>`;
  const vb = plate ? '-60 -55 765 380' : '0 -1 646 272';
  return `<svg${attrs} viewBox="${vb}">${defs}`
    + (plate ? `<rect x="-60" y="-55" width="765" height="380" rx="56" fill="url(#${g('p')})"/>` : '')
    + `<path d="${letterC()}${letterG}${band(92, 119)}${band(229, 266)}" fill="url(#${g('g')})"/>`
    + `<path d="${band(130, 176)}" fill="url(#${g('s')})"/>`
    + `<path d="${band(185, 220)}" fill="url(#${g('c')})"/>`
    + `</svg>`;
}

// Квадратная иконка: тёмный фон, знак по центру
function iconSvg(size, { rounded = true } = {}) {
  const w = 765 * 0.86, s = w / 646, h = 272 * s, x = (765 - w) / 2, y = (765 - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg"${size ? ` width="${size}" height="${size}"` : ''} viewBox="0 0 765 765">`
    + `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PLATE_1}"/><stop offset="1" stop-color="${PLATE_2}"/></linearGradient></defs>`
    + `<rect width="765" height="765"${rounded ? ' rx="130"' : ''} fill="url(#bg)"/>`
    + `<g transform="translate(${r(x)} ${r(y - 0)}) scale(${s.toFixed(4)}) translate(0 1)">${markSvg('i', { plate: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
}

fs.mkdirSync('public/img', { recursive: true });
fs.writeFileSync('public/img/logo.svg', markSvg('m', { attrs: ' xmlns="http://www.w3.org/2000/svg"' }));
fs.writeFileSync('public/favicon.svg', iconSvg(0));
await sharp(Buffer.from(iconSvg(32))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(iconSvg(180, { rounded: false }))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(iconSvg(512))).png().toFile('public/img/logo-512.png');
// Превью для мессенджеров — квадрат без скруглений (мессенджеры сами скругляют миниатюру;
// прозрачные углы где-то становятся чёрными)
await sharp(Buffer.from(iconSvg(600, { rounded: false }))).png().toFile('public/og.png');

console.log("const LOGO_MARK = '" + markSvg('sgl', { attrs: ' class="logo__mark" aria-hidden="true" focusable="false"' }) + "';");
