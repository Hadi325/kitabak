import FlashMessages from '@/Components/FlashMessages';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import { useImageCropper } from '@/Components/ImageCropDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import {
    useEffect,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

const resolveImageUrl = (value) => {
    if (!value) {
        return null;
    }

    if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('/')
    ) {
        return value;
    }

    return `/storage/${value}`;
};

const getBookCover = (book) => {
    if (!book) {
        return null;
    }

    if (book.cover_image_url) {
        return resolveImageUrl(
            book.cover_image_url,
        );
    }

    if (
        Array.isArray(book.images) &&
        book.images.length > 0
    ) {
        return resolveImageUrl(
            book.images[0].image_path,
        );
    }

    return null;
};

export default function EditListing({
    listing,
    canEditBook = false,
}) {
    const { t } =
        useTranslation('common');

   const book = listing.book ?? {};

const bookCategory =
    book.book_category ?? 'school';

const bookCover =
    getBookCover(book);
    const fileInput = useRef(null);
    const previewUrls = useRef([]);

    const {
        cropImage,
        takePhoto,
        cropDialog,
    } = useImageCropper();

    const [
        existingImages,
        setExistingImages,
    ] = useState(
        listing.images ?? [],
    );

    const [
        newPreviews,
        setNewPreviews,
    ] = useState([]);

    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        title: book.title ?? '',
        author: book.author ?? '',
        subject: book.subject ?? '',
        book_type:
            book.book_type ?? '',
        part: book.part ?? '',
        grade: book.grade ?? '',
        publisher:
            book.publisher ?? '',
        language:
            book.language ?? '',
      edition_year:
    book.edition_year ?? '',
edition_number:
    book.edition_number ?? '',
isbn: book.isbn ?? '',
       price: listing.price ?? '',
location:
    listing.location ?? '',
condition: listing.condition ?? '',
notes: listing.notes ?? '',

new_photos: [],
        remove_image_ids: [],

        _method: 'PATCH',
    });

    useEffect(() => {
        return () => {
            previewUrls.current.forEach(
                (url) => {
                    URL.revokeObjectURL(
                        url,
                    );
                },
            );
        };
    }, []);

    const totalPhotos =
        existingImages.length +
        data.new_photos.length;

    const addFiles = async (
        event,
    ) => {
        const selectedFiles =
            Array.from(
                event.target.files ??
                    [],
            ).filter((file) =>
                file.type.startsWith(
                    'image/',
                ),
            );

        event.target.value = '';

        const availablePlaces =
            8 - totalPhotos;

        if (
            availablePlaces < 1 ||
            selectedFiles.length < 1
        ) {
            return;
        }

        const filesToAdd =
            selectedFiles.slice(
                0,
                availablePlaces,
            );

        const croppedFiles = [];
        const previews = [];

        for (
            const selectedFile
            of filesToAdd
        ) {
            const croppedFile =
                await cropImage(
                    selectedFile,
                );

            if (!croppedFile) {
                continue;
            }

            const url =
                URL.createObjectURL(
                    croppedFile,
                );

            previewUrls.current.push(
                url,
            );

            croppedFiles.push(
                croppedFile,
            );

            previews.push({
                file: croppedFile,
                url,
            });
        }

        if (
            croppedFiles.length < 1
        ) {
            return;
        }

        setData(
            'new_photos',
            [
                ...data.new_photos,
                ...croppedFiles,
            ],
        );

        setNewPreviews(
            (current) => [
                ...current,
                ...previews,
            ],
        );
    };

    const takeNewPhoto =
        async () => {
            if (
                totalPhotos >= 8
            ) {
                return;
            }

            const photo =
                await takePhoto();

            if (!photo) {
                return;
            }

            const url =
                URL.createObjectURL(
                    photo,
                );

            previewUrls.current.push(
                url,
            );

            setData(
                'new_photos',
                [
                    ...data.new_photos,
                    photo,
                ],
            );

            setNewPreviews(
                (current) => [
                    ...current,
                    {
                        file: photo,
                        url,
                    },
                ],
            );
        };

    const removeExistingImage = (
        image,
    ) => {
        setExistingImages(
            (current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        image.id,
                ),
        );

        setData(
            'remove_image_ids',
            [
                ...data
                    .remove_image_ids,
                image.id,
            ],
        );
    };

    const removeNewImage = (
        index,
    ) => {
        const preview =
            newPreviews[index];

        if (preview?.url) {
            URL.revokeObjectURL(
                preview.url,
            );

            previewUrls.current =
                previewUrls.current.filter(
                    (url) =>
                        url !==
                        preview.url,
                );
        }

        setNewPreviews(
            (current) =>
                current.filter(
                    (
                        _,
                        itemIndex,
                    ) =>
                        itemIndex !==
                        index,
                ),
        );

        setData(
            'new_photos',
            data.new_photos.filter(
                (_, itemIndex) =>
                    itemIndex !==
                    index,
            ),
        );
    };

    const submit = (event) => {
        event.preventDefault();

        post(
            route(
                'listings.update',
                listing.id,
            ),
            {
                forceFormData: true,
                preserveScroll: true,
            },
        );
    };
const bookFields = [
    {
        id: 'title',
        label: t(
            'edit_listing.fields.title',
        ),
        required: true,
    },

    {
        id: 'author',
        label: t(
            'edit_listing.fields.author',
        ),
    },

    // Subject: School + University
    ...(bookCategory === 'school' ||
    bookCategory === 'university'
        ? [
              {
                  id: 'subject',
                  label: t(
                      'edit_listing.fields.subject',
                  ),
              },
          ]
        : []),

    // Book type: School only
    ...(bookCategory === 'school'
        ? [
              {
                  id: 'book_type',
                  label: t(
                      'book_metadata.book_type',
                  ),
              },
          ]
        : []),

    // Part: all 3 categories
    {
        id: 'part',
        label: t(
            'book_metadata.part',
        ),
    },

    // School layout needs Publisher after Part
    ...(bookCategory === 'school'
        ? [
              {
                  id: 'publisher',
                  label: t(
                      'edit_listing.fields.publisher',
                  ),
              },
              {
                  id: 'grade',
                  label: t(
                      'edit_listing.fields.grade',
                  ),
              },
              {
                  id: 'language',
                  label: t(
                      'edit_listing.fields.language',
                  ),
              },
              {
                  id: 'edition_year',
                  label: t(
                      'edit_listing.fields.edition_year',
                  ),
                  type: 'number',
              },
              {
                  id: 'edition_number',
                  label: t(
                      'edit_listing.fields.edition',
                  ),
                  type: 'number',
              },
              {
                  id: 'isbn',
                  label: t(
                      'edit_listing.fields.isbn',
                  ),
              },
          ]
        : []),

    // University layout
    ...(bookCategory === 'university'
        ? [
              {
                  id: 'publisher',
                  label: t(
                      'edit_listing.fields.publisher',
                  ),
              },
              {
                  id: 'language',
                  label: t(
                      'edit_listing.fields.language',
                  ),
              },
              {
                  id: 'edition_year',
                  label: t(
                      'edit_listing.fields.edition_year',
                  ),
                  type: 'number',
              },
              {
                  id: 'edition_number',
                  label: t(
                      'edit_listing.fields.edition',
                  ),
                  type: 'number',
              },
              {
                  id: 'isbn',
                  label: t(
                      'edit_listing.fields.isbn',
                  ),
              },
          ]
        : []),

    // Novel layout
    ...(bookCategory === 'novel'
        ? [
              {
                  id: 'publisher',
                  label: t(
                      'edit_listing.fields.publisher',
                  ),
              },
              {
                  id: 'language',
                  label: t(
                      'edit_listing.fields.language',
                  ),
              },
              {
                  id: 'edition_year',
                  label: t(
                      'edit_listing.fields.edition_year',
                  ),
                  type: 'number',
              },
              {
                  id: 'edition_number',
                  label: t(
                      'edit_listing.fields.edition',
                  ),
                  type: 'number',
              },
              {
                  id: 'isbn',
                  label: t(
                      'edit_listing.fields.isbn',
                  ),
              },
          ]
        : []),
];
    return (
        <AuthenticatedLayout>
            {cropDialog}

            <Head
                title={t(
                    'edit_listing.page_title',
                )}
            />

            <FlashMessages />

            <main className="page-shell max-w-7xl">
                <div className="mb-6">
                    <Link
                        href={route(
                            'my-books',
                        )}
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        <DirectionalArrowIcon
                            direction="back"
                        />

                        {t(
                            'edit_listing.back',
                        )}
                    </Link>

                    <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                        {t(
                            'edit_listing.title',
                        )}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                        {t(
                            'edit_listing.description',
                        )}
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    encType="multipart/form-data"
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.85fr)]">
                        <section className="p-5 sm:p-7">
                            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                                {t(
                                    'edit_listing.book_information',
                                )}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {t(
                                    'edit_listing.book_information_help',
                                )}
                            </p>

                            <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

<div className="mb-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">                                {bookCover ? (
                                    <img
                                        src={
                                            bookCover
                                        }
                                        alt={
                                            book.title ??
                                            ''
                                        }
                                        className="h-24 w-20 shrink-0 rounded-lg bg-white object-cover"
                                    />
                                ) : (
                                  <div className="grid h-24 w-20 shrink-0 place-items-center rounded-lg bg-slate-200 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
    <BookIcon />
</div>
                                )}

                                <div className="min-w-0">
<p className="text-sm font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">                                        {canEditBook
                                            ? t(
                                                  'edit_listing.book_information',
                                              )
                                            : t(
                                                  'edit_listing.catalog_found',
                                              )}
                                    </p>

<p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">                                        {canEditBook
                                            ? t(
                                                  'edit_listing.description',
                                              )
                                            : t(
                                                  'edit_listing.catalog_found_help',
                                              )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                                {bookFields.map(
                                    (
                                        field,
                                    ) =>
                                        canEditBook ? (
                                            <EditableBookField
                                                key={
                                                    field.id
                                                }
                                                id={
                                                    field.id
                                                }
                                                label={
                                                    field.label
                                                }
                                                value={
                                                    data[
                                                        field
                                                            .id
                                                    ]
                                                }
                                                error={
                                                    errors[
                                                        field
                                                            .id
                                                    ]
                                                }
                                                required={
                                                    field.required
                                                }
                                                type={
                                                    field.type ??
                                                    'text'
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setData(
                                                        field.id,
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                            />
                                        ) : (
                                            <ReadOnlyField
                                                key={
                                                    field.id
                                                }
                                                id={
                                                    field.id
                                                }
                                                label={
                                                    field.label
                                                }
                                                value={
                                                    field.id ===
                                                        'book_type' &&
                                                    book.book_type
                                                        ? t(
                                                              `book_metadata.${book.book_type}`,
                                                          )
                                                        : book[
                                                              field
                                                                  .id
                                                          ]
                                                }
                                                required={
                                                    field.required
                                                }
                                            />
                                        ),
                                )}
                            </div>
                        </section>

                        <aside className="border-t border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900 lg:border-s lg:border-t-0 sm:p-7">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                {t(
                                    'edit_listing.update_copy',
                                )}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {t(
                                    'edit_listing.update_copy_help',
                                )}
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="price"
                                        value={t(
                                            'edit_listing.fields.price',
                                        )}
                                    />

                                    <TextInput
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            data.price
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'price',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="mt-2 block w-full"
                                        placeholder="0.00"
                                        required
                                    />

                                    <InputError
                                        message={
                                            errors.price
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="location"
                                        value={t(
                                            'edit_listing.fields.location',
                                        )}
                                    />

                                    <TextInput
                                        id="location"
                                        value={
                                            data.location
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setData(
                                                'location',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="mt-2 block w-full"
                                        placeholder={t(
                                            'edit_listing.location_placeholder',
                                        )}
                                    />

                                    <InputError
                                        message={
                                            errors.location
                                        }
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
    <div>
        <InputLabel
            htmlFor="condition"
            value={t('book_form.listing_condition', {
                defaultValue: 'Condition',
            })}
        />

        <select
            id="condition"
            value={data.condition}
            onChange={(event) =>
                setData('condition', event.target.value)
            }
            required
            className="mt-2 block w-full rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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

        <InputError
            message={errors.condition}
            className="mt-2"
        />
    </div>

    <div>
        <InputLabel
            htmlFor="notes"
            value={t('book_form.listing_notes', {
                defaultValue: 'Notes (optional)',
            })}
        />

        <textarea
            id="notes"
            value={data.notes}
            onChange={(event) =>
                setData('notes', event.target.value)
            }
            maxLength={1000}
            rows={3}
            className="mt-2 block w-full resize-y rounded-xl border-slate-300 bg-white text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder={t(
                'book_form.listing_notes_placeholder',
                {
                    defaultValue:
                        'Describe writing, damage, missing pages, or other details...',
                },
            )}
        />

        <InputError
            message={errors.notes}
            className="mt-2"
        />
    </div>
</div>

                            <section className="mt-7">
                                <h3 className="text-base font-black text-slate-950 dark:text-white">
                                    {t(
                                        'edit_listing.photos_title',
                                    )}
                                </h3>

                                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                                    {t(
                                        'edit_listing.photos_help',
                                    )}
                                </p>

                                {totalPhotos >
                                    0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {existingImages.map(
                                            (
                                                image,
                                            ) => (
                                                <PhotoPreview
                                                    key={`existing-${image.id}`}
                                                    src={resolveImageUrl(
                                                        image.image_path,
                                                    )}
                                                    imageAlt={t(
                                                        'edit_listing.condition_photo',
                                                    )}
                                                    removeLabel={t(
                                                        'edit_listing.remove_photo',
                                                    )}
                                                    onRemove={() =>
                                                        removeExistingImage(
                                                            image,
                                                        )
                                                    }
                                                />
                                            ),
                                        )}

                                        {newPreviews.map(
                                            (
                                                photo,
                                                index,
                                            ) => (
                                                <PhotoPreview
                                                    key={
                                                        photo.url
                                                    }
                                                    src={
                                                        photo.url
                                                    }
                                                    imageAlt={t(
                                                        'edit_listing.condition_photo',
                                                    )}
                                                    removeLabel={t(
                                                        'edit_listing.remove_photo',
                                                    )}
                                                    onRemove={() =>
                                                        removeNewImage(
                                                            index,
                                                        )
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                )}

                                {totalPhotos <
                                    8 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={
                                                takeNewPhoto
                                            }
                                            className="min-h-14 rounded-xl border-2 border-dashed border-indigo-400 px-3 text-sm font-black text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/70 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                                        >
                                            {t(
                                                'edit_listing.take_photo',
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInput.current?.click()
                                            }
                                            className="min-h-14 rounded-xl border-2 border-dashed border-indigo-400 px-3 text-sm font-black text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/70 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                                        >
                                            {t(
                                                'edit_listing.add_photos',
                                            )}
                                        </button>
                                    </div>
                                )}

                                <input
                                    ref={
                                        fileInput
                                    }
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={
                                        addFiles
                                    }
                                    className="sr-only"
                                />

                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    {t(
                                        'edit_listing.photos_selected',
                                        {
                                            count: totalPhotos,
                                            maximum: 8,
                                        },
                                    )}
                                </p>

                                <InputError
                                    message={
                                        errors.new_photos ||
                                        errors[
                                            'new_photos.0'
                                        ] ||
                                        errors.remove_image_ids
                                    }
                                    className="mt-2"
                                />
                            </section>

                            <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
                                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                    {t(
                                        'edit_listing.required_help',
                                    )}
                                </p>

                                <PrimaryButton
                                    disabled={
                                        processing ||
                                        totalPhotos <
                                            1
                                    }
                                    className="w-full justify-center"
                                >
                                    {processing
                                        ? t(
                                              'edit_listing.saving',
                                          )
                                        : t(
                                              'edit_listing.save',
                                          )}
                                </PrimaryButton>

                                <Link
                                    href={route(
                                        'my-books',
                                    )}
                                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    {t(
                                        'edit_listing.cancel',
                                    )}
                                </Link>
                            </div>
                        </aside>
                    </div>
                </form>
            </main>
        </AuthenticatedLayout>
    );
}

function EditableBookField({
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    type = 'text',
}) {
    return (
        <div>
            <InputLabel
                htmlFor={id}
                value={`${label}${
                    required ? ' *' : ''
                }`}
            />

            <TextInput
                id={id}
                type={type}
                value={value ?? ''}
                onChange={onChange}
                className="mt-2 block w-full"
                required={required}
            />

            <InputError
                message={error}
                className="mt-2"
            />
        </div>
    );
}

function ReadOnlyField({
    id,
    label,
    value,
    required = false,
}) {
    return (
        <div>
            <InputLabel
                htmlFor={id}
                value={`${label}${
                    required ? ' *' : ''
                }`}
            />

            <TextInput
                id={id}
                type="text"
                value={value ?? ''}
                readOnly
                aria-readonly="true"
                tabIndex={-1}
                className="mt-2 block w-full cursor-not-allowed bg-slate-100 text-slate-600 opacity-80 dark:bg-slate-950 dark:text-slate-400"
            />
        </div>
    );
}

function PhotoPreview({
    src,
    onRemove,
    imageAlt,
    removeLabel,
}) {
    return (
        <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
            {src ? (
                <img
                    src={src}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="grid h-full w-full place-items-center text-slate-400">
                    <BookIcon />
                </div>
            )}

            <button
                type="button"
                onClick={onRemove}
                aria-label={removeLabel}
                title={removeLabel}
                className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/80 text-lg font-bold text-white shadow transition hover:bg-rose-600"
            >
                ×
            </button>
        </div>
    );
}

function BookIcon() {
    return (
        <svg
            className="h-9 w-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
        >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
            <path d="M4 5.5v16" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
        </svg>
    );
}