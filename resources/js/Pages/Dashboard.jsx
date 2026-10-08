import BookCoverImage, {
    resolveBookImageUrl,
} from '@/Components/BookCoverImage';
import BookIsbnScanner from '@/Components/BookIsbnScanner';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PhotoViewer from '@/Components/PhotoViewer';
import {
    getSchoolListFiles,
    removeSchoolListFile,
    saveSchoolListFile,
} from '@/Utils/schoolListStorage';
import FlashMessages from '@/Components/FlashMessages';
import { useImageCropper } from '@/Components/ImageCropDialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import axios from 'axios';

import { useTranslation } from 'react-i18next';
import { prepareDocumentForAi } from '@/Utils/documentTextExtractor';

const paths = {
    search:
        'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    add: 'M12 5v14M5 12h14',
    book:
        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
    list:
        'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
};

const emptySearchResult = {
    status: 'idle',
    query: '',
    books: [],
    total: 0,
    page: 1,
    hasMore: false,
};
const schoolListResultsStorageKey =
    'kitabak_school_list_results';
const searchStateStorageKey =
    'kitabak_home_search_state';

export default function Dashboard({
    recentBooks = [],
    favoriteListingIds = [],
}) {
    const { t, i18n } = useTranslation('dashboard');
    const { t: tCommon } = useTranslation('common');
    const user = usePage().props.auth?.user;
    const isAdmin =
    user?.roles?.includes?.('admin') ?? false;

    const [search, setSearch] = useState(() => {
    try {
        const saved = window.sessionStorage.getItem(
            searchStateStorageKey,
        );

        if (!saved) {
            return '';
        }

        return JSON.parse(saved)?.search ?? '';
    } catch {
        return '';
    }
});
const [searchResult, setSearchResult] = useState(() => {
    try {
        const schoolListSaved =
            window.sessionStorage.getItem(
                schoolListResultsStorageKey,
            );

        if (schoolListSaved) {
            const parsed = JSON.parse(schoolListSaved);

            if (parsed?.isSchoolList) {
                return parsed;
            }
        }

        const searchSaved =
            window.sessionStorage.getItem(
                searchStateStorageKey,
            );

        if (searchSaved) {
            const parsed = JSON.parse(searchSaved);

            if (parsed?.result) {
                return parsed.result;
            }
        }

        return emptySearchResult;
    } catch {
        return emptySearchResult;
    }
});
    const [scan, setScan] = useState({
        status: 'idle',
        isbn: '',
        book: null,
    });
    const [schoolListAnalyzing, setSchoolListAnalyzing] =
        useState(false);

        const [categoryFilter, setCategoryFilter] = useState('');
const [priceFilter, setPriceFilter] = useState('');
const [locationFilter, setLocationFilter] = useState('');
const [availableLocations, setAvailableLocations] = useState([]);

        const [searchHelperOpen, setSearchHelperOpen] =
    useState(false);

const searchHelperRef = useRef(null);
const searchResultsRef = useRef(null);
const searchHelperBooks = (() => {
    const query = search
        .trim()
        .toLocaleLowerCase(i18n.language);

    if (!query) {
        return [];
    }

    const seenTitles = new Set();

    return recentBooks.filter((item) => {
        const book = item.book ?? item;

        const title = String(book.title ?? '').trim();

        if (!title) {
            return false;
        }

        const normalizedTitle =
            title.toLocaleLowerCase(i18n.language);

        // Only titles matching what the user typed.
        if (!normalizedTitle.includes(query)) {
            return false;
        }

        // Never show the same title twice.
        if (seenTitles.has(normalizedTitle)) {
            return false;
        }

        seenTitles.add(normalizedTitle);

        return true;
    });
})();

   const lookupController = useRef(null);
const searchController = useRef(null);
const analysisLockRef = useRef(null);
const previouslyFocusedElement = useRef(null);
const restoredSearchRef = useRef(true);

useEffect(() => {
    let active = true;

    axios
        .get(route('books.search'), {
            params: {
                search: '',
                page: 1,
            },
        })
        .then(({ data }) => {
            if (active) {
                setAvailableLocations(
                    data.locations ?? [],
                );
            }
        })
        .catch(() => {
            // Keep Home working if locations cannot load.
        });

    return () => {
        active = false;
    };
}, []);

useEffect(() => {
    const handleClickOutsideSearch = (event) => {
        if (
            searchHelperRef.current &&
            !searchHelperRef.current.contains(event.target)
        ) {
            setSearchHelperOpen(false);
        }
    };

    document.addEventListener(
        'mousedown',
        handleClickOutsideSearch,
    );

    document.addEventListener(
        'touchstart',
        handleClickOutsideSearch,
    );

    return () => {
        document.removeEventListener(
            'mousedown',
            handleClickOutsideSearch,
        );

        document.removeEventListener(
            'touchstart',
            handleClickOutsideSearch,
        );
    };
}, []);

    const money = new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
    });
const performSearch = async (query = '') => {
    searchController.current?.abort();

    const controller = new AbortController();
    searchController.current = controller;

    try {
        const { data } = await axios.get(
            route('books.search'),
            {
                params: {
                    search: query,
                    category: categoryFilter || undefined,
                    price: priceFilter || undefined,
                    location: locationFilter || undefined,
                    page: 1,
                },
                signal: controller.signal,
            },
        );

        const result = {
            status: 'ready',
            query: data.query ?? query,
            books: data.books ?? [],
            total: data.count ?? 0,
            page: data.page ?? 1,
            hasMore: Boolean(data.has_more),
        };

        setSearchResult(result);
        setAvailableLocations(data.locations ?? []);

        try {
            window.sessionStorage.removeItem(
                schoolListResultsStorageKey,
            );

            window.sessionStorage.setItem(
                searchStateStorageKey,
                JSON.stringify({
                    search: query,
                    result,
                }),
            );
        } catch {
            // Keep search working if storage is unavailable.
        }
    } catch (error) {
        if (error.code !== 'ERR_CANCELED') {
            setSearchResult({
                status: 'error',
                query,
                books: [],
                total: 0,
                page: 1,
                hasMore: false,
            });
        }
    }
};

useEffect(() => {
    const query = search.trim();

    const hasFilters =
        categoryFilter !== '' ||
        priceFilter !== '' ||
        locationFilter !== '';

    searchController.current?.abort();

    if (!query && !hasFilters) {
        try {
            window.sessionStorage.removeItem(
                searchStateStorageKey,
            );
        } catch {
            // Ignore storage errors.
        }

        setSearchResult((current) =>
            current.isSchoolList
                ? current
                : emptySearchResult,
        );

        return undefined;
    }

    setSearchResult({
        status: 'loading',
        query,
        books: [],
        total: 0,
        page: 1,
        hasMore: false,
    });

    const timer = window.setTimeout(() => {
        void performSearch(query);
    }, 350);

    return () => window.clearTimeout(timer);
}, [
    search,
    categoryFilter,
    priceFilter,
    locationFilter,
]);

    useEffect(() => {
        return () => {
            searchController.current?.abort();
            lookupController.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!schoolListAnalyzing) {
            return undefined;
        }

        previouslyFocusedElement.current =
            document.activeElement;

        const previousOverflow =
            document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusLock = () => {
            analysisLockRef.current?.focus({
                preventScroll: true,
            });
        };
        const animationFrame =
            window.requestAnimationFrame(focusLock);
        const keepFocusInsideLock = (event) => {
            if (
                analysisLockRef.current &&
                !analysisLockRef.current.contains(event.target)
            ) {
                focusLock();
            }
        };

        document.addEventListener(
            'focusin',
            keepFocusInsideLock,
            true,
        );

        return () => {
            window.cancelAnimationFrame(animationFrame);
            document.removeEventListener(
                'focusin',
                keepFocusInsideLock,
                true,
            );
            document.body.style.overflow = previousOverflow;
            previouslyFocusedElement.current?.focus?.({
                preventScroll: true,
            });
        };
    }, [schoolListAnalyzing]);

    const scrollToCatalogResults = () => {
    window.setTimeout(() => {
        document
            .getElementById('home-results-heading')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }, 150);
};

   const submitSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (query) {
        void performSearch(query);
        scrollToCatalogResults();
    }
};
    const loadMoreSearchResults = async () => {
        if (
            searchResult.status !== 'ready' ||
            !searchResult.hasMore
        ) {
            return;
        }

        const nextPage = searchResult.page + 1;

        setSearchResult((current) => ({
            ...current,
            status: 'loading_more',
        }));

        try {
            const { data } = await axios.get(
                route('books.search'),
                {
                  params: {
    search: searchResult.query ?? '',
    category: categoryFilter || undefined,
    price: priceFilter || undefined,
    location: locationFilter || undefined,
    page: nextPage,
},
                },
            );

            setSearchResult((current) => ({
                ...current,
                status: 'ready',
                books: [
                    ...current.books,
                    ...(data.books ?? []),
                ],
                total: data.count ?? current.total,
                page: data.page ?? nextPage,
                hasMore: Boolean(data.has_more),
            }));
        } catch {
            setSearchResult((current) => ({
                ...current,
                status: 'ready',
            }));
        }
    };

    const lookupScannedBook = async (identifier) => {
        if (!user) {
            return;
        }

        lookupController.current?.abort();

        const controller = new AbortController();
        lookupController.current = controller;

        setScan({
            status: 'loading',
            isbn: identifier.normalizedValue,
            book: null,
        });

        try {
            const { data } = await axios.get(
                route('books.lookup-isbn'),
                {
                    params: {
                        identifier: identifier.rawValue,
                        barcode_format: identifier.barcodeFormat,
                    },
                    signal: controller.signal,
                },
            );

            setScan({
                status: data.found
                    ? 'found'
                    : 'not_found',
                isbn: data.identifier.normalized_value,
                book: data.book,
            });
        } catch (error) {
            if (error.code !== 'ERR_CANCELED') {
                setScan({
                    status: 'error',
                    isbn: identifier.normalizedValue,
                    book: null,
                });
            }
        }
    };

const displaySchoolListResults = ({
    foundBooks = [],
    notFoundBooks = [],
}) => {
    const result = {
        status: 'ready',
        query: t('school_list.results_query', {
            defaultValue: 'your school list',
        }),
        books: foundBooks,
        notFoundBooks,
        total: foundBooks.length,
        page: 1,
        hasMore: false,
        isSchoolList: true,
    };

    setSearchResult(result);

    try {
        window.sessionStorage.setItem(
            schoolListResultsStorageKey,
            JSON.stringify(result),
        );
    } catch {
        // Keep the results on screen even if storage is unavailable.
    }

    window.setTimeout(() => {
        document
            .getElementById('home-results-heading')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }, 150);
};

const updateSchoolListNotFoundBook = (index, updatedBook) => {
    setSearchResult((current) => {
        if (!current?.isSchoolList) {
            return current;
        }

        const nextNotFoundBooks = [
            ...(current.notFoundBooks ?? []),
        ];

        if (!nextNotFoundBooks[index]) {
            return current;
        }

        nextNotFoundBooks[index] = {
            ...nextNotFoundBooks[index],
            ...updatedBook,
        };

        const nextResult = {
            ...current,
            notFoundBooks: nextNotFoundBooks,
        };

        try {
            window.sessionStorage.setItem(
                schoolListResultsStorageKey,
                JSON.stringify(nextResult),
            );
        } catch {
            // Keep the edit working if storage is unavailable.
        }

        return nextResult;
    });
};
const clearSchoolListResults = () => {
    setSearchResult((current) => {
        if (!current?.isSchoolList) {
            return current;
        }

        return emptySearchResult;
    });

    try {
        window.sessionStorage.removeItem(
            schoolListResultsStorageKey,
        );
    } catch {
        // Keep the page working if storage is unavailable.
    }
};

    return (
        <AuthenticatedLayout compactMobile>
            <Head title={t('home.header')} />
            <FlashMessages />

            {schoolListAnalyzing &&
                createPortal(
                    <div
                        ref={analysisLockRef}
                        role="dialog"
                        aria-modal="true"
                        aria-busy="true"
                        aria-labelledby="school-list-analysis-title"
                        aria-describedby="school-list-analysis-description"
                        tabIndex={-1}
                        className="fixed inset-0 z-[100] grid cursor-wait place-items-center bg-slate-300/70 p-5 backdrop-blur-[2px] backdrop-grayscale focus:outline-none dark:bg-slate-950/80"
                    >
                        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                            <span
                                className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
                                aria-hidden="true"
                            />
                            <h2
                                id="school-list-analysis-title"
                                className="mt-5 text-xl font-black text-slate-950 dark:text-white"
                            >
                                {t(
                                    'school_list.analysis_lock_title',
                                )}
                            </h2>
                            <p
                                id="school-list-analysis-description"
                                className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300"
                            >
                                {t(
                                    'school_list.analysis_lock_description',
                                )}
                            </p>
                        </div>
                    </div>,
                    document.body,
                )}

            <div className="min-h-[calc(100vh-4.5rem)] bg-white pb-16 dark:bg-slate-950 md:pb-0">
<section className="relative overflow-visible border-b border-indigo-100 bg-[linear-gradient(115deg,#eef6ff_0%,#f8f7ff_48%,#edfdf8_100%)] text-slate-950 dark:border-slate-800 dark:bg-[linear-gradient(115deg,#020617_0%,#111827_55%,#052e2b_100%)] dark:text-white">    <div className="pointer-events-none absolute -start-24 top-10 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
    <div className="pointer-events-none absolute -end-20 top-0 h-72 w-72 rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-900/25" />

<div className="relative mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-7 md:grid-cols-[1fr_1fr] lg:gap-8 lg:px-8">
    <div className="min-w-0 flex flex-col justify-center">
        <div className="relative hidden pe-28 sm:block sm:pe-0">
           <h1 className="max-w-2xl text-[2.15rem] font-black leading-[.98] tracking-tight text-slate-950 dark:text-white sm:text-[2.6rem] lg:text-[2.85rem]">
    {tCommon('home_hero.find_buy_sell')}
    <br />
    {tCommon('home_hero.school_books')}{' '}
    <span className="text-indigo-600">
        {tCommon('home_hero.made_easier')}
    </span>
</h1>

<p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
    {tCommon('home_hero.description')}
</p>
            <div className="absolute -end-3 top-4 sm:hidden" aria-hidden="true">
                <BookStackArt />
            </div>
        </div>

    <div
    ref={searchHelperRef}
    className="relative z-40 mt-0 sm:mt-6"
>
    <form
        onSubmit={(event) => {
            setSearchHelperOpen(false);
            submitSearch(event);
        }}
        className="group relative flex items-center gap-1 rounded-2xl border border-white bg-white p-1 shadow-[0_12px_35px_rgba(79,70,229,.14)] transition focus-within:ring-4 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-indigo-500/15 sm:gap-2 sm:p-1.5"
    >
        <label
            htmlFor="home-book-search"
            className="sr-only"
        >
            {t('search.label')}
        </label>

        <input
            id="home-book-search"
            type="search"
            value={search}
            autoComplete="off"
            onFocus={() => {
                if (search.trim()) {
                    setSearchHelperOpen(true);
                }
            }}
            onClick={() => {
                if (search.trim()) {
                    setSearchHelperOpen(true);
                }
            }}
            onChange={(event) => {
                const value = event.target.value;

                setSearch(value);

                setSearchHelperOpen(
                    value.trim().length > 0,
                );
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    setSearchHelperOpen(false);
                }
            }}
            placeholder={t('search.placeholder')}
            className="min-h-10 min-w-0 flex-1 border-0 bg-transparent ps-3 text-sm font-normal text-slate-950 placeholder:font-medium placeholder:text-slate-500 focus:ring-0 dark:text-white dark:placeholder:text-slate-400 sm:text-base"
        />

        <button
            type="submit"
            disabled={!search.trim()}
            aria-label={t('search.action', {
                defaultValue: 'Search',
            })}
            title={t('search.action', {
                defaultValue: 'Search',
            })}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <Icon
                path={paths.search}
                className="h-4 w-4"
            />

            <span className="sr-only">
                {t('search.action', {
                    defaultValue: 'Search',
                })}
            </span>
        </button>
    </form>

    {searchHelperOpen &&
        search.trim() &&
        searchHelperBooks.length > 0 && (
            <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[70] max-h-[22rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
   {searchHelperBooks.map((item) => {
    const book = item.book ?? item;

    const title = String(
        book.title ?? '',
    ).trim();

    return (
        <button
            key={title.toLocaleLowerCase(
                i18n.language,
            )}
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
          onClick={async () => {
    setSearch(title);
    setSearchHelperOpen(false);

    await performSearch(title);

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            searchResultsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    });
}}
            className="flex w-full items-center rounded-xl px-4 py-3 text-start transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        >
            <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
                {title}
            </span>
        </button>
    );
})}
            </div>
        )}
</div>
  <div className="mt-6 hidden grid-cols-3 gap-3 border-t border-indigo-100 pt-5 sm:grid dark:border-slate-800">
    {/* CATEGORY */}
    <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('filters.category')}
        </span>

        <div className="relative">
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-sky-500/10 text-sky-500">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5v-14Z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5v-14Z"
                    />
                </svg>
            </span>

            <select
                value={categoryFilter}
                onChange={(event) =>
                    setCategoryFilter(event.target.value)
                }
                className=" home-filter-select min-h-14 w-full appearance-none truncate  rounded-xl border border-slate-200 bg-white ps-14 pe-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
            >
               <option value="">
    {t('filters.all_categories')}
</option>
<option value="school">
    {t('filters.school')}
</option>
<option value="university">
    {t('filters.university')}
</option>
<option value="novel">
    {t('filters.novel')}
</option>
            </select>
            <span
    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500 ltr:right-3 rtl:left-3 dark:text-slate-400"
    aria-hidden="true"
>
    <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
    >
        <path
            d="m6 8 4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
</span>
        </div>
    </label>

    {/* PRICE */}
    <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('filters.price')}
        </span>

        <div className="relative">
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13 13 20 4 11V4h7l9 9Z"
                    />
                    <circle cx="8.5" cy="8.5" r="1.25" />
                </svg>
            </span>

            <select
                value={priceFilter}
                onChange={(event) =>
                    setPriceFilter(event.target.value)
                }
                className=" home-filter-select min-h-14 w-full rounded-xl border border-slate-200 bg-white ps-14 pe-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
            >
<option value="">
    {t('filters.all_prices')}
</option>
<option value="under_5">
    {t('filters.under_5')}
</option>
<option value="5_10">
    {t('filters.price_5_10')}
</option>
<option value="10_20">
    {t('filters.price_10_20')}
</option>
<option value="20_50">
    {t('filters.price_20_50')}
</option>
<option value="over_50">
    {t('filters.over_50')}
</option>
            </select>
            <span
    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500 ltr:right-3 rtl:left-3 dark:text-slate-400"
    aria-hidden="true"
>
    <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
    >
        <path
            d="m6 8 4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
</span>
        </div>
    </label>

    {/* LOCATION */}
    <label className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('filters.location')}
        </span>

        <div className="relative">
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                    />
                    <circle cx="12" cy="10" r="2.5" />
                </svg>
            </span>

            <select
                value={locationFilter}
                onChange={(event) =>
                    setLocationFilter(event.target.value)
                }
                className=" home-filter-select min-h-14 w-full rounded-xl border border-slate-200 bg-white ps-14 pe-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
            >
<option value="">
    {t('filters.all_locations')}
</option>

{availableLocations.map((location) => (
    <option
        key={location}
        value={location}
    >
        {location}
    </option>
))}            </select>
<span
    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500 ltr:right-3 rtl:left-3 dark:text-slate-400"
    aria-hidden="true"
>
    <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
    >
        <path
            d="m6 8 4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
</span>
        </div>
    </label>
</div>
    </div>
    <div className="min-w-0 space-y-3 sm:space-y-4">
        {user ? (
          <SchoolListPhotos
    onCatalogResults={displaySchoolListResults}
    onClearCatalogResults={clearSchoolListResults}
    onAnalyzingChange={setSchoolListAnalyzing}
/>
        ) : (
            <GuestSchoolListActions />
        )}
        {user ? (
            <div className="relative h-32 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900 sm:h-36 sm:p-5">
                <div className="relative z-10 max-w-[64%] sm:max-w-[58%]">
                    <LoggedInBookActions />
                </div>
                <div className="absolute -end-4 top-1/2 hidden -translate-y-1/2 opacity-95 sm:block" aria-hidden="true"><BookStackArt /></div>
                <img src="/images/home/book-stack.webp" alt="" className="pointer-events-none absolute end-1 top-1/2 h-32 w-36 -translate-y-1/2 object-contain sm:hidden" aria-hidden="true" />
            </div>
        ) : (
            <GuestBookActions />
        )}
    </div>
</div>
</section>

                <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                   <SearchResults
    resultsRef={searchResultsRef}
    onUpdateNotFoundBook={updateSchoolListNotFoundBook}
    result={searchResult}
    t={t}
    money={money}
    user={user}
    locale={(i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]}
    onLoadMore={loadMoreSearchResults}
    favoriteListingIds={favoriteListingIds}
    categoryFilter={categoryFilter}
    priceFilter={priceFilter}
    locationFilter={locationFilter}
    onClearFilters={() => {
        setCategoryFilter('');
        setPriceFilter('');
        setLocationFilter('');
    }}
/>

                    {false && user && (
                            <section aria-labelledby="scan-heading">
                                <div className="mb-4 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400">
                                            {t(
                                                'scan.eyebrow',
                                            )}
                                        </p>

                                        <h2
                                            id="scan-heading"
                                            className="mt-1 text-2xl font-black text-slate-950 dark:text-white"
                                        >
                                            {t(
                                                'scan.title',
                                            )}
                                        </h2>
                                    </div>

                                    <span className="hidden text-sm text-slate-500 sm:block">
                                        {t('scan.hint')}
                                    </span>
                                </div>

                                <BookIsbnScanner
                                    onDetected={
                                        lookupScannedBook
                                    }
                                    disabled={
                                        scan.status ===
                                        'loading'
                                    }
                                />

                                <ScanResult
                                    scan={scan}
                                    t={t}
                                    money={money}
                                />
                            </section>
                    )}

                    <section aria-labelledby="latest-heading">
                      <ShelfHeading
    id="latest-heading"
    title={t('recent.title')}
/>

                        {recentBooks.length ? (
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                                {recentBooks.map(
                                    (book) => (
                                        <ProductCard
                                            key={
                                                book.home_card_key ??
                                                book.id
                                            }
                                            book={book}
                                            favoriteListingIds={favoriteListingIds}
                                            t={t}
                                            money={money}
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyShelf t={t} />
                        )}
                    </section>

                </main>
            </div>
        </AuthenticatedLayout>
    );
}

function SchoolListPhotos({
    onCatalogResults,
    onClearCatalogResults,
    onAnalyzingChange,
}) {
    const { t } = useTranslation('dashboard');
    const { cropImage, takePhoto, cropDialog } = useImageCropper();

    const [photos, setPhotos] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const schoolListStorageRestored = useRef(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState('');

    const cameraInput = useRef(null);
    const galleryInput = useRef(null);
    const fileInput = useRef(null);
    const menuHistoryId = useRef(null);
    const photoStripRef = useRef(null);
    const photoStripDrag = useRef({
        active: false,
        startX: 0,
        scrollLeft: 0,
    });

    const selectedCount =
        photos.length + uploadedFiles.length;

    /*
     * Release all temporary image URLs when this component
     * is removed from the page.
     */
    useEffect(() => {
    let cancelled = false;

    const restoreSchoolListFiles = async () => {
        try {
            const storedItems =
                await getSchoolListFiles();

            if (cancelled) {
                return;
            }

            const restoredPhotos = [];
            const restoredFiles = [];

            storedItems.forEach((item) => {
                if (!(item.file instanceof Blob)) {
                    return;
                }

                const file = new File(
                    [item.file],
                    item.name || 'school-list-file',
                    {
                        type:
                            item.type ||
                            item.file.type ||
                            '',
                        lastModified:
                            item.lastModified ||
                            Date.now(),
                    },
                );

                if (item.kind === 'photo') {
                    restoredPhotos.push({
                        id: item.id,
                        file,
                        url: URL.createObjectURL(file),
                    });
                } else if (item.kind === 'file') {
                    restoredFiles.push({
                        id: item.id,
                        file,
                        name: item.name,
                        size: file.size,
                    });
                }
            });

            setPhotos(restoredPhotos);
            setUploadedFiles(restoredFiles);
        } catch (error) {
            console.error(
                'Could not restore school-list files.',
                error,
            );
        } finally {
            schoolListStorageRestored.current = true;
        }
    };

    void restoreSchoolListFiles();

    return () => {
        cancelled = true;
    };
}, []);
   useEffect(() => {
    return () => {
        photos.forEach((photo) => {
            if (photo.url?.startsWith('blob:')) {
                URL.revokeObjectURL(photo.url);
            }
        });
    };
}, [photos]);

    /*
     * Prevent the page behind the bottom menu from scrolling.
     */
    useEffect(() => {
        if (!menuOpen && !viewingPhoto) {
            return undefined;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [menuOpen, viewingPhoto]);

    /*
     * Add a temporary browser-history entry when the menu
     * opens.
     *
     * Android Back, iOS Safari Back, iOS swipe-back and the
     * desktop browser Back button will close the menu first.
     */
    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const historyId =
            `school-list-menu-${Date.now()}`;

        menuHistoryId.current = historyId;

        window.history.pushState(
            {
                ...window.history.state,
                schoolListMenu: historyId,
            },
            '',
            window.location.href,
        );

        const handleBrowserBack = () => {
            if (
                menuHistoryId.current === historyId
            ) {
                menuHistoryId.current = null;
                setMenuOpen(false);
            }
        };

        window.addEventListener(
            'popstate',
            handleBrowserBack,
        );

        return () => {
            window.removeEventListener(
                'popstate',
                handleBrowserBack,
            );
        };
    }, [menuOpen]);

    const closeMenu = () => {
    const currentState = {
        ...window.history.state,
    };

    delete currentState.schoolListMenu;

    window.history.replaceState(
        currentState,
        '',
        window.location.href,
    );

    menuHistoryId.current = null;
    setMenuOpen(false);
};
const openCamera = async () => {
    closeMenu();

    const file = await takePhoto();

    if (!file) {
        return;
    }

    const photo = {
        id:
            crypto.randomUUID?.() ??
            `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
    };

    try {
        await saveSchoolListFile({
            id: photo.id,
            kind: 'photo',
            name: file.name,
            type: file.type,
            lastModified: file.lastModified,
            file,
        });
    } catch (error) {
        console.error(
            'Could not save school-list photo.',
            error,
        );
    }

    setPhotos((currentPhotos) => [
        ...currentPhotos,
        photo,
    ]);

    setAnalyzeError('');
};

    const openGallery = () => {
        galleryInput.current?.click();
        closeMenu();
    };

    const openFiles = () => {
        fileInput.current?.click();
        closeMenu();
    };

    const addPhotos = async (event) => {
    const selectedFiles = Array.from(
        event.target.files ?? [],
    ).filter((file) =>
        file.type.startsWith('image/'),
    );
    event.target.value = '';

    if (!selectedFiles.length) {
        return;
    }

    const files = [];
    for (const selected of selectedFiles) {
        const cropped = await cropImage(selected);
        if (cropped) files.push(cropped);
    }
    if (!files.length) return;

   const newPhotos = files.map((file) => ({
    id: crypto.randomUUID?.() ??
        `${file.name}-${file.lastModified}-${Math.random()}`,
    file,
    url: URL.createObjectURL(file),
}));

await Promise.all(
    newPhotos.map((photo) =>
        saveSchoolListFile({
            id: photo.id,
            kind: 'photo',
            name: photo.file.name,
            type: photo.file.type,
            lastModified: photo.file.lastModified,
            file: photo.file,
        }),
    ),
);

    setPhotos((currentPhotos) => [
        ...currentPhotos,
        ...newPhotos,
    ]);

    setAnalyzeError('');
    closeMenu();
};

    const addFiles = async (event) => {
        const files = Array.from(
            event.target.files ?? [],
        );

        if (!files.length) {
            event.target.value = '';
            return;
        }

     const newFiles = files.map((file) => ({
    id:
        crypto.randomUUID?.() ??
        `${file.name}-${file.lastModified}-${Math.random()}`,
    file,
    name: file.name,
    size: file.size,
}));

try {
    await Promise.all(
        newFiles.map((item) =>
            saveSchoolListFile({
                id: item.id,
                kind: 'file',
                name: item.file.name,
                type: item.file.type,
                lastModified:
                    item.file.lastModified,
                file: item.file,
            }),
        ),
    );
} catch (error) {
    console.error(
        'Could not save school-list file.',
        error,
    );
}
        setUploadedFiles((currentFiles) => [
            ...currentFiles,
            ...newFiles,
        ]);

        setAnalyzeError('');
        event.target.value = '';
        closeMenu();
    };

const removePhoto = (photoId) => {
    void removeSchoolListFile(photoId).catch(
        (error) => {
            console.error(
                'Could not remove stored school-list photo.',
                error,
            );
        },
    );

    setPhotos((currentPhotos) => {
        const removedPhoto = currentPhotos.find(
            (photo) => photo.id === photoId,
        );

        if (removedPhoto) {
            URL.revokeObjectURL(removedPhoto.url);
        }

        const nextPhotos = currentPhotos.filter(
            (photo) => photo.id !== photoId,
        );

        if (
            nextPhotos.length === 0 &&
            uploadedFiles.length === 0
        ) {
            onClearCatalogResults?.();
        }

        return nextPhotos;
    });

    setAnalyzeError('');
};

  const removeFile = (fileId) => {
    void removeSchoolListFile(fileId).catch(
        (error) => {
            console.error(
                'Could not remove stored school-list file.',
                error,
            );
        },
    );

    setUploadedFiles((currentFiles) => {
        const nextFiles = currentFiles.filter(
            (file) => file.id !== fileId,
        );

        if (
            nextFiles.length === 0 &&
            photos.length === 0
        ) {
            onClearCatalogResults?.();
        }

        return nextFiles;
    });

    setAnalyzeError('');
};

    const viewLastPhoto = () => {
        const lastPhoto =
            photos[photos.length - 1];

        if (lastPhoto) {
            setViewingPhoto(lastPhoto);
        }

        closeMenu();
    };

  const analyzeSchoolList = async () => {
    const selectedFiles = [
        ...photos.map((photo) => photo.file),
        ...uploadedFiles.map((item) => item.file),
    ];

    if (!selectedFiles.length || analyzing) {
        return;
    }

    setAnalyzing(true);
    onAnalyzingChange?.(true);
    setAnalyzeError('');

    try {
        // Let React paint the page lock before document parsing
        // starts, because large PDFs can briefly occupy the main
        // browser thread.
        await new Promise((resolve) => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(resolve);
            });
        });

        const preparedDocuments = [];

        for (const file of selectedFiles) {
            const document = await prepareDocumentForAi(
                file,
                () => {},
            );

            preparedDocuments.push(document);
        }

        const combinedText = preparedDocuments
            .map((document) => document.text?.trim() ?? '')
            .filter(Boolean)
            .join('\n\n');

        const extractedImages = preparedDocuments.flatMap(
            (document) => document.images ?? [],
        );

        if (
            !combinedText &&
            extractedImages.length === 0
        ) {
            setAnalyzeError(
                t('school_list.no_content', {
                    defaultValue:
                        'No readable content was found in your list.',
                }),
            );

            return;
        }

        const payload = new FormData();

        payload.append(
            'file_name',
            selectedFiles.length === 1
                ? selectedFiles[0].name
                : 'school-list',
        );

        if (combinedText) {
            payload.append('text', combinedText);
        }

        extractedImages.forEach((image, index) => {
            payload.append(
                'images[]',
                image,
                image.name ??
                    `school-list-page-${index + 1}.jpg`,
            );
        });

        const response = await axios.post(
            route('book-lists.analyze'),
            payload,
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        );

      const items = response.data?.items ?? [];

// Take only the best database match for each detected book.
const bestMatches = items
    .map((item) => {
        const match = item.matches?.[0];

        return match?.book ?? match ?? null;
    })
    .filter((book) => book?.id != null);

// Remove duplicate database books.
const foundBooks = Array.from(
    new Map(
        bestMatches.map((book) => [
            book.id,
            book,
        ]),
    ).values(),
);

// Keep the names detected by AI that have no database match.
const unmatchedItems = items
    .filter(
        (item) =>
            item.status === 'not_found' ||
            !item.matches?.length,
    )
    .map((item) => ({
        id: item.id,
        title:
            item.title ||
            item.raw ||
            t('school_list.unknown_book', {
                defaultValue: 'Unknown book',
            }),
        subject: item.subject ?? null,
        book_type: item.book_type ?? null,
        part: item.part ?? null,
        grade: item.grade ?? null,
        isbn: item.isbn ?? null,
    }));

// Remove duplicate unmatched names.
const notFoundBooks = Array.from(
    new Map(
        unmatchedItems.map((item) => [
            bookAlertKey(item),
            item,
        ]),
    ).values(),
);

onCatalogResults?.({
    foundBooks,
    notFoundBooks,
});

setAnalyzeError('');
 }
    catch (error) {
        const serverMessage =
            error.response?.data?.message ??
            error.message ??
            '';

        setAnalyzeError(
            serverMessage ||
                t('school_list.analysis_error', {
                    defaultValue:
                        'The school list could not be analyzed.',
                }),
        );
    } finally {
        setAnalyzing(false);
        onAnalyzingChange?.(false);
    }
};

    return (
        <>
            {cropDialog}
<div
    className={`relative min-w-0 overflow-hidden rounded-3xl border border-violet-100 bg-white/75 p-4 shadow-[0_10px_35px_rgba(79,70,229,.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 sm:p-5 ${
        selectedCount
            ? 'pb-4 sm:min-h-64 sm:pb-20'
            : 'h-44'
    }`}
>                <img
                    src="/images/home/school-list.webp"
                    alt=""
                    className={`pointer-events-none absolute bottom-3 end-4 z-20 h-28 w-28 rotate-3 object-contain sm:bottom-4 sm:end-5 sm:h-28 sm:w-28 lg:h-32 lg:w-32 ${selectedCount ? 'hidden' : ''}`}
                    aria-hidden="true"
                />
                <div className="relative z-10">
                   <h2 className="-translate-y-2 max-w-full text-base font-extrabold leading-tight text-slate-950 dark:text-white sm:-translate-y-3 sm:text-xl">
                        {t('school_list.title')}
                    </h2>
                </div>



                     <div
                        ref={photoStripRef}
                        onWheel={(event) => {
                            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                                event.preventDefault();
                                event.currentTarget.scrollLeft += event.deltaY;
                            }
                        }}
                       onPointerDown={(event) => {
                        if (event.pointerType !== 'mouse') return;

                        // Do not start dragging when clicking a button.
                        if (event.target.closest('button')) return;

                        photoStripDrag.current = {
                            active: true,
                            startX: event.clientX,
                            scrollLeft: event.currentTarget.scrollLeft,
                        };

                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                        onPointerMove={(event) => {
                            if (!photoStripDrag.current.active || event.pointerType !== 'mouse') return;
                            event.currentTarget.scrollLeft = photoStripDrag.current.scrollLeft - (event.clientX - photoStripDrag.current.startX);
                        }}
                        onPointerUp={(event) => {
                            photoStripDrag.current.active = false;
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                            }
                        }}
                        onPointerCancel={() => {
                            photoStripDrag.current.active = false;
                        }}
                        className={`z-10 flex min-w-0 max-w-full cursor-grab touch-pan-x select-none gap-2 overflow-x-auto overscroll-x-contain pb-2 pt-1 scroll-smooth active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 ${
                        selectedCount
                            ? 'relative mt-3 w-full'
                            : 'absolute bottom-4 start-4 w-auto overflow-visible sm:start-5'
                    }`}
                     >
                    {photos.map(
                        (photo, index) => (
                            <div
                                key={photo.id}
className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:h-24 sm:w-20 sm:rounded-2xl"                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setViewingPhoto(
                                            photo,
                                        )
                                    }
                                    className="h-full w-full"
                                >
                                    <img
                                        src={
                                            photo.url
                                        }
                                        alt={t(
                                            'school_list.page',
                                            {
                                                number:
                                                    index +
                                                    1,
                                            },
                                        )}
                                        className="h-full w-full object-cover"
                                    />
                                </button>

                                <span className="absolute bottom-2 start-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-white">
                                    {t(
                                        'school_list.page',
                                        {
                                            number:
                                                index +
                                                1,
                                        },
                                    )}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removePhoto(
                                            photo.id,
                                        )
                                    }
                                    aria-label={t(
                                        'school_list.remove_page',
                                        {
                                            number:
                                                index +
                                                1,
                                            defaultValue:
                                                `Remove page ${index + 1}`,
                                        },
                                    )}
                                    className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white shadow transition hover:bg-rose-600 sm:end-2 sm:top-2 sm:h-7 sm:w-7"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M6 6l12 12" />
                                        <path d="M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>
                        ),
                    )}

                    {uploadedFiles.map(
                        (uploadedFile) => (
                            <div
                                key={
                                    uploadedFile.id
                                }
                                className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-indigo-200 bg-white p-1 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:h-24 sm:w-20 sm:rounded-2xl sm:p-3"
                            >
                                <svg
                                    className="h-7 w-7 text-indigo-600 dark:text-indigo-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                    <path d="M14 2v6h6" />
                                </svg>

                                <span className="mt-2 line-clamp-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                    {
                                        uploadedFile.name
                                    }
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeFile(
                                            uploadedFile.id,
                                        )
                                    }
                                    aria-label={t(
                                        'school_list.remove_file',
                                        {
                                            defaultValue:
                                                'Remove file',
                                        },
                                    )}
                                    className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white shadow transition hover:bg-rose-600 sm:end-2 sm:top-2 sm:h-7 sm:w-7"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M6 6l12 12" />
                                        <path d="M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>
                        ),
                    )}

                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setMenuOpen(true);
                        }}
                        aria-label={
                            selectedCount
                                ? t('school_list.add_another_page')
                                : t('school_list.add_photo')
                        }
                        className={`group relative z-30 block aspect-[4/3] shrink-0 cursor-pointer rounded-2xl bg-transparent transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                            selectedCount
                                ? 'w-24 sm:w-28'
                                : 'w-[28vw] min-w-24 max-w-28'
                        }`}
                    >
                        <span className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-slate-200/95 px-2 text-indigo-700 shadow-sm transition group-hover:border-indigo-600 group-hover:bg-slate-300 dark:border-indigo-400 dark:bg-slate-700/90 dark:text-indigo-300 dark:group-hover:border-indigo-300 dark:group-hover:bg-slate-600">
                            <svg
                                className="h-8 w-8 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span className="mt-1.5 max-w-full text-center text-xs font-extrabold leading-tight">
                                {selectedCount
                                    ? t('school_list.add_another_page')
                                    : t('school_list.add_photo')}
                            </span>
                        </span>
                    </button>
                </div>

                {selectedCount > 2 && (
                    <div className="absolute bottom-4 end-4 z-20 flex justify-end gap-2 sm:end-5">
                        <button
                            type="button"
                            onClick={() => photoStripRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                            aria-label={t('school_list.previous_photos')}
                            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <DirectionalArrowIcon direction="back" variant="chevron" />
                        </button>
                        <button
                            type="button"
                            onClick={() => photoStripRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                            aria-label={t('school_list.next_photos')}
                            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <DirectionalArrowIcon variant="chevron" />
                        </button>
                    </div>
                )}

                <input
                    ref={cameraInput}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={addPhotos}
                    className="hidden"
                />

                <input
                    ref={galleryInput}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addPhotos}
                    className="hidden"
                />
<input
    ref={fileInput}
    type="file"
    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
    multiple
    onChange={addFiles}
    className="hidden"
/>

{selectedCount > 0 && (
    <button
        type="button"
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            analyzeSchoolList();
        }}
        disabled={analyzing}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:absolute sm:bottom-4 sm:start-5 sm:mt-0"
    >
        <Icon
            path={paths.search}
            className="h-4 w-4"
        />

        {analyzing
            ? t('school_list.analyzing')
            : t('school_list.search')}
    </button>
)}
                {analyzeError && (
                    <div
                        role="alert"
                        className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                        {analyzeError}
                    </div>
                )}
            </div>

            {menuOpen &&
    createPortal(
        <div
                    className="fixed inset-0 z-[110] flex items-end justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="school-list-menu-title"
                >
                    <button
                        type="button"
                        aria-label={t(
                            'school_list.cancel',
                        )}
                        onClick={closeMenu}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
                    />

                    <div className="relative max-h-[calc(100dvh-1rem)] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:max-w-lg">
                        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

                        <h3
                            id="school-list-menu-title"
                            className="text-lg font-extrabold text-slate-950 dark:text-white"
                        >
                            {t(
                                'school_list.menu_title',
                            )}
                        </h3>

                        <div className="mt-4 space-y-2">
                            {photos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={
                                        viewLastPhoto
                                    }
                                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <svg
                                        className="h-6 w-6 text-slate-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="3"
                                        />
                                    </svg>

                                    <span>
                                        {t(
                                            'school_list.view_last',
                                        )}
                                    </span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={openCamera}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M14.5 5H9.5L8 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
                                    <circle
                                        cx="12"
                                        cy="13"
                                        r="3"
                                    />
                                </svg>

                                <span>
                                    {t(
                                        'school_list.take_photo',
                                    )}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={openGallery}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />
                                    <circle
                                        cx="9"
                                        cy="9"
                                        r="2"
                                    />
                                    <path d="m21 15-5-5L5 20" />
                                </svg>

                                <span>
                                    {t(
                                        'school_list.gallery',
                                    )}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={openFiles}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M12 16V4" />
                                    <path d="m7 9 5-5 5 5" />
                                    <path d="M5 20h14" />
                                </svg>

                                <span>
                                    {t(
                                        'school_list.upload',
                                    )}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={closeMenu}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    aria-hidden="true"
                                >
                                    <path d="M6 6l12 12" />
                                    <path d="M18 6 6 18" />
                                </svg>

                                <span>
                                    {t(
                                        'school_list.cancel',
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                               </div>,
                document.body,
            )}

            {viewingPhoto && (
                <div
                    className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/90 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t(
                        'school_list.view_last',
                    )}
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setViewingPhoto(null);
                        }
                    }}
                >
                    <img
                        src={viewingPhoto.url}
                        alt={t(
                            'school_list.view_last',
                        )}
                        className="max-h-[85dvh] max-w-full rounded-2xl object-contain shadow-2xl"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setViewingPhoto(null)
                        }
                        aria-label={t(
                            'school_list.cancel',
                        )}
                        className="absolute end-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 shadow-lg transition hover:bg-rose-50 hover:text-rose-600"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M6 6l12 12" />
                            <path d="M18 6 6 18" />
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}
function GuestSchoolListActions() {
    const { t } = useTranslation('dashboard');

    return (
        <Link
            href={route('login')}
            className="group relative block h-32 min-w-0 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-violet-900/50 dark:from-violet-950/40 dark:to-slate-900 dark:hover:border-violet-600 sm:h-36 sm:p-5"
        >
            <div className="relative z-10 max-w-[64%] sm:max-w-[58%]">
                <h2 className="text-lg font-extrabold leading-tight text-slate-950 dark:text-white sm:text-xl">
                    {t('school_list.title')}
                </h2>

                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
                    {t('school_list.login_to_scan')}
                </p>
            </div>

            <img
                src="/images/home/school-list.webp"
                alt=""
                className="pointer-events-none absolute end-3 top-1/2 h-24 w-28 -translate-y-1/2 rotate-3 object-contain sm:end-1 sm:h-28 sm:w-32"
                aria-hidden="true"
            />
        </Link>
    );
}

function LoggedInBookActions() {
    const { t } = useTranslation('dashboard');

    return (
        <div>
          <h2 className="text-lg font-extrabold leading-tight text-slate-950 dark:text-white sm:text-xl">
               {t('sell_book.title')}
          </h2>

            <Link
                href={route('add.book')}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-3 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-600 sm:mt-4"
            >
                <span>{t('sell_book.button')}</span>
            </Link>
        </div>
    );
}

function GuestBookActions() {
    const { t } = useTranslation('dashboard');

    return (
        <Link
            href={route('login')}
            className="group relative block h-32 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900 dark:hover:border-emerald-600 sm:h-36 sm:p-5"
        >
            <div className="relative z-10 max-w-[64%] sm:max-w-[58%]">
                <h2 className="text-lg font-extrabold leading-tight text-slate-950 dark:text-white sm:text-xl">
                    {t('sell_book.title')}
                </h2>

                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
                    {t('sell_book.login_to_sell')}
                </p>
            </div>

            <div className="absolute -end-4 top-1/2 hidden -translate-y-1/2 opacity-95 sm:block" aria-hidden="true"><BookStackArt /></div>
            <img src="/images/home/book-stack.webp" alt="" className="pointer-events-none absolute end-1 top-1/2 h-32 w-36 -translate-y-1/2 object-contain sm:hidden" aria-hidden="true" />
        </Link>
    );
}
function ScanResult({ scan, t, money }) {
    if (scan.status === 'idle') {
        return null;
    }

    if (scan.status === 'loading') {
        return (
            <Notice tone="info">
                {t('scan.loading', {
                    isbn: scan.isbn,
                })}
            </Notice>
        );
    }

    if (scan.status === 'not_found') {
        return (
            <Notice tone="warning">
                {t('scan.not_found', {
                    isbn: scan.isbn,
                })}
            </Notice>
        );
    }

    if (scan.status === 'error') {
        return (
            <Notice tone="danger">
                {t('scan.error')}
            </Notice>
        );
    }

    const book = scan.book;

    return (
        <div className="mt-4 flex gap-4  rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:items-center">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-white dark:bg-slate-800">
                <BookCoverImage
                    src={book.cover_image_url}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    fallback={
                        <span className="grid h-full place-items-center text-emerald-600">
                            <Icon
                                path={paths.book}
                                className="h-8 w-8"
                            />
                        </span>
                    }
                />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    {t('scan.found')}
                </p>

                <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                    {book.title}
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {[
                        book.author,
                        book.publisher,
                        book.grade,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            book.available_count
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                        }`}
                    >
                        {book.available_count
                            ? t('book.in_stock', {
                                  count:
                                      book.available_count,
                              })
                            : t('book.out_of_stock')}
                    </span>

                    {book.lowest_price !== null && (
                        <strong className="text-base text-slate-950 dark:text-white">
                            {money.format(
                                Number(
                                    book.lowest_price,
                                ),
                            )}
                        </strong>
                    )}

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ISBN {book.isbn || scan.isbn}
                    </span>
                </div>
            </div>
        </div>
    );
}

function SearchResults({
    result,
    t,
    money,
    user,
    locale,
    onLoadMore,
    favoriteListingIds = [],
    resultsRef,
    onUpdateNotFoundBook,
    categoryFilter,
priceFilter,
locationFilter,
onClearFilters,
}) {
    const [subscribedAlertKeys, setSubscribedAlertKeys] =
        useState(() => new Set());
    const [pendingAlertKeys, setPendingAlertKeys] =
        useState(() => new Set());
    const [showAlertLogin, setShowAlertLogin] =
        useState(false);
    const [alertFeedback, setAlertFeedback] =
        useState({ tone: '', message: '' });

        const [editingNotFoundBook, setEditingNotFoundBook] =
    useState(null);

const [editingNotFoundIndex, setEditingNotFoundIndex] =
    useState(null);

const [editBookError, setEditBookError] = useState('');
const [editBookSuccess, setEditBookSuccess] = useState('');

const openNotFoundBookEditor = (book, index) => {
    setEditingNotFoundIndex(index);

    setEditingNotFoundBook({
        title: book.title ?? '',
        subject: book.subject ?? '',
        book_type: book.book_type ?? '',
        part: book.part ?? '',
        grade: book.grade ?? '',
        isbn: book.isbn ?? '',
    });

    setEditBookError('');
};

const closeNotFoundBookEditor = () => {
    setEditingNotFoundBook(null);
    setEditingNotFoundIndex(null);
    setEditBookError('');
};

const updateEditingBookField = (field, value) => {
    setEditingNotFoundBook((current) => ({
        ...current,
        [field]: value,
    }));
};

const saveNotFoundBookEdit = () => {
    const title = editingNotFoundBook?.title?.trim();

    if (!title) {
        setEditBookError(
    t('book_alerts.edit_title_required', {
        defaultValue: 'Title is required.',
    }),
);
        return;
    }

    onUpdateNotFoundBook?.(
        editingNotFoundIndex,
        {
            ...editingNotFoundBook,
            title,
            subject:
                editingNotFoundBook.subject?.trim() || null,
            book_type:
                editingNotFoundBook.book_type?.trim() || null,
            part:
                editingNotFoundBook.part?.trim() || null,
            grade:
                editingNotFoundBook.grade?.trim() || null,
            isbn:
                editingNotFoundBook.isbn?.trim() || null,
        },
    );

    closeNotFoundBookEditor();
    setEditBookSuccess(
    t('book_alerts.edit_success', {
        defaultValue: 'Book information updated successfully.',
    }),
);

window.setTimeout(() => {
    setEditBookSuccess('');
}, 3500);
};

    useEffect(() => {
        setSubscribedAlertKeys(new Set());
        setPendingAlertKeys(new Set());
        setAlertFeedback({ tone: '', message: '' });
    }, [result.query, result.isSchoolList]);

    const enableBookAlerts = async (items) => {
        const validItems = items.filter(
            (item) => item?.title?.trim(),
        );

        if (!validItems.length) {
            return;
        }

        if (!user) {
            setShowAlertLogin(true);
            return;
        }

        const keys = validItems.map(bookAlertKey);

        setPendingAlertKeys((current) =>
            new Set([...current, ...keys]),
        );
        setAlertFeedback({ tone: '', message: '' });

        try {
            await axios.post(route('book-alerts.store'), {
                locale,
                items: validItems.map((item) => ({
                    title: item.title,
                    subject: item.subject ?? null,
                    book_type: item.book_type ?? null,
                    part: item.part ?? null,
                    grade: item.grade ?? null,
                    isbn: item.isbn ?? null,
                })),
            });

            setSubscribedAlertKeys((current) =>
                new Set([...current, ...keys]),
            );
            setAlertFeedback({
                tone: 'success',
                message:
                    validItems.length === 1
                        ? t('book_alerts.success_one')
                        : t('book_alerts.success_many', {
                              count: validItems.length,
                          }),
            });
        } catch (error) {
            setAlertFeedback({
                tone: 'error',
                message:
                    error.response?.data?.message ||
                    t('book_alerts.error'),
            });
        } finally {
            setPendingAlertKeys((current) => {
                const next = new Set(current);
                keys.forEach((key) => next.delete(key));

                return next;
            });
        }
    };

    if (result.status === 'idle') {
        return null;
    }

    const foundBooks = result.books ?? [];
    const notFoundBooks =
        result.notFoundBooks ?? [];

    const hasAnyResults =
        foundBooks.length > 0 ||
        notFoundBooks.length > 0;

  return (
    <>
    {editBookSuccess && (
    <div
        className="fixed end-4 top-20 z-[120] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl dark:border-emerald-500/30 dark:bg-emerald-950"
        role="status"
    >
        <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="m5 12 4 4L19 6" />
                </svg>
            </span>

            <p className="min-w-0 flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {editBookSuccess}
            </p>

            <button
                type="button"
                onClick={() => setEditBookSuccess('')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
                aria-label={t('book_alerts.close', {
                    defaultValue: 'Close',
                })}
            >
                ×
            </button>
        </div>
    </div>
)}
        <section
    ref={resultsRef}
    aria-live="polite"
    aria-labelledby="home-results-heading"
    className="scroll-mt-24"
>
       <div className="flex items-end justify-between gap-4">
    <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            {t('search.catalog', {
                defaultValue: 'Catalog results',
            })}
        </p>

        <h2
            id="home-results-heading"
            className="mt-1 text-2xl font-black text-slate-950 dark:text-white"
        >
            {result.isSchoolList
                ? t(
                      'school_list.catalog_results',
                      {
                          defaultValue:
                              'School-list results',
                      },
                  )
                : t('search.results_for', {
                      query: result.query,
                      defaultValue:
                          `Results for “${result.query}”`,
                  })}
        </h2>
    </div>

    {!result.isSchoolList &&
        (categoryFilter ||
            priceFilter ||
            locationFilter) && (
            <button
                type="button"
              onClick={onClearFilters}
                className="mb-1 inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                >
                    <path
                        d="M3 6h18"
                        strokeLinecap="round"
                    />
                    <path
                        d="M8 6V4h8v2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M19 6l-1 14H6L5 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M10 10v6M14 10v6"
                        strokeLinecap="round"
                    />
                </svg>

                <span>
                    {t('filters.clear', {
                        defaultValue: 'Clear filters',
                    })}
                </span>
            </button>
        )}
</div>

            {result.status === 'loading' && (
                <Notice tone="info">
                    {t('search.loading')}
                </Notice>
            )}

            {result.status === 'error' && (
                <Notice tone="danger">
                    {t('search.error')}
                </Notice>
            )}

           {result.status === 'ready' &&
    !hasAnyResults && (
        <div
            role="status"
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
        >
            <span>{t('search.empty')}</span>
        </div>
    )}

            {result.isSchoolList &&
                result.status === 'ready' && (
                    <div className="mt-6 space-y-10">
                        {/* Part 1: database matches */}
                        <section>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                                    {t(
                                        'school_list.found_books',
                                        {
                                            defaultValue:
                                                'Books found',
                                        },
                                    )}
                                </h3>

                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {
                                        foundBooks.length
                                    }
                                </span>
                            </div>

                            {foundBooks.length >
                            0 ? (
                                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {foundBooks.map(
                                        (book) => (
                                            <ProductCard
                                                key={
                                                    book.id
                                                }
                                                book={
                                                    book
                                                }
                                                favoriteListingIds={favoriteListingIds}
                                                t={t}
                                                money={
                                                    money
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                    {t(
                                        'school_list.no_found_books',
                                        {
                                            defaultValue:
                                                'No books from this list were found in the catalog.',
                                        },
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Part 2: unmatched book names */}
                        <section>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                                        {t(
                                            'school_list.not_found_books',
                                            {
                                                defaultValue:
                                                    'Books not found',
                                            },
                                        )}
                                    </h3>

                                    <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                        {
                                            notFoundBooks.length
                                        }
                                    </span>
                                </div>

                                {notFoundBooks.length > 0 && (
                                    <BookAlertButton
                                        label={t(
                                            'book_alerts.notify_all',
                                        )}
                                        active={notFoundBooks.every(
                                            (book) =>
                                                subscribedAlertKeys.has(
                                                    bookAlertKey(
                                                        book,
                                                    ),
                                                ),
                                        )}
                                        pending={notFoundBooks.some(
                                            (book) =>
                                                pendingAlertKeys.has(
                                                    bookAlertKey(
                                                        book,
                                                    ),
                                                ),
                                        )}
                                        showLabel
                                        onClick={() =>
                                            void enableBookAlerts(
                                                notFoundBooks,
                                            )
                                        }
                                    />
                                )}
                            </div>

                            {notFoundBooks.length >
                            0 ? (
                                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {notFoundBooks.map(
                                            (
                                                book,
                                                index,
                                            ) => (
                                                <li
                                                    key={
                                                        book.id ??
                                                        `${book.title}-${index}`
                                                    }
                                                    className="flex items-start gap-3 px-4 py-4"
                                                >
                                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                        {index +
                                                            1}
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {
                                                                book.title
                                                            }
                                                        </p>

                                                        {(book.subject ||
                                                            book.grade ||
                                                            book.part) && (
                                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                {[
                                                                    book.subject,
                                                                    book.grade
                                                                        ? t(
                                                                              'book.grade',
                                                                              {
                                                                                  grade: book.grade,
                                                                                  defaultValue: `Grade ${book.grade}`,
                                                                              },
                                                                          )
                                                                        : null,
                                                                    book.part
                                                                        ? t(
                                                                              'book_alerts.part',
                                                                              {
                                                                                  part: book.part,
                                                                              },
                                                                          )
                                                                        : null,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        ' • ',
                                                                    )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">
    <button
        type="button"
        onClick={() =>
            openNotFoundBookEditor(
                book,
                index,
            )
        }
        className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
aria-label={t('book_alerts.edit_book_aria', {
    title: book.title,
    defaultValue: `Edit ${book.title}`,
})}
title={t('book_alerts.edit_book', {
    defaultValue: 'Edit book information',
})}
    >
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    </button>

    <BookAlertButton
        label={t(
            'book_alerts.notify_one',
            {
                title: book.title,
            },
        )}
        active={subscribedAlertKeys.has(
            bookAlertKey(book),
        )}
        pending={pendingAlertKeys.has(
            bookAlertKey(book),
        )}
        onClick={() =>
            void enableBookAlerts([book])
        }
    />
</div>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    {t(
                                        'school_list.all_found',
                                        {
                                            defaultValue:
                                                'Every detected book was found in the catalog.',
                                        },
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                )}

            {alertFeedback.message && (
                <div
                    role="status"
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        alertFeedback.tone === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                    }`}
                >
                    {alertFeedback.message}
                </div>
            )}

            {showAlertLogin && (
                <BookAlertLoginDialog
                    t={t}
                    onClose={() => setShowAlertLogin(false)}
                />
            )}

{!result.isSchoolList &&
    foundBooks.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {foundBooks.flatMap((book) => {
                const listings =
                    book.listings ?? [];

                return listings.map((listing) => (
                    <ProductCard
                        key={`${book.id}-${listing.id}`}
                        book={{
                            ...book,
                            listings: [listing],
                        }}
                        favoriteListingIds={
                            favoriteListingIds
                        }
                        t={t}
                        money={money}
                    />
                ));
            })}
        </div>
    )}

            {!result.isSchoolList &&
                result.hasMore && (
                    <div className="mt-7 flex justify-center">
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={
                                result.status ===
                                'loading_more'
                            }
                            className="min-h-12 rounded-xl bg-indigo-600 px-6 font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {result.status ===
                            'loading_more'
                                ? t(
                                      'search.loading_more',
                                  )
                                : t(
                                      'search.load_more',
                                  )}
                        </button>
                    </div>
                )}
              </section>

        {editingNotFoundBook && (
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-unfound-book-title"
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                closeNotFoundBookEditor();
            }
        }}
    >
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                        {t('book_alerts.school_list', {
    defaultValue: 'School list',
})}
                    </p>

                    <h2
                        id="edit-unfound-book-title"
                        className="mt-1 text-2xl font-black text-slate-950 dark:text-white"
                    >
                        {t('book_alerts.edit_book', {
    defaultValue: 'Edit book information',
})}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
{t('book_alerts.edit_description', {
    defaultValue:
        'Correct the information before creating an alert.',
})}                    </p>
                </div>

                <button
                    type="button"
                    onClick={closeNotFoundBookEditor}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label={t('book_alerts.close', {
    defaultValue: 'Close',
})}
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        Title *
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.title}
                        onChange={(event) =>
                            updateEditingBookField(
                                'title',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        autoFocus
                    />
                </label>

                <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t('book_alerts.edit_subject', {
    defaultValue: 'Subject',
})}
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.subject}
                        onChange={(event) =>
                            updateEditingBookField(
                                'subject',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>

                <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t('book_alerts.edit_book_type', {
    defaultValue: 'Book type',
})}
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.book_type}
                        onChange={(event) =>
                            updateEditingBookField(
                                'book_type',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>

                <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t('book_alerts.edit_part', {
    defaultValue: 'Part / Volume',
})}
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.part}
                        onChange={(event) =>
                            updateEditingBookField(
                                'part',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>

                <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t('book_alerts.edit_grade', {
    defaultValue: 'Grade',
})}
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.grade}
                        onChange={(event) =>
                            updateEditingBookField(
                                'grade',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>

                <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t('book_alerts.edit_isbn', {
    defaultValue: 'ISBN',
})}
                    </span>

                    <input
                        type="text"
                        value={editingNotFoundBook.isbn}
                        onChange={(event) =>
                            updateEditingBookField(
                                'isbn',
                                event.target.value,
                            )
                        }
                        className="w-full rounded-xl border-slate-300 bg-white text-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </label>
            </div>

            {editBookError && (
                <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                    {editBookError}
                </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={closeNotFoundBookEditor}
                    className="min-h-12 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {t('book_alerts.edit_cancel', {
    defaultValue: 'Cancel',
})}
                </button>

                <button
                    type="button"
                    onClick={saveNotFoundBookEdit}
                    className="min-h-12 rounded-xl bg-indigo-600 px-5 text-sm font-extrabold text-white transition hover:bg-indigo-700"
                               >
                    {t('book_alerts.edit_save', {
    defaultValue: 'Save changes',
})}
                </button>
            </div>
        </div>
    </div>
)}

    </>
);
}

function bookAlertKey(book) {
    return [
        book?.title,
        book?.subject,
        book?.book_type,
        book?.part,
        book?.grade,
        book?.isbn,
    ]
        .map((value) =>
            String(value ?? '')
                .trim()
                .toLocaleLowerCase(),
        )
        .join('|');
}

function BookAlertButton({
    label,
    active = false,
    pending = false,
    showLabel = false,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={active || pending}
            aria-label={label}
            title={label}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-default ${
                active
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
            }`}
        >
            {pending ? (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            ) : (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill={active ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                    {active && (
                        <path
                            d="m9 12 2 2 4-4"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.2"
                        />
                    )}
                </svg>
            )}

            {showLabel && <span>{label}</span>}
        </button>
    );
}

function BookAlertLoginDialog({ t, onClose }) {
    return createPortal(
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-alert-login-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('book_alerts.close')}
                    className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <span aria-hidden="true">×</span>
                </button>

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                        <path d="M10 21h4" />
                    </svg>
                </div>

                <h2
                    id="book-alert-login-title"
                    className="mt-5 pe-10 text-2xl font-black text-slate-950 dark:text-white"
                >
                    {t('book_alerts.login_title')}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                    {t('book_alerts.login_description')}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                        href={route('login')}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
                    >
                        {t('book_alerts.login')}
                    </Link>
                    <Link
                        href={route('register')}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {t('book_alerts.register')}
                    </Link>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function BookStackArt({ green = false }) {
    return (
        <div className={green ? 'h-44 w-52 sm:h-52 sm:w-64' : 'h-28 w-32 sm:h-40 sm:w-48 lg:h-48 lg:w-60'}>
            <img
                src={green ? '/images/home/second-life.webp' : '/images/home/book-stack.webp'}
                alt=""
                className="h-full w-full object-contain"
            />
        </div>
    );
}

function FeatureIcon({ name }) {
    const iconPaths = {
        book: paths.book,
        leaf: 'M12 22V8m0 7c-5 0-8-3-8-8 5 0 8 3 8 8Zm0-3c5 0 8-3 8-8-5 0-8 3-8 8Z',
        users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
        shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4',
        truck: 'M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    };

    return <Icon path={iconPaths[name] ?? paths.book} className="h-5 w-5" />;
}

function MiniBenefit({ icon, title, text }) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-teal-600 shadow-sm dark:bg-slate-900"><FeatureIcon name={icon} /></span>
            <span className="min-w-0"><strong className="block text-xs text-slate-800 dark:text-white">{title}</strong>{text && <small className="text-slate-500 dark:text-slate-400">{text}</small>}</span>
        </div>
    );
}

function listingGalleryImages(listing, fallbackImage) {
    const images = [];

    const addImage = (value) => {
        const url = resolveBookImageUrl(value);

        if (url && !images.includes(url)) {
            images.push(url);
        }
    };

    addImage(listing?.photo_url);
    (listing?.images ?? []).forEach((image) => {
        addImage(
            image?.image_url ??
                image?.photo_url ??
                image?.image_path ??
                image?.path,
        );
    });

    if (images.length === 0) {
        addImage(fallbackImage);
    }

    return images;
}

function ProductCard({ book, favoriteListingIds = [], t, money }) {
   const [showListingImages, setShowListingImages] = useState(false);
    const user = usePage().props.auth?.user;
   const listings = book.listings ?? [];

const featuredListing =
    listings.reduce(
        (cheapest, listing) => {
            if (!cheapest) {
                return listing;
            }

            return Number(
                listing.price,
            ) <
                Number(
                    cheapest.price,
                )
                ? listing
                : cheapest;
        },
        null,
    );

const lowest = featuredListing
    ? Number(featuredListing.price)
    : null;

const cover = resolveBookImageUrl(
    featuredListing?.photo_url ||
        book.cover_image_url ||
        book.images?.[0]?.image_path,
);
const galleryImages = listingGalleryImages(featuredListing, cover);
const isFavorite = featuredListing
    ? favoriteListingIds.includes(featuredListing.id)
    : false;

    return (
        <>
        <article className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {user && featuredListing && (
                <button
                    type="button"
className="absolute end-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:scale-105 hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200 sm:h-8 sm:w-8"                    aria-label={isFavorite ? t('favorites.remove', { defaultValue: 'Remove from favorites' }) : t('favorites.add', { defaultValue: 'Add to favorites' })}
                    title={isFavorite ? t('favorites.remove', { defaultValue: 'Remove from favorites' }) : t('favorites.add', { defaultValue: 'Add to favorites' })}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        router.post(route('favorites.toggle', featuredListing.id), {}, {
                            preserveScroll: true,
                            preserveState: true,
                        });
                    }}
                >
                    <svg
                        className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-none text-slate-600 dark:text-slate-200'}`}
                        viewBox="0 0 24 24"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                    </svg>
                </button>
            )}
            <Link
                href={featuredListing ? route('listings.show', featuredListing.id) : route('dashboard')}
                className="group block"
            >
                <div className="aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <BookCoverImage
                        src={cover}
                        alt={book.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        fallback={
                            <span className="grid h-full place-items-center text-slate-400">
                                <Icon
                                    path={paths.book}
                                    className="h-10 w-10"
                                />
                            </span>
                        }
                    />
                </div>

                <div className="p-3">
                    <p className="line-clamp-1 text-sm font-extrabold leading-5 text-slate-950 dark:text-white">
                        {book.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                        {book.author ||
                            book.subject ||
                            t(
                                'book.unknown_author',
                            )}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                        {lowest !== null ? (
                            <strong className="text-base text-slate-950 dark:text-white">
                                {money.format(
                                    lowest,
                                )}
                            </strong>
                        ) : (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                {t(
                                    'book.out_of_stock',
                                )}
                            </span>
                        )}

                        {featuredListing?.status === 'sold' || book.status === 'sold' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                {t('book.sold', { defaultValue: 'Sold' })}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></svg>
                            1 {t('book.left')}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
            {galleryImages.length > 1 && (
                <button
                    type="button"
                    onClick={() => setShowListingImages(true)}
className="absolute start-2 top-2 z-20 inline-flex min-h-7 items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200 sm:min-h-8 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-sm"     aria-label={t('book.photos', {
                        count: galleryImages.length,
                        defaultValue: `${galleryImages.length} photos`,
                    })}
                >
                    <span>{galleryImages.length}</span>
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="8" cy="10" r="1.25" />
                        <path d="m4 17 5-5 3.5 3.5 2.5-2.5 5 5" />
                    </svg>
                </button>
            )}
        </article>
        <PhotoViewer
            isOpen={showListingImages}
            onClose={() => setShowListingImages(false)}
            images={galleryImages}
            title={book.title}
        />
        </>
    );
}

function ShelfHeading({
    id,
    eyebrow,
    title,
    description,
    href,
    action,
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400">
                        {eyebrow}
                    </p>
                )}

                <h2
                    id={id}
                    className={`${eyebrow ? 'mt-1' : ''} text-lg font-extrabold leading-tight text-slate-950 dark:text-white sm:text-xl`}
                >
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>

           {href && action && (
    <Link
        href={href}
        className="shrink-0 text-sm font-bold text-indigo-700 hover:underline dark:text-indigo-300"
    >
        {action}
    </Link>
)}
        </div>
    );
}

function Notice({ tone, children }) {
    const styles = {
        info:
            'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100',
        warning:
            'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
        danger:
            'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
    };

    return (
        <p
            role="status"
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${styles[tone]}`}
        >
            {children}
        </p>
    );
}

function EmptyShelf({ t }) {
    return (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
            {t('empty.description')}
        </div>
    );
}

function Icon({ path, className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}
