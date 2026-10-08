import AdminTabs from '@/Components/AdminTabs';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SearchIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
    </svg>
);

const PendingIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

const ResolvedIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
    </svg>
);

const DismissedIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
);

const TotalIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <path d="M5 21V4" />
        <path d="M5 4h11l-1.5 4L16 12H5" />
    </svg>
);

const FilterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
);
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

        document.addEventListener('mousedown', handleOutsideClick);

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
                onClick={() => setOpen((current) => !current)}
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
                        const active = option.value === value;

                        return (
                            <button
                                key={option.value || '__all'}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
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

export default function Reports({
    reports,
    stats = {},
    filters = {},
    reasonOptions = [],
}) {
    const { t, i18n } = useTranslation('admin');
    const { patch, delete: destroy, processing } = useForm();

    const isArabic = i18n.dir() === 'rtl';

    const [search, setSearch] = useState(filters.q || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [type, setType] = useState(filters.type || 'all');
    const [reason, setReason] = useState(filters.reason || 'all');
    const [sort, setSort] = useState(filters.sort || 'newest');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const firstRequestRef = useRef(true);

    const navigateWithFilters = (overrides = {}) => {
        const next = {
            q: search.trim(),
            status,
            type,
            reason,
            sort,
            ...overrides,
        };

        const query = Object.fromEntries(
            Object.entries(next).filter(([key, value]) => {
                if (key === 'q') {
                    return Boolean(value);
                }

                if (key === 'sort') {
                    return value !== 'newest';
                }

                return value !== 'all';
            }),
        );

        router.get(route('admin.reports'), query, {
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
    }, 300);

    return () => window.clearTimeout(timer);
}, [search]);

useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    if (!desktopQuery.matches) {
        return undefined;
    }

    const timer = window.setTimeout(() => {
        navigateWithFilters();
    }, 200);

    return () => window.clearTimeout(timer);
}, [status, type, reason, sort]);

    const resetFilters = () => {
        setSearch('');
        setStatus('all');
        setType('all');
        setReason('all');
        setSort('newest');

        router.get(
            route('admin.reports'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const applyMobileFilters = () => {
    navigateWithFilters();
    setShowMobileFilters(false);
};

    const hasFilters =
        Boolean(filters.q) ||
        (filters.status && filters.status !== 'all') ||
        (filters.type && filters.type !== 'all') ||
        (filters.reason && filters.reason !== 'all') ||
        (filters.sort && filters.sort !== 'newest');

    const resolve = (id) =>
        patch(route('admin.reports.resolve', id), {
            preserveScroll: true,
        });

    const dismiss = (id) =>
        patch(route('admin.reports.dismiss', id), {
            preserveScroll: true,
        });

    const deletePost = (post) => {
        if (
            !confirm(
                t('reports.confirm_delete_post', {
                    title: post.title,
                }),
            )
        ) {
            return;
        }

        destroy(route('posts.destroy', post.id), {
            preserveScroll: true,
        });
    };

    const statusBadge = (value) => {
        const classes = {
            pending:
                'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
            resolved:
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
            dismissed:
                'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        };

        return (
            <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    classes[value] || ''
                }`}
            >
                {t(`reports.status.${value}`, {
                    defaultValue: value,
                })}
            </span>
        );
    };

    const targetType = (report) => {
        if (report.listing_id) return 'listing';
        if (report.reported_user_id) return 'user';
        return 'post';
    };

    const targetBadge = (report) => {
        const target = targetType(report);

        const classes = {
            listing:
                'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
            user: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
            post: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
        };

        return (
            <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes[target]}`}
            >
                {t(`reports.types.${target}`, {
                    defaultValue: target,
                })}
            </span>
        );
    };

    const reasonLabel = (value) =>
        t(`reports.reasons.${value}`, {
            defaultValue: value?.replaceAll('_', ' ') || '—',
        });

    const renderTarget = (report) => {
        if (report.listing_id) {
            if (!report.listing) {
                return (
                    <p className="text-sm italic text-slate-400">
                        {t('reports.listing_deleted', {
                            defaultValue: 'This listing is no longer available.',
                        })}
                    </p>
                );
            }

            return (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {t('reports.reported_listing', {
                            defaultValue: 'Reported listing',
                        })}
                    </p>

                   <Link
    href={`${route(
        'listings.show',
        report.listing.id,
    )}?from_reports=1`}
    className="mt-1 inline-block font-bold text-indigo-600 hover:underline dark:text-indigo-300"
>
                        {report.listing.book?.title ||
                            t('reports.unknown_book', {
                                defaultValue: 'Unknown book',
                            })}
                    </Link>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {report.listing.seller?.name && (
                            <span>
                                {t('reports.seller', {
                                    defaultValue: 'Seller',
                                })}
                                : {report.listing.seller.name}
                            </span>
                        )}

                        {report.listing.location && (
                            <span>
                                {t('reports.location', {
                                    defaultValue: 'Location',
                                })}
                                : {report.listing.location}
                            </span>
                        )}

                        <span>
                            {t('reports.listing_status', {
                                defaultValue: 'Listing status',
                            })}
                            : {report.listing.status}
                        </span>
                    </div>
                </div>
            );
        }

        if (report.reported_user_id) {
            if (!report.reported_user) {
                return (
                    <p className="text-sm italic text-slate-400">
                        {t('reports.user_deleted', {
                            defaultValue: 'This user is no longer available.',
                        })}
                    </p>
                );
            }

            return (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {t('reports.reported_user', {
                            defaultValue: 'Reported user',
                        })}
                    </p>

                 <Link
    href={route(
        'sellers.books',
        report.reported_user.id,
    )}
    className="mt-1 inline-block font-bold text-violet-600 hover:underline dark:text-violet-300"
>
    {report.reported_user.name}
</Link>

                    {report.reported_user.email && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {report.reported_user.email}
                        </p>
                    )}
                </div>
            );
        }

        if (report.post) {
            return (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {t('reports.reported_post', {
                            defaultValue: 'Reported post',
                        })}
                    </p>

                    <Link
                        href={route('posts.show', report.post.id)}
                        className="mt-1 inline-block font-bold text-sky-600 hover:underline dark:text-sky-300"
                    >
                        {report.post.title}
                    </Link>

                    {report.post.user && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {report.post.user.name}
                        </p>
                    )}
                </div>
            );
        }

        return (
            <p className="text-sm italic text-slate-400">
                {t('reports.post_deleted', {
                    defaultValue: 'This post is no longer available.',
                })}
            </p>
        );
    };

    const statCards = [
        {
            key: 'pending',
            label: t('reports.stats.pending', {
                defaultValue: 'Pending',
            }),
            value: stats.pending ?? 0,
            note: t('reports.stats.pending_note', {
                defaultValue: 'Needs review',
            }),
            icon: PendingIcon,
            iconClass:
                'bg-amber-500/10 text-amber-600 dark:text-amber-300',
        },
        {
            key: 'resolved',
            label: t('reports.stats.resolved', {
                defaultValue: 'Resolved',
            }),
            value: stats.resolved ?? 0,
            note: t('reports.stats.resolved_note', {
                defaultValue: 'Reviewed and resolved',
            }),
            icon: ResolvedIcon,
            iconClass:
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
        },
        {
            key: 'dismissed',
            label: t('reports.stats.dismissed', {
                defaultValue: 'Dismissed',
            }),
            value: stats.dismissed ?? 0,
            note: t('reports.stats.dismissed_note', {
                defaultValue: 'No action required',
            }),
            icon: DismissedIcon,
            iconClass:
                'bg-violet-500/10 text-violet-600 dark:text-violet-300',
        },
        {
            key: 'total',
            label: t('reports.stats.total', {
                defaultValue: 'Total reports',
            }),
            value: stats.total ?? 0,
            note: t('reports.stats.total_note', {
                defaultValue: 'All time',
            }),
            icon: TotalIcon,
            iconClass:
                'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
        },
    ];

    return (
        <AuthenticatedLayout hideLocation>
            <Head title={t('reports.title', { defaultValue: 'Reports' })} />
            <FlashMessages />

            <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
                <div className="pointer-events-none absolute -start-24 top-8 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-500/5" />
                <div className="pointer-events-none absolute -end-20 top-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-500/5" />

                <div className="relative mx-auto max-w-7xl px-3 pt-2 sm:px-6 sm:pt-0 lg:px-8">
                    <div className="relative h-[190px] sm:h-[270px] lg:h-[300px]">
                        <div
                            className={`absolute top-1/2 z-10 w-[57%] -translate-y-1/2 sm:w-[52%] lg:max-w-xl ${
                                isArabic
                                    ? 'right-0 text-right'
                                    : 'left-0 text-left'
                            }`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
                                {t('dashboard.eyebrow', {
                                    defaultValue: 'Administration',
                                })}
                            </p>

                            <h1 className="mt-1 text-[29px] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-4xl lg:text-5xl">
                                {t('reports.title', {
                                    defaultValue: 'Reports',
                                })}
                            </h1>

                            <p className="mt-2 text-[10px] leading-[15px] text-slate-600 dark:text-slate-300 sm:mt-3 sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
                                {t('reports.description', {
                                    defaultValue:
                                        'Review user reports, investigate reported listings and accounts, and keep the Kitabak marketplace safe.',
                                })}
                            </p>
                        </div>

<div
    className={`absolute top-[58%] w-[43%] -translate-y-1/2 sm:top-1/2 sm:w-[44%] lg:w-[46%] ${
        isArabic ? 'left-0' : 'right-0'
    }`}
>
    <div className="relative mx-auto flex aspect-[1.35/1] max-h-[250px] max-w-[430px] items-center justify-center">
        <img
            src="/images/admin/reports-hero.png"
            alt=""
            className="h-full w-full object-contain"
            draggable="false"
        />
    </div>
</div>
                    </div>

                    <div className="relative z-20 -mb-px pb-5 sm:pb-6">
                        <AdminTabs active="reports" />
                    </div>
                </div>
            </section>

            <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.key}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                                            {card.label}
                                        </p>

                                        <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                                            {card.value}
                                        </p>
                                    </div>

                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                                    >
                                        <Icon />
                                    </div>
                                </div>

                                <p className="mt-3 text-[11px] font-medium text-slate-400 sm:text-xs">
                                    {card.note}
                                </p>
                            </div>
                        );
                    })}
                </section>

              {/* Mobile search + Filters button */}
<section className="mt-5 lg:hidden">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="relative min-w-0">
            <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('reports.filters.search_placeholder', {
                    defaultValue: 'Search reports...',
                })}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pe-12 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <div className="pointer-events-none absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <SearchIcon />
            </div>
        </div>

        <button
            type="button"
            onClick={() => setShowMobileFilters((value) => !value)}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                showMobileFilters || hasFilters
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                    : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
            }`}
        >
            <FilterIcon />

            <span>
                {t('reports.filters.title', {
                    defaultValue: 'Filters',
                })}
            </span>
        </button>
    </div>

    {showMobileFilters && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2">
            <SelectControl
    value={status}
    onChange={setStatus}
    ariaLabel={t('reports.filters.all_statuses', {
        defaultValue: 'All statuses',
    })}
    placeholder={t('reports.filters.all_statuses', {
        defaultValue: 'All statuses',
    })}
    options={[
        {
            value: 'all',
            label: t('reports.filters.all_statuses', {
                defaultValue: 'All statuses',
            }),
        },
        {
            value: 'pending',
            label: t('reports.status.pending', {
                defaultValue: 'Pending',
            }),
        },
        {
            value: 'resolved',
            label: t('reports.status.resolved', {
                defaultValue: 'Resolved',
            }),
        },
        {
            value: 'dismissed',
            label: t('reports.status.dismissed', {
                defaultValue: 'Dismissed',
            }),
        },
    ]}
/>

<SelectControl
    value={type}
    onChange={setType}
    ariaLabel={t('reports.filters.all_types', {
        defaultValue: 'All types',
    })}
    placeholder={t('reports.filters.all_types', {
        defaultValue: 'All types',
    })}
    options={[
        {
            value: 'all',
            label: t('reports.filters.all_types', {
                defaultValue: 'All types',
            }),
        },
        {
            value: 'listing',
            label: t('reports.types.listing', {
                defaultValue: 'Listing',
            }),
        },
        {
            value: 'user',
            label: t('reports.types.user', {
                defaultValue: 'User',
            }),
        },
        {
            value: 'post',
            label: t('reports.types.post', {
                defaultValue: 'Post',
            }),
        },
    ]}
/>

<SelectControl
    value={reason}
    onChange={setReason}
    ariaLabel={t('reports.filters.all_reasons', {
        defaultValue: 'All reasons',
    })}
    placeholder={t('reports.filters.all_reasons', {
        defaultValue: 'All reasons',
    })}
    options={[
        {
            value: 'all',
            label: t('reports.filters.all_reasons', {
                defaultValue: 'All reasons',
            }),
        },
        ...reasonOptions.map((option) => ({
            value: option,
            label: reasonLabel(option),
        })),
    ]}
/>

<SelectControl
    value={sort}
    onChange={setSort}
    ariaLabel={t('reports.filters.newest', {
        defaultValue: 'Newest first',
    })}
    placeholder={t('reports.filters.newest', {
        defaultValue: 'Newest first',
    })}
    options={[
        {
            value: 'newest',
            label: t('reports.filters.newest', {
                defaultValue: 'Newest first',
            }),
        },
        {
            value: 'oldest',
            label: t('reports.filters.oldest', {
                defaultValue: 'Oldest first',
            }),
        },
    ]}
/>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={resetFilters}
                    className="h-12 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-500/15 dark:text-indigo-300"
                >
                    {t('reports.filters.clear', {
                        defaultValue: 'Clear filters',
                    })}
                </button>

                <button
                    type="button"
                    onClick={applyMobileFilters}
                    className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                >
                    {t('reports.filters.apply', {
                        defaultValue: 'Apply filters',
                    })}
                </button>
            </div>
        </div>
    )}
</section>

{/* Desktop filters */}
<section className="mt-5 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
    <div className="grid gap-2 lg:grid-cols-[minmax(260px,1.8fr)_repeat(4,minmax(135px,1fr))]">
        <div className="relative">
            <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('reports.filters.search_placeholder', {
                    defaultValue: 'Search reports...',
                })}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pe-12 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <div className="pointer-events-none absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <SearchIcon />
            </div>
        </div>

        <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <option value="all">
                {t('reports.filters.all_statuses', {
                    defaultValue: 'All statuses',
                })}
            </option>
            <option value="pending">
                {t('reports.status.pending', {
                    defaultValue: 'Pending',
                })}
            </option>
            <option value="resolved">
                {t('reports.status.resolved', {
                    defaultValue: 'Resolved',
                })}
            </option>
            <option value="dismissed">
                {t('reports.status.dismissed', {
                    defaultValue: 'Dismissed',
                })}
            </option>
        </select>

        <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <option value="all">
                {t('reports.filters.all_types', {
                    defaultValue: 'All types',
                })}
            </option>
            <option value="listing">
                {t('reports.types.listing', {
                    defaultValue: 'Listing',
                })}
            </option>
            <option value="user">
                {t('reports.types.user', {
                    defaultValue: 'User',
                })}
            </option>
            <option value="post">
                {t('reports.types.post', {
                    defaultValue: 'Post',
                })}
            </option>
        </select>

        <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <option value="all">
                {t('reports.filters.all_reasons', {
                    defaultValue: 'All reasons',
                })}
            </option>

            {reasonOptions.map((option) => (
                <option key={option} value={option}>
                    {reasonLabel(option)}
                </option>
            ))}
        </select>

        <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <option value="newest">
                {t('reports.filters.newest', {
                    defaultValue: 'Newest first',
                })}
            </option>
            <option value="oldest">
                {t('reports.filters.oldest', {
                    defaultValue: 'Oldest first',
                })}
            </option>
        </select>
    </div>

    {hasFilters && (
        <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-300"
        >
            {t('reports.filters.clear', {
                defaultValue: 'Clear filters',
            })}
        </button>
    )}
</section>

                <section className="mt-5">
                    {reports.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                <TotalIcon />
                            </div>

                            <h2 className="mt-4 font-bold text-slate-900 dark:text-white">
                                {t('reports.empty', {
                                    defaultValue: 'No reports found.',
                                })}
                            </h2>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {reports.data.map((report) => (
                                <li
                                    key={report.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40 sm:p-5"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {statusBadge(report.status)}
                                                {targetBadge(report)}

                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(
                                                        report.created_at,
                                                    ).toLocaleString(
                                                        i18n.language,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
                                                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                        {t(
                                                            'reports.reported_by',
                                                            {
                                                                defaultValue:
                                                                    'Reported by',
                                                            },
                                                        )}
                                                    </p>

                                                    <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                                        {report.user?.name ||
                                                            '—'}
                                                    </p>

                                                    {report.user?.email && (
                                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                            {
                                                                report.user
                                                                    .email
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                                                    {renderTarget(report)}
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                        {t(
                                                            'reports.reason',
                                                            {
                                                                defaultValue:
                                                                    'Reason',
                                                            },
                                                        )}
                                                    </p>

                                                    <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                        {reasonLabel(
                                                            report.reason,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                        {t(
                                                            'reports.details',
                                                            {
                                                                defaultValue:
                                                                    'Additional details',
                                                            },
                                                        )}
                                                    </p>

                                                    <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700 dark:text-slate-200">
                                                        {report.details?.trim() ||
                                                            '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2 lg:w-32 lg:flex-col">
                                            {report.status === 'pending' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            resolve(report.id)
                                                        }
                                                        disabled={processing}
                                                        className="min-h-10 flex-1 rounded-xl border border-emerald-300 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                                    >
                                                        {t(
                                                            'reports.resolve',
                                                            {
                                                                defaultValue:
                                                                    'Resolve',
                                                            },
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            dismiss(report.id)
                                                        }
                                                        disabled={processing}
                                                        className="min-h-10 flex-1 rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    >
                                                        {t(
                                                            'reports.dismiss',
                                                            {
                                                                defaultValue:
                                                                    'Dismiss',
                                                            },
                                                        )}
                                                    </button>
                                                </>
                                            )}

                                            {report.post && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deletePost(report.post)
                                                    }
                                                    disabled={processing}
                                                    className="min-h-10 flex-1 rounded-xl border border-red-300 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-500/10"
                                                >
                                                    {t(
                                                        'reports.delete_post',
                                                        {
                                                            defaultValue:
                                                                'Delete post',
                                                        },
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {reports.links?.length > 3 && (
                        <nav className="mt-6 flex flex-wrap justify-center gap-1">
                            {reports.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    preserveScroll
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg px-3 py-1.5 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                              : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                />
                            ))}
                        </nav>
                    )}
                </section>
            </main>
        </AuthenticatedLayout>
    );
}