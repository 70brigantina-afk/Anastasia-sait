<?php
/**
 * Обработчик заявки. Предпочтительно SMTP через PHPMailer (.env + composer).
 * Секреты не хранятся в HTML/JS. Текст обращения не пишется в публичные логи.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const RATE_LIMIT_SECONDS = 45;
const RATE_FILE_PREFIX = 'anastasia_booking_';
const DEFAULT_TO = 'nasti.kom@mail.ru';
const DEFAULT_MIN_SECONDS = 3;

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

function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
}

function env_str(string $key, string $default = ''): string
{
    $value = $_ENV[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return (string)$value;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    respond(204, []);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$root = dirname(__DIR__);
load_env($root . DIRECTORY_SEPARATOR . '.env');

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$honeypot = trim((string)($data['botcheck'] ?? $data['company'] ?? ''));
if ($honeypot !== '') {
    respond(200, ['ok' => true]);
}

$loadedAt = (int)($data['form_loaded_at'] ?? 0);
$minSeconds = (int)env_str('FORM_MIN_SECONDS', (string)DEFAULT_MIN_SECONDS);
if ($loadedAt > 0) {
    $elapsedMs = (int)(microtime(true) * 1000) - $loadedAt;
    if ($elapsedMs >= 0 && $elapsedMs < $minSeconds * 1000) {
        respond(429, ['ok' => false, 'error' => 'too_fast']);
    }
}

$ip = preg_replace('/[^a-zA-Z0-9_.:-]/', '', client_ip()) ?: 'unknown';
$rateFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . RATE_FILE_PREFIX . md5($ip) . '.txt';
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
if ($contact !== '' && !$looksEmail && !$looksPhone) {
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
if ($time !== '' && mb_strlen($time) > 200) {
    $errors['time'] = 'Слишком длинный текст';
}
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'validation']);
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
    . "Тема:\n" . ($safeTopic !== '' ? $safeTopic : 'не указана') . "\n\n"
    . "Возраст 18+: да\n"
    . "Согласие на ПДн: да\n"
    . "IP: {$ip}\n"
    . "Дата: " . gmdate('Y-m-d H:i:s') . " UTC\n";

$to = env_str('MAIL_TO', DEFAULT_TO);
$subject = 'Заявка на знакомство с сайта';
$fromEmail = env_str('MAIL_FROM', 'noreply@localhost');
$fromName = env_str('MAIL_FROM_NAME', 'Сайт Анастасии');
$replyTo = $looksEmail ? $safeContact : $to;

$sent = false;
$autoload = $root . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
$smtpHost = env_str('SMTP_HOST');

if ($smtpHost !== '' && is_file($autoload)) {
    require_once $autoload;
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->CharSet = 'UTF-8';
        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->Port = (int)env_str('SMTP_PORT', '465');
        $secure = env_str('SMTP_SECURE', 'ssl');
        if ($secure !== '') {
            $mail->SMTPSecure = $secure;
        }
        $mail->SMTPAuth = true;
        $mail->Username = env_str('SMTP_USER');
        $mail->Password = env_str('SMTP_PASS');
        $mail->setFrom(clean_header($fromEmail), $fromName);
        $mail->addAddress($to);
        $mail->addReplyTo($replyTo);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->send();
        $sent = true;
    } catch (Throwable $e) {
        $sent = false;
    }
} else {
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . clean_header($fromEmail),
        'Reply-To: ' . clean_header($replyTo),
        'X-Mailer: AnastasiaSiteBooking',
    ];
    $sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'mail_failed']);
}

file_put_contents($rateFile, (string)$now);
respond(200, ['ok' => true]);
