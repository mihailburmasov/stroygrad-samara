<?php
// SVG-спрайт: линейные иконки 24×24. Используются через <use href="#i-имя">.
declare(strict_types=1);

const ICONS = [
    'roof' => 'M3 12 12 4l9 8M5.5 10v10h13V10M10 20v-5h4v5',
    'facade' => 'M5 21V4h9v17M14 9h5v12M8 8h2M8 12h2M8 16h2M3 21h18',
    'entrance' => 'M7 21V3.5h10V21M3 21h18M14 12.5h.01',
    'weld' => 'M4 20l7.5-7.5M11.5 12.5l2-2M15 3l1 2.5L18.5 6.5 16 7.5 15 10l-1-2.5-2.5-1L14 5.5zM18 13l.7 1.6 1.6.7-1.6.7L18 17.6l-.7-1.6-1.6-.7 1.6-.7z',
    'lift' => 'M4 3h16v18H4zM12 3v18M7.5 10 9 8l1.5 2M13.5 14l1.5 2 1.5-2',
    'asphalt' => 'M8 3 4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3',
    'bolt' => 'M13 2 4 14h7l-1 8 9-12h-7z',
    'window' => 'M4 3h16v18H4zM12 3v18M4 12h16',
    'truck' => 'M2 6h11v10H2zM13 9h4l3 3v4h-7M6.5 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    'room' => 'M5 4h12v5H5zM17 6.5h3v5h-9v3M10 14.5h2V21h-2z',
    'tree' => 'M12 22v-7M12 15a5 5 0 100-10 5 5 0 000 10zM8 22h8',
    'calendar' => 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
    'building' => 'M4 21V5l8-2 8 2v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4',
    'seam' => 'M3 5h7v14H3zM14 5h7v14h-7zM12 5v14',
    'phone' => 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
    'telegram' => 'M21.5 3.5 2.5 11l6 2.3L11 20l3.2-4.2 5 3.7zM8.5 13.3l10-7.6',
    'mail' => 'M3 5h18v14H3zM3 6l9 7 9-7',
    'check' => 'M5 12.5l4.5 4.5L19 7.5',
    'arrow' => 'M5 12h14M13 6l6 6-6 6',
    'menu' => 'M4 7h16M4 12h16M4 17h16',
    'close' => 'M6 6l12 12M18 6 6 18',
    'shield' => 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5',
    'clock' => 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    'layers' => 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    'doc' => 'M7 3h8l4 4v14H7zM14 3v5h5M10 13h6M10 17h6',
    'users' => 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14a6 6 0 013.5 6',
    'star' => 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    'chevron' => 'M6 9l6 6 6-6',
    'zoom' => 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4M11 8v6M8 11h6',
];

// Иконки, которые можно выбрать для услуги или карточки в админке (подписи — для списка выбора)
const ICON_LABELS = [
    'roof' => 'Кровля', 'facade' => 'Фасад', 'entrance' => 'Подъезд', 'weld' => 'Сварка', 'lift' => 'Лифт',
    'asphalt' => 'Дорога', 'bolt' => 'Электрика', 'window' => 'Окно', 'truck' => 'Спецтехника', 'room' => 'Ремонт',
    'tree' => 'Благоустройство', 'calendar' => 'Календарь', 'building' => 'Здание', 'seam' => 'Швы', 'phone' => 'Телефон',
    'mail' => 'Почта', 'shield' => 'Щит', 'clock' => 'Часы', 'layers' => 'Слои', 'doc' => 'Документ', 'users' => 'Люди', 'star' => 'Звезда',
];

function sprite_svg(): string
{
    $symbols = '';
    foreach (ICONS as $k => $d) $symbols .= '<symbol id="i-' . $k . '" viewBox="0 0 24 24"><path d="' . $d . '"/></symbol>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' . $symbols . '</svg>';
}

function icon(string $name, string $cls = ''): string
{
    return '<svg class="ic ' . $cls . '" aria-hidden="true" focusable="false"><use href="#i-' . $name . '"/></svg>';
}

// Знак компании: шестигранник со «скайлайном»
const LOGO_MARK = '<svg class="logo__mark" viewBox="0 0 40 44" aria-hidden="true" focusable="false"><path d="M20 2 37 11.5v21L20 42 3 32.5v-21z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 32V21h4.5v11M17.5 32V14h5v18M24.5 32V19H29v13" fill="currentColor" stroke="none"/><path d="M9.5 32h21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
