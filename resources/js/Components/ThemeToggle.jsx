import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const THEME_STORAGE_KEY = 'app_theme';

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (
        savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'system'
    ) {
        return savedTheme;
    }

    return 'system';
}

function applyTheme(theme) {
    const resolvedTheme =
        theme === 'system' ? getSystemTheme() : theme;

    document.documentElement.classList.toggle(
        'dark',
        resolvedTheme === 'dark',
    );

    document.documentElement.style.colorScheme = resolvedTheme;

    return resolvedTheme;
}

export default function ThemeToggle({ className = '' }) {
    const { t } = useTranslation('common');

    const containerRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState(getSavedTheme);
    const [resolvedTheme, setResolvedTheme] = useState(() =>
        applyTheme(getSavedTheme()),
    );

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        setResolvedTheme(applyTheme(theme));

        if (theme !== 'system') {
            return undefined;
        }

        const mediaQuery = window.matchMedia(
            '(prefers-color-scheme: dark)',
        );

        const handleSystemChange = () => {
            setResolvedTheme(applyTheme('system'));
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleSystemChange();
            }
        };

        mediaQuery.addEventListener('change', handleSystemChange);
        document.addEventListener(
            'visibilitychange',
            handleVisibilityChange,
        );

        return () => {
            mediaQuery.removeEventListener(
                'change',
                handleSystemChange,
            );
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [theme]);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick,
            );

            document.removeEventListener(
                'keydown',
                handleEscape,
            );
        };
    }, [menuOpen]);

    const chooseTheme = (selectedTheme) => {
        setTheme(selectedTheme);
        setMenuOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t('theme.choose')}
                title={t('theme.choose')}
                className={`group grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-slate-800 dark:hover:text-indigo-300 ${className}`}
            >
                {theme === 'system' ? (
                    <SystemIcon />
                ) : resolvedTheme === 'dark' ? (
                    <MoonIcon />
                ) : (
                    <SunIcon />
                )}
            </button>

            {menuOpen && (
                <div
                    role="menu"
                    dir="ltr"
                    aria-label={t('theme.choose')}
                    className="absolute end-0 top-full z-[100] mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900"
                >
                    <p className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('theme.choose')}
                    </p>

                    <div className="space-y-1">
                        <ThemeOption
                            active={theme === 'light'}
                            icon={<SunIcon />}
                            onClick={() => chooseTheme('light')}
                        >
                            {t('theme.light')}
                        </ThemeOption>

                        <ThemeOption
                            active={theme === 'dark'}
                            icon={<MoonIcon />}
                            onClick={() => chooseTheme('dark')}
                        >
                            {t('theme.dark')}
                        </ThemeOption>

                        <ThemeOption
                            active={theme === 'system'}
                            icon={<SystemIcon />}
                            onClick={() => chooseTheme('system')}
                        >
                            {t('theme.system')}
                        </ThemeOption>
                    </div>
                </div>
            )}
        </div>
    );
}

function ThemeOption({
    children,
    active,
    icon,
    onClick,
}) {
    return (
        <button
            type="button"
            role="menuitemradio"
            aria-checked={active}
            onClick={onClick}
            dir="ltr"
            className={`grid min-h-11 w-full grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                active
                    ? '!bg-indigo-100 text-indigo-800 dark:!bg-indigo-500/25 dark:text-indigo-200'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
        >
            <span className="grid h-5 w-5 place-items-center">
                {icon}
            </span>

            <span className="min-w-0 whitespace-nowrap">
                {children}
            </span>

            <span className={`grid h-5 w-5 place-items-center justify-self-end ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-transparent'}`}>
                <CheckIcon />
            </span>
        </button>
    );
}

function SunIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.42 1.42" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.93 19.07l1.42-1.42" />
            <path d="M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
    );
}

function SystemIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="4"
                width="18"
                height="13"
                rx="2"
            />

            <path d="M8 21h8" />
            <path d="M12 17v4" />
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
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m4 12.5 5.5 5.5L20 6.5" />
        </svg>
    );
}