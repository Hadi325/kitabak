import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const imageUrl = (path) => {
    if (!path) return null;

    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:') ||
        path.startsWith('blob:')
    ) {
        return path;
    }

    if (path.startsWith('/')) return path;
    if (path.startsWith('storage/')) return `/${path}`;

    return `/storage/${path}`;
};

const listingImage = (book) => {
    const featured = book.featured_listing ?? book.listings?.[0];

    return imageUrl(
        featured?.photo_url ||
            book.cover_image_url ||
            book.images?.[0]?.image_path ||
            featured?.images?.[0]?.image_path,
    );
};

export default function MyFavorites({ listings = [] }) {
    const { t, i18n } = useTranslation('common');
    const [query, setQuery] = useState('');
    const [soldMessage, setSoldMessage] = useState('');

    const scrollToFavoriteResults = () => {
    window.setTimeout(() => {
        document
            .getElementById('favorite-results')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }, 100);
};

const submitSearch = (event) => {
    event.preventDefault();

    if (!query.trim()) {
        return;
    }

    scrollToFavoriteResults();
};

    const filteredBooks = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase(i18n.language);

        return listings.filter((listing) => {
            const book = listing.book ?? {};
            const searchableText = [
                book.title,
                book.author,
                book.subject,
                book.book_type,
                book.part,
                book.grade,
                book.publisher,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase(i18n.language);

            return !normalizedQuery || searchableText.includes(normalizedQuery);
        });
    }, [listings, query, i18n.language]);

    const money = useMemo(
        () =>
            new Intl.NumberFormat(i18n.language, {
                style: 'currency',
                currency: 'USD',
            }),
        [i18n.language],
    );

    return (
        <AuthenticatedLayout>
            <Head title={t('nav.my_favorites', { defaultValue: 'My favorite' })} />

            <main className="page-shell pb-24 sm:pb-12">
                <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>

                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                            {t('nav.my_favorites', { defaultValue: 'My favorite' })}
                        </h1>
                    </div>
                </header>

               <section className="mb-6">
    <form
        onSubmit={submitSearch}
        className="
            flex
            h-11
            w-full
            items-center
            rounded-[18px]
            border
            border-slate-200
            bg-white
            p-1
            shadow-sm
            transition

            focus-within:border-violet-300
            focus-within:ring-2
            focus-within:ring-violet-200/50

            dark:border-slate-700
            dark:bg-slate-900
            dark:focus-within:border-violet-500
            dark:focus-within:ring-violet-500/20

            sm:h-12
        "
    >
        <label
            htmlFor="favorites-search"
            className="sr-only"
        >
            {t('actions.search', {
                defaultValue: 'Search',
            })}
        </label>

        <input
            id="favorites-search"
            type="search"
            value={query}
            onChange={(event) =>
                setQuery(event.target.value)
            }
            placeholder={t('actions.search', {
                defaultValue: 'Search',
            })}
            className="
                h-full
                min-w-0
                flex-1
                border-0
                bg-transparent
                px-3
                text-xs
                font-medium
                text-slate-700
                outline-none
                placeholder:text-slate-500
                focus:border-0
                focus:ring-0

                dark:text-white
                dark:placeholder:text-slate-400

                sm:px-4
                sm:text-sm
            "
        />

        <button
            type="submit"
            disabled={!query.trim()}
            aria-label={t('actions.search', {
                defaultValue: 'Search',
            })}
            title={t('actions.search', {
                defaultValue: 'Search',
            })}
            className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-[13px]

                bg-gradient-to-r
                from-indigo-600
                to-violet-600
                text-white

                shadow-md
                shadow-indigo-500/25

                transition

                hover:-translate-y-0.5
                hover:shadow-lg

                active:translate-y-0
                active:scale-95

                disabled:cursor-not-allowed
                disabled:opacity-40
                disabled:shadow-none

                dark:from-indigo-500
                dark:to-violet-500

                sm:h-10
                sm:w-10
            "
        >
            <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </svg>
        </button>
    </form>
</section>

<div
    id="favorite-results"
    className="scroll-mt-24"
/>

                {soldMessage && (
                    <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                        {soldMessage}
                    </p>
                )}

                {filteredBooks.length > 0 ? (
                    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredBooks.map((listing) => {
                            const book = listing.book ?? {};
                            const lowestPrice = Number(listing.price ?? 0);
                            const sold = listing.status === 'sold';

                            return (
                                <article key={book.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                    <Link
                                        href={sold ? '#' : route('listings.show', listing.id)}
                                        className="block"
                                        onClick={(event) => {
                                            if (!sold) return;

                                            event.preventDefault();
                                            setSoldMessage(t('favorites.sold_message', {
                                                defaultValue: 'This book has been sold and is no longer available.',
                                            }));
                                        }}
                                    >
                                        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                                            <img
                                                src={imageUrl(listingImage({ ...book, featured_listing: listing }))}
                                                alt={book.title}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />

                                            {sold && (
                                                <span className="absolute end-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                                    {t('book.sold', { defaultValue: 'Sold' })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col p-3">
                                            <h2 className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-950 dark:text-white sm:text-base">
                                                {book.title}
                                            </h2>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {book.author || book.subject || t('book.unknown_author', { defaultValue: 'Unknown author' })}
                                            </p>

                                            {(book.book_type || book.part) && (
                                                <p className="mt-1 truncate text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                                                    {[book.book_type ? t(`book_metadata.${book.book_type}`) : null, book.part ? t('book_metadata.part_value', { part: book.part }) : null].filter(Boolean).join(' · ')}
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                {lowestPrice !== null ? (
                                                    <strong className="text-base text-slate-950 dark:text-white">
                                                        {money.format(lowestPrice)}
                                                    </strong>
                                                ) : (
                                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                        {t('book.out_of_stock', { defaultValue: 'Out of stock' })}
                                                    </span>
                                                )}

                                                {!sold && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></svg>
                                                        1 left
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => router.post(route('favorites.toggle', listing.id), {}, { preserveScroll: true })}
                                        className="mx-3 mb-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                        {t('favorites.remove', { defaultValue: 'Remove from favorites' })}
                                    </button>
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
                            <svg
                                className="h-8 w-8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                            </svg>
                        </span>
                        <h2 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                            {t('favorites.empty_title', { defaultValue: 'Your favorite shelf is empty' })}
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            {t('favorites.empty', { defaultValue: 'No favorite books yet.' })}
                        </p>
                        <Link
                            href={route('dashboard')}
                            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                        >
                            {t('favorites.browse', { defaultValue: 'Browse books' })}
                        </Link>
                    </div>
                )}
            </main>
        </AuthenticatedLayout>
    );
}
