import ApplicationLogo from '@/Components/ApplicationLogo';
import BottomNavigation from '@/Components/BottomNavigation';
import Dropdown from '@/Components/Dropdown';
import GuestLocation from '@/Components/GuestLocation';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import NavLink from '@/Components/NavLink';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

const HomeIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
    </svg>
);

const BooksIcon = () => (
    <svg
        className="h-5 w-5"
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

const LoginIcon = ({ isRtl = false }) => (
    <svg
        className={`h-5 w-5 ${isRtl ? '-scale-x-100' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
    </svg>
);

export default function AuthenticatedLayout({
    header,
    children,
    compactMobile = false,
    hideFooter = false,
    hideLocation = false,
    mobileHeader = null,
}) {
    const { t, i18n } = useTranslation('common');
    const isRtl = i18n.dir() === 'rtl';
    const page = usePage();

    const user =
        page.props.auth?.user ?? null;

    const isAuthenticated =
        Boolean(user);

    const isAdmin =
        user?.roles?.includes?.('admin') ??
        false;

   const navItems = [
    {
        href: route('dashboard'),
        active: route().current('dashboard'),
        label: t('nav.home', {
            defaultValue: 'Home',
        }),
    },

    ...(isAuthenticated
        ? [
              {
                  href: route('my-books'),
                  active: route().current('my-books'),
                  label: t('nav.my_books', {
                      defaultValue: 'My books',
                  }),
              },
              {
                  href: route('favorites.index'),
                  active: route().current('favorites.*'),
                  label: t('nav.my_favorites', {
                      defaultValue: 'My favorite',
                  }),
              },
          ]
        : []),

    ...(isAdmin
        ? [
              {
                  href: route('admin.index'),
                  active: route().current('admin.*'),
                  label: t('nav.admin', {
                      defaultValue: 'Admin',
                  }),
              },
          ]
        : []),
];

    return (
<div className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">            <nav
    dir="ltr"
    className={`
        ${mobileHeader ? 'hidden lg:block' : ''}
        sticky
        top-0
        z-50
        border-b
        border-slate-200/80
        bg-white/95
        shadow-sm
        backdrop-blur-xl

        dark:border-slate-800
        dark:bg-slate-950/95
    `}
>
                <div
                    dir="ltr"
                    className="mx-auto flex h-[3.35rem] max-w-7xl items-center justify-between gap-1 px-2 sm:h-16 sm:gap-4 sm:px-6 lg:px-8"
                >
                    <div className="flex min-w-0 items-center gap-8">
                        <Link
                            href={route(
                                'dashboard',
                            )}
                            className="group flex shrink-0 items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:gap-3"
                        >
                            <ApplicationLogo className="h-8 w-8 rounded-[28%] sm:h-11 sm:w-11" />

                            <span className="block whitespace-nowrap text-lg font-extrabold tracking-tight text-slate-950 dark:text-white min-[400px]:text-xl sm:text-2xl">
                                kitabak
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1.5 lg:flex">
                            {navItems.map(
                                (item) => (
                                    <NavLink
                                        key={
                                            item.href
                                        }
                                        href={
                                            item.href
                                        }
                                        active={
                                            item.active
                                        }
                                    >
                                        {
                                            item.label
                                        }
                                    </NavLink>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                        <div className="block shrink-0 [&_button]:!h-10 [&_button]:!min-h-10 [&_button]:!px-1.5">
                            <LanguageSwitcher />
                        </div>

                        <ThemeToggle />

                        {isAuthenticated ? (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-start transition hover:border-indigo-200 hover:bg-indigo-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800 sm:h-11 sm:gap-2"
                                    >
                                       <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-indigo-600 text-sm font-bold uppercase text-white sm:h-9 sm:w-9">
    {user.profile_photo_url ? (
        <img
            src={
                user.profile_photo_url
            }
            alt=""
            className="h-full w-full object-cover"
        />
    ) : (
        user.name
            ?.charAt(0)
            ?.toUpperCase()
    )}
</span>

                                        <span className="hidden min-w-0 text-left sm:block">
                                            <span className="block max-w-28 truncate text-sm font-semibold text-slate-800 dark:text-slate-100 sm:max-w-32">
                                                {
                                                    user.name
                                                }
                                            </span>

                                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                                                {isAdmin
                                                    ? t(
                                                          'nav.admin',
                                                          {
                                                              defaultValue:
                                                                  'Admin',
                                                          },
                                                      )
                                                    : t(
                                                          'nav.profile',
                                                          {
                                                              defaultValue:
                                                                  'Profile',
                                                          },
                                                      )}
                                            </span>
                                        </span>

                                        <svg
                                            className="h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content width="48">
                                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                            {
                                                user.name
                                            }
                                        </p>

                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                            {
                                                user.email
                                            }
                                        </p>
                                    </div>

                                    <Dropdown.Link
                                        href={route(
                                            'profile.edit',
                                        )}
                                    >
                                        {t(
                                            'nav.profile',
                                            {
                                                defaultValue:
                                                    'Profile',
                                            },
                                        )}
                                    </Dropdown.Link>

                                    {isAdmin && (
                                        <Dropdown.Link
                                            href={route(
                                                'admin.index',
                                            )}
                                        >
                                            {t(
                                                'nav.admin',
                                                {
                                                    defaultValue:
                                                        'Admin',
                                                },
                                            )}
                                        </Dropdown.Link>
                                    )}

                                    <Dropdown.Link
                                        href={route(
                                            'logout',
                                        )}
                                        method="post"
                                        as="button"
                                        className="text-rose-600 dark:text-rose-400"
                                    >
                                        {t(
                                            'nav.logout',
                                            {
                                                defaultValue:
                                                    'Logout',
                                            },
                                        )}
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        ) : (
                            <Link
                                href={route(
                                    'login',
                                )}
                                className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                            >
                                <svg
                                    className={`h-4 w-4 text-slate-400 transition group-hover:text-indigo-500 ${isRtl ? '-scale-x-100' : ''}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M10 17l5-5-5-5" />
                                    <path d="M15 12H3" />
                                    <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
                                </svg>

                                <span>
                                    {t(
                                        'nav.login',
                                        {
                                            defaultValue:
                                                'Login',
                                        },
                                    )}
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
{mobileHeader && (
    <div
        className="
            sticky
            top-0
            z-50
            border-b
            border-slate-200/80
            bg-white/95
            shadow-sm
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-slate-950/95

            lg:hidden
        "
    >
        {mobileHeader}
    </div>
)}

            <GuestLocation
    showHeader={!hideLocation}
/>

            {header && (
                <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}
<main
    className={`
        flex-1
        min-h-0
        ${compactMobile ? 'pb-16 lg:pb-0' : 'pb-20 lg:pb-0'}
    `}
>
    {children}
</main>
            {isAuthenticated ? (
                <BottomNavigation />
            ) : (
                <GuestBottomNavigation />
            )}

{!hideFooter && (
    <footer
className="mb-[calc(4.75rem+env(safe-area-inset-bottom))] border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#101827] lg:mb-0">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 xl:flex xl:justify-between xl:gap-6">
                {/* Brand */}
                <div className="col-start-1 flex min-w-0 items-center gap-2 sm:gap-3">
                    <ApplicationLogo className="h-9 w-9 shrink-0 sm:h-12 sm:w-12" />
                    <div className="text-sm font-bold text-slate-950 dark:text-white sm:text-xl">
                        Kitabak
                    </div>
                </div>

{/* Kitabak benefits */}
<div className="hidden w-full min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:flex xl:w-auto xl:flex-1 xl:grid-cols-3 xl:divide-x xl:divide-slate-200 xl:gap-0 dark:xl:divide-slate-700">

    {/* Trusted Community */}
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60 xl:flex-1 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-4 xl:py-0 xl:dark:bg-transparent">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300 sm:h-10 sm:w-10">
            <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            >
                <path d="M12 3 19 6v5c0 4.8-2.8 8.1-7 10-4.2-1.9-7-5.2-7-10V6l7-3Z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        </div>

        <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('layout.trusted_community')}
            </div>

            <div className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-400">
                {t('layout.trusted_community_description')}
            </div>
        </div>
    </div>

    {/* Better Prices */}
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60 xl:flex-1 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-4 xl:py-0 xl:dark:bg-transparent">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300 sm:h-10 sm:w-10">
            <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            >
                <path d="M3 6h13v10H3Z" />
                <path d="M16 10h3l2 3v3h-5Z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
            </svg>
        </div>

        <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('layout.better_prices')}
            </div>

            <div className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-400">
                {t('layout.better_prices_description')}
            </div>
        </div>
    </div>

    {/* Sustainable */}
    <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60 sm:col-span-1 xl:flex-1 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-4 xl:py-0 xl:dark:bg-transparent">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300 sm:h-10 sm:w-10">
            <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            >
                <path d="M12 21V10" />
                <path d="M12 14C7 14 5 10 5 6c4 0 7 1 7 5" />
                <path d="M12 12c0-4 3-6 7-7 0 5-2 8-7 9" />
            </svg>
        </div>

        <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('layout.sustainable')}
            </div>

            <div className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-400">
                {t('layout.sustainable_description')}
            </div>
        </div>
    </div>
</div>

                {/* Social + copyright */}
                <div className="contents xl:flex xl:shrink-0 xl:items-center xl:gap-5">
                    <div className="col-start-2 flex items-center justify-self-center gap-2 sm:gap-3">

                        {/* Instagram */}
                        <a
                            href="https://www.instagram.com/kitabak.me?stkn=MTdsaGllN2Y4MjByaQ=="
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            title="Instagram"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white transition hover:scale-110 sm:h-9 sm:w-9"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="5"
                                />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="4"
                                />
                                <circle
                                    cx="17.5"
                                    cy="6.5"
                                    r="1"
                                    fill="currentColor"
                                    stroke="none"
                                />
                            </svg>
                        </a>

                        {/* Facebook */}
                        <a
                            href="https://www.facebook.com/share/1BuwjR3xsR/?mibextid=wwXIfr"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            title="Facebook"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition hover:scale-110 sm:h-9 sm:w-9"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v8h3.4Z" />
                            </svg>
                        </a>
                    </div>

                    <div className="hidden h-10 w-px bg-slate-200 dark:bg-slate-700 xl:block" />

                    <div className="col-start-3 whitespace-nowrap text-right text-[9px] leading-4 text-slate-600 dark:text-slate-400 sm:text-xs sm:leading-5">
                        <div className="font-medium text-slate-800 dark:text-slate-300">
                            © {new Date().getFullYear()} Kitabak
                        </div>

                        <div>
                            {t('layout.all_rights_reserved')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
)}
        </div>
    );
}

function GuestBottomNavigation() {
    const { t, i18n } = useTranslation('common');
    const isRtl = i18n.dir() === 'rtl';

    const items = [
        {
            href: route('dashboard'),
            label: t('nav.home', { defaultValue: 'Home' }),
            active:
                route().current(
                    'dashboard',
                ),
            icon: <HomeIcon />,
        },

        {
            href: route('books'),
            label: t('nav.feed', { defaultValue: 'Books' }),
            active:
                route().current('books'),
            icon: <BooksIcon />,
        },

        {
            href: route('login'),
            label: t('nav.login', { defaultValue: 'Login' }),
            active:
                route().current('login'),
            icon: <LoginIcon isRtl={isRtl} />,
        },
    ];

    return (
        <nav
            aria-label={t('nav.home', { defaultValue: 'Home' })}
            className="!hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
        >
            <div className="mx-auto grid h-[4.75rem] max-w-md grid-cols-3">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={
                            item.active
                                ? 'page'
                                : undefined
                        }
                        className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                            item.active
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400'
                        }`}
                    >
                        <span
                            className={`grid h-8 w-8 place-items-center rounded-xl ${
                                item.active
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15'
                                    : ''
                            }`}
                        >
                            {item.icon}
                        </span>

                        <span>
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
