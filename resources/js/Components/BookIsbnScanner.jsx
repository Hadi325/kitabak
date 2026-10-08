import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useImageCropper } from '@/Components/ImageCropDialog';

function normalizeScannedIsbn(value) {
    const isbn = String(value ?? '')
        .replace(/ISBN(?:-1[03])?/gi, '')
        .replace(/[^\dX]/gi, '')
        .toUpperCase();

    if (/^\d{9}[\dX]$/.test(isbn)) {
        const valid = [...isbn].reduce(
            (sum, digit, index) =>
                sum + (digit === 'X' ? 10 : Number(digit)) * (10 - index),
            0,
        ) % 11 === 0;

        if (!valid) return null;

        const body = `978${isbn.slice(0, 9)}`;
        const sum = [...body].reduce(
            (total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1),
            0,
        );

        return `${body}${(10 - (sum % 10)) % 10}`;
    }

    if (!/^97[89]\d{10}$/.test(isbn)) {
        return null;
    }

    const sum = isbn
        .slice(0, 12)
        .split('')
        .reduce(
            (total, digit, index) =>
                total +
                Number(digit) *
                    (index % 2 === 0 ? 1 : 3),
            0,
        );

    const expectedCheckDigit =
        (10 - (sum % 10)) % 10;

    return expectedCheckDigit === Number(isbn[12])
        ? isbn
        : null;
}

function normalizeFormat(format) {
    return String(format ?? '')
        .replace(/^FORMAT_/, '')
        .replace(/-/g, '_')
        .toUpperCase() || null;
}

function classifyBookIdentifier(rawValue, barcodeFormat = null) {
    const raw = String(rawValue ?? '').trim();
    if (!raw || raw.length > 255 || /[\u0000-\u001f\u007f]/.test(raw)) return null;

    const isbn = normalizeScannedIsbn(raw);
    const isbnCandidate = raw
        .replace(/ISBN(?:-1[03])?/gi, '')
        .replace(/[^\dX]/gi, '')
        .toUpperCase();

    if (!isbn && (/^97[89]\d{10}$/.test(isbnCandidate) || /^\d{9}[\dX]$/.test(isbnCandidate))) {
        return null;
    }

    return {
        rawValue: raw,
        normalizedValue: isbn ?? raw.replace(/\s+/g, '').toUpperCase(),
        barcodeFormat: normalizeFormat(barcodeFormat),
        identifierType: isbn ? 'isbn' : 'custom',
        isbn,
    };
}

function extractPrintedIsbn(text) {
    const lines = String(text ?? '')
        .split(/\r?\n/)
        .filter(Boolean);

    const orderedLines = [
        ...lines.filter((line) =>
            /ouvrage/i.test(line),
        ),
        ...lines.filter(
            (line) => !/ouvrage/i.test(line),
        ),
    ];

    for (const line of orderedLines) {
        const candidates =
            line.match(/97[89](?:[\s-]*\d){10}/g) ??
            [];

        for (const candidate of candidates) {
            const isbn =
                normalizeScannedIsbn(candidate);

            if (isbn) {
                return isbn;
            }
        }
    }

    return null;
}

async function readPrintedIsbn(
    file,
    onProgress,
) {
    const { createWorker } =
        await import('tesseract.js');

    const worker = await createWorker(
        ['eng', 'fra'],
        1,
        {
            logger: (message) => {
                if (
                    message.status ===
                    'recognizing text'
                ) {
                    onProgress?.(
                        message.progress ?? 0,
                    );
                }
            },
        },
    );

    try {
        const result =
            await worker.recognize(file);

        return extractPrintedIsbn(
            result.data.text,
        );
    } finally {
        await worker.terminate();
    }
}

const BarcodeIcon = () => (
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
        <path d="M3 5v4M3 5h4M21 5v4M21 5h-4" />
        <path d="M3 19v-4M3 19h4M21 19v-4M21 19h-4" />
        <path d="M7 8v8M10 8v8M14 8v8M17 8v8" />
    </svg>
);

const CameraIcon = () => (
    <svg
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M4 7h3l2-2h6l2 2h3v12H4Z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

const UploadIcon = () => (
    <svg
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 14v5h14v-5" />
    </svg>
);

const HelpIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1-1.4 2.1" />
        <path d="M12 17h.01" />
    </svg>
);

export default function BookIsbnScanner({
    onDetected,
    disabled = false,
}) {
    const { t } = useTranslation('common');
    const { cropImage, cropDialog } = useImageCropper();

    const readerId = `book-isbn-reader-${useId().replace(
        /:/g,
        '',
    )}`;

    const scannerRef = useRef(null);
    const scannerStateRef = useRef(null);
    const startPromiseRef = useRef(null);
    const sessionRef = useRef(0);
    const handledRef = useRef(false);
    const fileInputRef = useRef(null);
    const uploadedPreviewRef = useRef(null);
    const candidateTimerRef = useRef(null);
    const candidatesRef = useRef(new Map());

    const [isOpen, setIsOpen] =
        useState(false);
    const [showHelp, setShowHelp] =
        useState(false);
    const [status, setStatus] =
        useState('idle');
    const [error, setError] = useState('');
    const [manualIsbn, setManualIsbn] =
        useState('');
    const [ocrProgress, setOcrProgress] =
        useState(0);
    const [
        uploadedPreview,
        setUploadedPreview,
    ] = useState(null);

    const clearUploadedPreview =
        useCallback(() => {
            if (uploadedPreviewRef.current) {
                URL.revokeObjectURL(
                    uploadedPreviewRef.current,
                );
            }

            uploadedPreviewRef.current = null;
            setUploadedPreview(null);
        }, []);

    const stopScanner =
        useCallback(async () => {
            window.clearTimeout(candidateTimerRef.current);
            candidateTimerRef.current = null;
            candidatesRef.current.clear();
            sessionRef.current += 1;

            try {
                await startPromiseRef.current;
            } catch {
                // A rejected start does not leave
                // an active camera.
            }

            const scanner =
                scannerRef.current;
            const states =
                scannerStateRef.current;

            if (!scanner) {
                return;
            }

            try {
                const currentState =
                    scanner.getState?.();

                if (
                    states &&
                    (currentState ===
                        states.SCANNING ||
                        currentState ===
                            states.PAUSED)
                ) {
                    await scanner.stop();
                }
            } catch {
                // Keep cleanup safe if camera
                // permission was rejected.
            }

            try {
                scanner.clear();
            } catch {
                // The reader may already be removed.
            }

            if (
                scannerRef.current === scanner
            ) {
                scannerRef.current = null;
            }

            startPromiseRef.current = null;
        }, []);

    useEffect(() => {
        return () => {
            void stopScanner();

            if (
                uploadedPreviewRef.current
            ) {
                URL.revokeObjectURL(
                    uploadedPreviewRef.current,
                );
            }
        };
    }, [stopScanner]);

    useEffect(() => {
        if (!isOpen) {
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
    }, [isOpen]);

    const closeScanner = async () => {
        await stopScanner();

        setIsOpen(false);
        setStatus('idle');
        setError('');
        setManualIsbn('');
        setOcrProgress(0);
        clearUploadedPreview();

        handledRef.current = false;
    };

    const detectManualIsbn = async (
        value,
    ) => {
        const identifier = classifyBookIdentifier(value, 'MANUAL');

        if (!identifier) {
            setError(
                t(
                    'book_barcode.manual_invalid',
                ),
            );
            return;
        }

        if (handledRef.current) {
            return;
        }

        handledRef.current = true;

        setStatus('detected');
        setError('');
        setOcrProgress(0);

        await stopScanner();

        setIsOpen(false);
        setManualIsbn('');
        clearUploadedPreview();

        await onDetected(identifier);
    };

    const updateManualIsbn = (event) => {
        const value = event.target.value.slice(0, 255);

        setManualIsbn(value);
        setError('');

        if (normalizeScannedIsbn(value)) {
            void detectManualIsbn(value);
        }
    };

    const startScanner = async () => {
        const session =
            sessionRef.current + 1;

        sessionRef.current = session;
        handledRef.current = false;

        setIsOpen(true);
        setStatus('starting');
        setError('');
        setManualIsbn('');
        clearUploadedPreview();

        try {
            if (
                !window.isSecureContext ||
                !navigator.mediaDevices
                    ?.getUserMedia
            ) {
                throw new Error(
                    'insecure camera context',
                );
            }

            await new Promise((resolve) =>
                requestAnimationFrame(resolve),
            );

            if (
                sessionRef.current !==
                    session ||
                !document.getElementById(
                    readerId,
                )
            ) {
                return;
            }

            const module =
                await import(
                    'html5-qrcode'
                );

            if (
                sessionRef.current !==
                session
            ) {
                return;
            }

            scannerStateRef.current =
                module.Html5QrcodeScannerState;

            const scanner =
                new module.Html5Qrcode(
                    readerId,
                    {
                        formatsToSupport: [
                            module.Html5QrcodeSupportedFormats.EAN_13,
                            module.Html5QrcodeSupportedFormats.EAN_8,
                            module.Html5QrcodeSupportedFormats.UPC_A,
                            module.Html5QrcodeSupportedFormats.UPC_E,
                            module.Html5QrcodeSupportedFormats.CODE_128,
                            module.Html5QrcodeSupportedFormats.CODE_39,
                        ],
                        experimentalFeatures: {
                            useBarCodeDetectorIfSupported:
                                true,
                        },
                        verbose: false,
                    },
                );

            scannerRef.current = scanner;

            const handleSuccess = async (
                decodedText,
                decodedResult,
            ) => {
                if (
                    handledRef.current ||
                    sessionRef.current !==
                        session
                ) {
                    return;
                }

                const identifier = classifyBookIdentifier(
                    decodedText,
                    decodedResult?.result?.format?.formatName,
                );

                if (!identifier) {
                    setError(
                        t(
                            'book_barcode.invalid_isbn',
                        ),
                    );
                    return;
                }

                candidatesRef.current.set(
                    `${identifier.barcodeFormat}:${identifier.normalizedValue}`,
                    identifier,
                );

                const finish = async () => {
                    if (handledRef.current) return;
                    const candidates = [...candidatesRef.current.values()];
                    const selected = candidates.find((candidate) => candidate.identifierType === 'isbn') ?? candidates[0];
                    if (!selected) return;

                    handledRef.current = true;
                    setStatus('detected');
                    setError('');
                    await stopScanner();
                    setIsOpen(false);
                    await onDetected(selected);
                };

                if (identifier.identifierType === 'isbn') {
                    await finish();
                } else if (!candidateTimerRef.current) {
                    candidateTimerRef.current = window.setTimeout(() => void finish(), 400);
                }
            };

            const startPromise =
                scanner.start(
                    {
                        facingMode:
                            'environment',
                    },
                    {
                        fps: 20,
                        aspectRatio: 4 / 3,
                        qrbox: (
                            width,
                            height,
                        ) => ({
                            width: Math.max(
                                120,
                                Math.floor(
                                    Math.min(
                                        width *
                                            0.94,
                                        520,
                                    ),
                                ),
                            ),
                            height: Math.max(
                                90,
                                Math.floor(
                                    Math.min(
                                        height *
                                            0.42,
                                        200,
                                    ),
                                ),
                            ),
                        }),
                    },
                    handleSuccess,
                    () => {},
                );

            startPromiseRef.current =
                startPromise;

            await startPromise;

            if (
                sessionRef.current ===
                session
            ) {
                setStatus('scanning');
            }
        } catch (cameraError) {
            if (
                sessionRef.current !==
                session
            ) {
                return;
            }

            const message = String(
                cameraError?.message ??
                    cameraError ??
                    '',
            ).toLowerCase();

            let translationKey =
                'book_barcode.camera_error';

            if (
                message.includes(
                    'permission',
                ) ||
                message.includes('denied') ||
                message.includes(
                    'notallowed',
                )
            ) {
                translationKey =
                    'book_barcode.camera_denied';
            } else if (
                message.includes(
                    'notfound',
                ) ||
                message.includes(
                    'requested device',
                )
            ) {
                translationKey =
                    'book_barcode.camera_unavailable';
            } else if (
                !window.isSecureContext
            ) {
                translationKey =
                    'book_barcode.secure_context';
            }

            setStatus('error');
            setError(t(translationKey));

            await stopScanner();
        }
    };

    const scanUploadedImage = async (
        event,
    ) => {
        const selected =
            event.target.files?.[0];

        event.target.value = '';

        if (!selected) {
            return;
        }

        const file = await cropImage(selected);
        if (!file) return;

        await stopScanner();
        clearUploadedPreview();

        const previewUrl =
            URL.createObjectURL(file);

        uploadedPreviewRef.current =
            previewUrl;

        setUploadedPreview(previewUrl);
        setIsOpen(true);
        setStatus('uploading');
        setError('');

        handledRef.current = false;

        await new Promise((resolve) =>
            requestAnimationFrame(resolve),
        );

        try {
            const module =
                await import(
                    'html5-qrcode'
                );

            const scanner =
                new module.Html5Qrcode(
                    readerId,
                    {
                        formatsToSupport: [
                            module.Html5QrcodeSupportedFormats.EAN_13,
                            module.Html5QrcodeSupportedFormats.EAN_8,
                            module.Html5QrcodeSupportedFormats.UPC_A,
                            module.Html5QrcodeSupportedFormats.UPC_E,
                            module.Html5QrcodeSupportedFormats.CODE_128,
                            module.Html5QrcodeSupportedFormats.CODE_39,
                        ],
                        verbose: false,
                    },
                );

            scannerRef.current = scanner;
            scannerStateRef.current =
                module.Html5QrcodeScannerState;

            const result =
                await scanner.scanFileV2(
                    file,
                    true,
                );

            const identifier = classifyBookIdentifier(
                result.decodedText,
                result.result?.format?.formatName,
            );

            if (!identifier) {
                setStatus('error');
                setError(
                    t(
                        'book_barcode.invalid_isbn',
                    ),
                );
                return;
            }

            handledRef.current = true;

            setStatus('detected');

            scanner.clear();
            scannerRef.current = null;

            setIsOpen(false);
            clearUploadedPreview();

            await onDetected(identifier);
        } catch {
            try {
                scannerRef.current?.clear();
            } catch {
                // The reader may already be cleared.
            }

            scannerRef.current = null;

            setStatus('ocr');
            setError('');
            setOcrProgress(0);

            try {
                const isbn =
                    await readPrintedIsbn(
                        file,
                        setOcrProgress,
                    );

                if (!isbn) {
                    throw new Error(
                        'printed ISBN not found',
                    );
                }

                await detectManualIsbn(isbn);
            } catch {
                setStatus('error');
                setError(
                    t(
                        'book_barcode.image_ocr_error',
                    ),
                );
            }
        }
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900 dark:to-violet-500/10">
            {cropDialog}
            <div className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 sm:h-11 sm:w-11">
                        <BarcodeIcon />
                    </span>

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <h2 className="text-sm font-bold leading-5 text-slate-950 dark:text-white sm:text-base">
                            {t('book_barcode.title')}
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                setShowHelp(
                                    (current) =>
                                        !current,
                                )
                            }
                            aria-expanded={
                                showHelp
                            }
                            aria-controls={`${readerId}-help`}
                            aria-label={
                                showHelp
                                    ? t('book_barcode.hide_help')
                                    : t('book_barcode.show_help')
                            }
                            title={
                                showHelp
                                    ? t('book_barcode.hide_help')
                                    : t('book_barcode.help')
                            }
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
                                showHelp
                                    ? 'border-indigo-500 bg-indigo-600 text-white'
                                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20'
                            }`}
                        >
                            <HelpIcon />
                        </button>
                    </div>
                </div>

                {!isOpen && (
                    <>
                        {/* <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={
                                    startScanner
                                }
                                disabled={
                                    disabled
                                }
                                className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                            >
                                <CameraIcon />

                                <span className="truncate">
                                    {t('book_barcode.take_photo')}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    disabled
                                }
                                className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-500/10 sm:text-sm"
                            >
                                <UploadIcon />

                                <span className="truncate">
                                    {t(
                                        'book_barcode.upload',
                                    )}
                                </span>
                            </button>

                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                accept="image/*"
                                onChange={
                                    scanUploadedImage
                                }
                                className="sr-only"
                            />
                        </div> */}

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {/* Scan using the camera */}
    <button
        type="button"
        onClick={startScanner}
        disabled={disabled}
        className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
    >
        <CameraIcon />

        <span className="truncate">
            {t('book_barcode.take_photo')}
        </span>
    </button>

    {/* Enter the ISBN manually */}
    <div className="flex min-w-0 gap-2">
        <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={manualIsbn}
            onChange={updateManualIsbn}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    void detectManualIsbn(
                        manualIsbn,
                    );
                }
            }}
            placeholder={t(
                'book_barcode.manual_placeholder',
            )}
            aria-label={t(
                'book_barcode.manual_title',
            )}
            className="min-h-11 min-w-0 flex-1 rounded-lg border-indigo-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />

        <button
            type="button"
            onClick={() =>
                void detectManualIsbn(manualIsbn)
            }
            disabled={
                disabled || !manualIsbn.trim()
            }
            className="min-h-11 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
            {t(
                'book_barcode.manual_search',
            )}
        </button>
    </div>
</div>
{!isOpen && error && (
    <p
        role="alert"
        className="mt-3 rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-700 dark:text-rose-200"
    >
        {error}
    </p>
)}

                        <div
                            id={`${readerId}-help`}
                            className={`grid transition-all duration-300 ${
                                showHelp
                                    ? 'mt-4 grid-rows-[1fr] opacity-100'
                                    : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <p className="rounded-xl border border-indigo-200 bg-white/70 p-4 text-sm leading-6 text-slate-600 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-slate-300">
                                    {t(
                                        'book_barcode.description',
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-white">
                                    {status ===
                                    'starting'
                                        ? t(
                                              'book_barcode.starting',
                                          )
                                        : status ===
                                            'uploading'
                                          ? t(
                                                'book_barcode.processing_image',
                                            )
                                          : status ===
                                              'ocr'
                                            ? t(
                                                  'book_barcode.processing_ocr',
                                                  {
                                                      progress:
                                                          Math.round(
                                                              ocrProgress *
                                                                  100,
                                                          ),
                                                  },
                                              )
                                            : t(
                                                  'book_barcode.scanning',
                                              )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    {[
                                        'uploading',
                                        'ocr',
                                    ].includes(
                                        status,
                                    )
                                        ? t(
                                              'book_barcode.upload_instruction',
                                          )
                                        : t(
                                              'book_barcode.instruction',
                                          )}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeScanner
                                }
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                            >
                                {t(
                                    'book_barcode.stop',
                                )}
                            </button>
                        </div>

                        <div className="relative mx-auto min-h-48 w-full overflow-hidden rounded-xl bg-black">
                            <div
                                id={readerId}
                                className="min-h-48 w-full [&_video]:max-h-[60dvh] [&_video]:w-full [&_video]:rounded-xl [&_video]:object-cover"
                            />

                            {uploadedPreview && (
                                <img
                                    src={
                                        uploadedPreview
                                    }
                                    alt={t(
                                        'book_barcode.upload_preview_alt',
                                    )}
                                    className="absolute inset-0 h-full w-full bg-black object-contain"
                                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                                />
                            )}
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="mt-4 rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200"
                            >
                                {error}
                            </p>
                        )}

                        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3">
                            <label
                                htmlFor={`${readerId}-manual`}
                                className="block text-sm font-bold text-white"
                            >
                                {t(
                                    'book_barcode.manual_title',
                                )}
                            </label>

                            <p className="mt-1 text-xs text-slate-400">
                                {t(
                                    'book_barcode.manual_description',
                                )}
                            </p>

                            <div className="mt-3 flex gap-2">
                                <input
                                    id={`${readerId}-manual`}
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    value={
                                        manualIsbn
                                    }
                                    onChange={
                                        updateManualIsbn
                                    }
                                    onKeyDown={(
                                        event,
                                    ) => {
                                        if (
                                            event.key ===
                                            'Enter'
                                        ) {
                                            event.preventDefault();
                                            void detectManualIsbn(
                                                manualIsbn,
                                            );
                                        }
                                    }}
                                    placeholder={t(
                                        'book_barcode.manual_placeholder',
                                    )}
                                    className="min-h-11 min-w-0 flex-1 rounded-lg border-slate-600 bg-slate-950 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        void detectManualIsbn(
                                            manualIsbn,
                                        )
                                    }
                                    disabled={
                                        !manualIsbn.trim()
                                    }
                                    className="rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {t(
                                        'book_barcode.manual_search',
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
