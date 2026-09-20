// Генерация фирменных ассетов: favicon, apple-touch-icon, логотип 512, og.jpg (1200×630)
import sharp from 'sharp';
import fs from 'fs';

const AMBER = '#f5a800';
const mark = (color) => `<path d="M20 2 37 11.5v21L20 42 3 32.5v-21z" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 32V21h4.5v11M17.5 32V14h5v18M24.5 32V19H29v13" fill="${color}"/><path d="M9.5 32h21" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-6 -4 52 52"><rect x="-6" y="-4" width="52" height="52" rx="10" fill="#0e1116"/>${mark(AMBER)}</svg>`;

fs.mkdirSync('public/img', { recursive: true });
fs.writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 52 52"><rect x="-6" y="-4" width="52" height="52" rx="10" fill="#0e1116"/>${mark(AMBER)}</svg>`);
await sharp(Buffer.from(iconSvg(32))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(iconSvg(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(iconSvg(512))).png().toFile('public/img/logo-512.png');

// OG-картинка
const W = 1200, H = 630;
const photo = await sharp('public/img/roof-01.webp').resize(760, H, { fit: 'cover' }).toBuffer();
const fade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0e1116" stop-opacity="1"/><stop offset=".42" stop-color="#0e1116" stop-opacity=".92"/><stop offset="1" stop-color="#0e1116" stop-opacity=".25"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(70,70) scale(1.7)">${mark(AMBER)}</g>
<text x="70" y="290" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="92" fill="#ffffff" letter-spacing="2">СТРОЙГРАД</text>
<text x="72" y="345" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#f5a800">Строительная компания · Самара</text>
<text x="72" y="430" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#e6e9ee">Кровля, фасады, подъезды, лифты,</text>
<text x="72" y="474" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#e6e9ee">асфальт, электрика, окна и двери</text>
<text x="72" y="556" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" fill="#ffffff">СРО · Гарантия до 5 лет · С 2012 года</text>
</svg>`);
await sharp({ create: { width: W, height: H, channels: 3, background: '#0e1116' } })
  .composite([{ input: photo, left: W - 760, top: 0 }, { input: fade }, { input: text }])
  .jpeg({ quality: 82 }).toFile('public/og.jpg');
console.log('brand assets ok');
