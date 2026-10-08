const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const ANTOINE_URL =
    'https://www.antoineonline.com/intr/en/rentreescolaire';

const OUTPUT_FILE = path.join(
    __dirname,
    'antoine_books.csv'
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

/*
 * The label is shown in the terminal.
 * The value is saved in the CSV and database.
 */
const GRADE_OPTIONS = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },

    // Updated grade names
    { label: 'Brevet', value: '9' },
    { label: 'Second', value: '10' },
    { label: 'Bac1', value: '11' },

    // Terminal sections
    { label: 'SE', value: 'SE' },
    { label: 'SV', value: 'SV' },
    { label: 'SG', value: 'SG' },

    // LH is displayed, but SS is stored
    { label: 'LH', value: 'SS' },
];

function csvValue(value = '') {
    const text = String(value).replaceAll('"', '""');

    return `"${text}"`;
}

function extractYear(title = '') {
    const match = title.match(/\b(?:19|20)\d{2}\b/);

    return match ? match[0] : '';
}

function normalizeTitle(title = '') {
    return String(title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function createBookKey(grade, title) {
    return `${grade}|${normalizeTitle(title)}`;
}

async function askForGrade(terminal) {
    while (true) {
        console.log('');
        console.log('Choose a grade:');
        console.log('');

        GRADE_OPTIONS.forEach((option, index) => {
            console.log(
                `${index + 1}. ${option.label}`
            );
        });

        console.log('');

        const answer = await terminal.question(
            `Enter a number between 1 and ${GRADE_OPTIONS.length}: `
        );

        const selectedIndex =
            Number.parseInt(answer.trim(), 10) - 1;

        if (
            selectedIndex >= 0 &&
            selectedIndex < GRADE_OPTIONS.length
        ) {
            return GRADE_OPTIONS[selectedIndex];
        }

        console.log('');
        console.log('Invalid choice. Please try again.');
    }
}

function loadExistingBooks() {
    if (!fs.existsSync(OUTPUT_FILE)) {
        return [];
    }

    const content = fs.readFileSync(
        OUTPUT_FILE,
        'utf8'
    );

    if (content.trim() === '') {
        return [];
    }

    try {
        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            bom: true,
            trim: true,
        });
    } catch (error) {
        console.error('');
        console.error(
            'Could not read the existing CSV file.'
        );
        console.error(error.message);

        process.exit(1);
    }
}

function saveBooks(books) {
    const rows = books.map((book) => [
        book.title || '',
        book.subject || '',
        book.grade || '',
        book.publisher || '',
        book.author || '',
        book.language || '',
        book.edition_year || '',
        book.isbn || '',
        book.cover_image_url || '',
    ]);

    const csvLines = [
        HEADERS.map(csvValue).join(','),
        ...rows.map((row) =>
            row.map(csvValue).join(',')
        ),
    ];

    const csv = csvLines.join('\n');

    /*
     * The UTF-8 BOM helps Excel display Arabic
     * and French characters correctly.
     */
    fs.writeFileSync(
        OUTPUT_FILE,
        '\uFEFF' + csv,
        'utf8'
    );
}

async function scrollToLoadAllBooks(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let previousHeight = 0;
            let unchangedCount = 0;

            const timer = setInterval(() => {
                window.scrollBy(0, 700);

                const currentHeight =
                    document.body.scrollHeight;

                const bottomReached =
                    window.innerHeight +
                        window.scrollY >=
                    currentHeight - 100;

                if (
                    bottomReached &&
                    currentHeight === previousHeight
                ) {
                    unchangedCount += 1;
                } else {
                    unchangedCount = 0;
                }

                if (unchangedCount >= 3) {
                    clearInterval(timer);
                    resolve();
                }

                previousHeight = currentHeight;
            }, 300);

            /*
             * Stop scrolling after 20 seconds,
             * even if the page continues changing.
             */
            setTimeout(() => {
                clearInterval(timer);
                resolve();
            }, 20000);
        });
    });

    await page.waitForTimeout(2000);
}

async function scrapeDisplayedBooks(page) {
    return page
        .locator('.product-item')
        .evaluateAll((items) => {
            return items.map((item) => {
                const titleElement =
                    item.querySelector(
                        '.product-item-link, ' +
                            '.product-item-name a'
                    );

                const imageElement =
                    item.querySelector(
                        '.product-image-photo, ' +
                            '.product-image-wrapper img'
                    );

                const title =
                    titleElement?.textContent?.trim() ||
                    '';

                const coverImageUrl =
                    imageElement?.getAttribute('src') ||
                    imageElement?.getAttribute(
                        'data-src'
                    ) ||
                    imageElement?.getAttribute(
                        'data-original'
                    ) ||
                    '';

                return {
                    title,
                    cover_image_url: coverImageUrl,
                };
            });
        });
}

async function main() {
    const terminal = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let browser = null;

    try {
        /*
         * Ask the user which grade is being scraped.
         */
        const selectedGradeOption =
            await askForGrade(terminal);

        const selectedGrade =
            selectedGradeOption.value;

        const selectedGradeLabel =
            selectedGradeOption.label;

        console.log('');
        console.log(
            `Selected grade: ${selectedGradeLabel}`
        );
        console.log(
            `CSV grade value: ${selectedGrade}`
        );
        console.log('');
        console.log('Opening Antoine Online...');

        browser = await chromium.launch({
            headless: false,
        });

        const page = await browser.newPage({
            viewport: {
                width: 1400,
                height: 900,
            },
        });

        await page.goto(ANTOINE_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        console.log('');
        console.log('In the opened website:');
        console.log('1. Select a school.');
        console.log(
            `2. Select its ${selectedGradeLabel} class.`
        );
        console.log(
            '3. Wait until all books appear.'
        );
        console.log(
            '4. Return to this terminal.'
        );
        console.log('');

        await terminal.question(
            'Press Enter after all books appear...'
        );

        console.log('');
        console.log('Reading the displayed books...');

        try {
            await page.waitForSelector(
                '.product-item',
                {
                    timeout: 30000,
                }
            );
        } catch {
            console.log('');
            console.log('No books were found.');
            console.log(
                'Make sure you selected the school and class.'
            );

            return;
        }

        /*
         * Scroll so lazy-loaded images and products
         * have time to appear.
         */
        await scrollToLoadAllBooks(page);

        const scrapedBooks =
            await scrapeDisplayedBooks(page);

        const validBooks = scrapedBooks.filter(
            (book) => book.title !== ''
        );

        /*
         * Read every book already stored in the CSV.
         * Previous books will not be deleted.
         */
        const existingBooks =
            loadExistingBooks();

        const previousCount =
            existingBooks.length;

        /*
         * A unique book is identified by:
         *
         * grade + normalized title
         *
         * If the same book appears in several schools,
         * it will be saved only once for that grade.
         */
        const booksMap = new Map();

        for (const book of existingBooks) {
            const key = createBookKey(
                book.grade,
                book.title
            );

            booksMap.set(key, book);
        }

        let addedCount = 0;
        let refreshedCount = 0;

        for (const scrapedBook of validBooks) {
            const key = createBookKey(
                selectedGrade,
                scrapedBook.title
            );

            const existingBook =
                booksMap.get(key);

            if (existingBook) {
                refreshedCount += 1;
            } else {
                addedCount += 1;
            }

            booksMap.set(key, {
                title: scrapedBook.title,

                /*
                 * Preserve information that may have
                 * been filled manually or by another script.
                 */
                subject:
                    existingBook?.subject || '',

                /*
                 * Store the database value:
                 * Brevet -> 9
                 * Second -> 10
                 * Bac1 -> 11
                 * LH -> SS
                 */
                grade: selectedGrade,

                publisher:
                    existingBook?.publisher || '',

                author:
                    existingBook?.author || '',

                language:
                    existingBook?.language || '',

                edition_year:
                    existingBook?.edition_year ||
                    extractYear(
                        scrapedBook.title
                    ),

                /*
                 * Existing ISBN values are preserved.
                 * fill-isbn.js can fill missing ISBNs later.
                 */
                isbn:
                    existingBook?.isbn || '',

                cover_image_url:
                    scrapedBook.cover_image_url ||
                    existingBook?.cover_image_url ||
                    '',
            });
        }

        const allBooks = Array.from(
            booksMap.values()
        );

        /*
         * Rewrite the CSV using old + new books.
         * Old books are preserved.
         */
        saveBooks(allBooks);

        console.log('');
        console.log(
            'Scraping completed successfully.'
        );
        console.log(
            `Selected grade: ${selectedGradeLabel}`
        );
        console.log(
            `Stored grade value: ${selectedGrade}`
        );
        console.log(
            `Books displayed by this school: ${validBooks.length}`
        );
        console.log(
            `New unique books added: ${addedCount}`
        );
        console.log(
            `Existing books refreshed: ${refreshedCount}`
        );
        console.log(
            `Previous books in CSV: ${previousCount}`
        );
        console.log(
            `Total books in CSV: ${allBooks.length}`
        );
        console.log(
            `File: ${path.basename(OUTPUT_FILE)}`
        );
    } catch (error) {
        console.error('');
        console.error('An error occurred:');
        console.error(error.message);

        process.exitCode = 1;
    } finally {
        if (browser) {
            await browser.close();
        }

        terminal.close();
    }
}

main();