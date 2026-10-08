import AdminTabs from '@/Components/AdminTabs';
import BookCoverImage, {
    resolveBookImageUrl,
} from '@/Components/BookCoverImage';
import BookImagesModal from '@/Components/BookImagesModal';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
const statusStyles = {
    available:
        'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300',
    sold: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300',
    reserved:
        'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300',
};
export default function Listings({
    listings,
    stats = {},
    locations = [],
    filters = {},
}) {
    const { t, i18n } = useTranslation('admin');
    const isArabic = i18n.dir() === 'rtl';
    const [search, setSearch] = useState(filters.q || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [location, setLocation] = useState(filters.location || 'all');
  const [price, setPrice] = useState(filters.price || 'all');
const [category, setCategory] = useState(filters.category || 'all');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [mobileStatus, setMobileStatus] = useState(
    filters.status || 'all',
);
const [mobileLocation, setMobileLocation] = useState(
    filters.location || 'all',
);
const [mobilePrice, setMobilePrice] = useState(
    filters.price || 'all',
);
const [mobileCategory, setMobileCategory] = useState(
    filters.category || 'all',
);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [imagesTarget, setImagesTarget] = useState(null);
    const resultsRef = useRef(null);
const firstRequestRef = useRef(true);
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
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        [i18n.language],
    );
    const navigateWithFilters = (overrides = {}) => {
      const next = {
    q: search.trim(),
    status,
    location,
    price,
    category,
    ...overrides,
};
        const query = Object.fromEntries(
            Object.entries(next).filter(([key, value]) =>
                key === 'q' ? Boolean(value) : value !== 'all',
            ),
        );
        router.get(route('admin.listings'), query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };
 useEffect(() => {
    if (firstRequestRef.current) {
        firstRequestRef.current = false;
        return undefined;
    }
    const timer = window.setTimeout(() => {
        navigateWithFilters();
    }, 150);
    return () => window.clearTimeout(timer);
}, [search, status, location, price, category]);
const submitSearch = (event) => {
    event.preventDefault();
    resultsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    });
};
    const resetFilters = () => {
      setSearch('');
setStatus('all');
setLocation('all');
setPrice('all');
setCategory('all');
setMobileFiltersOpen(false);
        router.get(route('admin.listings'), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };
  const confirmDelete = () => {
    if (!deleteTarget || deleting) {
        return;
    }
    setDeleting(true);
    router.delete(route('listings.destroy', deleteTarget.id), {
        data: {
            from_admin: true,
        },
        preserveScroll: true,
        onSuccess: () => setDeleteTarget(null),
        onFinish: () => setDeleting(false),
    });
};
const updateFilter = (setter) => (value) => {
    setter(value);
};
    const statCards = [
        {
            key: 'active',
            label: t('marketplace.active_listings', {
                defaultValue: 'Active listings',
            }),
            value: stats.active ?? 0,
            note: t('marketplace.available_now', {
                defaultValue: 'Available now',
            }),
            tone: 'emerald',
            icon: TagIcon,
        },
        {
            key: 'new_this_week',
            label: t('marketplace.new_this_week', {
                defaultValue: 'New this week',
            }),
            value: stats.new_this_week ?? 0,
            note: t('marketplace.fresh_listings', {
                defaultValue: 'Fresh listings',
            }),
            tone: 'amber',
            icon: ClockIcon,
        },
        {
            key: 'sold_this_week',
            label: t('marketplace.sold_this_week', {
                defaultValue: 'Sold this week',
            }),
            value: stats.sold_this_week ?? 0,
            note: t('marketplace.completed_sales', {
                defaultValue: 'Completed sales',
            }),
            tone: 'violet',
            icon: ChartIcon,
        },
        {
            key: 'total',
            label: t('marketplace.total_listings', {
                defaultValue: 'Total listings',
            }),
            value: stats.total ?? 0,
            note: t('marketplace.all_time', {
                defaultValue: 'All time',
            }),
            tone: 'rose',
            icon: LayersIcon,
        },
    ];
  const hasFilters = Boolean(
    filters.q ||
        filters.status !== 'all' ||
        filters.location !== 'all' ||
        filters.price !== 'all' ||
        filters.category !== 'all',
);
    return (
        <AuthenticatedLayout hideLocation>
            <Head title={t('listings.page_title')} />
            <FlashMessages />
            <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
                <div className="pointer-events-none absolute -start-24 top-8 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-500/5" />
                <div className="pointer-events-none absolute -end-20 top-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-500/5" />
                <div className="relative mx-auto max-w-7xl px-3 pt-2 sm:px-6 sm:pt-0 lg:px-8">
                    <div className="relative h-[190px] sm:h-[270px] lg:h-[300px]">
                        <div
                            className={`absolute top-1/2 z-10 w-[57%] -translate-y-1/2 sm:w-[52%] lg:max-w-xl ${
                                isArabic ? 'right-0 text-right' : 'left-0 text-left'
                            }`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
                                {t('dashboard.eyebrow')}
                            </p>
                            <h1 className="mt-1 text-[29px] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-4xl lg:text-5xl">
                                {t('listings.page_title')}
                            </h1>
                            <p className="mt-2 text-[10px] leading-[15px] text-slate-600 dark:text-slate-300 sm:mt-3 sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
                                {t('marketplace.description', {
                                    defaultValue:
                                        'Moderate marketplace listings to keep Kitabak safe, trusted, and useful for every reader.',
                                })}
                            </p>
                        </div>
                        <img
                            src="/images/admin/admin-listings-hero-v1.png"
                            alt=""
                            aria-hidden="true"
                            className={`pointer-events-none absolute bottom-0 h-[168px] w-[45%] object-contain object-bottom dark:brightness-90 sm:h-full sm:w-[50%] ${
                                isArabic
                                    ? '-left-1 object-left'
                                    : '-right-1 object-right'
                            }`}
                        />
                    </div>
                    <div className="relative z-20 pb-2.5 sm:pb-5">
                        <AdminTabs active="listings" />
                    </div>
                </div>
            </section>
            <main className="mx-auto max-w-7xl px-3 pb-24 pt-3 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
                <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <article
                                key={card.key}
                                className={`${index > 1 ? 'hidden sm:block' : ''} rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-h-[132px] sm:rounded-2xl sm:p-5`}
                            >
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <span
                                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12 ${toneClasses(card.tone)}`}
                                    >
                                        <Icon />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                                            {card.label}
                                        </p>
                                        <p className="mt-1 text-2xl font-extrabold leading-none tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                            {card.value}
                                        </p>
                                        <p className="mt-2 truncate text-[9px] font-medium text-slate-400 dark:text-slate-500 sm:text-xs">
                                            {card.note}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
                <section className="mt-3 sm:mt-5">
   {/* DESKTOP SEARCH */}
<div className="hidden lg:block">
    <form
        onSubmit={submitSearch}
        className="
            flex h-12 min-w-0 items-center
            overflow-hidden rounded-[18px]
            border border-slate-200
            bg-white p-1 shadow-sm
            transition
            focus-within:border-violet-400
            focus-within:ring-2
            focus-within:ring-violet-200/50
            dark:border-slate-700
            dark:bg-slate-900
            dark:focus-within:border-violet-500
            dark:focus-within:ring-violet-500/20
        "
    >
        <input
            id="admin-listing-search"
            type="search"
            value={search}
            onChange={(event) =>
                setSearch(event.target.value)
            }
            placeholder={t(
                'marketplace.search_placeholder',
                {
                    defaultValue:
                        'Search by title, seller, ISBN, or location...',
                },
            )}
            className="
                h-full min-w-0 flex-1
                border-0 bg-transparent
                px-4 text-sm font-medium
                text-slate-700 outline-none
                placeholder:text-slate-500
                focus:border-0 focus:ring-0
                dark:text-white
                dark:placeholder:text-slate-400
            "
        />
        <button
            type="submit"
            disabled={!search.trim()}
            aria-label={t('listings.search_action')}
            className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-[13px]
                bg-gradient-to-r
                from-indigo-600 to-violet-600
                text-white
                shadow-md shadow-indigo-500/25
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
            "
        >
            <SearchIcon className="text-white" />
        </button>
    </form>
    {/* FILTERS */}
    <div className="mt-2 grid grid-cols-4 gap-2">
        <SelectControl
            value={status}
            onChange={updateFilter(setStatus)}
            ariaLabel={t('marketplace.status', {
                defaultValue: 'Status',
            })}
            placeholder={t(
                'marketplace.all_statuses',
                {
                    defaultValue: 'All statuses',
                },
            )}
            options={[
                {
                    value: 'all',
                    label: t(
                        'marketplace.all_statuses',
                        {
                            defaultValue:
                                'All statuses',
                        },
                    ),
                },
                {
                    value: 'available',
                    label: t(
                        'marketplace.available',
                        {
                            defaultValue:
                                'Available',
                        },
                    ),
                },
                {
                    value: 'sold',
                    label: t(
                        'marketplace.sold',
                        {
                            defaultValue: 'Sold',
                        },
                    ),
                },
                {
                    value: 'reserved',
                    label: t(
                        'marketplace.reserved',
                        {
                            defaultValue:
                                'Reserved',
                        },
                    ),
                },
            ]}
        />
        <SelectControl
            value={location}
            onChange={updateFilter(setLocation)}
            ariaLabel={t(
                'marketplace.location',
                {
                    defaultValue: 'Location',
                },
            )}
            placeholder={t(
                'marketplace.all_locations',
                {
                    defaultValue: 'All locations',
                },
            )}
            options={[
                {
                    value: 'all',
                    label: t(
                        'marketplace.all_locations',
                        {
                            defaultValue:
                                'All locations',
                        },
                    ),
                },
                ...locations.map((item) => ({
                    value: item,
                    label: item,
                })),
            ]}
        />
        <SelectControl
            value={price}
            onChange={updateFilter(setPrice)}
            ariaLabel={t('marketplace.price', {
                defaultValue: 'Price',
            })}
            placeholder={t(
                'marketplace.all_prices',
                {
                    defaultValue: 'All prices',
                },
            )}
            options={[
                {
                    value: 'all',
                    label: t(
                        'marketplace.all_prices',
                        {
                            defaultValue:
                                'All prices',
                        },
                    ),
                },
                {
                    value: 'under_10',
                    label: t(
                        'marketplace.under_10',
                        {
                            defaultValue:
                                'Under $10',
                        },
                    ),
                },
                {
                    value: '10_25',
                    label: t(
                        'marketplace.between_10_25',
                        {
                            defaultValue:
                                '$10 – $25',
                        },
                    ),
                },
                {
                    value: 'over_25',
                    label: t(
                        'marketplace.over_25',
                        {
                            defaultValue:
                                'Over $25',
                        },
                    ),
                },
            ]}
        />
        <SelectControl
            value={category}
            onChange={updateFilter(setCategory)}
            ariaLabel={t('books.category', {
                defaultValue: 'Category',
            })}
            placeholder={t(
                'books.all_categories',
                {
                    defaultValue:
                        'All categories',
                },
            )}
            options={[
                {
                    value: 'all',
                    label: t(
                        'books.all_categories',
                        {
                            defaultValue:
                                'All categories',
                        },
                    ),
                },
                {
                    value: 'school',
                    label: t(
                        'books.category_school',
                        {
                            defaultValue:
                                'School',
                        },
                    ),
                },
                {
                    value: 'university',
                    label: t(
                        'books.category_university',
                        {
                            defaultValue:
                                'University',
                        },
                    ),
                },
                {
                    value: 'novel',
                    label: t(
                        'books.category_novel',
                        {
                            defaultValue: 'Novel',
                        },
                    ),
                },
            ]}
        />
    </div>
</div>
{/* MOBILE SEARCH + FILTER BUTTON */}
<div className="flex items-center gap-2 lg:hidden">
    <form
        onSubmit={submitSearch}
        className="
            flex h-11 min-w-0 flex-1 items-center
            overflow-hidden rounded-xl
            border border-slate-200
            bg-white p-1 shadow-sm
            transition
            focus-within:border-violet-400
            focus-within:ring-2
            focus-within:ring-violet-200/50
            dark:border-slate-700
            dark:bg-slate-900
            dark:focus-within:border-violet-500
            dark:focus-within:ring-violet-500/20
        "
    >
        <input
            type="search"
            value={search}
            onChange={(event) =>
                setSearch(event.target.value)
            }
            placeholder={t(
                'marketplace.search_placeholder',
                {
                    defaultValue: 'Search books...',
                },
            )}
            className="
                h-full min-w-0 flex-1
                border-0 bg-transparent
                px-3 text-sm font-medium
                text-slate-700 outline-none
                placeholder:text-slate-500
                focus:border-0 focus:ring-0
                dark:text-white
                dark:placeholder:text-slate-400
            "
        />
        <button
            type="submit"
            aria-label={t('listings.search_action')}
            className="
                grid h-9 w-10 shrink-0
                place-items-center
                rounded-[10px]
                bg-indigo-600 text-white
                shadow-sm shadow-indigo-600/20
                transition
                hover:bg-indigo-700
                active:scale-95
            "
        >
            <SearchIcon className="text-white" />
        </button>
    </form>
    <button
        type="button"
       onClick={() => {
    if (mobileFiltersOpen) {
        setMobileFiltersOpen(false);
        return;
    }
    setMobileStatus(status);
    setMobileLocation(location);
    setMobilePrice(price);
    setMobileCategory(category);
    setMobileFiltersOpen(true);
}}
        aria-expanded={mobileFiltersOpen}
        className={`
            inline-flex h-11 shrink-0
            items-center gap-1.5
            rounded-xl border
            px-3 text-sm font-bold
            shadow-sm transition
            ${
                mobileFiltersOpen || hasFilters
                    ? `
                        border-indigo-300
                        bg-indigo-50
                        text-indigo-700
                        dark:border-indigo-500/40
                        dark:bg-indigo-500/10
                        dark:text-indigo-300
                    `
                    : `
                        border-slate-200
                        bg-white
                        text-slate-700
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-slate-200
                    `
            }
        `}
    >
        <FilterIcon />
        <span>
            {t('marketplace.filters', {
                defaultValue: 'Filters',
            })}
        </span>
    </button>
</div>
                    {mobileFiltersOpen && (
                        <div
                            dir="ltr"
                            className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden"
                        >
                            <div className="col-start-1 min-w-0">
                                <SelectControl
                                    value={mobileStatus}
                                    onChange={setMobileStatus}
                                    ariaLabel={t('marketplace.status', { defaultValue: 'Status' })}
                                    placeholder={t('marketplace.all_statuses', { defaultValue: 'All statuses' })}
                                    options={[
                                        { value: 'all', label: t('marketplace.all_statuses', { defaultValue: 'All statuses' }) },
                                        { value: 'available', label: t('marketplace.available', { defaultValue: 'Available' }) },
                                        { value: 'sold', label: t('marketplace.sold', { defaultValue: 'Sold' }) },
                                        { value: 'reserved', label: t('marketplace.reserved', { defaultValue: 'Reserved' }) },
                                    ]}
                                />
                            </div>
                            <div className="col-start-2 min-w-0">
                                <SelectControl
                                    value={mobileLocation}
                                    onChange={setMobileLocation}
                                    ariaLabel={t('marketplace.location', { defaultValue: 'Location' })}
                                    placeholder={t('marketplace.all_locations', { defaultValue: 'All locations' })}
                                    options={[
                                        { value: 'all', label: t('marketplace.all_locations', { defaultValue: 'All locations' }) },
                                        ...locations.map((item) => ({ value: item, label: item })),
                                    ]}
                                />
                            </div>
                            <div className="col-start-1 min-w-0">
                                <SelectControl
                                    value={mobilePrice}
                                    onChange={setMobilePrice}
                                    ariaLabel={t('marketplace.price', { defaultValue: 'Price' })}
                                    placeholder={t('marketplace.all_prices', { defaultValue: 'All prices' })}
                                    options={[
                                        { value: 'all', label: t('marketplace.all_prices', { defaultValue: 'All prices' }) },
                                        { value: 'under_10', label: t('marketplace.under_10', { defaultValue: 'Under $10' }) },
                                        { value: '10_25', label: t('marketplace.between_10_25', { defaultValue: '$10 – $25' }) },
                                        { value: 'over_25', label: t('marketplace.over_25', { defaultValue: 'Over $25' }) },
                                    ]}
                                />
                            </div>
                            <div className="col-start-2 min-w-0">
                                <SelectControl
                                    value={mobileCategory}
                                    onChange={setMobileCategory}
                                    ariaLabel={t('books.category', { defaultValue: 'Category' })}
                                    placeholder={t('books.all_categories', { defaultValue: 'All categories' })}
                                    options={[
                                        { value: 'all', label: t('books.all_categories', { defaultValue: 'All categories' }) },
                                        { value: 'school', label: t('books.category_school', { defaultValue: 'School' }) },
                                        { value: 'university', label: t('books.category_university', { defaultValue: 'University' }) },
                                        { value: 'novel', label: t('books.category_novel', { defaultValue: 'Novel' }) },
                                    ]}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileStatus('all');
                                    setMobileLocation('all');
                                    setMobilePrice('all');
                                    setMobileCategory('all');
                                }}
                                className="col-start-1 h-12 rounded-xl border border-indigo-500/25 bg-indigo-50 px-3 text-[11px] font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                            >
                                {t('marketplace.clear_filters', { defaultValue: 'Clear filters' })}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStatus(mobileStatus);
                                    setLocation(mobileLocation);
                                    setPrice(mobilePrice);
                                    setCategory(mobileCategory);
                                    setMobileFiltersOpen(false);
                                    navigateWithFilters({
                                        status: mobileStatus,
                                        location: mobileLocation,
                                        price: mobilePrice,
                                        category: mobileCategory,
                                    });
                                    window.setTimeout(() => {
                                        resultsRef.current?.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'start',
                                        });
                                    }, 150);
                                }}
                                className="col-start-2 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                            >
                                {t('marketplace.apply_filters', { defaultValue: 'Apply filters' })}
                            </button>
                        </div>
                    )}
                 {hasFilters && (
    <div className="mt-1.5 flex justify-end">
        <button
            type="button"
            onClick={resetFilters}
            className="
                text-[11px] font-bold
                text-indigo-600
                transition
                hover:text-indigo-800
                dark:text-indigo-400
                dark:hover:text-indigo-300
                sm:text-xs
            "
        >
            <span className="sm:hidden">
                {t('marketplace.clear', {
                    defaultValue: 'Clear',
                })}
            </span>
            <span className="hidden sm:inline">
                {t('marketplace.clear_filters', {
                    defaultValue: 'Clear filters',
                })}
            </span>
        </button>
    </div>
)}
                </section>
               {listings.data.length ? (
    <section
        ref={resultsRef}
        className="mt-3 scroll-mt-4 sm:mt-4"
    >
                        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
                            <table className="w-full table-fixed text-left rtl:text-right">
                                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                                    <tr>
                                        <th className="w-[26%] px-4 py-3">{t('marketplace.book', { defaultValue: 'Book' })}</th>
                                        <th className="w-[17%] px-4 py-3">{t('marketplace.seller', { defaultValue: 'Seller' })}</th>
                                        <th className="w-[17%] px-4 py-3">{t('marketplace.location', { defaultValue: 'Location' })}</th>
                                        <th className="w-[10%] px-4 py-3">{t('marketplace.price', { defaultValue: 'Price' })}</th>
                                        <th className="w-[12%] px-4 py-3">{t('marketplace.listed_on', { defaultValue: 'Listed on' })}</th>
                                        <th className="w-[10%] px-4 py-3">{t('marketplace.status', { defaultValue: 'Status' })}</th>
                                        <th className="w-[8%] px-4 py-3 text-center">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {listings.data.map((listing) => (
                                        <DesktopListingRow key={listing.id} listing={listing} money={money} dateFormatter={dateFormatter} t={t} onDelete={setDeleteTarget} onImages={setImagesTarget} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid gap-2.5 lg:hidden">
                            {listings.data.map((listing) => (
                                <MobileListingCard key={listing.id} listing={listing} money={money} t={t} onDelete={setDeleteTarget} onImages={setImagesTarget} />
                            ))}
                        </div>
                    </section>
                ) : (
<section
    ref={resultsRef}
    className="mt-4 scroll-mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
>
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><TagIcon /></span>
                        <h2 className="mt-4 text-lg font-extrabold text-slate-950 dark:text-white">{t('listings.empty_title')}</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('listings.empty_text')}</p>
                        {hasFilters && (
                            <button type="button" onClick={resetFilters} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">
                                {t('marketplace.clear_filters', { defaultValue: 'Clear filters' })}
                            </button>
                        )}
                    </section>
                )}
                {listings.links?.length > 3 && (
                    <nav className="mt-6 flex flex-wrap justify-center gap-2" aria-label={t('marketplace.pagination', { defaultValue: 'Pagination' })}>
                        {listings.links.map((link, index) => (
                            <Link key={`${link.label}-${index}`} href={link.url || '#'} preserveScroll className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${link.active ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </nav>
                )}
            </main>
            <BookImagesModal isOpen={Boolean(imagesTarget)} closeModal={() => setImagesTarget(null)} images={imagesTarget?.images ?? []} bookTitle={imagesTarget?.book?.title ?? ''} />
            <DeleteListingModal listing={deleteTarget} deleting={deleting} t={t} onCancel={() => !deleting && setDeleteTarget(null)} onConfirm={confirmDelete} />
        </AuthenticatedLayout>
    );
}
function DesktopListingRow({ listing, money, dateFormatter, t, onDelete, onImages }) {
    const book = listing.book ?? {};
    const title = book.title || t('listings.unknown_book');
    const author = book.author || t('listings.unknown_author');
    const seller = listing.seller?.name || t('marketplace.unknown_seller', { defaultValue: 'Unknown seller' });
    const images = listing.images ?? [];
    return (
        <tr className="group text-xs text-slate-600 transition hover:bg-indigo-50/35 dark:text-slate-300 dark:hover:bg-indigo-500/5">
            <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <BookCoverImage src={listingCover(listing)} alt={title} className="h-14 w-10 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm dark:border-slate-700" fallback={<BookFallback />} />
                    <div className="min-w-0">
                        <p className="truncate font-extrabold text-slate-950 dark:text-white">{title}</p>
                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{author}</p>
                        {images.length > 1 && <button type="button" onClick={() => onImages(listing)} className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{t('listings.photos', { count: images.length })}</button>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{seller.charAt(0).toUpperCase()}</span>
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{seller}</span>
                </div>
            </td>
            <td className="px-4 py-3"><span className="flex min-w-0 items-center gap-1.5"><LocationIcon /><span className="truncate">{listing.location || '—'}</span></span></td>
            <td className="px-4 py-3 font-extrabold text-slate-950 dark:text-white">{money.format(Number(listing.price || 0))}</td>
            <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">{listing.created_at ? dateFormatter.format(new Date(listing.created_at)) : '—'}</td>
            <td className="px-4 py-3"><StatusBadge status={listing.status} t={t} /></td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1.5">
                    {listing.status === 'available' && <Link href={route('listings.show', listing.id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{t('marketplace.view', { defaultValue: 'View' })}</Link>}
                    <button type="button" onClick={() => onDelete(listing)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400" aria-label={t('listings.delete')} title={t('listings.delete')}><TrashIcon /></button>
                </div>
            </td>
        </tr>
    );
}
function MobileListingCard({ listing, money, t, onDelete, onImages }) {
    const book = listing.book ?? {};
    const title = book.title || t('listings.unknown_book');
    const author = book.author || t('listings.unknown_author');
    const seller = listing.seller?.name || t('marketplace.unknown_seller', { defaultValue: 'Unknown seller' });
    const images = listing.images ?? [];
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-3">
                <button type="button" onClick={() => images.length && onImages(listing)} className="relative shrink-0" disabled={!images.length}>
                    <BookCoverImage src={listingCover(listing)} alt={title} className="h-[116px] w-[78px] rounded-xl border border-slate-200 object-cover shadow-sm dark:border-slate-700" fallback={<BookFallback large />} />
                    {images.length > 1 && <span className="absolute -end-1.5 -top-1.5 rounded-full border-2 border-white bg-slate-950 px-1.5 py-0.5 text-[9px] font-extrabold text-white dark:border-slate-900">{images.length}</span>}
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-950 dark:text-white">{title}</h2>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{author}</p>
                        </div>
                        <StatusBadge status={listing.status} t={t} />
                    </div>
                    <div className="mt-2 space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <p className="flex min-w-0 items-center gap-1.5"><UserIcon /><span className="truncate">{seller}</span></p>
                        <p className="flex min-w-0 items-center gap-1.5"><LocationIcon /><span className="truncate">{listing.location || '—'}</span></p>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                        <strong className="text-sm text-indigo-700 dark:text-indigo-300">{money.format(Number(listing.price || 0))}</strong>
                        <div className="flex items-center gap-1.5">
                            {listing.status === 'available' && <Link href={route('listings.show', listing.id)} className="rounded-lg bg-indigo-50 px-3 py-2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{t('marketplace.view_details', { defaultValue: 'View details' })}</Link>}
                            <button type="button" onClick={() => onDelete(listing)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-400" aria-label={t('listings.delete')}><TrashIcon /></button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
function DeleteListingModal({ listing, deleting, t, onCancel, onConfirm }) {
    if (!listing) return null;
    const title = listing.book?.title || t('listings.unknown_book');
    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
            <section role="dialog" aria-modal="true" aria-labelledby="delete-listing-title" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><TrashIcon className="h-5 w-5" /></span>
                <h2 id="delete-listing-title" className="mt-4 text-xl font-extrabold text-slate-950 dark:text-white">{t('marketplace.remove_listing', { defaultValue: 'Remove listing?' })}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('listings.confirm_delete', { title })}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onCancel} disabled={deleting} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{t('marketplace.cancel', { defaultValue: 'Cancel' })}</button>
                    <button type="button" onClick={onConfirm} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{deleting && <SpinnerIcon />}{t('marketplace.remove', { defaultValue: 'Remove' })}</button>
                </div>
            </section>
        </div>
    );
}
function SelectControl({
    value,
    onChange,
    options,
    placeholder,
    ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener(
            'mousedown',
            handleOutsideClick,
        );
        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick,
            );
        };
    }, []);
    const selected = options.find(
        (option) => option.value === value,
    );
    return (
        <div
            ref={dropdownRef}
            className="relative w-full min-w-0"
        >
            <button
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={() =>
                    setOpen((current) => !current)
                }
                className="
                    flex h-11 w-full min-w-0
                    items-center justify-between gap-3
                    rounded-xl border border-slate-200
                    bg-white px-4
                    text-xs font-semibold text-slate-700
                    shadow-sm transition
                    hover:bg-slate-50
                    focus:border-indigo-400
                    focus:outline-none
                    focus:ring-2 focus:ring-indigo-100
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-slate-100
                    dark:hover:bg-slate-900
                    dark:focus:border-indigo-500
                    dark:focus:ring-indigo-500/20
                    sm:h-12 sm:text-sm
                "
            >
                <span className="truncate">
                    {selected?.label ?? placeholder}
                </span>
                <span
                    className={`
                        shrink-0 text-slate-400
                        transition-transform duration-200
                        ${open ? 'rotate-180' : ''}
                    `}
                >
                    <ChevronIcon />
                </span>
            </button>
            {open && (
                <div
                    className="
                        absolute start-0 top-full z-50
                        mt-2 max-h-[360px] min-w-full
                        overflow-y-auto
                        rounded-2xl border border-slate-200
                        bg-white p-1.5
                        shadow-xl shadow-slate-900/10
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:shadow-black/30
                    "
                >
                    {options.map((option) => {
                        const active =
                            option.value === value;
                        return (
                            <button
                                key={
                                    option.value ||
                                    '__all'
                                }
                                type="button"
                                onClick={() => {
                                    onChange(
                                        option.value,
                                    );
                                    setOpen(false);
                                }}
                                className={`
                                    flex w-full items-center
                                    justify-between gap-5
                                    rounded-xl px-3 py-2.5
                                    text-start text-sm
                                    font-semibold transition
                                    ${
                                        active
                                            ? `
                                                bg-indigo-50
                                                text-indigo-700
                                                dark:bg-indigo-500/15
                                                dark:text-indigo-300
                                            `
                                            : `
                                                text-slate-700
                                                hover:bg-slate-100
                                                dark:text-slate-200
                                                dark:hover:bg-slate-800
                                            `
                                    }
                                `}
                            >
                                <span className="whitespace-nowrap">
                                    {option.label}
                                </span>
                                {active && (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        className="h-4 w-4 shrink-0"
                                        aria-hidden="true"
                                    >
                                        <path d="m5 12 4 4L19 6" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
function ChevronIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
            aria-hidden="true"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
function StatusBadge({ status = 'available', t }) {
    const label = t(`marketplace.${status}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) });
    return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset sm:px-2.5 sm:text-[10px] ${statusStyles[status] || statusStyles.available}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}
function listingCover(listing) {
    return resolveBookImageUrl(listing.photo_url || listing.book?.cover_image_url || listing.images?.[0]?.image_path || listing.book?.images?.[0]?.image_path);
}
function toneClasses(tone) {
    return {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
        amber: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
        rose: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300',
    }[tone];
}
function BookFallback({ large = false }) {
    return <span className={`grid place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 ${large ? 'h-[116px] w-[78px]' : 'h-14 w-10'}`}><BookIcon /></span>;
}
function SearchIcon({ className = 'text-slate-400' }) {
    return <svg className={`h-4 w-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
function FilterIcon() {
    return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
}
function TagIcon() {
    return <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13.8V5h8.8L20 12.2a1.1 1.1 0 0 1 0 1.6Z" /><circle cx="8.5" cy="9" r="1.2" /></svg>;
}
function ClockIcon() {
    return <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function ChartIcon() {
    return <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19V8" /></svg>;
}
function LayersIcon() {
    return <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></svg>;
}
function LocationIcon() {
    return <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}
function UserIcon() {
    return <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" /></svg>;
}
function TrashIcon({ className = 'h-4 w-4' }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></svg>;
}
function SpinnerIcon() {
    return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function BookIcon() {
    return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
}
