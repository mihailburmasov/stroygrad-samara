<?php
// Приём заявок с форм сайта: проверка, запись в журнал (storage/leads), отправка на почту и в Telegram.
// Ответ — JSON. Заявка сохраняется в журнале, даже если почта или Telegram не сработали: её видно в админке.
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/admin/ops.php';
require_once __DIR__ . '/lead-deliver.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function lead_reply(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_FLAGS);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') lead_reply(405, ['ok' => false, 'error' => 'Только POST']);

$field = fn(string $k, int $max) => mb_substr(trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)($_POST[$k] ?? ''))), 0, $max);

// бот заполнил скрытое поле — делаем вид, что всё хорошо
if ($field('website', 200) !== '') lead_reply(200, ['ok' => true]);

$lead = [
    'date' => date('Y-m-d H:i:s'),
    'name' => $field('name', 80),
    'phone' => $field('phone', 24),
    'service' => $field('service', 200),
    'message' => $field('message', 1000),
    'subject' => $field('subject', 200),
    'portfolio' => ($_POST['want_portfolio'] ?? '') === 'yes',
    'page' => $field('source_url', 500),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
];
$digits = preg_replace('~\D~', '', $lead['phone']);
if (mb_strlen($lead['name']) < 2 || strlen($digits) < 10 || strlen($digits) > 12) lead_reply(400, ['ok' => false, 'error' => 'Укажите имя и телефон']);
if (($_POST['consent'] ?? '') !== 'yes') lead_reply(400, ['ok' => false, 'error' => 'Нужно согласие на обработку данных']);

// Заявка всегда пишется в журнал. Лимит (30 в час с одного адреса — офис за одним IP тоже пройдёт)
// только придерживает уведомления на почту и в Telegram, чтобы бот не завалил их спамом.
try {
    $notify = with_lock(function () use (&$lead) {
        $f = storage_path('lead-rate.json');
        $all = is_file($f) ? read_json($f) : [];
        foreach ($all as $ip => $list) { $all[$ip] = array_values(array_filter($list, fn($t) => $t > time() - 3600)); if (!$all[$ip]) unset($all[$ip]); }
        $notify = count($all[$lead['ip']] ?? []) < 30;
        $all[$lead['ip']][] = time();
        write_file_atomic($f, json_pretty($all));
        if (!$notify) $lead['muted'] = true;
        ensure_dir(storage_path('leads'));
        if (file_put_contents(storage_path('leads/' . date('Y-m') . '.jsonl'), json_encode($lead, JSON_FLAGS) . "\n", FILE_APPEND | LOCK_EX) === false) throw new RuntimeException('journal');
        return $notify;
    });
} catch (Throwable $e) {
    error_log('lead: ' . $e->getMessage());
    lead_reply(500, ['ok' => false, 'error' => 'Не удалось сохранить заявку']);
}
if (!$notify) lead_reply(200, ['ok' => true]);

$lines = [
    $lead['subject'] ?: 'Заявка с сайта',
    'Имя: ' . $lead['name'],
    'Телефон: ' . $lead['phone'],
    'Направление: ' . ($lead['service'] ?: '—'),
    'Комментарий: ' . ($lead['message'] ?: '—'),
];
if ($lead['portfolio']) $lines[] = 'Просит портфолио и коммерческое предложение';
$lines[] = 'Страница: ' . ($lead['page'] ?: '—');
$lines[] = 'Время: ' . $lead['date'];
lead_deliver(implode("\n", $lines), $lead['subject'] ?: 'Заявка с сайта');
lead_reply(200, ['ok' => true]);
