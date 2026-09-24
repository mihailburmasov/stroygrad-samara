<?php
// Пример доступа для app/bin/deploy.php. Скопируйте в app/deploy.local.php (в git не хранится) и заполните.
return [
    'host'     => 'ftp.example.beget.tech', // FTP-сервер из панели Beget
    'user'     => 'login',
    'pass'     => 'password',
    'ssl'      => false,          // true — FTPS, если хостинг поддерживает
    'root'     => 'stroygrad.ru', // папка сайта от корня FTP (в ней лежат app, data, public_html)
    'docroot'  => 'public_html',  // корень сайта внутри этой папки
    'site_url' => 'https://stroygrad.ru',
    // тот же ключ, что deploy_key в app/config.server.php — по нему сервер пересобирает сайт после заливки
    'deploy_key' => '',
];
