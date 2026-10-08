import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Alerts() {
    const { t } = useTranslation('common');

    return (
        <AuthenticatedLayout>
            <Head title={t('alerts.title')} />

            <main className="page-shell">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                            <svg
                                className="h-7 w-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
                                />
                                <path strokeLinecap="round" d="M10 21h4" />
                            </svg>
                        </div>

                        <h1 className="mt-5 text-3xl font-bold text-slate-950 dark:text-white">
                            {t('alerts.title')}
                        </h1>

                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            {t('alerts.description')}
                        </p>

                        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            {t('alerts.empty')}
                        </div>
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}