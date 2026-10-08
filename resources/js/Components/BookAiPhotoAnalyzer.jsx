import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import { useImageCropper } from '@/Components/ImageCropDialog';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const normalizeIsbn = (value) => {
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
            (total, digit, index) =>
                total + Number(digit) * (index % 2 === 0 ? 1 : 3),
            0,
        );

        return `${body}${(10 - (sum % 10)) % 10}`;
    }

    if (!/^97[89]\d{10}$/.test(isbn)) return null;

    const sum = isbn
        .slice(0, 12)
        .split('')
        .reduce(
            (total, digit, index) =>
                total + Number(digit) * (index % 2 === 0 ? 1 : 3),
            0,
        );

    return (10 - (sum % 10)) % 10 === Number(isbn[12])
        ? isbn
        : null;
};

const normalizeBarcodeFormat = (format) =>
    String(format ?? '')
        .replace(/^FORMAT_/, '')
        .replace(/-/g, '_')
        .toUpperCase() || null;

const classifyBookIdentifier = (rawValue, barcodeFormat = null) => {
    const raw = String(rawValue ?? '').trim();

    if (!raw || raw.length > 255 || /[\u0000-\u001f\u007f]/.test(raw)) {
        return null;
    }

    const isbn = normalizeIsbn(raw);
    const isbnCandidate = raw
        .replace(/ISBN(?:-1[03])?/gi, '')
        .replace(/[^\dX]/gi, '')
        .toUpperCase();

    if (
        !isbn &&
        (/^97[89]\d{10}$/.test(isbnCandidate) ||
            /^\d{9}[\dX]$/.test(isbnCandidate))
    ) {
        return null;
    }

    return {
        rawValue: raw,
        normalizedValue: isbn ?? raw.replace(/\s+/g, '').toUpperCase(),
        barcodeFormat: normalizeBarcodeFormat(barcodeFormat),
        identifierType: isbn ? 'isbn' : 'custom',
        isbn,
    };
};

const releaseCanvas = (canvas) => {
    canvas.width = 1;
    canvas.height = 1;
};

const extractPrintedIsbn = (text) => {
    const lines = String(text ?? '').split(/\r?\n/).filter(Boolean);
    let printedFallback = null;
    const orderedLines = [
        ...lines.filter((line) => /ouvrage|book/i.test(line)),
        ...lines.filter((line) => !/ouvrage|book/i.test(line)),
    ];

    for (const line of orderedLines) {
        const candidates = line.match(/97[89](?:[\s-]*\d){10}/g) ?? [];

        for (const candidate of candidates) {
            const isbn = normalizeIsbn(candidate);
            if (isbn) return isbn;

            printedFallback ??= candidate.replace(/\D/g, '');
        }
    }

    return printedFallback;
};

const detectBarcodeFromPhoto = async (file, signal) => {
    if (!file || signal?.aborted || !('BarcodeDetector' in window)) return null;

    try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const formats = [
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'code_93',
            'itf',
        ].filter((format) => supported.includes(format));

        if (!formats.length) return null;

        const bitmap = await createImageBitmap(file);

        try {
            if (signal?.aborted) return null;

            const barcodes = await new window.BarcodeDetector({ formats }).detect(
                bitmap,
            );

            if (signal?.aborted) return null;

            for (const barcode of barcodes) {
                const identifier = classifyBookIdentifier(
                    barcode.rawValue,
                    barcode.format,
                );

                if (identifier) return identifier;
            }
        } finally {
            bitmap.close();
        }
    } catch {
        // The library decoder below remains available when native detection fails.
    }

    return null;
};

const loadPhoto = (file) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Back-cover image loading failed.'));
        };
        image.src = url;
    });

const renderBarcodeCandidate = (image, region) =>
    new Promise((resolve, reject) => {
        const sourceX = Math.floor(image.width * region.x);
        const sourceY = Math.floor(image.height * region.y);
        const sourceWidth = Math.max(1, Math.floor(image.width * region.width));
        const sourceHeight = Math.max(1, Math.floor(image.height * region.height));
        const scale = Math.min(
            2.5,
            Math.max(1, 1400 / sourceWidth),
            2600 / sourceWidth,
            2200 / sourceHeight,
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));

        const context = canvas.getContext('2d', { willReadFrequently: false });

        if (!context) {
            reject(new Error('Barcode image processing is unavailable.'));
            return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = scale < 1;
        context.filter = region.enhanced
            ? 'grayscale(1) contrast(1.8)'
            : 'none';
        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        canvas.toBlob((blob) => {
            releaseCanvas(canvas);

            if (!blob) {
                reject(new Error('Barcode crop creation failed.'));
                return;
            }

            resolve(
                new File([blob], `barcode-${region.name}.png`, {
                    type: 'image/png',
                }),
            );
        }, 'image/png');
    });

const barcodeCropRegions = [
    { name: 'bottom-right-tight', x: 0.52, y: 0.62, width: 0.48, height: 0.38 },
    { name: 'bottom-left-tight', x: 0, y: 0.62, width: 0.48, height: 0.38 },
    { name: 'bottom-center-tight', x: 0.25, y: 0.62, width: 0.5, height: 0.38 },
    { name: 'bottom-wide', x: 0, y: 0.38, width: 1, height: 0.62 },
    { name: 'bottom-left', x: 0, y: 0.34, width: 0.68, height: 0.66 },
    { name: 'bottom-right', x: 0.32, y: 0.34, width: 0.68, height: 0.66 },
    { name: 'bottom-right-tight-enhanced', x: 0.52, y: 0.62, width: 0.48, height: 0.38, enhanced: true },
    { name: 'bottom-left-tight-enhanced', x: 0, y: 0.62, width: 0.48, height: 0.38, enhanced: true },
    { name: 'full-enhanced', x: 0, y: 0, width: 1, height: 1, enhanced: true },
    { name: 'bottom-wide-enhanced', x: 0, y: 0.38, width: 1, height: 0.62, enhanced: true },
    { name: 'bottom-left-enhanced', x: 0, y: 0.34, width: 0.68, height: 0.66, enhanced: true },
    { name: 'bottom-right-enhanced', x: 0.32, y: 0.34, width: 0.68, height: 0.66, enhanced: true },
];

const createHtml5QrcodeDecoder = async () => {
    const module = await import('html5-qrcode');
    const readerId = `automatic-isbn-${crypto.randomUUID?.() ?? Date.now()}`;
    const reader = document.createElement('div');
    reader.id = readerId;
    reader.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(reader);

    const scanner = new module.Html5Qrcode(readerId, {
        formatsToSupport: [
            module.Html5QrcodeSupportedFormats.EAN_13,
            module.Html5QrcodeSupportedFormats.EAN_8,
            module.Html5QrcodeSupportedFormats.UPC_A,
            module.Html5QrcodeSupportedFormats.UPC_E,
            module.Html5QrcodeSupportedFormats.CODE_128,
            module.Html5QrcodeSupportedFormats.CODE_39,
            module.Html5QrcodeSupportedFormats.CODE_93,
            module.Html5QrcodeSupportedFormats.ITF,
        ],
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
    });

    const clearScanResources = (objectUrls = []) => {
        reader.querySelectorAll('canvas').forEach(releaseCanvas);

        try {
            scanner.clear();
        } catch {
            // Scanner may already be clear after a failed image read.
        }

        objectUrls.forEach((url) => URL.revokeObjectURL(url));

        // html5-qrcode retains its latest scan URL and, in this version, also
        // creates a second untracked URL for the same file. Both are captured
        // and revoked below, so do not let the next scan retain the first one.
        scanner.lastScanImageFile = null;
    };

    return {
        async scan(file, signal) {
            if (signal?.aborted) return null;

            const objectUrls = [];
            const originalCreateObjectURL = URL.createObjectURL;
            let scanPromise;

            try {
                // scanFileV2 creates two blob URLs synchronously but only
                // revokes one. Track both during that call to avoid retaining
                // every high-resolution barcode candidate until refresh.
                URL.createObjectURL = function createTrackedObjectURL(blob) {
                    const url = originalCreateObjectURL.call(URL, blob);
                    objectUrls.push(url);
                    return url;
                };
                scanPromise = scanner.scanFileV2(file, false);
            } finally {
                URL.createObjectURL = originalCreateObjectURL;
            }

            try {
                const result = await scanPromise;
                if (signal?.aborted) return null;

                return classifyBookIdentifier(
                    result.decodedText,
                    result.result?.format?.formatName,
                );
            } catch {
                return null;
            } finally {
                clearScanResources(objectUrls);
            }
        },
        dispose() {
            clearScanResources();
            reader.remove();
        },
    };
};

const scanBackCoverIdentifier = async (back, signal) => {
    const directNativeResult = await detectBarcodeFromPhoto(back, signal);
    if (directNativeResult) return directNativeResult;
    if (signal?.aborted) return null;

    const decoder = await createHtml5QrcodeDecoder();

    try {
        const directLibraryResult = await decoder.scan(back, signal);
        if (directLibraryResult) return directLibraryResult;
        if (signal?.aborted) return null;

        const image = await loadPhoto(back).catch(() => null);
        if (!image || signal?.aborted) return null;

        try {
            for (const region of barcodeCropRegions) {
                if (signal?.aborted) return null;

                const candidate = await renderBarcodeCandidate(image, region).catch(
                    () => null,
                );
                if (!candidate || signal?.aborted) continue;

                const nativeResult = await detectBarcodeFromPhoto(candidate, signal);
                if (nativeResult) return nativeResult;

                const libraryResult = await decoder.scan(candidate, signal);
                if (libraryResult) return libraryResult;
            }
        } finally {
            // Drop the decoded back-cover bitmap as soon as scanning finishes.
            image.src = '';
        }

        return null;
    } finally {
        decoder.dispose();
    }
};

const createIsbnOcrCrop = (file) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            const sourceY = Math.floor(image.height * 0.45);
            const sourceHeight = image.height - sourceY;
            const scale = Math.max(
                1,
                Math.min(3, 2200 / Math.max(image.width, sourceHeight)),
            );
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));
            const context = canvas.getContext('2d');
            context.filter = 'grayscale(1) contrast(1.65)';
            context.drawImage(
                image,
                0,
                sourceY,
                image.width,
                sourceHeight,
                0,
                0,
                canvas.width,
                canvas.height,
            );
            URL.revokeObjectURL(url);
            canvas.toBlob(
                (blob) => {
                    releaseCanvas(canvas);
                    blob
                        ? resolve(blob)
                        : reject(new Error('ISBN crop creation failed.'));
                },
                'image/png',
            );
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('ISBN image loading failed.'));
        };
        image.src = url;
    });

const readIsbnFromPhoto = async (file) => {
    if (!file) return null;

    const barcodeIdentifier = await detectBarcodeFromPhoto(file);
    if (barcodeIdentifier?.isbn) return barcodeIdentifier.isbn;

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['eng', 'fra']);

    try {
        const crop = await createIsbnOcrCrop(file).catch(() => null);

        if (crop) {
            const croppedResult = await worker.recognize(crop);
            const croppedIsbn = extractPrintedIsbn(croppedResult.data.text);
            if (croppedIsbn) return croppedIsbn;
        }

        const fullResult = await worker.recognize(file);
        return extractPrintedIsbn(fullResult.data.text);
    } finally {
        await worker.terminate();
    }
};

const PhotoInput = ({ label, optional, file, preview, onChange, uploadLabel, cameraLabel }) => {
const uploadInput = useRef(null);
const galleryInput = useRef(null);
const cameraInput = useRef(null);
const menuDialog = useRef(null);



const [menuOpen, setMenuOpen] = useState(false);
const menuOpenRef = useRef(false);
const boxLabel = label.replace(
    /\s*\([^)]*\)\s*$/,
    '',
);

const { t: dashboardT } =
    useTranslation('dashboard');

const { cropImage, takePhoto, cropDialog } =
    useImageCropper();

useEffect(() => {
    const dialog = menuDialog.current;
    if (!dialog) return;

    if (menuOpen && !dialog.open) {
        dialog.showModal();
    } else if (!menuOpen && dialog.open) {
        dialog.close();
    }
}, [menuOpen]);



const openMenu = () => {
    menuOpenRef.current = true;
    setMenuOpen(true);
};

const closeMenu = () => {
    menuOpenRef.current = false;
    setMenuOpen(false);
};
useEffect(() => {
    const navigation = window.navigation;

    if (!navigation) {
        return undefined;
    }

    const handleNavigate = (event) => {
        if (
            !menuOpenRef.current ||
            event.navigationType !== 'traverse'
        ) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }

        menuOpenRef.current = false;
        setMenuOpen(false);
    };

    navigation.addEventListener(
        'navigate',
        handleNavigate,
    );

    return () => {
        navigation.removeEventListener(
            'navigate',
            handleNavigate,
        );
    };
}, []);

const select = async (selected) => {
        if (!selected) return false;
        const cropped = await cropImage(selected);
        if (!cropped) return false;
        onChange(cropped);
        return true;
    };
const triggerPhotoInput = async (source) => {
    if (source === 'camera') {
        // Keep the menu's history entry while the camera and cropper are open.
        setMenuOpen(false);
        const photo = await takePhoto();
        if (photo) {
            // Keep the synthetic history entry as a Back guard. Traversing
            // history here can remount the Inertia page and erase the preview.
            onChange(photo);
        } else {
            openMenu();
        }
        return;
    }

    let input = uploadInput.current;

    if (source === 'upload') {
        input = uploadInput.current;
    } else if (source === 'gallery') {
        input = galleryInput.current;
    }

    // Start the phone picker from the user's click.
    input?.click();
};
 const handleFileChange = async (event) => {
    const selected =
        event.target.files?.[0] ?? null;

    event.target.value = '';

    if (!selected) {
        return;
    }

    // Keep the menu's history entry while the cropper is open. Calling
    // history.back() here can restore an older Inertia state and erase the
    // selected photo from the Add Book field.
    setMenuOpen(false);
    const applied = await select(selected);

    if (!applied) {
        openMenu();
    }
};
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60 sm:rounded-2xl sm:p-3">
            {cropDialog}
    <dialog
        ref={menuDialog}
        closedby="any"
        onCancel={(event) => {
            event.preventDefault();
            closeMenu();
        }}
        onClose={() => {
            menuOpenRef.current = false;
            setMenuOpen(false);
       }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-slate-950/55 backdrop:backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
    >
      <div className="relative flex h-full w-full items-end justify-center">
        <button
            type="button"
            aria-label={dashboardT('school_list.cancel')}
            onClick={closeMenu}
            className="absolute inset-0"
        />

        <div className="relative w-full rounded-t-3xl bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:bg-slate-900 sm:max-w-lg">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                {label}
            </h3>

            <div className="mt-4 space-y-2">
                <button
                    type="button"
                    onClick={() => triggerPhotoInput('camera')}
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path d="M14.5 5H9.5L8 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
                        <circle cx="12" cy="13" r="3" />
                    </svg>

                    <span>
                        {dashboardT('school_list.take_photo')}
                    </span>
                </button>

                <button
                    type="button"
                   onClick={() => triggerPhotoInput('gallery')}
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-5-5L5 20" />
                    </svg>

                    <span>
                        {dashboardT('school_list.gallery')}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => triggerPhotoInput('upload')}
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path d="M12 16V4" />
                        <path d="m7 9 5-5 5 5" />
                        <path d="M5 20h14" />
                    </svg>

                    <span>
                        {dashboardT('school_list.upload')}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={closeMenu}
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 text-start font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path d="M6 6l12 12" />
                        <path d="M18 6 6 18" />
                    </svg>

                    <span>
                        {dashboardT('school_list.cancel')}
                    </span>
                </button>
            </div>
        </div>
      </div>
    </dialog>
            <div className="mb-2 flex min-w-0 items-center justify-between gap-1.5">
                <strong className="truncate text-xs text-slate-950 dark:text-white sm:text-sm">{label}</strong>
                {optional && <span className="shrink-0 text-[9px] text-slate-500 sm:text-xs">{optional}</span>}
            </div>

            <button
                type="button"
                onClick={openMenu}
                className={`group relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed p-2 text-xs font-bold text-indigo-600 transition dark:text-indigo-300 ${preview ? 'border-emerald-400 bg-slate-950 ring-1 ring-amber-400/70 dark:border-emerald-500' : 'border-amber-400/80 bg-white ring-1 ring-emerald-400/70 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-500/10 dark:border-amber-500/80'}`}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt=""
                            className="absolute inset-2 m-auto block max-h-[calc(100%-1rem)] max-w-[calc(100%-1rem)] rounded-lg"
                            style={{
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                objectPosition: 'center',
                            }}
                        />
                        <span
                            role="button"
                            tabIndex="0"
                            onClick={(event) => {
                                event.stopPropagation();
                                onChange(null);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onChange(null);
                                }
                            }}
                            aria-label={dashboardT('school_list.remove_photo')}
                            className="absolute end-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950/80 text-white shadow-md backdrop-blur transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-white"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                        </span>
                    </>
                ) : (
                    <span className="px-1 text-center">
                        <svg className="mx-auto h-8 w-8 text-slate-400 transition group-hover:text-indigo-500 sm:h-10 sm:w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.2-2h5.6L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z" /><circle cx="12" cy="12.5" r="3.5" /></svg>
                        <span className="mt-1.5 line-clamp-2 block text-[10px] sm:text-xs">
                              {file ? file.name : boxLabel}
                        </span>
                    </span>
                )}
            </button>

            {/* <div className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
                <button type="button" onClick={() => uploadInput.current?.click()} className="min-h-8 truncate rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-slate-700 hover:border-indigo-500 dark:border-slate-700 dark:text-slate-200 sm:min-h-9 sm:text-xs">{uploadLabel}</button>
                <button type="button" onClick={() => cameraInput.current?.click()} className="min-h-8 truncate rounded-lg bg-indigo-600 px-2 text-[10px] font-bold text-white hover:bg-indigo-500 sm:min-h-9 sm:text-xs">{cameraLabel}</button>
            </div> */}

{/* Device folders / file manager */}
<input
    ref={uploadInput}
    type="file"
    onChange={handleFileChange}
    className="sr-only"
/>

{/* Photo gallery */}
<input
    ref={galleryInput}
    type="file"
    accept="image/*"
    className="sr-only"
    onChange={handleFileChange}
/>

{/* Camera */}
<input
    ref={cameraInput}
    type="file"
    accept="image/*"
    capture="environment"
    className="sr-only"
    onChange={handleFileChange}
/>
        </div>
    );
};

const CameraIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M14.5 5 13 3H9L7.5 5H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-4.5Z" />
        <circle cx="11" cy="12.5" r="4" />
    </svg>
);

const GalleryIcon = ({ className = 'h-5 w-5' }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m3 17 5-5 4 4 3-3 6 6" />
    </svg>
);

const BookOutlineIcon = ({ className = 'h-6 w-6' }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22Z" />
    </svg>
);

const AddBookPhotoInput = ({
    variant,
    file,
    preview,
    onChange,
}) => {
    const { t, i18n } = useTranslation('bookAi');

    const isFrench = i18n.language?.startsWith('fr');
    const galleryInput = useRef(null);
    const { cropImage, takePhoto, cropDialog } = useImageCropper();
    const isFront = variant === 'front';

    const applyFile = async (selected) => {
        if (!selected) return;

        const cropped = await cropImage(selected);
        if (cropped) onChange(cropped);
    };

    const handleGallery = async (event) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = '';
        await applyFile(selected);
    };

    const handleCamera = async () => {
        const selected = await takePhoto();
        if (selected) onChange(selected);
    };

    const openGallery = () => galleryInput.current?.click();

    return (
        <article className="rounded-[1.35rem] border border-slate-200/90 bg-white p-3 shadow-[0_14px_45px_rgba(79,70,229,0.06)] dark:border-slate-700 dark:bg-slate-900 sm:p-4">
            {cropDialog}

            <div className="mb-3 flex items-center gap-3">
                <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                        isFront
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                            : 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300'
                    }`}
                >
                    <BookOutlineIcon />
                </span>

                <span className="min-w-0">
                    <strong className="block text-base font-extrabold text-slate-950 dark:text-white">
                        {t(isFront ? 'front_title' : 'back_title')}{' '}
                        <span className="text-rose-500">({t('required')})</span>
                    </strong>
                    <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                        {t(isFront ? 'front_help' : 'back_help')}
                    </span>
                </span>
            </div>

            <div
                role="button"
                tabIndex="0"
                onClick={openGallery}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openGallery();
                    }
                }}
                className={`group relative flex min-h-[18rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-3 py-5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:min-h-[15rem] ${
                    isFront
                        ? 'border-indigo-300 bg-indigo-50/25 hover:bg-indigo-50/60 dark:border-indigo-500/50 dark:bg-indigo-500/5'
                        : 'border-teal-300 bg-teal-50/25 hover:bg-teal-50/60 dark:border-teal-500/50 dark:bg-teal-500/5'
                }`}
            >
                {preview ? (
                    <div className="relative mb-4 h-32 w-32 sm:h-28 sm:w-28">
                        <img
                            src={preview}
                            alt=""
                            className="h-full w-full rounded-xl object-contain shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onChange(null);
                            }}
                            className="absolute -end-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white shadow-lg transition hover:bg-rose-600"
                            aria-label={t('remove_photo')}
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                <path d="M6 6l12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <img
                        src={isFront ? '/images/add-book/front-cover-v1.png' : '/images/add-book/back-cover-v1.png'}
                        alt=""
                        className="mb-1 h-32 w-32 object-contain sm:h-28 sm:w-28"
                    />
                )}

                <strong className="text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">
                    {t('drop_or_choose')}
                </strong>

           <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 sm:gap-3">
    <button
        type="button"
        onClick={(event) => {
            event.stopPropagation();
            handleCamera();
        }}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-2 text-[11px] font-extrabold text-white shadow-lg shadow-indigo-200/70 transition hover:-translate-y-0.5 hover:shadow-xl dark:shadow-none sm:gap-2 sm:text-sm"
    >
        <CameraIcon className="h-5 w-5 shrink-0" />
        <span
    className={
        isFrench
            ? 'text-center leading-tight'
            : 'whitespace-nowrap'
    }
>
    {isFrench ? (
        <>
            Prendre une
            <br />
            photo
        </>
    ) : (
        t('take_photo')
    )}
</span>
    </button>

   <button
    type="button"
    onClick={(event) => {
        event.stopPropagation();
        openGallery();
    }}
    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white/90 px-2 text-xs font-extrabold leading-tight text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-300 sm:gap-2 sm:text-sm"
>
    <GalleryIcon className="h-5 w-5 shrink-0" />

    <span className="text-center">
        {t('choose_gallery')}
    </span>
</button>
</div>
            </div>

            <input
                ref={galleryInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleGallery}
                className="sr-only"
            />
        </article>
    );
};

export default function BookAiPhotoAnalyzer({
    disabled,
    bookCategory,
    initialFront = null,
    initialBack = null,
    onResult,
    onFrontChange,
    onBackChange,
    onIdentifierDetected,
    onStatusChange,
    onManualEntry,
}) {
  const { t, i18n } = useTranslation('bookAi');

const isFrench = i18n.language?.startsWith('fr');
  const [front, setFront] = useState(
    () => initialFront,
);

const [back, setBack] = useState(
    () => initialBack,
);

const [frontPreview, setFrontPreview] = useState(
    () =>
        initialFront
            ? URL.createObjectURL(initialFront)
            : null,
);

const [backPreview, setBackPreview] = useState(
    () =>
        initialBack
            ? URL.createObjectURL(initialBack)
            : null,
);

const [status, setStatus] = useState('idle');
const [message, setMessage] = useState('');
const analysisRequestRef = useRef(null);

useEffect(() => {
    onStatusChange?.(status);
}, [onStatusChange, status]);

const frontPreviewRef = useRef(frontPreview);
const backPreviewRef = useRef(backPreview);

   const updateFront = (file) => {
    if (frontPreviewRef.current) {
        URL.revokeObjectURL(
            frontPreviewRef.current,
        );
    }

    const next = file
        ? URL.createObjectURL(file)
        : null;

    frontPreviewRef.current = next;

    setFront(file);
    setFrontPreview(next);

    onFrontChange?.(file);
};

    const updateBack = (file) => {
        if (backPreviewRef.current) {
            URL.revokeObjectURL(backPreviewRef.current);
        }

        const next = file ? URL.createObjectURL(file) : null;
        backPreviewRef.current = next;
        setBack(file);
        setBackPreview(next);

        onBackChange?.(file);
    };

    useEffect(() => () => {
        analysisRequestRef.current?.abort();
        if (frontPreviewRef.current) URL.revokeObjectURL(frontPreviewRef.current);
        if (backPreviewRef.current) URL.revokeObjectURL(backPreviewRef.current);
    }, []);

    const analyze = async () => {
        if (!front || !back) {
            setStatus('error');
            setMessage(t(!front ? 'front_required' : 'back_required'));
            return;
        }

        analysisRequestRef.current?.abort();
        const controller = new AbortController();
        analysisRequestRef.current = controller;

        setStatus('scanning');
        setMessage('');

        try {
            const detectedIdentifier = await scanBackCoverIdentifier(
                back,
                controller.signal,
            );

            if (controller.signal.aborted) return;

            if (detectedIdentifier && onIdentifierDetected) {
                setStatus('lookup');
                const found = await onIdentifierDetected(detectedIdentifier);

                if (controller.signal.aborted) return;

                if (found) {
                    setStatus('success');
                    setMessage(t('catalog_found'));
                    return;
                }
            }

        const payload = new FormData();
payload.append('front', front);
payload.append('back', back);
payload.append('book_category', bookCategory);
setStatus('loading');

            const response = await axios.post(
                route('books.analyze-photos'),
                payload,
                { signal: controller.signal },
            );
            const result = response.data.data;

            if (controller.signal.aborted) return;

            if (!result.is_book) {
                setStatus('error');
                setMessage(t('not_book'));
                return;
            }

            const analyzedIdentifiers = [];
            const analyzedIsbn = normalizeIsbn(result.isbn);

            if (analyzedIsbn) {
                analyzedIdentifiers.push({
                    rawValue: analyzedIsbn,
                    normalizedValue: analyzedIsbn,
                    barcodeFormat: 'EAN_13',
                    identifierType: 'isbn',
                    isbn: analyzedIsbn,
                });
            }

            const analyzedBarcode = classifyBookIdentifier(
                result.barcode,
                result.barcode_format ?? 'AI_VISION',
            );

            if (analyzedBarcode?.identifierType === 'custom') {
                analyzedIdentifiers.push(analyzedBarcode);
            }

            const checkedIdentifiers = new Set(
                detectedIdentifier ? [detectedIdentifier.normalizedValue] : [],
            );

            for (const identifier of analyzedIdentifiers) {
                if (
                    !onIdentifierDetected ||
                    checkedIdentifiers.has(identifier.normalizedValue)
                ) {
                    continue;
                }

                checkedIdentifiers.add(identifier.normalizedValue);
                setStatus('lookup');
                const found = await onIdentifierDetected(identifier);

                if (controller.signal.aborted) return;

                if (found) {
                    setStatus('success');
                    setMessage(t('catalog_found'));
                    return;
                }
            }

            onResult(result);
            setStatus('success');
            setMessage(result.warning || t('success'));
        } catch (error) {
            if (controller.signal.aborted || axios.isCancel(error)) return;

            setStatus('error');
            setMessage(
                error.response?.data?.message ||
                    error.response?.data?.errors?.front?.[0] ||
                    t('failed'),
            );
        } finally {
            if (analysisRequestRef.current === controller) {
                analysisRequestRef.current = null;
            }
        }
    };

    const isBusy = ['scanning', 'lookup', 'loading'].includes(status);

    if (isBusy) {
        const analysisSteps = [
            { label: t('progress_front'), state: 'done' },
            { label: t('progress_back'), state: 'done' },
            {
                label:
                    status === 'lookup'
                        ? t('progress_catalog')
                        : t('progress_extract'),
                state: 'active',
            },
            { label: t('progress_subject'), state: 'pending' },
            { label: t('progress_isbn'), state: 'pending' },
        ];

        return (
            <section className="overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900">
                <div className="grid items-center gap-4 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.15fr] lg:gap-10 lg:p-10">
                    <div className="order-2 flex justify-center lg:order-1">
                        <div className="relative w-full max-w-[25rem]">
                            <div className="absolute inset-[12%] rounded-full bg-gradient-to-br from-indigo-100 via-violet-50 to-sky-100 blur-2xl dark:from-indigo-500/20 dark:via-violet-500/10 dark:to-sky-500/10" />
                            <img
                                src="/images/add-book/ai-reading-v1.png"
                                alt=""
                                className="relative mx-auto aspect-[1.2/1] w-full object-contain"
                            />
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            {t('reading_title')}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-base">
                            {t('reading_description')}
                        </p>

                        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/50 sm:p-5">
                            {analysisSteps.map((step) => (
                                <div key={step.label} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:text-base">
                                    {step.state === 'done' ? (
                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                                        </span>
                                    ) : step.state === 'active' ? (
                                        <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600 dark:border-indigo-500/20 dark:border-t-indigo-300" />
                                    ) : (
                                        <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                                    )}
                                    <span>{step.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 p-4 text-sm text-slate-600 dark:from-indigo-500/10 dark:to-sky-500/10 dark:text-slate-300">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500 text-base font-black text-white">i</span>
                            <span>
                                <strong className="block text-slate-900 dark:text-white">{t('please_wait')}</strong>
                                {t('please_wait_help')}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const Tips = ({ mobile = false }) => (
        <div className={`${mobile ? 'mt-4 md:hidden' : 'mb-4 hidden md:flex'} gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/90 to-indigo-50/80 p-4 dark:border-sky-500/20 dark:from-sky-500/10 dark:to-indigo-500/10`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-500/15">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.3 14.5A7 7 0 1 1 15.7 14.5C14.7 15.4 14.2 16 14 17h-4c-.2-1-.7-1.6-1.7-2.5Z" /></svg>
            </span>
            <span className="min-w-0">
                <strong className="block text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">{t('tips_title')}</strong>
                {mobile ? (
                    <ul className="mt-1 list-disc ps-5 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">
                        <li>{t('tip_clear')}</li>
                        <li>{t('tip_glare')}</li>
                        <li>{t('tip_whole_cover')}</li>
                    </ul>
                ) : (
                    <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{t('tips_description')}</span>
                )}
            </span>
        </div>
    );

    return (
        <section
            id="add-book-photos"
            className="scroll-mt-24 rounded-[1.6rem] border border-slate-200/90 bg-white p-3 shadow-[0_24px_70px_rgba(79,70,229,0.09)] dark:border-slate-700 dark:bg-slate-900 sm:p-5"
        >
            <Tips />

            <div className="grid gap-4 md:grid-cols-2">
                <AddBookPhotoInput variant="front" file={front} preview={frontPreview} onChange={updateFront} />
                <AddBookPhotoInput variant="back" file={back} preview={backPreview} onChange={updateBack} />
            </div>

            <Tips mobile />

            {message && (
                <div
                    aria-live="polite"
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                        status === 'success'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                            : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100'
                    }`}
                >
                    {message}
                </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={analyze}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none sm:w-auto sm:min-w-40"
                >
                    {t('analyze')}
                    <DirectionalArrowIcon />
                </button>

                <p className="flex items-center gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    {t('privacy')}
                </p>

                {onManualEntry && (
                    <button type="button" onClick={onManualEntry} className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300 sm:ms-auto">
                        {t('manual_entry')}
                    </button>
                )}
            </div>
        </section>
    );
}
