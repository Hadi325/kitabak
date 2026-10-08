import BookCoverImage, {
    resolveBookImageUrl,
} from '@/Components/BookCoverImage';
import AdminTabs from '@/Components/AdminTabs';
import EmptyState from '@/Components/EmptyState';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';


const grades = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    'SE',
    'SG',
    'SV',
    'LH',
];


const gradeLabels = {
    9: 'Brevet',
    10: 'Second',
    11: 'Bac1',
};

const gradeLabel = (grade) =>
    gradeLabels[String(grade)] ?? grade;

const coverUrl = (book) =>
    resolveBookImageUrl(
        book.cover_image_url ||
            book.images?.[0]?.image_path
    );

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
const ViewIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
    </svg>
);

const FilterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
);

const EditIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    </svg>
);

const TrashIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
    </svg>
);
 const AddBookIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
    >
        {/* Book */}
        <path d="M3.5 5.5c2.8-.9 5.3-.4 7.5 1.2v12c-2.2-1.6-4.7-2.1-7.5-1.2v-12Z" />
        <path d="M11 6.7c2.2-1.6 4.7-2.1 7.5-1.2v6.2" />
        <path d="M11 6.7v12" />

        {/* Plus circle */}
        <circle cx="18" cy="17" r="4" />
        <path d="M18 15v4" />
        <path d="M16 17h4" />
    </svg>
);
const ChevronIcon = () => (
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

const StatBookIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
);

const GradeIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h5" />
    </svg>
);

const LanguageIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9" />
    </svg>
);



const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M12 5v14M5 12h14" />
    </svg>
);

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
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );
        };
    }, []);

    const selected = options.find(
        (option) => option.value === value
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
                        mt-2 min-w-full max-h-[360px] overflow-y-auto
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

function StatCard({
    title,
    value,
    detail,
    icon,
    iconStyle = 'indigo',
    mobile = true,
}) {
    const iconStyles = {
        indigo:
            'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300',
        blue:
            'bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
        emerald:
            'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
        orange:
            'bg-orange-500/10 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
    };

    return (
        <article
            className={`
                ${mobile ? '' : 'hidden sm:block'}
                min-w-0 rounded-xl border border-slate-200
                bg-white p-3 shadow-sm
                dark:border-slate-800 dark:bg-slate-900
                sm:min-h-[140px] sm:rounded-2xl sm:p-5
            `}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
                    {title}
                </p>

                <div
                    className={`
                        grid h-8 w-8 shrink-0 place-items-center
                        rounded-lg
                        sm:h-12 sm:w-12 sm:rounded-xl
                        ${iconStyles[iconStyle]}
                    `}
                >
                    {icon}
                </div>
            </div>

            <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
                {value}
            </p>

            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-xs">
                {detail}
            </p>
        </article>
    );
}

function AdminBookCard({
    book,
    deletingId,
    onDelete,
    onView,
    t,
    tAdmin,
}) {
    const cover = coverUrl(book);

    const normalizedLanguage = (() => {
        const value = String(book.language || '')
            .trim()
            .toLowerCase();

        if (value === 'arabic') return 'Arabic';
        if (value === 'english') return 'English';
        if (value === 'french') return 'French';

        return null;
    })();

   return (
    <>


{/* MOBILE CARD */}
<article
    className="
        relative flex h-[112px] min-w-0
        items-stretch gap-2.5
        rounded-2xl border border-slate-200
        bg-white p-2.5 shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
        sm:hidden
    "
>
    {/* COVER */}
    <div
        className="
            h-full w-[66px] shrink-0
            overflow-hidden rounded-xl
            bg-slate-100
            dark:bg-slate-950
        "
    >
        {cover ? (
            <BookCoverImage
                src={cover}
                alt={t('books.cover_alt', {
                    title: book.title,
                })}
                className="h-full w-full object-cover"
            />
        ) : (
            <div
                className="
                    grid h-full w-full
                    place-items-center
                    text-indigo-400
                "
            >
                <StatBookIcon />
            </div>
        )}
    </div>

    {/* CONTENT */}
    <div className="flex min-w-0 flex-1 flex-col">
    {/* TITLE + LANGUAGE */}
<div className="flex min-w-0 items-start gap-1.5">
    <div className="min-w-0 flex-1">
        {/* TITLE */}
        <h2
            title={book.title}
            className="
                line-clamp-2
                text-[12px] font-black
                leading-[15px]
                text-slate-950
                dark:text-white
            "
        >
            {book.title}
        </h2>
{/* AUTHOR */}
<p
    title={
        book.author ||
        tAdmin('books.unknown_author')
    }
    className="
        mt-1 truncate
        text-[9px] font-medium
        text-slate-500
        dark:text-slate-400
    "
>
    {book.author?.trim() ||
        tAdmin('books.unknown_author')}
</p>
    </div>

    {/* LANGUAGE */}
    {normalizedLanguage && (
        <span
            className="
                shrink-0 rounded-full
                bg-emerald-50
                px-2 py-1
                text-[8px] font-bold
                text-emerald-700
                dark:bg-emerald-500/10
                dark:text-emerald-300
            "
        >
            {normalizedLanguage
    ? tAdmin(
          `books.language_${normalizedLanguage.toLowerCase()}`
      )
    : ''}
        </span>
    )}
</div>
        {/* BOTTOM ROW */}
      <div
    className="
        mt-auto flex min-w-0
        items-center justify-end gap-1
    "
>
            {/* GRADE */}
            {book.grade && (
                <span
                    className="
                        mr-auto shrink-0
                        rounded-lg bg-indigo-50
                        px-2 py-1
                        text-[8px] font-bold
                        text-indigo-600
                        dark:bg-indigo-500/15
                        dark:text-indigo-300
                    "
                >
{tAdmin('books.grade_value', {
    grade: gradeLabel(book.grade),
})}                </span>
            )}

            {/* VIEW */}
            <button
                type="button"
                onClick={() => onView(book)}
                className="
                    inline-flex h-8 shrink-0
                    items-center justify-center
                    rounded-lg bg-indigo-50
                    px-2 text-[9px] font-bold
                    text-indigo-600
                    transition
                    hover:bg-indigo-100
                    dark:bg-indigo-500/10
                    dark:text-indigo-300
                    dark:hover:bg-indigo-500/20
                "
            >
                {tAdmin('books.view')}
            </button>

            {/* EDIT */}
            <Link
                href={route('books.edit', book.id)}
                className="
                    inline-flex h-8 shrink-0
                    items-center justify-center
                    rounded-lg
                    border border-slate-200
                    bg-slate-50 px-2
                    text-[9px] font-bold
                    text-slate-700
                    transition
                    hover:bg-slate-100
                    dark:border-slate-700
                    dark:bg-slate-800
                    dark:text-slate-200
                    dark:hover:bg-slate-700
                "
            >
                {tAdmin('books.edit')}
            </Link>

            {/* DELETE */}
            <button
                type="button"
                onClick={() => onDelete(book)}
                disabled={deletingId === book.id}
                aria-label={t('actions.delete')}
                title={t('actions.delete')}
                className="
                    grid h-8 w-8 shrink-0
                    place-items-center
                    rounded-lg
                    border border-rose-200
                    bg-white text-rose-500
                    transition
                    hover:bg-rose-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    dark:border-rose-500/30
                    dark:bg-slate-900
                    dark:text-rose-400
                    dark:hover:bg-rose-500/10
                "
            >
                <TrashIcon />
            </button>
        </div>
    </div>
</article>
        {/* DESKTOP CARD */}
        <article
            className="
                group hidden min-w-0 flex-col
                overflow-hidden rounded-2xl
                border border-slate-200
                bg-white shadow-sm transition
                hover:-translate-y-0.5
                hover:border-indigo-300
                hover:shadow-md
                dark:border-slate-800
                dark:bg-slate-900
                dark:hover:border-indigo-500/50
                sm:flex
            "
        >
            <div className="flex min-h-[170px] gap-4 p-4">
                <div
                    className="
                        flex h-[145px] w-[102px]
                        shrink-0 overflow-hidden
                        rounded-xl bg-slate-100
                        dark:bg-slate-950
                    "
                >
                    {cover ? (
                        <BookCoverImage
                            src={cover}
                            alt={t('books.cover_alt', {
                                title: book.title,
                            })}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center text-indigo-400">
                            <div className="text-center">
                                <StatBookIcon />

                                <span className="mt-1 block text-[9px] font-bold">
                                    {t('books.no_cover')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col py-1">
                    <h2
                        className="
                            line-clamp-3 text-base
                            font-black leading-5
                            text-slate-950 dark:text-white
                        "
                        title={book.title}
                    >
                        {book.title}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {book.grade && (
                            <span
                                className="
                                    rounded-lg bg-indigo-50
                                    px-2.5 py-1
                                    text-[10px] font-bold
                                    text-indigo-700
                                    dark:bg-indigo-500/15
                                    dark:text-indigo-300
                                "
                            >
                                {gradeLabel(book.grade)}
                            </span>
                        )}

                        {normalizedLanguage && (
                            <span
                                className="
                                    rounded-lg bg-slate-100
                                    px-2.5 py-1
                                    text-[10px] font-bold
                                    text-slate-600
                                    dark:bg-slate-800
                                    dark:text-slate-300
                                "
                            >
                                {normalizedLanguage}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div
                className="
                    mt-auto flex items-center justify-end gap-2
                    border-t border-slate-200
                    bg-slate-50/60 p-2.5
                    dark:border-slate-800
                    dark:bg-slate-950/30
                "
            >
                <button
                    type="button"
                    onClick={() => onView(book)}
                    className="
    inline-flex h-9 flex-1
    items-center justify-center gap-1.5
                        rounded-lg border border-slate-200
                        bg-white px-2 text-xs font-bold
                        text-slate-700
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-slate-200
                    "
                ><ViewIcon />
{tAdmin('books.view')}
                </button>

                <Link
                    href={route('books.edit', book.id)}
                  className="
    inline-flex h-9 flex-1
    items-center justify-center gap-1.5
                        whitespace-nowrap rounded-lg
                        border border-slate-200
                        bg-white px-2 text-xs font-bold
                        text-slate-700
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-slate-200
                    "
                ><EditIcon />
{tAdmin('books.edit_metadata')}
                </Link>

                <button
                    type="button"
                    onClick={() => onDelete(book)}
                    disabled={deletingId === book.id}
                    aria-label={t('actions.delete')}
                    className="
                        grid h-9 w-9 shrink-0
                        place-items-center rounded-lg
                        border border-rose-200
                        bg-white text-rose-500
                        hover:bg-rose-50
                        disabled:opacity-40
                        dark:border-rose-500/30
                        dark:bg-slate-900
                        dark:text-rose-400
                        dark:hover:bg-rose-500/10
                    "
                >
                    <TrashIcon />
                </button>
            </div>
        </article>
    </>
);
}

export default function Books({
    books = { data: [], links: [], total: 0 },
    stats = {},
    filters = {},
}) {
    const { t, i18n } = useTranslation('common');
    const { t: tAdmin } = useTranslation('admin');
    const [viewingBook, setViewingBook] = useState(null);
    const resultsRef = useRef(null);
    const firstRequestRef = useRef(true);

    const isArabic =
        i18n.resolvedLanguage?.startsWith('ar') ||
        i18n.language?.startsWith('ar');

    const [query, setQuery] = useState(filters.q ?? '');

const [category, setCategory] = useState(
    filters.category ?? '',
);

const [grade, setGrade] = useState(
    filters.grade ?? '',
);
    const [language, setLanguage] = useState(
        filters.language ?? '',
    );
    const [sort, setSort] = useState(
        filters.sort ?? 'newest',
    );

const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

const [mobileCategory, setMobileCategory] =
    useState(category);

const [mobileGrade, setMobileGrade] =
    useState(grade);
    const [mobileLanguage, setMobileLanguage] =
        useState(language);
    const [mobileSort, setMobileSort] = useState(sort);
    const [deletingId, setDeletingId] = useState(null);

    const bookItems = books.data ?? [];
    const totalBooks = stats.total ?? books.total ?? 0;
    const newThisWeek = stats.new_this_week ?? 0;
    const gradeOptions = grades;
    const languageOptions = [
        'Arabic',
        'English',
        'French',
    ];

    const categoryOptions = [
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

    useEffect(() => {
        if (firstRequestRef.current) {
            firstRequestRef.current = false;
            return undefined;
        }

        const timer = window.setTimeout(() => {
          const params = {
    ...(query.trim()
        ? { q: query.trim() }
        : {}),
    ...(category ? { category } : {}),
    ...(grade ? { grade } : {}),
    ...(language ? { language } : {}),
    ...(sort !== 'newest' ? { sort } : {}),
};

          router.get(route('books'), params, {
    preserveState: true,
    preserveScroll: true,
    replace: true,
    only: ['books', 'filters'],
});
        }, 150);

        return () => window.clearTimeout(timer);
    }, [query, category, grade, language, sort]);

   const openMobileFilters = () => {
    setMobileCategory(category);
    setMobileGrade(grade);
    setMobileLanguage(language);
    setMobileSort(sort);
    setMobileFiltersOpen(true);
};

  const applyMobileFilters = () => {
    setCategory(mobileCategory);
    setGrade(mobileGrade);
    setLanguage(mobileLanguage);
    setSort(mobileSort);
    setMobileFiltersOpen(false);
        window.setTimeout(() => {
            resultsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        resultsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const removeBook = (book) => {
        if (
            !window.confirm(
                t('books.confirm_delete')
            )
        ) {
            return;
        }

        setDeletingId(book.id);

        router.delete(
            route('books.destroy', book.id),
            {
                preserveScroll: true,
                onFinish: () =>
                    setDeletingId(null),
            }
        );
    };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setGrade('');
    setLanguage('');
    setSort('newest');
};

  const hasFilters =
    query.trim() ||
    category ||
    grade ||
    language ||
    sort !== 'newest';

    return (
        <AuthenticatedLayout hideLocation>
            <Head title={tAdmin('tabs.books')} />
            <FlashMessages />

            {/* HERO */}
            <section
                className="
                    relative overflow-hidden border-b
                    border-slate-200
                    bg-gradient-to-r
                    from-indigo-50/70 via-white
                    to-blue-50/80
                    dark:border-slate-800
                    dark:from-slate-950
                    dark:via-slate-900
                    dark:to-indigo-950/40
                "
            >
                <div className="pointer-events-none absolute -start-16 -top-20 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10" />
                <div className="pointer-events-none absolute -end-16 top-10 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/10" />

                <div className="relative mx-auto max-w-7xl px-3 pt-2 sm:px-6 sm:pt-0 lg:px-8">
                    <div className="relative h-[176px] sm:h-[270px] lg:h-[300px]">
                        <div
                            className={`
                                absolute top-1/2 z-10
                                w-[58%] -translate-y-1/2
                                sm:w-[50%] lg:max-w-xl
                                ${
                                    isArabic
                                        ? 'right-0 text-right'
                                        : 'left-0 text-left'
                                }
                            `}
                        >
                            <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
                                {tAdmin(
                                    'dashboard.eyebrow'
                                )}
                            </p>

                            <h1 className="mt-1 text-[29px] font-black leading-none tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-4xl lg:text-5xl">
                                {tAdmin('tabs.books')}
                            </h1>

                          <p className="mt-2 line-clamp-3 max-w-md text-[10px] leading-[1.35] text-slate-600 dark:text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">
    {tAdmin('books.description')}
</p>
                        </div>

                        <img
                            src="/images/admin/admin-books-hero-mobile.png"
                            alt=""
                            className={`
                                absolute bottom-8
                                h-[150px] w-[45%]
                                object-contain object-bottom
                                sm:hidden
                                ${
                                    isArabic
                                        ? 'left-0'
                                        : 'right-0'
                                }
                            `}
                        />

                        <img
                            src="/images/admin/admin-books-hero.png"
                            alt=""
                            className={`
                                absolute bottom-0 hidden
                                h-full w-[50%]
                                object-contain object-bottom
                                sm:block
                                ${
                                    isArabic
                                        ? 'left-0'
                                        : 'right-0'
                                }
                            `}
                        />
                    </div>

                    <div className="relative z-20 pb-2.5 sm:pb-5">
                        <AdminTabs active="books" />
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-3 pb-24 pt-2 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
                {/* STATS */}
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
<StatCard
    title={tAdmin('books.total_books')}
    value={totalBooks}
    detail={tAdmin('books.books_in_catalog', {
        count: totalBooks,
    })}
    icon={<StatBookIcon />}
    iconStyle="indigo"
/>

<StatCard
    title={tAdmin('books.grades')}
    value={gradeOptions.length}
    detail={tAdmin('books.grades_represented')}
    icon={<GradeIcon />}
    iconStyle="blue"
    mobile={false}
/>

<StatCard
    title={tAdmin('books.languages')}
    value={languageOptions.length}
    detail={languageOptions
        .map((item) =>
            tAdmin(
                `books.language_${item.toLowerCase()}`
            )
        )
        .join(', ')}
    icon={<LanguageIcon />}
    iconStyle="emerald"
    mobile={false}
/>

<StatCard
    title={tAdmin('books.new_this_week')}
    value={newThisWeek}
    detail={tAdmin('books.books_added', {
        count: newThisWeek,
    })}
    icon={<PlusIcon />}
    iconStyle="orange"
/>
                           </section>

                {/* CONTROLS */}
                <section className="mt-3 sm:mt-6">
                    {/* DESKTOP */}
                    <div className="hidden sm:block">
                        {/* ROW 1: SEARCH + ADD BOOK */}
                        <div className="flex items-center gap-2">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="
                                    flex h-12 min-w-0 flex-1 items-center
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
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder={tAdmin(
                                        'books.search_placeholder',
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
                                    disabled={!query.trim()}
                                    aria-label={t('actions.search')}
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
                                    <SearchIcon />
                                </button>
                            </form>

                            <Link
                                href={route('add.book')}
                                className="
                                    inline-flex h-12 shrink-0
                                    items-center justify-center gap-2
                                    rounded-xl bg-indigo-600
                                    px-5 text-sm font-bold
                                    text-white shadow-sm
                                    shadow-indigo-600/20
                                    transition hover:bg-indigo-700
                                "
                            >
                                <PlusIcon />
                                <span>{t('books.add')}</span>
                            </Link>
                        </div>

                        {/* ROW 2: FILTERS */}
<div
    className={`mt-2 grid gap-2 ${
        category === 'university' || category === 'novel'
            ? 'grid-cols-3'
            : 'grid-cols-4'
    }`}
>                            <SelectControl
                                value={category}
                                onChange={(value) => {
    setCategory(value);

    if (value === 'university' || value === 'novel') {
        setGrade('');
    }
}}
                                ariaLabel="Category"
                                placeholder={t(
                                    'my_books.all_categories',
                                    {
                                        defaultValue:
                                            'All categories',
                                    },
                                )}
                                options={[
                                    {
                                        value: '',
                                        label: t(
                                            'my_books.all_categories',
                                            {
                                                defaultValue:
                                                    'All categories',
                                            },
                                        ),
                                    },
                                    ...categoryOptions,
                                ]}
                            />

{/* GRADE - SCHOOL ONLY */}
{category !== 'university' &&
    category !== 'novel' && (
        <SelectControl
            value={grade}
            onChange={setGrade}
            ariaLabel={tAdmin('books.grade')}
            placeholder={tAdmin(
                'books.all_grades',
            )}
            options={[
                {
                    value: '',
                    label: tAdmin(
                        'books.all_grades',
                    ),
                },
                ...gradeOptions.map((item) => ({
                    value: item,
                    label: gradeLabel(item),
                })),
            ]}
        />
    )}

                            <SelectControl
                                value={language}
                                onChange={setLanguage}
                                ariaLabel={tAdmin(
                                    'books.language',
                                )}
                                placeholder={tAdmin(
                                    'books.all_languages',
                                )}
                                options={[
                                    {
                                        value: '',
                                        label: tAdmin(
                                            'books.all_languages',
                                        ),
                                    },
                                    ...languageOptions.map(
                                        (item) => ({
                                            value: item,
                                            label: tAdmin(
                                                `books.language_${item.toLowerCase()}`,
                                            ),
                                        }),
                                    ),
                                ]}
                            />

                            <SelectControl
                                value={sort}
                                onChange={setSort}
                                ariaLabel={tAdmin('books.sort')}
                                placeholder={tAdmin(
                                    'books.newest_first',
                                )}
                                options={[
                                    {
                                        value: 'newest',
                                        label: tAdmin(
                                            'books.newest_first',
                                        ),
                                    },
                                    {
                                        value: 'oldest',
                                        label: tAdmin(
                                            'books.oldest_first',
                                        ),
                                    },
                                    {
                                        value: 'title',
                                        label: tAdmin(
                                            'books.title_az',
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    {/* MOBILE ROW */}
                    <div className="flex items-center gap-2 sm:hidden">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="
                                flex h-11 min-w-0 flex-1 items-center
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
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder={tAdmin(
                                    'books.search_placeholder',
                                )}
                                className="
                                    h-full min-w-0 flex-1
                                    border-0 bg-transparent px-3
                                    text-xs font-medium
                                    text-slate-700 outline-none
                                    placeholder:text-slate-500
                                    focus:border-0 focus:ring-0
                                    dark:text-white
                                    dark:placeholder:text-slate-400
                                "
                            />

                            <button
                                type="submit"
                                disabled={!query.trim()}
                                aria-label={t('actions.search')}
                                className="
                                    flex h-9 w-9 shrink-0
                                    items-center justify-center
                                    rounded-[13px]
                                    bg-gradient-to-r
                                    from-indigo-600 to-violet-600
                                    text-white
                                    disabled:opacity-40
                                "
                            >
                                <SearchIcon />
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={() => {
                                if (mobileFiltersOpen) {
                                    setMobileFiltersOpen(false);
                                } else {
                                    openMobileFilters();
                                }
                            }}
                            className="
                                inline-flex h-11 shrink-0
                                items-center gap-1.5
                                rounded-xl border
                                border-slate-200 bg-white
                                px-3 text-[11px] font-bold
                                text-slate-700 shadow-sm
                                dark:border-slate-700
                                dark:bg-slate-900
                                dark:text-slate-200
                            "
                        >
                            <FilterIcon />
                            {tAdmin('books.filters')}
                        </button>

                        <Link
                            href={route('add.book')}
                            className="
                                inline-flex h-11 shrink-0
                                items-center justify-center
                                rounded-xl bg-indigo-600
                                px-3 text-white shadow-sm
                                shadow-indigo-600/20
                                transition hover:bg-indigo-700
                            "
                        >
                            <PlusIcon />
                            <span className="hidden min-[380px]:inline">
                                {t('books.add')}
                            </span>
                        </Link>
                    </div>

                    {/* MOBILE FILTER PANEL */}
                    {mobileFiltersOpen && (
                        <div
                            className="
                                mt-2 rounded-2xl
                                border border-slate-200
                                bg-white p-2 shadow-lg
                                dark:border-slate-800
                                dark:bg-slate-900
                                sm:hidden
                            "
                        >
<div
    className={`grid gap-2 ${
        mobileCategory === 'university' ||
        mobileCategory === 'novel'
            ? 'grid-cols-1'
            : 'grid-cols-2'
    }`}
>                                <SelectControl
                                    value={mobileCategory}
                                    onChange={(value) => {
    setMobileCategory(value);

    if (value === 'university' || value === 'novel') {
        setMobileGrade('');
    }
}}
                                    ariaLabel="Category"
                                    placeholder={t(
                                        'my_books.all_categories',
                                        {
                                            defaultValue:
                                                'All categories',
                                        },
                                    )}
                                    options={[
                                        {
                                            value: '',
                                            label: t(
                                                'my_books.all_categories',
                                                {
                                                    defaultValue:
                                                        'All categories',
                                                },
                                            ),
                                        },
                                        ...categoryOptions,
                                    ]}
                                />

                            {mobileCategory !== 'university' &&
    mobileCategory !== 'novel' && (
        <SelectControl
            value={mobileGrade}
            onChange={setMobileGrade}
            ariaLabel={tAdmin(
                'books.grade',
            )}
            placeholder={tAdmin(
                'books.all_grades',
            )}
            options={[
                {
                    value: '',
                    label: tAdmin(
                        'books.all_grades',
                    ),
                },
                ...gradeOptions.map(
                    (item) => ({
                        value: item,
                        label: gradeLabel(
                            item,
                        ),
                    }),
                ),
            ]}
        />
    )}

                                <SelectControl
                                    value={mobileLanguage}
                                    onChange={setMobileLanguage}
                                    ariaLabel={tAdmin(
                                        'books.language',
                                    )}
                                    placeholder={tAdmin(
                                        'books.all_languages',
                                    )}
                                    options={[
                                        {
                                            value: '',
                                            label: tAdmin(
                                                'books.all_languages',
                                            ),
                                        },
                                        ...languageOptions.map(
                                            (item) => ({
                                                value: item,
                                                label: tAdmin(
                                                    `books.language_${item.toLowerCase()}`,
                                                ),
                                            }),
                                        ),
                                    ]}
                                />

                                <SelectControl
                                    value={mobileSort}
                                    onChange={setMobileSort}
                                    ariaLabel={tAdmin(
                                        'books.sort',
                                    )}
                                    placeholder={tAdmin(
                                        'books.newest_first',
                                    )}
                                    options={[
                                        {
                                            value: 'newest',
                                            label: tAdmin(
                                                'books.newest_first',
                                            ),
                                        },
                                        {
                                            value: 'oldest',
                                            label: tAdmin(
                                                'books.oldest_first',
                                            ),
                                        },
                                        {
                                            value: 'title',
                                            label: tAdmin(
                                                'books.title_az',
                                            ),
                                        },
                                    ]}
                                />
                            </div>

                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileCategory('');
                                        setMobileGrade('');
                                        setMobileLanguage('');
                                        setMobileSort('newest');
                                    }}
                                    className="
                                        h-10 flex-1 rounded-xl
                                        border border-indigo-200
                                        bg-indigo-50
                                        px-3 text-[11px] font-bold
                                        text-indigo-600
                                        dark:border-indigo-500/20
                                        dark:bg-indigo-500/10
                                        dark:text-indigo-300
                                    "
                                >
                                    {tAdmin(
                                        'books.clear_filters',
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={applyMobileFilters}
                                    className="
                                        h-10 flex-1 rounded-xl
                                        bg-gradient-to-r
                                        from-indigo-600
                                        to-violet-600
                                        px-3 text-[11px] font-black
                                        text-white shadow-md
                                        shadow-indigo-500/20
                                    "
                                >
                                    {tAdmin(
                                        'books.apply_filters',
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-2 flex items-center justify-between px-1">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
                            {t('books.results', {
                                count: books.total ?? 0,
                            })}
                        </p>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400 sm:text-xs"
                            >
                                {t('actions.clear')}
                            </button>
                        )}
                    </div>
                </section>

               {/* BOOKS */}
<section
    ref={resultsRef}
    className="scroll-mt-24 mt-3 sm:mt-5"
>
                    {bookItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                            {bookItems.map(
                                (book) => (
                                  <AdminBookCard
    key={book.id}
    book={book}
    deletingId={deletingId}
    onDelete={removeBook}
    onView={setViewingBook}
    t={t}
    tAdmin={tAdmin}
/>
                                )
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            title={t(
                                'books.empty_title'
                            )}
                            message={t(
                                'books.empty_description'
                            )}
                            action={
                                <Link
                                    href={route(
                                        'add.book'
                                    )}
                                    className="inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    {t('books.add')}
                                </Link>
                            }
                        />
                    )}
                </section>

                {books.links?.length > 3 && (
                    <nav
                        className="mt-6 flex flex-wrap justify-center gap-2"
                        aria-label="Pagination"
                    >
                        {books.links.map((link, index) => (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url || '#'}
                                preserveScroll
                                only={[
                                    'books',
                                    'stats',
                                    'filters',
                                ]}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                                className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${
                                    link.active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                } ${
                                    !link.url
                                        ? 'pointer-events-none opacity-40'
                                        : ''
                                }`}
                            />
                        ))}
                    </nav>
                )}
            </main>
            {viewingBook && (
    <div
        className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-slate-950/70
            p-4 backdrop-blur-sm
        "
        onClick={() => setViewingBook(null)}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-label={viewingBook.title}
            onClick={(event) => event.stopPropagation()}
            className="
                relative w-full max-w-md
                overflow-hidden rounded-2xl
                border border-slate-200
                bg-white shadow-2xl
                dark:border-slate-700
                dark:bg-slate-900
            "
        >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h2 className="min-w-0 truncate text-sm font-black text-slate-950 dark:text-white">
                    {viewingBook.title}
                </h2>

                <button
                    type="button"
                    onClick={() => setViewingBook(null)}
                    aria-label={tAdmin('books.close')}
                    className="
                        grid h-8 w-8 shrink-0
                        place-items-center rounded-lg
                        text-xl text-slate-400
                        transition hover:bg-slate-100
                        hover:text-slate-700
                        dark:hover:bg-slate-800
                        dark:hover:text-white
                    "
                >
                    ×
                </button>
            </div>

            <div className="flex max-h-[70vh] items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
                {coverUrl(viewingBook) ? (
                    <BookCoverImage
                        src={coverUrl(viewingBook)}
                        alt={viewingBook.title}
                        className="
                            max-h-[62vh]
                            max-w-full
                            rounded-xl
                            object-contain
                            shadow-lg
                        "
                    />
                ) : (
                    <div className="grid min-h-[300px] place-items-center text-center text-indigo-400">
                        <div>
                            <div className="mx-auto flex justify-center">
                                <StatBookIcon />
                            </div>

                            <p className="mt-2 text-xs font-bold">
                                {t('books.no_cover')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
        </AuthenticatedLayout>
    );
}
