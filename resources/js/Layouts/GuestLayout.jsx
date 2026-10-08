import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function GuestLayout({
    children,
    header,
    wide = false,
}) {
    const { t } = useTranslation('common');

    if (wide) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
                <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
                    <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link
                            href="/"
                            className="flex items-center gap-2.5"
                        >
                            <ApplicationLogo className="h-8 w-8 rounded-[28%] sm:h-10 sm:w-10" />

                            <span className="text-lg font-extrabold tracking-tight">
                                my
                                <span className="text-indigo-600">
                                    Books
                                </span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />

                            <ThemeToggle />

                            <Link
                                href={route('login')}
                                className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
                            >
                                {t('layout.sign_in')}
                            </Link>

                            <Link
                                href={route('register')}
                                className="hidden rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 min-[480px]:inline-flex"
                            >
                                {t('layout.get_started')}
                            </Link>
                        </div>
                    </div>
                </nav>

                {header && (
                    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>

                <footer className="mt-12 border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 lg:px-8">
                        <span>
                            © {new Date().getFullYear()} kitabak
                        </span>

                        <span>{t('layout.tagline')}</span>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
            {/* Background gradients */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.10),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(16,185,129,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.26),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(16,185,129,0.16),transparent_30%)]" />

            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(15,23,42,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.22)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-[0.08] dark:[background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)]" />

            {/* Desktop introduction */}
            <aside className="relative hidden w-[46%] flex-col justify-between p-10 text-slate-950 dark:text-white lg:flex xl:p-16">
                <Link
                    href="/"
                    className="flex items-center gap-3"
                >
                    <ApplicationLogo className="h-20 w-20" />

                    <span className="text-2xl font-extrabold tracking-tight">
                        kitabak
                    </span>
                </Link>

                <div className="max-w-lg">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
                        {t('layout.eyebrow')}
                    </p>

                    <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
                        {t('layout.headline')}
                    </h1>

                    <p className="mt-6 max-w-md text-lg leading-8 text-slate-600 dark:text-slate-300">
                        {t('layout.description')}
                    </p>
                </div>

                <p className="text-sm text-slate-500">
                    {t('layout.trust')}
                </p>
            </aside>

            {/* Login or registration form */}
            <main className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-14 sm:px-8 sm:py-10">
                <div className="absolute end-4 top-4 flex items-center gap-2 sm:end-8 sm:top-6">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link
                        href="/"
                        className="mb-4 flex items-center justify-center gap-2.5 text-slate-950 dark:text-white lg:hidden"
                    >
                        <ApplicationLogo className="h-14 w-14" />

                        <span className="text-2xl font-extrabold">
                            kitabak
                        </span>
                    </Link>

                    {/* Form card */}
                    <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-2xl shadow-black/25 dark:border-slate-700 dark:bg-slate-900 sm:p-7">
                        {children}
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-500">
                        © {new Date().getFullYear()} myBooks.{' '}
                        {t('layout.rights')}
                    </p>
                </div>
            </main>
        </div>
    );
}
