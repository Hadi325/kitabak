<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Silence PHP 8.5 deprecation notices (e.g. PDO::MYSQL_ATTR_SSL_CA) so they
// don't get rendered into HTML responses. Real errors/warnings still surface.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
