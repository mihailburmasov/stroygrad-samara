<?php
// Отправка заявки на почту и в Telegram. Настройки — в админке (storage/settings.json).
declare(strict_types=1);

function lead_deliver(string $text, string $subject): array
{
    $set = settings_get();
    $res = [];
    $emails = $set['leadEmails'];
    if (!$emails) {
        $c = read_json(cfg('data_dir') . '/company.json');
        if (!empty($c['email'])) $emails = [$c['email']];
    }
    if ($emails && function_exists('mail')) {
        $host = preg_replace('~[^a-z0-9.-]~i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
        $from = $set['mailFrom'] ?: 'noreply@' . preg_replace('~^www\.~', '', $host);
        $headers = "From: =?UTF-8?B?" . base64_encode('Сайт СТРОЙГРАД') . "?= <$from>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64";
        $res['mail'] = @mail(implode(', ', $emails), '=?UTF-8?B?' . base64_encode($subject) . '?=', chunk_split(base64_encode($text)), $headers);
    }
    if ($set['tgToken'] && $set['tgChats']) {
        foreach ($set['tgChats'] as $chat) $res['tg'][$chat] = tg_send($set['tgToken'], $chat, $text);
    }
    return $res;
}

function tg_send(string $token, string $chat, string $text): bool
{
    $ch = curl_init("https://api.telegram.org/bot$token/sendMessage");
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => ['chat_id' => $chat, 'text' => $text, 'disable_web_page_preview' => 'true'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5]);
    $out = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $out !== false && $code === 200;
}
