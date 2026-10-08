import React, { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function VerifyEmailCode({ phone, status, sendFailed = false, retryAfter = 0 }) {
    const { t } = useTranslation('auth');
    const [cooldown, setCooldown] = useState(Math.max(0, Number(retryAfter) || 0));
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    function submit(e) {
        e.preventDefault();
        post(route('phone.verify'));
    }

    function resend(e) {
        e.preventDefault();
        if (processing || cooldown > 0) return;
        post(route('phone.verify.resend'), { preserveScroll: true });
    }

    useEffect(() => {
        setCooldown(Math.max(0, Number(retryAfter) || 0));
    }, [retryAfter]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = window.setInterval(() => {
            setCooldown((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldown > 0]);

    const waitLabel = cooldown >= 60
        ? t('verify_code.wait_minutes', { count: Math.ceil(cooldown / 60) })
        : t('verify_code.wait_seconds', { count: cooldown });

    return (
        <GuestLayout>
            <Head title={t('verify_code.title')} />

            <div className="w-full">
                <div className="px-8 py-8">
                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{t('verify_code.title')}</h1>

                    {status === 'verification-code-sent' && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
                            {t('verify_code.resent')}
                        </div>
                    )}

                    {errors.code && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
                            {errors.code}
                        </div>
                    )}

                    {sendFailed && !errors.code && (
                        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                            {t('verify_code.send_failed')}
                        </div>
                    )}

                    <p className="mb-6 text-slate-600 dark:text-slate-300">{t('verify_code.description')} <span dir="ltr" className="font-semibold text-slate-900 dark:text-white">{phone}</span></p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('verify_code.label')}</label>
                            <div className="mt-1">
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    maxLength={6}
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    className="block min-h-12 w-full rounded-xl border border-slate-300 px-4 text-center text-xl font-bold tracking-[0.35em] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <PrimaryButton disabled={processing}>{t('verify_code.submit')}</PrimaryButton>

                            <button onClick={resend} className="text-sm text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline" disabled={processing || cooldown > 0}>
                                {cooldown > 0 ? waitLabel : t('verify_code.resend')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('verify_code.help')}</p>
                </div>
            </div>
        </GuestLayout>
    );
}
