// Hero-арт из рекламных обложек клиента (папка «Фото обложки») + коллажи из реальных
// фото объектов (public/img). Коллажи и часть страниц-каталогов используют реальные фото —
// они не апскейлятся, без риска зацепить текст/логотип с исходных рекламных макетов и
// не повторяются между страницами. AI-арт из обложек оставлен только там, где реальных фото
// по теме нет (facade, spec) или он даёт нужный «премиальный» акцент (roof, roof2, lift, doors).
// Запуск: npm run art  (нужен npm install; исходники — на диске клиента)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'D:/Claude/Создание сайтов/Клиенты/Юра Самара Стройград/Стройка/Фото обложки';
const OUT = path.resolve('public/img/hero');
fs.mkdirSync(OUT, { recursive: true });
const F = {
  spec: '9efbb6a3-13ed-4075-9474-b97f4170446c.jpg',
  facade: 'b330353b-48d1-464c-9772-a44bbb7c4bcc.jpg',
  doors: 'b8cc5ccb-4bd6-4b51-b13b-a1ec9e1a22f7.jpg',
  collage: 'c91293c9-4ba6-4dd8-9816-abf49bcf3719.jpg',
  lift: 'e4c2b3da-315f-45d3-8c46-089e58fe5476.jpg',
  roof: '8c767d51-8628-451f-8a82-f4f7a59c1876.jpg',
};
// name: [file, left, top, width, height] — прямоугольники без текста, логотипов и бликов
const CROPS = {
  roof: ['collage', 0, 0, 640, 315],       // кровельщики на закате, кран (ниже — золотой шеврон логотипа, обрезан)
  roof2: ['roof', 0, 885, 500, 270],       // кровельщик на скатной кровле (выше — золотая линия и текст, обрезаны)
  facade: ['facade', 640, 0, 384, 580],    // работы на фасаде с лесов (левее — блики-звёзды логотипа, обрезаны)
  doors: ['doors', 600, 0, 424, 430],      // окна
  lift: ['lift', 640, 0, 384, 490],        // лифт
  spec: ['spec', 570, 20, 454, 440],       // экскаватор-погрузчик — небо осветляем ниже
};
// лёгкая коррекция яркости отдельных кадров (небо в этом кадре пасмурное)
const BRIGHTEN = { spec: 1.22 };
const crop = (name) => { const [f, left, top, width, height] = CROPS[name]; return sharp(path.join(SRC, F[f])).extract({ left, top, width, height }); };

// одиночные hero-картинки: увеличение + резкость (источники — небольшие вырезки
// из обложек 1024×1536, поэтому апскейл неизбежен; берём максимум резкости без ореолов)
for (const name of Object.keys(CROPS)) {
  const [, , , w] = CROPS[name];
  let img = crop(name).resize({ width: Math.round(Math.max(w * 2.35, 950)), kernel: 'lanczos3' }).sharpen({ sigma: 0.8 });
  if (BRIGHTEN[name]) img = img.modulate({ brightness: BRIGHTEN[name] });
  await img.webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
}

// реальные фото объектов (public/img) как плитки коллажей — свои, не апскейленные, дневной свет
const P = id => ({ input: sharp(path.resolve('public/img', id + '.webp')) });

// диагональные коллажи: полосы со срезом, светлые линии между ними
async function collage(file, tiles, { W = 1500, H = 878, slant = 139, gap = 11 } = {}) {
  const n = tiles.length;
  const sw = Math.round((W + slant - (n - 1) * gap) / n);
  const comps = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * (sw + gap) - slant / 2);
    const tw = sw + slant;
    const img = await tiles[i].input.resize(tw, H, { fit: 'cover', position: tiles[i].pos || 'centre', kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }).toBuffer();
    const mask = Buffer.from(`<svg width="${tw}" height="${H}"><polygon points="${slant},0 ${tw},0 ${sw},${H} 0,${H}" fill="#fff"/></svg>`);
    const tile = await sharp(img).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    comps.push({ input: tile, left: Math.max(x, 0) === x ? x : x, top: 0 });
    // светлая линия по левой кромке среза
    const line = Buffer.from(`<svg width="${tw}" height="${H}"><polyline points="${slant},0 0,${H}" stroke="#ffffff" stroke-width="3" fill="none" opacity=".85"/></svg>`);
    comps.push({ input: line, left: x, top: 0 });
  }
  // sharp не принимает отрицательный left → рисуем на увеличенном холсте и обрезаем
  const pad = slant;
  const canvas = sharp({ create: { width: W + pad * 2, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  const shifted = comps.map(c => ({ ...c, left: c.left + pad }));
  await canvas.composite(shifted).extract({ left: pad, top: 0, width: W, height: H }).flatten({ background: '#f4f7fb' }).webp({ quality: 84 }).toFile(path.join(OUT, file));
}

// каждая плитка — свой снимок; между всеми коллажами и одиночными фото служб фото не повторяются
await collage('collage-home.webp', [
  { input: crop('roof'), pos: 'left' },
  P('roof-21'),
  P('doors-04'),
  // окно с приближением: погрузчик (справа вверху кадра) — у левого края полосы, который виден на первом экране при любой ширине
  { input: sharp(path.resolve('public/img', 'asphalt-26.webp')).extract({ left: 829, top: 0, width: 352, height: 675 }) },
  P('weld-01'),
]);
await collage('collage-services.webp', [
  { input: crop('lift') },
  P('roof-11'),
  P('weld-03'),
  P('asphalt-13'),
  P('doors-06'),
]);
await collage('collage-uk.webp', [
  P('roof-08'),
  P('doors-08'),
  P('asphalt-21'),
  P('elec-03'),
]);
await collage('collage-about.webp', [
  P('roof-05'),
  P('elec-04'),
  P('asphalt-08'),
  P('doors-11'),
]);
await collage('collage-contacts.webp', [
  P('roof-02'),
  P('elec-10'),
  P('weld-06'),
  P('asphalt-14'),
]);
await collage('collage-portfolio.webp', [P('roof-03'), P('lift-01'), P('asphalt-01'), P('doors-01'), P('entr-04')]);

// облегчённые версии для телефонов
for (const f of fs.readdirSync(OUT).filter(f => !f.endsWith('-m.webp'))) {
  await sharp(path.join(OUT, f)).resize({ width: 840 }).webp({ quality: 72 }).toFile(path.join(OUT, f.replace('.webp', '-m.webp')));
}
// манифест размеров (для width/height в разметке)
const dims = {};
for (const f of fs.readdirSync(OUT).filter(f => !f.endsWith('-m.webp'))) { const m = await sharp(path.join(OUT, f)).metadata(); dims[f.replace('.webp', '')] = { w: m.width, h: m.height }; }
fs.writeFileSync('data/hero.json', JSON.stringify(dims, null, 1));
console.log('hero art ok:', fs.readdirSync(OUT).join(', '));
