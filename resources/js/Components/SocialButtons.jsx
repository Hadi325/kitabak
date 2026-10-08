import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { firebaseAuth } from '@/lib/firebase';

export default function SocialButtons({ compact = false }) {
    const { t } = useTranslation('common');
    const [processing, setProcessing] = useState(false);
    const [awaitingCompletion, setAwaitingCompletion] = useState(false);
    const [error, setError] = useState('');

    const signInWithGoogle = async () => {
        setProcessing(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(firebaseAuth(), provider);
            const idToken = await result.user.getIdToken();
            setAwaitingCompletion(true);

            router.post(
                route('auth.firebase'),
                { id_token: idToken },
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        setError(
                            errors.google || t('social.google_error'),
                        );
                    },
                    onFinish: () => {
                        setAwaitingCompletion(false);
                        setProcessing(false);
                    },
                },
            );
        } catch (firebaseError) {
            if (firebaseError?.code !== 'auth/popup-closed-by-user') {
                setError(t('social.google_error'));
            }

            setProcessing(false);
            setAwaitingCompletion(false);
        }
    };

    const baseBtn =
        'flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-slate-800';

    if (compact) {
        return (
            <div className="mt-2 text-center sm:mt-4">
                <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={processing}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 sm:h-12 sm:w-12"
                    aria-label={t('social.google')}
                    title={t('social.google')}
                >
                    <GoogleIcon className="h-6 w-6" />
                </button>
                {processing && <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t('social.google_connecting')}</p>}
                {error && <p className="mt-2 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
            </div>
        );
    }

    return (
        <>
            <div className="mt-6">
   <div className="mb-4 flex items-center gap-3">
    <div
        className="
            h-px
            flex-1
            bg-slate-400
            dark:bg-slate-600
            md:!bg-slate-400
        "
    />

    <span
        className="
            shrink-0
            font-semibold
            text-slate-700
            dark:text-slate-300
            md:!text-slate-700
        "
    >
        {t('social.divider')}
    </span>

    <div
        className="
            h-px
            flex-1
            bg-slate-400
            dark:bg-slate-600
            md:!bg-slate-400
        "
    />
</div>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={processing}
                    className={`${baseBtn} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    <GoogleIcon className="h-5 w-5" />
                    {processing
                        ? t('social.google_connecting')
                        : t('social.google')}
                </button>

                {error && (
                    <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
            </div>
            </div>

            {awaitingCompletion && (
                <div
                    className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                    aria-label={t('social.google_connecting')}
                >
                    <div className="flex min-w-52 flex-col items-center rounded-2xl bg-white px-7 py-6 text-center shadow-2xl">
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                        <span className="mt-4 text-sm font-semibold text-slate-800">
                            {t('social.google_connecting')}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}

function GoogleIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.77-5.61-4.14H3.04v2.62A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.54l3.35-2.62Z" />
            <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.94 12 5.94Z" />
        </svg>
    );
}
