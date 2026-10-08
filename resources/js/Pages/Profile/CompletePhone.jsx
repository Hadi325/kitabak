import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function CompletePhone() {
    const { t } = useTranslation(['auth', 'common']);
    const { data, setData, patch, processing, errors } = useForm({ phone: '' });
    const submit = (event) => { event.preventDefault(); patch(route('profile.phone.update')); };

    return (
        <div className="h-[100svh] overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
            <Head title={t('auth:phone_required.title')} />
            <div className="fixed end-3 top-3 z-20 flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
            <main className="mx-auto flex h-full max-w-lg flex-col items-center justify-center px-5 text-center">
                <Link href="/"><ApplicationLogo className="h-14 w-14 sm:h-16 sm:w-16" /></Link>
                <h1 className="mt-5 text-2xl font-black sm:text-3xl">{t('auth:phone_required.title')}</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{t('auth:phone_required.description')}</p>
                <form onSubmit={submit} className="mt-6 w-full space-y-3 text-start">
                    <div className="flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900">
                        <span className="flex items-center gap-2 border-e border-slate-200 px-4 font-bold text-blue-600 dark:border-slate-700 dark:text-blue-400"><span>🇱🇧</span><span>+961</span></span>
                        <input type="tel" inputMode="tel" value={data.phone} onChange={(event) => setData('phone', event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent px-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white" autoComplete="tel" autoFocus required placeholder={t('auth:register.phone_number')} />
                    </div>
                    <InputError message={errors.phone} />
                    <button disabled={processing} className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60">{processing ? t('auth:phone_required.saving') : t('auth:phone_required.continue')}</button>
                </form>
                <Link href={route('dashboard')} className="mt-4 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400">{t('auth:phone_required.not_now')}</Link>
            </main>
        </div>
    );
}
