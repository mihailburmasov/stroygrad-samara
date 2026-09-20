// Генератор статического сайта: data/*.json + шаблоны -> dist/
import fs from 'fs';
import path from 'path';
import {
  ROOT, BASE, SITE_URL, BUILD_DATE, YEAR, DRAFT, company, site, reviewsData, photos, services, svcBySlug,
  esc, href, abs, img, photo, galleryIds, galleryHtml, preloadFor, todo, phoneLink, phone0, reviewCard, faqHtml, serviceCard,
  crumbs, crumbsLd, faqLd, orgLd, formHtml, shell, pageHero,
} from './lib.mjs';
import { icon } from './icons.mjs';

const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });

const pages = []; // для sitemap
function write(pth, html, { sitemap = true, priority = '0.6' } = {}) {
  const file = pth.endsWith('/') ? path.join(DIST, pth, 'index.html') : path.join(DIST, pth);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  if (sitemap) pages.push({ loc: abs(pth), priority });
}

const reviews = reviewsData.items;
const reviewsFor = slug => reviews.filter(r => r.services.includes(slug));

// проверка целостности данных
for (const s of services) {
  for (const r of s.related) if (!svcBySlug[r]) throw new Error(`${s.slug}: нет связанной услуги ${r}`);
  if (s.faq.length < 4 || s.faq.length > 6) throw new Error(`${s.slug}: FAQ должен содержать 4–6 вопросов`);
  if (s.hero) photo(s.hero);
  galleryIds(s.gallery, true);
}
for (const r of reviews) for (const sl of r.services) if (!svcBySlug[sl]) throw new Error('отзыв: нет услуги ' + sl);

// категории портфолио
const CATS = [
  { key: 'roof', label: 'Кровельные работы', slug: 'krovelnye-raboty' },
  { key: 'entr', label: 'Ремонт подъездов', slug: 'remont-podezdov' },
  { key: 'lift', label: 'Лифтовые кабины', slug: 'remont-liftovyh-kabin' },
  { key: 'asphalt', label: 'Асфальт и отмостка', slug: 'asfaltirovanie-otmostka' },
  { key: 'doors', label: 'Окна и двери', slug: 'okna-i-dveri' },
  { key: 'elec', label: 'Электромонтаж', slug: 'elektromontazhnye-raboty' },
  { key: 'weld', label: 'Сварочные работы', slug: 'svarochnye-raboty' },
  { key: 'seal', label: 'Герметизация швов', slug: 'germetizaciya-temperaturnyh-shvov' },
];

// =====================================================================
// ГЛАВНАЯ
// =====================================================================
function home() {
  const h = site.home;
  const t = h.h1;
  const hero = `<section class="hero on-dark">
  <div class="wrap hero__grid">
    <div class="hero__text">
      <p class="eyebrow">${esc(h.eyebrow)}</p>
      <h1>${esc(t)}</h1>
      <p class="lead">${esc(h.lead)}</p>
      <div class="hero__actions">
        <a class="btn btn--primary btn--lg" href="#zayavka">Рассчитать стоимость</a>
        <a class="btn btn--ghost btn--lg" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}${esc(phone0.display)}</a>
      </div>
      <ul class="chips">
        <li>${icon('check')}СРО и лицензии</li><li>${icon('check')}Гарантия до ${company.warrantyYears} лет</li><li>${icon('check')}Договор и смета</li>
      </ul>
    </div>
    <div class="hero__media">
      ${img('roof-01', { sizes: '(min-width: 900px) 34vw, 92vw', cls: 'hero__img hero__img--a', eager: true })}
      ${img('lift-01', { sizes: '(min-width: 900px) 17vw, 45vw', cls: 'hero__img hero__img--b' })}
      ${img('entr-03', { sizes: '(min-width: 900px) 17vw, 45vw', cls: 'hero__img hero__img--c' })}
    </div>
  </div>
</section>`;

  const reasons = `<section class="reasons" aria-label="Почему выбирают СТРОЙГРАД"><div class="wrap reasons__grid">${h.reasons
    .map(r => `<div class="reason"><span class="reason__ic">${icon(r.icon)}</span><h2 class="reason__t">${esc(r.title)}</h2><p>${esc(r.text)}</p></div>`)
    .join('')}</div></section>`;

  const svc = `<section class="section" id="uslugi" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="svc-h">Направления работ</h2><p class="lead">${esc(company.slogans.multi)}. Все услуги — по договору, со сметой и гарантией до ${company.warrantyYears} лет.</p></div>
    <div class="grid grid--svc">${services.map(s => serviceCard(s)).join('')}</div>
    <p class="center mt"><a class="btn btn--dark" href="${href('/services/')}">Каталог услуг ${icon('arrow')}</a></p>
  </div>
</section>`;

  const uk = `<section class="section section--dark on-dark uk" aria-labelledby="uk-h">
  <div class="wrap uk__grid">
    <div>
      <p class="eyebrow">Для B2B-заказчиков</p>
      <h2 id="uk-h">Управляющим компаниям и ТСЖ</h2>
      <p class="lead">${esc(company.slogans.one)}. Кровля, фасады, подъезды, лифты, окна и двери, снег — по одному договору, с документами для отчётности.</p>
      <div class="hero__actions"><a class="btn btn--primary" href="${href('/for-uk-tsj/')}">Подробнее для УК и ТСЖ</a><a class="btn btn--ghost" href="${href('/for-uk-tsj/#zayavka')}">Запросить коммерческое предложение</a></div>
    </div>
    <ul class="uk__list">
      <li>${icon('doc')}<div><b>Договор, смета, акты</b><span>Документы для отчётности управляющей компании.</span></div></li>
      <li>${icon('shield')}<div><b>СРО и лицензии</b><span>Работаем официально — можно подтвердить перед жильцами и проверяющими.</span></div></li>
      <li>${icon('calendar')}<div><b>Гарантия до ${company.warrantyYears} лет</b><span>Срок и условия — в договоре.</span></div></li>
      <li>${icon('layers')}<div><b>Один подрядчик вместо пяти</b><span>Один договор и один ответственный менеджер.</span></div></li>
    </ul>
  </div>
</section>`;

  const steps = `<section class="section" aria-labelledby="steps-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="steps-h">Как мы работаем</h2><p class="lead">Три шага — от договора до подписанного акта.</p></div>
    <ol class="steps steps--3">${h.steps.map((s, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>
  </div>
</section>`;

  const best = [
    ['roof-01', 'Кровельные работы', 'krovelnye-raboty'],
    ['lift-01', 'Лифтовые кабины', 'remont-liftovyh-kabin'],
    ['entr-03', 'Ремонт подъездов', 'remont-podezdov'],
    ['asphalt-01', 'Асфальт и отмостка', 'asfaltirovanie-otmostka'],
    ['doors-01', 'Окна и двери', 'okna-i-dveri'],
    ['elec-01', 'Электромонтаж', 'elektromontazhnye-raboty'],
  ];
  const port = `<section class="section section--paper" aria-labelledby="port-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="port-h">Выполненные объекты</h2><p class="lead">Фото наших работ. Портфолио с адресами объектов — по запросу.</p></div>
    <div class="grid grid--port">${best
      .map(([id, label, slug]) => `<a class="port card" href="${href(`/services/${slug}/`)}">${img(id, { sizes: '(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw', cls: 'port__img' })}<span class="port__cap">${esc(label)}</span></a>`)
      .join('')}</div>
    <p class="center mt"><a class="btn btn--dark" href="${href('/portfolio/')}">Все объекты ${icon('arrow')}</a></p>
  </div>
</section>`;

  const feat = reviews.filter(r => r.featured).slice(0, 3);
  const trust = `<section class="section" aria-labelledby="trust-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="trust-h">Почему нам доверяют</h2><p class="lead">${esc(company.slogans.unite)}.</p></div>
    <div class="grid grid--4">${h.trust.map(x => `<div class="card trust"><span class="reason__ic">${icon(x.icon)}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>
    <div class="reviews mt-lg"><div class="grid grid--3">${feat.map(reviewCard).join('')}</div>
    <p class="center mt"><a class="link-strong" href="${href('/about/#otzyvy')}">Больше отзывов ${icon('arrow')}</a></p></div>
  </div>
</section>`;

  const contacts = contactsBlock();
  const body = hero + reasons + svc + uk + steps + port + trust + formHtml({ title: 'Рассчитать стоимость', lead: 'Оставьте заявку — приедем на осмотр и составим смету. Можно позвонить или написать в мессенджер.', subject: 'Заявка с главной страницы' }) + contacts;
  write('/', shell({
    path: '/', title: h.metaTitle, description: h.metaDescription, body, current: '/',
    ld: [orgLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: company.name, url: abs('/'), inLanguage: 'ru' }],
    heroPreload: null,
  }), { priority: '1.0' });
}

function contactsBlock() {
  return `<section class="section" aria-labelledby="cont-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="cont-h">Контакты</h2><p class="lead">Работаем в Самаре и Самарской области.</p></div>
    <div class="grid grid--3 contacts">
      <div class="card contact"><span class="reason__ic">${icon('phone')}</span><h3>Телефоны</h3><p>${company.phones.map(p => phoneLink(p, 'contact__link')).join('')}</p></div>
      <div class="card contact"><span class="reason__ic">${icon('mail')}</span><h3>Электронная почта</h3><p><a class="contact__link" href="mailto:${company.email}">${esc(company.email)}</a></p></div>
      <div class="card contact"><span class="reason__ic">${icon('telegram')}</span><h3>Мессенджеры</h3><p><a class="contact__link" href="${company.telegram}" target="_blank" rel="noopener">Telegram: @${company.telegram.split("/").pop()}</a><a class="contact__link" href="${company.max}" target="_blank" rel="noopener">Группа в MAX</a></p></div>
    </div>
  </div>
</section>`;
}

// =====================================================================
// КАТАЛОГ УСЛУГ
// =====================================================================
function servicesHub() {
  const s = site.services;
  const items = [{ name: 'Главная', path: '/' }, { name: 'Услуги', path: '/services/' }];
  const body = pageHero({ h1: s.h1, lead: s.lead, crumbsHtml: crumbs(items), actions: `<a class="btn btn--primary btn--lg" href="#zayavka">Оставить заявку</a>` }) +
    `<section class="section"><div class="wrap"><h2 class="sr-only">Все направления работ</h2><div class="grid grid--svc">${services.map(x => serviceCard(x)).join('')}</div></div></section>` +
    formHtml({ title: 'Не знаете, какая услуга нужна?', lead: 'Опишите задачу — подскажем решение и рассчитаем стоимость.', subject: 'Заявка из каталога услуг' });
  write('/services/', shell({
    path: '/services/', title: s.metaTitle, description: s.metaDescription, body, current: '/services/',
    ld: [crumbsLd(items), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: services.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/services/${x.slug}/`), name: x.title })) }],
  }), { priority: '0.9' });
}

// =====================================================================
// СТРАНИЦА УСЛУГИ (единый шаблон)
// =====================================================================
function servicePage(s) {
  const pth = `/services/${s.slug}/`;
  const items = [{ name: 'Главная', path: '/' }, { name: 'Услуги', path: '/services/' }, { name: s.title, path: pth }];
  const media = s.hero ? img(s.hero, { sizes: '(min-width: 900px) 42vw, 100vw', cls: 'phero__img', eager: true }) : '';
  const hero = pageHero({
    h1: s.h1, lead: s.lead, crumbsHtml: crumbs(items), media,
    actions: `<a class="btn btn--primary btn--lg" href="#zayavka">Рассчитать стоимость</a><a class="btn btn--ghost btn--lg" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}${esc(phone0.display)}</a>`,
    chips: ['СРО и лицензии', `Гарантия до ${company.warrantyYears} лет`, 'Договор и смета'],
  });

  const price = `<section class="section section--tight"><div class="wrap"><div class="price card"><div><span class="price__label">Стоимость</span><p class="price__value">Рассчитаем по объекту</p></div><p class="price__note">${esc(s.priceNote)}</p><a class="btn btn--primary" href="#zayavka">Получить расчёт</a></div></div></section>`;

  const includes = `<section class="section" aria-labelledby="inc-h"><div class="wrap two-col">
    <div><h2 id="inc-h">Что входит в работы</h2><ul class="checklist checklist--lg">${s.includes.map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
    <div class="signs"><h2>${esc(s.signsTitle)}</h2><ul class="dots">${s.signs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div></section>`;

  const steps = `<section class="section section--paper" aria-labelledby="st-h"><div class="wrap">
    <div class="sec-head"><h2 id="st-h">${esc(s.stepsTitle)}</h2></div>
    <ol class="steps">${s.steps.map((x, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ol>
  </div></section>`;

  let gal = '';
  const gids = galleryIds(s.gallery, !!s.gallery_caption);
  if (gids.length) {
    gal = `<section class="section" aria-labelledby="gal-h"><div class="wrap">
      <div class="sec-head"><h2 id="gal-h">Фото работ</h2>${s.gallery_caption ? `<p class="lead">${esc(s.gallery_caption)}</p>` : `<p class="lead">Нажмите на фото, чтобы увеличить. Портфолио с адресами объектов — по запросу.</p>`}</div>
      ${galleryHtml(gids)}
    </div></section>`;
  }

  const term = `<section class="section section--dark on-dark"><div class="wrap grid grid--2">
    <div class="tw"><span class="reason__ic">${icon('clock')}</span><h2 class="h3">Сроки</h2><p>${esc(s.term)}</p></div>
    <div class="tw"><span class="reason__ic">${icon('shield')}</span><h2 class="h3">Гарантия</h2><p>${esc(s.warranty)}</p></div>
  </div></section>`;

  const rv = reviewsFor(s.slug).slice(0, 3);
  const rvHtml = rv.length
    ? `<section class="section" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы клиентов</h2><p class="lead">Реальные отзывы с Яндекс Бизнеса. Часть оставлена под прежним названием компании — «Олимп».</p></div><div class="grid grid--${Math.min(rv.length, 3) === 1 ? '1' : rv.length === 2 ? '2' : '3'}">${rv.map(reviewCard).join('')}</div></div></section>`
    : '';

  const faq = `<section class="section section--paper" aria-labelledby="faq-h"><div class="wrap wrap--narrow"><div class="sec-head"><h2 id="faq-h">Вопросы и ответы</h2></div>${faqHtml(s.faq)}</div></section>`;

  const related = `<section class="section" aria-labelledby="rel-h"><div class="wrap"><div class="sec-head"><h2 id="rel-h">Смежные услуги</h2></div><div class="grid grid--3">${s.related.map(r => serviceCard(svcBySlug[r])).join('')}</div></div></section>`;

  const body = hero + price + includes + steps + gal + term + rvHtml + faq + formHtml({ title: `Заявка: ${s.title.toLowerCase()}`, lead: 'Оставьте контакты — свяжемся, уточним задачу и договоримся о выезде на осмотр.', subject: `Заявка: ${s.title}`, selected: s.title }) + related;

  const ld = [
    crumbsLd(items),
    {
      '@context': 'https://schema.org', '@type': 'Service', name: s.title, serviceType: s.title, description: s.metaDescription,
      url: abs(pth), inLanguage: 'ru',
      provider: { '@type': 'GeneralContractor', name: company.name, url: abs('/'), telephone: company.phones.map(p => p.tel), email: company.email },
      areaServed: [{ '@type': 'City', name: company.city }, { '@type': 'AdministrativeArea', name: company.region }],
    },
    faqLd(s.faq),
  ];
  write(pth, shell({ path: pth, title: s.metaTitle, description: s.metaDescription, body, ld, current: '/services/', ogImage: '/og.jpg', heroPreload: s.hero ? preloadFor(s.hero, '(min-width: 900px) 42vw, 100vw') : null }), { priority: '0.8' });
}

// =====================================================================
// ДЛЯ УК И ТСЖ
// =====================================================================
function ukPage() {
  const u = site.uk;
  const pth = '/for-uk-tsj/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'Управляющим компаниям и ТСЖ', path: pth }];
  const hero = pageHero({
    h1: u.h1, lead: u.lead, crumbsHtml: crumbs(items), eyebrow: 'Для управляющих компаний, ТСЖ и ЖСК',
    actions: `<a class="btn btn--primary btn--lg" href="#zayavka">Запросить коммерческое предложение</a><a class="btn btn--ghost btn--lg" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}${esc(phone0.display)}</a>`,
    chips: ['СРО и лицензии', 'Договор, смета, акты', `Гарантия до ${company.warrantyYears} лет`],
  });
  const needs = `<section class="section" aria-labelledby="needs-h"><div class="wrap"><div class="sec-head"><h2 id="needs-h">${esc(u.needsTitle)}</h2></div>
    <div class="grid grid--3">${u.needs.map(n => `<div class="card trust"><span class="reason__ic">${icon(n.icon)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join('')}</div></div></section>`;
  const svcs = `<section class="section section--paper" aria-labelledby="us-h"><div class="wrap"><div class="sec-head"><h2 id="us-h">${esc(u.servicesTitle)}</h2></div>
    <div class="grid grid--svc">${u.serviceSlugs.map(sl => serviceCard(svcBySlug[sl])).join('')}</div></div></section>`;
  const docs = `<section class="section" aria-labelledby="docs-h"><div class="wrap two-col">
    <div><h2 id="docs-h">${esc(u.docsTitle)}</h2><ul class="checklist checklist--lg">${u.docs.map(d => `<li>${icon('check')}<span>${esc(d)}</span></li>`).join('')}</ul></div>
    <div><h2>Как мы работаем</h2><ol class="steps steps--v">${site.home.steps.map((s, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol></div>
  </div></section>`;
  const rv = reviews.filter(r => /ТСЖ|(^|[\s,.(])УК([\s,.)]|$)|МКД|многоквартирн/.test(r.text)).slice(0, 3);
  const rvHtml = `<section class="section section--paper" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы управляющих компаний и ТСЖ</h2><p class="lead">Реальные отзывы с Яндекс Бизнеса.</p></div><div class="grid grid--3">${rv.map(reviewCard).join('')}</div></div></section>`;
  const faq = `<section class="section" aria-labelledby="faq-h"><div class="wrap wrap--narrow"><div class="sec-head"><h2 id="faq-h">Вопросы и ответы</h2></div>${faqHtml(u.faq)}</div></section>`;
  const body = hero + needs + svcs + docs + rvHtml + faq + formHtml({ title: 'Запросить коммерческое предложение', lead: 'Опишите задачу или объекты — подготовим предложение и договоримся об осмотре.', subject: 'КП для УК/ТСЖ', withPortfolio: true, dark: true });
  write(pth, shell({
    path: pth, title: u.metaTitle, description: u.metaDescription, body, current: pth,
    ld: [crumbsLd(items), faqLd(u.faq)],
  }), { priority: '0.9' });
}

// =====================================================================
// ПОРТФОЛИО
// =====================================================================
function portfolioPage() {
  const p = site.portfolio;
  const pth = '/portfolio/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'Портфолио', path: pth }];
  const hero = pageHero({ h1: p.h1, lead: p.lead, crumbsHtml: crumbs(items), actions: `<a class="btn btn--primary btn--lg" href="#zayavka">Запросить портфолио</a>` });
  const all = [];
  for (const c of CATS) for (const ph of photos[c.key]) if (ph.kind !== 'illustration') all.push({ ...ph, cat: c });
  const filters = `<div class="filters" role="group" aria-label="Фильтр по виду работ"><button type="button" class="chip is-active" data-filter="all" aria-pressed="true">Все (${all.length})</button>${CATS.map(c => `<button type="button" class="chip" data-filter="${c.key}" aria-pressed="false">${esc(c.label)} (${all.filter(a => a.cat.key === c.key).length})</button>`).join('')}</div>`;
  const grid = `<ul class="gallery gallery--port" data-lightbox data-filterable>${all
    .map(a => `<li data-cat="${a.cat.key}"><a href="${BASE_IMG(a.id)}" class="gallery__item" data-w="${a.w}" data-h="${a.h}">${img(a.id, { sizes: '(min-width: 900px) 25vw, (min-width: 560px) 33vw, 50vw' })}<span class="gallery__cap">${esc(a.cat.label)}</span></a></li>`)
    .join('')}</ul>`;
  const note = `<p class="note">Показаны снимки с рабочих объектов и коллажи «до/после». Адреса объектов и контакты заказчиков не публикуем — портфолио с адресами предоставим по запросу.</p>`;
  const body = hero + `<section class="section"><div class="wrap">${filters}${grid}${note}</div></section>` + formHtml({ title: 'Запросить портфолио с адресами', lead: 'Пришлём портфолио и подготовим коммерческое предложение.', subject: 'Запрос портфолио', withPortfolio: true });
  write(pth, shell({ path: pth, title: p.metaTitle, description: p.metaDescription, body, current: pth, ld: [crumbsLd(items)] }), { priority: '0.7' });
}
const BASE_IMG = id => `${BASE}/img/${id}.webp`;

// =====================================================================
// О КОМПАНИИ
// =====================================================================
function aboutPage() {
  const a = site.about;
  const pth = '/about/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'О компании', path: pth }];
  const hero = pageHero({ h1: a.h1, lead: a.lead, crumbsHtml: crumbs(items), eyebrow: `С ${company.foundedYear} года в Самаре`, actions: `<a class="btn btn--primary btn--lg" href="${href('/contacts/#zayavka')}">Связаться с нами</a>` });
  const hist = `<section class="section" aria-labelledby="hist-h"><div class="wrap two-col">
    <div><h2 id="hist-h">${esc(a.historyTitle)}</h2>${a.history.map(t => `<p>${esc(t)}</p>`).join('')}</div>
    <div class="card facts"><dl>
      <div><dt>Работаем с</dt><dd>${company.foundedYear} года</dd></div>
      <div><dt>Опыт специалистов</dt><dd>от ${company.teamExperienceYears} лет</dd></div>
      <div><dt>Гарантия</dt><dd>до ${company.warrantyYears} лет</dd></div>
      <div><dt>География</dt><dd>Самара и Самарская область</dd></div>
      <div><dt>Прежние названия</dt><dd>${company.formerNames.map(n => '«' + esc(n) + '»').join(', ')}</dd></div>
    </dl></div>
  </div></section>`;
  const team = `<section class="section section--paper" aria-labelledby="team-h"><div class="wrap two-col">
    <div><h2 id="team-h">${esc(a.teamTitle)}</h2><p>${esc(a.team)}</p></div>
    <div><h2>${esc(a.docsTitle)}</h2><p>${esc(a.docs)}</p>${company.requisites.sro ? `<p>СРО: ${esc(company.requisites.sro)}</p>` : todo('название СРО, номер членства, вид допуска')}</div>
  </div></section>`;
  const work = `<section class="section" aria-labelledby="work-h"><div class="wrap"><div class="sec-head"><h2 id="work-h">${esc(a.workTitle)}</h2><p class="lead">${esc(company.slogans.triad)}</p></div>
    <ol class="steps steps--3">${a.values.map((v, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join('')}</ol></div></section>`;
  const slog = `<section class="section section--dark on-dark"><div class="wrap"><ul class="slogans">${['main', 'unite', 'multi', 'one'].map(k => `<li>${esc(company.slogans[k])}</li>`).join('')}</ul></div></section>`;
  const rvs = `<section class="section" id="otzyvy" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы клиентов</h2><p class="lead">На Яндекс Бизнесе — ${company.yandexReviews.count} отзывов (по состоянию на ${company.yandexReviews.asOf}). Ниже — часть из них, тексты перенесены без изменений по смыслу. Многие отзывы оставлены под прежним названием компании — «Олимп».</p></div>
    <div class="grid grid--3 masonry">${reviews.map(reviewCard).join('')}</div></div></section>`;
  const body = hero + hist + team + work + slog + rvs + formHtml({ title: 'Задать вопрос или запросить документы', lead: 'Копии СРО, лицензий и портфолио с адресами объектов предоставим по запросу.', subject: 'Вопрос со страницы «О компании»', withPortfolio: true });
  write(pth, shell({ path: pth, title: a.metaTitle, description: a.metaDescription, body, current: pth, ld: [crumbsLd(items), orgLd()] }), { priority: '0.7' });
}

// =====================================================================
// КОНТАКТЫ
// =====================================================================
function contactsPage() {
  const c = site.contacts;
  const pth = '/contacts/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'Контакты', path: pth }];
  const hero = pageHero({ h1: c.h1, lead: c.lead, crumbsHtml: crumbs(items), actions: `<a class="btn btn--primary btn--lg" href="tel:${phone0.tel}" data-goal="phone_click">${icon('phone')}${esc(phone0.display)}</a><a class="btn btn--ghost btn--lg" href="#zayavka">Оставить заявку</a>` });
  const r = company.requisites;
  const reqRows = [['Наименование', r.legalName], ['ИНН', r.inn], ['ОГРН', r.ogrn], ['Юридический адрес', r.legalAddress]].filter(x => x[1]);
  const req = reqRows.length
    ? `<div class="card"><h3>Реквизиты</h3><dl class="req">${reqRows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`
    : DRAFT ? `<div class="card"><h3>Реквизиты</h3><p>${todo('юрлицо/ИП, ИНН, ОГРН, юридический адрес')}</p></div>` : '';
  const info = `<section class="section" aria-labelledby="ci-h"><div class="wrap">
    <h2 id="ci-h" class="sr-only">Как с нами связаться</h2>
    <div class="grid grid--3 contacts">
      <div class="card contact"><span class="reason__ic">${icon('phone')}</span><h3>Телефоны</h3><p>${company.phones.map(p => phoneLink(p, 'contact__link')).join('')}</p></div>
      <div class="card contact"><span class="reason__ic">${icon('mail')}</span><h3>Электронная почта</h3><p><a class="contact__link" href="mailto:${company.email}">${esc(company.email)}</a></p></div>
      <div class="card contact"><span class="reason__ic">${icon('telegram')}</span><h3>Мессенджеры</h3><p><a class="contact__link" href="${company.telegram}" target="_blank" rel="noopener">Telegram: @${company.telegram.split("/").pop()}</a><a class="contact__link" href="${company.max}" target="_blank" rel="noopener">Группа в MAX</a></p></div>
    </div>
    <div class="grid grid--2 mt-lg">
      <div class="card"><h3>Где работаем</h3><p>Самара и Самарская область. На объект выезжаем сами: осматриваем, замеряем и составляем смету. Для заказчиков из области согласуем выезд по телефону.</p>${company.officeAddress ? `<p>${esc(company.officeAddress)}</p>` : todo('адрес офиса и режим работы')}</div>
      ${req}
    </div></div></section>`;
  const body = hero + info + formHtml({ title: 'Оставить заявку на замер и смету', lead: 'Опишите задачу — мы свяжемся с вами и договоримся о выезде.', subject: 'Заявка со страницы «Контакты»' });
  write(pth, shell({ path: pth, title: c.metaTitle, description: c.metaDescription, body, current: pth, ld: [crumbsLd(items), orgLd()] }), { priority: '0.7' });
}

// =====================================================================
// ЮРИДИЧЕСКИЕ СТРАНИЦЫ (152-ФЗ)
// =====================================================================
const dateRu = new Date(BUILD_DATE).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
function operatorLine() {
  const r = company.requisites;
  const bits = [r.legalName || `компания «${company.name}» (${company.city})`, r.inn && 'ИНН ' + r.inn, r.ogrn && 'ОГРН ' + r.ogrn, r.legalAddress].filter(Boolean);
  return esc(bits.join(', ')) + (bits.length < 2 ? todo('полное наименование юрлица/ИП, ИНН, ОГРН, юридический адрес') : '');
}
function privacyPage() {
  const pth = '/privacy/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'Политика конфиденциальности', path: pth }];
  const body = pageHero({ h1: 'Политика конфиденциальности', lead: `Порядок обработки персональных данных посетителей сайта. Редакция от ${dateRu}.`, crumbsHtml: crumbs(items) }) + `<section class="section"><div class="wrap wrap--narrow prose">
<h2>1. Общие положения</h2>
<p>Настоящая политика определяет порядок обработки и защиты персональных данных пользователей сайта ${esc(SITE_URL + BASE)}/ (далее — сайт) и составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
<p>Оператор персональных данных: ${operatorLine()}. Электронная почта для обращений: <a href="mailto:${company.email}">${esc(company.email)}</a>.</p>
<h2>2. Какие данные мы собираем</h2>
<p>Через формы на сайте вы можете передать нам: имя, номер телефона, текст комментария (адрес объекта, описание задачи), выбранное направление работ, а также отметку о запросе портфолио. Вместе с заявкой передаётся адрес страницы сайта, с которой она отправлена.</p>
<p>При обращении к сайту серверы, на которых он размещён, могут автоматически фиксировать технические данные: IP-адрес, тип браузера, дату и время запроса. Эти данные используются для обеспечения работы и безопасности сайта.</p>
<h2>3. Цели обработки</h2>
<ul><li>связаться с вами по заявке, уточнить задачу и организовать выезд на осмотр;</li><li>рассчитать стоимость работ и подготовить коммерческое предложение;</li><li>заключить и исполнить договор;</li><li>направить запрошенные материалы (портфолио, коммерческое предложение).</li></ul>
<h2>4. Правовое основание</h2>
<p>Обработка осуществляется на основании вашего согласия (п. 1 ч. 1 ст. 6 Федерального закона № 152-ФЗ). Согласие даётся отметкой в форме заявки и текстом <a href="${href('/consent/')}">согласия на обработку персональных данных</a>.</p>
<h2>5. Порядок и сроки обработки</h2>
<p>Мы выполняем сбор, запись, систематизацию, накопление, хранение, уточнение, использование и удаление персональных данных. Данные хранятся до достижения целей обработки либо до отзыва вами согласия — в зависимости от того, что наступит раньше, если иное не требуется законом.</p>
<p>Запись, систематизация, накопление и хранение персональных данных граждан Российской Федерации осуществляются с использованием баз данных, находящихся на территории Российской Федерации.</p>
<h2>6. Передача третьим лицам</h2>
<p>Мы не продаём и не передаём ваши данные третьим лицам, за исключением случаев, когда это необходимо для приёма и обработки заявок (например, почтовый сервис или мессенджер, в который приходят уведомления), а также случаев, предусмотренных законом.</p>
<h2>7. Ваши права</h2>
<p>Вы вправе получить информацию об обработке своих персональных данных, потребовать их уточнения, блокирования или удаления, а также отозвать согласие. Для этого направьте обращение на <a href="mailto:${company.email}">${esc(company.email)}</a>. Мы ответим в сроки, установленные законом.</p>
<h2>8. Файлы cookie</h2>
<p>Сайт использует файлы cookie, необходимые для его корректной работы, а также запоминает ваш выбор в уведомлении о cookie. Инструменты веб-аналитики и рекламные трекеры на сайте на данный момент не используются. Если аналитика (например, Яндекс.Метрика) будет подключена, мы обновим этот раздел. Вы можете отключить cookie в настройках браузера — это не повлияет на возможность отправить заявку.</p>
<h2>9. Изменения политики</h2>
<p>Оператор вправе обновлять политику. Актуальная редакция всегда опубликована на этой странице.</p>
</div></section>`;
  write(pth, shell({ path: pth, title: 'Политика конфиденциальности — СТРОЙГРАД', description: 'Политика конфиденциальности и порядок обработки персональных данных на сайте строительной компании СТРОЙГРАД (Самара).', body, current: pth, ld: [crumbsLd(items)] }), { priority: '0.2' });
}
function consentPage() {
  const pth = '/consent/';
  const items = [{ name: 'Главная', path: '/' }, { name: 'Согласие на обработку персональных данных', path: pth }];
  const body = pageHero({ h1: 'Согласие на обработку персональных данных', lead: `Редакция от ${dateRu}.`, crumbsHtml: crumbs(items) }) + `<section class="section"><div class="wrap wrap--narrow prose">
<p>Отправляя форму на сайте ${esc(SITE_URL + BASE)}/ и ставя отметку о согласии, я, в соответствии со ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных», свободно, своей волей и в своём интересе даю согласие оператору — ${operatorLine()} — на обработку моих персональных данных на следующих условиях.</p>
<h2>Какие данные</h2>
<p>Имя, номер телефона, содержание комментария, выбранное направление работ, сведения о запросе портфолио, адрес страницы сайта, с которой отправлена заявка.</p>
<h2>Цели</h2>
<p>Связь со мной по моей заявке, расчёт стоимости и подготовка коммерческого предложения, организация выезда на объект, заключение и исполнение договора, направление запрошенных материалов.</p>
<h2>Действия с данными</h2>
<p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), использование, передача исполнителям, участвующим в приёме заявок, обезличивание, блокирование, удаление и уничтожение — с использованием средств автоматизации и без них.</p>
<h2>Срок и отзыв согласия</h2>
<p>Согласие действует до достижения целей обработки либо до момента его отзыва. Я могу отозвать согласие, направив письменное обращение на <a href="mailto:${company.email}">${esc(company.email)}</a>. После отзыва оператор прекращает обработку и удаляет данные, если у него нет иных законных оснований для их хранения.</p>
<p>Подробнее — в <a href="${href('/privacy/')}">политике конфиденциальности</a>.</p>
</div></section>`;
  write(pth, shell({ path: pth, title: 'Согласие на обработку персональных данных — СТРОЙГРАД', description: 'Текст согласия на обработку персональных данных при отправке заявки на сайте строительной компании СТРОЙГРАД (Самара).', body, current: pth, ld: [crumbsLd(items)] }), { priority: '0.2' });
}

// =====================================================================
// 404
// =====================================================================
function notFound() {
  const body = `<section class="section nf"><div class="wrap wrap--narrow center"><p class="nf__code">404</p><h1 class="h2">Такой страницы нет</h1><p class="lead">Возможно, ссылка устарела или в адресе опечатка. Перейдите на главную или в каталог услуг — или позвоните нам.</p>
<div class="hero__actions" style="justify-content:center"><a class="btn btn--primary btn--lg" href="${href('/')}">На главную</a><a class="btn btn--dark btn--lg" href="${href('/services/')}">Все услуги</a><a class="btn btn--dark btn--lg" href="tel:${phone0.tel}">${icon('phone')}${esc(phone0.display)}</a></div></div></section>`;
  write('/404.html', shell({ path: '/404.html', title: 'Страница не найдена — СТРОЙГРАД', description: 'Страница не найдена. Перейдите на главную страницу или в каталог услуг строительной компании СТРОЙГРАД.', body, current: '/404.html', noindex: true }), { sitemap: false });
}

// =====================================================================
home(); servicesHub(); services.forEach(servicePage); ukPage(); portfolioPage(); aboutPage(); contactsPage(); privacyPage(); consentPage(); notFound();

// sitemap.xml + robots.txt
const urls = pages.map(p => `  <url><loc>${p.loc}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${p.priority}</priority></url>`).join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
console.log(`Собрано страниц: ${pages.length + 1}  (base="${BASE}", url=${SITE_URL}${DRAFT ? ', DRAFT' : ''})`);
