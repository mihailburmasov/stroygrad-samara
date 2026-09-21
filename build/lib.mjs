// Общие функции сборки: данные, ссылки, изображения, шапка/подвал, оболочка страницы, формы.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spriteSvg, icon, LOGO_MARK } from './icons.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export const cfg = readJson('site.config.json');
export const SITE_URL = (process.env.SITE_URL ?? cfg.siteUrl).replace(/\/$/, '');
export const BASE = (process.env.SITE_BASE ?? cfg.basePath).replace(/\/$/, '');
export const DRAFT = process.env.DRAFT === '1';
export const BUILD_DATE = new Date().toISOString().slice(0, 10);
export const YEAR = new Date().getFullYear();

export const company = readJson('data/company.json');
export const site = readJson('data/site.json');
export const reviewsData = readJson('data/reviews.json');
export const photos = readJson('data/photos.json');
export const heroDims = readJson('data/hero.json');

export const services = fs
  .readdirSync(path.join(ROOT, 'data/services'))
  .filter(f => f.endsWith('.json'))
  .map(f => readJson('data/services/' + f));
// Порядок в каталоге и меню — по важности для целевой аудитории (УК и ТСЖ)
const ORDER = ['krovelnye-raboty', 'fasadnye-raboty', 'germetizaciya-temperaturnyh-shvov', 'remont-podezdov', 'remont-liftovyh-kabin', 'okna-i-dveri', 'asfaltirovanie-otmostka', 'blagoustroystvo-territorij', 'spectehnika-vyvoz-snega', 'elektromontazhnye-raboty', 'svarochnye-raboty', 'remont-pomeshcheniy', 'kapitalnoe-stroitelstvo-remont', 'sezonnaya-podgotovka-zdaniy'];
services.sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
export const svcBySlug = Object.fromEntries(services.map(s => [s.slug, s]));

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const href = p => BASE + p;
export const abs = p => SITE_URL + BASE + p;
export const nbsp = s => s.replace(/ ([а-яА-Яa-zA-Z]{1,3}) /g, ' $1\u00a0');

// ---------- изображения ----------
const photoIndex = {};
for (const list of Object.values(photos)) for (const p of list) photoIndex[p.id] = p;
export const photo = id => {
  if (!photoIndex[id]) throw new Error('Нет фото ' + id);
  return photoIndex[id];
};
export function img(id, { sizes = '(min-width: 900px) 33vw, 100vw', cls = '', eager = false } = {}) {
  const p = photo(id);
  const src = `${BASE}/img/${p.id}.webp`;
  const sm = `${BASE}/img/${p.id}-sm.webp`;
  return `<img class="${cls}" src="${src}" srcset="${sm} ${p.sw}w, ${src} ${p.w}w" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
export function preloadFor(id, sizes) {
  const p = photo(id);
  return { href: `${BASE}/img/${p.id}.webp`, srcset: `${BASE}/img/${p.id}-sm.webp ${p.sw}w, ${BASE}/img/${p.id}.webp ${p.w}w`, sizes };
}
export function galleryIds(entries, allowIllustration) {
  const out = [];
  for (const e of entries) {
    if (photos[e]) for (const p of photos[e]) { if (allowIllustration || p.kind !== 'illustration') out.push(p.id); }
    else { photo(e); out.push(e); }
  }
  return out;
}
export function galleryHtml(ids, cols = '') {
  return `<ul class="gallery ${cols}" data-lightbox>${ids
    .map(id => {
      const p = photo(id);
      return `<li><a href="${BASE}/img/${p.id}.webp" class="gallery__item" data-w="${p.w}" data-h="${p.h}">${img(id, { sizes: '(min-width: 900px) 25vw, (min-width: 560px) 33vw, 50vw' })}</a></li>`;
    })
    .join('')}</ul>`;
}

// ---------- реквизиты и плейсхолдеры ----------
export const todo = label => (DRAFT ? `<mark class="todo">{{УТОЧНИТЬ: ${esc(label)}}}</mark>` : '');
export const phoneLink = (p, cls = '', goal = true) => `<a class="${cls}" href="tel:${p.tel}"${goal ? ' data-goal="phone_click"' : ''}>${esc(p.display)}</a>`;
export const phone0 = company.phones[0];

// ---------- разметка ----------
export function pill(label, to) {
  return `<a class="pill" href="${to}">${esc(label)}</a>`;
}

export function reviewCard(r) {
  return `<figure class="review card">
  <div class="review__stars" role="img" aria-label="Оценка 5 из 5">${'★'.repeat(5)}</div>
  <blockquote class="review__text"><p>${esc(r.text)}</p></blockquote>
  <figcaption class="review__by"><strong>${esc(r.author)}</strong><span>${esc(r.date)} · отзыв на Яндекс Бизнесе</span></figcaption>
</figure>`;
}

export function faqHtml(list) {
  return `<div class="faq">${list
    .map(f => `<details class="faq__item"><summary>${esc(f.q)}${icon('chevron', 'faq__ic')}</summary><div class="faq__a"><p>${esc(f.a)}</p></div></details>`)
    .join('')}</div>`;
}

export function serviceCard(s, cls = '') {
  return `<a class="card svc ${cls}" href="${href(`/services/${s.slug}/`)}">
  <span class="svc__icon">${icon(s.icon)}</span>
  <h3 class="svc__title">${esc(s.title)}</h3>
  <p class="svc__text">${esc(s.short)}</p>
  <span class="svc__more">Подробнее ${icon('arrow')}</span>
</a>`;
}

export function crumbs(items) {
  // items: [{name, path}] — последний без ссылки
  return `<nav class="crumbs" aria-label="Хлебные крошки"><ol>${items
    .map((it, i) => (i === items.length - 1 ? `<li aria-current="page">${esc(it.name)}</li>` : `<li><a href="${href(it.path)}">${esc(it.name)}</a></li>`))
    .join('')}</ol></nav>`;
}
export function crumbsLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}
export function faqLd(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
export function orgLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['GeneralContractor', 'LocalBusiness'],
    '@id': abs('/#org'),
    name: company.name,
    alternateName: company.formerNames,
    description: `${company.brandLine} в Самаре: кровельные, фасадные, электромонтажные и сварочные работы, ремонт подъездов и лифтовых кабин, асфальтирование, окна и двери, вывоз снега. Работаем с ${company.foundedYear} года.`,
    url: abs('/'),
    logo: abs('/img/logo-512.png'),
    image: abs('/og.jpg'),
    telephone: company.phones.map(p => p.tel),
    email: company.email,
    foundingDate: String(company.foundedYear),
    address: { '@type': 'PostalAddress', addressLocality: company.city, addressRegion: company.region, addressCountry: 'RU' },
    areaServed: [{ '@type': 'City', name: company.city }, { '@type': 'AdministrativeArea', name: company.region }],
    sameAs: [company.telegram, company.max],
    knowsAbout: services.map(s => s.title),
  };
}

// ---------- форма заявки ----------
export function formHtml({ id = 'zayavka', title, lead, subject, withPortfolio = false, dark = false, selected = '' }) {
  const opts = services.map(s => `<option value="${esc(s.title)}"${s.title === selected ? ' selected' : ''}>${esc(s.title)}</option>`).join('');
  return `<section class="section form-sec ${dark ? 'section--dark on-dark' : 'section--paper'}" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap form-sec__grid">
    <div class="form-sec__intro">
      <h2 id="${id}-h">${esc(title)}</h2>
      <p class="lead">${esc(lead)}</p>
      <ul class="checklist">
        <li>${icon('check')}Приедем на осмотр, замерим и составим смету</li>
        <li>${icon('check')}Работаем по договору, гарантия до ${company.warrantyYears} лет</li>
        <li>${icon('check')}Перезвоним в рабочее время и уточним детали</li>
      </ul>
      <p class="form-sec__alt">Или позвоните: ${company.phones.map(p => phoneLink(p, 'link-strong')).join(' · ')}</p>
    </div>
    <form class="form card" data-form novalidate method="post" action="#">
      <input type="hidden" name="subject" value="${esc(subject)}">
      <input type="hidden" name="page" value="">
      <div class="field"><label for="${id}-name">Ваше имя <span class="req" aria-hidden="true">*</span></label><input id="${id}-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80"><p class="field__err" data-err="name" hidden></p></div>
      <div class="field"><label for="${id}-phone">Телефон <span class="req" aria-hidden="true">*</span></label><input id="${id}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__" required maxlength="24"><p class="field__err" data-err="phone" hidden></p></div>
      <div class="field"><label for="${id}-service">Что нужно сделать</label><select id="${id}-service" name="service"><option value="">Выберите направление (по желанию)</option>${opts}</select></div>
      <div class="field"><label for="${id}-msg">Комментарий</label><textarea id="${id}-msg" name="message" rows="3" maxlength="1000" placeholder="Адрес объекта, что беспокоит, желаемые сроки"></textarea></div>
      ${withPortfolio ? `<div class="check"><input id="${id}-pf" type="checkbox" name="want_portfolio" value="yes"><label for="${id}-pf">Прислать портфолио с адресами объектов и коммерческое предложение</label></div>` : ''}
      <div class="hp" aria-hidden="true"><label>Не заполняйте это поле <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="check"><input id="${id}-consent" type="checkbox" name="consent" value="yes" checked required><label for="${id}-consent">Даю <a href="${href('/consent/')}" target="_blank" rel="noopener">согласие на обработку персональных данных</a> и принимаю <a href="${href('/privacy/')}" target="_blank" rel="noopener">политику конфиденциальности</a></label></div>
      <p class="field__err" data-err="consent" hidden></p>
      <button class="btn btn--primary btn--lg btn--block" type="submit">Отправить заявку</button>
      <div class="form__status" role="status" aria-live="polite" data-status hidden></div>
    </form>
  </div>
</section>`;
}

// ---------- шапка и подвал ----------
const NAV = [
  { name: 'Услуги', path: '/services/' },
  { name: 'УК и ТСЖ', path: '/for-uk-tsj/' },
  { name: 'Портфолио', path: '/portfolio/' },
  { name: 'О компании', path: '/about/' },
  { name: 'Контакты', path: '/contacts/' },
];

// Выпадающая панель «Услуги» в шапке (десктоп): все услуги + быстрая связь
function servicesMega(current) {
  const items = services.map(s => `<li><a class="mega__item" href="${href(`/services/${s.slug}/`)}"><span class="mega__ic">${icon(s.icon)}</span><span class="mega__t">${esc(s.title)}</span></a></li>`).join('');
  return `<div class="mega" id="mega-services">
    <div class="wrap mega__grid">
      <div class="mega__main">
        <p class="mega__h">Все услуги</p>
        <ul class="mega__list">${items}</ul>
      </div>
      <aside class="mega__aside">
        <p class="mega__h">Нужна консультация?</p>
        <p class="mega__note">Приедем на осмотр, замерим и составим смету. Работаем по договору, гарантия до ${company.warrantyYears} лет.</p>
        <a class="mega__tel" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}${esc(phone0.display)}</a>
        <a class="btn btn--primary btn--sm" href="${current === '/' ? '#zayavka' : href('/contacts/#zayavka')}">Рассчитать стоимость</a>
        <a class="mega__all" href="${href('/services/')}">Каталог услуг ${icon('arrow')}</a>
      </aside>
    </div>
  </div>`;
}

function header(current) {
  const nav = NAV.map(n => {
    const cur = current === n.path ? ' aria-current="page"' : '';
    if (n.path !== '/services/') return `<a href="${href(n.path)}"${cur}>${n.name}</a>`;
    return `<div class="nav__item nav__item--sub" data-mega><a href="${href(n.path)}"${cur} aria-haspopup="true" aria-controls="mega-services">${n.name}${icon('chevron', 'nav__chev')}</a>${servicesMega(current)}</div>`;
  }).join('');
  return `<header class="hdr on-dark" id="top">
  <div class="wrap hdr__row">
    <a class="logo" href="${href('/')}">${LOGO_MARK}<span class="logo__txt"><b>СТРОЙГРАД</b><small>строительная компания · Самара</small></span></a>
    <nav class="nav" aria-label="Основное меню">${nav}</nav>
    <div class="hdr__right">
      <a class="hdr__tel" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}<span>${esc(phone0.display)}</span></a>
      <a class="msg" href="${company.telegram}" target="_blank" rel="noopener" aria-label="Написать в Telegram">${icon('telegram')}</a>
      <a class="msg msg--max" href="${company.max}" target="_blank" rel="noopener" aria-label="Открыть группу в MAX">MAX</a>
      <a class="btn btn--primary btn--sm hdr__cta" href="${current === '/' ? '#zayavka' : href('/contacts/#zayavka')}">Рассчитать стоимость</a>
      <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mmenu" data-burger>${icon('menu', 'burger__open')}${icon('close', 'burger__close')}</button>
    </div>
  </div>
  <div class="mmenu" id="mmenu" hidden>
    <div class="wrap">
      <nav aria-label="Мобильное меню">${NAV.map(n => (n.path !== '/services/'
        ? `<a href="${href(n.path)}">${n.name}</a>`
        : `<details class="mmenu__sub"><summary>${n.name}${icon('chevron', 'mmenu__chev')}</summary><div class="mmenu__subl"><a href="${href(n.path)}"><b>Все услуги</b></a>${services.map(s => `<a href="${href(`/services/${s.slug}/`)}">${esc(s.title)}</a>`).join('')}</div></details>`)).join('')}</nav>
      <div class="mmenu__contacts">${company.phones.map(p => phoneLink(p, 'mmenu__tel')).join('')}
        <div class="mmenu__msg"><a class="btn btn--ghost" href="${company.telegram}" target="_blank" rel="noopener">${icon('telegram')} Telegram</a><a class="btn btn--ghost" href="${company.max}" target="_blank" rel="noopener">MAX</a></div>
      </div>
    </div>
  </div>
</header>`;
}

function footer() {
  const r = company.requisites;
  const hasReq = Object.values(r).some(Boolean);
  const reqHtml = hasReq
    ? `<p class="ftr__req">${[r.legalName, r.inn && 'ИНН ' + r.inn, r.ogrn && 'ОГРН ' + r.ogrn, r.legalAddress].filter(Boolean).map(esc).join(' · ')}</p>`
    : DRAFT
      ? `<p class="ftr__req">${todo('юрлицо/ИП, ИНН, ОГРН, юридический адрес')}</p>`
      : '';
  const svcList = services.map(s => `<li><a href="${href(`/services/${s.slug}/`)}">${esc(s.title)}</a></li>`).join('');
  return `<footer class="ftr on-dark">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <a class="logo" href="${href('/')}">${LOGO_MARK}<span class="logo__txt"><b>СТРОЙГРАД</b><small>строительная компания · Самара</small></span></a>
      <p class="ftr__slogan">${esc(company.slogans.main)}</p>
      <p class="ftr__slogan2">${esc(company.slogans.triad)}</p>
      <div class="ftr__contacts">${company.phones.map(p => phoneLink(p, 'ftr__tel')).join('')}<a href="mailto:${company.email}">${esc(company.email)}</a></div>
      <div class="ftr__msg"><a class="btn btn--ghost btn--sm" href="${company.telegram}" target="_blank" rel="noopener">${icon('telegram')} Telegram</a><a class="btn btn--ghost btn--sm" href="${company.max}" target="_blank" rel="noopener">MAX</a></div>
    </div>
    <div class="ftr__col ftr__col--wide"><h2 class="ftr__h">Услуги</h2><ul class="ftr__list ftr__list--cols">${svcList}</ul></div>
    <div class="ftr__col"><h2 class="ftr__h">Компания</h2><ul class="ftr__list">${NAV.map(n => `<li><a href="${href(n.path)}">${n.name}</a></li>`).join('')}</ul></div>
  </div>
  <div class="wrap ftr__bottom">
    <div>
      <p>© ${company.foundedYear}–${YEAR} ${company.name}. Работаем в Самаре и Самарской области.</p>
      ${reqHtml}
    </div>
    <div class="ftr__legal footer-bottom-links">
      <a href="${href('/privacy/')}">Политика конфиденциальности</a>
      <a href="${href('/consent/')}">Согласие на обработку данных</a>
      <a class="footer-credit" href="https://sitomika.ru/?utm_source=${cfg.studioSlug}&amp;utm_medium=footer&amp;utm_campaign=client-sites" target="_blank" rel="noopener">Разработано в sitomika.ru</a>
    </div>
  </div>
</footer>`;
}

// ---------- оболочка страницы ----------
export function shell({ path: pth, title, description, body, ld = [], current = pth, ogImage = '/og.jpg', noindex = false, heroPreload = null }) {
  const url = abs(pth);
  const ldHtml = ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#0a0a0b">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="СТРОЙГРАД">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs(ogImage)}">
<link rel="icon" href="${BASE}/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${BASE}/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png">
<link rel="preload" href="${BASE}/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${BASE}/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
${heroPreload ? `<link rel="preload" as="image" href="${heroPreload.href}"${heroPreload.srcset ? ` imagesrcset="${heroPreload.srcset}" imagesizes="${heroPreload.sizes}"` : ''} fetchpriority="high">` : ''}
<link rel="stylesheet" href="${BASE}/css/style.css?v=${BUILD_DATE}">
${ldHtml}
<!-- Яндекс.Метрика: номер счётчика указывается в public/js/config.js (METRIKA_ID) — скрипт подключится автоматически. Цели: form_submit, phone_click. -->
</head>
<body>
<a class="skip" href="#main">Перейти к содержимому</a>
${spriteSvg()}
${header(current)}
<main id="main">
${body}
</main>
${footer()}
<div class="mbar" role="region" aria-label="Быстрая связь">
  <a class="mbar__call" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}Позвонить</a>
  <a class="mbar__tg" href="${company.telegram}" target="_blank" rel="noopener">${icon('telegram')}Написать в Telegram</a>
</div>
<div class="cookie on-dark" data-cookie hidden role="region" aria-label="Уведомление об использовании cookie">
  <p>Сайт использует файлы cookie, необходимые для его работы, и данные, которые вы указываете в формах. Подробнее — в <a href="${href('/privacy/')}">политике конфиденциальности</a>.</p>
  <button class="btn btn--primary btn--sm" type="button" data-cookie-ok>Понятно</button>
</div>
<script>window.SG_BASE=${JSON.stringify(BASE)};window.SG_PHONES=${JSON.stringify(company.phones)};window.SG_TG=${JSON.stringify(company.telegram)};window.SG_MAX=${JSON.stringify(company.max)};window.SG_EMAIL=${JSON.stringify(company.email)};</script>
<script src="${BASE}/js/config.js?v=${BUILD_DATE}"></script>
<script src="${BASE}/js/main.js?v=${BUILD_DATE}" defer></script>
</body>
</html>
`;
}

// ---------- первый экран: фон-арт из обложек клиента + тексты обложек ----------
// spec: { art: 'roof' } — арт из data/hero.json;  { photo: 'asphalt-01' } — реальное фото;  pos — object-position
export function heroBg(spec) {
  let src, w, h, srcset = '';
  if (spec.art) { const d = heroDims[spec.art]; if (!d) throw new Error('Нет hero-арта ' + spec.art); src = `${BASE}/img/hero/${spec.art}.webp`; w = d.w; h = d.h; srcset = `${BASE}/img/hero/${spec.art}-m.webp 800w, ${src} ${d.w}w`; }
  else { const p = photo(spec.photo); src = `${BASE}/img/${p.id}.webp`; w = p.w; h = p.h; }
  return {
    html: `<div class="hero__bg" aria-hidden="true"><img src="${src}"${srcset ? ` srcset="${srcset}" sizes="(min-width: 900px) 70vw, 100vw"` : ''} width="${w}" height="${h}" alt="" fetchpriority="high" decoding="async"${spec.pos ? ` style="object-position:${spec.pos}"` : ''}></div>`,
    preload: srcset ? { href: src, srcset, sizes: '(min-width: 900px) 70vw, 100vw' } : { href: src },
  };
}
export const plateHtml = (t, sub = '') => `<p class="plate"><span class="plate__in"><span>${esc(t)}</span>${sub ? `<b>${esc(sub)}</b>` : ''}</span></p>`;
export const sroHtml = (cls = '') => `<div class="sro ${cls}">${icon('shield')}<div><b>СРО, гарантия до ${company.warrantyYears} лет!</b><span>${esc(company.slogans.triad)}</span></div></div>`;

export function pageHero({ h1, lead, crumbsHtml = '', actions = '', chips = [], bg, plate = null, eyebrow = '', tag = '', quality = null, sro = true, home = false }) {
  return `<section class="hero ${home ? 'hero--home' : 'hero--page'} on-dark">
  ${bg.html}
  <div class="wrap">
    <div class="hero__text">
      ${crumbsHtml}
      ${plate ? plateHtml(plate.t, plate.s) : ''}
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1>${esc(h1)}</h1>
      ${tag ? `<p class="hero__tag">${esc(tag)}</p>` : ''}
      <p class="lead">${esc(lead)}</p>
      ${actions ? `<div class="hero__actions">${actions}</div>` : ''}
      ${quality ? `<ul class="quality">${quality.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
      ${chips.length ? `<ul class="chips">${chips.map(c => `<li>${icon('check')}${esc(c)}</li>`).join('')}</ul>` : ''}
    </div>
    ${sro ? `<div class="hero__sro">${sroHtml()}</div>` : ''}
  </div>
</section>`;
}
