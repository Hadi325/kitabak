import FlashMessages from '@/Components/FlashMessages';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import { useImageCropper } from '@/Components/ImageCropDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const grades = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    'SE',
    'SV',
    'SG',
    'LH',
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

const formatGradeLabel = (grade) => {
    return gradeLabels[grade] ?? grade;
};

/**
 * Supports:
 * - Laravel Cloud/R2 URLs: https://...
 * - New localhost URLs: /storage/book_covers/...
 * - Old database paths: book_covers/...
 */
const resolveImageUrl = (value) => {
    if (!value) {
        return null;
    }

    if (
        value.startsWith('http://') ||
        value.startsWith('https://')
    ) {
        return value;
    }

    if (value.startsWith('/')) {
        return value;
    }

    return `/storage/${value}`;
};

export default function EditBook({ book }) {
    const { t } = useTranslation('common');
        const bookCategory = book.book_category ?? 'school';

    const isSchool = bookCategory === 'school';
    const isUniversity = bookCategory === 'university';
    const isNovel = bookCategory === 'novel';
    const { cropImage, takePhoto, cropDialog } = useImageCropper();
    const fileInput = useRef(null);
    const galleryInput = useRef(null);
    const coverMenuHistoryId = useRef(null);

    const [coverMenuOpen, setCoverMenuOpen] = useState(false);

    const existingCover = resolveImageUrl(book.cover_image_url);

    const [preview, setPreview] = useState(existingCover);
    const [objectPreview, setObjectPreview] = useState(null);

    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        title: book.title ?? '',
        subject: book.subject ?? '',
        book_type: book.book_type ?? '',
        part: book.part ?? '',
        grade: book.grade ?? '',
        publisher: book.publisher ?? '',
        author: book.author ?? '',
        language: book.language ?? 'english',
        edition_year: book.edition_year ?? '',
        edition_number: book.edition_number ?? '',
        isbn: book.isbn ?? '',
        cover_image: null,
        remove_cover: false,
        _method: 'PUT',
    });

    useEffect(() => {
        return () => {
            if (objectPreview) {
                URL.revokeObjectURL(objectPreview);
            }
        };
    }, [objectPreview]);
    useEffect(() => {
        if (!coverMenuOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [coverMenuOpen]);

    useEffect(() => {
        if (!coverMenuOpen) {
            return undefined;
        }

        const historyId = `edit-cover-menu-${Date.now()}`;
        coverMenuHistoryId.current = historyId;

        window.history.pushState(
            {
                ...window.history.state,
                editCoverMenu: historyId,
            },
            '',
            window.location.href,
        );

        const handleBrowserBack = () => {
            if (coverMenuHistoryId.current === historyId) {
                coverMenuHistoryId.current = null;
                setCoverMenuOpen(false);
            }
        };

        window.addEventListener('popstate', handleBrowserBack);

        return () => {
            window.removeEventListener('popstate', handleBrowserBack);
        };
    }, [coverMenuOpen]);

    const openCoverMenu = () => {
        setCoverMenuOpen(true);
    };

    const closeCoverMenu = () => {
        const currentState = {
            ...window.history.state,
        };

        delete currentState.editCoverMenu;

        window.history.replaceState(
            currentState,
            '',
            window.location.href,
        );

        coverMenuHistoryId.current = null;
        setCoverMenuOpen(false);
    };

    const applyCover = (file) => {
        if (objectPreview) {
            URL.revokeObjectURL(objectPreview);
        }

        const nextPreview = URL.createObjectURL(file);

        setObjectPreview(nextPreview);
        setPreview(nextPreview);
        setData('cover_image', file);
        setData('remove_cover', false);
    };

    const selectCover = async (event) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = '';
        if (!selected) return;

        const file = await cropImage(selected);
        if (!file) return;

        applyCover(file);
    };

    const openCoverCamera = async () => {
        closeCoverMenu();

        const file = await takePhoto();
        if (!file) return;

        applyCover(file);
    };

    const openCoverGallery = () => {
        galleryInput.current?.click();
        closeCoverMenu();
    };

    const openCoverFiles = () => {
        fileInput.current?.click();
        closeCoverMenu();
    };

    const removeCover = () => {
        if (objectPreview) {
            URL.revokeObjectURL(objectPreview);
        }

        setObjectPreview(null);
        setPreview(null);

        setData((current) => ({
            ...current,
            cover_image: null,
            remove_cover: true,
        }));

        [fileInput, galleryInput].forEach((input) => {
            if (input.current) {
                input.current.value = '';
            }
        });
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('books.update', book.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            {cropDialog}
            <Head title={t('book_form.edit_title')} />
            <FlashMessages />

            <main className="page-shell max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {t('book_form.eyebrow')}
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                            {t('book_form.edit_title')}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                            {t('book_form.edit_description')}
                        </p>
                    </div>

                    <Link
                        href={route('books')}
                        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300"
                    >
                        <DirectionalArrowIcon direction="back" />
                        {t('book_form.back_catalog')}
                    </Link>
                </div>

                <form
                    onSubmit={submit}
                    encType="multipart/form-data"
                    className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)] lg:items-start"
                >
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                                {t('book_form.basic_section')}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {t('book_form.basic_help')}
                            </p>
                        </div>

                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
    {/* TITLE */}
    <Field
        id="title"
        label={t('book_form.title')}
        required
        error={errors.title}
    >
        <TextInput
            id="title"
            value={data.title}
            onChange={(event) =>
                setData('title', event.target.value)
            }
            className="mt-2 block w-full"
            required
        />
    </Field>

    {/* AUTHOR */}
    <Field
        id="author"
        label={t('book_form.author')}
        error={errors.author}
    >
        <TextInput
            id="author"
            value={data.author}
            onChange={(event) =>
                setData('author', event.target.value)
            }
            className="mt-2 block w-full"
        />
    </Field>

    {/* SUBJECT: SCHOOL + UNIVERSITY */}
    {(isSchool || isUniversity) && (
        <Field
            id="subject"
            label={t('book_form.subject')}
            error={errors.subject}
        >
            <TextInput
                id="subject"
                value={data.subject}
                onChange={(event) =>
                    setData(
                        'subject',
                        event.target.value,
                    )
                }
                className="mt-2 block w-full"
            />
        </Field>
    )}

    {/* BOOK TYPE: SCHOOL ONLY */}
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
                    setData(
                        'book_type',
                        event.target.value,
                    )
                }
                className="field-control mt-2 min-h-11"
            >
                <option value="">
                    {t(
                        'book_metadata.select_book_type',
                    )}
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

    {/* PART: ALL CATEGORIES */}
    <Field
        id="part"
        label={t('book_metadata.part')}
        error={errors.part}
    >
        <TextInput
            id="part"
            value={data.part}
            onChange={(event) =>
                setData('part', event.target.value)
            }
            className="mt-2 block w-full"
            placeholder={t(
                'book_metadata.part_placeholder',
            )}
        />
    </Field>

    {/* PUBLISHER */}
    <Field
        id="publisher"
        label={t('book_form.publisher')}
        error={errors.publisher}
    >
        <TextInput
            id="publisher"
            value={data.publisher}
            onChange={(event) =>
                setData(
                    'publisher',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
        />
    </Field>

    {/* GRADE: SCHOOL ONLY */}
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
                    setData(
                        'grade',
                        event.target.value,
                    )
                }
                className="field-control mt-2 min-h-11"
            >
                <option value="">
                    {t('book_form.select_grade')}
                </option>

                {grades.map((grade) => (
                    <option
                        key={grade}
                        value={grade}
                    >
                        {formatGradeLabel(grade)}
                    </option>
                ))}
            </select>
        </Field>
    )}

    {/* LANGUAGE */}
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

    {/* EDITION YEAR */}
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
            value={data.edition_year}
            onChange={(event) =>
                setData(
                    'edition_year',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
        />
    </Field>

    {/* EDITION */}
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
            value={data.edition_number}
            onChange={(event) =>
                setData(
                    'edition_number',
                    event.target.value,
                )
            }
            className="mt-2 block w-full"
        />
    </Field>

    {/* ISBN */}
    <Field
        id="isbn"
        label={t('book_form.isbn')}
        error={errors.isbn}
    >
        <TextInput
            id="isbn"
            value={data.isbn}
            onChange={(event) =>
                setData('isbn', event.target.value)
            }
            className="mt-2 block w-full"
        />
    </Field>
</div>
                    </section>

                    <aside className="space-y-5 lg:sticky lg:top-24">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                                {t('book_form.cover_section')}
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {t('book_form.cover_help')}
                            </p>

                           <button
                                type="button"
                                onClick={openCoverMenu}
                                className="mt-5 block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-indigo-500/10"
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt={t(
                                            'book_form.preview'
                                        )}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>
                                        <svg
                                            className="mx-auto h-10 w-10"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5" />
                                        </svg>

                                        <span className="mt-3 block text-sm font-semibold">
                                            {t(
                                                'book_form.choose_cover'
                                            )}
                                        </span>
                                    </span>
                                )}
                            </button>
                                                        {preview && (
                                <button
                                    type="button"
                                    onClick={removeCover}
                                    className="mt-2 w-full rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                >
                                    {t(
                                        'book_form.remove_cover',
                                    )}
                                </button>
                            )}

                                                        {/* Upload from the device file manager */}
                            <input
                                ref={fileInput}
                                type="file"
                                onChange={selectCover}
                                className="sr-only"
                            />

                            {/* Choose from the photo gallery */}
                            <input
                                ref={galleryInput}
                                type="file"
                                accept="image/*"
                                onChange={selectCover}
                                className="sr-only"
                            />

                            <InputError
                                message={errors.cover_image}
                                className="mt-2"
                            />

                            <button
                                type="button"
                                onClick={openCoverMenu}
                                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {preview
                                    ? t(
                                          'book_form.replace_cover'
                                      )
                                    : t(
                                          'book_form.choose_cover'
                                      )}
                            </button>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <PrimaryButton
                                disabled={processing}
                                className="w-full"
                            >
                                {processing
                                    ? t('book_form.saving')
                                    : t(
                                          'book_form.submit_edit'
                                      )}
                            </PrimaryButton>
                        </section>
                    </aside>
                </form>
                       </main>

            {coverMenuOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cover-menu-title"
                >
                    {/* Dark background */}
                    <button
                        type="button"
                        aria-label={t('actions.close', { defaultValue: 'Close' })}
                        onClick={closeCoverMenu}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
                    />

                    {/* Centered bottom menu */}
                    <div className="relative w-full rounded-t-3xl bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:max-w-lg">
                        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

                        <h3
                            id="cover-menu-title"
                            className="text-lg font-extrabold text-slate-950 dark:text-white"
                        >
                            {t('book_form.choose_cover', {
                                defaultValue: 'Choose cover',
                            })}
                        </h3>

                        <div className="mt-4 space-y-2">
                            <CoverMenuButton
                                type="camera"
                                label={t(
                                    'book_form.listing_camera',
                                    {
                                        defaultValue:
                                            'Take photo',
                                    },
                                )}
                                onClick={openCoverCamera}
                            />

                            <CoverMenuButton
                                type="gallery"
                                label={t(
                                    'book_form.listing_gallery',
                                    {
                                        defaultValue:
                                            'Choose from gallery',
                                    },
                                )}
                                onClick={openCoverGallery}
                            />

                            <CoverMenuButton
                                type="upload"
                                label={t(
                                    'book_form.listing_upload',
                                    {
                                        defaultValue:
                                            'Upload file',
                                    },
                                )}
                                onClick={openCoverFiles}
                            />

                            {/* Same Cancel row as Home */}
                            <button
                                type="button"
                                onClick={closeCoverMenu}
                                className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-rose-500 transition hover:bg-rose-500/10"
                            >
                                <svg
                                    className="h-6 w-6 shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    aria-hidden="true"
                                >
                                    <path d="M6 6l12 12" />
                                    <path d="M18 6 6 18" />
                                </svg>

                                <span>
                                    {t(
                                        'book_form.listing_cancel',
                                        {
                                            defaultValue:
                                                'Cancel',
                                        },
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}

function Field({
    id,
    label,
    required = false,
    error,
    children,
}) {
    return (
        <div>
            <InputLabel htmlFor={id}>
                {label}

                {required && (
                    <span className="ms-1 text-rose-500">
                        *
                    </span>
                )}
            </InputLabel>

            {children}

            <InputError
                message={error}
                className="mt-2"
            />
        </div>
    );
}

function CoverMenuButton({ type, label, onClick }) {
    const icons = {
        camera: (
            <>
                <path d="M14.5 5H9.5L8 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
                <circle cx="12" cy="13" r="3" />
            </>
        ),
        gallery: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 20" />
            </>
        ),
        upload: (
            <>
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
            </>
        ),
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
            <svg
                className="h-6 w-6 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {icons[type]}
            </svg>

            <span>{label}</span>
        </button>
    );
}
