<?php
/**
 * Обработчик заявки на встречу-знакомство.
 * Требует PHP с функцией mail() или настройкой SMTP на хостинге.
 * Секреты почты не хранятся в клиентском коде.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const TO_EMAIL = 'nasti.kom@mail.ru';
const RATE_LIMIT_SECONDS = 45;
const RATE_FILE_PREFIX = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'anastasia_booking_';

function respond(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_header(string $value): string
{
    return str_replace(["\r", "\n", "%0a", "%0d"], '', $value);
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    respond(204, []);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// Honeypot
$honeypot = trim((string)($data['botcheck'] ?? $data['company'] ?? ''));
if ($honeypot !== '') {
    respond(200, ['ok' => true]);
}

$ip = preg_replace('/[^a-zA-Z0-9_.:-]/', '', client_ip()) ?: 'unknown';
$rateFile = RATE_FILE_PREFIX . md5($ip) . '.txt';
$now = time();
if (is_file($rateFile)) {
    $last = (int)file_get_contents($rateFile);
    if ($now - $last < RATE_LIMIT_SECONDS) {
        respond(429, ['ok' => false, 'error' => 'rate_limited']);
    }
}

$name = trim((string)($data['name'] ?? ''));
$contact = trim((string)($data['contact'] ?? ''));
$channel = trim((string)($data['channel'] ?? ''));
$time = trim((string)($data['time'] ?? ''));
$topic = trim((string)($data['topic'] ?? ''));
$ageOk = !empty($data['age_18']) || !empty($data['age']);
$consent = !empty($data['consent']);

$errors = [];
if ($name === '' || mb_strlen($name) > 120) {
    $errors['name'] = 'Укажите имя';
}
if ($contact === '' || mb_strlen($contact) > 200) {
    $errors['contact'] = 'Укажите телефон или почту';
}
$looksEmail = str_contains($contact, '@');
$looksPhone = (bool)preg_match('/\d{7,}/', preg_replace('/\D+/', '', $contact) ?? '');
if (!$looksEmail && !$looksPhone) {
    $errors['contact'] = 'Нужен телефон или электронная почта';
}
if (!$ageOk) {
    $errors['age'] = 'Нужно подтверждение возраста 18+';
}
if (!$consent) {
    $errors['consent'] = 'Нужно согласие на обработку данных';
}
if ($topic !== '' && mb_strlen($topic) > 2000) {
    $errors['topic'] = 'Слишком длинный текст';
}
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'validation', 'fields' => $errors]);
}

$allowedChannels = ['MAX', 'Telegram', 'WhatsApp', 'Email', 'Звонок', ''];
if (!in_array($channel, $allowedChannels, true)) {
    $channel = '';
}

$safeName = clean_header($name);
$safeContact = clean_header($contact);
$safeChannel = clean_header($channel);
$safeTime = clean_header(mb_substr($time, 0, 200));
$safeTopic = mb_substr($topic, 0, 2000);

$body = "Новая заявка с сайта\n\n"
    . "Имя: {$safeName}\n"
    . "Контакт: {$safeContact}\n"
    . "Способ связи: " . ($safeChannel !== '' ? $safeChannel : 'не указан') . "\n"
    . "Удобное время: " . ($safeTime !== '' ? $safeTime : 'не указано') . "\n"
    . "Вопрос:\n{$safeTopic}\n\n"
    . "Возраст 18+: да\n"
    . "Согласие на ПДн: да\n"
    . "IP: {$ip}\n"
    . "Дата: " . gmdate('Y-m-d H:i:s') . " UTC\n";

$subject = 'Заявка на знакомство с сайта';
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$from = 'noreply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . clean_header($from),
    'Reply-To: ' . ($looksEmail ? $safeContact : TO_EMAIL),
    'X-Mailer: AnastasiaSiteBooking',
];

$sent = @mail(TO_EMAIL, $encodedSubject, $body, implode("\r\n", $headers));
if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'mail_failed']);
}

file_put_contents($rateFile, (string)$now);
respond(200, ['ok' => true]);
