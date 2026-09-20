// Оптимизация фото клиента: WebP (крупный 1400px + превью 640px) и манифест data/photos.json
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { SRC_ROOT, PHOTO_MAP } from './photo-map.mjs';

const OUT = path.resolve('public/img');
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [key, group] of Object.entries(PHOTO_MAP)) {
  const dir = path.join(SRC_ROOT, group.dir);
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  manifest[key] = [];
  let n = 0;
  for (const it of group.items) {
    n++;
    const id = `${key}-${String(n).padStart(2, '0')}`;
    const src = path.join(dir, files[it.i]);
    const base = sharp(src).rotate();
    const big = await base.clone().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 70, effort: 5 }).toFile(path.join(OUT, `${id}.webp`));
    const sm = await base.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 60, effort: 5 }).toFile(path.join(OUT, `${id}-sm.webp`));
    manifest[key].push({ id, w: big.width, h: big.height, sw: sm.width, sh: sm.height, alt: it.alt, kind: it.kind });
  }
}
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/photos.json', JSON.stringify(manifest, null, 1));
const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log('photos:', Object.values(manifest).reduce((s, a) => s + a.length, 0), 'size MB:', (total / 1048576).toFixed(1));
