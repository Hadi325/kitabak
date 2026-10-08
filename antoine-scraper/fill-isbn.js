const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'antoine_books.csv');

const BACKUP_FILE = path.join(
    __dirname,
    'antoine_books.backup.csv'
);

const HEADERS = [
    'title',
    'subject',
    'grade',
    'publisher',
    'author',
    'language',
    'edition_year',
    'isbn',
    'cover_image_url',
];

function csvValue(value = '') {
    const text = String(value).replaceAll('"', '""');
    return `"${text}"`;
}

/**
 * Validate an ISBN-13/EAN-13 check digit.
 */
function isValidIsbn13(value) {
    if (!/^\d{13}$/.test(value)) {
        return false;
    }

    if (
        !value.startsWith('978') &&
        !value.startsWith('979')
    ) {
        return false;
    }

    let sum = 0;

    for (let index = 0; index < 12; index += 1) {
        const digit = Number(value[index]);

        sum += index % 2 === 0
            ? digit
            : digit * 3;
    }

    const expectedCheckDigit =
        (10 - (sum % 10)) % 10;

    return expectedCheckDigit === Number(value[12]);
}

/**
 * Search the Antoine image URL for a valid ISBN-13.
 */
function extractIsbnFromUrl(imageUrl = '') {
    if (!imageUrl) {
        return '';
    }

    let decodedUrl = String(imageUrl);

    try {
        decodedUrl = decodeURIComponent(decodedUrl);
    } catch {
        // Keep the original URL when decoding fails.
    }

    const candidates =
        decodedUrl.match(/97[89]\d{10}/g) || [];

    return candidates.find(isValidIsbn13) || '';
}

function loadBooks() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error('antoine_books.csv was not found.');
        process.exit(1);
    }

    const content = fs.readFileSync(CSV_FILE, 'utf8');

    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true,
    });
}

function saveBooks(books) {
    const rows = books.map((book) => {
        return HEADERS.map((header) => {
            return csvValue(book[header] || '');
        }).join(',');
    });

    const csv = [
        HEADERS.map(csvValue).join(','),
        ...rows,
    ].join('\n');

    fs.writeFileSync(
        CSV_FILE,
        '\uFEFF' + csv,
        'utf8'
    );
}

function main() {
    const books = loadBooks();

    // Create a recoverable copy before changing the CSV.
    fs.copyFileSync(CSV_FILE, BACKUP_FILE);

    let added = 0;
    let alreadyFilled = 0;
    let notFound = 0;

    for (const book of books) {
        if (String(book.isbn || '').trim() !== '') {
            alreadyFilled += 1;
            continue;
        }

        const isbn = extractIsbnFromUrl(
            book.cover_image_url
        );

        if (isbn) {
            book.isbn = isbn;
            added += 1;

            console.log(
                `Found: ${isbn} — ${book.title}`
            );
        } else {
            notFound += 1;

            console.log(
                `Not found: ${book.title}`
            );
        }
    }

    saveBooks(books);

    console.log('');
    console.log('ISBN collection completed.');
    console.log(`Books checked: ${books.length}`);
    console.log(`ISBN values added: ${added}`);
    console.log(`Already filled: ${alreadyFilled}`);
    console.log(`Not found: ${notFound}`);
    console.log('Updated: antoine_books.csv');
    console.log('Backup: antoine_books.backup.csv');
}

main();