import { ProfileMobilePanel, ProfileMobileNavigation, useMobileProfile } from './Partials/ProfileMobileSections';
import '../../../css/profile-settings.css';
import { useProfileDesignCopy } from './Partials/ProfileDesign';
import FlashMessages from '@/Components/FlashMessages';
import { useImageCropper } from '@/Components/ImageCropDialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    router,
    usePage,
} from '@inertiajs/react';
import {
    useEffect,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import DeleteUserForm from './Partials/DeleteUserForm';
import LocationPreferenceForm from './Partials/LocationPreferenceForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    phone,
    registrationMethod,
    hasPassword,
    profilePhotoUrl,
}) {
    const {
    t,
    i18n,
} = useTranslation('common');

const currentLocale =
    i18n.resolvedLanguage
        ?.toLowerCase()
        .startsWith('ar')
        ? 'ar'
        : 'en';
    const { activeSection, setActiveSection, isMobile } = useMobileProfile();
    const user = usePage().props.auth.user;
    const design = useProfileDesignCopy();
    const joinedAt = user?.created_at ? new Date(user.created_at) : null;
    const memberSince = joinedAt && !Number.isNaN(joinedAt.getTime())
        ? new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', { month: 'short', year: 'numeric' }).format(joinedAt)
        : null;

    const {
        cropImage,
        takePhoto,
        cropDialog,
    } = useImageCropper();

    const galleryInput = useRef(null);
    const menuHistoryId = useRef(null);

    const [menuOpen, setMenuOpen] =
        useState(false);

    const [viewingPhoto, setViewingPhoto] =
        useState(false);

    const [uploadingPhoto, setUploadingPhoto] =
        useState(false);

    /*
     * Scroll to the location section when it
     * is requested in the URL.
     */
    useEffect(() => {
        const parameters =
            new URLSearchParams(
                window.location.search,
            );

        const shouldScroll =
            window.location.hash ===
                '#location-preferences' ||
            parameters.get('section') ===
                'location';

        if (!shouldScroll) {
            return undefined;
        }

        setActiveSection('location');
        const timer = window.setTimeout(
            () => {
                document
                    .getElementById(
                        'location-preferences',
                    )
                    ?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
            },
            150,
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    /*
     * Prevent the page behind the menu or photo
     * viewer from scrolling.
     */
    useEffect(() => {
        if (!menuOpen && !viewingPhoto) {
            return undefined;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [menuOpen, viewingPhoto]);

    /*
     * Add a temporary history entry.
     *
     * Pressing browser Back or phone Back closes
     * the profile-photo menu without leaving the
     * Profile page.
     */
    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const historyId =
            `profile-photo-menu-${Date.now()}`;

        menuHistoryId.current = historyId;

        window.history.pushState(
            {
                ...window.history.state,
                profilePhotoMenu:
                    historyId,
            },
            '',
            window.location.href,
        );

       const handleBrowserBack = () => {
    if (
        menuHistoryId.current !==
        historyId
    ) {
        return;
    }

    menuHistoryId.current = null;

    /*
     * Hide the flash while the menu overlay is
     * still covering the page.
     */
    window.dispatchEvent(
        new Event(
            'hide-flash-message',
        ),
    );

    /*
     * Close the menu on the next frame, after
     * the flash message has disappeared.
     */
    window.requestAnimationFrame(() => {
        setMenuOpen(false);
    });
};
        window.addEventListener(
            'popstate',
            handleBrowserBack,
        );

        return () => {
            window.removeEventListener(
                'popstate',
                handleBrowserBack,
            );
        };
    }, [menuOpen]);

    const openMenu = () => {
        if (uploadingPhoto) {
            return;
        }

        setMenuOpen(true);
    };

 const closeMenu = () => {
    window.dispatchEvent(
        new Event(
            'hide-flash-message',
        ),
    );

    if (menuHistoryId.current) {
        window.history.back();
        return;
    }

    /*
     * Wait until the flash message has been
     * removed before hiding the menu overlay.
     */
    window.requestAnimationFrame(() => {
        setMenuOpen(false);
    });
};

    const closeMenuImmediately = () => {
        if (menuHistoryId.current) {
            const nextState = {
                ...window.history.state,
            };

            delete nextState.profilePhotoMenu;

            window.history.replaceState(
                nextState,
                '',
                window.location.href,
            );

            menuHistoryId.current = null;
        }

        setMenuOpen(false);
    };
    const cancelMenu = () => {
    /*
     * Hide any existing message first.
     */
    window.dispatchEvent(
        new Event(
            'hide-flash-message',
        ),
    );

    /*
     * Close the menu without using
     * window.history.back().
     */
    closeMenuImmediately();
};

    const uploadPhoto = (file) => {
        if (!file) {
            return;
        }

        setUploadingPhoto(true);

        router.post(
            route(
                'profile.photo.update',
            ),
            {
                photo: file,
                locale: currentLocale,
            },
            {
                forceFormData: true,
                preserveScroll: true,

                onFinish: () => {
                    setUploadingPhoto(false);
                },
            },
        );
    };

  const viewPhoto = () => {
    closeMenuImmediately();
    setViewingPhoto(true);
};

    const takeProfilePhoto = async () => {
        closeMenuImmediately();

        const photo = await takePhoto();

        if (!photo) {
            return;
        }

        uploadPhoto(photo);
    };

    const chooseFromGallery = () => {
        closeMenuImmediately();

        window.setTimeout(() => {
            galleryInput.current?.click();
        }, 50);
    };
    const removeProfilePhoto = () => {
    if (!profilePhotoUrl) {
        return;
    }

    const confirmed = window.confirm(
        t('profile_photo.confirm_remove'),
    );

    if (!confirmed) {
        return;
    }

    closeMenuImmediately();
    setUploadingPhoto(true);

   router.delete(
    route(
        'profile.photo.destroy',
    ),
    {
        data: {
            locale: currentLocale,
        },

        preserveScroll: true,

        onFinish: () => {
            setUploadingPhoto(false);
        },
    },
);
};

    const handleGalleryPhoto = async (
        event,
    ) => {
        const selectedFile =
            event.target.files?.[0] ??
            null;

        event.target.value = '';

        if (!selectedFile) {
            return;
        }

        const croppedFile =
            await cropImage(selectedFile);

        if (!croppedFile) {
            return;
        }

        uploadPhoto(croppedFile);
    };

    return (
        <AuthenticatedLayout>
            {cropDialog}

            <Head
                title={t('profile.title')}
            />

            <FlashMessages />

            <input
                ref={galleryInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                    handleGalleryPhoto
                }
                className="sr-only"
            />

            <div className="page-shell profile-settings">
                <header className="profile-page-heading">
                    <h1>{t('profile.title')}</h1>
                    <p>{design.description}</p>
                </header>
                <div className="profile-settings-grid">
                    <section className="profile-summary">
                        <div className="profile-summary-content">
                            <button
                                type="button"
                                onClick={openMenu}
                                disabled={
                                    uploadingPhoto
                                }
                                aria-label={t(
                                    'profile_photo.open_menu',
                                )}
                                className="profile-avatar"
                            >
                                {profilePhotoUrl ? (
                                    <img
                                        src={
                                            profilePhotoUrl
                                        }
                                        alt={t(
                                            'profile_photo.profile_photo',
                                        )}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="grid h-full w-full place-items-center rounded-full bg-slate-200 text-slate-400">
                                        <ProfileIcon />
                                    </span>
                                )}

                                {uploadingPhoto && (
                                    <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-white">
                                        <LoadingIcon />
                                    </span>
                                )}
                            </button>

                            <div className="min-w-0">
                                <h2 className="profile-summary-name">
                                    {user?.name}
                                </h2>

                                <p
                                    dir="ltr"
                                    className="mt-1 truncate text-start text-sm text-slate-500 dark:text-slate-400"
                                >
                                    {user?.email}
                                </p>
                                <button type="button" className="profile-change-photo" onClick={openMenu} disabled={uploadingPhoto}>
                                    {uploadingPhoto ? design.uploading : design.changePhoto}
                                </button>
                            </div>
                            {memberSince && (
                                <dl className="profile-membership">
                                    <dt>{design.memberSince}</dt>
                                    <dd>{memberSince}</dd>
                                </dl>
                            )}
                        </div>
                    </section>

                    <ProfileMobileNavigation activeSection={activeSection} onSelect={setActiveSection} />
                    <ProfileMobilePanel section="account" className="profile-panel profile-information"
                        activeSection={activeSection} onSelect={setActiveSection} isMobile={isMobile}>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={
                                mustVerifyEmail
                            }
                            status={status}
                            phone={phone}
                            registrationMethod={registrationMethod}
                            className="profile-section"
                        />
                    </ProfileMobilePanel>

                    <ProfileMobilePanel
                        section="location" id="location-preferences"
                        activeSection={activeSection} onSelect={setActiveSection} isMobile={isMobile}
                        className="profile-panel profile-location"
                    >
                        <LocationPreferenceForm className="profile-section" />
                    </ProfileMobilePanel>

                    <ProfileMobilePanel section="security" className="profile-panel profile-password"
                        activeSection={activeSection} onSelect={setActiveSection} isMobile={isMobile}>
                        <UpdatePasswordForm
                            className="profile-section"
                            hasPassword={hasPassword}
                        />
                    </ProfileMobilePanel>

                    <ProfileMobilePanel section="danger" className="profile-panel profile-danger"
                        activeSection={activeSection} onSelect={setActiveSection} isMobile={isMobile}>
                        <DeleteUserForm className="profile-section" />
                    </ProfileMobilePanel>
                </div>
            </div>

            {menuOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="profile-photo-menu-title"
                >
                    <button
                        type="button"
                        onClick={cancelMenu}
                        aria-label={t(
                            'profile_photo.cancel',
                        )}
                        className="absolute inset-0 cursor-default"
                    />

                    <section className="relative z-10 w-full max-w-xl rounded-t-[2rem] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:mb-6 sm:rounded-[2rem]">
                        <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300 dark:bg-slate-600" />

                        <h2
                            id="profile-photo-menu-title"
                            className="mt-5 text-xl font-black text-slate-950 dark:text-white"
                        >
                            {t(
                                'profile_photo.title',
                            )}
                        </h2>

                        <div className="mt-4 space-y-1">
                            <MenuButton
                                onClick={viewPhoto}
                                icon={
                                    <ViewIcon />
                                }
                            >
                                {t(
                                    'profile_photo.view',
                                )}
                            </MenuButton>

                            <MenuButton
                                onClick={
                                    takeProfilePhoto
                                }
                                icon={
                                    <CameraIcon />
                                }
                            >
                                {t(
                                    'profile_photo.take',
                                )}
                            </MenuButton>

                            <MenuButton
                                onClick={
                                    chooseFromGallery
                                }
                                icon={
                                    <GalleryIcon />
                                }
                            >
                                {t(
                                    'profile_photo.gallery',
                                )}
                            </MenuButton>
                            {profilePhotoUrl && (
    <MenuButton
        onClick={
            removeProfilePhoto
        }
        danger
        icon={
            <TrashIcon />
        }
    >
        {t(
            'profile_photo.remove',
        )}
    </MenuButton>
)}

                          <MenuButton
    onClick={cancelMenu}
    danger
    icon={
        <CloseIcon />
    }
>
    {t(
        'profile_photo.cancel',
    )}
</MenuButton>
                        </div>
                    </section>
                </div>
            )}

           {viewingPhoto && (
    <div
        className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/95 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t(
            'profile_photo.view',
        )}
    >
        <button
            type="button"
            onClick={() =>
                setViewingPhoto(false)
            }
            aria-label={t(
                'profile_photo.close',
            )}
            className="absolute end-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        >
            ×
        </button>

        {profilePhotoUrl ? (
            <img
                src={profilePhotoUrl}
                alt={t(
                    'profile_photo.profile_photo',
                )}
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
        ) : (
            <div className="grid aspect-square w-full max-w-xl place-items-center overflow-hidden rounded-2xl bg-slate-200 text-slate-400 shadow-2xl">
    <svg
        className="h-40 w-40 sm:h-56 sm:w-56"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
    >
        <circle
            cx="12"
            cy="8"
            r="4"
        />

        <path d="M4 21a8 8 0 0 1 16 0Z" />
    </svg>
</div>
        )}
    </div>
)}
        </AuthenticatedLayout>
    );
}

function MenuButton({
    children,
    icon,
    onClick,
    disabled = false,
    danger = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex min-h-16 w-full items-center gap-5 rounded-2xl px-4 text-start text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                danger
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
        >
            <span className="grid h-8 w-8 shrink-0 place-items-center">
                {icon}
            </span>

            <span>{children}</span>
        </button>
    );
}

function ProfileIcon() {
    return (
        <svg
            className="h-10 w-10 sm:h-12 sm:w-12"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="4"
            />

            <path d="M4 21a8 8 0 0 1 16 0Z" />
        </svg>
    );
}

function ViewIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle
                cx="12"
                cy="12"
                r="3"
            />
        </svg>
    );
}

function CameraIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" />

            <circle
                cx="12"
                cy="13"
                r="4"
            />
        </svg>
    );
}

function GalleryIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
            />

            <circle
                cx="8.5"
                cy="8.5"
                r="1.5"
            />

            <path d="m4 17 5-5 4 4 2-2 5 5" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </svg>
    );
}
function CloseIcon() {
    return (
        <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}

function LoadingIcon() {
    return (
        <svg
            className="h-7 w-7 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
            />

            <path
                className="opacity-90"
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}
