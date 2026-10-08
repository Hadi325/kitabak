import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileSectionIcon } from './ProfileDesign';

const sections = ['account', 'location', 'security', 'danger'];
const icons = { account: 'user', location: 'pin', security: 'lock', danger: 'trash' };
const messages = {
    en: {
        navigation: 'Profile sections',
        account: ['Account', 'Account information', 'Update your personal information.'],
        location: ['Location', 'Location preference', 'Control how Kitabak uses your location.'],
        security: ['Security', 'Update password', 'Set a new password for your account.'],
        danger: ['Danger', 'Delete account', 'Permanently delete your account and your data.'],
    },
    fr: {
        navigation: 'Sections du profil',
        account: ['Compte', 'Informations du compte', 'Mettez à jour vos informations personnelles.'],
        location: ['Lieu', 'Préférence de localisation', 'Gérez l’utilisation de votre localisation.'],
        security: ['Sécurité', 'Modifier le mot de passe', 'Définissez un nouveau mot de passe.'],
        danger: ['Suppression', 'Supprimer le compte', 'Supprimez définitivement votre compte et vos données.'],
    },
    ar: {
        navigation: 'أقسام الملف الشخصي',
        account: ['الحساب', 'معلومات الحساب', 'تحديث معلوماتك الشخصية.'],
        location: ['الموقع', 'تفضيلات الموقع', 'التحكم في استخدام كتابك لموقعك.'],
        security: ['الأمان', 'تحديث كلمة المرور', 'تعيين كلمة مرور جديدة لحسابك.'],
        danger: ['الحذف', 'حذف الحساب', 'حذف حسابك وبياناتك نهائياً.'],
    },
};

function useCopy() {
    const { i18n } = useTranslation('common');
    return messages[(i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]] || messages.en;
}

export function useMobileProfile() {
    const [activeSection, setActiveSection] = useState('account');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 1023px)');
        const update = () => setIsMobile(media.matches);
        update();
        media.addEventListener('change', update);

        const openLocation = () => {
            const query = new URLSearchParams(window.location.search);
            if (window.location.hash === '#location-preferences' || query.get('section') === 'location') {
                setActiveSection('location');
            }
        };
        openLocation();
        window.addEventListener('hashchange', openLocation);
        return () => {
            media.removeEventListener('change', update);
            window.removeEventListener('hashchange', openLocation);
        };
    }, []);

    return { activeSection, setActiveSection, isMobile };
}

export function ProfileMobileNavigation({ activeSection, onSelect }) {
    const copy = useCopy();
    return (
        <nav className="profile-mobile-navigation" aria-label={copy.navigation}>
            {sections.map((section) => (
                <button key={section} type="button"
                    aria-pressed={activeSection === section}
                    aria-controls={'profile-content-' + section}
                    onClick={() => {
    onSelect(section);

    // Wait for the selected section to expand.
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            document
                .getElementById(`profile-toggle-${section}`)
                ?.scrollIntoView({
                    behavior: window.matchMedia(
                        '(prefers-reduced-motion: reduce)',
                    ).matches ? 'instant' : 'smooth',
                    block: 'start',
                });
        });
    });
}}>
                    <ProfileSectionIcon kind={icons[section]} />
                    <span>{copy[section][0]}</span>
                </button>
            ))}
        </nav>
    );
}

export function ProfileMobilePanel({ section, className, id, activeSection, onSelect, isMobile, children }) {
    const copy = useCopy();
    const open = activeSection === section;
    return (
        <div id={id} className={className + (open ? ' profile-panel-open' : ' profile-panel-collapsed')}>
            <button type="button" className="profile-mobile-panel-heading"
                id={'profile-toggle-' + section}
                aria-expanded={open}
                aria-controls={'profile-content-' + section}
                onClick={() => onSelect(open ? null : section)}>
                <ProfileSectionIcon kind={icons[section]} />
                <span className="profile-mobile-panel-copy">
                    <strong>{copy[section][1]}</strong>
                    <span>{copy[section][2]}</span>
                </span>
                <svg className="profile-panel-chevron" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                </svg>
            </button>
            <div id={'profile-content-' + section} className="profile-panel-content"
                hidden={isMobile && !open}>
                {children}
            </div>
        </div>
    );
}
