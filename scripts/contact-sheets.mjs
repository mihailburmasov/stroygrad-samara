// Служебный скрипт: контактные листы с номерами для просмотра исходников
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
const SRC = 'D:/Claude/Создание сайтов/Клиенты/Юра Самара Стройград/Стройка';
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const dirs = fs.readdirSync(SRC, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const registry = {};
for (const d of dirs) {
  const files = fs.readdirSync(path.join(SRC, d)).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  registry[d] = [];
  const CELL = 300, COLS = 4, PER = 12;
  for (let p = 0; p * PER < files.length; p++) {
    const chunk = files.slice(p * PER, (p + 1) * PER);
    const rows = Math.ceil(chunk.length / COLS);
    const comps = [];
    for (let i = 0; i < chunk.length; i++) {
      const fp = path.join(SRC, d, chunk[i]);
      const meta = await sharp(fp).metadata();
      registry[d].push({ file: chunk[i], w: meta.width, h: meta.height, orient: meta.orientation });
      const idx = p * PER + i;
      const buf = await sharp(fp).rotate().resize(CELL - 6, CELL - 6, { fit: 'inside', background: '#222' }).toBuffer();
      const label = Buffer.from(`<svg width="60" height="34"><rect width="60" height="34" fill="#000" opacity=".75"/><text x="8" y="26" font-size="26" fill="#ff0" font-family="Arial" font-weight="bold">${idx}</text></svg>`);
      comps.push({ input: buf, left: (i % COLS) * CELL + 3, top: Math.floor(i / COLS) * CELL + 3 });
      comps.push({ input: label, left: (i % COLS) * CELL + 3, top: Math.floor(i / COLS) * CELL + 3 });
    }
    await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: '#333' } })
      .composite(comps).jpeg({ quality: 78 }).toFile(path.join(OUT, `${d.replace(/[^a-zA-Zа-яА-Я0-9]+/g, '_')}_${p}.jpg`));
  }
}
fs.writeFileSync(path.join(OUT, 'registry.json'), JSON.stringify(registry, null, 1));
console.log(Object.entries(registry).map(([k, v]) => `${k}: ${v.length}`).join('\n'));
