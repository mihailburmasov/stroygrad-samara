<?php
// Вход в админку. Само ядро лежит вне корня сайта (папка app рядом с корнем) — здесь только передача запроса.
foreach ([__DIR__ . '/../../app', __DIR__ . '/../app'] as $app) if (is_file("$app/admin/index.php")) { require "$app/admin/index.php"; exit; }
http_response_code(404);
