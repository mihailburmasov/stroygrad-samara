// Генерация фирменных ассетов: favicon, apple-touch-icon, логотип 512, og.jpg (1200×630)
// Палитра — как в шапке сайта: стальной градиент + золотой знак (см. --gold,
// --hdr-steel-* в public/css/style.css). При смене цветов шапки поправить и тут.
import sharp from 'sharp';
import fs from 'fs';

const GOLD = '#a9812f';
const INK = '#14202e';
const STEEL_1 = '#dfe2e5', STEEL_2 = '#c1c5ca', STEEL_3 = '#989ea4';
const STEEL_FLAT = '#c7cbd0';
const steelDefs = `<defs><linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${STEEL_1}"/><stop offset=".55" stop-color="${STEEL_2}"/><stop offset="1" stop-color="${STEEL_3}"/></linearGradient></defs>`;
const mark = (color) => `<path d="M20 2 37 11.5v21L20 42 3 32.5v-21z" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 32V21h4.5v11M17.5 32V14h5v18M24.5 32V19H29v13" fill="${color}"/><path d="M9.5 32h21" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-6 -4 52 52">${steelDefs}<rect x="-6" y="-4" width="52" height="52" rx="10" fill="url(#steel)"/>${mark(GOLD)}</svg>`;

fs.mkdirSync('public/img', { recursive: true });
fs.writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 52 52">${steelDefs}<rect x="-6" y="-4" width="52" height="52" rx="10" fill="url(#steel)"/>${mark(GOLD)}</svg>`);
await sharp(Buffer.from(iconSvg(32))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(iconSvg(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(iconSvg(512))).png().toFile('public/img/logo-512.png');

// OG-картинка — та же стальная+золотая палитра, что у фавикона
const W = 1200, H = 630;
const photo = await sharp('public/img/hero/collage-home.webp').resize(860, H, { fit: 'cover', position: 'right' }).flatten({ background: STEEL_FLAT }).toBuffer();
const fade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${STEEL_FLAT}" stop-opacity="1"/><stop offset=".42" stop-color="${STEEL_FLAT}" stop-opacity=".92"/><stop offset="1" stop-color="${STEEL_FLAT}" stop-opacity=".25"/></linearGradient><radialGradient id="sheen" cx="18%" cy="10%" r="70%"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#sheen)"/></svg>`);
const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(70,70) scale(1.7)">${mark(GOLD)}</g>
<text x="70" y="290" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="92" fill="${GOLD}" letter-spacing="2">СТРОЙГРАД</text>
<text x="72" y="345" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${GOLD}">Строительная компания · Самара</text>
<text x="72" y="430" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${INK}">Кровля, фасады, подъезды, лифты,</text>
<text x="72" y="474" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${INK}">асфальт, электрика, окна и двери</text>
<text x="72" y="556" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" fill="${INK}">СРО · Гарантия до 5 лет · С 2012 года</text>
</svg>`);
await sharp({ create: { width: W, height: H, channels: 3, background: STEEL_FLAT } })
  .composite([{ input: photo, left: W - 860, top: 0 }, { input: fade }, { input: text }])
  .jpeg({ quality: 82 }).toFile('public/og.jpg');
console.log('brand assets ok');
