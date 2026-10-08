import AdminTabs from '@/Components/AdminTabs';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link} from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';import { useTranslation } from 'react-i18next';

const UsersIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const BooksIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
);

const SaleIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13.8V5h8.8L20 12.2a1.1 1.1 0 0 1 0 1.6Z" />
        <circle cx="8.5" cy="9" r="1.2" />
    </svg>
);

const NewUsersIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M15 19a6 6 0 0 0-12 0" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
    </svg>
);

const SearchIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
    </svg>
);

const DotsIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
    </svg>
);

export default function Dashboard({
    stats = {},
    recentUsers = [],
}) {
    const { t, i18n } = useTranslation('admin');

    const isArabic =
        i18n.resolvedLanguage?.startsWith('ar') ||
        i18n.language?.startsWith('ar');

 const [search, setSearch] = useState('');
const resultsRef = useRef(null);

const [previewPhoto, setPreviewPhoto] = useState(null);
useEffect(() => {
    if (!previewPhoto) {
        return;
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setPreviewPhoto(null);
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener(
            'keydown',
            handleKeyDown
        );
    };
}, [previewPhoto]);

const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
        return recentUsers.slice(0, 3);
    }

    return recentUsers.filter((user) => {
        const name = (user.name ?? '').toLocaleLowerCase();
        const email = (user.email ?? '').toLocaleLowerCase();

        return (
            name.includes(normalizedSearch) ||
            email.includes(normalizedSearch)
        );
    });
}, [recentUsers, search]);

const scrollToResults = () => {
    window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }, 100);
};

const submitSearch = (event) => {
    event.preventDefault();

    if (!search.trim()) {
        return;
    }

    scrollToResults();
};

    const cards = [
        {
            key: 'users',
            label: t('stats.users'),
            value: stats.users ?? 0,
            change: stats.users_this_week ?? 0,
            changeText:
                (stats.users_this_week ?? 0) > 0
                    ? `+${stats.users_this_week} ${t('stats.this_week')}`
                    : t('stats.no_change'),
            href: route('admin.users'),
            icon: UsersIcon,
            iconClass:
                'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
        },
        {
            key: 'books',
            label: t('stats.books'),
            value: stats.books ?? 0,
            change: stats.books_this_week ?? 0,
            changeText:
                (stats.books_this_week ?? 0) > 0
                    ? `+${stats.books_this_week} ${t('stats.this_week')}`
                    : t('stats.no_change'),
            href: route('books'),
            icon: BooksIcon,
            iconClass:
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
        },
        {
            key: 'books_for_sale',
            label: t('stats.books_for_sale'),
            value: stats.books_for_sale ?? 0,
            change: stats.listings_this_week ?? 0,
            changeText:
                (stats.listings_this_week ?? 0) > 0
                    ? `+${stats.listings_this_week} ${t('stats.this_week')}`
                    : t('stats.no_change'),
            href: route('admin.listings'),
            icon: SaleIcon,
            iconClass:
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
        },
        {
            key: 'new_this_week',
            label: t('stats.new_this_week'),
            value: stats.users_this_week ?? 0,
            change: stats.users_this_week ?? 0,
            changeText:
                (stats.users_this_week ?? 0) > 0
                    ? `+${stats.users_this_week} ${t('stats.new_users')}`
                    : t('stats.no_new_users'),
            href: route('admin.users'),
            icon: NewUsersIcon,
            iconClass:
                'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300',
        },
    ];

    return (
        <AuthenticatedLayout hideLocation>
            <Head title={t('dashboard.title')} />

            <FlashMessages />

            {/* HERO */}
            <section
                className="
                    relative
                    overflow-hidden
                    border-b
                    border-slate-200
                    bg-gradient-to-br
                    from-indigo-50/70
                    via-white
                    to-blue-50/80

                    dark:border-slate-800
                    dark:from-slate-950
                    dark:via-slate-950
                    dark:to-indigo-950/30
                "
            >
                <div
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute
                        -left-24
                        top-4
                        h-64
                        w-64
                        rounded-full
                        bg-indigo-100/50
                        blur-3xl

                        dark:bg-indigo-500/5
                    "
                />

                <div
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute
                        -right-20
                        top-0
                        h-72
                        w-72
                        rounded-full
                        bg-blue-100/50
                        blur-3xl

                        dark:bg-blue-500/5
                    "
                />

                <div className="relative mx-auto max-w-7xl px-3 pt-2 sm:px-6 sm:pt-0 lg:px-8">
                    {/* TEXT + IMAGE */}
                    <div className="relative h-[176px] sm:h-[270px] lg:h-[300px]">
                        {/* TEXT */}
                        <div
                            className={`
                                absolute
                                top-1/2
                                z-10
                                w-[56%]
                                -translate-y-1/2

                                sm:w-[50%]
                                lg:max-w-xl

                                ${
                                    isArabic
                                        ? 'right-0 text-right'
                                        : 'left-0 text-left'
                                }
                            `}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            <p
                                className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.22em]
                                    text-indigo-600

                                    dark:text-indigo-400

                                    sm:text-xs
                                "
                            >
                                {t('dashboard.eyebrow')}
                            </p>

                            <h1
                                className="
                                    mt-1
                                    text-[29px]
                                    font-extrabold
                                    leading-none
                                    tracking-tight
                                    text-slate-950

                                    dark:text-white

                                    sm:mt-2
                                    sm:text-4xl

                                    lg:text-5xl
                                "
                            >
                                {t('dashboard.title')}
                            </h1>

                            <p
                                className="
                                    mt-2
                                    text-[10px]
                                    leading-[15px]
                                    text-slate-600

                                    dark:text-slate-300

                                    sm:mt-3
                                    sm:text-sm
                                    sm:leading-6

                                    lg:text-base
                                    lg:leading-7
                                "
                            >
                                {t('dashboard.description')}
                            </p>
                        </div>

                        {/* MOBILE IMAGE */}
                        <img
                            src="/images/admin/admin-hero-mobile.png"
                            alt=""
                            className={`
                                absolute
                                bottom-0
                                h-[150px]
                                w-[45%]
                                object-contain
                                object-bottom

                                dark:brightness-90

                                sm:hidden

                                ${
                                    isArabic
                                        ? '-left-1 object-left'
                                        : '-right-1 object-right'
                                }
                            `}
                        />

                        {/* DESKTOP IMAGE */}
                        <img
                            src="/images/admin/admin-hero-desktop.png"
                            alt=""
                            className={`
                                absolute
                                bottom-0
                                hidden
                                h-full
                                w-[50%]
                                object-contain

                                dark:brightness-90

                                sm:block

                                ${
                                    isArabic
                                        ? 'left-0 object-left'
                                        : 'right-0 object-right'
                                }
                            `}
                        />
                    </div>

                    {/* TABS INSIDE HERO */}
                    <div className="relative z-20 pb-2.5 sm:pb-5">
                        <AdminTabs active="index" />
                    </div>
                </div>
            </section>

            {/* BODY */}
            <main
                className="
                    mx-auto
                    max-w-7xl
                    px-3
                    pb-24
                    pt-2

                    sm:px-6
                    sm:pb-10
                    sm:pt-5

                    lg:px-8
                "
            >
                {/* STATS */}
                <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <Link
                                key={card.key}
                                href={card.href}
                                className="
                                    group
                                    relative
                                    h-[104px]
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-3
                                    shadow-sm
                                    transition

                                    hover:border-indigo-200
                                    hover:shadow-md

                                    dark:border-slate-800
                                    dark:bg-slate-900
                                    dark:hover:border-indigo-500/40

                                    sm:h-auto
                                    sm:min-h-[140px]
                                    sm:rounded-2xl
                                    sm:p-5
                                "
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p
                                            className="
                                                truncate
                                                text-[10px]
                                                font-semibold
                                                text-slate-500

                                                dark:text-slate-400

                                                sm:text-sm
                                            "
                                        >
                                            {card.label}
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-[24px]
                                                font-extrabold
                                                leading-none
                                                tracking-tight
                                                text-slate-950

                                                dark:text-white

                                                sm:mt-2
                                                sm:text-3xl
                                            "
                                        >
                                            {card.value}
                                        </p>
                                    </div>

                                    <span
                                        className={`
                                            grid
                                            h-8
                                            w-8
                                            shrink-0
                                            place-items-center
                                            rounded-full

                                            sm:h-10
                                            sm:w-10
                                            sm:rounded-xl

                                            ${card.iconClass}
                                        `}
                                    >
                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </span>
                                </div>

                                <span
                                    className={`
                                        absolute
                                        bottom-3
                                        left-3
                                        text-[9px]
                                        font-semibold

                                        sm:static
                                        sm:mt-4
                                        sm:block
                                        sm:text-xs

                                        ${
                                            card.change > 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-400 dark:text-slate-500'
                                        }
                                    `}
                                >
                                    {card.changeText}
                                </span>
                            </Link>
                        );
                    })}
                </section>

                {/* RECENT USERS */}
                <section
                    className="
                        mt-2
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm

                        dark:border-slate-800
                        dark:bg-slate-900

                        sm:mt-6
                        sm:rounded-2xl
                    "
                >
                    <div className="p-3 sm:p-5">
                        {/* TITLE */}
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div
                                className="
                                    grid
                                    h-8
                                    w-8
                                    shrink-0
                                    place-items-center
                                    rounded-lg
                                    bg-indigo-50
                                    text-indigo-600

                                    dark:bg-indigo-500/10
                                    dark:text-indigo-300

                                    sm:h-10
                                    sm:w-10
                                    sm:rounded-xl
                                "
                            >
                                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2
                                    className="
                                        text-[13px]
                                        font-bold
                                        leading-4
                                        text-slate-950

                                        dark:text-white

                                        sm:text-lg
                                    "
                                >
                                    {t('dashboard.recent_users')}
                                </h2>

                                <p
                                    className="
                                        mt-0.5
                                        text-[8px]
                                        leading-[11px]
                                        text-slate-500

                                        dark:text-slate-400

                                        sm:text-sm
                                        sm:leading-5
                                    "
                                >
                                    {t(
                                        'dashboard.recent_users_description',
                                    )}
                                </p>
                            </div>

                            <Link
                                href={route('admin.users')}
                                className="
                                    hidden
                                    h-10
                                    items-center
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                    transition

                                    hover:bg-slate-50

                                    dark:border-slate-700
                                    dark:text-slate-200
                                    dark:hover:bg-slate-800

                                    sm:flex
                                "
                            >
                                {t('dashboard.view_users')}
                            </Link>
                        </div>

                        {/* EXACT BOOKS-STYLE SEARCH */}
                        <div className="mt-3 w-full sm:mt-5">
                            <form
                                onSubmit={submitSearch}
                                className="
                                    flex
                                    h-11
                                    min-w-0
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
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                <span className="sr-only">
                                    {t('common.search')}
                                </span>

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder={t(
                                        'users.search_placeholder',
                                    )}
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
                                    disabled={!search.trim()}
                                    aria-label={t('common.search')}
                                    title={t('common.search')}
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
                                    <SearchIcon />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* USER RESULTS */}
                    <div
                        ref={resultsRef}
                        id="admin-user-results"
                        className="
                            scroll-mt-24
                            divide-y
                            divide-slate-100
                            border-t
                            border-slate-100

                            dark:divide-slate-800
                            dark:border-slate-800
                        "
                    >
                     {filteredUsers.length > 0 ? (
    filteredUsers.map((user) => {
                                const roles = Array.isArray(user.roles)
                                    ? user.roles
                                    : [];

                                const isAdmin = roles.some(
                                    (role) => role?.name === 'admin',
                                );

                                const initial =
                                    user.name
                                        ?.trim()
                                        ?.charAt(0)
                                        ?.toUpperCase() || '?';

                                   const photoUrl = user.profile_photo_url || null;

                                return (
                                    <Link
                                        key={user.id}
                                        href={`${route('admin.users')}#user-${user.id}`}
                                        className="
                                            flex
                                            min-h-[44px]
                                            items-center
                                            gap-2
                                            px-3
                                            py-1.5
                                            transition

                                            hover:bg-slate-50

                                            dark:hover:bg-slate-800/50

                                            sm:min-h-[58px]
                                            sm:gap-3
                                            sm:px-5
                                            sm:py-2
                                        "
                                    >
                                      {photoUrl ? (
    <button
        type="button"
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            setPreviewPhoto({
                url: photoUrl,
                name: user.name,
            });
        }}
        className="
            h-8
            w-8
            shrink-0
            overflow-hidden
            rounded-full
            ring-1
            ring-slate-200
            transition
            hover:scale-105
            hover:ring-2
            hover:ring-indigo-500

            dark:ring-slate-700

            sm:h-9
            sm:w-9
        "
        aria-label={`View ${user.name}'s profile photo`}
    >
        <img
            src={photoUrl}
            alt={user.name}
            className="h-full w-full object-cover"
        />
    </button>
) : (
    <div
        className="
            grid
            h-8
            w-8
            shrink-0
            place-items-center
            rounded-full
            bg-indigo-100
            text-[10px]
            font-bold
            text-indigo-700

            dark:bg-indigo-500/15
            dark:text-indigo-300

            sm:h-9
            sm:w-9
            sm:text-xs
        "
    >
        {initial}
    </div>
)}

                                        {/* USER */}
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className="
                                                    truncate
                                                    text-[10px]
                                                    font-semibold
                                                    text-slate-950

                                                    dark:text-white

                                                    sm:text-sm
                                                "
                                            >
                                                {user.name}
                                            </p>

                                            <p
                                                className="
                                                    truncate
                                                    text-[8px]
                                                    text-slate-400

                                                    dark:text-slate-500

                                                    sm:text-xs
                                                "
                                            >
                                                {user.email || '—'}
                                            </p>
                                        </div>

                                        {/* ROLE */}
                                        <span
                                            className={`
                                                shrink-0
                                                rounded-full
                                               inline-flex
h-6
w-16
items-center
justify-center
text-[8px]
font-bold

sm:h-7
sm:w-[72px]
sm:text-xs

                                                ${
                                                    isAdmin
                                                        ? `
                                                            bg-violet-50
                                                            text-violet-700

                                                            dark:bg-violet-500/10
                                                            dark:text-violet-300
                                                        `
                                                        : `
                                                            bg-slate-100
                                                            text-slate-600

                                                            dark:bg-slate-800
                                                            dark:text-slate-300
                                                        `
                                                }
                                            `}
                                        >
                                            {isAdmin
                                                ? t('common.admin')
                                                : t('common.user')}
                                        </span>

                                        {/* <span
                                            className="
                                                text-indigo-600

                                                dark:text-indigo-400
                                            "
                                        >
                                            <DotsIcon />
                                        </span> */}
                                    </Link>
                                );
                            })
                        ) : (
                            <div
                                className="
                                    px-4
                                    py-5
                                    text-center
                                    text-xs
                                    text-slate-500

                                    dark:text-slate-400

                                    sm:py-8
                                    sm:text-sm
                                "
                            >
                                {t('users.no_results')}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </AuthenticatedLayout>
    );


    {previewPhoto && (
    <div
        className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/85
            p-4
            backdrop-blur-sm
        "
        onClick={() => setPreviewPhoto(null)}
        role="dialog"
        aria-modal="true"
    >
        <button
            type="button"
            onClick={() => setPreviewPhoto(null)}
            className="
                absolute
                end-5
                top-5
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-2xl
                font-bold
                text-white
                transition
                hover:bg-white/20
            "
            aria-label="Close"
        >
            ×
        </button>

        <img
            src={previewPhoto.url}
            alt={previewPhoto.name}
            onClick={(event) =>
                event.stopPropagation()
            }
            className="
                max-h-[90vh]
                max-w-[90vw]
                rounded-2xl
                object-contain
                shadow-2xl
            "
        />
    </div>
)}
}