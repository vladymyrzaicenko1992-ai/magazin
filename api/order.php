<?php
/**
 * Альтернатива Google Apps Script — якщо є PHP-хостинг.
 * POST JSON: { "name", "phone", "comment", "items", "total", "website" }
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://vse-v-morozilke.shop');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config.php missing']);
    exit;
}

$config = require $configPath;
$token = trim($config['telegram_bot_token'] ?? '');
$chatId = trim($config['telegram_chat_id'] ?? '');

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

if (!empty($body['website'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Spam']);
    exit;
}

$name = trim((string)($body['name'] ?? ''));
$phone = trim((string)($body['phone'] ?? ''));
$comment = trim((string)($body['comment'] ?? ''));
$items = $body['items'] ?? [];
$total = (float)($body['total'] ?? 0);

if (mb_strlen($name) < 2) {
    echo json_encode(['ok' => false, 'error' => "Вкажіть ім'я"]);
    exit;
}
if (preg_match('/\d{10,}/', preg_replace('/\D/', '', $phone)) !== 1) {
    echo json_encode(['ok' => false, 'error' => 'Вкажіть коректний телефон']);
    exit;
}
if (!is_array($items) || count($items) === 0 || $total <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Некоректне замовлення']);
    exit;
}

if ($token === '' || $chatId === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Telegram not configured']);
    exit;
}

$lines = [
    '🛒 НОВЕ ЗАМОВЛЕННЯ',
    '',
    "👤 Ім'я: {$name}",
    "📱 Телефон: {$phone}",
    '━━━━━━━━━━',
];

foreach ($items as $it) {
    $qty = (int)($it['qty'] ?? $it['quantity'] ?? 1);
    $title = $it['name'] ?? $it['n'] ?? 'Товар';
    $lines[] = "• {$title} ×{$qty}";
}

$lines[] = '━━━━━━━━━━';
$lines[] = '💰 Сума: ' . round($total, 2) . ' грн';
if ($comment !== '') {
    $lines[] = '💬 ' . $comment;
}
$lines[] = '🕒 ' . date('d.m.Y H:i');
$lines[] = '';
$lines[] = '🌐 vse-v-morozilke.shop';

$text = implode("\n", $lines);

$url = "https://api.telegram.org/bot{$token}/sendMessage";
$payload = json_encode(['chat_id' => $chatId, 'text' => $text]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
if ($code !== 200 || empty($data['ok'])) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => $data['description'] ?? 'Telegram error',
    ]);
    exit;
}

echo json_encode(['ok' => true]);
