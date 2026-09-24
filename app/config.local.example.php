<?php
// Пример настроек для хостинга. Скопируйте в app/config.local.php и поправьте.
// Раскладка на Beget (папка сайта ~/stroygrad.ru):
//   ~/stroygrad.ru/app          — ядро (этот репозиторий, папка app)
//   ~/stroygrad.ru/data         — данные сайта: единственный источник правды
//   ~/stroygrad.ru/storage      — пароль, сессии, заявки, история правок, корзина (создаётся сама)
//   ~/stroygrad.ru/public_html  — корень сайта: статика из public/ + собранные страницы
return [
    'site_url'    => 'https://stroygrad.ru',
    'base_path'   => '',
    'public_dir'  => ROOT_DIR . '/public_html',
    'out_dir'     => ROOT_DIR . '/public_html',
    // Ключ, по которому скрипт заливки просит сервер пересобрать сайт (любая длинная случайная строка)
    'deploy_key'  => '',
];
