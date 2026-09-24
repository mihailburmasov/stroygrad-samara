<?php
// Настройки по умолчанию — для работы на своём компьютере.
// На хостинге рядом кладётся app/config.local.php и переопределяет нужные ключи (пример — config.local.example.php).
return [
    // Адрес сайта без слеша в конце и подпапка, если сайт лежит не в корне домена.
    'site_url'    => 'https://mihailburmasov.github.io',
    'base_path'   => '/stroygrad-samara',
    'studio_slug' => 'stroygrad-samara',

    // Папки. data — единственный источник правды (тексты, услуги, фото, отзывы).
    // public — статика (css, js, шрифты, картинки). out — куда пишутся готовые страницы (корень сайта).
    // Если public и out — одна папка (так на хостинге), статика не копируется.
    'data_dir'    => ROOT_DIR . '/data',
    'public_dir'  => ROOT_DIR . '/public',
    'out_dir'     => ROOT_DIR . '/dist',
    'storage_dir' => ROOT_DIR . '/storage',

    // Черновой режим: вместо пустых реквизитов показываются пометки «уточнить».
    'draft'       => false,
];
