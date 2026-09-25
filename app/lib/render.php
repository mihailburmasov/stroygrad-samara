<?php
// Общие части страниц: данные, ссылки, изображения, шапка и подвал, оболочка страницы, формы заявки.
declare(strict_types=1);

// Данные сайта на время одной сборки
final class S
{
    public static string $base = '';
    public static string $siteUrl = '';
    public static bool $draft = false;
    public static string $buildDate = '';
    public static array $company = [];
    public static array $site = [];
    public static array $reviews = [];
    public static array $photos = [];
    public static array $photoIndex = [];
    public static array $heroDims = [];
    public static array $structure = [];
    public static array $services = [];
    public static array $svcBySlug = [];
}

function load_site_data(): void
{
    $d = cfg('data_dir');
    S::$siteUrl = rtrim((string)cfg('site_url'), '/');
    S::$base = rtrim((string)cfg('base_path'), '/');
    S::$draft = getenv('DRAFT') === '1' || cfg('draft');
    S::$buildDate = gmdate('Y-m-d');
    S::$company = read_json("$d/company.json");
    S::$site = read_json("$d/site.json");
    S::$reviews = read_json("$d/reviews.json")['items'];
    S::$photos = read_json("$d/photos.json");
    S::$heroDims = read_json("$d/hero.json");
    S::$structure = read_json("$d/structure.json");
    S::$photoIndex = [];
    foreach (S::$photos as $list) foreach ($list as $p) S::$photoIndex[$p['id']] = $p;

    $files = glob("$d/services/*.json") ?: [];
    sort($files, SORT_STRING);
    $svc = array_map('read_json', $files);
    // Порядок — из structure.json; услуги, которых нет в списке, идут в конце
    $order = array_flip(S::$structure['servicesOrder'] ?? []);
    usort($svc, fn($a, $b) => [$order[$a['slug']] ?? PHP_INT_MAX, $a['slug']] <=> [$order[$b['slug']] ?? PHP_INT_MAX, $b['slug']]);
    S::$services = array_values(array_filter($svc, fn($s) => empty($s['hidden'])));
    S::$svcBySlug = [];
    foreach (S::$services as $s) S::$svcBySlug[$s['slug']] = $s;
}

function esc($s): string
{
    return str_replace(['&', '<', '>', '"'], ['&amp;', '&lt;', '&gt;', '&quot;'], (string)($s ?? ''));
}
function href(string $p): string { return S::$base . $p; }
// Ссылка на css/js с версией по содержимому: после обновления файла браузеры сразу берут новый
function asset(string $p): string
{
    static $cache = [];
    $f = rtrim(cfg('public_dir'), '/\\') . $p;
    $cache[$p] ??= is_file($f) ? substr(md5_file($f), 0, 10) : S::$buildDate;
    return S::$base . $p . '?v=' . $cache[$p];
}
function abs_url(string $p): string { return S::$siteUrl . S::$base . $p; }
function json_ld($o): string { return str_replace('<', '\\u003c', json_encode($o, JSON_FLAGS | JSON_UNESCAPED_LINE_TERMINATORS)); }
function join_map(array $list, callable $fn, string $sep = ''): string { return implode($sep, array_map($fn, $list, array_keys($list))); }

// ---------- изображения ----------
function photo(string $id): array
{
    if (!isset(S::$photoIndex[$id])) throw new RuntimeException('Нет фото ' . $id);
    return S::$photoIndex[$id];
}
function img_url(string $id, string $suffix = ''): string { return S::$base . '/img/' . $id . $suffix . '.webp'; }

function img(string $id, array $o = []): string
{
    $sizes = $o['sizes'] ?? '(min-width: 900px) 33vw, 100vw';
    $cls = $o['cls'] ?? '';
    $p = photo($id);
    $src = img_url($p['id']);
    $sm = img_url($p['id'], '-sm');
    return '<img class="' . $cls . '" src="' . $src . '" srcset="' . $sm . ' ' . $p['sw'] . 'w, ' . $src . ' ' . $p['w'] . 'w" sizes="' . $sizes . '" width="' . $p['w'] . '" height="' . $p['h'] . '" alt="' . esc($p['alt']) . '" ' . (!empty($o['eager']) ? 'fetchpriority="high"' : 'loading="lazy"') . ' decoding="async">';
}

// Элементы галереи: id фото или ключ категории (тогда — все её фото)
function gallery_ids(array $entries, bool $allowIllustration): array
{
    $out = [];
    foreach ($entries as $e) {
        if (isset(S::$photos[$e])) {
            foreach (S::$photos[$e] as $p) if ($allowIllustration || ($p['kind'] ?? '') !== 'illustration') $out[] = $p['id'];
        } else { photo($e); $out[] = $e; }
    }
    return $out;
}

function gallery_html(array $ids, string $cols = ''): string
{
    return '<ul class="gallery ' . $cols . '" data-lightbox>' . join_map($ids, function ($id) {
        $p = photo($id);
        return '<li><a href="' . img_url($p['id']) . '" class="gallery__item" data-w="' . $p['w'] . '" data-h="' . $p['h'] . '">' . img($id, ['sizes' => '(min-width: 900px) 25vw, (min-width: 560px) 33vw, 50vw']) . '</a></li>';
    }) . '</ul>';
}

// ---------- реквизиты и плейсхолдеры ----------
function todo(string $label): string { return S::$draft ? '<mark class="todo">{{УТОЧНИТЬ: ' . esc($label) . '}}</mark>' : ''; }
function phone_link(array $p, string $cls = '', bool $goal = true): string
{
    return '<a class="' . $cls . '" href="tel:' . $p['tel'] . '"' . ($goal ? ' data-goal="phone_click"' : '') . '>' . esc($p['display']) . '</a>';
}
function phone0(): array { return S::$company['phones'][0]; }
// Telegram в шапке: личный чат, если задан, иначе — канал
function tg_chat(): string { return (string)((S::$company['telegramChat'] ?? '') ?: S::$company['telegram']); }
function max_chat(): string { return (string)((S::$company['maxChat'] ?? '') ?: S::$company['max']); }
function phone_links(string $cls, string $sep = ''): string { return join_map(S::$company['phones'], fn($p) => phone_link($p, $cls), $sep); }

// ---------- разметка ----------
function review_card(array $r): string
{
    return '<figure class="review card">
  <div class="review__stars" role="img" aria-label="Оценка 5 из 5">' . str_repeat('★', 5) . '</div>
  <blockquote class="review__text"><p>' . esc($r['text']) . '</p></blockquote>
  <figcaption class="review__by"><strong>' . esc($r['author']) . '</strong><span>' . esc($r['date']) . ' · отзыв на Яндекс Бизнесе</span></figcaption>
</figure>';
}

function faq_html(array $list): string
{
    return '<div class="faq">' . join_map($list, fn($f) => '<details class="faq__item"><summary>' . esc($f['q']) . icon('chevron', 'faq__ic') . '</summary><div class="faq__a"><p>' . esc($f['a']) . '</p></div></details>') . '</div>';
}

function service_card(array $s, string $cls = ''): string
{
    return '<a class="card svc ' . $cls . '" href="' . href('/services/' . $s['slug'] . '/') . '">
  <span class="svc__icon">' . icon($s['icon']) . '</span>
  <h3 class="svc__title">' . esc($s['title']) . '</h3>
  <p class="svc__text">' . esc($s['short']) . '</p>
  <span class="svc__more">Подробнее ' . icon('arrow') . '</span>
</a>';
}

// items: [[name, path]] — последний пункт без ссылки
function crumbs(array $items): string
{
    $n = count($items);
    return '<nav class="crumbs" aria-label="Хлебные крошки"><ol>' . join_map($items, fn($it, $i) => $i === $n - 1
        ? '<li aria-current="page">' . esc($it['name']) . '</li>'
        : '<li><a href="' . href($it['path']) . '">' . esc($it['name']) . '</a></li>') . '</ol></nav>';
}
function crumbs_ld(array $items): array
{
    return [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => array_map(fn($it, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $it['name'], 'item' => abs_url($it['path'])], $items, array_keys($items)),
    ];
}
function faq_ld(array $list): array
{
    return [
        '@context' => 'https://schema.org',
        '@type' => 'FAQPage',
        'mainEntity' => array_map(fn($f) => ['@type' => 'Question', 'name' => $f['q'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['a']]], $list),
    ];
}
function org_ld(): array
{
    $c = S::$company;
    return [
        '@context' => 'https://schema.org',
        '@type' => ['GeneralContractor', 'LocalBusiness'],
        '@id' => abs_url('/#org'),
        'name' => $c['name'],
        'alternateName' => $c['formerNames'],
        'description' => $c['brandLine'] . ' в Самаре: кровельные, фасадные, электромонтажные и сварочные работы, ремонт подъездов и лифтовых кабин, асфальтирование, окна и двери, вывоз снега. Работаем с ' . $c['foundedYear'] . ' года.',
        'url' => abs_url('/'),
        'logo' => abs_url('/img/logo-512.png'),
        'image' => abs_url('/og.png'),
        'telephone' => array_map(fn($p) => $p['tel'], $c['phones']),
        'email' => $c['email'],
        'foundingDate' => (string)$c['foundedYear'],
        'address' => ['@type' => 'PostalAddress', 'addressLocality' => $c['city'], 'addressRegion' => $c['region'], 'addressCountry' => 'RU'],
        'areaServed' => [['@type' => 'City', 'name' => $c['city']], ['@type' => 'AdministrativeArea', 'name' => $c['region']]],
        'sameAs' => [$c['telegram'], $c['max']],
        'knowsAbout' => array_map(fn($s) => $s['title'], S::$services),
        'openingHoursSpecification' => ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'opens' => '09:00', 'closes' => '18:00'],
    ];
}

// ---------- форма заявки ----------
function consent_html(string $id): string
{
    return '<div class="check"><input id="' . $id . '-consent" type="checkbox" name="consent" value="yes" checked required><label for="' . $id . '-consent">Даю <a href="' . href('/consent/') . '" target="_blank" rel="noopener">согласие на обработку персональных данных</a> и принимаю <a href="' . href('/privacy/') . '" target="_blank" rel="noopener">политику конфиденциальности</a></label></div>';
}
function name_field(string $id): string
{
    return '<div class="field"><label for="' . $id . '-name">Ваше имя <span class="req" aria-hidden="true">*</span></label><input id="' . $id . '-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80"><p class="field__err" data-err="name" hidden></p></div>';
}

function form_html(array $o): string
{
    $id = $o['id'] ?? 'zayavka';
    $title = $o['title']; $lead = $o['lead']; $subject = $o['subject'];
    $withPortfolio = $o['withPortfolio'] ?? false; $dark = $o['dark'] ?? false; $selected = $o['selected'] ?? '';
    $opts = join_map(S::$services, fn($s) => '<option value="' . esc($s['title']) . '"' . ($s['title'] === $selected ? ' selected' : '') . '>' . esc($s['title']) . '</option>');
    $w = S::$company['warrantyYears'];
    return '<section class="section form-sec ' . ($dark ? 'section--dark on-dark' : 'section--paper') . '" id="' . $id . '" aria-labelledby="' . $id . '-h">
  <div class="wrap form-sec__grid">
    <div class="form-sec__intro">
      <h2 id="' . $id . '-h">' . esc($title) . '</h2>
      <p class="lead">' . esc($lead) . '</p>
      <ul class="checklist">
        <li>' . icon('check') . 'Приедем на осмотр, замерим и составим смету</li>
        <li>' . icon('check') . 'Работаем по договору, гарантия до ' . $w . ' лет</li>
        <li>' . icon('check') . 'Перезвоним в рабочее время и уточним детали</li>
      </ul>
      <p class="form-sec__alt">Или позвоните: ' . phone_links('link-strong', ' · ') . '</p>
    </div>
    <form class="form card" data-form novalidate method="post" action="#">
      <input type="hidden" name="subject" value="' . esc($subject) . '">
      <input type="hidden" name="page" value="">
      ' . name_field($id) . '
      <div class="field"><label for="' . $id . '-phone">Телефон <span class="req" aria-hidden="true">*</span></label><input id="' . $id . '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__" required maxlength="24"><p class="field__err" data-err="phone" hidden></p></div>
      <div class="field"><label for="' . $id . '-service">Что нужно сделать</label><select id="' . $id . '-service" name="service"><option value="">Выберите направление (по желанию)</option>' . $opts . '</select></div>
      <div class="field"><label for="' . $id . '-msg">Комментарий</label><textarea id="' . $id . '-msg" name="message" rows="3" maxlength="1000" placeholder="Адрес объекта, что беспокоит, желаемые сроки"></textarea></div>
      ' . ($withPortfolio ? '<div class="check"><input id="' . $id . '-pf" type="checkbox" name="want_portfolio" value="yes"><label for="' . $id . '-pf">Прислать портфолио с адресами объектов и коммерческое предложение</label></div>' : '') . '
      <div class="hp" aria-hidden="true"><label>Не заполняйте это поле <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      ' . consent_html($id) . '
      <p class="field__err" data-err="consent" hidden></p>
      <button class="btn btn--primary btn--lg btn--block" type="submit">Отправить заявку</button>
      <div class="form__status" role="status" aria-live="polite" data-status hidden></div>
    </form>
  </div>
</section>';
}

// Всплывающая форма заявки (открывается по кнопкам «Рассчитать стоимость» и т.п.)
function modal_html(): string
{
    $id = 'lead-modal';
    $opts = join_map(S::$services, fn($s) => '<option value="' . esc($s['title']) . '">' . esc($s['title']) . '</option>');
    return '<dialog class="modal" id="' . $id . '" aria-labelledby="' . $id . '-h">
  <form class="form modal__form" data-form novalidate method="post" action="#">
    <button class="modal__close" type="button" data-modal-close aria-label="Закрыть">' . icon('close') . '</button>
    <h2 id="' . $id . '-h">Оставить заявку</h2>
    <p class="lead">Оставьте контакты — перезвоним в рабочее время и договоримся о выезде на замер.</p>
    <input type="hidden" name="subject" value="Заявка с сайта" data-modal-subject>
    <input type="hidden" name="page" value="">
    ' . name_field($id) . '
    <div class="field"><label for="' . $id . '-phone">Телефон <span class="req" aria-hidden="true">*</span></label><input id="' . $id . '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__" required maxlength="24"><p class="field__err" data-err="phone" hidden></p></div>
    <div class="field"><label for="' . $id . '-service">Что нужно сделать</label><select id="' . $id . '-service" name="service"><option value="">Выберите направление (по желанию)</option>' . $opts . '</select></div>
    <div class="field"><label for="' . $id . '-msg">Комментарий</label><textarea id="' . $id . '-msg" name="message" rows="3" maxlength="1000" placeholder="Адрес объекта, что беспокоит, желаемые сроки"></textarea></div>
    <div class="hp" aria-hidden="true"><label>Не заполняйте это поле <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    ' . consent_html($id) . '
    <p class="field__err" data-err="consent" hidden></p>
    <button class="btn btn--primary btn--lg btn--block" type="submit">Отправить заявку</button>
    <div class="form__status" role="status" aria-live="polite" data-status hidden></div>
    <p class="modal__alt">Или позвоните: ' . phone_links('link-strong', ' · ') . '</p>
  </form>
</dialog>';
}

// ---------- шапка и подвал ----------
const NAV = [
    ['name' => 'Услуги', 'path' => '/services/'],
    ['name' => 'УК и ТСЖ', 'path' => '/for-uk-tsj/'],
    ['name' => 'Портфолио', 'path' => '/portfolio/'],
    ['name' => 'О компании', 'path' => '/about/'],
    ['name' => 'Контакты', 'path' => '/contacts/'],
];

function cta_href(string $current): string { return $current === '/' ? '#zayavka' : href('/contacts/#zayavka'); }

// Выпадающая панель «Услуги» в шапке (десктоп): все услуги + быстрая связь
function services_mega(string $current): string
{
    $items = join_map(S::$services, fn($s) => '<li><a class="mega__item" href="' . href('/services/' . $s['slug'] . '/') . '"><span class="mega__ic">' . icon($s['icon']) . '</span><span class="mega__t">' . esc($s['title']) . '</span></a></li>');
    $p0 = phone0();
    return '<div class="mega" id="mega-services">
    <div class="wrap mega__grid">
      <div class="mega__main">
        <p class="mega__h">Все услуги</p>
        <ul class="mega__list">' . $items . '</ul>
      </div>
      <aside class="mega__aside">
        <p class="mega__h">Нужна консультация?</p>
        <p class="mega__note">Приедем на осмотр, замерим и составим смету. Работаем по договору, гарантия до ' . S::$company['warrantyYears'] . ' лет.</p>
        <a class="mega__tel" href="tel:' . $p0['tel'] . '" data-goal="phone_click">' . icon('phone') . esc($p0['display']) . '</a>
        <a class="btn btn--primary btn--sm" href="' . cta_href($current) . '">Рассчитать стоимость</a>
        <a class="mega__all" href="' . href('/services/') . '">Каталог услуг ' . icon('arrow') . '</a>
      </aside>
    </div>
  </div>';
}

function site_header(string $current): string
{
    $c = S::$company;
    $p0 = phone0();
    $nav = join_map(NAV, function ($n) use ($current) {
        $cur = $current === $n['path'] ? ' aria-current="page"' : '';
        if ($n['path'] !== '/services/') return '<a href="' . href($n['path']) . '"' . $cur . '>' . $n['name'] . '</a>';
        return '<div class="nav__item nav__item--sub" data-mega><a href="' . href($n['path']) . '"' . $cur . ' aria-haspopup="true" aria-controls="mega-services">' . $n['name'] . icon('chevron', 'nav__chev') . '</a>' . services_mega($current) . '</div>';
    });
    $mnav = join_map(NAV, fn($n) => $n['path'] !== '/services/'
        ? '<a href="' . href($n['path']) . '">' . $n['name'] . '</a>'
        : '<details class="mmenu__sub"><summary>' . $n['name'] . icon('chevron', 'mmenu__chev') . '</summary><div class="mmenu__subl"><a href="' . href($n['path']) . '"><b>Все услуги</b></a>' . join_map(S::$services, fn($s) => '<a href="' . href('/services/' . $s['slug'] . '/') . '">' . esc($s['title']) . '</a>') . '</div></details>');
    return '<header class="hdr" id="top">
  <div class="wrap hdr__row">
    <a class="logo" href="' . href('/') . '">' . LOGO_MARK . '<span class="logo__txt"><b>СТРОЙГРАД</b></span></a>
    <nav class="nav" aria-label="Основное меню">' . $nav . '</nav>
    <div class="hdr__right">
      <a class="hdr__tel" href="tel:' . $p0['tel'] . '" data-goal="phone_click">' . icon('phone') . '<span>' . esc($p0['display']) . '</span></a>
      <a class="msg msg--max" href="' . esc(max_chat()) . '" target="_blank" rel="noopener" aria-label="Написать в MAX">MAX</a>
      <a class="msg" href="' . esc(tg_chat()) . '" target="_blank" rel="noopener" aria-label="Написать в Telegram">' . icon('telegram') . '</a>
      <a class="btn btn--primary btn--sm hdr__cta" href="' . cta_href($current) . '">Рассчитать стоимость</a>
      <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mmenu" data-burger>' . icon('menu', 'burger__open') . icon('close', 'burger__close') . '</button>
    </div>
  </div>
  <div class="mmenu" id="mmenu" hidden>
    <div class="wrap">
      <nav aria-label="Мобильное меню">' . $mnav . '</nav>
      <div class="mmenu__contacts">' . phone_links('mmenu__tel') . '
        <div class="mmenu__msg"><a class="btn btn--ghost" href="' . esc(tg_chat()) . '" target="_blank" rel="noopener">' . icon('telegram') . ' Telegram</a><a class="btn btn--ghost" href="' . esc(max_chat()) . '" target="_blank" rel="noopener">MAX</a></div>
      </div>
    </div>
  </div>
</header>';
}

function req_line(): string
{
    $r = S::$company['requisites'];
    return implode(' · ', array_map('esc', array_values(array_filter([$r['legalName'] ?? null, !empty($r['inn']) ? 'ИНН ' . $r['inn'] : null, !empty($r['ogrn']) ? 'ОГРН ' . $r['ogrn'] : null]))));
}

function site_footer(): string
{
    $c = S::$company;
    $r = $c['requisites'];
    $hasReq = (bool)array_filter($r);
    $reqHtml = $hasReq ? '<p class="ftr__req">' . req_line() . '</p>' : (S::$draft ? '<p class="ftr__req">' . todo('юрлицо/ИП, ИНН, ОГРН') . '</p>' : '');
    $svcList = join_map(S::$services, fn($s) => '<li><a href="' . href('/services/' . $s['slug'] . '/') . '">' . esc($s['title']) . '</a></li>');
    return '<footer class="ftr on-dark">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <a class="logo" href="' . href('/') . '">' . LOGO_MARK . '<span class="logo__txt"><b>СТРОЙГРАД</b></span></a>
      <p class="ftr__slogan">' . esc($c['slogans']['main']) . '</p>
      <p class="ftr__slogan2">' . esc($c['slogans']['triad']) . '</p>
      <div class="ftr__contacts">' . phone_links('ftr__tel') . '<a href="mailto:' . esc($c['email']) . '">' . esc($c['email']) . '</a></div>
      <div class="ftr__msg"><a class="btn btn--ghost btn--sm" href="' . esc($c['telegram']) . '" target="_blank" rel="noopener">' . icon('telegram') . ' Telegram-канал</a><a class="btn btn--ghost btn--sm" href="' . esc($c['max']) . '" target="_blank" rel="noopener">' . icon('chat') . ' Группа в MAX</a></div>
    </div>
    <div class="ftr__col ftr__col--wide"><h2 class="ftr__h">Услуги</h2><ul class="ftr__list ftr__list--cols">' . $svcList . '</ul></div>
    <div class="ftr__col"><h2 class="ftr__h">Компания</h2><ul class="ftr__list">' . join_map(NAV, fn($n) => '<li><a href="' . href($n['path']) . '">' . $n['name'] . '</a></li>') . '</ul></div>
  </div>
  <div class="wrap ftr__bottom">
    <div>
      ' . $reqHtml . '
    </div>
    <div class="ftr__legal footer-bottom-links">
      <a href="' . href('/privacy/') . '">Политика конфиденциальности</a>
      <a href="' . href('/consent/') . '">Согласие на обработку данных</a>
      <a class="footer-credit" href="https://sitomika.ru/?utm_source=' . cfg('studio_slug') . '&amp;utm_medium=footer&amp;utm_campaign=client-sites" target="_blank" rel="noopener">Разработано в sitomika.ru</a>
    </div>
  </div>
</footer>';
}

// ---------- оболочка страницы ----------
// Раздел админки, где правится страница (для кнопки «Редактировать» у вошедшего в админку)
function edit_route(string $pth): string
{
    static $map = ['/' => 'section/home', '/services/' => 'section/services-hub', '/for-uk-tsj/' => 'section/uk', '/portfolio/' => 'section/portfolio', '/about/' => 'section/about', '/contacts/' => 'section/contacts', '/privacy/' => 'section/company', '/consent/' => 'section/company'];
    if (isset($map[$pth])) return $map[$pth];
    if (preg_match('~^/services/([a-z0-9-]+)/$~', $pth, $m)) return 'service/' . $m[1];
    return '';
}

function shell(array $o): string
{
    $pth = $o['path'];
    $title = $o['title']; $description = $o['description']; $body = $o['body'];
    $ld = $o['ld'] ?? []; $current = $o['current'] ?? $pth; $ogImage = $o['ogImage'] ?? '/og.png';
    $noindex = $o['noindex'] ?? false; $heroPreload = $o['heroPreload'] ?? null;
    $extraCss = array_key_exists('extraCss', $o) ? $o['extraCss'] : '/css/bg-plaster.css';
    $bodyClass = array_key_exists('bodyClass', $o) ? $o['bodyClass'] : 'bg-plaster';
    $B = S::$base; $c = S::$company; $p0 = phone0();
    $url = abs_url($pth);
    $ldHtml = implode("\n", array_map(fn($x) => '<script type="application/ld+json">' . json_ld($x) . '</script>', $ld));
    $preload = $heroPreload ? '<link rel="preload" as="image" href="' . $heroPreload['href'] . '"' . (!empty($heroPreload['srcset']) ? ' imagesrcset="' . $heroPreload['srcset'] . '" imagesizes="' . $heroPreload['sizes'] . '"' : '') . ' fetchpriority="high">' : '';
    $boot = 'window.SG_BASE=' . json_encode($B, JSON_FLAGS | JSON_HEX_TAG) . ';window.SG_PHONES=' . json_encode($c['phones'], JSON_FLAGS | JSON_HEX_TAG) . ';window.SG_TG=' . json_encode($c['telegram'], JSON_FLAGS | JSON_HEX_TAG) . ';window.SG_MAX=' . json_encode($c['max'], JSON_FLAGS | JSON_HEX_TAG) . ';window.SG_EMAIL=' . json_encode($c['email'], JSON_FLAGS | JSON_HEX_TAG) . ';';
    return '<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>' . esc($title) . '</title>
<meta name="description" content="' . esc($description) . '">
<link rel="canonical" href="' . $url . '">
' . ($noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">') . '
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="СТРОЙГРАД">
<meta property="og:title" content="' . esc($title) . '">
<meta property="og:description" content="' . esc($description) . '">
<meta property="og:url" content="' . $url . '">
<meta property="og:image" content="' . abs_url($ogImage) . '">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="' . esc($title) . '">
<meta name="twitter:description" content="' . esc($description) . '">
<meta name="twitter:image" content="' . abs_url($ogImage) . '">
<link rel="icon" href="' . $B . '/favicon.svg" type="image/svg+xml">
<link rel="icon" href="' . $B . '/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="' . $B . '/apple-touch-icon.png">
<link rel="preload" href="' . $B . '/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="' . $B . '/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
' . $preload . '
<link rel="stylesheet" href="' . asset('/css/style.css') . '">' . ($extraCss ? "\n" . '<link rel="stylesheet" href="' . asset($extraCss) . '">' : '') . '
' . $ldHtml . '
<!-- Яндекс.Метрика: номер счётчика указывается в public/js/config.js (METRIKA_ID) — скрипт подключится автоматически. Цели: form_submit, phone_click. -->
</head>
<body' . ($bodyClass ? ' class="' . $bodyClass . '"' : '') . (edit_route($pth) !== '' ? ' data-edit="' . edit_route($pth) . '"' : '') . '>
<a class="skip" href="#main">Перейти к содержимому</a>
' . sprite_svg() . '
' . site_header($current) . '
<main id="main">
' . $body . '
</main>
' . site_footer() . '
<div class="mbar" role="region" aria-label="Быстрая связь">
  <a class="mbar__call" href="tel:' . $p0['tel'] . '" data-goal="phone_click">' . icon('phone') . 'Позвонить</a>
  <a class="mbar__tg" href="' . esc($c['telegram']) . '" target="_blank" rel="noopener">' . icon('telegram') . 'Написать в Telegram</a>
</div>
<div class="cookie" data-cookie hidden role="region" aria-label="Уведомление об использовании cookie">
  <p>Сайт использует файлы cookie, необходимые для его работы, и данные, которые вы указываете в формах. Подробнее — в <a href="' . href('/privacy/') . '">политике конфиденциальности</a>.</p>
  <button class="btn btn--primary btn--sm" type="button" data-cookie-ok>Понятно</button>
</div>
' . modal_html() . '
<script>' . $boot . '</script>
<script src="' . asset('/js/config.js') . '"></script>
<script src="' . asset('/js/main.js') . '" defer></script>
</body>
</html>
';
}

// ---------- первый экран: фон-арт или реальное фото ----------
// spec: ['art' => 'roof'] — арт из data/hero.json; ['photo' => 'asphalt-01'] — фото; pos — object-position
function hero_bg(array $spec): array
{
    $B = S::$base;
    if (!empty($spec['art'])) {
        $d = S::$heroDims[$spec['art']] ?? null;
        if (!$d) throw new RuntimeException('Нет hero-арта ' . $spec['art']);
        $src = "$B/img/hero/{$spec['art']}.webp"; $w = $d['w']; $h = $d['h'];
        $srcset = "$B/img/hero/{$spec['art']}-m.webp 800w, $src {$d['w']}w";
    } else {
        $p = photo($spec['photo']);
        $src = img_url($p['id']); $w = $p['w']; $h = $p['h'];
        $srcset = img_url($p['id'], '-sm') . " {$p['sw']}w, $src {$p['w']}w";
    }
    $sizes = '(min-width: 900px) 70vw, 100vw';
    return [
        'html' => '<div class="hero__bg" aria-hidden="true"><img src="' . $src . '"' . ($srcset ? ' srcset="' . $srcset . '" sizes="' . $sizes . '"' : '') . ' width="' . $w . '" height="' . $h . '" alt="" fetchpriority="high" decoding="async"' . (!empty($spec['pos']) ? ' style="object-position:' . esc($spec['pos']) . '"' : '') . '></div>',
        'preload' => $srcset ? ['href' => $src, 'srcset' => $srcset, 'sizes' => $sizes] : ['href' => $src],
    ];
}

function plate_html(string $t, string $sub = ''): string
{
    return '<p class="plate"><span class="plate__in"><i class="plate__bar" aria-hidden="true"></i><span>' . esc($t) . '</span>' . ($sub !== '' ? '<b>' . esc($sub) . '</b>' : '') . '</span></p>';
}
function sro_html(string $cls = ''): string
{
    return '<div class="sro ' . $cls . '">' . icon('shield') . '<div><b>СРО, гарантия до ' . S::$company['warrantyYears'] . ' лет!</b><span>' . esc(S::$company['slogans']['triad']) . '</span></div></div>';
}

function page_hero(array $o): string
{
    $crumbsHtml = $o['crumbsHtml'] ?? ''; $actions = $o['actions'] ?? ''; $chips = $o['chips'] ?? [];
    $plate = $o['plate'] ?? null; $eyebrow = $o['eyebrow'] ?? ''; $tag = $o['tag'] ?? ''; $quality = $o['quality'] ?? null;
    $sro = $o['sro'] ?? true; $home = $o['home'] ?? false;
    return '<section class="hero ' . ($home ? 'hero--home' : 'hero--page') . '">
  ' . $o['bg']['html'] . '
  <div class="wrap">
    <div class="hero__text">
      ' . $crumbsHtml . '
      ' . ($plate ? plate_html($plate['t'] ?? '', (string)($plate['s'] ?? '')) : '') . '
      ' . ($eyebrow ? '<p class="eyebrow">' . esc($eyebrow) . '</p>' : '') . '
      <h1>' . esc($o['h1']) . '</h1>
      ' . ($tag ? '<p class="hero__tag">' . esc($tag) . '</p>' : '') . '
      <p class="lead">' . str_replace("\n", '<br>', esc($o['lead'])) . '</p>
      ' . ($actions ? '<div class="hero__actions">' . $actions . '</div>' : '') . '
      ' . ($quality ? '<ul class="quality">' . join_map($quality, fn($q) => '<li>' . esc($q) . '</li>') . '</ul>' : '') . '
      ' . ($chips ? '<ul class="chips">' . join_map($chips, fn($c) => '<li>' . icon('check') . esc($c) . '</li>') . '</ul>' : '') . '
    </div>
    ' . ($sro ? '<div class="hero__sro">' . sro_html() . '</div>' : '') . '
  </div>
</section>';
}
