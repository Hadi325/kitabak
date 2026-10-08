#!/usr/bin/env bash
set -e

cd /var/www/html

# Make sure the SQLite file exists (ephemeral disk on free tier)
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite
chown -R www-data:www-data database storage bootstrap/cache

# Clear any stale caches from build, then re-cache
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

php artisan migrate --force
php artisan db:seed --force || true

# Ensure public/storage symlink exists for uploaded images
php artisan storage:link --force || true

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Apache in foreground
exec apache2-foreground
