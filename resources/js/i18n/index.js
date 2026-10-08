import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ---------------------------------------------------------------------------
// Namespaces — one JSON file per page/feature.
// Add a new namespace here when you create a new page; that's the ONLY change
// needed in this file. Then drop in `locales/en/<ns>.json`, `locales/ar/<ns>.json`,
// and `locales/fr/<ns>.json`.
// and call useTranslation('<ns>') in that page.
// ---------------------------------------------------------------------------
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enWelcome from './locales/en/welcome.json';
import enPosts from './locales/en/posts.json';
import enAdmin from './locales/en/admin.json';
import enBookBarcode from './locales/en/bookBarcode.json';
import enBookLists from './locales/en/bookLists.json';
import enBookAi from './locales/en/bookAi.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arWelcome from './locales/ar/welcome.json';
import arPosts from './locales/ar/posts.json';
import arAdmin from './locales/ar/admin.json';
import arBookBarcode from './locales/ar/bookBarcode.json';
import arBookLists from './locales/ar/bookLists.json';
import arBookAi from './locales/ar/bookAi.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frDashboard from './locales/fr/dashboard.json';
import frWelcome from './locales/fr/welcome.json';
import frPosts from './locales/fr/posts.json';
import frAdmin from './locales/fr/admin.json';
import frBookBarcode from './locales/fr/bookBarcode.json';
import frBookLists from './locales/fr/bookLists.json';
import frBookAi from './locales/fr/bookAi.json';

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
    { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
];

export const RTL_LANGUAGES = SUPPORTED_LANGUAGES
    .filter((l) => l.dir === 'rtl')
    .map((l) => l.code);

export const getDirection = (lng) =>
    RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';

const resources = {
    en: {
        common: { ...enCommon, book_barcode: enBookBarcode },
        auth: enAuth,
        dashboard: enDashboard,
        welcome: enWelcome,
        posts: enPosts,
        admin: enAdmin,
        bookLists: enBookLists,
        bookAi: enBookAi,
    },
    ar: {
        common: { ...arCommon, book_barcode: arBookBarcode },
        auth: arAuth,
        dashboard: arDashboard,
        welcome: arWelcome,
        posts: arPosts,
        admin: arAdmin,
        bookLists: arBookLists,
        bookAi: arBookAi,
    },
    fr: {
        common: { ...frCommon, book_barcode: frBookBarcode },
        auth: frAuth,
        dashboard: frDashboard,
        welcome: frWelcome,
        posts: frPosts,
        admin: frAdmin,
        bookLists: frBookLists,
        bookAi: frBookAi,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
        defaultNS: 'common',
        ns: ['common', 'auth', 'dashboard', 'welcome', 'posts', 'admin', 'bookLists', 'bookAi'],
        interpolation: { escapeValue: false }, // React already escapes
        detection: {
            order: ['localStorage', 'htmlTag', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'app_locale',
        },
        returnNull: false,
    });

// Keep <html lang> and <html dir> in sync with the active language.
const applyHtmlAttrs = (lng) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('lang', lng);
    document.documentElement.setAttribute('dir', getDirection(lng));
};

applyHtmlAttrs(i18n.language || 'en');
i18n.on('languageChanged', applyHtmlAttrs);

export default i18n;
