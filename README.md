<div align="center">

# Kitabak 📚

### A multilingual marketplace for giving books a second life in Lebanon

**Discover books · List your own · Connect with readers**

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2-9553E9)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)

**English · Français · العربية**

</div>

## Overview

**Kitabak** is a web application designed to help people in Lebanon discover, list, and exchange information about books available for sale. It brings school textbooks, university books, and novels into a shared catalog, with a focus on making it easier to reuse books rather than leave them unused.

Users can browse available listings, add their own books, manage their listings, and mark books as sold. The interface supports English, French, and Arabic, including right-to-left layouts for Arabic.

The application uses **Laravel** for server-side logic and authorization, **React** for the interface, and **Inertia.js** to connect them.

## Screenshots

Screenshots of the home page, book catalog, add-book flow, and My Books page will be added here. Only demo data and non-sensitive accounts should appear in screenshots.

## Main features

### Book discovery and listings

- Browse and search a shared book catalog.
- Filter books and listings to find relevant results.
- Create listings with book photos, price, and location information.
- Manage personal listings from **My Books**.
- Mark a listing as **Sold** so it is no longer shown among available books.
- Browse books across **School**, **University**, and **Novel** categories.

### Assisted book entry

- Add book details manually when needed.
- Use AI-assisted analysis of book cover photos to help identify book information.
- Support ISBN/barcode-based book lookup and identification workflows.

> AI-generated information may be incomplete or incorrect and should be reviewed before saving.

### Accounts and community

- Registration, sign-in, password recovery, and profile management.
- Email verification and role-based access control.
- Administrator interfaces for managing users and moderating content.
- Community posts and interactions.

### User experience

- English, French, and Arabic translations.
- Right-to-left interface support for Arabic.
- Responsive layouts for mobile and desktop.
- Light and dark theme styling.
- Location selection to help buyers discover relevant listings.

## My internship contributions

Kitabak was developed as a **collaborative internship project**. This public repository showcases the application and the work I contributed to; it does not imply that I developed every part of the platform independently.

My contributions included:

1. **Book listings and My Books:** improved listing creation and personal listing management.
2. **AI-assisted book recognition:** worked on extracting book details from cover photos and refining the add-book experience.
3. **Book categories:** added or improved workflows for School, University, and Novel books.
4. **Localization:** worked on English, French, and Arabic translations and interface behavior.
5. **Authentication UI:** redesigned login and registration pages for a more consistent responsive experience.
6. **Search and visual consistency:** improved search bars, filters, and dark-mode styling.
7. **Listing location:** worked on location selection and presentation for book listings.
8. **Listing availability:** implemented or improved the **Mark as Sold** workflow and available-listing behavior.

## Technology stack

| Area | Technologies |
| --- | --- |
| Backend | PHP, Laravel 11 |
| Frontend | React 18, Inertia.js 2 |
| Styling | Tailwind CSS 3 |
| Database | MySQL |
| Authentication | Laravel authentication and Firebase-related integration |
| Authorization | Spatie Laravel Permission |
| Localization | i18next, react-i18next |
| Image handling | Intervention Image |
| Tooling | Composer, npm, Vite |
| Testing | PHPUnit |

## Project structure

```text
app/                 Laravel controllers, models, services, and requests
database/            Migrations, factories, and seeders
resources/js/        React pages, components, and translations
resources/css/       Application styles
routes/              Web and API routes
tests/               Unit and feature tests
public/              Public static assets
```

## Run locally

### Prerequisites

- PHP 8.2 or newer and Composer 2
- Node.js 20 or newer and npm
- MySQL 8 (or a compatible database)
- Required PHP extensions, including `pdo_mysql`, `mbstring`, `fileinfo`, `openssl`, and `xml`

### 1. Clone and install

```bash
git clone https://github.com/Hadi325/kitabak.git
cd kitabak
composer install
npm ci
```

### 2. Configure the application

Copy `.env.example` to `.env`:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

Create a local MySQL database, then configure the `DB_*` settings in your own `.env` file. Keep all passwords, API keys, and service credentials out of Git.

### 3. Prepare the database and storage

```bash
php artisan migrate --seed
php artisan storage:link
```

### 4. Start the development servers

Run in separate terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Visit **http://127.0.0.1:8000**.

> Some optional integrations, including AI analysis, Firebase, messaging, and external services, require your own credentials and additional configuration. The public repository does not include production secrets or live user data.

## Tests and build

After installing dependencies, run:

```bash
php artisan test
npm run build
```

The test suite is configured to use SQLite in memory; ensure the `pdo_sqlite` PHP extension is enabled. Test results have not been independently verified for this public portfolio copy.

## Security and responsible use

- Do not commit `.env` files, credentials, service-account keys, or user data.
- Use test accounts and sample content for local demonstrations.
- Do not assume a default administrator account exists.
- Review generated AI data before publishing listings.
- Configure and secure any external integrations before deployment.

## Project context

This repository is a **sanitized portfolio version** of a collaborative internship project. It is intended to demonstrate software architecture, product functionality, and my contributions. It is not presented as a ready-to-deploy production service, and the original private team repository is maintained separately.

---

<div align="center">

**Built with Laravel, React, Inertia.js, and Tailwind CSS.**

</div>
