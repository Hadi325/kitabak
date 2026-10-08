import { useImageCropper } from '@/Components/ImageCropDialog';
import AddBookFlowView from '@/Components/AddBookFlowView';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

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

const addBookHistoryKey = 'kitabakAddBookStage';
const addBookHistoryPositionKey =
    'kitabakAddBookPosition';
const addBookHistoryBoundaryKey =
    'kitabakAddBookBoundary';
const addBookHistoryScrollKey =
    'kitabakAddBookScrollY';
const addBookStages = new Set([
    'category',
    'analyze',
    'match',
    'form',
    'review',
]);

const normalizeLanguage = (language) => {
    const value = String(language ?? '')
        .trim()
        .toLowerCase();

    if (
        ['ar', 'ara', 'arabic', 'العربية'].includes(
            value,
        )
    ) {
        return 'arabic';
    }

    if (
        [
            'fr',
            'fra',
            'fre',
            'french',
            'français',
            'francais',
        ].includes(value)
    ) {
        return 'french';
    }

    if (
        ['en', 'eng', 'english'].includes(value)
    ) {
        return 'english';
    }

    return 'english';
};

export default function AddBook() {
    const { cropImage, takePhoto, cropDialog } = useImageCropper();
    const fileInput = useRef(null);
    const lookupRequest = useRef(null);
    const conditionPreviewsRef = useRef([]);
  const backCoverFileRef = useRef(null);
const frontCoverFileRef = useRef(null);
const historyTraversalRef = useRef(false);
    const confirmedHistoryRef = useRef(false);
    const activeHistoryStateRef = useRef(
        typeof window !== 'undefined'
            ? window.history.state ?? {}
            : {},
    );
    const addBookUrlRef = useRef(
        typeof window !== 'undefined'
            ? window.location.href
            : '',
    );

    const [preview, setPreview] =
        useState(null);
    const [stage, setStage] = useState(() => {
     if (typeof window === 'undefined') {
    return 'category';
}

        const historyState =
            window.history.state ?? {};
        const historyStage =
            historyState[addBookHistoryKey];
        const historyPosition =
            historyState[
                addBookHistoryPositionKey
            ];

       return addBookStages.has(historyStage) &&
    Number.isInteger(historyPosition)
    ? historyStage
    : 'category';
    });
    const historyStageRef = useRef(stage);
    const renderedStageRef = useRef(stage);
    renderedStageRef.current = stage;
    const historyPositionRef = useRef(
        typeof window !== 'undefined' &&
            Number.isInteger(
                window.history.state?.[
                    addBookHistoryPositionKey
                ],
            )
            ? window.history.state[
                  addBookHistoryPositionKey
              ]
            : 0,
    );
    const [manualEntry, setManualEntry] = useState(false);
    const [aiLockedFields, setAiLockedFields] = useState([]);
    const [conditionPreviews, setConditionPreviews] = useState([]);
    const [backConfirmation, setBackConfirmation] =
        useState(null);

    const [lookup, setLookup] = useState({
        status: 'idle',
        isbn: '',
        book: null,
    });
const [catalogMatches, setCatalogMatches] = useState([]);

    useEffect(() => {
        let currentState = window.history.state ?? {};
        const hasFlowHistory =
            addBookStages.has(
                currentState[addBookHistoryKey],
            ) &&
            Number.isInteger(
                currentState[
                    addBookHistoryPositionKey
                ],
            ) &&
            typeof currentState[
                addBookHistoryBoundaryKey
            ] === 'boolean';

        if (!hasFlowHistory) {
            const boundaryState = {
                ...currentState,
                [addBookHistoryKey]: 'category',
                [addBookHistoryPositionKey]: 0,
                [addBookHistoryBoundaryKey]: true,
                [addBookHistoryScrollKey]:
                    window.scrollY,
            };

            window.history.replaceState(
                boundaryState,
                '',
                window.location.href,
            );

            currentState = {
                ...boundaryState,
                [addBookHistoryPositionKey]: 1,
                [addBookHistoryBoundaryKey]: false,
            };

            window.history.pushState(
                currentState,
                '',
                window.location.href,
            );

            historyStageRef.current = 'category';
            historyPositionRef.current = 1;
            activeHistoryStateRef.current =
                currentState;
        } else {
            historyStageRef.current =
                currentState[addBookHistoryKey];
            historyPositionRef.current =
                currentState[
                    addBookHistoryPositionKey
                ];
            activeHistoryStateRef.current =
                currentState;
        }

        const restoreStagePosition = (
            historyStage,
            scrollY,
        ) => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    if (Number.isFinite(scrollY)) {
                        window.scrollTo({
                            top: scrollY,
                            behavior: 'auto',
                        });
                        return;
                    }

                    if (historyStage === 'analyze') {
                        document
                            .getElementById(
                                'add-book-photos',
                            )
                            ?.scrollIntoView({
                                block: 'start',
                                behavior: 'auto',
                            });
                    }
                });
            });
        };

        const applyHistoryStage = (event) => {
            const historyStage =
                event.state?.[addBookHistoryKey];

            if (!addBookStages.has(historyStage)) {
                return false;
            }

            historyTraversalRef.current = true;
            historyStageRef.current = historyStage;
            historyPositionRef.current =
                event.state[
                    addBookHistoryPositionKey
                ];
            activeHistoryStateRef.current =
                event.state;
            setStage(historyStage);
            restoreStagePosition(
                historyStage,
                event.state?.[
                    addBookHistoryScrollKey
                ],
            );

            return true;
        };

        const handlePopState = (event) => {
            const historyStage =
                event.state?.[addBookHistoryKey];
            const historyPosition =
                event.state?.[
                    addBookHistoryPositionKey
                ];
            const isBoundary =
                event.state?.[
                    addBookHistoryBoundaryKey
                ] === true;
            const isAddBookHistory =
                addBookStages.has(historyStage) &&
                Number.isInteger(historyPosition);
        const currentStage =
    renderedStageRef.current;

const photosAreEmpty =
    !frontCoverFileRef.current &&
    !backCoverFileRef.current;

// Review -> previous step:
// browser Back should work immediately with no popup.
if (
    currentStage === 'review' &&
    isAddBookHistory
) {
    applyHistoryStage(event);
    return true;
}

// Photos -> Category with no photos:
// go back immediately without confirmation.
if (
    currentStage === 'analyze' &&
    historyStage === 'category' &&
    photosAreEmpty
) {
    applyHistoryStage(event);
    return true;
}

if (confirmedHistoryRef.current) {
                confirmedHistoryRef.current = false;

                if (isAddBookHistory) {
                    applyHistoryStage(event);
                    return true;
                }

                return false;
            }

          if (!isAddBookHistory) {
    if (currentStage !== 'category') {
                    const restoredState = {
                        ...activeHistoryStateRef.current,
                        [addBookHistoryKey]:
                            currentStage,
                        [addBookHistoryPositionKey]:
                            historyPositionRef.current,
                        [addBookHistoryBoundaryKey]: false,
                        [addBookHistoryScrollKey]:
                            window.scrollY,
                    };

                    window.history.pushState(
                        restoredState,
                        '',
                        addBookUrlRef.current,
                    );
                    activeHistoryStateRef.current =
                        restoredState;
                    setBackConfirmation({
                        leaving: false,
                        delta: null,
                        targetStage: 'category',
                    });

                    return true;
                }

                return false;
            }

          if (
    currentStage === 'category' &&
    isBoundary
) {
                // There is nothing to preserve before the user advances past
                // the photo step. Skip the confirmation and leave Add Book.
                confirmedHistoryRef.current = true;
                window.history.back();
                return true;
            }

            const isForwardNavigation =
                !isBoundary &&
                historyPosition >
                    historyPositionRef.current;

            if (isForwardNavigation) {
                applyHistoryStage(event);
                return true;
            }

            const currentEntryState = {
                ...activeHistoryStateRef.current,
                [addBookHistoryKey]:
                    currentStage,
                [addBookHistoryPositionKey]:
                    historyPositionRef.current,
                [addBookHistoryBoundaryKey]: false,
                [addBookHistoryScrollKey]:
                    window.scrollY,
            };

            window.history.pushState(
                currentEntryState,
                '',
                addBookUrlRef.current,
            );
            activeHistoryStateRef.current =
                currentEntryState;

            setBackConfirmation({
                leaving: false,
                delta: -1,
            });

            return true;
        };

        window.__kitabakBrowserBackGuard =
            handlePopState;

        return () => {
            if (
                window.__kitabakBrowserBackGuard ===
                handlePopState
            ) {
                delete window.__kitabakBrowserBackGuard;
            }
        };
    }, []);

    useLayoutEffect(() => {
        if (historyTraversalRef.current) {
            historyTraversalRef.current = false;
            return;
        }

        if (historyStageRef.current === stage) {
            return;
        }

        const currentState =
            window.history.state ?? {};

        window.history.replaceState(
            {
                ...currentState,
                [addBookHistoryScrollKey]:
                    window.scrollY,
            },
            '',
            window.location.href,
        );

        const nextState = {
                ...currentState,
                [addBookHistoryKey]: stage,
                [addBookHistoryPositionKey]:
                    historyPositionRef.current + 1,
                [addBookHistoryBoundaryKey]: false,
                [addBookHistoryScrollKey]: 0,
            };

        window.history.pushState(
            nextState,
            '',
            window.location.href,
        );

        historyStageRef.current = stage;
        historyPositionRef.current += 1;
        activeHistoryStateRef.current = nextState;
    }, [stage]);

const goBackStage = () => {
    if (stage === 'category') {
        confirmedHistoryRef.current = true;
        window.history.go(-2);
        return;
    }

    // Review -> previous step immediately.
    // Do not show the confirmation popup.
    if (stage === 'review') {
        confirmedHistoryRef.current = true;
        window.history.back();
        return;
    }

    if (stage === 'analyze') {
        const hasFrontPhoto =
            data.cover_image instanceof File;

        const hasBackPhoto =
            backCoverFileRef.current instanceof File;

        // Photos are completely empty:
        // return directly to Category.
        if (!hasFrontPhoto && !hasBackPhoto) {
            confirmedHistoryRef.current = true;
            window.history.back();
            return;
        }
    }

    setBackConfirmation({
        leaving: false,
        delta: -1,
    });
};

    const cancelBackStage = () => {
        setBackConfirmation(null);
    };

    const confirmBackStage = () => {
        if (!backConfirmation) return;

        const { delta, targetStage } =
            backConfirmation;

        setBackConfirmation(null);

        if (targetStage) {
            const targetState = {
                ...activeHistoryStateRef.current,
                [addBookHistoryKey]: targetStage,
                [addBookHistoryBoundaryKey]: false,
                [addBookHistoryScrollKey]: 0,
            };

            historyTraversalRef.current = true;
            historyStageRef.current = targetStage;
            renderedStageRef.current = targetStage;
            activeHistoryStateRef.current = targetState;
            window.history.replaceState(
                targetState,
                '',
                addBookUrlRef.current,
            );
            setStage(targetStage);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    document
                        .getElementById(
                            'add-book-photos',
                        )
                        ?.scrollIntoView({
                            block: 'start',
                            behavior: 'auto',
                        });
                });
            });
            return;
        }

        confirmedHistoryRef.current = true;
        window.history.go(delta);
    };
    const {
        data,
        setData,
        transform,
        post,
        processing,
        errors,
    } = useForm({
        book_category: '',
        title: '',
        subject: '',
        book_type: '',
        part: '',
        grade: '',
        publisher: '',
        author: '',
        language: 'english',
        edition_year: '',
edition_number: '',
isbn: '',
        barcode: '',
        barcode_format: '',
        cover_image: null,
     price: '',
location: '',
condition: '',
notes: '',
listing_photo: null,
listing_photos: [],
      catalog_mode: 'new',
book_id: '',
    });
    useEffect(() => {
    frontCoverFileRef.current = data.cover_image;
}, [data.cover_image]);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    useEffect(() => {
        conditionPreviewsRef.current = conditionPreviews;
    }, [conditionPreviews]);

    useEffect(() => () => {
        conditionPreviewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    }, []);

    useEffect(() => {
        return () => {
            lookupRequest.current?.abort();
        };
    }, []);

    const lookupScannedBook = async (identifier) => {
        lookupRequest.current?.abort();

        const controller =
            new AbortController();

        lookupRequest.current = controller;

        setData((current) => ({
            ...current,
            isbn: identifier.isbn ?? '',
            barcode: identifier.identifierType === 'custom' ? identifier.rawValue : '',
            barcode_format: identifier.barcodeFormat ?? '',
        }));

        const displayIdentifier = identifier.normalizedValue;

        setLookup({
            status: 'loading',
            isbn: displayIdentifier,
            book: null,
        });

        try {
            const { data: result } =
                await axios.get(
                    route('books.lookup-isbn'),
                    {
                       params: {
    identifier: identifier.rawValue,
    barcode_format: identifier.barcodeFormat,
    book_category: data.book_category,
},
                        signal:
                            controller.signal,
                    },
                );

            if (!result.found) {
                setData((current) => ({
                    ...current,
                    catalog_mode: 'new',
                    book_id: '',
                }));
                setStage('analyze');
                setLookup({
                    status: 'not_found',
                    isbn: result.identifier.normalized_value,
                    book: null,
                });

                return false;
            }

         const book = result.book;

if (
    book?.book_category &&
    book.book_category !== data.book_category
) {
    setData((current) => ({
        ...current,
        catalog_mode: 'new',
        book_id: '',
    }));

    setStage('analyze');

    setLookup({
        status: 'not_found',
        isbn: result.identifier.normalized_value,
        book: null,
    });

    return false;
}

setData((current) => ({
                ...current,
                title: book.title ?? '',
                subject: book.subject ?? '',
                book_type: book.book_type ?? '',
                part: book.part ?? '',
                grade: grades.includes(
                    String(book.grade ?? ''),
                )
                    ? String(book.grade)
                    : current.grade,
                publisher:
                    book.publisher ?? '',
                author: book.author ?? '',
                language:
                    normalizeLanguage(
                        book.language,
                    ),
                edition_year:
                    book.edition_year
                        ? String(
                              book.edition_year,
                          )
                        : '',
                        edition_number:
    book.edition_number
        ? String(book.edition_number)
        : '',
                isbn: result.isbn ?? '',
                barcode: result.identifier.identifier_type === 'custom'
                    ? result.identifier.raw_value
                    : '',
                barcode_format: result.identifier.barcode_format ?? '',
                catalog_mode: 'existing',
                book_id: book.id,
            }));
            setStage('form');

            setLookup({
                status: 'found',
                isbn: result.identifier.normalized_value,
                book,
            });

            return true;
        } catch (requestError) {
            if (
                requestError.code !==
                'ERR_CANCELED'
            ) {
                setLookup({
                    status: 'error',
                    isbn: displayIdentifier,
                    book: null,
                });
            }

            return false;
        } finally {
            if (
                lookupRequest.current ===
                controller
            ) {
                lookupRequest.current =
                    null;
            }
        }
    };

    const selectCover = async (event) => {
        const selected =
            event.target.files?.[0] ?? null;
        event.target.value = '';
        if (!selected) return;

        const file = await cropImage(selected);
        if (!file) return;

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setData('cover_image', file);

        setPreview(
            file
                ? URL.createObjectURL(file)
                : null,
        );
    };

  const submit = (event) => {
    event.preventDefault();

    /*
     * In manual mode, use the first condition
     * photo as the new catalog book cover.
     */
    transform((formData) => ({
        ...formData,

        cover_image:
            manualEntry &&
            !formData.cover_image
                ? formData.listing_photos[0] ??
                  null
                : formData.cover_image,
    }));

    post(route('books.store'), {
        forceFormData: true,

        preserveScroll: (page) =>
            Object.keys(
                page.props.errors ?? {},
            ).length > 0,

        onError: (validationErrors) => {
            setStage('form');
            console.error(
                'Add book validation errors:',
                validationErrors,
            );
        },
    });
};

const selectBookCategory = (category) => {
    if (!['school', 'university', 'novel'].includes(category)) {
        return;
    }

    setManualEntry(false);
    setCatalogMatches([]);
    setAiLockedFields([]);

    setLookup({
        status: 'idle',
        isbn: '',
        book: null,
    });

    setData((current) => ({
        ...current,
        book_category: category,

        // Clear category-specific metadata when choosing/changing category.
        subject: '',
        book_type: '',
        part: '',
        grade: '',

        catalog_mode: 'new',
        book_id: '',
    }));

    setStage('analyze');
};

const openManualEntry = () => {
    setManualEntry(true);
    setCatalogMatches([]);
    setAiLockedFields([]);

    setLookup({
        status: 'idle',
        isbn: '',
        book: null,
    });

    setData((current) => ({
        ...current,

        // Create a new catalog book.
        catalog_mode: 'new',
        book_id: '',

        // Clear automatically detected book information.
     title: '',
subject: current.book_category === 'novel' ? '' : current.subject,
book_type: '',
part: '',
grade: '',
publisher: '',
        author: '',
        language: 'english',
    edition_year: '',
edition_number: '',
isbn: '',
        barcode: '',
        barcode_format: '',
        cover_image: null,

      // Keep the user's listing information.
price: current.price,
location: current.location,
condition: current.condition,
notes: current.notes,
listing_photo: current.listing_photo,
listing_photos: current.listing_photos,
    }));

    setStage('form');
};

    const applyAiResult = (result) => {
        setManualEntry(false);
        const lockableFields = [
            'title', 'subject', 'book_type', 'part', 'grade', 'publisher', 'author',
            'language', 'edition_year', 'isbn',
        ];
        setAiLockedFields(
            lockableFields.filter((field) => result[field] != null && result[field] !== ''),
        );
        setData((current) => ({
            ...current,
            title: result.title ?? current.title,
          subject:
    current.book_category === 'novel'
        ? ''
        : result.subject ?? current.subject,

book_type:
    current.book_category === 'school'
        ? result.book_type ?? current.book_type
        : '',

part: result.part ?? current.part,

grade:
    current.book_category === 'school' &&
    grades.includes(String(result.grade ?? ''))
        ? String(result.grade)
        : '',
            publisher: result.publisher ?? current.publisher,
            author: result.author ?? current.author,
            language: result.language
                ? normalizeLanguage(result.language)
                : current.language,
            edition_year: result.edition_year
                ? String(result.edition_year)
                : current.edition_year,
                edition_number: result.edition_number
    ? String(result.edition_number)
    : current.edition_number,
            isbn: current.isbn || result.isbn || '',
            barcode: current.barcode || result.barcode || '',
            barcode_format: current.barcode_format || result.barcode_format || '',
            catalog_mode: 'new',
            book_id: '',
        }));
        const matches = Array.isArray(result.matches) ? result.matches : [];
        setCatalogMatches(matches);
        setStage(matches.length ? 'match' : 'form');
    };

    const selectCatalogMatch = (book) => {
        setManualEntry(false);
        setData((current) => ({
            ...current,
            book_category:
    book.book_category ?? current.book_category,
            catalog_mode: 'existing',
            book_id: book.id,
            title: book.title ?? '',
            subject: book.subject ?? '',
            book_type: book.book_type ?? '',
            part: book.part ?? '',
            grade: String(book.grade ?? ''),
            publisher: book.publisher ?? '',
            author: book.author ?? '',
            language: normalizeLanguage(book.language),
            edition_year: book.edition_year ? String(book.edition_year) : '',
            edition_number:
    book.edition_number
        ? String(book.edition_number)
        : '',
            isbn: current.isbn || book.isbn || '',
            barcode:
                current.barcode && current.barcode_format !== 'INTERNAL'
                    ? current.barcode
                    : book.barcode ?? '',
            barcode_format:
                current.barcode && current.barcode_format !== 'INTERNAL'
                    ? current.barcode_format
                    : book.barcode_format ?? '',
        }));
        setLookup({ status: 'found', isbn: book.isbn || book.barcode || '', book });
       // Keep the matches so Back can return to them.
        setStage('form');
    };

 const fieldIsLocked = (field) => {
    // For a new catalog book, all metadata fields are editable,
    // including ISBN.
    if (data.catalog_mode !== 'existing') {
        return false;
    }

    // For an existing catalog book, ISBN identifies the existing
    // catalog record and must stay locked.
    if (field === 'isbn') {
        return true;
    }

        // These two fields may always be corrected on an existing book.
        if (field === 'title' || field === 'edition_year') {
            return false;
        }

        // Other shared fields are editable only when the catalog record did
        // not already contain a value. Use the original lookup result so the
        // field does not lock itself after the user starts typing.
        const catalogValue = lookup.book?.[field];

        return !(
            catalogValue === null ||
            catalogValue === undefined ||
            String(catalogValue).trim() === ''
        );
    };

    const useFrontAsCatalogAndListingPhoto = (file) => {
        setData((current) => ({
            ...current,
            cover_image: file,
            listing_photos: file
                ? [file, ...current.listing_photos.filter((photo) => photo !== current.cover_image)].slice(0, 8)
                : current.listing_photos.filter((photo) => photo !== current.cover_image),
        }));
        setConditionPreviews((current) => {
            current.filter((item) => item.isFront).forEach((item) => URL.revokeObjectURL(item.url));
            const remaining = current.filter((item) => !item.isFront);
            return file
                ? [{ file, url: URL.createObjectURL(file), isFront: true }, ...remaining].slice(0, 8)
                : remaining;
        });
    };

    const useBackAsListingPhoto = (file) => {
        const previousBack = backCoverFileRef.current;
        backCoverFileRef.current = file;

        setData((current) => ({
            ...current,
            listing_photos: file
                ? [
                    ...current.listing_photos.filter(
                        (photo) => photo !== previousBack && photo !== file,
                    ),
                    file,
                ].slice(0, 8)
                : current.listing_photos.filter((photo) => photo !== previousBack),
        }));
        setConditionPreviews((current) => {
            current
                .filter((item) => item.isBack)
                .forEach((item) => URL.revokeObjectURL(item.url));
            const remaining = current.filter((item) => !item.isBack);

            return file
                ? [
                    ...remaining,
                    { file, url: URL.createObjectURL(file), isBack: true },
                ].slice(0, 8)
                : remaining;
        });
    };

    const addConditionPhotos = async (event) => {
        const selectedFiles = Array.from(event.target.files ?? []).slice(
            0,
            Math.max(0, 8 - data.listing_photos.length),
        );
        event.target.value = '';
        if (!selectedFiles.length) return;

        const files = [];
        for (const selected of selectedFiles) {
            const cropped = await cropImage(selected);
            if (cropped) files.push(cropped);
        }
        if (!files.length) return;

        setData((current) => ({
            ...current,
            listing_photos: [...current.listing_photos, ...files].slice(0, 8),
        }));
        setConditionPreviews((current) => [
            ...current,
            ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ].slice(0, 8));
    };

    const takeConditionPhoto = async () => {
        const file = await takePhoto();
        if (!file || data.listing_photos.length >= 8) return;

        setData((current) => ({
            ...current,
            listing_photos: [...current.listing_photos, file].slice(0, 8),
        }));
        setConditionPreviews((current) => [
            ...current,
            { file, url: URL.createObjectURL(file) },
        ].slice(0, 8));
    };

    const removeConditionPhoto = (item) => {
        URL.revokeObjectURL(item.url);
        setConditionPreviews((current) => current.filter((candidate) => candidate !== item));
        setData((current) => ({
            ...current,
            listing_photos: current.listing_photos.filter((photo) => photo !== item.file),
            cover_image: item.isFront ? null : current.cover_image,
        }));
    };

    return (
        <AddBookFlowView
            cropDialog={cropDialog}
            data={data}
            setData={setData}
            selectBookCategory={selectBookCategory}
            processing={processing}
            errors={errors}
            submit={submit}
            stage={stage}
            setStage={setStage}
            goBackStage={goBackStage}
            backConfirmation={backConfirmation}
            cancelBackStage={cancelBackStage}
            confirmBackStage={confirmBackStage}
            lookup={lookup}
            catalogMatches={catalogMatches}
            applyAiResult={applyAiResult}
            selectCatalogMatch={selectCatalogMatch}
            fieldIsLocked={fieldIsLocked}
            useFrontAsCatalogAndListingPhoto={useFrontAsCatalogAndListingPhoto}
            useBackAsListingPhoto={useBackAsListingPhoto}
            lookupScannedBook={lookupScannedBook}
            openManualEntry={openManualEntry}
            preview={preview}
            fileInput={fileInput}
            selectCover={selectCover}
            initialBack={backCoverFileRef.current}
            conditionPreviews={conditionPreviews}
            takeConditionPhoto={takeConditionPhoto}
            addConditionPhotos={addConditionPhotos}
            removeConditionPhoto={removeConditionPhoto}
        />
    );
}
