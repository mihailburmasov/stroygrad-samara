// Финальная проверка собранного сайта (dist): ссылки, ассеты, H1, title/description, микроразметка, телефоны, плейсхолдеры.
import fs from 'fs';
import path from 'path';
const DIST = path.resolve('dist');
const BASE = process.env.SITE_BASE ?? '';
const company = JSON.parse(fs.readFileSync('data/company.json', 'utf8'));
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(DIST);

const errors = [], warn = [];
const titles = new Map(), descs = new Map();
const exists = u => {
  let p = u.split('#')[0].split('?')[0];
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  const f = path.join(DIST, decodeURIComponent(p));
  return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html')));
};
let linkCount = 0;
for (const f of files) {
  const rel = path.relative(DIST, f);
  const html = fs.readFileSync(f, 'utf8');
  const is404 = rel === '404.html';
  const h1 = (html.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: h1 = ${h1}`);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) errors.push(`${rel}: нет title`); else { if (titles.has(title)) errors.push(`${rel}: дубль title с ${titles.get(title)}`); titles.set(title, rel); if (title.length > 90) warn.push(`${rel}: длинный title (${title.length})`); }
  if (!desc) errors.push(`${rel}: нет description`); else { if (descs.has(desc)) errors.push(`${rel}: дубль description с ${descs.get(desc)}`); descs.set(desc, rel); if (desc.length > 200) warn.push(`${rel}: длинный description (${desc.length})`); }
  if (!/<link rel="canonical"/.test(html)) errors.push(`${rel}: нет canonical`);
  if (!/property="og:image"/.test(html)) errors.push(`${rel}: нет og:image`);
  if (/\{\{УТОЧНИТЬ/.test(html)) errors.push(`${rel}: остался плейсхолдер {{УТОЧНИТЬ}}`);
  // img alt/width/height
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]+"/.test(m[0])) errors.push(`${rel}: img без alt: ${m[0].slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(m[0]) || !/\bheight="\d+"/.test(m[0])) errors.push(`${rel}: img без width/height`);
  }
  // ссылки и ассеты
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(u)) continue;
    linkCount++;
    if (!exists(u)) errors.push(`${rel}: битая ссылка ${u}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) { const u = part.trim().split(' ')[0]; if (u && !exists(u)) errors.push(`${rel}: битый srcset ${u}`); }
  // якоря на странице
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!new RegExp(`id="${m[1]}"`).test(html)) errors.push(`${rel}: якорь #${m[1]} без цели`);
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { errors.push(`${rel}: невалидный JSON-LD`); } }
  // телефоны: все tel: должны быть из company.json
  const tels = company.phones.map(p => p.tel);
  for (const m of html.matchAll(/href="tel:([^"]+)"/g)) if (!tels.includes(m[1])) errors.push(`${rel}: неизвестный tel ${m[1]}`);
  if (!is404) {
    for (const p of company.phones) if (!html.includes(`tel:${p.tel}`)) errors.push(`${rel}: нет ссылки tel:${p.tel}`);
    if (!html.includes(`mailto:${company.email}`)) errors.push(`${rel}: нет mailto`);
    if (!html.includes(company.telegram)) errors.push(`${rel}: нет ссылки Telegram`);
    if (!html.includes(company.max)) errors.push(`${rel}: нет ссылки MAX`);
  }
  if (!/utm_source=stroygrad-samara&amp;utm_medium=footer&amp;utm_campaign=client-sites/.test(html)) errors.push(`${rel}: нет студийной ссылки в подвале`);
  if (rel.startsWith('services' + path.sep) && rel !== path.join('services', 'index.html')) {
    if (!/"@type":"Service"/.test(html)) errors.push(`${rel}: нет Service`);
    if (!/"@type":"FAQPage"/.test(html)) errors.push(`${rel}: нет FAQPage`);
  }
  if (!is404 && !/"@type":"BreadcrumbList"/.test(html) && rel !== 'index.html') errors.push(`${rel}: нет BreadcrumbList`);
}
// sitemap
const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const l of locs) { const p = l.replace(/^https?:\/\/[^/]+/, ''); if (!exists(p)) errors.push(`sitemap: нет страницы ${l}`); }
if (locs.length !== files.length - 1) errors.push(`sitemap: ${locs.length} URL, страниц ${files.length - 1} (без 404)`);
for (const f of ['robots.txt', 'favicon.svg', 'og.jpg', '.nojekyll', 'js/config.js']) if (!fs.existsSync(path.join(DIST, f))) errors.push('нет файла ' + f);

// уникальность текстов услуг: доля общих 8-грамм между парами
const svcDir = 'data/services';
const grams = {};
for (const f of fs.readdirSync(svcDir)) {
  const s = JSON.parse(fs.readFileSync(path.join(svcDir, f), 'utf8'));
  const text = [s.lead, ...s.includes, ...s.steps.map(x => x.text), ...s.signs, ...s.faq.map(x => x.a)].join(' ').toLowerCase().replace(/[^а-яa-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set(); for (let i = 0; i + 8 <= text.length; i++) set.add(text.slice(i, i + 8).join(' '));
  grams[s.slug] = set;
}
const slugs = Object.keys(grams);
for (let i = 0; i < slugs.length; i++) for (let j = i + 1; j < slugs.length; j++) {
  let c = 0; for (const g of grams[slugs[i]]) if (grams[slugs[j]].has(g)) c++;
  const ratio = c / Math.min(grams[slugs[i]].size, grams[slugs[j]].size);
  if (ratio > 0.05) warn.push(`пересечение текстов ${slugs[i]} / ${slugs[j]}: ${(ratio * 100).toFixed(1)}%`);
}
console.log(`Страниц: ${files.length}, проверено ссылок/ассетов: ${linkCount}, URL в sitemap: ${locs.length}`);
if (warn.length) console.log('Предупреждения:\n - ' + warn.join('\n - '));
if (errors.length) { console.log('ОШИБКИ:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log('Проверка пройдена без ошибок');
