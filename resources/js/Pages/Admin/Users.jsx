import AdminTabs from '@/Components/AdminTabs';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import {
    Head,
    Link,
    useForm,
    usePage,
} from '@inertiajs/react';

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useTranslation } from 'react-i18next';

export default function Users({
    users,
    stats = {},
    filters = {},
}) {
    const { t, i18n } = useTranslation('admin');
    const { auth } = usePage().props;

    const [q, setQ] = useState(filters?.q || '');
   const [roleFilter, setRoleFilter] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');
const [sortOrder, setSortOrder] = useState('newest');
const [roleMenuOpen, setRoleMenuOpen] = useState(false);
const [statusMenuOpen, setStatusMenuOpen] = useState(false);
const [sortMenuOpen, setSortMenuOpen] = useState(false);

    // Only one user action menu can be open.
    const [actionMenuUserId, setActionMenuUserId] =
        useState(null);

  const desktopRoleMenuRef = useRef(null);
const desktopStatusMenuRef = useRef(null);
const desktopSortMenuRef = useRef(null);
    const { patch, processing } = useForm();

    const isArabic =
        i18n.resolvedLanguage?.startsWith('ar') ||
        i18n.language?.startsWith('ar');

    /*
     * Instant local filtering.
     */
    const filteredUsers = useMemo(() => {
        const normalized = q
            .trim()
            .toLocaleLowerCase(i18n.language);

        let result = users.data.filter((user) => {
            const isAdmin = user.roles?.some(
                (role) => role.name === 'admin'
            );

            const matchesRole =
                roleFilter === 'all' ||
                (roleFilter === 'admin' && isAdmin) ||
                (roleFilter === 'user' && !isAdmin);

                const matchesStatus =
    statusFilter === 'all' ||
    (statusFilter === 'active' && user.is_online) ||
    (statusFilter === 'offline' && !user.is_online);

           if (!matchesRole || !matchesStatus) {
    return false;
}

            if (!normalized) {
                return true;
            }



            const content = [
                user.name,
                user.email,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase(i18n.language);

            return content.includes(normalized);
        });

        result = [...result].sort((a, b) => {
            const aDate = new Date(
                a.created_at
            ).getTime();

            const bDate = new Date(
                b.created_at
            ).getTime();

            if (sortOrder === 'oldest') {
                return aDate - bDate;
            }

            return bDate - aDate;
        });

        return result;
    }, [
        users.data,
        q,
        roleFilter,
        statusFilter,
        sortOrder,
        i18n.language,
    ]);

    /*
     * Close dropdowns when clicking outside.
     */
    useEffect(() => {
    const hash = window.location.hash;

    if (!hash.startsWith('#user-')) {
        return;
    }

    const userId = hash.replace('#user-', '');

    const scrollToUser = () => {
        const isMobile =
            window.matchMedia('(max-width: 639px)').matches;

        const element = document.getElementById(
            isMobile
                ? `user-mobile-${userId}`
                : `user-${userId}`
        );

        if (!element) {
            return;
        }

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    };

    const timeout = window.setTimeout(
        scrollToUser,
        150
    );

    return () => window.clearTimeout(timeout);
}, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickedDesktopRole =
                desktopRoleMenuRef.current?.contains(
                    event.target
                );

            const clickedSort =
                desktopSortMenuRef.current?.contains(
                    event.target
                );

            const clickedActionMenu =
                event.target.closest(
                    '[data-user-action-menu]'
                );

            if (!clickedDesktopRole) {
                setRoleMenuOpen(false);
            }

            if (!clickedSort) {
                setSortMenuOpen(false);
            }

            if (!clickedActionMenu) {
                setActionMenuUserId(null);
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

    const scrollToResults = () => {
        window.setTimeout(() => {
            const target =
                window.innerWidth < 640
                    ? document.getElementById(
                          'admin-user-results-mobile'
                      )
                    : document.getElementById(
                          'admin-user-results'
                      );

            target?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 60);
    };

    const submitSearch = (event) => {
        event.preventDefault();

        if (!q.trim()) {
            return;
        }

        scrollToResults();
    };

    const selectRole = (value) => {
        setRoleFilter(value);
        setRoleMenuOpen(false);
        setActionMenuUserId(null);
    };

    const selectSort = (value) => {
        setSortOrder(value);
        setSortMenuOpen(false);
        setActionMenuUserId(null);
    };

    /*
     * MOBILE STAT CARDS
     *
     * Total users:
     *   -> all users
     *   -> scroll to user list
     *
     * Administrators:
     *   -> admins only
     *   -> scroll to user list
     */
    const showAllUsers = () => {
        setRoleFilter('all');
        setActionMenuUserId(null);
        scrollToResults();
    };

    const showAdministrators = () => {
        setRoleFilter('admin');
        setActionMenuUserId(null);
        scrollToResults();
    };

    const toggleAdmin = (user) => {
        const isAdmin = user.roles?.some(
            (role) => role.name === 'admin'
        );

        const message = isAdmin
            ? t('users.confirm_demote', {
                  name: user.name,
              })
            : t('users.confirm_promote', {
                  name: user.name,
              });

        if (!window.confirm(message)) {
            return;
        }

        setActionMenuUserId(null);

        patch(
            route(
                'admin.users.toggle-admin',
                user.id
            ),
            {
                preserveScroll: true,
            }
        );
    };

    const roleLabel =
        roleFilter === 'admin'
            ? t('common.role_admin')
            : roleFilter === 'user'
              ? t('common.role_user')
              : t('users.all_roles');

              const statusLabel =
    statusFilter === 'active'
        ? t('users.active', {
              defaultValue: 'Active',
          })
        : statusFilter === 'offline'
          ? t('users.offline', {
                defaultValue: 'Offline',
            })
          : t('users.all_statuses', {
                defaultValue: 'All statuses',
            });

    const sortLabel =
        sortOrder === 'oldest'
            ? t('users.oldest_first')
            : t('users.newest_first');

    return (
        <AuthenticatedLayout hideLocation>
            <Head title={t('users.title')} />

            <FlashMessages />

            {/* =================================================
                HERO
            ================================================= */}
            <section
                className="
                    relative
                    overflow-visible
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

                <div
                    className="
                        relative
                        mx-auto
                        max-w-7xl
                        px-3
                        pt-2

                        sm:px-6
                        sm:pt-0

                        lg:px-8
                    "
                >
                    <div
                        className="
                            relative
                            h-[176px]

                            sm:h-[270px]

                            lg:h-[300px]
                        "
                    >
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
                            dir={
                                isArabic
                                    ? 'rtl'
                                    : 'ltr'
                            }
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
                                {t(
                                    'dashboard.eyebrow'
                                )}
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
                                {t('users.title')}
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
                                {t(
                                    'users.description'
                                )}
                            </p>
                        </div>

                        {/* MOBILE IMAGE */}
                        <img
                            src="/images/admin/admin-users-hero-mobile.png"
                            alt=""
                            aria-hidden="true"
                            className={`
                                pointer-events-none
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
                            src="/images/admin/admin-users-hero-desktop.png"
                            alt=""
                            aria-hidden="true"
                            className={`
                                pointer-events-none
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

                    {/* ADMIN TABS */}
                    <div
                        className="
                            relative
                            z-20
                            pb-2.5

                            sm:pb-5
                        "
                    >
                        <AdminTabs active="users" />
                    </div>
                </div>
            </section>

            {/* =================================================
                CONTENT
            ================================================= */}
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
                {/* =================================================
                    MOBILE STATS
                ================================================= */}
                <section
                    className="
                        mb-2
                        grid
                        grid-cols-2
                        gap-2

                        sm:hidden
                    "
                >
                    <MobileStatCard
                        type="users"
                        label={t(
                            'stats.total_users',
                            {
                                defaultValue:
                                    'Total users',
                            }
                        )}
                        value={
                            stats.total_users ?? 0
                        }
                        active={
                            roleFilter === 'all'
                        }
                        onClick={showAllUsers}
                    />

                    <MobileStatCard
                        type="admin"
                        label={t(
                            'stats.administrators',
                            {
                                defaultValue:
                                    'Administrators',
                            }
                        )}
                        value={
                            stats.administrators ??
                            0
                        }
                        active={
                            roleFilter === 'admin'
                        }
                        onClick={
                            showAdministrators
                        }
                    />
                </section>

                {/* =================================================
                    DESKTOP CONTROLS
                ================================================= */}
                <div
                    className="
                        relative
                        z-40
                        mb-4
                        hidden
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-3
                        shadow-sm

                        dark:border-slate-800
                        dark:bg-slate-900

                        sm:flex
                    "
                >
                    {/* SEARCH */}
                    <form
                        onSubmit={submitSearch}
                        className="
                            flex
                            h-12
                            min-w-0
                            flex-1
                            items-center
                            overflow-hidden
                            rounded-xl
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
                        "
                    >
                        <input
                            type="text"
                            value={q}
                            onChange={(event) =>
                                setQ(
                                    event.target.value
                                )
                            }
                            placeholder={t(
                                'users.search_placeholder'
                            )}
                            autoComplete="off"
                            className="
                                h-full
                                min-w-0
                                flex-1
                                appearance-none
                                border-0
                                bg-transparent
                                px-4
                                text-sm
                                font-medium
                                text-slate-700
                                outline-none
                                shadow-none

                                placeholder:text-slate-500

                                focus:border-0
                                focus:bg-transparent
                                focus:outline-none
                                focus:ring-0

                                dark:border-0
                                dark:bg-transparent
                                dark:text-white
                                dark:placeholder:text-slate-400
                                dark:focus:bg-transparent
                                dark:focus:ring-0
                            "
                        />

                        <button
                            type="submit"
                            disabled={!q.trim()}
                            aria-label={t(
                                'common.search'
                            )}
                            title={t(
                                'common.search'
                            )}
                            className="
                                flex
                                h-10
                                w-10
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
                            "
                        >
                            <SearchIcon />
                        </button>
                    </form>

                    {/* ROLE */}
                    <CustomDropdown
                        refObject={
                            desktopRoleMenuRef
                        }
                        open={roleMenuOpen}
                        onToggle={() => {
                            setRoleMenuOpen(
                                (value) => !value
                            );
                            setSortMenuOpen(false);
                            setActionMenuUserId(
                                null
                            );
                        }}
                        label={roleLabel}
                        icon={<UsersFilterIcon />}
                        width="w-[165px]"
                    >
                        <DropdownItem
                            active={
                                roleFilter === 'all'
                            }
                            onClick={() =>
                                selectRole('all')
                            }
                        >
                            {t('users.all_roles')}
                        </DropdownItem>

                        <DropdownItem
                            active={
                                roleFilter ===
                                'admin'
                            }
                            onClick={() =>
                                selectRole('admin')
                            }
                        >
                            {t(
                                'common.role_admin'
                            )}
                        </DropdownItem>

                        <DropdownItem
                            active={
                                roleFilter ===
                                'user'
                            }
                            onClick={() =>
                                selectRole('user')
                            }
                        >
                            {t(
                                'common.role_user'
                            )}
                        </DropdownItem>
                    </CustomDropdown>

                    {/* SORT */}
                    <CustomDropdown
                        refObject={
                            desktopSortMenuRef
                        }
                        open={sortMenuOpen}
                        onToggle={() => {
                            setSortMenuOpen(
                                (value) => !value
                            );
                            setRoleMenuOpen(false);
                            setActionMenuUserId(
                                null
                            );
                        }}
                        label={sortLabel}
                        icon={<SortIcon />}
                        width="w-[190px]"
                    >
                        <DropdownItem
                            active={
                                sortOrder ===
                                'newest'
                            }
                            onClick={() =>
                                selectSort(
                                    'newest'
                                )
                            }
                        >
                            {t(
                                'users.newest_first'
                            )}
                        </DropdownItem>

                        <DropdownItem
                            active={
                                sortOrder ===
                                'oldest'
                            }
                            onClick={() =>
                                selectSort(
                                    'oldest'
                                )
                            }
                        >
                            {t(
                                'users.oldest_first'
                            )}
                        </DropdownItem>
                    </CustomDropdown>

                {/* STATUS */}
<CustomDropdown
    refObject={desktopStatusMenuRef}
    open={statusMenuOpen}
    onToggle={() => {
        setStatusMenuOpen(
            (value) => !value
        );
        setRoleMenuOpen(false);
        setSortMenuOpen(false);
        setActionMenuUserId(null);
    }}
    label={statusLabel}
    icon={<StatusFilterIcon />}
    width="w-[165px]"
>
    <DropdownItem
        active={statusFilter === 'all'}
        onClick={() => {
            setStatusFilter('all');
            setStatusMenuOpen(false);
        }}
    >
        {t('users.all_statuses', {
            defaultValue: 'All statuses',
        })}
    </DropdownItem>

    <DropdownItem
        active={statusFilter === 'active'}
        onClick={() => {
            setStatusFilter('active');
            setStatusMenuOpen(false);
        }}
    >
        {t('users.active', {
            defaultValue: 'Active',
        })}
    </DropdownItem>

    <DropdownItem
        active={statusFilter === 'offline'}
        onClick={() => {
            setStatusFilter('offline');
            setStatusMenuOpen(false);
        }}
    >
        {t('users.offline', {
            defaultValue: 'Offline',
        })}
    </DropdownItem>
</CustomDropdown>
                </div>

                {/* =================================================
                    MOBILE SEARCH
                ================================================= */}
                <div
                    className="
                        relative
                        z-40
                        mb-2
                        grid
                        grid-cols-[minmax(0,1fr)_auto]
                        items-center
                        gap-2

                        sm:hidden
                    "
                >
                    <form
                        onSubmit={submitSearch}
                        className="
                            flex
                            h-11
                            min-w-0
                            items-center
                            overflow-hidden
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            p-1
                            shadow-sm

                            focus-within:border-violet-300
                            focus-within:ring-2
                            focus-within:ring-violet-200/40

                            dark:border-slate-700
                            dark:bg-slate-900
                            dark:focus-within:border-violet-500
                            dark:focus-within:ring-violet-500/20
                        "
                    >
                        <input
                            type="text"
                            value={q}
                            onChange={(event) =>
                                setQ(
                                    event.target.value
                                )
                            }
                            placeholder={t(
                                'users.search_placeholder'
                            )}
                            autoComplete="off"
                            className="
                                h-full
                                w-0
                                min-w-0
                                flex-1
                                appearance-none
                                border-0
                                bg-transparent
                                px-2
                                text-[9px]
                                font-medium
                                text-slate-700
                                outline-none
                                shadow-none

                                placeholder:text-slate-400

                                focus:border-0
                                focus:bg-transparent
                                focus:outline-none
                                focus:ring-0

                                dark:bg-transparent
                                dark:text-white
                                dark:placeholder:text-slate-500
                                dark:focus:bg-transparent
                                dark:focus:ring-0
                            "
                        />

                        <button
                            type="submit"
                            disabled={!q.trim()}
                            aria-label={t(
                                'common.search'
                            )}
                            title={t(
                                'common.search'
                            )}
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg

                                bg-gradient-to-r
                                from-indigo-600
                                to-violet-600
                                text-white

                                shadow-sm
                                shadow-indigo-500/20
                                transition

                                active:scale-95

                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                disabled:shadow-none

                                dark:from-indigo-500
                                dark:to-violet-500
                            "
                        >
                            <SearchIcon />
                        </button>
                    </form>

                {/* STATUS FILTER */}
<div className="w-[128px] shrink-0">
    <select
        value={statusFilter}
        onChange={(event) => {
            setStatusFilter(event.target.value);
            setActionMenuUserId(null);
        }}
        aria-label={t('users.status')}
        className="
            h-11
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3
            text-[10px]
            font-semibold
            text-slate-700
            shadow-sm

            focus:border-violet-400
            focus:outline-none
            focus:ring-2
            focus:ring-violet-200/50

            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-200
            dark:focus:border-violet-500
            dark:focus:ring-violet-500/20
        "
    >
        <option value="all">
            {t('users.all_statuses', {
                defaultValue: 'All statuses',
            })}
        </option>

        <option value="active">
            {t('users.active', {
                defaultValue: 'Active',
            })}
        </option>

        <option value="offline">
            {t('users.offline', {
                defaultValue: 'Offline',
            })}
        </option>
    </select>
</div>
                </div>

                {/* =================================================
                    USERS CARD
                ================================================= */}
                <section
                    className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-2
                        shadow-sm

                        dark:border-slate-800
                        dark:bg-slate-900

                        sm:rounded-2xl
                        sm:p-0
                    "
                >
                    {/* MOBILE HEADING */}
                    <div
                        className="
                            mb-1
                            flex
                            items-center
                            gap-2
                            px-1
                            pb-2

                            sm:hidden
                        "
                    >
                        <div
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-indigo-50
                                text-indigo-600

                                dark:bg-indigo-500/10
                                dark:text-indigo-300
                            "
                        >
                            <UsersIcon />
                        </div>

                        <div className="min-w-0">
                            <h2
                                className="
                                    text-xs
                                    font-extrabold
                                    leading-tight
                                    text-slate-950

                                    dark:text-white
                                "
                            >
                                {t(
                                    'users.title'
                                )}
                            </h2>

                            <p
                                className="
                                    mt-0.5
                                    truncate
                                    text-[9px]
                                    text-slate-500

                                    dark:text-slate-400
                                "
                            >
                                {t(
                                    'users.list_description',
                                    {
                                        defaultValue:
                                            'A list of all registered users on Kitabak.',
                                    }
                                )}
                            </p>
                        </div>
                    </div>

                    {/* =================================================
                        DESKTOP TABLE
                    ================================================= */}
                  {/* =================================================
    DESKTOP TABLE
================================================= */}
<div
    id="admin-user-results"
    className="
        hidden
        scroll-mt-6
        overflow-visible
        rounded-2xl
        border
        border-slate-200

        dark:border-slate-800

        sm:block
    "
>
   <table
    dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    className="
        min-w-full
        table-fixed
        divide-y
        divide-slate-200
        text-sm
        dark:divide-slate-800
    "
>
   <thead
    className="
        bg-slate-50/80
        text-[11px]
        font-bold
        uppercase
        tracking-wide
        text-slate-500

        dark:bg-slate-950/60
        dark:text-slate-400
    "
>
    <tr>
        <th className="w-[20%] px-5 py-3 text-start">
            {t('users.name')}
        </th>

        <th className="w-[25%] px-5 py-3 text-start">
            {t('users.email')}
        </th>

        <th className="w-[12%] px-5 py-3 text-start">
            {t('users.roles')}
        </th>

        <th className="w-[13%] px-5 py-3 text-start">
            {t('users.status')}
        </th>

        <th className="w-[15%] px-5 py-3 text-start">
            {t('users.joined')}
        </th>

        <th className="w-[15%] px-5 py-3 text-end">
            {t('users.actions', {
                defaultValue: t('common.actions'),
            })}
        </th>
    </tr>
</thead>

        <tbody
            className="
                divide-y
                divide-slate-100

                dark:divide-slate-800
            "
        >
            {filteredUsers.map((user) => (
                <DesktopUserRow
                    key={user.id}
                    user={user}
                    auth={auth}
                    processing={processing}
                    toggleAdmin={toggleAdmin}
                    t={t}
                    i18n={i18n}
                    menuOpen={
                        actionMenuUserId === user.id
                    }
                    setActionMenuUserId={
                        setActionMenuUserId
                    }
                />
            ))}

            {filteredUsers.length === 0 && (
                <tr>
                    <td
                        colSpan={6}
                        className="
                            px-4
                            py-10
                            text-center
                            text-slate-400
                        "
                    >
                        {t('users.no_results', {
                            defaultValue:
                                'No users found.',
                        })}
                    </td>
                </tr>
            )}
        </tbody>
    </table>
</div>

                    {/* =================================================
                        MOBILE USERS
                    ================================================= */}
                    <div
                        id="admin-user-results-mobile"
                        className="
                            scroll-mt-6
                            divide-y
                            divide-slate-100
                            border-t
                            border-slate-100

                            dark:divide-slate-800
                            dark:border-slate-800

                            sm:hidden
                        "
                    >
                        {filteredUsers.map(
                            (user) => (
                                <MobileUserRow
                                    key={user.id}
                                    user={user}
                                    auth={auth}
                                    processing={
                                        processing
                                    }
                                    toggleAdmin={
                                        toggleAdmin
                                    }
                                    t={t}
                                    i18n={i18n}
                                    menuOpen={
                                        actionMenuUserId ===
                                        user.id
                                    }
                                    setActionMenuUserId={
                                        setActionMenuUserId
                                    }
                                />
                            )
                        )}

                        {filteredUsers.length ===
                            0 && (
                            <div
                                className="
                                    py-8
                                    text-center
                                    text-xs
                                    text-slate-400
                                "
                            >
                                {t(
                                    'users.no_results',
                                    {
                                        defaultValue:
                                            'No users found.',
                                    }
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {users.links?.length > 3 && (
                    <Pagination
                        links={users.links}
                    />
                )}
            </main>
        </AuthenticatedLayout>
    );
}

/* =========================================================
   NORMAL CUSTOM DROPDOWN
========================================================= */

function CustomDropdown({
    refObject,
    open,
    onToggle,
    label,
    icon,
    width,
    children,
}) {
    return (
        <div
            ref={refObject}
            className={`relative shrink-0 ${width}`}
        >
            <button
                type="button"
                onClick={onToggle}
                className="
                    flex
                    h-12
                    w-full
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-700
                    shadow-sm
                    transition

                    hover:border-slate-300
                    hover:bg-slate-50

                    focus:outline-none
                    focus:ring-2
                    focus:ring-violet-200/60

                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-slate-200
                    dark:hover:border-slate-600
                    dark:hover:bg-slate-900
                    dark:focus:ring-violet-500/20
                "
            >
                <span
                    className="
                        shrink-0
                        text-slate-500

                        dark:text-slate-400
                    "
                >
                    {icon}
                </span>

                <span className="min-w-0 flex-1 truncate text-left">
                    {label}
                </span>

                <ChevronIcon open={open} />
            </button>

            {open && (
                <DropdownPanel>
                    {children}
                </DropdownPanel>
            )}
        </div>
    );
}

function DropdownPanel({
    children,
    mobile = false,
}) {
    return (
        <div
            className={`
                absolute
                top-[calc(100%+8px)]
                z-[100]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-1.5
                shadow-xl
                shadow-slate-900/10

                dark:border-slate-700
                dark:bg-slate-900
                dark:shadow-black/30

                ${
                    mobile
                        ? 'right-0 w-44'
                        : 'left-0 w-full'
                }
            `}
        >
            {children}
        </div>
    );
}

function DropdownItem({
    active,
    onClick,
    children,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                px-3
                py-2.5
                text-left
                text-sm
                font-semibold
                transition

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
            <span>{children}</span>

            {active && <CheckIcon />}
        </button>
    );
}

/* =========================================================
   USER ACTION DROPDOWN
   Used on BOTH desktop and mobile
========================================================= */

function UserActionMenu({
    user,
    isAdmin,
    isSelf,
    processing,
    menuOpen,
    setActionMenuUserId,
    toggleAdmin,
    t,
    i18n,
}) {
    return (
        <div
            className="relative shrink-0"
            data-user-action-menu
        >
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();

                    setActionMenuUserId(
                        menuOpen
                            ? null
                            : user.id
                    );
                }}
                aria-label={t(
                    'users.more_actions',
                    {
                        defaultValue:
                            'More actions',
                    }
                )}
                title={t(
                    'users.more_actions',
                    {
                        defaultValue:
                            'More actions',
                    }
                )}
                className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-indigo-600
                    transition

                    hover:bg-indigo-50
                    hover:text-indigo-700

                    active:scale-95

                    dark:text-indigo-400
                    dark:hover:bg-indigo-500/10
                    dark:hover:text-indigo-300
                "
            >
                <MoreIcon />
            </button>

            {menuOpen && (
               <div
    className={`
        absolute
        top-full
        z-[100]
        mt-2
        w-52
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-2
        shadow-xl
        shadow-slate-900/10

        dark:border-slate-700
        dark:bg-slate-900
        dark:shadow-black/30

        ${
            i18n.language === 'ar'
                ? 'left-0'
                : 'right-0'
        }
    `}
>
                    <div
                        className="
                            px-3
                            pb-2
                            pt-1.5
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-[0.12em]
                            text-slate-400

                            dark:text-slate-500
                        "
                    >
                        {t(
                            'common.actions',
                            {
                                defaultValue:
                                    'Actions',
                            }
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={
                            processing ||
                            isSelf
                        }
                        onClick={() => {
                            if (
                                processing ||
                                isSelf
                            ) {
                                return;
                            }

                            toggleAdmin(user);
                        }}
                        className="
                            flex
                            w-full
                            items-center
                            gap-2
                            rounded-xl
                            px-3
                            py-2.5
                            text-left
                            text-xs
                            font-semibold
                            text-slate-700
                            transition

                            hover:bg-indigo-50
                            hover:text-indigo-700

                            disabled:cursor-not-allowed
                            disabled:opacity-40

                            dark:text-slate-200
                            dark:hover:bg-indigo-500/10
                            dark:hover:text-indigo-300
                        "
                    >
                        <UserRoleIcon
                            demote={isAdmin}
                        />

                        <span>
                            {isAdmin
                                ? t(
                                      'users.demote_to_user',
                                      {
                                          defaultValue:
                                              'Demote to user',
                                      }
                                  )
                                : t(
                                      'users.promote_to_admin',
                                      {
                                          defaultValue:
                                              'Promote to admin',
                                      }
                                  )}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   DESKTOP ROW
========================================================= */
function DesktopUserRow({
    user,
    auth,
    processing,
    toggleAdmin,
    t,
    i18n,
    menuOpen,
    setActionMenuUserId,
}) {
    const isAdmin = user.roles?.some(
        (role) => role.name === 'admin'
    );

    const isSelf =
        auth?.user?.id === user.id;

    return (
        <tr
            id={`user-${user.id}`}
            className="
                transition
                hover:bg-slate-50/80

                dark:hover:bg-slate-800/60
            "
        >
            {/* NAME */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <Avatar user={user} />

                    <Link
                        href={route(
                            'users.show',
                            user.id
                        )}
                        className="
                            truncate
                            font-semibold
                            text-slate-900
                            transition

                            hover:text-indigo-600

                            dark:text-white
                            dark:hover:text-indigo-400
                        "
                    >
                        {user.name}
                    </Link>
                </div>
            </td>

            {/* EMAIL */}
            <td
                className="
                    truncate
                    px-4
                    py-3
                    text-slate-600

                    dark:text-slate-300
                "
            >
                {user.email || '—'}
            </td>

            {/* ROLE */}
            <td className="px-4 py-3">
                <RoleBadge
                    isAdmin={isAdmin}
                    t={t}
                />
            </td>

            {/* STATUS */}
            <td className="px-4 py-3">
                <ActiveBadge
    t={t}
    isOnline={user.is_online}
/>
            </td>

            {/* JOINED */}
            <td
                className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-slate-500

                    dark:text-slate-400
                "
            >
                {new Date(
                    user.created_at
                ).toLocaleDateString(
                    i18n.language
                )}
            </td>

          {/* ACTIONS */}
<td className="px-4 py-3">
    <div className="flex items-center justify-end">
        <button
            type="button"
            disabled={processing || isSelf}
            onClick={() => toggleAdmin(user)}
            className={`
                inline-flex
                items-center
                justify-center
                gap-2
                whitespace-nowrap
h-7
w-[150px]
rounded-full
px-3
text-[10px]  font-semibold
                transition

                disabled:cursor-not-allowed
                disabled:opacity-40

                ${
                    isAdmin
                        ? `
                            bg-slate-100
                            text-slate-600
                            hover:bg-slate-200

                            dark:bg-slate-800
                            dark:text-slate-300
                            dark:hover:bg-slate-700
                        `
                        : `
                            bg-indigo-50
                            text-indigo-600
                            hover:bg-indigo-100

                            dark:bg-indigo-500/10
                            dark:text-indigo-300
                            dark:hover:bg-indigo-500/20
                        `
                }
            `}
        >
            <UserRoleIcon demote={isAdmin} />

            <span>
                {isAdmin
                    ? t('users.demote_to_user', {
                          defaultValue: 'Demote to user',
                      })
                    : t('users.promote_to_admin', {
                          defaultValue: 'Promote to admin',
                      })}
            </span>
        </button>
    </div>
</td>
        </tr>
    );
}

/* =========================================================
   MOBILE ROW
========================================================= */

function MobileUserRow({
    user,
    auth,
    processing,
    toggleAdmin,
    t,
    i18n,
    menuOpen,
    setActionMenuUserId,
}) {
    const isAdmin = user.roles?.some(
        (role) => role.name === 'admin'
    );

    const isSelf =
        auth?.user?.id === user.id;

    return (
        <div
        id={`user-mobile-${user.id}`}
            className="
                relative
                flex
                min-h-[60px]
                items-center
                gap-2
                px-1
                py-2.5
            "
        >
            <Avatar
                user={user}
                mobile
            />

            {/* NAME + EMAIL */}
            <div className="min-w-0 flex-1">
                <Link
                    href={route(
                        'users.show',
                        user.id
                    )}
                    className="
                        block
                        truncate
                        text-[10px]
                        font-bold
                        leading-tight
                        text-slate-900

                        dark:text-white
                    "
                >
                    {user.name}
                </Link>

                <p
                    className="
                        mt-0.5
                        truncate
                        text-[8px]
                        leading-tight
                        text-slate-500

                        dark:text-slate-400
                    "
                >
                    {user.email || '—'}
                </p>
            </div>

            {/* ROLE */}
            <RoleBadge
                isAdmin={isAdmin}
                t={t}
                mobile
            />

            {/* ACTIVE */}
         <ActiveBadge
    t={t}
    isOnline={user.is_online}
    mobile
/>

          {/* PROMOTE / DEMOTE */}
<button
    type="button"
    disabled={processing || isSelf}
    onClick={() => toggleAdmin(user)}
    aria-label={
        isAdmin
            ? t('users.demote_to_user', {
                  defaultValue: 'Demote to user',
              })
            : t('users.promote_to_admin', {
                  defaultValue: 'Promote to admin',
              })
    }
    className={`
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-full
        transition

        disabled:cursor-not-allowed
        disabled:opacity-40

        ${
            isAdmin
                ? `
                    bg-slate-100
                    text-slate-600
                    dark:bg-slate-800
                    dark:text-slate-300
                `
                : `
                    bg-indigo-50
                    text-indigo-600
                    dark:bg-indigo-500/10
                    dark:text-indigo-300
                `
        }
    `}
>
    <UserRoleIcon demote={isAdmin} />
</button>
        </div>
    );
}

/* =========================================================
   ACTIVE BADGE
========================================================= */

function ActiveBadge({
    t,
    isOnline,
    mobile = false,
}) {
    return (
        <span
            className={`
                inline-flex
                shrink-0
                items-center
                rounded-full
             font-semibold

${
    isOnline
        ? `
            bg-emerald-50
            text-emerald-600
            dark:bg-emerald-500/10
            dark:text-emerald-300
        `
        : `
            bg-red-50
            text-red-600
            dark:bg-red-500/10
            dark:text-red-300
        `
}

                ${
                    mobile
                        ? 'h-6 min-w-[58px] gap-1 px-2 text-[8px] justify-center'
: 'h-7 min-w-[72px] gap-1.5 px-3 text-[10px] justify-center'                }
            `}
        >
            <span
                className={`
                    shrink-0
                    rounded-full
                    ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}

                    ${
                        mobile
                            ? 'h-1.5 w-1.5'
                            : 'h-2 w-2'
                    }
                `}
            />

         {isOnline
    ? t('users.active', {
          defaultValue: 'Active',
      })
    : t('users.offline', {
          defaultValue: 'Offline',
      })}
        </span>
    );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
    user,
    mobile = false,
}) {
    const [showPhoto, setShowPhoto] = useState(false);

    const initial =
        user.name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() || '?';

 const photoUrl = user.profile_photo_url || null;

    useEffect(() => {
        if (!showPhoto) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowPhoto(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [showPhoto]);

    if (!photoUrl) {
        return (
            <div
                className={`
                    flex
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-br
                    from-indigo-100
                    to-violet-100
                    font-extrabold
                    text-indigo-600

                    dark:from-indigo-500/20
                    dark:to-violet-500/20
                    dark:text-indigo-300

                    ${
                        mobile
                            ? 'h-9 w-9 text-[10px]'
                            : 'h-9 w-9 text-xs'
                    }
                `}
            >
                {initial}
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowPhoto(true)}
                className="
                    shrink-0
                    overflow-hidden
                    rounded-full
                    ring-1
                    ring-slate-200
                    transition
                    hover:scale-105
                    hover:ring-2
                    hover:ring-indigo-500
                    focus:outline-none
                    focus:ring-2
                    focus:ring-indigo-500
                    dark:ring-slate-700
                "
                aria-label={`View ${user.name}'s profile photo`}
            >
                <img
                    src={photoUrl}
                    alt={user.name}
                    className={`
                        rounded-full
                        object-cover
                        ${
                            mobile
                                ? 'h-9 w-9'
                                : 'h-9 w-9'
                        }
                    `}
                />
            </button>

            {showPhoto && (
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
                    onClick={() => setShowPhoto(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setShowPhoto(false)}
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
                        src={photoUrl}
                        alt={user.name}
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
        </>
    );
}

/* =========================================================
   ROLE BADGE
========================================================= */

function RoleBadge({
    isAdmin,
    t,
    mobile = false,
}) {
    return (
        <span
            className={`
                shrink-0
                rounded-full
                font-semibold

                ${
                    mobile
                        ? 'h-6 min-w-[58px] px-2 text-[8px] inline-flex items-center justify-center'
                        : 'h-7 min-w-[72px] px-3 text-[10px] inline-flex items-center justify-center'
                }

                ${
                    isAdmin
                        ? `
                            bg-indigo-50
                            text-indigo-600

                            dark:bg-indigo-500/10
                            dark:text-indigo-300
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
                ? t('common.role_admin')
                : t('common.role_user')}
        </span>
    );
}

/* =========================================================
   MOBILE STATS
========================================================= */

function MobileStatCard({
    type,
    label,
    value,
    active = false,
    onClick,
}) {
    const admin = type === 'admin';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex
                h-[78px]
                w-full
                items-center
                gap-2.5
                rounded-xl
                border
                p-2.5
                text-left
                shadow-sm
                transition

                active:scale-[0.98]

                ${
                    active
                        ? `
                            border-indigo-400
                            bg-indigo-50
                            ring-2
                            ring-indigo-200/60

                            dark:border-indigo-500
                            dark:bg-indigo-500/10
                            dark:ring-indigo-500/20
                        `
                        : `
                            border-slate-200
                            bg-white

                            hover:border-indigo-200

                            dark:border-slate-800
                            dark:bg-slate-900
                            dark:hover:border-slate-700
                        `
                }
            `}
        >
            <div
                className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full

                    ${
                        admin
                            ? `
                                bg-emerald-50
                                text-emerald-600

                                dark:bg-emerald-500/10
                                dark:text-emerald-300
                            `
                            : `
                                bg-violet-50
                                text-violet-600

                                dark:bg-violet-500/10
                                dark:text-violet-300
                            `
                    }
                `}
            >
                {admin
                    ? <AdminIcon />
                    : <UsersIcon />
                }
            </div>

            <div className="min-w-0">
                <p
                    className="
                        truncate
                        text-[9px]
                        font-medium
                        text-slate-500

                        dark:text-slate-400
                    "
                >
                    {label}
                </p>

                <p
                    className="
                        mt-0.5
                        text-xl
                        font-extrabold
                        leading-none
                        text-slate-950

                        dark:text-white
                    "
                >
                    {value}
                </p>
            </div>
        </button>
    );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
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
            <circle
                cx="11"
                cy="11"
                r="7"
            />

            <path d="m20 20-4-4" />
        </svg>
    );
}

function ChevronIcon({
    open = false,
}) {
    return (
        <svg
            className={`
                h-4
                w-4
                shrink-0
                text-slate-400
                transition-transform

                ${
                    open
                        ? 'rotate-180'
                        : ''
                }
            `}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m7 10 5 5 5-5" />
        </svg>
    );
}

function CheckIcon() {
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
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}

function SortIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M8 4v16" />
            <path d="m5 7 3-3 3 3" />
            <path d="M16 20V4" />
            <path d="m13 17 3 3 3-3" />
        </svg>
    );
}

function UsersFilterIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle
                cx="9"
                cy="8"
                r="3"
            />

            <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6" />
        </svg>
    );
}

function PlusIcon() {
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
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </svg>
    );
}

function UsersIcon() {
    return (
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

            <circle
                cx="9"
                cy="7"
                r="4"
            />

            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function AdminIcon() {
    return (
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
            <circle
                cx="10"
                cy="8"
                r="3"
            />

            <path d="M4 19c.4-4 2.4-6 6-6 1.4 0 2.6.3 3.5.8" />
            <path d="M18 13v6" />
            <path d="M15 16h6" />
        </svg>
    );
}

function StatusFilterIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <circle
                cx="12"
                cy="12"
                r="3"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <circle
                cx="5"
                cy="12"
                r="1.7"
            />

            <circle
                cx="12"
                cy="12"
                r="1.7"
            />

            <circle
                cx="19"
                cy="12"
                r="1.7"
            />
        </svg>
    );
}

function UserRoleIcon({
    demote = false,
}) {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle
                cx="9"
                cy="8"
                r="3"
            />

            <path d="M3.5 19c.4-4 2.2-6 5.5-6 1.5 0 2.7.3 3.7.9" />

            {demote ? (
                <path d="M16 16h5" />
            ) : (
                <>
                    <path d="M18.5 13.5v5" />
                    <path d="M16 16h5" />
                </>
            )}
        </svg>
    );
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({ links }) {
    return (
        <nav
            className="
                mt-4
                flex
                flex-wrap
                justify-center
                gap-1
            "
        >
            {links.map(
                (link, index) => (
                    <Link
                        key={index}
                        href={
                            link.url || '#'
                        }
                        preserveScroll
                        dangerouslySetInnerHTML={{
                            __html:
                                link.label,
                        }}
                        className={`
                            rounded-lg
                            px-3
                            py-1.5
                            text-sm
                            font-medium
                            transition

                            ${
                                link.active
                                    ? `
                                        bg-indigo-600
                                        text-white
                                    `
                                    : link.url
                                      ? `
                                            border
                                            border-slate-200
                                            bg-white
                                            text-slate-700

                                            hover:bg-slate-100

                                            dark:border-slate-700
                                            dark:bg-slate-900
                                            dark:text-slate-300
                                            dark:hover:bg-slate-800
                                        `
                                      : `
                                            text-slate-300

                                            dark:text-slate-700
                                        `
                            }
                        `}
                    />
                )
            )}
        </nav>
    );
}