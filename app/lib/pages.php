<?php
// Страницы сайта. Каждая функция возвращает страницы через emit_page(путь, html, опции).
declare(strict_types=1);

function reviews_for(string $slug): array
{
    return array_values(array_filter(S::$reviews, fn($r) => in_array($slug, $r['services'] ?? [], true)));
}
function checklist(array $list, string $cls = ''): string
{
    return '<ul class="checklist ' . $cls . '">' . join_map($list, fn($x) => '<li>' . icon('check') . '<span>' . esc($x) . '</span></li>') . '</ul>';
}
function hero_spec(string $key): array { return S::$structure['hero'][$key]; }
function steps_list(array $steps, string $cls): string
{
    return '<ol class="steps' . $cls . '">' . join_map($steps, fn($s, $i) => '<li class="step"><span class="step__n">' . ($i + 1) . '</span><h3>' . esc($s['title']) . '</h3><p>' . esc($s['text']) . '</p></li>') . '</ol>';
}
function call_actions(string $first): string
{
    $p0 = phone0();
    return $first . '<a class="btn btn--ghost btn--lg" href="tel:' . $p0['tel'] . '" data-goal="phone_click">' . icon('phone') . esc($p0['display']) . '</a>';
}
function std_chips(): array { return ['СРО и лицензии', 'Гарантия до ' . S::$company['warrantyYears'] . ' лет', 'Договор и смета']; }

// Ссылки на услуги, которые скрыты или удалены, при сборке пропускаются
function visible_slugs(array $slugs): array { return array_values(array_filter($slugs, fn($sl) => isset(S::$svcBySlug[$sl]))); }

// Проверка целостности данных перед сборкой: ошибка останавливает сборку, сайт остаётся прежним
function validate_data(): void
{
    foreach (S::$services as $s) {
        if (empty($s['heroBg'])) throw new RuntimeException("Услуга «{$s['title']}»: не выбран фон первого экрана");
        hero_bg($s['heroBg']);
        gallery_ids($s['gallery'] ?? [], true);
    }
    foreach (S::$structure['homePortfolio'] as $b) photo($b['photo']);
    foreach (S::$structure['hero'] as $spec) hero_bg($spec);
}

// =====================================================================
// ГЛАВНАЯ
// =====================================================================
function page_home(): void
{
    $h = S::$site['home']; $c = S::$company; $w = $c['warrantyYears'];
    $bg = hero_bg(hero_spec('home'));
    $hero = page_hero([
        'home' => true, 'bg' => $bg, 'plate' => ['t' => $h['plate']],
        'h1' => $h['h1'], 'tag' => $h['tag'] ?? '', 'lead' => $h['lead'],
        'actions' => call_actions('<a class="btn btn--primary btn--lg" href="#zayavka">Рассчитать стоимость</a>'),
        'chips' => std_chips(),
    ]);

    $reasons = '<section class="reasons" aria-label="Почему выбирают СТРОЙГРАД"><div class="wrap reasons__grid">' . join_map($h['reasons'], fn($r) => '<div class="reason"><span class="reason__ic">' . icon($r['icon']) . '</span><h2 class="reason__t">' . esc($r['title']) . '</h2><p>' . esc($r['text']) . '</p></div>') . '</div></section>';

    $svc = '<section class="section" id="uslugi" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="svc-h">Направления работ</h2><p class="lead">' . esc($c['slogans']['multi']) . '. Все услуги — по договору, со сметой и гарантией до ' . $w . ' лет.</p></div>
    <div class="grid grid--svc">' . join_map(S::$services, fn($s) => service_card($s)) . '</div>
    <p class="center mt"><a class="btn btn--dark" href="' . href('/services/') . '">Каталог услуг ' . icon('arrow') . '</a></p>
  </div>
</section>';

    $uk = '<section class="section section--dark on-dark uk" aria-labelledby="uk-h">
  <div class="wrap uk__grid">
    <div>
      <p class="eyebrow">Для B2B-заказчиков</p>
      <h2 id="uk-h">Управляющим компаниям и ТСЖ</h2>
      <p class="lead">' . esc($c['slogans']['one']) . '. Кровля, фасады, подъезды, лифты, окна и двери, снег — по одному договору, с документами для отчётности.</p>
      <div class="hero__actions"><a class="btn btn--primary" href="' . href('/for-uk-tsj/') . '">Подробнее для УК и ТСЖ</a><a class="btn btn--ghost" href="' . href('/for-uk-tsj/#zayavka') . '">Запросить коммерческое предложение</a></div>
    </div>
    <ul class="uk__list">
      <li>' . icon('doc') . '<div><b>Договор, смета, акты</b><span>Документы для отчётности управляющей компании.</span></div></li>
      <li>' . icon('shield') . '<div><b>СРО и лицензии</b><span>Работаем официально — можно подтвердить перед жильцами и проверяющими.</span></div></li>
      <li>' . icon('calendar') . '<div><b>Гарантия до ' . $w . ' лет</b><span>Срок и условия — в договоре.</span></div></li>
      <li>' . icon('layers') . '<div><b>Один подрядчик вместо пяти</b><span>Один договор и один ответственный менеджер.</span></div></li>
    </ul>
  </div>
</section>';

    $steps = '<section class="section" aria-labelledby="steps-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="steps-h">Как мы работаем</h2><p class="lead">Три шага — от договора до подписанного акта.</p></div>
    ' . steps_list($h['steps'], ' steps--3') . '
  </div>
</section>';

    $port = '<section class="section section--paper" aria-labelledby="port-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="port-h">Выполненные объекты</h2><p class="lead">Фото наших работ. Портфолио с адресами объектов — по запросу.</p></div>
    <div class="grid grid--port">' . join_map(S::$structure['homePortfolio'], fn($b) => '<a class="port card" href="' . href(isset(S::$svcBySlug[$b['slug']]) ? '/services/' . $b['slug'] . '/' : '/portfolio/') . '">' . img($b['photo'], ['sizes' => '(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw', 'cls' => 'port__img']) . '<span class="port__cap">' . esc($b['label']) . '</span></a>') . '</div>
    <p class="center mt"><a class="btn btn--dark" href="' . href('/portfolio/') . '">Все объекты ' . icon('arrow') . '</a></p>
  </div>
</section>';

    $why = '<section class="section section--paper" aria-labelledby="why-h">
  <div class="wrap trustpair">
    <div>
      <h2 id="why-h" class="h2-bar">' . esc($h['whyTitle']) . '</h2>
      <p class="lead">' . esc($c['slogans']['unite']) . '. ' . esc($c['slogans']['one']) . '.</p>
      ' . checklist($h['why'], 'checklist--lg checklist--gold') . '
    </div>
    <div>
      ' . sro_html('sro--panel') . '
      <ul class="minis">' . join_map($h['minis'], fn($m) => '<li>' . esc($m) . '</li>') . '</ul>
      <p style="color:var(--muted);margin-top:18px">' . esc($h['whyNote']) . '</p>
    </div>
  </div>
</section>';

    $feat = array_slice(array_values(array_filter(S::$reviews, fn($r) => !empty($r['featured']))), 0, 3);
    $rv = '<section class="section" aria-labelledby="rv-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="rv-h">Отзывы клиентов</h2><p class="lead">' . $c['yandexReviews']['count'] . ' отзывов на Яндекс Бизнесе (по состоянию на ' . $c['yandexReviews']['asOf'] . '). Часть — ниже.</p></div>
    <div class="grid grid--3">' . join_map($feat, fn($r) => review_card($r)) . '</div>
    <p class="center mt"><a class="link-strong" href="' . href('/about/#otzyvy') . '">Больше отзывов ' . icon('arrow') . '</a></p>
  </div>
</section>';

    $body = $hero . $reasons . $svc . $uk . $steps . $port . $why . $rv . form_html(['title' => 'Рассчитать стоимость', 'lead' => 'Оставьте заявку — приедем на осмотр и составим смету. Можно позвонить или написать в мессенджер.', 'subject' => 'Заявка с главной страницы']) . contacts_block();
    emit_page('/', shell([
        'path' => '/', 'title' => $h['metaTitle'], 'description' => $h['metaDescription'], 'body' => $body, 'current' => '/',
        'ld' => [org_ld(), ['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => $c['name'], 'url' => abs_url('/'), 'inLanguage' => 'ru']],
        'heroPreload' => $bg['preload'],
    ]), ['priority' => '1.0']);
}

function contact_cards(): string
{
    $c = S::$company;
    $tgName = basename(parse_url($c['telegram'], PHP_URL_PATH) ?: $c['telegram']);
    return '<div class="grid grid--3 contacts">
      <div class="card contact"><span class="reason__ic">' . icon('phone') . '</span><h3>Телефоны</h3><p>' . phone_links('contact__link') . '</p></div>
      <div class="card contact"><span class="reason__ic">' . icon('mail') . '</span><h3>Электронная почта</h3><p><a class="contact__link" href="mailto:' . $c['email'] . '">' . esc($c['email']) . '</a></p></div>
      <div class="card contact"><span class="reason__ic">' . icon('telegram') . '</span><h3>Мессенджеры</h3><p><a class="contact__link" href="' . $c['telegram'] . '" target="_blank" rel="noopener">Telegram: @' . $tgName . '</a><a class="contact__link" href="' . $c['max'] . '" target="_blank" rel="noopener">Группа в MAX</a></p></div>
    </div>';
}
function contacts_block(): string
{
    return '<section class="section" aria-labelledby="cont-h">
  <div class="wrap">
    <div class="sec-head"><h2 id="cont-h">Контакты</h2><p class="lead">Работаем в Самаре и Самарской области.</p></div>
    ' . contact_cards() . '
  </div>
</section>';
}

// =====================================================================
// КАТАЛОГ УСЛУГ
// =====================================================================
function page_services_hub(): void
{
    $s = S::$site['services'];
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Услуги', 'path' => '/services/']];
    $bg = hero_bg(hero_spec('services'));
    $body = page_hero(['h1' => $s['h1'], 'lead' => $s['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => $s['plate'], 's' => $s['plateSub']], 'quality' => S::$site['home']['quality'], 'actions' => '<a class="btn btn--primary btn--lg" href="#zayavka">Оставить заявку</a>']) .
        '<section class="section"><div class="wrap"><h2 class="sr-only">Все направления работ</h2><div class="grid grid--svc">' . join_map(S::$services, fn($x) => service_card($x)) . '</div></div></section>' .
        form_html(['title' => 'Не знаете, какая услуга нужна?', 'lead' => 'Опишите задачу — подскажем решение и рассчитаем стоимость.', 'subject' => 'Заявка из каталога услуг']);
    emit_page('/services/', shell([
        'path' => '/services/', 'title' => $s['metaTitle'], 'description' => $s['metaDescription'], 'body' => $body, 'current' => '/services/', 'heroPreload' => $bg['preload'],
        'ld' => [crumbs_ld($items), ['@context' => 'https://schema.org', '@type' => 'ItemList', 'itemListElement' => array_map(fn($x, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'url' => abs_url('/services/' . $x['slug'] . '/'), 'name' => $x['title']], S::$services, array_keys(S::$services))]],
    ]), ['priority' => '0.9']);
}

// =====================================================================
// СТРАНИЦА УСЛУГИ (единый шаблон)
// =====================================================================
function page_service(array $s): void
{
    $c = S::$company;
    $pth = '/services/' . $s['slug'] . '/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Услуги', 'path' => '/services/'], ['name' => $s['title'], 'path' => $pth]];
    $bg = hero_bg($s['heroBg']);
    $hero = page_hero([
        'h1' => $s['h1'], 'lead' => $s['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg,
        'plate' => !empty($s['plate']['t']) ? $s['plate'] : ['t' => $s['title']],
        'actions' => call_actions('<a class="btn btn--primary btn--lg" href="#zayavka">Рассчитать стоимость</a>'),
        'chips' => std_chips(),
    ]);

    $tl = $s['tiles'] ?? [];
    $tiles = $tl
        ? '<section class="section section--tight" aria-labelledby="tl-h"><div class="wrap"><h2 id="tl-h" class="h3 tiles__h">' . esc(($s['tilesTitle'] ?? '') ?: 'Направления работ') . '</h2><ul class="tiles' . (count($tl) === 5 || count($tl) === 10 ? ' tiles--5' : '') . '">' . join_map($tl, fn($t) => '<li class="tile"><span class="tile__t">' . esc($t['t']) . '</span>' . (!empty($t['s']) ? '<span class="tile__s">' . esc($t['s']) . '</span>' : '') . '</li>') . '</ul></div></section>'
        : '';

    $price = '<section class="section section--tight"><div class="wrap"><div class="price card"><div><span class="price__label">Стоимость</span><p class="price__value">Рассчитаем по объекту</p></div><p class="price__note">' . esc($s['priceNote']) . '</p><a class="btn btn--primary" href="#zayavka">Получить расчёт</a></div></div></section>';

    $includes = '<section class="section" aria-labelledby="inc-h"><div class="wrap two-col">
    <div><h2 id="inc-h">Что входит в работы</h2><ul class="checklist checklist--lg">' . join_map($s['includes'], fn($x) => '<li>' . icon('check') . '<span>' . esc($x) . '</span></li>') . '</ul></div>
    <div class="signs"><h2>' . esc($s['signsTitle']) . '</h2><ul class="dots">' . join_map($s['signs'], fn($x) => '<li>' . esc($x) . '</li>') . '</ul></div>
  </div></section>';

    $steps = '<section class="section section--paper" aria-labelledby="st-h"><div class="wrap">
    <div class="sec-head"><h2 id="st-h">' . esc($s['stepsTitle']) . '</h2></div>
    ' . steps_list($s['steps'], '') . '
  </div></section>';

    $gal = '';
    $cap = $s['gallery_caption'] ?? '';
    $gids = gallery_ids($s['gallery'] ?? [], (bool)$cap);
    if ($gids) {
        $gal = '<section class="section" aria-labelledby="gal-h"><div class="wrap">
      <div class="sec-head"><h2 id="gal-h">Фото работ</h2>' . ($cap ? '<p class="lead">' . esc($cap) . '</p>' : '<p class="lead">Нажмите на фото, чтобы увеличить. Портфолио с адресами объектов — по запросу.</p>') . '</div>
      ' . gallery_html($gids) . '
    </div></section>';
    }

    $why = !empty($s['why']) ? $s['why'] : S::$site['whyDefault'];
    $promise = !empty($s['promise']) ? '<h3>Мы гарантируем</h3>' . checklist($s['promise'], 'checklist--gold') : '';
    $whySec = '<section class="section section--paper" aria-labelledby="why-h"><div class="wrap why__grid">
    <div><h2 id="why-h" class="h2-bar">Почему выбирают нас?</h2>' . checklist($why, 'checklist--lg checklist--gold') . '</div>
    <div class="why__side">' . sro_html('sro--panel') . '<h3>Сроки</h3><p>' . esc($s['term']) . '</p><h3>Гарантия</h3><p>' . esc($s['warranty']) . '</p>' . $promise . '</div>
  </div></section>';

    $rv = array_slice(reviews_for($s['slug']), 0, 3);
    $n = count($rv);
    $rvHtml = $rv
        ? '<section class="section" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы клиентов</h2><p class="lead">Реальные отзывы с Яндекс Бизнеса.</p></div><div class="grid grid--' . ($n === 1 ? '1' : ($n === 2 ? '2' : '3')) . '">' . join_map($rv, fn($r) => review_card($r)) . '</div></div></section>'
        : '';

    $faq = '<section class="section section--paper" aria-labelledby="faq-h"><div class="wrap wrap--narrow"><div class="sec-head"><h2 id="faq-h">Вопросы и ответы</h2></div>' . faq_html($s['faq']) . '</div></section>';

    $closingText = ($s['closing'] ?? '') ?: $c['slogans']['main'];
    $closing = '<section class="closing" aria-label="' . esc($closingText) . '"><div class="wrap"><p class="closing__t">' . esc($closingText) . '</p><p class="closing__s" aria-hidden="true">★ ★ ★ ★ ★</p></div></section>';

    $related = '<section class="section" aria-labelledby="rel-h"><div class="wrap"><div class="sec-head"><h2 id="rel-h">Смежные услуги</h2></div><div class="grid grid--3">' . join_map(visible_slugs($s['related'] ?? []), fn($r) => service_card(S::$svcBySlug[$r])) . '</div></div></section>';

    $body = $hero . $tiles . $price . $includes . $steps . $gal . $whySec . $rvHtml . $faq . $closing . form_html(['title' => 'Заявка: ' . mb_strtolower($s['title']), 'lead' => 'Оставьте контакты — свяжемся, уточним задачу и договоримся о выезде на осмотр.', 'subject' => 'Заявка: ' . $s['title'], 'selected' => $s['title']]) . $related;

    $ld = [
        crumbs_ld($items),
        [
            '@context' => 'https://schema.org', '@type' => 'Service', 'name' => $s['title'], 'serviceType' => $s['title'], 'description' => $s['metaDescription'],
            'url' => abs_url($pth), 'inLanguage' => 'ru',
            'provider' => ['@type' => 'GeneralContractor', 'name' => $c['name'], 'url' => abs_url('/'), 'telephone' => array_map(fn($p) => $p['tel'], $c['phones']), 'email' => $c['email']],
            'areaServed' => [['@type' => 'City', 'name' => $c['city']], ['@type' => 'AdministrativeArea', 'name' => $c['region']]],
        ],
        faq_ld($s['faq']),
    ];
    emit_page($pth, shell(['path' => $pth, 'title' => $s['metaTitle'], 'description' => $s['metaDescription'], 'body' => $body, 'ld' => $ld, 'current' => '/services/', 'ogImage' => '/og.jpg', 'heroPreload' => $bg['preload']]), ['priority' => '0.8']);
}

// =====================================================================
// ДЛЯ УК И ТСЖ
// =====================================================================
function page_uk(): void
{
    $u = S::$site['uk'];
    $pth = '/for-uk-tsj/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Управляющим компаниям и ТСЖ', 'path' => $pth]];
    $bg = hero_bg(hero_spec('uk'));
    $hero = page_hero([
        'h1' => $u['h1'], 'lead' => $u['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => $u['plate'], 's' => $u['plateSub']],
        'actions' => call_actions('<a class="btn btn--primary btn--lg" href="#zayavka">Запросить коммерческое предложение</a>'),
        'chips' => ['СРО и лицензии', 'Договор, смета, акты', 'Гарантия до ' . S::$company['warrantyYears'] . ' лет'],
    ]);
    $needs = '<section class="section" aria-labelledby="needs-h"><div class="wrap"><div class="sec-head"><h2 id="needs-h">' . esc($u['needsTitle']) . '</h2></div>
    <div class="grid grid--3">' . join_map($u['needs'], fn($n) => '<div class="card trust"><span class="reason__ic">' . icon($n['icon']) . '</span><h3>' . esc($n['title']) . '</h3><p>' . esc($n['text']) . '</p></div>') . '</div></div></section>';
    $svcs = '<section class="section section--paper" aria-labelledby="us-h"><div class="wrap"><div class="sec-head"><h2 id="us-h">' . esc($u['servicesTitle']) . '</h2></div>
    <div class="grid grid--svc">' . join_map(visible_slugs($u['serviceSlugs']), fn($sl) => service_card(S::$svcBySlug[$sl])) . '</div></div></section>';
    $docs = '<section class="section" aria-labelledby="docs-h"><div class="wrap two-col">
    <div><h2 id="docs-h">' . esc($u['docsTitle']) . '</h2><ul class="checklist checklist--lg">' . join_map($u['docs'], fn($d) => '<li>' . icon('check') . '<span>' . esc($d) . '</span></li>') . '</ul></div>
    <div><h2>Как мы работаем</h2>' . steps_list(S::$site['home']['steps'], ' steps--v') . '</div>
  </div></section>';
    $rv = array_slice(array_values(array_filter(S::$reviews, fn($r) => (bool)preg_match('/ТСЖ|(^|[\s,.(])УК([\s,.)]|$)|МКД|многоквартирн/u', $r['text']))), 0, 3);
    $rvHtml = '<section class="section section--paper" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы управляющих компаний и ТСЖ</h2><p class="lead">Реальные отзывы с Яндекс Бизнеса.</p></div><div class="grid grid--3">' . join_map($rv, fn($r) => review_card($r)) . '</div></div></section>';
    $faq = '<section class="section" aria-labelledby="faq-h"><div class="wrap wrap--narrow"><div class="sec-head"><h2 id="faq-h">Вопросы и ответы</h2></div>' . faq_html($u['faq']) . '</div></section>';
    $body = $hero . $needs . $svcs . $docs . $rvHtml . $faq . form_html(['title' => 'Запросить коммерческое предложение', 'lead' => 'Опишите задачу или объекты — подготовим предложение и договоримся об осмотре.', 'subject' => 'КП для УК/ТСЖ', 'withPortfolio' => true]);
    emit_page($pth, shell([
        'path' => $pth, 'title' => $u['metaTitle'], 'description' => $u['metaDescription'], 'body' => $body, 'current' => $pth, 'heroPreload' => $bg['preload'],
        'ld' => [crumbs_ld($items), faq_ld($u['faq'])],
    ]), ['priority' => '0.9']);
}

// =====================================================================
// ПОРТФОЛИО
// =====================================================================
function page_portfolio(): void
{
    $p = S::$site['portfolio'];
    $pth = '/portfolio/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Портфолио', 'path' => $pth]];
    $bg = hero_bg(hero_spec('portfolio'));
    $hero = page_hero(['h1' => $p['h1'], 'lead' => $p['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => $p['plate'], 's' => $p['plateSub']], 'actions' => '<a class="btn btn--primary btn--lg" href="#zayavka">Запросить портфолио</a>']);
    $cats = S::$structure['portfolioCats'];
    $all = [];
    foreach ($cats as $cat) foreach (S::$photos[$cat['key']] ?? [] as $ph) if (($ph['kind'] ?? '') !== 'illustration') $all[] = $ph + ['cat' => $cat];
    $count = fn($key) => count(array_filter($all, fn($a) => $a['cat']['key'] === $key));
    $filters = '<div class="filters" role="group" aria-label="Фильтр по виду работ"><button type="button" class="chip is-active" data-filter="all" aria-pressed="true">Все (' . count($all) . ')</button>' . join_map($cats, fn($c) => '<button type="button" class="chip" data-filter="' . $c['key'] . '" aria-pressed="false">' . esc($c['label']) . ' (' . $count($c['key']) . ')</button>') . '</div>';
    $FIRST = 24;
    $grid = '<ul class="gallery gallery--port" data-lightbox data-filterable>' . join_map($all, fn($a, $i) => '<li data-cat="' . $a['cat']['key'] . '"' . ($i >= $FIRST ? ' hidden data-more' : '') . '><a href="' . img_url($a['id']) . '" class="gallery__item" data-w="' . $a['w'] . '" data-h="' . $a['h'] . '">' . img($a['id'], ['sizes' => '(min-width: 900px) 25vw, (min-width: 560px) 33vw, 50vw']) . '<span class="gallery__cap">' . esc($a['cat']['label']) . '</span></a></li>') . '</ul><p class="center mt" data-showall-wrap><button type="button" class="btn btn--dark" data-showall>Показать все ' . count($all) . ' фото</button></p><noscript><style>.gallery li[hidden]{display:block}[data-showall-wrap]{display:none}</style></noscript>';
    $note = '<p class="note">Показаны снимки с рабочих объектов и коллажи «до/после». Адреса объектов и контакты заказчиков не публикуем — портфолио с адресами предоставим по запросу.</p>';
    $body = $hero . '<section class="section"><div class="wrap">' . $filters . $grid . $note . '</div></section>' . form_html(['title' => 'Запросить портфолио с адресами', 'lead' => 'Пришлём портфолио и подготовим коммерческое предложение.', 'subject' => 'Запрос портфолио', 'withPortfolio' => true]);
    emit_page($pth, shell(['path' => $pth, 'title' => $p['metaTitle'], 'description' => $p['metaDescription'], 'body' => $body, 'current' => $pth, 'ld' => [crumbs_ld($items)], 'heroPreload' => $bg['preload']]), ['priority' => '0.7']);
}

// =====================================================================
// О КОМПАНИИ
// =====================================================================
function page_about(): void
{
    $a = S::$site['about']; $c = S::$company;
    $pth = '/about/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'О компании', 'path' => $pth]];
    $bg = hero_bg(hero_spec('about'));
    $hero = page_hero(['h1' => $a['h1'], 'lead' => $a['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => $a['plate'], 's' => $a['plateSub']], 'eyebrow' => 'С ' . $c['foundedYear'] . ' года в Самаре', 'actions' => '<a class="btn btn--primary btn--lg" href="' . href('/contacts/#zayavka') . '">Связаться с нами</a>']);
    $hist = '<section class="section" aria-labelledby="hist-h"><div class="wrap two-col">
    <div><h2 id="hist-h">' . esc($a['historyTitle']) . '</h2>' . join_map($a['history'], fn($t) => '<p>' . esc($t) . '</p>') . '</div>
    <div class="card facts"><dl>
      <div><dt>Работаем с</dt><dd>' . $c['foundedYear'] . ' года</dd></div>
      <div><dt>Опыт специалистов</dt><dd>от ' . $c['teamExperienceYears'] . ' лет</dd></div>
      <div><dt>Гарантия</dt><dd>до ' . $c['warrantyYears'] . ' лет</dd></div>
      <div><dt>География</dt><dd>Самара и Самарская область</dd></div>
      <div><dt>Прежние названия</dt><dd>' . implode(', ', array_map(fn($n) => '«' . esc($n) . '»', $c['formerNames'])) . '</dd></div>
    </dl></div>
  </div></section>';
    $team = '<section class="section section--paper" aria-labelledby="team-h"><div class="wrap two-col">
    <div><h2 id="team-h">' . esc($a['teamTitle']) . '</h2><p>' . esc($a['team']) . '</p></div>
    <div><h2>' . esc($a['docsTitle']) . '</h2><p>' . esc($a['docs']) . '</p>' . (!empty($c['requisites']['sro']) ? '<p>СРО: ' . esc($c['requisites']['sro']) . '</p>' : todo('название СРО, номер членства, вид допуска')) . '</div>
  </div></section>';
    $work = '<section class="section" aria-labelledby="work-h"><div class="wrap"><div class="sec-head"><h2 id="work-h">' . esc($a['workTitle']) . '</h2><p class="lead">' . esc($c['slogans']['triad']) . '</p></div>
    ' . steps_list($a['values'], ' steps--3') . '</div></section>';
    $slog = '<section class="section section--paper"><div class="wrap"><ul class="slogans">' . join_map(['main', 'unite', 'multi', 'one'], fn($k) => '<li>' . esc($c['slogans'][$k]) . '</li>') . '</ul></div></section>';
    $rvs = '<section class="section" id="otzyvy" aria-labelledby="rv-h"><div class="wrap"><div class="sec-head"><h2 id="rv-h">Отзывы клиентов</h2><p class="lead">На Яндекс Бизнесе — ' . $c['yandexReviews']['count'] . ' отзывов (по состоянию на ' . $c['yandexReviews']['asOf'] . '). Ниже — часть из них, тексты перенесены без изменений по смыслу.</p></div>
    <div class="grid grid--3 masonry">' . join_map(S::$reviews, fn($r) => review_card($r)) . '</div></div></section>';
    $body = $hero . $hist . $team . $work . $slog . $rvs . form_html(['title' => 'Задать вопрос или запросить документы', 'lead' => 'Копии СРО, лицензий и портфолио с адресами объектов предоставим по запросу.', 'subject' => 'Вопрос со страницы «О компании»', 'withPortfolio' => true]);
    emit_page($pth, shell(['path' => $pth, 'title' => $a['metaTitle'], 'description' => $a['metaDescription'], 'body' => $body, 'current' => $pth, 'ld' => [crumbs_ld($items), org_ld()], 'heroPreload' => $bg['preload']]), ['priority' => '0.7']);
}

// =====================================================================
// КОНТАКТЫ
// =====================================================================
function page_contacts(): void
{
    $cp = S::$site['contacts']; $c = S::$company;
    $pth = '/contacts/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Контакты', 'path' => $pth]];
    $bg = hero_bg(hero_spec('contacts'));
    $p0 = phone0();
    $hero = page_hero(['h1' => $cp['h1'], 'lead' => $cp['lead'], 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => $cp['plate'], 's' => $cp['plateSub']], 'actions' => '<a class="btn btn--primary btn--lg" href="tel:' . $p0['tel'] . '" data-goal="phone_click">' . icon('phone') . esc($p0['display']) . '</a><a class="btn btn--ghost btn--lg" href="#zayavka">Оставить заявку</a>']);
    $r = $c['requisites'];
    $reqRows = array_values(array_filter([['Наименование', $r['legalName'] ?? null], ['ИНН', $r['inn'] ?? null], ['ОГРН', $r['ogrn'] ?? null], ['Адрес', $r['legalAddress'] ?? null]], fn($x) => !empty($x[1])));
    $req = $reqRows
        ? '<div class="card"><h3>Реквизиты</h3><dl class="reqs">' . join_map($reqRows, fn($x) => '<div><dt>' . $x[0] . '</dt><dd>' . esc($x[1]) . '</dd></div>') . '</dl></div>'
        : (S::$draft ? '<div class="card"><h3>Реквизиты</h3><p>' . todo('юрлицо/ИП, ИНН, ОГРН, юридический адрес') . '</p></div>' : '');
    $info = '<section class="section" aria-labelledby="ci-h"><div class="wrap">
    <h2 id="ci-h" class="sr-only">Как с нами связаться</h2>
    ' . contact_cards() . '
    <div class="grid grid--2 mt-lg">
      <div class="card"><h3>Где работаем</h3><p>Самара и Самарская область. На объект выезжаем сами: осматриваем, замеряем и составляем смету. Для заказчиков из области согласуем выезд по телефону.</p>' . (!empty($c['officeAddress']) ? '<p>' . esc($c['officeAddress']) . '</p>' : todo('адрес офиса')) . (!empty($c['workHours']) ? '<p>Режим работы: ' . esc($c['workHours']) . '</p>' : todo('режим работы')) . '</div>
      ' . $req . '
    </div></div></section>';
    $body = $hero . $info . form_html(['title' => 'Оставить заявку на замер и смету', 'lead' => 'Опишите задачу — мы свяжемся с вами и договоримся о выезде.', 'subject' => 'Заявка со страницы «Контакты»']);
    emit_page($pth, shell(['path' => $pth, 'title' => $cp['metaTitle'], 'description' => $cp['metaDescription'], 'body' => $body, 'current' => $pth, 'ld' => [crumbs_ld($items), org_ld()], 'heroPreload' => $bg['preload']]), ['priority' => '0.7']);
}

// =====================================================================
// ЮРИДИЧЕСКИЕ СТРАНИЦЫ (152-ФЗ)
// =====================================================================
function date_ru(string $ymd): string
{
    static $m = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    [$y, $mo, $d] = array_map('intval', explode('-', $ymd));
    return $d . ' ' . $m[$mo - 1] . ' ' . $y . ' г.';
}
function operator_line(): string
{
    $c = S::$company; $r = $c['requisites'];
    $bits = array_values(array_filter([($r['legalName'] ?? '') ?: 'компания «' . $c['name'] . '» (' . $c['city'] . ')', !empty($r['inn']) ? 'ИНН ' . $r['inn'] : null, !empty($r['ogrn']) ? 'ОГРН ' . $r['ogrn'] : null, $r['legalAddress'] ?? null]));
    return esc(implode(', ', $bits)) . (count($bits) < 2 ? todo('полное наименование юрлица/ИП, ИНН, ОГРН, юридический адрес') : '');
}
function legal_hero(string $h1, string $lead, array $items): array
{
    $bg = hero_bg(hero_spec('legal'));
    return ['bg' => $bg, 'html' => page_hero(['h1' => $h1, 'lead' => $lead, 'crumbsHtml' => crumbs($items), 'bg' => $bg, 'plate' => ['t' => 'Документы', 's' => 'персональные данные'], 'sro' => false])];
}
function page_privacy(): void
{
    $c = S::$company; $email = $c['email']; $site = esc(S::$siteUrl . S::$base);
    $pth = '/privacy/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Политика конфиденциальности', 'path' => $pth]];
    $hh = legal_hero('Политика конфиденциальности', 'Порядок обработки персональных данных посетителей сайта. Редакция от ' . date_ru(S::$buildDate) . '.', $items);
    $mail = '<a href="mailto:' . $email . '">' . esc($email) . '</a>';
    $body = $hh['html'] . '<section class="section"><div class="wrap wrap--narrow prose">
<h2>1. Общие положения</h2>
<p>Настоящая политика определяет порядок обработки и защиты персональных данных пользователей сайта ' . $site . '/ (далее — сайт) и составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
<p>Оператор персональных данных: ' . operator_line() . '. Электронная почта для обращений: ' . $mail . '.</p>
<h2>2. Какие данные мы собираем</h2>
<p>Через формы на сайте вы можете передать нам: имя, номер телефона, текст комментария (адрес объекта, описание задачи), выбранное направление работ, а также отметку о запросе портфолио. Вместе с заявкой передаётся адрес страницы сайта, с которой она отправлена.</p>
<p>При обращении к сайту серверы, на которых он размещён, могут автоматически фиксировать технические данные: IP-адрес, тип браузера, дату и время запроса. Эти данные используются для обеспечения работы и безопасности сайта.</p>
<h2>3. Цели обработки</h2>
<ul><li>связаться с вами по заявке, уточнить задачу и организовать выезд на осмотр;</li><li>рассчитать стоимость работ и подготовить коммерческое предложение;</li><li>заключить и исполнить договор;</li><li>направить запрошенные материалы (портфолио, коммерческое предложение).</li></ul>
<h2>4. Правовое основание</h2>
<p>Обработка осуществляется на основании вашего согласия (п. 1 ч. 1 ст. 6 Федерального закона № 152-ФЗ). Согласие даётся отметкой в форме заявки и текстом <a href="' . href('/consent/') . '">согласия на обработку персональных данных</a>.</p>
<h2>5. Порядок и сроки обработки</h2>
<p>Мы выполняем сбор, запись, систематизацию, накопление, хранение, уточнение, использование и удаление персональных данных. Данные хранятся до достижения целей обработки либо до отзыва вами согласия — в зависимости от того, что наступит раньше, если иное не требуется законом.</p>
<p>Запись, систематизация, накопление и хранение персональных данных граждан Российской Федерации осуществляются с использованием баз данных, находящихся на территории Российской Федерации.</p>
<h2>6. Передача третьим лицам</h2>
<p>Мы не продаём и не передаём ваши данные третьим лицам, за исключением случаев, когда это необходимо для приёма и обработки заявок (например, почтовый сервис или мессенджер, в который приходят уведомления), а также случаев, предусмотренных законом.</p>
<h2>7. Ваши права</h2>
<p>Вы вправе получить информацию об обработке своих персональных данных, потребовать их уточнения, блокирования или удаления, а также отозвать согласие. Для этого направьте обращение на ' . $mail . '. Мы ответим в сроки, установленные законом.</p>
<h2>8. Файлы cookie</h2>
<p>Сайт использует файлы cookie, необходимые для его корректной работы, а также запоминает ваш выбор в уведомлении о cookie. Инструменты веб-аналитики и рекламные трекеры на сайте на данный момент не используются. Если аналитика (например, Яндекс.Метрика) будет подключена, мы обновим этот раздел. Вы можете отключить cookie в настройках браузера — это не повлияет на возможность отправить заявку.</p>
<h2>9. Изменения политики</h2>
<p>Оператор вправе обновлять политику. Актуальная редакция всегда опубликована на этой странице.</p>
</div></section>';
    emit_page($pth, shell(['path' => $pth, 'title' => 'Политика конфиденциальности — СТРОЙГРАД', 'description' => 'Политика конфиденциальности и порядок обработки персональных данных на сайте строительной компании СТРОЙГРАД (Самара).', 'body' => $body, 'current' => $pth, 'ld' => [crumbs_ld($items)], 'heroPreload' => $hh['bg']['preload']]), ['priority' => '0.2']);
}
function page_consent(): void
{
    $c = S::$company; $email = $c['email']; $site = esc(S::$siteUrl . S::$base);
    $pth = '/consent/';
    $items = [['name' => 'Главная', 'path' => '/'], ['name' => 'Согласие на обработку персональных данных', 'path' => $pth]];
    $hh = legal_hero('Согласие на обработку персональных данных', 'Редакция от ' . date_ru(S::$buildDate) . '.', $items);
    $body = $hh['html'] . '<section class="section"><div class="wrap wrap--narrow prose">
<p>Отправляя форму на сайте ' . $site . '/ и ставя отметку о согласии, я, в соответствии со ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных», свободно, своей волей и в своём интересе даю согласие оператору — ' . operator_line() . ' — на обработку моих персональных данных на следующих условиях.</p>
<h2>Какие данные</h2>
<p>Имя, номер телефона, содержание комментария, выбранное направление работ, сведения о запросе портфолио, адрес страницы сайта, с которой отправлена заявка.</p>
<h2>Цели</h2>
<p>Связь со мной по моей заявке, расчёт стоимости и подготовка коммерческого предложения, организация выезда на объект, заключение и исполнение договора, направление запрошенных материалов.</p>
<h2>Действия с данными</h2>
<p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), использование, передача исполнителям, участвующим в приёме заявок, обезличивание, блокирование, удаление и уничтожение — с использованием средств автоматизации и без них.</p>
<h2>Срок и отзыв согласия</h2>
<p>Согласие действует до достижения целей обработки либо до момента его отзыва. Я могу отозвать согласие, направив письменное обращение на <a href="mailto:' . $email . '">' . esc($email) . '</a>. После отзыва оператор прекращает обработку и удаляет данные, если у него нет иных законных оснований для их хранения.</p>
<p>Подробнее — в <a href="' . href('/privacy/') . '">политике конфиденциальности</a>.</p>
</div></section>';
    emit_page($pth, shell(['path' => $pth, 'title' => 'Согласие на обработку персональных данных — СТРОЙГРАД', 'description' => 'Текст согласия на обработку персональных данных при отправке заявки на сайте строительной компании СТРОЙГРАД (Самара).', 'body' => $body, 'current' => $pth, 'ld' => [crumbs_ld($items)], 'heroPreload' => $hh['bg']['preload']]), ['priority' => '0.2']);
}

// =====================================================================
// 404
// =====================================================================
function page_not_found(): void
{
    $bg = hero_bg(hero_spec('nf'));
    $p0 = phone0();
    $body = page_hero([
        'h1' => 'Такой страницы нет', 'lead' => 'Возможно, ссылка устарела или в адресе опечатка. Перейдите на главную или в каталог услуг — или позвоните нам.', 'bg' => $bg, 'plate' => ['t' => 'Ошибка 404'], 'sro' => false,
        'actions' => '<a class="btn btn--primary btn--lg" href="' . href('/') . '">На главную</a><a class="btn btn--ghost btn--lg" href="' . href('/services/') . '">Все услуги</a><a class="btn btn--ghost btn--lg" href="tel:' . $p0['tel'] . '">' . icon('phone') . esc($p0['display']) . '</a>',
    ]);
    emit_page('/404.html', shell(['path' => '/404.html', 'title' => 'Страница не найдена — СТРОЙГРАД', 'description' => 'Страница не найдена. Перейдите на главную страницу или в каталог услуг строительной компании СТРОЙГРАД.', 'body' => $body, 'current' => '/404.html', 'noindex' => true, 'heroPreload' => $bg['preload']]), ['sitemap' => false]);
}
