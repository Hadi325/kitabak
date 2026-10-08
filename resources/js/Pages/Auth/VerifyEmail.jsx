import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail({ status, verificationError }) {
    const { t } = useTranslation('auth');
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('email_verification.title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('email_verification.description')}
            </div>

            {status === 'verification-link-sent' && (
                <div
                    className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    role="status"
                >
                    {t('email_verification.sent')}
                </div>
            )}

            {verificationError === 'verification-email-send-failed' && (
                <div
                    className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    role="alert"
                >
                    {t('email_verification.send_failed')}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {processing
                            ? t('email_verification.sending')
                            : t('email_verification.resend')}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t('email_verification.logout')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
