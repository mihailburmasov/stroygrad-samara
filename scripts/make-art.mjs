// Hero-арт из рекламных обложек клиента (папка «Фото обложки»).
// Вырезаем участки БЕЗ текста, увеличиваем и собираем диагональные коллажи в стиле обложек.
// Запуск: npm run art  (нужен npm install; исходники — на диске клиента)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'D:/Claude/Создание сайтов/Клиенты/Юра Самара Стройград/Стройка/Фото обложки';
const OUT = path.resolve('public/img/hero');
fs.mkdirSync(OUT, { recursive: true });
const F = {
  elec: '2365ed22-af10-450d-830b-26caef56285f.jpg',
  roof: '8c767d51-8628-451f-8a82-f4f7a59c1876.jpg',
  spec: '9efbb6a3-13ed-4075-9474-b97f4170446c.jpg',
  facade: 'b330353b-48d1-464c-9772-a44bbb7c4bcc.jpg',
  doors: 'b8cc5ccb-4bd6-4b51-b13b-a1ec9e1a22f7.jpg',
  collage: 'c91293c9-4ba6-4dd8-9816-abf49bcf3719.jpg',
  lift: 'e4c2b3da-315f-45d3-8c46-089e58fe5476.jpg',
  weld: 'ef6274e7-7894-4d8b-bf7e-b5711c3d821c.jpg',
};
// name: [file, left, top, width, height]  — прямоугольники без текста
const CROPS = {
  roof: ['collage', 0, 0, 640, 400],       // кровельщики на закате, кран
  roof2: ['roof', 0, 815, 500, 355],       // кровельщик на скатной кровле
  facade: ['facade', 575, 0, 449, 580],    // работы на фасаде с лесов
  weld: ['weld', 600, 20, 424, 520],       // сварщик
  elec: ['elec', 600, 0, 424, 470],        // электрик у щита
  doors: ['doors', 600, 0, 424, 430],      // окна
  lift: ['lift', 640, 0, 384, 490],        // лифт
  spec: ['spec', 570, 20, 454, 440],       // экскаватор-погрузчик
};
const crop = (name) => { const [f, left, top, width, height] = CROPS[name]; return sharp(path.join(SRC, F[f])).extract({ left, top, width, height }); };

// одиночные hero-картинки: увеличение + лёгкая резкость
for (const name of Object.keys(CROPS)) {
  const [, , , w] = CROPS[name];
  await crop(name).resize({ width: Math.round(Math.max(w * 2.2, 900)), kernel: 'lanczos3' }).sharpen({ sigma: 0.7 }).webp({ quality: 80 }).toFile(path.join(OUT, `${name}.webp`));
}

// диагональные коллажи: полосы со срезом, золотые линии между ними
async function collage(file, tiles, { W = 1400, H = 820, slant = 130, gap = 10 } = {}) {
  const n = tiles.length;
  const sw = Math.round((W + slant - (n - 1) * gap) / n);
  const comps = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * (sw + gap) - slant / 2);
    const tw = sw + slant;
    const img = await tiles[i].input.resize(tw, H, { fit: 'cover', position: tiles[i].pos || 'centre', kernel: 'lanczos3' }).toBuffer();
    const mask = Buffer.from(`<svg width="${tw}" height="${H}"><polygon points="${slant},0 ${tw},0 ${sw},${H} 0,${H}" fill="#fff"/></svg>`);
    const tile = await sharp(img).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    comps.push({ input: tile, left: Math.max(x, 0) === x ? x : x, top: 0 });
    // золотая линия по левой кромке среза
    const line = Buffer.from(`<svg width="${tw}" height="${H}"><polyline points="${slant},0 0,${H}" stroke="#d9a227" stroke-width="3" fill="none" opacity=".9"/></svg>`);
    comps.push({ input: line, left: x, top: 0 });
  }
  // sharp не принимает отрицательный left → рисуем на увеличенном холсте и обрезаем
  const pad = slant;
  const canvas = sharp({ create: { width: W + pad * 2, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  const shifted = comps.map(c => ({ ...c, left: c.left + pad }));
  await canvas.composite(shifted).extract({ left: pad, top: 0, width: W, height: H }).flatten({ background: '#0a0a0b' }).webp({ quality: 80 }).toFile(path.join(OUT, file));
}
const C = name => ({ input: crop(name) });
await collage('collage-home.webp', [
  { input: crop('roof'), pos: 'right' }, { input: crop('weld') }, { input: crop('facade') }, { input: crop('elec') }, { input: crop('spec') },
]);
await collage('collage-services.webp', [
  { input: crop('doors') }, { input: crop('lift') }, { input: crop('roof2') }, { input: crop('spec') }, { input: crop('weld') },
]);
await collage('collage-uk.webp', [
  { input: crop('facade') }, { input: crop('roof'), pos: 'right' }, { input: crop('lift') }, { input: crop('doors') },
]);
await collage('collage-interior.webp', [
  { input: crop('lift') }, { input: crop('doors') }, { input: crop('elec') }, { input: crop('roof2') },
]);
await collage('collage-outdoor.webp', [
  { input: crop('spec') }, { input: crop('roof'), pos: 'right' }, { input: crop('facade') }, { input: crop('weld') },
]);
// коллаж портфолио — из реальных фото объектов (public/img)
const P = id => ({ input: sharp(path.resolve('public/img', id + '.webp')) });
await collage('collage-portfolio.webp', [P('roof-03'), P('lift-01'), P('asphalt-01'), P('doors-01'), P('entr-04')].map(t => ({ input: t.input })));
// облегчённые версии для телефонов (800 px)
for (const f of fs.readdirSync(OUT).filter(f => !f.endsWith('-m.webp'))) {
  await sharp(path.join(OUT, f)).resize({ width: 800 }).webp({ quality: 66 }).toFile(path.join(OUT, f.replace('.webp', '-m.webp')));
}
// манифест размеров (для width/height в разметке)
const dims = {};
for (const f of fs.readdirSync(OUT).filter(f => !f.endsWith('-m.webp'))) { const m = await sharp(path.join(OUT, f)).metadata(); dims[f.replace('.webp', '')] = { w: m.width, h: m.height }; }
fs.writeFileSync('data/hero.json', JSON.stringify(dims, null, 1));
console.log('hero art ok:', fs.readdirSync(OUT).join(', '));
