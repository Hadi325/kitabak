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
    >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22Z" />
    </svg>
);

const StackedBooksIcon = () => (
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
        <rect x="3" y="5" width="5" height="14" rx="1" />
        <rect x="9.5" y="3" width="5" height="16" rx="1" />
        <path d="m16.5 5 3.5-1 3 13.5-3.5 1Z" />
        <path d="M2 21h20" />
        <path d="M4.5 8h2" />
        <path d="M11 7h2" />
    </svg>
);
const HeartIcon = () => (
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
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
);

const ProfileIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="7" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
);

const AdminIcon = () => (
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
        <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6Z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default function BottomNavigation() {
    const { t } = useTranslation('common');
    const user = usePage().props.auth?.user;

    if (!user) {
        return null; // Return null if user is not authenticated
    }

    const isAdmin = user?.roles?.includes('admin') ?? false;
  const navItems = [
    {
        href: route('dashboard'),
        active: route().current('dashboard'),
        label: t('nav.home', { defaultValue: 'Home' }),
        icon: <HomeIcon />,
    },


    {
        href: route('my-books'),
        active: route().current('my-books'),
        label: t('nav.my_books', { defaultValue: 'My books' }),
        icon: <StackedBooksIcon />,
    },

    {
        href: route('favorites.index'),
        active: route().current('favorites.*'),
        label: t('nav.my_favorites', { defaultValue: 'Favorites' }),
        icon: <HeartIcon />,
    },

    ...(isAdmin
        ? [
              {
                  href: route('admin.index'),
                  active: route().current('admin.*'),
                  label: t('nav.admin', { defaultValue: 'Admin' }),
                  icon: <AdminIcon />,
              },
          ]
        : []),

    ...(!isAdmin
        ? [
              {
                  href: route('profile.edit'),
                  active: route().current('profile.*'),
                  label: t('nav.profile', { defaultValue: 'Profile' }),
                  icon: <ProfileIcon />,
              },
          ]
        : []),
];
  return (
    <nav
        aria-label={t('nav.home', {
            defaultValue: 'Mobile navigation',
        })}
        className="
            fixed
            inset-x-0
            bottom-0
            z-[100]
            w-full

            border-t
            border-slate-200
            bg-white/95

            shadow-[0_-4px_20px_rgba(15,23,42,0.08)]
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-slate-950/95

            lg:hidden
        "
        style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
        }}
    >
<div className="mx-auto flex min-h-[4.75rem] w-full max-w-lg items-stretch py-2.5">
      {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                        item.active ? 'page' : undefined
                    }
                    className={`
                        relative
                        flex
                        min-w-0
                        flex-1
                        flex-col
                        items-center
                        justify-center
                        gap-1.5
                        px-1
                        text-[clamp(10px,2.8vw,12px)]
                        font-semibold
                        [&_svg]:h-[1.45rem]
                        [&_svg]:w-[1.45rem]
                        transition-colors

                        ${
                            item.active
                                ? `
                                    text-indigo-600
                                    dark:text-indigo-400
                                `
                                : `
                                    text-slate-500
                                    hover:text-slate-900

                                    dark:text-slate-400
                                    dark:hover:text-white
                                `
                        }
                    `}
                >
                    <span
                        className={`
                            grid
                            h-10
                            w-10
                            place-items-center
                            rounded-lg
                            transition-all

                            ${
                                item.active
                                    ? `
                                        bg-indigo-100
                                        dark:bg-indigo-500/20
                                    `
                                    : ''
                            }
                        `}
                    >
                        {item.icon}
                    </span>

                   <span
    className="
        block
        w-full
        overflow-hidden
        px-0.5
        pb-0.5
        text-center
        leading-[1.35]
        whitespace-nowrap
    "
>
    {item.label}
</span>
                </Link>
            ))}
        </div>
    </nav>
);
}
