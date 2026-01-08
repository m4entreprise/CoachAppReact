<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__.'/..');
    $dotenv->safeLoad();
} catch (Throwable $e) {
    // ignore
}

function envOrDefault(string $key, string $default = ''): string
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

$host = envOrDefault('DB_HOST', '127.0.0.1');
$port = envOrDefault('DB_PORT', '3306');
$db = envOrDefault('DB_DATABASE', 'coachapp');
$user = envOrDefault('DB_USERNAME', 'root');
$pass = envOrDefault('DB_PASSWORD', '');

$dsn = "mysql:host={$host};port={$port};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $safeDb = str_replace('`', '``', $db);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$safeDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    fwrite(STDOUT, "Database ensured: {$db}\n");
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage()."\n");
    exit(1);
}
