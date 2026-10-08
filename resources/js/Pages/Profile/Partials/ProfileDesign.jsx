import { useTranslation } from 'react-i18next';

const messages = {
    en: {
        description: 'Manage your account and preferences.', changePhoto: 'Change photo', uploading: 'Uploading…',
        memberSince: 'Member since', deleteIntro: 'Permanently delete your account and your data.',
        permanent: 'This action cannot be undone.', showPassword: 'Show password', hidePassword: 'Hide password',
    },
    fr: {
        description: 'Gérez votre compte et vos préférences.', changePhoto: 'Changer la photo', uploading: 'Envoi en cours…',
        memberSince: 'Membre depuis', deleteIntro: 'Supprimez définitivement votre compte et vos données.',
        permanent: 'Cette action est irréversible.', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe',
    },
    ar: {
        description: 'إدارة حسابك وتفضيلاتك.', changePhoto: 'تغيير الصورة', uploading: 'جارٍ الرفع…',
        memberSince: 'عضو منذ', deleteIntro: 'حذف حسابك وبياناتك نهائياً.',
        permanent: 'لا يمكن التراجع عن هذا الإجراء.', showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور',
    },
};

export function useProfileDesignCopy() {
    const { i18n } = useTranslation('common');
    const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
    return messages[language] || messages.en;
}

export function ProfileSectionIcon({ kind }) {
    return (
        <span className="profile-section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {kind === 'user' && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z" /></>}
                {kind === 'lock' && <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>}
                {kind === 'pin' && <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>}
                {kind === 'trash' && <><path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>}
                {kind === 'alert' && <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></>}
            </svg>
        </span>
    );
}
