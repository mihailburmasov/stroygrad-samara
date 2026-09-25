// Генерация фирменных ассетов: favicon, apple-touch-icon, логотип 512, og.png (600×600)
// Палитра — как в шапке сайта: стальной градиент + золотой знак (см. --gold,
// --hdr-steel-* в public/css/style.css). При смене цветов шапки поправить и тут.
import sharp from 'sharp';
import fs from 'fs';

const GOLD = '#a9812f';
const STEEL_1 = '#dfe2e5', STEEL_2 = '#c1c5ca', STEEL_3 = '#989ea4';
const steelDefs = `<defs><linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${STEEL_1}"/><stop offset=".55" stop-color="${STEEL_2}"/><stop offset="1" stop-color="${STEEL_3}"/></linearGradient></defs>`;
const mark = (color) => `<path d="M20 2 37 11.5v21L20 42 3 32.5v-21z" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 32V21h4.5v11M17.5 32V14h5v18M24.5 32V19H29v13" fill="${color}"/><path d="M9.5 32h21" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-6 -4 52 52">${steelDefs}<rect x="-6" y="-4" width="52" height="52" rx="10" fill="url(#steel)"/>${mark(GOLD)}</svg>`;

fs.mkdirSync('public/img', { recursive: true });
fs.writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 52 52">${steelDefs}<rect x="-6" y="-4" width="52" height="52" rx="10" fill="url(#steel)"/>${mark(GOLD)}</svg>`);
await sharp(Buffer.from(iconSvg(32))).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(iconSvg(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(iconSvg(512))).png().toFile('public/img/logo-512.png');

// Превью для мессенджеров и соцсетей — тот же знак, что фавикон, квадратом без скруглений
// (мессенджеры сами скругляют миниатюру; прозрачные углы где-то становятся чёрными)
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="-6 -4 52 52">${steelDefs}<rect x="-6" y="-4" width="52" height="52" fill="url(#steel)"/>${mark(GOLD)}</svg>`)).png().toFile('public/og.png');
console.log('brand assets ok');
