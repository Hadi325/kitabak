import BookCoverImage from '@/Components/BookCoverImage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const listingCover = (listing) =>
    listing.photo_url ||
    listing.images?.[0]?.image_path ||
    listing.book?.cover_image_url ||
    listing.book?.images?.[0]?.image_path ||
    null;

    const sellerPhotoUrl = (seller) => {
    if (!seller?.profile_photo_path) {
        return null;
    }

    if (
        seller.profile_photo_path.startsWith('http://') ||
        seller.profile_photo_path.startsWith('https://')
    ) {
        return seller.profile_photo_path;
    }

    return `/storage/${seller.profile_photo_path.replace(/^\/+/, '')}`;
};

function BookFallback() {
    return (
        <span className="grid h-full w-full place-items-center text-slate-400 dark:text-slate-500">
            <svg
                className="h-12 w-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
            >
                <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" />
                <path d="M5 19a3 3 0 0 1 3-3h11" />
            </svg>
        </span>
    );
}

export default function SellerBooks({ seller, listings = [] }) {
    const { t, i18n } = useTranslation('common');
    const [showProfilePhoto, setShowProfilePhoto] = useState(false);
const profilePhoto = sellerPhotoUrl(seller);
    const money = useMemo(
        () =>
            new Intl.NumberFormat(i18n.language, {
                style: 'currency',
                currency: 'USD',
            }),
        [i18n.language],
    );
useEffect(() => {
    if (!showProfilePhoto) {
        return;
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            window.history.back();
        }
    };

    const handlePopState = () => {
        setShowProfilePhoto(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
        window.removeEventListener(
            'keydown',
            handleKeyDown,
        );

        window.removeEventListener(
            'popstate',
            handlePopState,
        );
    };
}, [showProfilePhoto]);

    return (
        <AuthenticatedLayout compactMobile>
            <Head
                title={t('seller_books.page_title', {
                    seller: seller.name,
                })}
            />

            <main className="page-shell pb-24 sm:pb-12">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    <svg
                        className="h-4 w-4 rtl:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    {t('actions.back', {
                        defaultValue: 'Back',
                    })}
                </button>

                <header className="mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30 sm:p-7">
                    <div className="flex items-center gap-4">
                    {profilePhoto ? (
    <button
        type="button"
        onClick={() => {
    window.history.pushState(
        { profilePhotoViewer: true },
        '',
        window.location.href,
    );

    setShowProfilePhoto(true);
}}
        className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:h-16 sm:w-16"
        aria-label={`View ${seller.name}'s profile photo`}
    >
        <img
            src={profilePhoto}
            alt={seller.name || ''}
            className="h-full w-full object-cover"
        />
    </button>
) : (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-600/20 sm:h-16 sm:w-16 sm:text-2xl">
        {seller.name?.charAt(0).toUpperCase() || '?'}
    </span>
)}

                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[.2em] text-indigo-600 dark:text-indigo-300">
                                {t('seller_books.seller', {
                                    defaultValue: 'Seller',
                                })}
                            </p>
                            <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                {seller.name}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                {t('seller_books.available_count', {
                                    total: listings.length,
                                })}
                            </p>
                        </div>
                    </div>
                </header>

                {listings.length > 0 ? (
                    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {listings.map((listing) => {
                            const book = listing.book ?? {};

                            return (
                                <article
                                    key={listing.id}
                                    className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <Link
                                        href={route(
                                            'listings.show',
                                            listing.id,
                                        )}
                                        className="block h-full"
                                    >
                                        <div className="aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <BookCoverImage
                                                src={listingCover(
                                                    listing,
                                                )}
                                                alt={book.title || ''}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                fallback={<BookFallback />}
                                            />
                                        </div>

                                        <div className="p-3 sm:p-4">
                                            <h2 className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-950 dark:text-white sm:text-base">
                                                {book.title}
                                            </h2>
                                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {book.author ||
                                                    book.subject ||
                                                    t(
                                                        'books.unknown_author',
                                                    )}
                                            </p>

                                            <div className="mt-3 flex items-end justify-between gap-2">
                                                <div className="min-w-0">
                                                    <strong className="block text-base font-black text-emerald-700 dark:text-emerald-300">
                                                        {money.format(
                                                            Number(
                                                                listing.price,
                                                            ),
                                                        )}
                                                    </strong>
                                                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                        {listing.location ||
                                                            t(
                                                                'seller_books.location_unknown',
                                                            )}
                                                    </span>
                                                </div>

                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
                                                    <svg
                                                        className="h-4 w-4 rtl:rotate-180"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="m9 18 6-6-6-6" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <BookFallback />
                        </span>
                        <h2 className="mt-4 text-lg font-extrabold text-slate-950 dark:text-white">
                            {t('seller_books.empty_title')}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                            {t('seller_books.empty_description', {
                                seller: seller.name,
                            })}
                        </p>
                    </section>
                )}
            </main>
            {showProfilePhoto && profilePhoto && (
    <div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        onClick={() => setShowProfilePhoto(false)}
    >
        <button
            type="button"
            onClick={() => setShowProfilePhoto(false)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20 sm:right-6 sm:top-6"
            aria-label="Close"
        >
            ×
        </button>

        <img
            src={profilePhoto}
            alt={seller.name || ''}
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(event) => event.stopPropagation()}
        />
    </div>
)}
        </AuthenticatedLayout>
    );
}
