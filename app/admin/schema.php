<?php
// Описание форм админки: какие поля есть у каждого раздела и в какое место данных они пишут.
// bind = "файл#путь.в.json". Сохранять можно только поля, описанные здесь.
declare(strict_types=1);

function f(string $type, string $bind, string $label, string $hint = '', array $o = []): array
{
    return ['type' => $type, 'bind' => $bind, 'label' => $label, 'hint' => $hint] + $o;
}
function k(string $type, string $key, string $label, string $hint = '', array $o = []): array
{
    return ['type' => $type, 'key' => $key, 'label' => $label, 'hint' => $hint] + $o;
}
function head(string $title, string $note = ''): array { return ['type' => 'head', 'label' => $title, 'hint' => $note]; }

function meta_fields(string $prefix): array
{
    return [
        head('Для поисковиков', 'Заголовок и описание, которые видны в результатах Яндекса и Google. На самой странице не показываются.'),
        f('text', $prefix . 'metaTitle', 'Заголовок во вкладке и в поиске', 'Оптимально 50–70 символов', ['counter' => 70]),
        f('textarea', $prefix . 'metaDescription', 'Описание в поиске', 'Оптимально 120–160 символов', ['counter' => 160, 'rows' => 3]),
    ];
}

function steps_item(): array { return [k('text', 'title', 'Заголовок'), k('textarea', 'text', 'Текст', '', ['rows' => 2])]; }
function faq_item(): array { return [k('text', 'q', 'Вопрос'), k('textarea', 'a', 'Ответ', '', ['rows' => 3])]; }

function hero_block(string $p, string $heroBind, bool $sub = true): array
{
    $out = [
        head('Первый экран'),
        f('herobg', $heroBind, 'Фон первого экрана', 'Арт-коллаж или фото из медиатеки'),
        f('text', $p . 'plate', 'Плашка над заголовком'),
    ];
    if ($sub) $out[] = f('text', $p . 'plateSub', 'Вторая строка плашки', 'Можно оставить пустой');
    $out[] = f('textarea', $p . 'h1', 'Главный заголовок (H1)', '', ['rows' => 2]);
    $out[] = f('textarea', $p . 'lead', 'Текст под заголовком', '', ['rows' => 3]);
    return $out;
}

function admin_sections(): array
{
    $home = 'site.json#home.';
    $S = [];

    $S['home'] = ['title' => 'Главная', 'group' => 'Страницы', 'url' => '/', 'fields' => array_merge(
        hero_block($home, 'structure.json#hero.home', false),
        [
            head('Преимущества под первым экраном'),
            f('items', $home . 'reasons', 'Карточки преимуществ', 'Лучше всего смотрятся 4 карточки', ['item' => [k('icon', 'icon', 'Иконка'), k('text', 'title', 'Заголовок'), k('textarea', 'text', 'Текст', '', ['rows' => 2])], 'itemName' => 'Карточка']),
            head('Как мы работаем', 'Эти же шаги показываются на странице «УК и ТСЖ»'),
            f('items', $home . 'steps', 'Шаги', '', ['item' => steps_item(), 'itemName' => 'Шаг']),
            head('Выполненные объекты', 'Шесть фото на главной, каждое ведёт на страницу услуги'),
            f('items', 'structure.json#homePortfolio', 'Фото', '', ['item' => [k('photo', 'photo', 'Фото'), k('text', 'label', 'Подпись'), k('service', 'slug', 'Ведёт на услугу')], 'itemName' => 'Фото']),
            head('Почему выбирают'),
            f('text', $home . 'whyTitle', 'Заголовок блока'),
            f('list', $home . 'why', 'Пункты списка'),
            f('list', $home . 'minis', 'Короткие плашки справа'),
            f('textarea', $home . 'whyNote', 'Примечание под плашками', '', ['rows' => 2]),
        ],
        meta_fields($home)
    )];

    $sv = 'site.json#services.';
    $S['services-hub'] = ['title' => 'Каталог услуг', 'group' => 'Страницы', 'url' => '/services/', 'fields' => array_merge(
        hero_block($sv, 'structure.json#hero.services'),
        [f('list', 'site.json#home.quality', 'Слова под заголовком', 'Например: Качество, Надёжность, Опыт')],
        meta_fields($sv)
    )];

    $u = 'site.json#uk.';
    $S['uk'] = ['title' => 'УК и ТСЖ', 'group' => 'Страницы', 'url' => '/for-uk-tsj/', 'fields' => array_merge(
        hero_block($u, 'structure.json#hero.uk'),
        [
            head('Что важно управляющей компании'),
            f('text', $u . 'needsTitle', 'Заголовок блока'),
            f('items', $u . 'needs', 'Карточки', '', ['item' => [k('icon', 'icon', 'Иконка'), k('text', 'title', 'Заголовок'), k('textarea', 'text', 'Текст', '', ['rows' => 2])], 'itemName' => 'Карточка']),
            head('Услуги для многоквартирных домов'),
            f('text', $u . 'servicesTitle', 'Заголовок блока'),
            f('services', $u . 'serviceSlugs', 'Какие услуги показать', 'Порядок — как в списке'),
            head('Документы'),
            f('text', $u . 'docsTitle', 'Заголовок блока'),
            f('list', $u . 'docs', 'Что передаём'),
            head('Вопросы и ответы'),
            f('items', $u . 'faq', 'Вопросы', '', ['item' => faq_item(), 'itemName' => 'Вопрос']),
        ],
        meta_fields($u)
    )];

    $p = 'site.json#portfolio.';
    $S['portfolio'] = ['title' => 'Портфолио', 'group' => 'Страницы', 'url' => '/portfolio/', 'fields' => array_merge(
        hero_block($p, 'structure.json#hero.portfolio'),
        [
            head('Фильтры портфолио', 'Каждый фильтр показывает фото одной папки медиатеки. Порядок фильтров — порядок фото на странице.'),
            f('items', 'structure.json#portfolioCats', 'Фильтры', '', ['item' => [k('category', 'key', 'Папка с фото'), k('text', 'label', 'Название фильтра'), k('service', 'slug', 'Услуга')], 'itemName' => 'Фильтр']),
        ],
        meta_fields($p)
    )];

    $a = 'site.json#about.';
    $S['about'] = ['title' => 'О компании', 'group' => 'Страницы', 'url' => '/about/', 'fields' => array_merge(
        hero_block($a, 'structure.json#hero.about'),
        [
            head('История'),
            f('text', $a . 'historyTitle', 'Заголовок'),
            f('list', $a . 'history', 'Абзацы', '', ['multiline' => true]),
            head('Команда и документы'),
            f('text', $a . 'teamTitle', 'Заголовок «Команда»'),
            f('textarea', $a . 'team', 'Текст о команде', '', ['rows' => 4]),
            f('text', $a . 'docsTitle', 'Заголовок «Документы»'),
            f('textarea', $a . 'docs', 'Текст о документах', '', ['rows' => 3]),
            head('Принципы работы'),
            f('text', $a . 'workTitle', 'Заголовок'),
            f('items', $a . 'values', 'Принципы', '', ['item' => steps_item(), 'itemName' => 'Принцип']),
        ],
        meta_fields($a)
    )];

    $c = 'site.json#contacts.';
    $S['contacts'] = ['title' => 'Контакты', 'group' => 'Страницы', 'url' => '/contacts/', 'fields' => array_merge(
        hero_block($c, 'structure.json#hero.contacts'),
        [head('Телефоны, почта и реквизиты', 'Правятся в разделе «Компания» и меняются сразу на всём сайте')],
        meta_fields($c)
    )];

    $co = 'company.json#';
    $S['company'] = ['title' => 'Компания и контакты', 'group' => 'Общее', 'url' => '/contacts/', 'fields' => [
        head('Контакты', 'Показываются в шапке, подвале, формах и на странице «Контакты»'),
        f('items', $co . 'phones', 'Телефоны', 'Первый телефон — главный: он в шапке и на кнопках', ['item' => [k('text', 'display', 'Как показывать', 'Например: 8 927 203-73-73')], 'itemName' => 'Телефон']),
        f('email', $co . 'email', 'Электронная почта', '', ['required' => true]),
        f('url', $co . 'telegram', 'Ссылка на Telegram', 'Например: https://t.me/имя', ['required' => true]),
        f('url', $co . 'max', 'Ссылка на группу в MAX', 'Начинается с https://', ['required' => true]),
        f('text', $co . 'workHours', 'Режим работы'),
        f('text', $co . 'officeAddress', 'Адрес офиса', 'Пусто — не показывается'),
        head('Цифры'),
        f('number', $co . 'foundedYear', 'Год основания'),
        f('number', $co . 'warrantyYears', 'Гарантия, лет'),
        f('number', $co . 'teamExperienceYears', 'Опыт специалистов, лет'),
        f('number', $co . 'yandexReviews.count', 'Отзывов на Яндекс Бизнесе'),
        f('text', $co . 'yandexReviews.asOf', 'По состоянию на', 'Например: февраль 2026'),
        head('Реквизиты', 'Показываются в подвале, на странице «Контакты» и в юридических документах'),
        f('text', $co . 'requisites.legalName', 'Наименование'),
        f('text', $co . 'requisites.inn', 'ИНН'),
        f('text', $co . 'requisites.ogrn', 'ОГРН'),
        f('text', $co . 'requisites.legalAddress', 'Юридический адрес'),
        f('text', $co . 'requisites.sro', 'СРО', 'Название, номер членства. Пусто — не показывается'),
        f('list', $co . 'formerNames', 'Прежние названия'),
        head('Слоганы'),
        f('text', $co . 'slogans.main', 'Главный девиз', 'В подвале и в конце страниц услуг'),
        f('text', $co . 'slogans.triad', 'Три слова', 'Рядом со значком СРО'),
        f('text', $co . 'slogans.unite', 'Про команду'),
        f('text', $co . 'slogans.multi', 'Про услуги', 'Над списком услуг на главной'),
        f('text', $co . 'slogans.one', 'Про одного подрядчика'),
    ]];

    $S['why-default'] = ['title' => 'Общие блоки', 'group' => 'Общее', 'url' => '/services/', 'fields' => [
        head('«Почему выбирают нас» на страницах услуг', 'Используется, если у услуги не задан свой список'),
        f('list', 'site.json#whyDefault', 'Пункты'),
    ]];

    $S['reviews'] = ['title' => 'Отзывы', 'group' => 'Общее', 'url' => '/about/#otzyvy', 'fields' => [
        head('Отзывы клиентов', 'Все отзывы показываются на странице «О компании». Отмеченные «на главной» — на главной (первые три).'),
        f('items', 'reviews.json#items', 'Отзывы', '', ['itemName' => 'Отзыв', 'collapsed' => true, 'item' => [
            k('text', 'author', 'Автор'),
            k('text', 'date', 'Дата', 'Например: 31 января 2026'),
            k('textarea', 'text', 'Текст отзыва', '', ['rows' => 5]),
            k('services', 'services', 'Показывать на страницах услуг'),
            k('bool', 'featured', 'Показывать на главной'),
        ]]),
    ]];

    return $S;
}

// Форма страницы услуги
function service_fields(): array
{
    $s = 'services/{svc}.json#';
    return array_merge([
        head('Основное'),
        f('bool', $s . 'hidden', 'Скрыть с сайта', 'Скрытая услуга не показывается нигде — удобно, пока страница готовится'),
        f('text', $s . 'title', 'Название', 'В меню, каталоге и карточках', ['required' => true]),
        f('icon', $s . 'icon', 'Иконка'),
        f('textarea', $s . 'short', 'Короткое описание для карточки', '', ['rows' => 2]),
        head('Первый экран'),
        f('herobg', $s . 'heroBg', 'Фон первого экрана'),
        f('text', $s . 'plate.t', 'Плашка над заголовком', 'Пусто — будет название услуги'),
        f('text', $s . 'plate.s', 'Вторая строка плашки'),
        f('textarea', $s . 'h1', 'Главный заголовок (H1)', '', ['rows' => 2, 'required' => true]),
        f('textarea', $s . 'lead', 'Текст под заголовком', '', ['rows' => 3]),
        head('Виды работ (плитки)', 'Пусто — блок не показывается'),
        f('text', $s . 'tilesTitle', 'Заголовок блока'),
        f('items', $s . 'tiles', 'Плитки', '', ['item' => [k('text', 't', 'Название'), k('text', 's', 'Подпись', 'Необязательно', ['omitEmpty' => true])], 'itemName' => 'Плитка']),
        head('Стоимость и состав работ'),
        f('textarea', $s . 'priceNote', 'Текст в блоке «Стоимость»', '', ['rows' => 2]),
        f('list', $s . 'includes', 'Что входит в работы'),
        f('text', $s . 'signsTitle', 'Заголовок «Когда нужна услуга»'),
        f('list', $s . 'signs', 'Признаки'),
        head('Этапы'),
        f('text', $s . 'stepsTitle', 'Заголовок блока'),
        f('items', $s . 'steps', 'Этапы', '', ['item' => steps_item(), 'itemName' => 'Этап']),
        head('Фото работ'),
        f('photos', $s . 'gallery', 'Фото', 'Пусто — блок не показывается'),
        f('text', $s . 'gallery_caption', 'Подпись к фото', 'Пусто — стандартная подпись'),
        head('Почему выбирают нас'),
        f('list', $s . 'why', 'Пункты', 'Пусто — общий список из раздела «Общие блоки»'),
        f('text', $s . 'term', 'Сроки'),
        f('text', $s . 'warranty', 'Гарантия'),
        f('list', $s . 'promise', 'Мы гарантируем', 'Необязательно'),
        head('Вопросы и ответы', 'Рекомендуется 4–6 вопросов'),
        f('items', $s . 'faq', 'Вопросы', '', ['item' => faq_item(), 'itemName' => 'Вопрос']),
        head('Завершение страницы'),
        f('text', $s . 'closing', 'Фраза в конце страницы', 'Пусто — главный девиз компании'),
        f('services', $s . 'related', 'Смежные услуги', 'Лучше 3 услуги'),
    ], meta_fields($s));
}

// Все поля раздела в плоском виде (для проверки, что сохраняется только разрешённое)
function schema_binds(array $fields): array
{
    $out = [];
    foreach ($fields as $fd) if (!empty($fd['bind'])) $out[$fd['bind']] = $fd;
    return $out;
}
