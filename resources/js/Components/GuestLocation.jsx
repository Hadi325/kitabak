import axios from 'axios';
import { Link} from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const choiceKey = 'kitabak_location_choice';
const areaKey = 'kitabak_location_area';
const expiresAtKey = 'kitabak_location_expires_at';
const locationDisplayDuration = 30_000;

const preferenceEvent =
    'kitabak:location-preference-changed';

    const promptRequestEvent =
    'kitabak:location-prompt-requested';

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



/*
 * Read from localStorage first.
 * Use a cookie as a fallback for iPhone Safari.
 */
function readPreference(key) {
    try {
        const storedValue =
            window.localStorage.getItem(key);

        if (storedValue !== null) {
            return storedValue;
        }
    } catch {
        // Continue to the cookie fallback.
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
        // The cookie below remains available as fallback.
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

export default function GuestLocation({
    enabled = true,
    showHeader = true,
}) {
    const { t, i18n } =
        useTranslation('common');



    const isArabic =
        i18n.language?.startsWith('ar');

    const [area, setArea] = useState('');
    const [choice, setChoice] =
        useState(null);
        const [showHeaderLocation, setShowHeaderLocation] =
    useState(false);
    const [ready, setReady] =
        useState(false);
    const [showPrompt, setShowPrompt] =
        useState(false);
    const [loading, setLoading] =
        useState(false);
    const [error, setError] =
        useState('');

    useEffect(() => {
        if (!enabled) {
            setReady(false);
            return undefined;
        }

   const loadPreference = () => {
    const storedChoice = readPreference(choiceKey);
    const storedArea = readPreference(areaKey) ?? '';
    const expiresAt = Number(
        readPreference(expiresAtKey),
    );

   setChoice(storedChoice);
setArea(storedArea);

// Automatically show the popup only for a user who has
// never made a location choice before.
setShowPrompt(
    showHeader && storedChoice === null,
);

    setShowHeaderLocation(
        storedChoice === 'accepted' &&
            Boolean(storedArea) &&
            Boolean(expiresAt) &&
            expiresAt > Date.now(),
    );

    setReady(true);
};

        loadPreference();

        const handleLocationChange = (event) => {
            const nextChoice = event.detail?.choice ?? null;
            const nextArea = event.detail?.area ?? '';

            setChoice(nextChoice);
            setArea(nextArea);
            setShowPrompt(false);
        };
        const handlePromptRequest = () => {
    const storedChoice =
        readPreference(choiceKey);

    // The custom popup may be reopened when the user
    // has never answered or previously pressed No.
    //
    // It must NOT reopen after the user manually
    // disabled a previously enabled location.
    if (
        storedChoice === null ||
        storedChoice === 'declined'
    ) {
        setError('');
        setLoading(false);
        setShowPrompt(true);
    }
};

        window.addEventListener(preferenceEvent, handleLocationChange);
        window.addEventListener(
    promptRequestEvent,
    handlePromptRequest,
);

     return () => {
    window.removeEventListener(
        preferenceEvent,
        handleLocationChange,
    );

    window.removeEventListener(
        promptRequestEvent,
        handlePromptRequest,
    );
};
}, [enabled, showHeader]);

useEffect(() => {
    if (choice !== 'accepted' || !area) {
        return undefined;
    }

    const expiresAt = Number(readPreference(expiresAtKey));

   const hideHeaderLocation = () => {
    removePreference(expiresAtKey);
    setShowHeaderLocation(false);
};

    const remaining = expiresAt - Date.now();

    if (!expiresAt || remaining <= 0) {
        hideHeaderLocation();
        return undefined;
    }

    const timeoutId = window.setTimeout(
        hideHeaderLocation,
        remaining,
    );

    return () => window.clearTimeout(timeoutId);
}, [choice, area]);
    const declineLocation = () => {
        savePreference(
            choiceKey,
            'declined',
        );

        removePreference(areaKey);
        removePreference(expiresAtKey);

        setChoice('declined');
        setArea('');
        setError('');
        setLoading(false);
        setShowPrompt(false);
        notifyLocationChange(
          'declined',
          '',
     );
    };

  const requestLocation = () => {
    setError('');

    /*
     * Save Yes immediately so Safari remembers
     * the user's choice.
     */
    savePreference(
        choiceKey,
        'accepted',
    );

    setChoice('accepted');

    if (!navigator.geolocation) {
        setError(
            t('location.unsupported', {
                defaultValue:
                    'Location is not supported by this browser.',
            }),
        );

        return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const response =
                    await axios.post(
                        route(
                            'location.reverse',
                        ),
                        {
                            latitude:
                                position.coords
                                    .latitude,
                            longitude:
                                position.coords
                                    .longitude,
                        },
                        {
                            headers: {
                                Accept:
                                    'application/json',
                            },
                        },
                    );

                if (
                    response.data?.supported &&
                    response.data?.area
                ) {
                    const detectedArea =
                        response.data.area;

                    savePreference(
                        choiceKey,
                        'accepted',
                    );

                    savePreference(
                        areaKey,
                        detectedArea,
                    );
                    savePreference(
                        expiresAtKey,
                        String(Date.now() + locationDisplayDuration),
                    );

                    setChoice('accepted');
                    setArea(detectedArea);
                    setShowHeaderLocation(true);
                    setError('');
                    setShowPrompt(false);

                    /*
                     * Update the Profile form
                     * immediately.
                     */
                    notifyLocationChange(
                        'accepted',
                        detectedArea,
                    );
                } else {
                    /*
                     * The detected location is not
                     * a supported Lebanese area.
                     * Never save or display a country.
                     */
                    savePreference(
                        choiceKey,
                        'accepted',
                    );

                    removePreference(areaKey);
                    removePreference(expiresAtKey);

                    setChoice('accepted');
                    setArea('');
                    setError('');
                    setShowPrompt(false);

                    notifyLocationChange(
                        'accepted',
                        '',
                    );
                }
            } catch {
                setError(
                    t('location.error', {
                        defaultValue:
                            'Your area could not be identified. Please try again.',
                    }),
                );
            } finally {
                setLoading(false);
            }
        },

        (locationError) => {
            setLoading(false);

            /*
             * Code 1 means Safari/Chrome location
             * permission was rejected.
             */
            if (locationError.code === 1) {
                savePreference(
                    choiceKey,
                    'declined',
                );

                removePreference(areaKey);
                removePreference(expiresAtKey);

                setChoice('declined');
                setArea('');
                setError('');
                setShowPrompt(false);

                /*
                 * Keep the Profile form disabled
                 * without refreshing.
                 */
                notifyLocationChange(
                    'declined',
                    '',
                );

                return;
            }

            setError(
                t('location.error', {
                    defaultValue:
                        'Your area could not be identified. Please try again.',
                }),
            );
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
        },
    );
};

    if (!enabled || !ready) {
        return null;
    }

    return (
        <>
         {choice === 'accepted' &&
    area &&
    showHeader &&
    showHeaderLocation && (
                    <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto flex max-w-7xl items-center px-4 py-2 sm:px-6 lg:px-8">
                          <Link
                            href={`${route('profile.edit')}?section=location#location-preferences`}
                            className="group inline-flex items-center gap-2 rounded-lg text-start text-slate-600 transition hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400"
                            aria-label={t('location.manage', {
                            defaultValue:
                            'Manage location preference',
                            })}
                          >
                                 <svg
                                    className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

                                    <circle
                                        cx="12"
                                        cy="10"
                                        r="2.5"
                                    />
                                </svg>

                                <span>
                                    <span className="block text-[11px] leading-3 text-slate-500 dark:text-slate-400">
                                        {t(
                                            'location.your_area',
                                            {
                                                defaultValue:
                                                    'Your location',
                                            },
                                        )}
                                    </span>

                                    <span className="block max-w-52 cursor-pointer truncate text-sm font-bold text-slate-900 decoration-indigo-500 decoration-2 underline-offset-4 transition group-hover:text-indigo-600 group-hover:underline active:text-indigo-600 active:underline dark:text-white dark:decoration-indigo-400 dark:group-hover:text-indigo-400 dark:active:text-indigo-400">
                                        {area}
                                    </span>
                                </span>
                            </Link>
                        </div>
                    </div>
                )}

            {showPrompt && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="location-title"
                        dir={
                            isArabic
                                ? 'rtl'
                                : 'ltr'
                        }
                        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
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
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

                                <circle
                                    cx="12"
                                    cy="10"
                                    r="2.5"
                                />
                            </svg>
                        </div>

                        <h2
                            id="location-title"
                            className="mt-5 text-xl font-black text-slate-950 dark:text-white"
                        >
                            {t(
                                'location.question',
                                {
                                    defaultValue:
                                        'Do you want to allow your location?',
                                },
                            )}
                        </h2>

                        {error && (
                            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                {error}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={
                                    declineLocation
                                }
                                disabled={loading}
                                className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {t(
                                    'location.no',
                                    {
                                        defaultValue:
                                            'No',
                                    },
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    requestLocation
                                }
                                disabled={loading}
                                className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? t(
                                          'location.detecting',
                                          {
                                              defaultValue:
                                                  'Detecting...',
                                          },
                                      )
                                    : t(
                                          'location.yes',
                                          {
                                              defaultValue:
                                                  'Yes',
                                          },
                                      )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
