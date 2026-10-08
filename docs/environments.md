# Development and production environments

The project has two environments. There is no staging environment.

| Environment | Runtime configuration | Secrets committed to Git |
|---|---|---|
| Development | Local `.env` generated from the encrypted development bundle or template | No plaintext secrets |
| Production | Laravel Cloud custom environment variables | No |

## Files in Git

- `.env.development.example` documents all local development variables without secret values.
- `.env.production.example` documents the variables expected by Laravel Cloud without secret values.
- `.env.development.encrypted` may contain the real shared development values because Laravel encrypts its complete contents.
- `scripts/use-development-environment.ps1` safely creates a developer's local `.env`.
- `scripts/encrypt-development-environment.ps1` updates the encrypted shared development bundle.

Plain `.env`, `.env.development`, backups, and Firebase service-account files are ignored by Git.

## First-time maintainer setup

Create the plaintext development source:

```powershell
Copy-Item .env.development.example .env.development
```

Fill `.env.development` with development-only values. Do not use production database, Firebase Admin, email, or third-party API credentials.

Firebase Admin accepts either an ignored JSON file path:

```dotenv
FIREBASE_CREDENTIALS=storage/app/firebase/service-account.json
```

or the complete compact service-account JSON inside the encrypted environment:

```dotenv
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"development-project"}'
```

The inline form makes the encrypted bundle self-contained for another developer. It must only contain credentials for a separate development Firebase project.

Encrypt the completed development file:

```powershell
.\scripts\encrypt-development-environment.ps1
```

Laravel prints a decryption key once. Store that key in the team's password manager and never commit it. Commit `.env.development.encrypted` after checking that `.env.development` remains ignored.

## New developer setup

Install PHP dependencies first so the Laravel decryption command is available:

```powershell
composer install
```

Create the local environment:

```powershell
.\scripts\use-development-environment.ps1
```

The script requests the shared development decryption key without displaying it. If the encrypted bundle does not exist yet, it safely copies `.env.development.example` instead.

The script will not overwrite an existing `.env`. To intentionally replace it, use:

```powershell
.\scripts\use-development-environment.ps1 -Replace
```

Before replacement, the script creates a timestamped `.env.backup.*` file and restores the original if setup fails.

Finish local installation:

```powershell
npm ci
php artisan migrate
php artisan storage:link
php artisan serve
```

In a second terminal:

```powershell
npm run dev
```

## Production

Production values remain in Laravel Cloud under **Environment > Settings > General > Custom environment variables**. Do not copy the development environment into Laravel Cloud and do not commit a plaintext `.env.production`.

`npm run dev` uses local development values. Laravel Cloud injects production values before `npm run build` and when the Laravel application runs.

Do not manually Base64-encode environment values. Laravel's generated `APP_KEY`
already includes its required `base64:` prefix. For Firebase Admin in Laravel
Cloud, set `FIREBASE_CREDENTIALS` to the complete compact service-account JSON.

Book-availability notifications require the Twilio book-alert template variables
documented in `.env.production.example`. English is required, Arabic is required
for the Arabic interface, and French is optional because the application falls
back to the English template when the French template is empty.

These notifications are queued. Add a Laravel Cloud queue cluster or enable a
background process that runs:

```bash
php artisan queue:work
```

Deployments must run `php artisan migrate --force` so the notification
subscription table exists before the worker handles jobs.

## Adding a new API or environment variable

1. Add the variable name and a safe blank/default value to both example files when it applies to both environments.
2. Add the real development value to the ignored `.env.development`.
3. Re-encrypt with `.\scripts\encrypt-development-environment.ps1 -Replace`.
4. Add the real production value to Laravel Cloud.
5. Commit the code, example files, documentation, and updated encrypted development bundle.

Never use a `VITE_` prefix for server secrets. Every `VITE_*` value is included in browser JavaScript and is publicly visible.
