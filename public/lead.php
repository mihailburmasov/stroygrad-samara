<?php
// Приём заявок с форм сайта. Обработчик лежит вне корня сайта (папка app рядом с корнем).
foreach ([__DIR__ . '/../app', __DIR__ . '/app'] as $app) if (is_file("$app/lead.php")) { require "$app/lead.php"; exit; }
http_response_code(503);
