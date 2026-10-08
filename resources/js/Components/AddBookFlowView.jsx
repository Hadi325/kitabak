import ApplicationLogo from '@/Components/ApplicationLogo';
import BookAiPhotoAnalyzer from '@/Components/BookAiPhotoAnalyzer';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const locationChoiceKey = 'kitabak_location_choice';
const locationAreaKey = 'kitabak_location_area';
const locationExpiresAtKey = 'kitabak_location_expires_at';
const locationDisplayDuration = 30_000;
const locationPreferenceEvent = 'kitabak:location-preference-changed';
const locationPromptRequestEvent =
    'kitabak:location-prompt-requested';

function readLocationPreference(key) {
    try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) return storedValue;
    } catch {
        // Continue to the cookie fallback used by iPhone Safari.
    }

    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith(`${key}=`));

    return cookie
        ? decodeURIComponent(cookie.substring(key.length + 1))
        : null;
}

function saveLocationPreference(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // The cookie remains available as a fallback.
    }

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

function removeLocationPreference(key) {
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Also remove the cookie fallback.
    }

    document.cookie =
        `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
}

const grades = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'SE', 'SV', 'SG', 'LH',
];

const gradeLabels = {
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': 'Brevet',
    '10': 'Second',
    '11': 'Bac1',
    SE: 'SE',
    SV: 'SV',
    SG: 'SG',
    LH: 'LH',
};

const formatGradeLabel = (grade) => gradeLabels[grade] ?? grade;

const CameraIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 5 13 3H9L7.5 5H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-4.5Z" />
        <circle cx="11" cy="12.5" r="4" />
    </svg>
);

const LocationTargetIcon = ({ loading = false }) => (
    loading ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
    )
);

const GalleryIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 20" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12 4 4L19 6" />
    </svg>
);

function MobileAddBookHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
            <div className="relative mx-auto flex h-16 max-w-xl items-center justify-center px-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="absolute start-3 grid h-10 w-10 place-items-center rounded-xl text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                    aria-label="Back"
                >
                    <DirectionalArrowIcon direction="back" variant="chevron" className="h-6 w-6" />
                </button>

                <Link href={route('dashboard')} className="flex items-center gap-2">
                    <ApplicationLogo className="h-9 w-9 rounded-[28%]" />
                    <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">kitabak</span>
                </Link>
            </div>
        </header>
    );
}
function ProgressSteps({ current }) {
    const { t } = useTranslation('common');

    const steps = [
        {
            title: t('book_form.step_category'),
            description: t('book_form.step_category_help'),
        },
        {
            title: t('book_form.step_photos'),
            description: t('book_form.step_photos_help'),
        },
        {
            title: t('book_form.step_scan'),
            description: t('book_form.step_scan_help'),
        },
        {
            title: t('book_form.step_details'),
            description: t('book_form.step_details_help'),
        },
        {
            title: t('book_form.step_review'),
            description: t('book_form.step_review_help'),
        },
    ];

    return (
        <ol
            className="mb-5 grid grid-cols-5 items-start md:mb-7"
            aria-label={t('book_form.progress_label')}
        >
            {steps.map((step, index) => {
                const number = index + 1;
                const complete = number < current;
                const active = number === current;

                return (
                    <li
                        key={step.title}
                        className="relative min-w-0 text-center md:text-start"
                    >
                        {index < steps.length - 1 && (
                            <span
                                className={`absolute start-[calc(50%+1.35rem)] top-5 h-px w-[calc(100%-2.7rem)] md:start-11 md:w-[calc(100%-3.5rem)] ${
                                    number < current
                                        ? 'bg-indigo-500'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        )}

                        <div className="relative inline-flex flex-col items-center gap-2 md:flex-row md:items-start md:gap-3">
                            <span
                                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-sm font-black transition ${
                                    active
                                        ? 'border-indigo-600 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : complete
                                          ? 'border-indigo-400 bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-300'
                                          : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                }`}
                            >
                                {complete ? <CheckIcon /> : number}
                            </span>

                            <span className="min-w-0 pt-0 md:pt-0.5">
                                <strong
                                    className={`block truncate text-[10px] font-extrabold sm:text-xs md:text-sm ${
                                        active
                                            ? 'text-slate-950 dark:text-white'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {step.title}
                                </strong>

                                <span className="mt-0.5 hidden max-w-[10rem] text-xs leading-4 text-slate-400 lg:block">
                                    {step.description}
                                </span>
                            </span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function Field({ id, label, required = false, error, children, className = '' }) {
    return (
        <div className={className}>
            <InputLabel htmlFor={id} className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
                {label}
                {required && <span className="ms-1 text-rose-500">*</span>}
            </InputLabel>
            {children}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

function CategorySelection({ onSelect }) {
    const { t } = useTranslation('common');

  const categories = [
    {
        value: 'school',
     icon: (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
        aria-hidden="true"
    >
        {/* Top handle */}
        <path d="M9 6V5a3 3 0 0 1 6 0v1" />

        {/* Backpack body */}
        <rect
            x="5"
            y="6"
            width="14"
            height="15"
            rx="4"
        />

        {/* Front pocket */}
        <path d="M8 14h8v4H8z" />

        {/* Side straps */}
        <path d="M5 10H4a1 1 0 0 0-1 1v4" />
        <path d="M19 10h1a1 1 0 0 1 1 1v4" />
    </svg>
),
iconClass:
    'bg-amber-500/10 text-amber-400 ring-amber-400/10',
title: t('book_form.category_school'),
description: t('book_form.category_school_help'),
},
{
    value: 'university',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
                aria-hidden="true"
            >
                <path d="M3 9 12 4l9 5-9 5-9-5Z" />
                <path d="M7 11.5V16c2.7 2.2 7.3 2.2 10 0v-4.5" />
                <path d="M21 9v6" />
            </svg>
        ),
        iconClass:
            'bg-blue-500/10 text-blue-400 ring-blue-400/10',
        title: t('book_form.category_university'),
        description: t('book_form.category_university_help'),
    },
    {
        value: 'novel',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
                aria-hidden="true"
            >
                <path d="M3.5 5.5A3.5 3.5 0 0 1 7 4h3a2 2 0 0 1 2 2v14a3 3 0 0 0-3-3H3.5V5.5Z" />
                <path d="M20.5 5.5A3.5 3.5 0 0 0 17 4h-3a2 2 0 0 0-2 2v14a3 3 0 0 1 3-3h5.5V5.5Z" />
            </svg>
        ),
        iconClass:
            'bg-emerald-500/10 text-emerald-400 ring-emerald-400/10',
        title: t('book_form.category_novel'),
        description: t('book_form.category_novel_help'),
    },
];
    return (
        <section className="rounded-[1.6rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600 dark:text-indigo-300">
                    {t('book_form.category_eyebrow')}
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {t('book_form.category_title')}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                    {t('book_form.category_description')}
                </p>
            </div>

            <div className="mx-auto mt-7 grid max-w-4xl gap-4 md:grid-cols-3">
                {categories.map((category) => (
                    <button
    key={category.value}
    type="button"
    onClick={() => onSelect(category.value)}
    className="group flex min-h-52 flex-col items-center rounded-3xl border-2 border-slate-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:border-indigo-500 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-indigo-400"
>
    <span
        className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ring-1 transition duration-200 group-hover:scale-110 ${category.iconClass}`}
    >
        {category.icon}
    </span>

    <strong className="mt-4 min-h-7 text-lg font-black text-slate-950 dark:text-white">
        {category.title}
    </strong>

    <span className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {category.description}
    </span>
</button>
                ))}
            </div>
        </section>
    );
}

function MatchSelection({ matches, onSelect, onNone }) {
    const { t } = useTranslation('common');

    return (
        <section className="rounded-[1.6rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600 dark:text-indigo-300">{t('book_form.match_eyebrow')}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{t('book_form.similar_title')}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{t('book_form.similar_help')}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((book) => (
                    <button
                        key={book.id}
                        type="button"
                        onClick={() => onSelect(book)}
                        className="group flex min-h-32 gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/50"
                    >
                        {book.cover_image_url ? (
                            <img src={book.cover_image_url} alt="" className="h-24 w-16 shrink-0 rounded-lg object-contain shadow-sm" />
                        ) : (
                            <span className="grid h-24 w-16 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-400 dark:bg-indigo-500/10"><CameraIcon /></span>
                        )}
                        <span className="min-w-0">
                            <strong className="line-clamp-2 block text-sm font-extrabold text-slate-950 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{book.title}</strong>
                            <span className="mt-2 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{book.author || book.publisher}</span>
                            {(book.book_type || book.part) && (
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                    {book.book_type && <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">{t(`book_metadata.${book.book_type}`, { defaultValue: book.book_type })}</span>}
                                    {book.part && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t('book_metadata.part_value', { part: book.part })}</span>}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            <button type="button" onClick={onNone} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 text-sm font-extrabold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 sm:w-auto">
                {t('book_form.none_match')}
            </button>
        </section>
    );
}

function ConditionPhotos({ items, count, onTake, onAdd, onRemove, errors }) {
    const { t } = useTranslation('common');
    const menuDialogRef = useRef(null);
    const galleryInputRef = useRef(null);

    const closeMenu = () => menuDialogRef.current?.close();

    const takePhoto = () => {
        closeMenu();
        onTake();
    };

    const chooseFromGallery = () => {
        closeMenu();
        galleryInputRef.current?.click();
    };

    return (
        <div className="mt-5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
                {t('book_form.condition_photos')} <span className="text-rose-500">*</span>
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('book_form.condition_photos_help')}</p>

            <div className="mt-3 flex flex-wrap gap-2.5">
                {items.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:h-24 sm:w-24">
                        <img src={item.url} alt="" className="h-full w-full object-contain" />
                        {!item.isFront && !item.isBack && (
                            <button type="button" onClick={() => onRemove(item)} className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/85 text-white transition hover:bg-rose-600" aria-label={t('actions.remove_photo')}>
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                            </button>
                        )}
                    </div>
                ))}

                {count < 8 && (
                    <button
                        type="button"
                        onClick={() => menuDialogRef.current?.showModal()}
                        className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 px-1 text-center text-[11px] font-extrabold text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/5 dark:text-indigo-300 sm:h-24 sm:w-24"
                    >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900">
                            <CameraIcon />
                        </span>
                        <span className="mt-1.5 block leading-tight">{t('book_form.add_condition_photos')}</span>
                    </button>
                )}
            </div>

            <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={onAdd}
                className="sr-only"
            />

            <dialog
                ref={menuDialogRef}
                onCancel={(event) => {
                    event.preventDefault();
                    closeMenu();
                }}
                className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-slate-950/55 backdrop:backdrop-blur-[2px]"
                aria-labelledby="condition-photo-menu-title"
            >
                <div className="relative flex h-full w-full items-end justify-center">
                    <button
                        type="button"
                        onClick={closeMenu}
                        className="absolute inset-0"
                        aria-label={t('book_form.listing_cancel')}
                    />

                    <section className="relative w-full rounded-t-3xl bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:max-w-lg">
                        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

                        <h3 id="condition-photo-menu-title" className="text-lg font-extrabold text-slate-950 dark:text-white">
                            {t('book_form.add_condition_photos')}
                        </h3>

                        <div className="mt-4 space-y-2">
                            <button
                                type="button"
                                onClick={takePhoto}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <CameraIcon />
                                <span>{t('book_form.listing_camera')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={chooseFromGallery}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <GalleryIcon />
                                <span>{t('book_form.listing_gallery')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={closeMenu}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                <CloseIcon />
                                <span>{t('book_form.listing_cancel')}</span>
                            </button>
                        </div>
                    </section>
                </div>
            </dialog>

            <InputError message={errors.listing_photos || errors['listing_photos.0'] || errors.cover_image} className="mt-2" />
        </div>
    );
}

function DetectedLocationField({
    value,
    setData,
    error,
}) {
    const { t } = useTranslation('common');

    const [detecting, setDetecting] =
        useState(false);

    const [detectionError, setDetectionError] =
        useState('');

    const [locationChoice, setLocationChoice] =
        useState(() =>
            readLocationPreference(
                locationChoiceKey,
            ),
        );

        const [locationQuery, setLocationQuery] =
    useState(value ?? '');

const [locationSuggestions, setLocationSuggestions] =
    useState([]);

const [searchingLocation, setSearchingLocation] =
    useState(false);

const [showLocationSuggestions, setShowLocationSuggestions] =
    useState(false);

const [selectedLocation, setSelectedLocation] =
    useState(value ?? '');

    useEffect(() => {
    setLocationQuery(value ?? '');

    if (value) {
        setSelectedLocation(value);
    }
}, [value]);

useEffect(() => {
    const manuallyDisabled =
        locationChoice === 'disabled';

    const query = locationQuery.trim();

    if (
        !manuallyDisabled ||
        query.length < 2 ||
        selectedLocation === query
    ) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        setSearchingLocation(false);

        return undefined;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(
        async () => {
            setSearchingLocation(true);

            try {
                const response =
                    await axios.get(
                        route('location.search'),
                        {
                            params: {
                                q: query,
                            },
                            headers: {
                                Accept:
                                    'application/json',
                            },
                        },
                    );

                // Ignore an old request if the user
                // changed or cleared the field.
                if (cancelled) {
                    return;
                }

                const results =
                    response.data?.results ?? [];

                setLocationSuggestions(results);
                setShowLocationSuggestions(
                    results.length > 0,
                );
            } catch {
                if (!cancelled) {
                    setLocationSuggestions([]);
                    setShowLocationSuggestions(false);
                }
            } finally {
                if (!cancelled) {
                    setSearchingLocation(false);
                }
            }
        },
        250,
    );

    return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
    };
}, [
    locationQuery,
    locationChoice,
    selectedLocation,
]);

    useEffect(() => {
        const storedChoice =
            readLocationPreference(
                locationChoiceKey,
            );

        const storedArea =
            readLocationPreference(
                locationAreaKey,
            );

        setLocationChoice(storedChoice);

        if (
            storedChoice === 'accepted' &&
            !value &&
            storedArea
        ) {
            setData('location', storedArea);
        }

        const handleLocationChange = (event) => {
            const nextChoice =
                event.detail?.choice ?? null;

            const area =
                event.detail?.area ?? '';

            setLocationChoice(nextChoice);

            if (
                nextChoice === 'accepted' &&
                area
            ) {
                setData('location', area);
                setLocationQuery(area);
setSelectedLocation(area);
setLocationSuggestions([]);
setShowLocationSuggestions(false);
                return;
            }

          if (nextChoice === 'declined') {
    setData('location', '');
}
        };

        window.addEventListener(
            locationPreferenceEvent,
            handleLocationChange,
        );

//     const switchToManualLocation = () => {
//     if (locationChoice !== 'accepted') {
//         return;
//     }

//     const currentArea = value ?? '';

//     /*
//      * Automatic location is now disabled,
//      * but keep the current area in the input
//      * so the user can edit it.
//      */
//     saveLocationPreference(
//         locationChoiceKey,
//         'disabled',
//     );

//     removeLocationPreference(
//         locationAreaKey,
//     );

//     removeLocationPreference(
//         locationExpiresAtKey,
//     );

//     setLocationChoice('disabled');

//     setLocationQuery(currentArea);
//     setSelectedLocation(currentArea);

//     setLocationSuggestions([]);
//     setShowLocationSuggestions(false);
//     setDetectionError('');

//     window.dispatchEvent(
//         new CustomEvent(
//             locationPreferenceEvent,
//             {
//                 detail: {
//                     choice: 'disabled',
//                     area: '',
//                 },
//             },
//         ),
//     );
// };


        return () => {
            window.removeEventListener(
                locationPreferenceEvent,
                handleLocationChange,
            );
        };
    }, []);
    const switchToManualLocation = () => {
    if (locationChoice !== 'accepted') {
        return;
    }

    const currentArea = value ?? '';

    // Disable automatic location but keep the
    // detected area so the user can edit it.
    saveLocationPreference(
        locationChoiceKey,
        'disabled',
    );

    removeLocationPreference(
        locationAreaKey,
    );

    removeLocationPreference(
        locationExpiresAtKey,
    );

    setLocationChoice('disabled');

    setLocationQuery(currentArea);
    setSelectedLocation(currentArea);

    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setDetectionError('');

    window.dispatchEvent(
        new CustomEvent(
            locationPreferenceEvent,
            {
                detail: {
                    choice: 'disabled',
                    area: '',
                },
            },
        ),
    );
};

    const performLocationDetection = () => {
        setDetectionError('');

        if (!navigator.geolocation) {
            setDetectionError(
                t('location.unsupported', {
                    defaultValue:
                        'Location is not supported by this browser.',
                }),
            );

            return;
        }

        setDetecting(true);

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
                        !response.data?.supported ||
                        !response.data?.area
                    ) {
                        setDetectionError(
                            t('location.error', {
                                defaultValue:
                                    'Your area could not be identified. Please try again.',
                            }),
                        );

                        return;
                    }

                    const area =
                        response.data.area;

                    setData('location', area);

                    saveLocationPreference(
                        locationChoiceKey,
                        'accepted',
                    );

                    saveLocationPreference(
                        locationAreaKey,
                        area,
                    );

                    saveLocationPreference(
                        locationExpiresAtKey,
                        String(
                            Date.now() +
                                locationDisplayDuration,
                        ),
                    );

                    setLocationChoice(
                        'accepted',
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            locationPreferenceEvent,
                            {
                                detail: {
                                    choice:
                                        'accepted',
                                    area,
                                },
                            },
                        ),
                    );
                } catch (requestError) {
                    setDetectionError(
                        t(
                            requestError.response
                                ?.status === 503
                                ? 'location.service_unavailable'
                                : 'location.error',
                            {
                                defaultValue:
                                    'Your area could not be identified. Please try again.',
                            },
                        ),
                    );
                } finally {
                    setDetecting(false);
                }
            },

            (locationError) => {
                setDetecting(false);

                /*
                 * Browser permission was denied.
                 * Treat this like declining the
                 * location prompt.
                 */
                if (locationError.code === 1) {
                    saveLocationPreference(
                        locationChoiceKey,
                        'declined',
                    );

                    removeLocationPreference(
                        locationAreaKey,
                    );

                    removeLocationPreference(
                        locationExpiresAtKey,
                    );

                    setLocationChoice(
                        'declined',
                    );

                    setData('location', '');

                    window.dispatchEvent(
                        new CustomEvent(
                            locationPreferenceEvent,
                            {
                                detail: {
                                    choice:
                                        'declined',
                                    area: '',
                                },
                            },
                        ),
                    );

                    return;
                }

                setDetectionError(
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

    const disableLocation = () => {
        /*
         * "disabled" is different from "declined".
         *
         * declined:
         *   user has not accepted location yet,
         *   so clicking Detect should show the
         *   custom popup again.
         *
         * disabled:
         *   user previously enabled location and
         *   later switched it off themselves.
         *   Re-enabling should detect directly.
         */
        saveLocationPreference(
            locationChoiceKey,
            'disabled',
        );

        removeLocationPreference(
            locationAreaKey,
        );

        removeLocationPreference(
            locationExpiresAtKey,
        );

        setLocationChoice('disabled');
        setData('location', '');

        setLocationQuery('');
setSelectedLocation('');
setLocationSuggestions([]);
setShowLocationSuggestions(false);
        setDetectionError('');
        setDetecting(false);

        window.dispatchEvent(
            new CustomEvent(
                locationPreferenceEvent,
                {
                    detail: {
                        choice: 'disabled',
                        area: '',
                    },
                },
            ),
        );
    };

    const handleLocationButton = () => {
        if (detecting) {
            return;
        }

        const storedChoice =
            readLocationPreference(
                locationChoiceKey,
            );

        /*
         * Location is currently enabled:
         * the same button now acts as Disable.
         */
        if (
            storedChoice === 'accepted' &&
            value
        ) {
            disableLocation();
            return;
        }

        /*
         * Never answered, or answered No:
         * ask using the existing GuestLocation
         * popup.
         */
        if (
            storedChoice === null ||
            storedChoice === 'declined'
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    locationPromptRequestEvent,
                ),
            );

            return;
        }

        /*
         * Manually disabled after previously
         * enabling:
         *
         * don't show the custom popup again.
         * Detect directly.
         */
        if (storedChoice === 'disabled') {
            performLocationDetection();
            return;
        }

        /*
         * Fallback for an accepted preference
         * where the area is currently missing.
         */
        performLocationDetection();
    };

const handleManualLocationChange = (event) => {
    const nextValue = event.target.value;

    setLocationQuery(nextValue);
    setData('location', nextValue);

    // The user is editing manually, so the previous
    // autocomplete selection is no longer considered selected.
    setSelectedLocation('');

    if (nextValue.trim() === '') {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        setSearchingLocation(false);
    }
};
    const locationEnabled =
        locationChoice === 'accepted' &&
        Boolean(value);

    const detectionLabel = detecting
        ? t('location.detecting', {
              defaultValue: 'Detecting...',
          })
        : locationEnabled
          ? t('profile.disable_location', {
                defaultValue:
                    'Disable location',
            })
          : t('location.enable_location', {
                defaultValue:
                    'Detect location',
            });

    return (
        <Field
            id="location"
            label={t(
                'book_form.listing_location',
            )}
            required
            error={error}
        >
       <div className="relative mt-2">
    <div className="relative">
<TextInput
    id="location"
    value={
        locationChoice === 'disabled'
            ? locationQuery
            : value
    }
    onClick={switchToManualLocation}
    onChange={
        locationChoice === 'disabled'
            ? handleManualLocationChange
            : undefined
    }
    onFocus={switchToManualLocation}
    readOnly={locationChoice !== 'disabled'}
    required
    autoComplete="off"
    enterKeyHint="done"
    aria-readonly={
        locationChoice !== 'disabled'
    }
    className={`block w-full ${
        locationChoice === 'disabled' &&
        locationQuery.trim() !== ''
            ? ''
            : 'pe-12'
    } ${
        locationChoice === 'disabled'
            ? ''
            : 'cursor-text'
    }`}
    placeholder={t('location.enable_location', {
        defaultValue: 'Enable location',
    })}
/>

 {!(
    locationChoice === 'disabled' &&
    locationQuery.trim() !== ''
) && (
    <button
        type="button"
        onClick={handleLocationButton}
        disabled={detecting}
        title={detectionLabel}
        aria-label={detectionLabel}
        className="absolute inset-y-1 end-1 grid w-9 place-items-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70"
    >
        <LocationTargetIcon
            loading={detecting}
        />
    </button>
)}
    </div>

    {locationChoice === 'disabled' &&
        searchingLocation && (
            <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(
                    'location.searching',
                    {
                        defaultValue:
                            'Searching locations...',
                    },
                )}
            </p>
        )}

   {locationChoice === 'disabled' &&
    locationQuery.trim().length >= 2 &&
    showLocationSuggestions &&
    locationSuggestions.length > 0 && (
            <div className="absolute start-0 end-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <ul className="max-h-56 overflow-y-auto py-1">
                    {locationSuggestions.map(
                        (suggestion) => (
                            <li
                                key={
                                    suggestion.label
                                }
                            >
                                <button
                                    type="button"
                                    onMouseDown={(
                                        event,
                                    ) => {
                                        event.preventDefault();

                                        selectManualLocation(
                                            suggestion,
                                        );
                                    }}
                                    className="flex w-full items-start gap-2 px-3 py-2.5 text-start transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                                >
                                    <LocationTargetIcon />
<span className="min-w-0 text-sm font-bold text-slate-900 dark:text-white">
    {suggestion.area}
</span>
                                </button>
                            </li>
                        ),
                    )}
                </ul>
            </div>
        )}
</div>

            {detectionError && (
                <p className="mt-1.5 text-xs font-semibold leading-5 text-rose-600 dark:text-rose-300">
                    {detectionError}
                </p>
            )}
        </Field>
    );
}

const focusNextField = (event) => {
    if (event.key !== 'Enter') {
        return;
    }

    const current = event.target;

    if (
        current.tagName === 'TEXTAREA' ||
        current.type === 'submit' ||
        current.type === 'button'
    ) {
        return;
    }

    const form = current.closest('form');

    if (!form) {
        return;
    }


    const fields = Array.from(
        form.querySelectorAll(
            [
                'input:not([type="hidden"]):not([type="file"]):not([disabled]):not([readonly])',
                'select:not([disabled])',
                'textarea:not([disabled]):not([readonly])',
            ].join(','),
        ),
    ).filter(
        (element) =>
            element.offsetParent !== null &&
            element.tabIndex !== -1,
    );

    const currentIndex = fields.indexOf(current);

    if (
        currentIndex === -1 ||
        currentIndex >= fields.length - 1
    ) {
        return;
    }

    event.preventDefault();

    const nextField = fields[currentIndex + 1];

    nextField.focus();

    if (
        nextField instanceof HTMLInputElement &&
        nextField.type !== 'number' &&
        typeof nextField.select === 'function'
    ) {
        nextField.select();
    }
};

function DetailsPanel({
    data,
    setData,
    errors,
    onGoToReview,
    lookup,
    fieldIsLocked,
    catalogPreview,
    fileInput,
    selectCover,
    conditionPreviews,
    takeConditionPhoto,
    addConditionPhotos,
    removeConditionPhoto,
}) {
    const { t } = useTranslation('common');
    const isSchool = data.book_category === 'school';
//const isUniversity = data.book_category === 'university';
const isNovel = data.book_category === 'novel';

    return (
        <div className="grid overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.7fr)]">
            <section className="p-4 sm:p-6 lg:p-7">
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{t('book_form.basic_section')}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('book_form.basic_review_help')}</p>

                {lookup.status === 'found' && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"><CheckIcon /></span>
                        {t('book_form.catalog_found')}
                    </div>
                )}

                <div className="mt-5 flex items-center gap-4 lg:hidden">
                    <div className="grid h-32 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        {catalogPreview ? <img src={catalogPreview} alt="" className="h-full w-full object-contain" /> : <img src="/images/add-book/front-cover-v1.png" alt="" className="h-full w-full object-contain p-2" />}
                    </div>
                    <div className="min-w-0">
                        <strong className="line-clamp-2 block text-sm font-black text-slate-950 dark:text-white">{data.title || t('book_form.add_title')}</strong>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{data.author || data.publisher}</span>
                        <button type="button" onClick={() => fileInput.current?.click()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                            <CameraIcon /> {t('book_form.change_cover')}
                        </button>
                    </div>
                </div>

<div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:bg-white [&_input]:text-sm [&_input]:shadow-none dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-950">
    <Field
        id="title"
        label={t('book_form.title')}
        required
        error={errors.title}
        className="col-span-2 sm:col-span-1"
    >
        <TextInput
            id="title"
            value={data.title}
            enterKeyHint="go"
            onChange={(event) =>
                setData('title', event.target.value)
            }
            className="mt-2 block w-full"
            required
            readOnly={fieldIsLocked('title')}
            disabled={fieldIsLocked('title')}
        />
    </Field>

    <Field
        id="author"
        label={t('book_form.author')}
        error={errors.author}
        className="col-span-2 sm:col-span-1"
    >
        <TextInput
            id="author"
            value={data.author}
            enterKeyHint="next"
            onChange={(event) =>
                setData('author', event.target.value)
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked('author')}
            disabled={fieldIsLocked('author')}
        />
    </Field>

  {!isNovel && (
    <Field
        id="subject"
        label={t('book_form.subject')}
        error={errors.subject}
    >
        <TextInput
            id="subject"
            value={data.subject}
            enterKeyHint="next"
            onChange={(event) =>
                setData('subject', event.target.value)
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked('subject')}
            disabled={fieldIsLocked('subject')}
        />
    </Field>
)}

    {isSchool && (
    <Field
        id="book_type"
        label={t('book_metadata.book_type')}
        error={errors.book_type}
    >
        <select
            id="book_type"
            value={data.book_type}
            onChange={(event) =>
                setData('book_type', event.target.value)
            }
            className="field-control mt-2 min-h-11"
            disabled={fieldIsLocked('book_type')}
        >
            <option value="">
                {t('book_metadata.select_book_type')}
            </option>
            <option value="textbook">
                {t('book_metadata.textbook')}
            </option>
            <option value="workbook">
                {t('book_metadata.workbook')}
            </option>
        </select>
    </Field>
)}
    <Field
        id="part"
        label={t('book_metadata.part')}
        error={errors.part}
    >
        <TextInput
            id="part"
            value={data.part}
            enterKeyHint="next"
            onChange={(event) =>
                setData('part', event.target.value)
            }
            className="mt-2 block w-full"
            placeholder={t(
                'book_metadata.part_placeholder',
            )}
            readOnly={fieldIsLocked('part')}
            disabled={fieldIsLocked('part')}
        />
    </Field>

    <Field
        id="publisher"
        label={t('book_form.publisher')}
        error={errors.publisher}
    >
        <TextInput
            id="publisher"
            value={data.publisher}
            enterKeyHint="next"
            onChange={(event) =>
                setData(
                    'publisher',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked('publisher')}
            disabled={fieldIsLocked('publisher')}
        />
    </Field>

   {isSchool && (
    <Field
        id="grade"
        label={t('book_form.grade')}
        error={errors.grade}
    >
        <select
            id="grade"
            value={data.grade}
            onChange={(event) =>
                setData('grade', event.target.value)
            }
            className="field-control mt-2 min-h-11"
            disabled={fieldIsLocked('grade')}
        >
            <option value="">
                {t('book_form.select_grade')}
            </option>

            {grades.map((grade) => (
                <option key={grade} value={grade}>
                    {formatGradeLabel(grade)}
                </option>
            ))}
        </select>
    </Field>
)}

    <Field
        id="language"
        label={t('book_form.language')}
        error={errors.language}
    >
        <select
            id="language"
            value={data.language}
            onChange={(event) =>
                setData(
                    'language',
                    event.target.value,
                )
            }
            className="field-control mt-2 min-h-11"
            disabled={fieldIsLocked('language')}
        >
            <option value="english">
                {t('book_form.english')}
            </option>

            <option value="french">
                {t('book_form.french')}
            </option>

            <option value="arabic">
                {t('book_form.arabic')}
            </option>
        </select>
    </Field>

    <Field
        id="edition_year"
        label={t('book_form.year')}
        error={errors.edition_year}
    >
        <TextInput
            id="edition_year"
            type="number"
            min="1800"
            max={new Date().getFullYear() + 1}
            inputMode="numeric"
            enterKeyHint="next"
            value={data.edition_year}
            onChange={(event) =>
                setData(
                    'edition_year',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked(
                'edition_year',
            )}
            disabled={fieldIsLocked(
                'edition_year',
            )}
        />
    </Field>

    <Field
        id="edition_number"
        label={t('book_form.edition')}
        error={errors.edition_number}
    >
        <TextInput
            id="edition_number"
            type="number"
            min="1"
            max="999"
            inputMode="numeric"
            enterKeyHint="next"
            value={data.edition_number ?? ''}
            onChange={(event) =>
                setData(
                    'edition_number',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked(
                'edition_number',
            )}
            disabled={fieldIsLocked(
                'edition_number',
            )}
        />
    </Field>

    <Field
        id="isbn"
        label={t('book_form.isbn')}
        error={errors.isbn}
    >
        <TextInput
            id="isbn"
            value={data.isbn || data.barcode}
            enterKeyHint="next"
            onChange={(event) =>
                setData('isbn', event.target.value)
            }
            className="mt-2 block w-full"
            readOnly={fieldIsLocked('isbn')}
            disabled={fieldIsLocked('isbn')}
        />
    </Field>
</div>
            </section>

            <aside className="border-t border-slate-200/80 p-4 dark:border-slate-700 sm:p-6 lg:border-s lg:border-t-0 lg:p-7">
                <div className="hidden lg:block">
                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{t('book_form.preview')}</h3>
                    <div className="mt-3 flex items-center gap-4">
                        <div className="grid h-32 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            {catalogPreview ? <img src={catalogPreview} alt="" className="h-full w-full object-contain" /> : <img src="/images/add-book/front-cover-v1.png" alt="" className="h-full w-full object-contain p-2" />}
                        </div>
                        <div className="min-w-0">
                            <strong className="line-clamp-2 block text-sm font-black text-slate-950 dark:text-white">{data.title || t('book_form.add_title')}</strong>
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{data.author || data.publisher}</span>
                            <button type="button" onClick={() => fileInput.current?.click()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                                <CameraIcon /> {t('book_form.change_cover')}
                            </button>
                        </div>
                    </div>
                    <div className="my-5 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCover} className="sr-only" />
                <h3 className="text-base font-black text-slate-950 dark:text-white">{t('book_form.listing_title')}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('book_form.listing_description')}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:bg-white [&_input]:text-sm dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-950">
                   <Field
    id="price"
    label={t('book_form.listing_price')}
    required
    error={errors.price}
>
    <TextInput
        id="price"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
 enterKeyHint="next"
onKeyDown={(event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        const conditionField =
            document.getElementById('condition');

        conditionField?.focus();
    }
}}
        required
        value={data.price}
        onChange={(event) =>
            setData('price', event.target.value)
        }
        className="mt-2 block w-full"
        placeholder="0.00"
    />
</Field>
                  <DetectedLocationField
    value={data.location}
    setData={setData}
    error={errors.location}
/>
</div>

<div className="mt-5 space-y-4">
    <Field
        id="condition"
        label={t('book_form.listing_condition', {
            defaultValue: 'Condition',
        })}
        required
        error={errors.condition}
    >
     <select
    id="condition"
    value={data.condition}
    onChange={(event) => {
        setData('condition', event.target.value);

        window.requestAnimationFrame(() => {
            document.getElementById('notes')?.focus();
        });
    }}
    required
            className="mt-2 block min-h-11 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <option value="">
                {t('book_form.condition_select', {
                    defaultValue: 'Select condition',
                })}
            </option>

            <option value="like_new">
                {t('book_form.condition_like_new', {
                    defaultValue: 'Like New',
                })}
            </option>

            <option value="good">
                {t('book_form.condition_good', {
                    defaultValue: 'Good',
                })}
            </option>

            <option value="fair">
                {t('book_form.condition_fair', {
                    defaultValue: 'Fair',
                })}
            </option>

            <option value="very_old">
                {t('book_form.condition_very_old', {
                    defaultValue: 'Very Old',
                })}
            </option>
        </select>
    </Field>

    <Field
        id="notes"
        label={t('book_form.listing_notes', {
            defaultValue: 'Notes (optional)',
        })}
        error={errors.notes}
    >
        <textarea
    id="notes"
    value={data.notes}
    onChange={(event) =>
        setData('notes', event.target.value)
    }
    enterKeyHint="go"
    onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            onGoToReview();
        }
    }}
    maxLength={1000}
    rows={3}
            className="mt-2 block w-full resize-y rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder={t('book_form.listing_notes_placeholder', {
                defaultValue:
                    'Describe writing, damage, missing pages, or other details...',
            })}
        />
    </Field>
</div>

<ConditionPhotos
                 items={conditionPreviews} count={data.listing_photos.length} onTake={takeConditionPhoto} onAdd={addConditionPhotos} onRemove={removeConditionPhoto} errors={errors} />
            </aside>
        </div>
    );
}

function ReviewPanel({ data, catalogPreview, conditionPreviews, processing, errors, onEdit }) {
    const { t } = useTranslation('common');
    const hasEditionYear = String(data.edition_year ?? '').trim() !== '';
 const isSchool = data.book_category === 'school';
const isNovel = data.book_category === 'novel';

const details = [
    [
        t('book_form.category'),
        t(`book_form.category_${data.book_category}`, {
            defaultValue: data.book_category,
        }),
    ],
    [t('book_form.title'), data.title],
    [t('book_form.author'), data.author],

    ...(!isNovel
        ? [[t('book_form.subject'), data.subject]]
        : []),

    ...(isSchool
        ? [[
              t('book_metadata.book_type'),
              data.book_type
                  ? t(`book_metadata.${data.book_type}`, {
                        defaultValue: data.book_type,
                    })
                  : '',
          ]]
        : []),

    [t('book_metadata.part'), data.part],
    [t('book_form.publisher'), data.publisher],

    ...(isSchool
        ? [[t('book_form.grade'), formatGradeLabel(data.grade)]]
        : []),

    [
        t('book_form.language'),
        t(`book_form.${data.language}`, {
            defaultValue: data.language,
        }),
    ],
    [t('book_form.year'), data.edition_year],
    [t('book_form.edition'), data.edition_number],
    [t('book_form.isbn'), data.isbn || data.barcode],
];

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.55fr)]">
            <section className="rounded-[1.6rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <span>
                        <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{t('book_form.review_title')}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('book_form.review_description')}</p>
                    </span>
                    <button type="button" onClick={onEdit} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
                        {t('book_form.edit_details')}
                    </button>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <div className="mx-auto h-56 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-md dark:border-slate-700 dark:bg-slate-950 sm:mx-0">
                        {catalogPreview ? <img src={catalogPreview} alt="" className="h-full w-full object-contain" /> : <img src="/images/add-book/front-cover-v1.png" alt="" className="h-full w-full object-contain p-3" />}
                    </div>
                    <dl className="min-w-0 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                        {details.map(([label, value]) => (
                            <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5">
                                <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                                <dd className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">{t('book_form.listing_details')}</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
    <dt className="text-slate-500">
        {t('book_form.listing_price')}
    </dt>
    <dd className="font-bold text-slate-950 dark:text-white">
        ${data.price}
    </dd>
</div>

<div className="flex justify-between gap-4">
    <dt className="text-slate-500">
        {t('book_form.listing_location')}
    </dt>
    <dd className="text-end font-bold text-slate-950 dark:text-white">
        {data.location || '—'}
    </dd>
</div>

<div className="flex justify-between gap-4">
    <dt className="text-slate-500">
        {t('book_form.listing_condition', {
            defaultValue: 'Condition',
        })}
    </dt>
    <dd className="font-bold text-slate-950 dark:text-white">
        {data.condition
            ? t(`book_form.condition_${data.condition}`, {
                  defaultValue:
                      data.condition === 'like_new'
                          ? 'Like New'
                          : data.condition === 'very_old'
                            ? 'Very Old'
                            : data.condition
                                  .charAt(0)
                                  .toUpperCase() +
                              data.condition.slice(1),
              })
            : '—'}
    </dd>
</div>

<div className="flex justify-between gap-4">
    <dt className="text-slate-500">
        {t('book_form.listing_notes', {
            defaultValue: 'Notes',
        })}
    </dt>
    <dd className="max-w-[60%] whitespace-pre-wrap text-end font-bold text-slate-950 dark:text-white">
        {data.notes?.trim() || '—'}
    </dd>
</div>
                        </dl>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">{t('book_form.condition_count', { count: conditionPreviews.length })}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {conditionPreviews.map((item, index) => <img key={`${item.file.name}-${index}`} src={item.url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-contain dark:border-slate-700" />)}
                        </div>
                    </div>
                </div>
            </section>

            <aside className="rounded-[1.6rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                <div className="flex gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-500/15">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M9 18h6M10 22h4M8.3 14.5A7 7 0 1 1 15.7 14.5C14.7 15.4 14.2 16 14 17h-4c-.2-1-.7-1.6-1.7-2.5Z" /></svg>
                    </span>
                    <span>
                        <h3 className="text-base font-black text-slate-950 dark:text-white">{t('book_form.publish_tip_title')}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('book_form.publish_tip_help')}</p>
                    </span>
                </div>

                <ul className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {[t('book_form.check_information'), t('book_form.check_listing'), t('book_form.check_photos')].map((label) => (
                        <li key={label} className="flex items-center gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><CheckIcon /></span>{label}</li>
                    ))}
                    <li className={`flex items-start gap-3 ${hasEditionYear ? '' : 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'}`}>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${hasEditionYear ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            {hasEditionYear ? (
                                <CheckIcon />
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 7v6" /><path d="M12 17h.01" /></svg>
                            )}
                        </span>
                        <span className="min-w-0">
                            <strong className="block">{t(hasEditionYear ? 'edition_year_review.provided' : 'edition_year_review.missing', { year: data.edition_year })}</strong>
                            {!hasEditionYear && <span className="mt-1 block text-xs font-medium leading-5 text-amber-800 dark:text-amber-200">{t('edition_year_review.missing_help')}</span>}
                        </span>
                    </li>
                </ul>

                <button type="submit" disabled={processing} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-base font-black text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none">
                    {processing ? t('book_form.saving') : t('book_form.submit_add')}
                    <DirectionalArrowIcon />
                </button>

                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    {t('book_form.publish_visibility')}
                </p>
                <InputError message={Object.values(errors)[0]} className="mt-3" />
            </aside>
        </div>
    );
}

export default function AddBookFlowView({
    cropDialog,
    data,
    setData,
    selectBookCategory,
    processing,
    errors,
    submit,
    stage,
    setStage,
    goBackStage,
    backConfirmation,
    cancelBackStage,
    confirmBackStage,
    lookup,
    catalogMatches,
    applyAiResult,
    selectCatalogMatch,
    fieldIsLocked,
    useFrontAsCatalogAndListingPhoto,
    useBackAsListingPhoto,
    lookupScannedBook,
    openManualEntry,
    preview,
    fileInput,
    selectCover,
    initialBack,
    conditionPreviews,
    takeConditionPhoto,
    addConditionPhotos,
    removeConditionPhoto,
}) {
    const { t } = useTranslation('common');
    const { t: aiT } = useTranslation('bookAi');
    const formRef = useRef(null);
    const [analysisStatus, setAnalysisStatus] = useState('idle');
    const [reviewMessage, setReviewMessage] = useState('');
    const analysisBusy = ['scanning', 'lookup', 'loading'].includes(analysisStatus);

const currentStep =
    stage === 'category'
        ? 1
        : stage === 'analyze'
          ? analysisBusy
              ? 3
              : 2
          : stage === 'match' || stage === 'form'
            ? 4
            : 5;    const catalogPreview = useMemo(
        () => preview || conditionPreviews.find((item) => item.isFront)?.url || lookup.book?.cover_image_url || null,
        [conditionPreviews, lookup.book?.cover_image_url, preview],
    );

    const goToReview = () => {
        setReviewMessage('');
        if (!formRef.current?.reportValidity()) return;

        if (!data.listing_photos.length) {
            setReviewMessage(t('book_form.condition_required'));
            return;
        }

        setStage('review');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const editDetails = () => {
    setReviewMessage('');
    setStage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

    const goBackFromDetails = () => {
        setReviewMessage('');
        goBackStage();
    };

const desktopDescription =
    stage === 'category'
        ? t('book_form.category_description')
        : stage === 'review'
          ? t('book_form.review_page_description')
          : stage === 'form' || stage === 'match'
            ? t('book_form.confirm_description')
            : t('book_form.add_description');

    return (
        <AuthenticatedLayout compactMobile hideLocation mobileHeader={<MobileAddBookHeader />}>
            {cropDialog}
            <Modal
                show={Boolean(backConfirmation)}
                onClose={cancelBackStage}
                maxWidth="sm"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                                <path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z" />
                            </svg>
                        </span>

                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                {t('book_form.back_confirm_title')}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {t(
                                    backConfirmation?.leaving
                                        ? 'book_form.back_confirm_exit_description'
                                        : 'book_form.back_confirm_step_description',
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={cancelBackStage}
                            className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {t('book_form.back_confirm_stay')}
                        </button>
                        <button
                            type="button"
                            onClick={confirmBackStage}
                            className="min-h-12 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
                        >
                            {t('book_form.back_confirm_continue')}
                        </button>
                    </div>
                </div>
            </Modal>
            <Head title={t('book_form.add_title')} />

            <main className="add-book-page min-h-[calc(100vh-4rem)] overflow-hidden">
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8 md:pb-12 lg:px-8">
                    <header className="relative mb-5 md:mb-7">
                        <div className="max-w-3xl">
                            <p className="hidden text-[11px] font-black uppercase tracking-[.28em] text-indigo-500 md:block">{t('book_form.share_knowledge')}</p>
                            <h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-slate-950 dark:text-white sm:text-4xl">
                                <span className="md:hidden">{analysisBusy ? aiT('reading_title') : stage === 'form' ? t('book_form.confirm_title') : stage === 'review' ? t('book_form.review_title') : t('book_form.add_title')}</span>
                                <span className="hidden md:inline">{t('book_form.add_title')}</span>
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-base">
                                <span className="md:hidden">{analysisBusy ? aiT('reading_description') : stage === 'form' ? t('book_form.confirm_description') : stage === 'review' ? t('book_form.review_page_description') : t('book_form.mobile_add_description')}</span>
                                <span className="hidden md:inline">{desktopDescription}</span>
                            </p>
                        </div>

                        <img src="/images/add-book/header-books-v1.png" alt="" className="absolute end-0 top-0 hidden h-28 w-72 object-contain lg:block" />
                    </header>

                    <ProgressSteps current={currentStep} />

<form
    ref={formRef}
    onSubmit={submit}
    onKeyDown={(event) => {
    if (event.key === 'Enter') {
        event.stopPropagation();
    }

    focusNextField(event);
}}
    encType="multipart/form-data"
>
{stage === 'category' && (
    <CategorySelection
        onSelect={selectBookCategory}
    />
)}
                        {stage === 'analyze' && (
                           <BookAiPhotoAnalyzer
    disabled={processing}
    bookCategory={data.book_category}
    initialFront={data.cover_image}
                                initialBack={initialBack}
                                onResult={applyAiResult}
                                onFrontChange={useFrontAsCatalogAndListingPhoto}
                                onBackChange={useBackAsListingPhoto}
                                onIdentifierDetected={lookupScannedBook}
                                onStatusChange={setAnalysisStatus}
                                onManualEntry={openManualEntry}
                            />
                        )}

                        {stage === 'match' && (
                            <MatchSelection
                                matches={catalogMatches}
                                onSelect={selectCatalogMatch}
                                onNone={() => {
    setData('catalog_mode', 'new');
    setData('book_id', '');
    setStage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}}
                            />
                        )}

                        {stage === 'form' && (
                            <>
                                <DetailsPanel
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    onGoToReview={goToReview}
                                    lookup={lookup}
                                    fieldIsLocked={fieldIsLocked}
                                    catalogPreview={catalogPreview}
                                    fileInput={fileInput}
                                    selectCover={selectCover}
                                    conditionPreviews={conditionPreviews}
                                    takeConditionPhoto={takeConditionPhoto}
                                    addConditionPhotos={addConditionPhotos}
                                    removeConditionPhoto={removeConditionPhoto}
                                />

                                {reviewMessage && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{reviewMessage}</div>}

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <button type="button" onClick={goBackFromDetails} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-200">
                                        <DirectionalArrowIcon direction="back" /> {t('actions.back')}
                                    </button>
                                    <button type="button" onClick={goToReview} className="inline-flex min-h-12 min-w-36 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-xl dark:shadow-none">
                                        {t('actions.next')} <DirectionalArrowIcon />
                                    </button>
                                </div>
                            </>
                        )}

                        {stage === 'review' && (
                            <>
                                <ReviewPanel data={data} catalogPreview={catalogPreview} conditionPreviews={conditionPreviews} processing={processing} errors={errors} onEdit={editDetails} />
                                <button type="button" onClick={editDetails} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-200">
                                    <DirectionalArrowIcon direction="back" /> {t('actions.back')}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
