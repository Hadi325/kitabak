import FlashMessages from '@/Components/FlashMessages';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const listingImage = (listing) =>
    imageUrl(
        listing.photo_url ||
            listing.book?.cover_image_url ||
            listing.book?.images?.[0]?.image_path,
    );
function listingGalleryImages(listing) {
    const images = [];

    const addImage = (value) => {
        if (!value) return;

        let url = value;

        if (
            !url.startsWith('http://') &&
            !url.startsWith('https://') &&
            !url.startsWith('/')
        ) {
            url = `/storage/${url}`;
        }

        if (!images.includes(url)) {
            images.push(url);
        }
    };

    // Main listing photo
    addImage(listing?.photo_url);

    // Additional photos belonging to this listing
    (listing?.images ?? []).forEach((image) => {
        addImage(
            image?.image_url ??
                image?.photo_url ??
                image?.image_path ??
                image?.path,
        );
    });

    // If the listing has no uploaded photos,
    // fall back to the catalog book cover.
    if (images.length === 0) {
        addImage(listing?.book?.cover_image_url);

        if (images.length === 0) {
            addImage(listing?.book?.images?.[0]?.image_path);
        }
    }

    return images;
}
export default function MyBooks({ listings = [] }) {
    const { t, i18n } = useTranslation('common');
const [query, setQuery] = useState('');
const [status, setStatus] = useState('all');
const [category, setCategory] = useState(() => {
    if (typeof window === 'undefined') {
        return 'all';
    }

    return sessionStorage.getItem('kitabak_my_books_category') || 'all';
});
useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }

    sessionStorage.setItem('kitabak_my_books_category', category);
}, [category]);
const [searchOpen, setSearchOpen] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [confirmation, setConfirmation] = useState(null);

    const [photoViewer, setPhotoViewer] = useState(null);

    const availableCount = listings.filter(
        (listing) => listing.status === 'available',
    ).length;

    const soldCount = listings.filter(
        (listing) => listing.status === 'sold',
    ).length;
    const searchSuggestions = useMemo(() => {
    const normalizedQuery = query
        .trim()
        .toLocaleLowerCase(i18n.language);

    return listings.filter((listing) => {
        const book = listing.book ?? {};

        if (!normalizedQuery) {
            return true;
        }

        const searchableText = [
            book.title,
            book.subject,
            book.book_type,
            book.part,
            book.author,
            book.publisher,
            book.isbn,
            book.grade,
            listing.location,
        ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(i18n.language);

        return searchableText.includes(normalizedQuery);
    });
}, [listings, query, i18n.language]);
    const filteredListings = useMemo(() => {
    const normalizedQuery = query
        .trim()
        .toLocaleLowerCase(i18n.language);

    return listings.filter((listing) => {
        const book = listing.book ?? {};

      const matchesStatus =
    status === 'all' || listing.status === status;

const matchesCategory =
    category === 'all' ||
    book.book_category === category;

const searchableText = [
            book.title,
            book.subject,
            book.book_type,
            book.part,
            book.author,
            book.publisher,
            book.isbn,
            book.grade,
            listing.location,
        ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(i18n.language);

     return (
    matchesStatus &&
    matchesCategory &&
    (!normalizedQuery ||
        searchableText.includes(normalizedQuery))
);
    });
}, [listings, query, status, category, i18n.language]);

const openPhotoViewer = (listing) => {
    const images = listingGalleryImages(listing);

    if (!images.length) {
        return;
    }

    setPhotoViewer({
        images,
        index: 0,
        title:
            listing.book?.title ||
            t('my_books.untitled', {
                defaultValue: 'Untitled book',
            }),
    });
};

const closePhotoViewer = () => {
    setPhotoViewer(null);
};

const showPreviousPhoto = () => {
    setPhotoViewer((current) => {
        if (!current) return current;

        return {
            ...current,
            index:
                (current.index -
                    1 +
                    current.images.length) %
                current.images.length,
        };
    });
};

const showNextPhoto = () => {
    setPhotoViewer((current) => {
        if (!current) return current;

        return {
            ...current,
            index:
                (current.index + 1) %
                current.images.length,
        };
    });
};

useEffect(() => {
    if (!photoViewer) {
        return;
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setPhotoViewer(null);
        }

        if (
            event.key === 'ArrowLeft' &&
            photoViewer.images.length > 1
        ) {
            setPhotoViewer((current) => ({
                ...current,
                index:
                    (current.index -
                        1 +
                        current.images.length) %
                    current.images.length,
            }));
        }

        if (
            event.key === 'ArrowRight' &&
            photoViewer.images.length > 1
        ) {
            setPhotoViewer((current) => ({
                ...current,
                index:
                    (current.index + 1) %
                    current.images.length,
            }));
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener(
            'keydown',
            handleKeyDown,
        );
    };
}, [photoViewer]);



    const money = useMemo(
        () =>
            new Intl.NumberFormat(i18n.language, {
                style: 'currency',
                currency: 'USD',
            }),
        [i18n.language],
    );

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
            }),
        [i18n.language],
    );

    const markAsSold = (listing) => {
        setConfirmation({ action: 'sold', listing });
    };

    const repostListing = (listing) => {
        setConfirmation({ action: 'repost', listing });
    };

    const deleteListing = (listing) => {
        setConfirmation({
            action: listing.status === 'sold' ? 'clear' : 'delete',
            listing,
        });
    };

    const confirmListingAction = () => {
        if (!confirmation) return;

        const { action, listing } = confirmation;

        setUpdatingId(listing.id);
        setConfirmation(null);

        const options = {
            preserveScroll: true,
            onFinish: () => setUpdatingId(null),
        };

        if (action === 'sold') {
            router.patch(route('listings.mark-sold', listing.id), {}, options);
            return;
        }

        if (action === 'repost') {
            router.patch(route('listings.repost', listing.id), {}, options);
            return;
        }

        router.delete(route('listings.destroy', listing.id), options);
    };

    return (
        <AuthenticatedLayout>
            <Head
                title={t('my_books.title', {
                    defaultValue: 'My books',
                })}
            />

            <FlashMessages />

            <ListingActionModal
                confirmation={confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmListingAction}
                t={t}
            />

            <main className="page-shell pb-24 sm:pb-12">
                <PageHeader t={t} />

               <section className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
    <StatCard
        value={listings.length}
        label={t('my_books.total', {
            defaultValue: 'Total',
        })}
        tone="indigo"
        icon={<TotalBooksIcon />}
        active={status === 'all'}
        onClick={() => setStatus('all')}
    />

    <StatCard
        value={availableCount}
        label={t('my_books.available', {
            defaultValue: 'Available',
        })}
        tone="emerald"
        icon={<AvailableBookIcon />}
        active={status === 'available'}
        onClick={() => setStatus('available')}
    />

    <StatCard
        value={soldCount}
        label={t('my_books.sold', {
            defaultValue: 'Sold',
        })}
        tone="amber"
        icon={<SoldBookIcon />}
        active={status === 'sold'}
        onClick={() => setStatus('sold')}
    />
</section>

<div className="mb-6 flex items-start gap-1.5 md:gap-3">
        <div className="min-w-0 flex-1">
        <SearchBox
            query={query}
            setQuery={setQuery}
            t={t}
            listings={searchSuggestions}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            onSelect={(listing) => {
                const title = listing.book?.title ?? '';

                setQuery(title);

                // Search should show the selected book regardless
                // of whether it is Available or Sold.
                setStatus('all');

                setSearchOpen(false);

                window.setTimeout(() => {
                    document
                        .getElementById('my-books-results')
                        ?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                        });
                }, 50);
            }}
            onSubmit={() => {
                setSearchOpen(false);

                window.setTimeout(() => {
                    document
                        .getElementById('my-books-results')
                        ?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                        });
                }, 50);
            }}
        />
    </div>

    <CategoryFilter
        category={category}
        setCategory={setCategory}
        t={t}
    />
</div>
<div
    id="my-books-results"
    className="scroll-mt-24"
/>
                {filteredListings.length > 0 ? (
<section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">                        {filteredListings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                onPhotoClick={() => openPhotoViewer(listing)}
                                image={listingImage(listing)}
                                money={money}
                                dateFormatter={dateFormatter}
                                updating={
                                    updatingId === listing.id
                                }
                                markAsSold={markAsSold}
                                repostListing={repostListing}
                                deleteListing={deleteListing}
                                t={t}
                            />
                        ))}
                    </section>
                ) : (
                    <EmptyState
                        hasListings={listings.length > 0}
                        t={t}
                    />
                )}
            </main>
            {photoViewer && (
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                closePhotoViewer();
            }
        }}
        role="dialog"
        aria-modal="true"
        aria-label={photoViewer.title}
    >
        <button
            type="button"
            onClick={closePhotoViewer}
            aria-label="Close"
            className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
        >
            ×
        </button>

        {photoViewer.images.length > 1 && (
            <button
                type="button"
                onClick={showPreviousPhoto}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-4xl text-white transition hover:bg-black/70 sm:left-6 sm:h-14 sm:w-14"
            >
                ‹
            </button>
        )}

        <img
            src={photoViewer.images[photoViewer.index]}
            alt={photoViewer.title}
            className="max-h-[90vh] max-w-[90vw] select-none object-contain sm:max-h-[92vh] sm:max-w-[88vw]"
            draggable="false"
        />

        {photoViewer.images.length > 1 && (
            <button
                type="button"
                onClick={showNextPhoto}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-4xl text-white transition hover:bg-black/70 sm:right-6 sm:h-14 sm:w-14"
            >
                ›
            </button>
        )}

        {photoViewer.images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white">
                {photoViewer.index + 1} /{' '}
                {photoViewer.images.length}
            </div>
        )}
    </div>
)}
        </AuthenticatedLayout>
    );
}

function ListingActionModal({ confirmation, onClose, onConfirm, t }) {
    const action = confirmation?.action;
    const listing = confirmation?.listing;
    const book = listing?.book ?? {};
    const destructive = action === 'delete' || action === 'clear';

    const title = action === 'sold'
        ? t('my_books.mark_sold', { defaultValue: 'Mark as sold' })
        : action === 'repost'
          ? t('my_books.repost', { defaultValue: 'Repost' })
          : action === 'clear'
            ? t('my_books.clear', { defaultValue: 'Clear' })
            : t('my_books.delete', { defaultValue: 'Delete' });

    const message = action === 'sold'
        ? t('my_books.confirm_sold', { defaultValue: 'Mark this book as sold?' })
        : action === 'repost'
          ? t('my_books.confirm_repost', { defaultValue: 'Repost this book for sale?' })
          : action === 'clear'
            ? t('my_books.confirm_clear', { defaultValue: 'Permanently remove this sold book from My books?' })
            : t('my_books.confirm_delete', { defaultValue: 'Permanently delete this listing?' });

    return (
        <Modal show={Boolean(confirmation)} onClose={onClose} maxWidth="md">
            <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                        destructive
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                    }`}>
                        {action === 'repost' ? <RepostIcon /> : destructive ? <DeleteIcon /> : <CheckCircleIcon />}
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label={t('actions.close', { defaultValue: 'Close' })}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

               {action !== 'sold' && (
    <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
        {title}
    </h2>
)}
               <p
    className={`text-sm leading-6 text-slate-500 dark:text-slate-300 ${
        action === 'sold' ? 'mt-5' : 'mt-2'
    }`}
>
    {message}
</p>

                {listing && (
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                        <div className="grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-indigo-500 shadow-sm dark:bg-slate-800">
                            {listingImage(listing) ? (
                                <img src={listingImage(listing)} alt="" className="h-full w-full object-contain" />
                            ) : (
                                <BookIcon />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-extrabold text-slate-950 dark:text-white">
                                {book.title || t('my_books.untitled', { defaultValue: 'Untitled book' })}
                            </p>
                            {book.author && (
                                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{book.author}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`min-h-12 rounded-xl px-4 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] ${
                            destructive
                                ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                                : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                        }`}
                    >
                        {action === 'sold'
    ? t('actions.yes', {
          defaultValue: 'Yes',
      })
    : title}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function PageHeader({ t }) {
    return (
        <header className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {t('my_books.title', {
                        defaultValue: 'My books',
                    })}
                </h1>

                <p className="mt-2 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                    {t('my_books.description', {
                        defaultValue:
                            'Manage the books you have listed for sale.',
                    })}
                </p>
            </div>

            <Link
                href={route('add.book')}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
            >
                <PlusIcon />

                <span>
                    {t('my_books.add', {
                        defaultValue: 'Add a book',
                    })}
                </span>
            </Link>
        </header>
    );
}

function CategoryFilter({ category, setCategory, t }) {
    const [open, setOpen] = useState(false);
    const filterRef = useRef(null);

    const categories = [
        {
            value: 'all',
            label: t('my_books.all_categories', {
                defaultValue: 'All categories',
            }),
        },
        {
            value: 'school',
            label: t('book_form.category_school', {
                defaultValue: 'School book',
            }),
        },
        {
            value: 'university',
            label: t('book_form.category_university', {
                defaultValue: 'University book',
            }),
        },
        {
            value: 'novel',
            label: t('book_form.category_novel', {
                defaultValue: 'Novel',
            }),
        },
    ];

    const selectedCategory =
        categories.find((item) => item.value === category) ??
        categories[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    return (
        <div ref={filterRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="
                    flex
                    h-10
                    w-[6rem]
                    items-center
                    gap-1.5
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-2.5
                    text-[9px]
                    font-semibold
                    text-slate-700
                    shadow-sm
                    outline-none
                    transition
                    hover:border-slate-300
                    focus:border-indigo-400
                    focus:ring-2
                    focus:ring-indigo-500/10

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-white
                    dark:hover:border-slate-600

                    md:h-12
                    md:w-48
                    md:rounded-2xl
                    md:px-4
                    md:text-sm
                "
            >
                <span className="min-w-0 flex-1 truncate text-start">
                    {selectedCategory.label}
                </span>

                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform md:h-4 md:w-4 ${
                        open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                >
                    <path
                        d="m6 8 4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <div
                    className="
                        absolute
                        end-0
                        top-[calc(100%+0.35rem)]
                        z-50
                        w-36
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-1
                        shadow-xl

                        dark:border-slate-700
                        dark:bg-slate-900

                        md:w-48
                    "
                >
                    {categories.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                setCategory(item.value);
                                setOpen(false);
                            }}
                            className={`
                                block
                                w-full
                                rounded-lg
                                px-2.5
                                py-2
                                text-start
                                text-[10px]
                                font-semibold
                                transition

                                md:px-3
                                md:text-sm

                                ${
                                    category === item.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
function SearchBox({
    query,
    setQuery,
    t,
    listings,
    searchOpen,
    setSearchOpen,
    onSelect,
    onSubmit,
}) {
    const searchBoxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(event.target)
            ) {
                setSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [setSearchOpen]);

    const uniqueSearchListings = (() => {
        const searchText = query.trim().toLocaleLowerCase();

        if (!searchText) {
            return [];
        }

        const seenTitles = new Set();

        return listings.filter((listing) => {
            const title = String(
                listing.book?.title ?? '',
            ).trim();

            if (!title) {
                return false;
            }

            const normalizedTitle = title.toLocaleLowerCase();

            if (!normalizedTitle.includes(searchText)) {
                return false;
            }

            if (seenTitles.has(normalizedTitle)) {
                return false;
            }

            seenTitles.add(normalizedTitle);

            return true;
        });
    })();

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!query.trim()) {
            return;
        }

        setSearchOpen(false);
        onSubmit?.();
    };

    return (
        <section
            ref={searchBoxRef}
            className="relative z-30"
        >
            <form
                onSubmit={handleSubmit}
                className="
                    relative
                    flex
                    h-10
                    items-center
                    rounded-xl
                    border
                    border-indigo-500
                    bg-white
                    p-1
                    shadow-sm
                    transition
                    focus-within:ring-2
                    focus-within:ring-indigo-500/20
                    dark:border-indigo-500
                    dark:bg-slate-900

                    md:h-12
                    md:rounded-2xl
                "
            >
                <label
                    htmlFor="my-books-search"
                    className="sr-only"
                >
                    {t('my_books.search', {
                        defaultValue: 'Search my books...',
                    })}
                </label>

                <input
                    id="my-books-search"
                    type="search"
                    value={query}
                    autoComplete="off"
                    onFocus={() => {
                        if (query.trim()) {
                            setSearchOpen(true);
                        }
                    }}
                    onClick={() => {
                        if (query.trim()) {
                            setSearchOpen(true);
                        }
                    }}
                    onChange={(event) => {
                        const value = event.target.value;

                        setQuery(value);
                        setSearchOpen(value.trim().length > 0);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setSearchOpen(false);
                        }
                    }}
                    placeholder={t('my_books.search', {
                        defaultValue: 'Search my books...',
                    })}
                    className="
                        h-full
                        min-w-0
                        flex-1
                        border-0
                        bg-transparent
                        px-2
                        py-0
                        text-[10px]
                        font-semibold
                        leading-normal
                        text-slate-900
                        outline-none
                        ring-0

                        placeholder:text-[10px]
                        placeholder:font-semibold
                        placeholder:text-slate-400

                        focus:border-0
                        focus:outline-none
                        focus:ring-0

                        dark:text-white
                        dark:placeholder:text-slate-500

                        md:px-3
                        md:text-sm
                        md:placeholder:text-sm
                    "
                />

                <button
                    type="submit"
                    disabled={!query.trim()}
                    aria-label={t('my_books.search', {
                        defaultValue: 'Search',
                    })}
                    title={t('my_books.search', {
                        defaultValue: 'Search',
                    })}
                    className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-[11px]
                        bg-indigo-600
                        text-white
                        transition
                        hover:bg-indigo-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50

                        md:h-10
                        md:w-10
                        md:rounded-[13px]
                    "
                >
                    <SearchIcon />
                </button>
            </form>

            {searchOpen &&
                query.trim() &&
                uniqueSearchListings.length > 0 && (
                    <div
                        className="
                            absolute
                            inset-x-0
                            top-[calc(100%+0.4rem)]
                            z-50
                            max-h-80
                            overflow-y-auto
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-1.5
                            shadow-xl
                            dark:border-slate-700
                            dark:bg-slate-900
                        "
                    >
                        {uniqueSearchListings.map((listing) => {
                            const book = listing.book ?? {};

                            const title =
                                book.title ||
                                t('my_books.untitled', {
                                    defaultValue: 'Untitled book',
                                });

                            return (
                                <button
                                    key={listing.id}
                                    type="button"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                    }}
                                    onClick={() => onSelect(listing)}
                                    className="
                                        flex
                                        w-full
                                        items-center
                                        rounded-xl
                                        px-4
                                        py-3
                                        text-start
                                        transition
                                        hover:bg-slate-100
                                        focus:bg-slate-100
                                        focus:outline-none
                                        dark:hover:bg-slate-800
                                        dark:focus:bg-slate-800
                                    "
                                >
                                    <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white md:text-base">
                                        {title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

            {searchOpen &&
                query.trim() &&
                uniqueSearchListings.length === 0 && (
                    <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {t('my_books.no_results', {
                            defaultValue: 'No matching books',
                        })}
                    </div>
                )}
        </section>
    );
}
function ListingCard({
    listing,
    image,
    money,
    dateFormatter,
    updating,
    markAsSold,
     onAction,
    onPhotoClick,
    repostListing,
    deleteListing,
    t,
}) {
    const book = listing.book ?? {};
    const available = listing.status === 'available';

    const title =
        book.title ||
        t('my_books.untitled', {
            defaultValue: 'Untitled book',
        });

    const formattedDate = listing.created_at
        ? dateFormatter.format(new Date(listing.created_at))
        : null;

    return (
        <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-950">
                <button
    type="button"
    onClick={onPhotoClick}
    className="block h-full w-full cursor-zoom-in"
    aria-label={`View photos of ${title}`}
>
    <BookCover
        image={image}
        title={title}
    />
</button>

                <StatusBadge
                    available={available}
                    t={t}
                />
            </div>

<div className="flex flex-1 flex-col p-3 sm:p-4">
<div className="flex items-start justify-between gap-2"><h2 className="line-clamp-2 min-w-0 flex-1 text-sm font-extrabold leading-5 text-slate-950 dark:text-white sm:text-base">                        {title}
                    </h2>

<p className="shrink-0 text-sm font-black text-indigo-600 dark:text-indigo-400 sm:text-base">                        {money.format(Number(listing.price ?? 0))}
                    </p>
                </div>

                <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
                    {book.subject && (
                        <DetailChip>{book.subject}</DetailChip>
                    )}

                    {book.grade && (
                        <DetailChip>
                            {t('my_books.grade', {
                                grade: book.grade,
                                defaultValue:
                                    'Grade {{grade}}',
                            })}
                        </DetailChip>
                    )}

                    {book.book_type && (
                        <DetailChip>{t(`book_metadata.${book.book_type}`)}</DetailChip>
                    )}

                    {book.part && (
                        <DetailChip>{t('book_metadata.part_value', { part: book.part })}</DetailChip>
                    )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {listing.location && (
                        <DetailRow
                            icon={<LocationIcon />}
                            text={listing.location}
                        />
                    )}

                    {/* {book.isbn && (
                        <DetailRow
                            icon={<BarcodeIcon />}
                            text={`ISBN: ${book.isbn}`}
                            direction="ltr"
                        />
                    )} */}

                    {formattedDate && (
                        <DetailRow
                            icon={<CalendarIcon />}
                            text={`${t('my_books.listed_on', {
                                defaultValue: 'Listed',
                            })} ${formattedDate}`}
                        />
                    )}
                </div>

                <div className="mt-auto pt-4">
                    {available ? (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href={route(
                                        'listings.edit',
                                        listing.id,
                                    )}
                                    title={t('my_books.edit', {
                                        defaultValue: 'Edit',
                                    })}
                                    aria-label={t('my_books.edit', {
                                        defaultValue: 'Edit',
                                    })}
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                >
                                    <EditIcon />

                                    <span className="sr-only sm:not-sr-only">
                                        {t('my_books.edit', {
                                            defaultValue: 'Edit',
                                        })}
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    disabled={updating}
                                    onClick={() =>
                                        deleteListing(listing)
                                    }
                                    title={t('my_books.delete', {
                                        defaultValue: 'Delete',
                                    })}
                                    aria-label={t('my_books.delete', {
                                        defaultValue: 'Delete',
                                    })}
                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                >
                                    <DeleteIcon />

                                    <span className="sr-only sm:not-sr-only">
                                        {t('my_books.delete', {
                                            defaultValue: 'Delete',
                                        })}
                                    </span>
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => markAsSold(listing)}
                                className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm"
                            >
                                <CheckCircleIcon />

                                {updating
                                    ? t('my_books.updating', {
                                          defaultValue:
                                              'Updating...',
                                      })
                                    : t('my_books.mark_sold', {
                                          defaultValue:
                                              'Mark as sold',
                                      })}
                            </button>
                        </>
            ) : (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
        <button
            type="button"
            disabled={updating}
            onClick={() => repostListing(listing)}
            title={t('my_books.repost', {
                defaultValue: 'Repost',
            })}
            aria-label={t('my_books.repost', {
                defaultValue: 'Repost',
            })}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 sm:min-h-11 sm:rounded-xl"
        >
            <RepostIcon />
        </button>

        <button
            type="button"
            disabled={updating}
            onClick={() => deleteListing(listing)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm"
        >
            <DeleteIcon />

            {updating
                ? t('my_books.updating', {
                      defaultValue: 'Updating...',
                  })
                : t('my_books.clear', {
                      defaultValue: 'Clear',
                  })}
        </button>
    </div>
)}
                </div>
            </div>
        </article>
    );
}
function RepostIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
            <path d="M4 4v5h5" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
            <path d="M20 20v-5h-5" />
        </svg>
    );
}

function BookCover({ image, title }) {



    const [failed, setFailed] = useState(false);

    if (!image || failed) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 text-indigo-500 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50 dark:text-indigo-300">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                    <BookIcon />
                </span>

                <span className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {title}
                </span>
            </div>
        );
    }

    return (
        <img
            src={image}
            alt={title}
            onError={() => setFailed(true)}
            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-[1.02]"
        />
    );
}

function StatusBadge({ available, t }) {
    return (
        <span
            className={`absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold shadow-sm backdrop-blur ${
                available
                    ? 'border-emerald-200 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50/95 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300'
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    available
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                }`}
            />

            {available
                ? t('my_books.available', {
                      defaultValue: 'Available',
                  })
                : t('my_books.sold', {
                      defaultValue: 'Sold',
                  })}
        </span>
    );
}

function DetailChip({ children }) {
    return (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {children}
        </span>
    );
}

function DetailRow({ icon, text, direction }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-slate-400">
                {icon}
            </span>

            <span
                dir={direction}
                className="truncate"
            >
                {text}
            </span>
        </div>
    );
}

function EmptyState({ hasListings, t }) {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <BookIcon />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                {hasListings
                    ? t('my_books.no_results', {
                          defaultValue: 'No matching books',
                      })
                    : t('my_books.empty', {
                          defaultValue:
                              'You have no listings yet',
                      })}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {hasListings
                    ? t('my_books.change_filters', {
                          defaultValue:
                              'Try changing your search or status filter.',
                      })
                    : t('my_books.empty_description', {
                          defaultValue:
                              'Add your first book and make it visible to buyers.',
                      })}
            </p>

            {!hasListings && (
                <Link
                    href={route('add.book')}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    <PlusIcon />

                    {t('my_books.add', {
                        defaultValue: 'Add a book',
                    })}
                </Link>
            )}
        </section>
    );
}

function StatCard({
    value,
    label,
    tone = 'indigo',
    icon,
    active = false,
    onClick,
}) {
    const styles = {
        indigo: {
            number: 'text-indigo-600 dark:text-indigo-400',
            icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
            active:
                'border-indigo-500 ring-indigo-500/15 dark:border-indigo-400',
        },

        emerald: {
            number: 'text-emerald-600 dark:text-emerald-400',
            icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
            active:
                'border-emerald-500 ring-emerald-500/15 dark:border-emerald-400',
        },

        amber: {
            number: 'text-amber-500 dark:text-amber-400',
            icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
            active:
                'border-amber-500 ring-amber-500/15 dark:border-amber-400',
        },
    };

    const selectedStyle = styles[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`min-w-0 rounded-2xl border bg-white px-2.5 py-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 sm:p-5 ${
                active
                    ? `${selectedStyle.active} ring-2`
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
        >
            <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <span
                        className={`block text-xl font-black leading-none sm:text-3xl ${selectedStyle.number}`}
                    >
                        {value}
                    </span>

                    <span className="mt-1.5 block text-[10px] font-bold leading-tight text-slate-600 dark:text-slate-300 sm:mt-2 sm:text-sm sm:text-slate-500 sm:dark:text-slate-400">
                        {label}
                    </span>
                </div>

                <span
className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${selectedStyle.icon}`}                >
                    {icon}
                </span>
            </div>
        </button>
    );
}
function SearchIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
    );
}

function LocationIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

function BarcodeIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M3 5v14M7 5v14M11 5v14M15 5v14M18 5v14M21 5v14" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
        </svg>
    );
}
    function TotalBooksIcon() {
    return (
        <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            <path d="M8 6h8" />
            <path d="M8 10h6" />
        </svg>
    );
}

function AvailableBookIcon() {
    return (
        <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
            <path d="M8 8h8" />
            <path d="M8 12h5" />
            <path d="m16 18 2 2 4-5" />
        </svg>
    );
}

function SoldBookIcon() {
    return (
        <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18" />
            <path d="M5 6l1 14h12l1-14" />
            <path d="M9 6V4h6v2" />
            <path d="m9 13 2 2 4-4" />
        </svg>
    );


}
