import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '' }) {
    const { i18n, t } = useTranslation('common');
    const [open, setOpen] = useState(false);
    const container = useRef(null);
    const currentCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
    const current = SUPPORTED_LANGUAGES.find((language) => language.code === currentCode) ?? SUPPORTED_LANGUAGES[0];

    useEffect(() => {
        const close = (event) => {
            if (!container.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);

    return (
        <div ref={container} className={`relative ${className}`}>
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox" aria-label={t('language.switcher_label')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-slate-800 dark:hover:text-indigo-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>
                <span className="hidden sm:inline">{current.nativeLabel}</span>
                <svg className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </button>

            {open && (
                <div role="listbox" className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t('language.choose')}</p>
                    {SUPPORTED_LANGUAGES.map((language) => {
                        const active = language.code === currentCode;
                        return <button key={language.code} type="button" role="option" aria-selected={active} onClick={() => { i18n.changeLanguage(language.code); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm font-semibold transition ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}><span>{language.nativeLabel}</span>{active && <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}</button>;
                    })}
                </div>
            )}
        </div>
    );
}
