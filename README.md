<div align="center">

# myBooks

### A bilingual platform for discovering, sharing, and managing educational books

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2-9553E9?logo=inertia&logoColor=white)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)

**English and Arabic · Role-based access · Responsive interface · Cloud ready**

</div>

---

## Overview

myBooks is a full-stack educational book platform built for students, families, and school communities. Users can publish books with cover images and inventory information, browse the shared catalog, and manage their own listings from a bilingual, responsive interface.

The application combines a Laravel backend with an Inertia-powered React frontend. This keeps routing, authorization, validation, and data access in Laravel while delivering a modern single-page experience in React.

## Key features

### Book catalog and inventory

- Create book listings with title, subject, grade, price, stock quantity, and multiple cover images.
- Browse books contributed by all verified users.
- Separate personal listings from books published by other users.
- Edit and delete listings with server-side ownership checks.
- Track total books, available copies, subjects, and personal inventory from the home dashboard.
- Discover recently added books and popular subjects.

### Accounts and access control

- Registration, login, logout, password reset, and profile management.
- Email verification workflow with local log-based delivery support.
- `admin` and `user` roles powered by Spatie Laravel Permission.
- Verified-user middleware on protected application routes.
- Admin tools for user roles, posts, reports, and platform statistics.

### Community module

- Publish searchable posts with descriptions, locations, dates, tags, and images.
- Upload up to ten images with labels and captions.
- Generate optimized thumbnails with Intervention Image.
- Like, comment on, and report community posts.
- Moderate user reports through the admin area.

### User experience

- English and Arabic translations with automatic LTR/RTL direction.
- Responsive layouts for desktop, tablet, and mobile.
- Dynamic dashboard with inventory statistics and recent books.
- Reusable React components and Tailwind CSS design primitives.
- Inertia navigation without a separate public API for page rendering.

## Technology stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2+, Laravel 11 |
| Frontend | React 18, Inertia.js 2 |
| Styling | Tailwind CSS 3, Headless UI |
| Database | MySQL 8 in development and production |
| Authentication | Laravel Breeze |
| Authorization | Spatie Laravel Permission |
| Image processing | Intervention Image Laravel |
| Localization | i18next, react-i18next |
| Asset pipeline | Vite 5 |
| Testing | PHPUnit 10, in-memory SQLite |
| Production | Laravel Cloud with managed MySQL |

## Architecture

```text
Browser
  │
  │ Inertia requests
  ▼
Laravel routes and middleware
  │
  ├── Controllers and form requests
  ├── Policies and role middleware
  ├── Eloquent models
  └── Services for image processing
          │
          ▼
       MySQL

Laravel renders Inertia page props
  │
  ▼
React pages + Tailwind CSS + i18next
```

### Important directories

| Path | Responsibility |
|---|---|
| `app/Http/Controllers` | Request handling and page data |
| `app/Http/Requests` | Validation and request authorization |
| `app/Models` | Eloquent entities and relationships |
| `app/Policies` | Ownership and administrative authorization |
| `app/Services` | Post-image storage and thumbnail processing |
| `database/migrations` | Database schema |
| `database/seeders` | Roles, permissions, and development administrator |
| `resources/js/Pages` | Inertia React pages |
| `resources/js/Components` | Shared interface components |
| `resources/js/i18n` | English and Arabic translations |
| `routes/web.php` | Web application routes |
| `tests` | Unit and feature tests |

## Requirements

Install the following before starting:

- PHP `8.2` or newer; PHP `8.4` is recommended for this Laravel 11 project.
- Composer `2.x`.
- Node.js `20.x` or newer and npm.
- MySQL `8.x` or MariaDB with an equivalent feature set.
- PHP extensions: `bcmath`, `ctype`, `curl`, `fileinfo`, `gd`, `mbstring`, `openssl`, `pdo_mysql`, `pdo_sqlite`, `tokenizer`, and `xml`.

Verify the main tools:

```bash
php --version
composer --version
node --version
npm --version
```

> PHP 8.5 may display PDO deprecation notices with the current Laravel 11 dependency set. These notices do not prevent the application from running; PHP 8.4 provides a quieter development experience.

## Local installation

### 1. Clone the repository

```bash
git clone <repository-url> mybooks
cd mybooks
```

The Laravel application is located at the repository root. Do not run commands from an `app/` subdirectory.

### 2. Install dependencies

```bash
composer install
npm ci
```

### 3. Create the environment file

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

### 4. Create the local database

Create an empty MySQL database named `mybooks`, then confirm these values in `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mybooks
DB_USERNAME=root
DB_PASSWORD=
```

Use the correct username and password for your local MySQL installation.

### 5. Initialize the application

```bash
php artisan migrate --seed
php artisan storage:link
```

`storage:link` is required for uploaded book covers and post images to be publicly accessible.

### 6. Start development servers

Run Laravel and Vite in separate terminals.

Terminal 1:

```bash
php artisan serve
```

Terminal 2:

```bash
npm run dev
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

To avoid a port conflict with another Laravel project:

```bash
php artisan serve --port=8001
```

Then set `APP_URL=http://127.0.0.1:8001` in `.env` and open [http://127.0.0.1:8001](http://127.0.0.1:8001).

## Development account

For security reasons, no default administrator account is created.

After setting up the application, an administrator can be created manually in a secure development environment.

Never commit real credentials or passwords to the repository.

New registrations receive the `user` role.

## Email verification in development

Local configuration uses Laravel's `log` mail driver:

```dotenv
MAIL_MAILER=log
```

Emails are written to:

```text
storage/logs/laravel.log
```

When testing registration, find the newest verification link or six-digit code in that file. To send real email, configure an SMTP provider in `.env`; never commit credentials.

## Useful commands

```bash
# Clear cached application state
php artisan optimize:clear

# Inspect application routes
php artisan route:list --except-vendor

# Apply pending migrations
php artisan migrate

# Rebuild a disposable local database and seed it
php artisan migrate:fresh --seed

# Format PHP files
php vendor/bin/pint

# Build production frontend assets
npm run build
```

> `migrate:fresh` deletes every table in the configured database. Use it only with a disposable local database.

## Testing

Run the PHP test suite:

```bash
php artisan test
```

Tests are configured in `phpunit.xml` to use an in-memory SQLite database. This isolates automated tests from each developer's local MySQL data.

Requirements for tests:

- The `pdo_sqlite` PHP extension must be enabled.
- Tests must not rely on records in the developer's normal database.
- Factories or seeders should create all data required by each test.

## Team workflow

Development and production configuration are separated without committing plaintext secrets. See [Environment management](docs/environments.md) for the shared encrypted development workflow and Laravel Cloud production setup.

Create focused branches from the latest `main`:

```bash
git switch main
git pull --ff-only
git switch -c feature/short-description
```

Before opening a pull request:

```bash
php vendor/bin/pint
php artisan test
npm run build
```

Commit both dependency lock files when their corresponding dependency definitions change:

- Commit `composer.lock` when `composer.json` changes.
- Commit `package-lock.json` when `package.json` or installed npm dependency versions change.
- Avoid unrelated lock-file changes in feature commits.

Never commit `.env`, database credentials, application keys, SMTP passwords, uploaded user content, `vendor/`, or `node_modules/`.

## Production deployment with Laravel Cloud

The production environment is designed for Laravel Cloud with a managed MySQL resource.

### Repository configuration

- Connect the GitHub repository to the Laravel Cloud application.
- Use the `main` branch for production only if that matches the team's release policy.
- Set the application directory to the repository root. Do not use the historical `app` directory.

### Build commands

```bash
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci --audit false
npm run build
```

### Deploy command

```bash
php artisan migrate --force
```

Run production seeding only as an intentional administrative operation; do not automatically recreate development credentials on every deploy.

### Production configuration

Laravel Cloud injects database connection variables when the managed MySQL resource is attached. Confirm that the runtime uses `DB_CONNECTION=mysql` and keep `APP_DEBUG=false`.

Required operational tasks:

- Configure a production mail provider.
- Use a persistent storage solution for user uploads.
- Monitor application and access logs after each deployment.
- Back up the managed database before high-risk schema changes.
- Review all pending Laravel Cloud changes before deploying.

## Troubleshooting

### `Could not open input file: artisan`

Run commands from the repository root:

```bash
cd mybooks
php artisan --version
```

### Uploaded images are not visible

Create the public storage link:

```bash
php artisan storage:link
```

Confirm that the web server can write to `storage/` and `bootstrap/cache/`.

### Verification email does not arrive locally

This is expected when `MAIL_MAILER=log`. Read `storage/logs/laravel.log` for the link or verification code.

### `There is no role named user`

Seed roles and permissions:

```bash
php artisan db:seed
php artisan permission:cache-reset
```

### Laravel Cloud cannot find `composer.json`

Confirm that the GitHub repository is connected and that the Laravel Cloud application directory is the repository root, not `app`.

### PHP 8.5 PDO deprecation notices

The server can continue running when these notices appear. Prefer PHP 8.4 for local development until the complete dependency stack is updated for PHP 8.5.

## Security guidelines

- Keep production secrets in Laravel Cloud or another approved secret manager.
- Keep `APP_DEBUG=false` in production.
- Validate and authorize all write operations on the server.
- Do not expose environment variables in screenshots, logs, issues, or pull requests.
- Rotate a credential immediately if it is accidentally disclosed.
- Keep Composer and npm dependencies updated through reviewed pull requests.

## Current development priorities

- Complete the book detail and search/filter experience.
- Improve image lifecycle management for book updates and deletions.
- Expand automated coverage for book ownership and dashboard queries.
- Consolidate legacy community features with the primary book experience.
- Finalize production storage and mail delivery configuration.

## Project status

myBooks is under active development. Database migrations, deployment settings, and user-facing workflows may evolve as the team prepares the platform for production use.

---

<div align="center">

Built with Laravel, Inertia.js, React, and Tailwind CSS.

</div>
