import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

function DashboardIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20c.45-4 2.6-6 6.5-6s6.05 2 6.5 6" />
        </svg>
    );
}

function BooksIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
            <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
        </svg>
    );
}

function SaleIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13.8V5h8.8L20 12.2a1.1 1.1 0 0 1 0 1.6Z" />
            <circle cx="8.5" cy="9" r="1.2" />
        </svg>
    );
}
function ReportsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <path d="M5 21V4" />
            <path d="M5 4h11l-1.5 4L16 12H5" />
        </svg>
    );
}

function IssueAgentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
        >
            <path d="M12 3v3" />
            <path d="M5.5 7.5 7.6 9.6" />
            <path d="M18.5 7.5 16.4 9.6" />
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M9 14h.01" />
            <path d="M15 14h.01" />
            <path d="M9.5 17h5" />
        </svg>
    );
}

export default function AdminTabs({ active }) {
    const { t } = useTranslation('admin');

    const tabs = [
        {
            key: 'index',
            desktop: t('tabs.dashboard', {
                defaultValue: 'Dashboard',
            }),
            mobile: t('tabs.dashboard', {
                defaultValue: 'Dashboard',
            }),
            href: route('admin.index'),
            icon: DashboardIcon,
        },
        {
            key: 'users',
            desktop: t('tabs.users', {
                defaultValue: 'Users',
            }),
            mobile: t('tabs.users', {
                defaultValue: 'Users',
            }),
            href: route('admin.users'),
            icon: UsersIcon,
        },
        {
            key: 'books',
            desktop: t('tabs.books', {
                defaultValue: 'Books',
            }),
            mobile: t('tabs.books', {
                defaultValue: 'Books',
            }),
            href: route('books'),
            icon: BooksIcon,
        },
        {
            key: 'listings',
           desktop: t('tabs.books_for_sale', {
    defaultValue: 'Books for sale',
}),
mobile: t('tabs.books_for_sale', {
    defaultValue: 'For sale',
}),
            href: route('admin.listings'),
            icon: SaleIcon,
        },
        {
    key: 'reports',
    desktop: t('tabs.reports', {
        defaultValue: 'Reports',
    }),
    mobile: t('tabs.reports', {
        defaultValue: 'Reports',
    }),
    href: route('admin.reports'),
    icon: ReportsIcon,
},
        {
            key: 'issue-agent',
            desktop: t('tabs.issue_agent', {
                defaultValue: 'Issue Agent',
            }),
            mobile: t('tabs.issue_agent', {
                defaultValue: 'Agent',
            }),
            href: route('admin.issue-agent.index'),
            icon: IssueAgentIcon,
        },
    ];

    return (
        <nav
            className="
                grid
                w-full
                grid-cols-6
                sm:grid-cols-none
                gap-1
                rounded-xl
                border
                border-slate-200/80
                bg-white/95
                p-1
                shadow-sm
                backdrop-blur

                dark:border-slate-700
                dark:bg-slate-900/95

                sm:flex
                sm:rounded-2xl
                sm:p-1.5
            "
            aria-label={t('dashboard.eyebrow', {
                defaultValue: 'Administration',
            })}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = active === tab.key;

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className={`
                            flex
                            min-w-0
                            items-center
                            justify-center
                            gap-1
                            rounded-lg
                            px-0.5
                            py-2
                            text-[9px]
                            font-semibold
                            transition

                            sm:min-w-max
                            sm:gap-2
                            sm:rounded-xl
                            sm:px-4
                            sm:py-2.5
                            sm:text-sm

                            ${
                                selected
                                    ? `
                                        bg-slate-950
                                        text-white
                                        shadow-md

                                        dark:bg-white
                                        dark:text-slate-950
                                    `
                                    : `
                                        text-slate-600

                                        hover:bg-slate-100
                                        hover:text-slate-950

                                        dark:text-slate-300
                                        dark:hover:bg-slate-800
                                        dark:hover:text-white
                                    `
                            }
                        `}
                    >
                      <Icon />

<span className="hidden whitespace-nowrap sm:inline">
    {tab.desktop}
</span>
                    </Link>
                );
            })}
        </nav>
    );
}
