import { ProfileSectionIcon } from './ProfileDesign';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const choiceKey = 'kitabak_location_choice';
const areaKey = 'kitabak_location_area';
const expiresAtKey = 'kitabak_location_expires_at';

const preferenceEvent =
    'kitabak:location-preference-changed';

function notifyLocationChange(
    choice,
    area = '',
) {
    window.dispatchEvent(
        new CustomEvent(preferenceEvent, {
            detail: {
                choice,
                area,
            },
        }),
    );
}

function readPreference(key) {
    try {
        const storedValue =
            window.localStorage.getItem(key);

        if (storedValue !== null) {
            return storedValue;
        }
    } catch {
        // Continue to cookie fallback.
    }

    const cookie = document.cookie
        .split('; ')
        .find((item) =>
            item.startsWith(`${key}=`),
        );

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(
        cookie.substring(key.length + 1),
    );
}

function savePreference(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // The cookie remains as a fallback.
    }

    const secure =
        window.location.protocol === 'https:'
            ? '; Secure'
            : '';

    document.cookie =
        `${key}=${encodeURIComponent(value)}` +
        `; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

function removePreference(key) {
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Also remove the fallback cookie.
    }

    document.cookie =
        `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export default function LocationPreferenceForm({
    className = '',
}) {
    const { t } = useTranslation('common');

    const [choice, setChoice] =
        useState(null);
    const [area, setArea] = useState('');
    const [ready, setReady] =
        useState(false);

   useEffect(() => {
    const loadPreference = () => {
        setChoice(
            readPreference(choiceKey),
        );

        setArea(
            readPreference(areaKey) ?? '',
        );

        setReady(true);
    };

    const handleLocationChange = (event) => {
        const nextChoice =
            event.detail?.choice ?? null;

        const nextArea =
            event.detail?.area ?? '';

        setChoice(nextChoice);
        setArea(nextArea);
        setReady(true);
    };

    loadPreference();

    window.addEventListener(
        preferenceEvent,
        handleLocationChange,
    );

    return () => {
        window.removeEventListener(
            preferenceEvent,
            handleLocationChange,
        );
    };
}, []);

 const enableLocation = () => {
    removePreference(choiceKey);
    removePreference(areaKey);
    removePreference(expiresAtKey);

    setChoice(null);
    setArea('');

    /*
     * Stay on Profile and reload so
     * GuestLocation detects a new choice.
     */
    window.history.replaceState(
        null,
        '',
        `${route('profile.edit')}#location-preferences`,
    );

    window.location.reload();
};
   const disableLocation = () => {
    savePreference(
        choiceKey,
        'declined',
    );

    removePreference(areaKey);
    removePreference(expiresAtKey);

    setChoice('declined');
    setArea('');

    notifyLocationChange(
        'declined',
        '',
    );
};

    const isEnabled =
        choice === 'accepted';

    if (!ready) {
        return null;
    }

    return (
        <section className={className}>
            <header className="profile-section-heading">
                <ProfileSectionIcon kind="pin" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t(
                        'profile.location_title',
                        {
                            defaultValue:
                                'Location preference',
                        },
                    )}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {t(
                        'profile.location_description',
                        {
                            defaultValue:
                                'Control whether Kitabak can use and display your Lebanese area.',
                        },
                    )}
                </p>
            </header>

            <div className="profile-location-status">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t(
                                'profile.location_status',
                                {
                                    defaultValue:
                                        'Status',
                                },
                            )}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    isEnabled
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-400'
                                }`}
                            />

                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {isEnabled
                                    ? t(
                                          'profile.location_enabled',
                                          {
                                              defaultValue:
                                                  'Enabled',
                                          },
                                      )
                                    : t(
                                          'profile.location_disabled',
                                          {
                                              defaultValue:
                                                  'Disabled',
                                          },
                                      )}
                            </span>
                        </div>
                    </div>

                    {isEnabled && area && (
                        <div className="text-start sm:text-end">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {t(
                                    'profile.current_area',
                                    {
                                        defaultValue:
                                            'Current area',
                                    },
                                )}
                            </p>

                            <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {area}
                            </p>
                        </div>
                    )}
                </div>
            </div>

         <div className="profile-location-actions">
    {isEnabled ? (
        <button
            type="button"
            onClick={disableLocation}
className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-600 bg-rose-600 px-5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700 active:scale-95 sm:w-auto dark:border-rose-500 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500"  >
            {t(
                'profile.disable_location',
                {
                    defaultValue:
                        'Disable location',
                },
            )}
        </button>
    ) : (
       <button
    type="button"
    onClick={enableLocation}
className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-500 bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 sm:w-auto dark:border-emerald-400 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500">
    {t('profile.enable_location', {
        defaultValue: 'Enable location',
    })}
</button>
    )}
</div>
        </section>
    );
}
