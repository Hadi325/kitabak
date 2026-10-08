import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
    detectBookBounds,
    preloadBookBoundaryDetector,
} from '@/lib/bookBoundaryDetector';

const FULL_IMAGE = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
};

const MIN_SELECTION = 0.04;
const MAX_IMAGE_DIMENSION = 2048;
const JPEG_QUALITY = 0.88;

const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));

const preventImageContextMenu = (event) => {
    event.preventDefault();
};

const releaseCanvas = (canvas) => {
    canvas.width = 1;
    canvas.height = 1;
};

const canvasToBlob = (canvas, type, quality) =>
    new Promise((resolve, reject) => {
        try {
            canvas.toBlob(
                (blob) => {
                    releaseCanvas(canvas);
                    resolve(blob);
                },
                type,
                quality,
            );
        } catch (error) {
            releaseCanvas(canvas);
            reject(error);
        }
    });
const useHardwareBack = (
    onBack,
    active = true,
    resetKey = null,
) => {
    const onBackRef = useRef(onBack);

    useEffect(() => {
        onBackRef.current = onBack;
    }, [onBack]);

    useEffect(() => {
        if (!active) {
            return undefined;
        }

        let handled = false;

        const close = () => {
            if (handled) {
                return;
            }

            handled = true;
            onBackRef.current?.();
        };

        const navigationApi =
            window.navigation;

        const handleNavigation = (event) => {
            if (
                event.navigationType !==
                'traverse'
            ) {
                return;
            }

            event.preventDefault();
            close();
        };

        navigationApi?.addEventListener(
            'navigate',
            handleNavigation,
        );

        const closeWatcher =
            'CloseWatcher' in window
                ? new window.CloseWatcher()
                : null;

        closeWatcher?.addEventListener(
            'close',
            close,
            { once: true },
        );

        return () => {
            navigationApi?.removeEventListener(
                'navigate',
                handleNavigation,
            );

            closeWatcher?.destroy();
        };
    }, [active, resetKey]);
};

export function useImageCropper() {
    const [request, setRequest] =
        useState(null);

    const [cameraOpen, setCameraOpen] =
        useState(false);

    const requestRef = useRef(null);

    const cropImage = (
        file,
        sourceType = 'gallery',
    ) => {
        if (
            !file ||
            !file.type?.startsWith('image/')
        ) {
            return Promise.resolve(file);
        }

        return new Promise((resolve) => {
            requestRef.current?.resolve(null);

            requestRef.current = {
                resolve,
            };

            setRequest({
                file,
                sourceType,
            });
        });
    };

    const takePhoto = () =>
        new Promise((resolve) => {
            requestRef.current?.resolve(null);

            requestRef.current = {
                resolve,
            };

            setCameraOpen(true);
        });

    const finish = (file) => {
        const activeRequest =
            requestRef.current;

        if (!activeRequest) {
            return;
        }

        requestRef.current = null;

        setCameraOpen(false);
        setRequest(null);

        activeRequest.resolve(file);
    };

    useEffect(
        () => () => {
            const activeRequest =
                requestRef.current;

            requestRef.current = null;

            activeRequest?.resolve(null);
        },
        [],
    );

    return {
        cropImage,
        takePhoto,

        cropDialog: cameraOpen ? (
            <CameraCaptureDialog
                onCancel={() =>
                    finish(null)
                }
                onCapture={(file) => {
                    setCameraOpen(false);

                    setRequest({
                        file,
                        sourceType: 'camera',
                    });
                }}
            />
        ) : request ? (
            <ImageCropDialog
                file={request.file}
                sourceType={
                    request.sourceType
                }
                onCancel={() =>
                    finish(null)
                }
                onConfirm={finish}
            />
        ) : null,
    };
}

export default function ImageCropDialog({
    file,
    sourceType = 'gallery',
    onCancel,
    onConfirm,
}) {
    const { t } =
        useTranslation('common');

    const imageRef = useRef(null);
    const stageRef = useRef(null);

    const interactionRef =
        useRef(null);

    const detectionRunRef =
        useRef(0);

    const replacementInputRef =
        useRef(null);

    const mountedRef = useRef(true);

    /*
     * Drawing refs.
     */
    const drawCanvasRef =
        useRef(null);

    const drawingRef =
        useRef(false);

    const drawHistoryRef =
        useRef([]);

        const [drawColor, setDrawColor] =
    useState('#ffffff');

const [drawSize, setDrawSize] =
    useState(6);

    const [workingFile, setWorkingFile] =
        useState(file);

    const [
        workingSourceType,
        setWorkingSourceType,
    ] = useState(sourceType);

    const [source, setSource] =
        useState('');

    const [mode, setMode] =
        useState('preview');

    const [selection, setSelection] =
        useState(FULL_IMAGE);

    const [saving, setSaving] =
        useState(false);

    const [ready, setReady] =
        useState(false);

    const [detectingEdges, setDetectingEdges] =
        useState(false);

    const [retaking, setRetaking] =
        useState(false);

    const [drawReady, setDrawReady] =
        useState(false);

    const [drawHistoryCount, setDrawHistoryCount] =
        useState(0);

useHardwareBack(
    () => {
        if (mode === 'crop') {
            setSelection(FULL_IMAGE);
            setMode('preview');
            return;
        }

        if (mode === 'draw') {
            drawHistoryRef.current = [];
            setDrawHistoryCount(0);
            setDrawReady(false);
            setMode('preview');
            return;
        }

        onCancel();
    },
    !retaking,
    mode,
);
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const url =
            URL.createObjectURL(
                workingFile,
            );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        setSource(url);

        return () => {
            URL.revokeObjectURL(url);

            document.body.style.overflow =
                previousOverflow;
        };
    }, [workingFile]);

    useEffect(() => {
        if (!ready || mode !== 'preview') {
            return undefined;
        }

        const warmUp = () =>
            preloadBookBoundaryDetector();

        if ('requestIdleCallback' in window) {
            const idleCallback = window.requestIdleCallback(
                warmUp,
                { timeout: 1200 },
            );

            return () =>
                window.cancelIdleCallback(idleCallback);
        }

        const timeout = window.setTimeout(warmUp, 250);

        return () => window.clearTimeout(timeout);
    }, [ready, mode, source]);

    const replaceWorkingFile = (
        nextFile,
        nextSourceType,
    ) => {
        if (!nextFile) {
            return;
        }

        setReady(false);
        setDrawReady(false);
        setDetectingEdges(false);

        detectionRunRef.current += 1;

        drawHistoryRef.current = [];
        setDrawHistoryCount(0);

        setSelection(FULL_IMAGE);
        setMode('preview');

        setWorkingFile(nextFile);

        setWorkingSourceType(
            nextSourceType,
        );
    };

const rotateImage = async (degrees) => {
    const image = imageRef.current;

    if (
        saving ||
        !ready ||
        !image?.naturalWidth ||
        !image?.naturalHeight
    ) {
        return;
    }

    setSaving(true);

    try {
        const normalizedDegrees =
            ((degrees % 360) + 360) % 360;

        const swapsDimensions =
            normalizedDegrees === 90 ||
            normalizedDegrees === 270;

        /*
         * Do not rotate huge phone photos at their
         * original resolution. Keep the working image
         * within the same 2048px limit used elsewhere
         * in the editor.
         */
        const scale = Math.min(
            1,
            MAX_IMAGE_DIMENSION /
                Math.max(
                    image.naturalWidth,
                    image.naturalHeight,
                ),
        );

        const sourceWidth = Math.max(
            1,
            Math.round(
                image.naturalWidth * scale,
            ),
        );

        const sourceHeight = Math.max(
            1,
            Math.round(
                image.naturalHeight * scale,
            ),
        );

        const canvas =
            document.createElement('canvas');

        canvas.width = swapsDimensions
            ? sourceHeight
            : sourceWidth;

        canvas.height = swapsDimensions
            ? sourceWidth
            : sourceHeight;

        const context = canvas.getContext(
            '2d',
            {
                alpha: false,
            },
        );

        if (!context) {
            releaseCanvas(canvas);
            return;
        }

        context.fillStyle = '#ffffff';

        context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height,
        );

        context.translate(
            canvas.width / 2,
            canvas.height / 2,
        );

        context.rotate(
            (normalizedDegrees * Math.PI) /
                180,
        );

        context.drawImage(
            image,
            -sourceWidth / 2,
            -sourceHeight / 2,
            sourceWidth,
            sourceHeight,
        );

        const blob = await canvasToBlob(
            canvas,
            'image/jpeg',
            JPEG_QUALITY,
        );

        if (
            !blob ||
            !mountedRef.current
        ) {
            return;
        }

        const baseName =
            workingFile.name.replace(
                /\.[^.]+$/,
                '',
            ) || 'photo';

        const nextFile = new File(
            [blob],
            `${baseName}-rotated.jpg`,
            {
                type: 'image/jpeg',
                lastModified: Date.now(),
            },
        );

        replaceWorkingFile(
            nextFile,
            workingSourceType,
        );
    } finally {
        if (mountedRef.current) {
            setSaving(false);
        }
    }
};

    if (retaking) {
        return (
            <CameraCaptureDialog
                onCancel={() =>
                    setRetaking(false)
                }
                onCapture={(nextFile) => {
                    replaceWorkingFile(
                        nextFile,
                        'camera',
                    );

                    setRetaking(false);
                }}
            />
        );
    }

    /*
     * -------------------------------------------------
     * Crop
     * -------------------------------------------------
     */

    const openCrop = async () => {
        const image = imageRef.current;

        if (
            detectingEdges ||
            !ready ||
            !image?.naturalWidth ||
            !image.naturalHeight
        ) {
            return;
        }

        const detectionRun = detectionRunRef.current + 1;
        detectionRunRef.current = detectionRun;

        setDetectingEdges(true);

        try {
            const detectedSelection = await detectBookBounds(image);

            if (
                !mountedRef.current ||
                detectionRunRef.current !== detectionRun
            ) {
                return;
            }

            setSelection(detectedSelection ?? FULL_IMAGE);
            setMode('crop');
        } catch {
            if (
                mountedRef.current &&
                detectionRunRef.current === detectionRun
            ) {
                setSelection(FULL_IMAGE);
                setMode('crop');
            }
        } finally {
            if (
                mountedRef.current &&
                detectionRunRef.current === detectionRun
            ) {
                setDetectingEdges(false);
            }
        }
    };

    const pointFromEvent = (event) => {
        const bounds =
            stageRef.current?.getBoundingClientRect();

        if (!bounds) {
            return null;
        }

        return {
            x: clamp(
                (event.clientX -
                    bounds.left) /
                    bounds.width,
                0,
                1,
            ),

            y: clamp(
                (event.clientY -
                    bounds.top) /
                    bounds.height,
                0,
                1,
            ),
        };
    };

    const beginInteraction = (
        event,
        type,
        handle = '',
    ) => {
        const point =
            pointFromEvent(event);

        if (
            !point ||
            !stageRef.current
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        stageRef.current.setPointerCapture(
            event.pointerId,
        );

        interactionRef.current = {
            type,
            handle,
            start: point,
            selection: {
                ...selection,
            },
        };

        if (type === 'create') {
            setSelection({
                x: point.x,
                y: point.y,
                width: 0,
                height: 0,
            });
        }
    };

    const moveInteraction = (event) => {
        const interaction =
            interactionRef.current;

        const point =
            pointFromEvent(event);

        if (
            !interaction ||
            !point
        ) {
            return;
        }

        event.preventDefault();

        const original =
            interaction.selection;

        const dx =
            point.x -
            interaction.start.x;

        const dy =
            point.y -
            interaction.start.y;

        if (
            interaction.type ===
            'create'
        ) {
            setSelection({
                x: Math.min(
                    interaction.start.x,
                    point.x,
                ),

                y: Math.min(
                    interaction.start.y,
                    point.y,
                ),

                width: Math.abs(
                    point.x -
                        interaction.start.x,
                ),

                height: Math.abs(
                    point.y -
                        interaction.start.y,
                ),
            });

            return;
        }

        if (
            interaction.type ===
            'move'
        ) {
            setSelection({
                ...original,

                x: clamp(
                    original.x + dx,
                    0,
                    1 -
                        original.width,
                ),

                y: clamp(
                    original.y + dy,
                    0,
                    1 -
                        original.height,
                ),
            });

            return;
        }

        const right =
            original.x +
            original.width;

        const bottom =
            original.y +
            original.height;

        let x = original.x;
        let y = original.y;

        let width =
            original.width;

        let height =
            original.height;

        if (
            interaction.handle.includes(
                'w',
            )
        ) {
            x = clamp(
                original.x + dx,
                0,
                right -
                    MIN_SELECTION,
            );

            width = right - x;
        }

        if (
            interaction.handle.includes(
                'e',
            )
        ) {
            width = clamp(
                original.width + dx,
                MIN_SELECTION,
                1 - original.x,
            );
        }

        if (
            interaction.handle.includes(
                'n',
            )
        ) {
            y = clamp(
                original.y + dy,
                0,
                bottom -
                    MIN_SELECTION,
            );

            height =
                bottom - y;
        }

        if (
            interaction.handle.includes(
                's',
            )
        ) {
            height = clamp(
                original.height + dy,
                MIN_SELECTION,
                1 - original.y,
            );
        }

        setSelection({
            x,
            y,
            width,
            height,
        });
    };

    const endInteraction = (event) => {
        if (
            !interactionRef.current
        ) {
            return;
        }

        interactionRef.current = null;

        if (
            stageRef.current?.hasPointerCapture(
                event.pointerId,
            )
        ) {
            stageRef.current.releasePointerCapture(
                event.pointerId,
            );
        }

        setSelection((current) =>
            current.width <
                MIN_SELECTION ||
            current.height <
                MIN_SELECTION
                ? FULL_IMAGE
                : current,
        );
    };

    /*
     * -------------------------------------------------
     * Draw
     * -------------------------------------------------
     */

    const prepareDrawCanvas = () => {
        const image =
            imageRef.current;

        const canvas =
            drawCanvasRef.current;

        if (
            !image ||
            !canvas ||
            !image.naturalWidth ||
            !image.naturalHeight
        ) {
            return;
        }

        const scale = Math.min(
            1,
            MAX_IMAGE_DIMENSION /
                Math.max(
                    image.naturalWidth,
                    image.naturalHeight,
                ),
        );

        canvas.width = Math.max(
            1,
            Math.round(
                image.naturalWidth *
                    scale,
            ),
        );

        canvas.height = Math.max(
            1,
            Math.round(
                image.naturalHeight *
                    scale,
            ),
        );

        const context =
            canvas.getContext(
                '2d',
                {
                    alpha: false,
                },
            );

        if (!context) {
            return;
        }

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        drawHistoryRef.current = [];
        setDrawHistoryCount(0);

        setDrawReady(true);
    };

    const saveDrawHistory = () => {
        const canvas =
            drawCanvasRef.current;

        const context =
            canvas?.getContext('2d');

        if (
            !canvas ||
            !context
        ) {
            return;
        }

        /*
         * Save the image before a new
         * stroke begins so Undo restores
         * the previous state.
         */
        const snapshot =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            );

        drawHistoryRef.current.push(
            snapshot,
        );

        /*
         * Limit history to avoid excessive
         * memory use on mobile devices.
         */
        if (
            drawHistoryRef.current
                .length > 12
        ) {
            drawHistoryRef.current.shift();
        }

        setDrawHistoryCount(
            drawHistoryRef.current.length,
        );
    };

    const drawPointFromEvent = (
        event,
    ) => {
        const canvas =
            drawCanvasRef.current;

        if (!canvas) {
            return null;
        }

        const bounds =
            canvas.getBoundingClientRect();

        if (
            !bounds.width ||
            !bounds.height
        ) {
            return null;
        }

        return {
            x:
                (event.clientX -
                    bounds.left) *
                (canvas.width /
                    bounds.width),

            y:
                (event.clientY -
                    bounds.top) *
                (canvas.height /
                    bounds.height),
        };
    };

    const beginDrawing = (event) => {
        const canvas =
            drawCanvasRef.current;

        const point =
            drawPointFromEvent(
                event,
            );

        if (
            !canvas ||
            !point ||
            !drawReady
        ) {
            return;
        }

        event.preventDefault();

        saveDrawHistory();

        canvas.setPointerCapture(
            event.pointerId,
        );

        drawingRef.current = true;

        const context =
            canvas.getContext('2d');

        if (!context) {
            return;
        }

        context.beginPath();

        context.moveTo(
            point.x,
            point.y,
        );
    };

    const moveDrawing = (event) => {
        if (
            !drawingRef.current
        ) {
            return;
        }

        const canvas =
            drawCanvasRef.current;

        const point =
            drawPointFromEvent(
                event,
            );

        if (
            !canvas ||
            !point
        ) {
            return;
        }

        event.preventDefault();

        const context =
            canvas.getContext('2d');

        if (!context) {
            return;
        }

       const displayWidth =
    canvas.getBoundingClientRect().width || canvas.width;

const scale =
    canvas.width / displayWidth;

context.lineWidth =
    Math.max(1, drawSize * scale);

        context.lineCap =
            'round';

        context.lineJoin =
            'round';

      context.strokeStyle =
    drawColor;

        context.lineTo(
            point.x,
            point.y,
        );

        context.stroke();
    };

    const endDrawing = (event) => {
        const canvas =
            drawCanvasRef.current;

        if (
            !canvas ||
            !drawingRef.current
        ) {
            return;
        }

        drawingRef.current = false;

        const context =
            canvas.getContext('2d');

        context?.closePath();

        if (
            canvas.hasPointerCapture(
                event.pointerId,
            )
        ) {
            canvas.releasePointerCapture(
                event.pointerId,
            );
        }
    };

    const undoDrawing = () => {
        const canvas =
            drawCanvasRef.current;

        const context =
            canvas?.getContext('2d');

        const previous =
            drawHistoryRef.current.pop();

        if (
            !canvas ||
            !context ||
            !previous
        ) {
            return;
        }

        context.putImageData(
            previous,
            0,
            0,
        );

        setDrawHistoryCount(
            drawHistoryRef.current.length,
        );
    };

    const clearDrawing = () => {
        const image =
            imageRef.current;

        const canvas =
            drawCanvasRef.current;

        if (
            !image ||
            !canvas ||
            !drawReady
        ) {
            return;
        }

        saveDrawHistory();

        const context =
            canvas.getContext(
                '2d',
                {
                    alpha: false,
                },
            );

        if (!context) {
            return;
        }

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height,
        );

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height,
        );
    };

    const confirmDrawing =
        async () => {
            const canvas =
                drawCanvasRef.current;

            if (
                !canvas ||
                !drawReady
            ) {
                return;
            }

            setSaving(true);

            try {
                const blob =
                    await canvasToBlob(
                        canvas,
                        'image/jpeg',
                        JPEG_QUALITY,
                    );

                if (
                    !blob ||
                    !mountedRef.current
                ) {
                    return;
                }

                const baseName =
                    workingFile.name.replace(
                        /\.[^.]+$/,
                        '',
                    ) ||
                    'photo';

                const nextFile =
                    new File(
                        [blob],
                        `${baseName}-drawn.jpg`,
                        {
                            type: 'image/jpeg',
                            lastModified:
                                Date.now(),
                        },
                    );

                /*
                 * Keep editing instead of
                 * uploading immediately.
                 *
                 * After Done, Preview opens
                 * again and the user can
                 * Crop or Use photo.
                 */
                replaceWorkingFile(
                    nextFile,
                    workingSourceType,
                );
            } finally {
                if (
                    mountedRef.current
                ) {
                    setSaving(false);
                }
            }
        };

    /*
     * -------------------------------------------------
     * Export crop
     * -------------------------------------------------
     */

    const confirmCrop =
        async () => {
            const image =
                imageRef.current;

            if (
                !image ||
                !image.naturalWidth ||
                !image.naturalHeight
            ) {
                return;
            }

            const isFullImage =
                selection.x <=
                    0.001 &&
                selection.y <=
                    0.001 &&
                selection.width >=
                    0.999 &&
                selection.height >=
                    0.999;

        if (isFullImage) {
    setSelection(FULL_IMAGE);
    setMode('preview');
    return;
}

            setSaving(true);

            try {
                const sx =
                    Math.round(
                        selection.x *
                            image.naturalWidth,
                    );

                const sy =
                    Math.round(
                        selection.y *
                            image.naturalHeight,
                    );

                const sw =
                    Math.max(
                        1,
                        Math.round(
                            selection.width *
                                image.naturalWidth,
                        ),
                    );

                const sh =
                    Math.max(
                        1,
                        Math.round(
                            selection.height *
                                image.naturalHeight,
                        ),
                    );

                const scale =
                    Math.min(
                        1,
                        MAX_IMAGE_DIMENSION /
                            Math.max(
                                sw,
                                sh,
                            ),
                    );

                const canvas =
                    document.createElement(
                        'canvas',
                    );

                canvas.width =
                    Math.max(
                        1,
                        Math.round(
                            sw * scale,
                        ),
                    );

                canvas.height =
                    Math.max(
                        1,
                        Math.round(
                            sh * scale,
                        ),
                    );

                canvas
                    .getContext(
                        '2d',
                        {
                            alpha: false,
                        },
                    )
                    .drawImage(
                        image,
                        sx,
                        sy,
                        sw,
                        sh,
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );

                const blob =
                    await canvasToBlob(
                        canvas,
                        'image/jpeg',
                        JPEG_QUALITY,
                    );

                if (
                    !blob ||
                    !mountedRef.current
                ) {
                    return;
                }

                const baseName =
                    workingFile.name.replace(
                        /\.[^.]+$/,
                        '',
                    ) ||
                    'photo';

             const croppedFile = new File(
    [blob],
    `${baseName}-cropped.jpg`,
    {
        type: 'image/jpeg',
        lastModified: Date.now(),
    },
);

replaceWorkingFile(
    croppedFile,
    workingSourceType,
);
            } finally {
                if (
                    mountedRef.current
                ) {
                    setSaving(false);
                }
            }
        };

    const confirmWholeImage =
        async () => {
            const image =
                imageRef.current;

            if (
                !image ||
                !image.naturalWidth ||
                !image.naturalHeight
            ) {
                return;
            }

            /*
             * Camera images are already
             * optimized by the camera dialog.
             */
            if (
                workingSourceType ===
                    'camera' &&
                workingFile.type ===
                    'image/jpeg' &&
                Math.max(
                    image.naturalWidth,
                    image.naturalHeight,
                ) <=
                    MAX_IMAGE_DIMENSION
            ) {
                onConfirm(
                    workingFile,
                );

                return;
            }

            setSaving(true);

            try {
                const scale =
                    Math.min(
                        1,
                        MAX_IMAGE_DIMENSION /
                            Math.max(
                                image.naturalWidth,
                                image.naturalHeight,
                            ),
                    );

                const canvas =
                    document.createElement(
                        'canvas',
                    );

                canvas.width =
                    Math.max(
                        1,
                        Math.round(
                            image.naturalWidth *
                                scale,
                        ),
                    );

                canvas.height =
                    Math.max(
                        1,
                        Math.round(
                            image.naturalHeight *
                                scale,
                        ),
                    );

                canvas
                    .getContext(
                        '2d',
                        {
                            alpha: false,
                        },
                    )
                    .drawImage(
                        image,
                        0,
                        0,
                        image.naturalWidth,
                        image.naturalHeight,
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );

                const blob =
                    await canvasToBlob(
                        canvas,
                        'image/jpeg',
                        JPEG_QUALITY,
                    );

                if (
                    !blob ||
                    !mountedRef.current
                ) {
                    return;
                }

                const baseName =
                    workingFile.name.replace(
                        /\.[^.]+$/,
                        '',
                    ) ||
                    'photo';

                onConfirm(
                    new File(
                        [blob],
                        `${baseName}-optimized.jpg`,
                        {
                            type: 'image/jpeg',
                            lastModified:
                                Date.now(),
                        },
                    ),
                );
            } finally {
                if (
                    mountedRef.current
                ) {
                    setSaving(false);
                }
            }
        };

    /*
     * -------------------------------------------------
     * Dialog
     * -------------------------------------------------
     */

    const dialog = (
        <div
            className="fixed inset-0 z-[100] flex bg-black text-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-title"
        >
            <section className="mx-auto flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-black sm:my-3 sm:h-[calc(100dvh-1.5rem)] sm:rounded-2xl sm:border sm:border-slate-700">
                <header className="relative flex min-h-16 shrink-0 items-center justify-center border-b border-white/10 px-16">
                    <h2
                        id="crop-title"
                        className="text-xl font-black"
                    >
                        {mode ===
                        'preview'
                            ? t(
                                  'crop.preview',
                              )
                            : mode ===
                                'draw'
                              ? 'Draw'
                              : t(
                                    'crop.title',
                                )}
                    </h2>

                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        className="absolute end-3 grid h-10 w-10 place-items-center rounded-full text-2xl text-slate-300 hover:bg-white/10"
                        aria-label={t(
                            'crop.cancel',
                        )}
                    >
                        ×
                    </button>
                </header>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6">
                    {mode ===
                    'preview' ? (
                      <img
    ref={imageRef}
    src={source}
    alt=""
    draggable="false"
    onContextMenu={preventImageContextMenu}
    onLoad={() =>
        setReady(true)
    }
    className="block max-h-full max-w-full select-none object-contain"
    style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
    }}
/>
                    ) : mode ===
                      'draw' ? (
                        <div className="relative mx-auto flex h-full w-full min-h-0 items-center justify-center">
                            {/*
                             * Hidden source image.
                             * It initializes the
                             * editable canvas.
                             */}
                          <img
    ref={imageRef}
    src={source}
    alt=""
    draggable="false"
    onContextMenu={preventImageContextMenu}
    className="pointer-events-none absolute h-px w-px select-none opacity-0"
    style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
    }}
    onLoad={prepareDrawCanvas}
/>

                            <canvas
                                ref={
                                    drawCanvasRef
                                }
                                onPointerDown={
                                    beginDrawing
                                }
                                onPointerMove={
                                    moveDrawing
                                }
                                onPointerUp={
                                    endDrawing
                                }
                                onPointerCancel={
                                    endDrawing
                                }
                                className="block max-h-full max-w-full touch-none object-contain"
                            />
                        </div>
                    ) : (
                        <div
                            dir="ltr"
                            className="mx-auto w-fit max-w-full select-none touch-none"
                        >
                            <div
                                ref={
                                    stageRef
                                }
                                data-crop-stage
                                className="relative"
                                onPointerDown={(
                                    event,
                                ) =>
                                    beginInteraction(
                                        event,
                                        'create',
                                    )
                                }
                                onPointerMove={
                                    moveInteraction
                                }
                                onPointerUp={
                                    endInteraction
                                }
                                onPointerCancel={
                                    endInteraction
                                }
                            >
                             <img
    ref={imageRef}
    src={source}
    alt=""
    draggable="false"
    onContextMenu={preventImageContextMenu}
    onLoad={() =>
        setReady(true)
    }
    className="block max-h-[68dvh] max-w-full select-none object-contain"
    style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
    }}
/>

                                <div className="pointer-events-none absolute inset-0 bg-black/60" />

                               <img
    src={source}
    alt=""
    draggable="false"
    onContextMenu={preventImageContextMenu}
    className="pointer-events-none absolute inset-0 h-full w-full select-none"
    style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        clipPath: `inset(${
                                            selection.y *
                                            100
                                        }% ${
                                            (1 -
                                                selection.x -
                                                selection.width) *
                                            100
                                        }% ${
                                            (1 -
                                                selection.y -
                                                selection.height) *
                                            100
                                        }% ${
                                            selection.x *
                                            100
                                        }%)`,
                                    }}
                                />

                                <div
                                    className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,.8)]"
                                    style={{
                                        left: `${
                                            selection.x *
                                            100
                                        }%`,

                                        top: `${
                                            selection.y *
                                            100
                                        }%`,

                                        width: `${
                                            selection.width *
                                            100
                                        }%`,

                                        height: `${
                                            selection.height *
                                            100
                                        }%`,
                                    }}
                                    onPointerDown={(
                                        event,
                                    ) =>
                                        beginInteraction(
                                            event,
                                            'move',
                                        )
                                    }
                                >
                                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                                        {Array.from(
                                            {
                                                length: 9,
                                            },
                                        ).map(
                                            (
                                                _,
                                                index,
                                            ) => (
                                                <span
                                                    key={
                                                        index
                                                    }
                                                    className={`${
                                                        index <
                                                        6
                                                            ? 'border-b'
                                                            : ''
                                                    } ${
                                                        index %
                                                            3 <
                                                        2
                                                            ? 'border-e'
                                                            : ''
                                                    } border-white/30`}
                                                />
                                            ),
                                        )}
                                    </div>

                                    {[
                                        [
                                            'nw',
                                            '-start-2 -top-2',
                                        ],
                                        [
                                            'n',
                                            'start-1/2 -top-2 -translate-x-1/2',
                                        ],
                                        [
                                            'ne',
                                            '-end-2 -top-2',
                                        ],
                                        [
                                            'e',
                                            '-end-2 top-1/2 -translate-y-1/2',
                                        ],
                                        [
                                            'se',
                                            '-bottom-2 -end-2',
                                        ],
                                        [
                                            's',
                                            '-bottom-2 start-1/2 -translate-x-1/2',
                                        ],
                                        [
                                            'sw',
                                            '-bottom-2 -start-2',
                                        ],
                                        [
                                            'w',
                                            '-start-2 top-1/2 -translate-y-1/2',
                                        ],
                                    ].map(
                                        ([
                                            handle,
                                            position,
                                        ]) => (
                                            <button
                                                key={
                                                    handle
                                                }
                                                type="button"
                                                aria-label={t(
                                                    'crop.resize',
                                                )}
                                                className={`absolute z-10 h-4 w-4 border border-white bg-slate-500 shadow ${position}`}
                                                onPointerDown={(
                                                    event,
                                                ) =>
                                                    beginInteraction(
                                                        event,
                                                        'resize',
                                                        handle,
                                                    )
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/*
                 * PREVIEW FOOTER
                 */}
                {mode ===
                'preview' ? (
                    <footer className="shrink-0 space-y-3 border-t border-white/10 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:space-y-4 sm:px-6 sm:py-5">
<div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
                                <button
                                type="button"
                                onClick={() => {
                                    if (
                                        workingSourceType ===
                                        'camera'
                                    ) {
                                        setRetaking(
                                            true,
                                        );

                                        return;
                                    }

                                    replacementInputRef.current?.click();
                                }}
className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-slate-700 px-3 text-sm font-bold hover:bg-white/10 sm:px-5 sm:text-base"                   >
                                <ChangePhotoIcon />

                                {t(
                                    workingSourceType ===
                                        'camera'
                                        ? 'crop.retake'
                                        : 'crop.choose_another',
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={openCrop}
                                disabled={
                                    !ready ||
                                    detectingEdges
                                }
className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-slate-700 px-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50 sm:px-5 sm:text-base"                  >
                                {detectingEdges ? (
                                    <span
                                        className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <CropIcon />
                                )}

                                {t(
                                    detectingEdges
                                        ? 'crop.detecting_edges'
                                        : 'crop.action',
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setDrawReady(
                                        false,
                                    );

                                    drawHistoryRef.current =
                                        [];

                                    setDrawHistoryCount(
                                        0,
                                    );

                                    setDrawColor('#ffffff');
setDrawSize(6);

                                    setMode(
                                        'draw',
                                    );
                                }}
                                disabled={
                                    !ready
                                }
className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-slate-700 px-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50 sm:px-5 sm:text-base"           >
                                <PencilIcon />

                                {t('crop.draw')}
                            </button>
      <button
    type="button"
    onClick={() => rotateImage(90)}
    disabled={saving || !ready}
    className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-slate-700 px-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50 sm:px-5 sm:text-base"
>
    <RotateIcon />

    {t('crop.rotate')}
</button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={
                                    confirmWholeImage
                                }
                                disabled={
                                    saving ||
                                    !ready
                                }
                                className="flex min-h-12 items-center gap-2 rounded-full bg-white px-7 font-black text-slate-950 hover:bg-slate-200 disabled:opacity-50"
                            >
                                <CheckIcon />

                                {saving
                                    ? t(
                                          'crop.saving',
                                      )
                                    : t(
                                          'crop.use_photo',
                                      )}
                            </button>
                        </div>

                        <input
                            ref={
                                replacementInputRef
                            }
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            className="sr-only"
                            onChange={(
                                event,
                            ) => {
                                const nextFile =
                                    event
                                        .target
                                        .files?.[0] ??
                                    null;

                                event.target.value =
                                    '';

                                replaceWorkingFile(
                                    nextFile,
                                    'gallery',
                                );
                            }}
                        />
                    </footer>
                ) : mode ===
                  'draw' ? (
                    /*
                     * DRAW FOOTER
                     */
<footer className="shrink-0 space-y-4 border-t border-white/10 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-5">

    <div className="flex flex-wrap items-center justify-center gap-5">

        {/* Pencil colors */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-300">
                Color
            </span>

            {[
                '#ffffff',
                '#000000',
                '#ef4444',
                '#3b82f6',
                '#22c55e',
                '#eab308',
            ].map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() =>
                        setDrawColor(color)
                    }
                    aria-label={`Choose ${color} drawing color`}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                        drawColor === color
                            ? 'scale-110 border-indigo-400 ring-2 ring-indigo-400/40'
                            : 'border-white/40 hover:scale-105'
                    }`}
                    style={{
                        backgroundColor: color,
                    }}
                />
            ))}
        </div>

        {/* Pencil size */}
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-300">
                Size
            </span>

            <span
                className="block rounded-full bg-white"
                style={{
                    width: `${Math.max(4, drawSize)}px`,
                    height: `${Math.max(4, drawSize)}px`,
                }}
            />

            <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={drawSize}
                onChange={(event) =>
                    setDrawSize(
                        Number(event.target.value),
                    )
                }
                aria-label="Pencil size"
                className="w-28 cursor-pointer accent-indigo-500 sm:w-40"
            />

            <span className="min-w-10 text-sm font-bold text-white">
                {drawSize}px
            </span>
        </div>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-3">                        <button
                            type="button"
                            onClick={
                                undoDrawing
                            }
                            disabled={
                                drawHistoryCount ===
                                0
                            }
                            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-700 px-5 font-bold hover:bg-white/10 disabled:opacity-40"
                        >
                            <UndoIcon />

                            Undo
                        </button>

                        <button
                            type="button"
                            onClick={
                                clearDrawing
                            }
                            disabled={
                                !drawReady
                            }
                            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-700 px-5 font-bold hover:bg-white/10 disabled:opacity-40"
                        >
                            <TrashIcon />

                            Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                drawHistoryRef.current =
                                    [];

                                setDrawHistoryCount(
                                    0,
                                );

                                setDrawReady(
                                    false,
                                );

                                setMode(
                                    'preview',
                                );
                            }}
                            className="min-h-12 rounded-full border border-slate-700 px-5 font-bold hover:bg-white/10"
                        >
                            {t(
                                'crop.cancel',
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={
                                confirmDrawing
                            }
                            disabled={
                                saving ||
                                !drawReady
                            }
                            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 font-black text-slate-950 hover:bg-slate-200 disabled:opacity-50"
                        >
                            <CheckIcon />

                            {saving
                                ? t(
                                      'crop.saving',
                                  )
                                : 'Done'}
                        </button>
                        </div>
                    </footer>
                ) : (
                    /*
                     * CROP FOOTER
                     */
                    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
                        <button
                            type="button"
                           onClick={() => {
    setSelection(FULL_IMAGE);
    setMode('preview');
}}
                            className="min-h-12 rounded-full border border-slate-700 px-6 font-bold hover:bg-white/10"
                        >
                            {t(
                                'crop.cancel',
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={
                                confirmCrop
                            }
                            disabled={
                                saving ||
                                !ready
                            }
                            className="min-h-12 rounded-full bg-white px-7 font-black text-slate-950 hover:bg-slate-200 disabled:bg-slate-600 disabled:text-slate-900"
                        >
                            {saving
                                ? t(
                                      'crop.saving',
                                  )
                                : t(
                                      'crop.confirm',
                                  )}
                        </button>
                    </footer>
                )}
            </section>
        </div>
    );

    return typeof document ===
        'undefined'
        ? null
        : createPortal(
              dialog,
              document.body,
          );
}

/*
 * -------------------------------------------------
 * Camera
 * -------------------------------------------------
 */

function CameraCaptureDialog({
    onCancel,
    onCapture,
}) {
    const { t } =
        useTranslation('common');

    const videoRef =
        useRef(null);

    const streamRef =
        useRef(null);

    const mountedRef =
        useRef(true);

    const capturingRef =
        useRef(false);

    const [status, setStatus] =
        useState('starting');

    useHardwareBack(onCancel);

    const stop = () => {
        const video =
            videoRef.current;

        const stream =
            streamRef.current;

        stream
            ?.getTracks()
            .forEach((track) =>
                track.stop(),
            );

        streamRef.current = null;

        if (video) {
            video.pause();
            video.srcObject = null;

            video.removeAttribute(
                'src',
            );
        }
    };

    useEffect(() => {
        let active = true;

        mountedRef.current = true;

        if (
            !navigator.mediaDevices
                ?.getUserMedia
        ) {
            setStatus('error');

            return undefined;
        }

        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: {
                        ideal: 'environment',
                    },

                    width: {
                        ideal: 1920,
                    },

                    height: {
                        ideal: 1440,
                    },
                },

                audio: false,
            })
            .then((stream) => {
                if (!active) {
                    stream
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop(),
                        );

                    return;
                }

                const video =
                    videoRef.current;

                if (!video) {
                    stream
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop(),
                        );

                    return;
                }

               streamRef.current = stream;
video.srcObject = stream;

const markReady = () => {
    if (
        !active ||
        !mountedRef.current ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
    ) {
        return;
    }

    setStatus('ready');
};

if (
    video.readyState >= HTMLMediaElement.HAVE_METADATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
) {
    markReady();
} else {
    video.addEventListener(
        'loadedmetadata',
        markReady,
        { once: true },
    );

    video.addEventListener(
        'canplay',
        markReady,
        { once: true },
    );
}
            })
            .catch(() => {
                if (active) {
                    setStatus(
                        'error',
                    );
                }
            });

        return () => {
            active = false;

            mountedRef.current =
                false;

            stop();
        };
    }, []);

    const capture = () => {
        const video =
            videoRef.current;

      if (
    capturingRef.current ||
    status !== 'ready' ||
    !video ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
) {
    return;
}

        capturingRef.current =
            true;

        setStatus('capturing');

        const scale = Math.min(
            1,
            MAX_IMAGE_DIMENSION /
                Math.max(
                    video.videoWidth,
                    video.videoHeight,
                ),
        );

        const canvas =
            document.createElement(
                'canvas',
            );

        canvas.width = Math.max(
            1,
            Math.round(
                video.videoWidth *
                    scale,
            ),
        );

        canvas.height = Math.max(
            1,
            Math.round(
                video.videoHeight *
                    scale,
            ),
        );

        canvas
            .getContext(
                '2d',
                {
                    alpha: false,
                },
            )
            .drawImage(
                video,
                0,
                0,
                video.videoWidth,
                video.videoHeight,
                0,
                0,
                canvas.width,
                canvas.height,
            );

        stop();

        canvasToBlob(
            canvas,
            'image/jpeg',
            JPEG_QUALITY,
        )
            .then((blob) => {
                if (
                    !mountedRef.current
                ) {
                    return;
                }

                if (!blob) {
                    setStatus(
                        'error',
                    );

                    return;
                }

                onCapture(
                    new File(
                        [blob],
                        `camera-${Date.now()}.jpg`,
                        {
                            type: 'image/jpeg',
                            lastModified:
                                Date.now(),
                        },
                    ),
                );
            })
            .catch(() => {
                if (
                    mountedRef.current
                ) {
                    setStatus(
                        'error',
                    );
                }
            });
    };

    const dialog = (
        <div
            className="fixed inset-0 z-[110] flex bg-black text-white"
            role="dialog"
            aria-modal="true"
        >
            <section className="mx-auto flex h-[100dvh] w-full max-w-4xl flex-col bg-black">
                <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-4">
                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        className="rounded-full border border-slate-700 px-4 py-2 font-bold"
                    >
                        {t(
                            'crop.cancel',
                        )}
                    </button>

                    <h2 className="text-lg font-black">
                        {t(
                            'crop.camera',
                        )}
                    </h2>

                    <span className="w-20" />
                </header>

                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                    <video
                        ref={
                            videoRef
                        }
                        autoPlay
                        playsInline
                        muted
                        className="max-h-full w-full object-contain"
                    />

                    {status !==
                        'ready' && (
                        <div className="absolute inset-0 grid place-items-center bg-black/80 px-6 text-center font-bold text-slate-200">
                            {status ===
                            'error'
                                ? t(
                                      'crop.camera_error',
                                  )
                                : t(
                                      'crop.camera_starting',
                                  )}
                        </div>
                    )}
                </div>

                <footer className="grid place-items-center border-t border-white/10 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={
                            capture
                        }
                        disabled={
                            status !==
                            'ready'
                        }
                        className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-white/25 disabled:opacity-40"
                        aria-label={t(
                            'crop.take_photo',
                        )}
                    >
                        <span className="h-11 w-11 rounded-full bg-white" />
                    </button>
                </footer>
            </section>
        </div>
    );

    return typeof document ===
        'undefined'
        ? null
        : createPortal(
              dialog,
              document.body,
          );
}

/*
 * -------------------------------------------------
 * Icons
 * -------------------------------------------------
 */
function RotateIcon() {
   return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 4v6h6" />
            <path d="M5.5 15a8 8 0 1 0 .5-7L4 10" />
        </svg>
    );
}

function ChangePhotoIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <circle
                cx="9"
                cy="10"
                r="1.5"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 17 4-4 3 3 2-2 5 3"
            />
        </svg>
    );
}

function RetakeIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 4v6h6" />
            <path d="M5.5 15a8 8 0 1 0 .5-7L4 10" />
        </svg>
    );
}

function CropIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M2 6h14a2 2 0 0 1 2 2v14" />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    );
}

function UndoIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 7 4 12l5 5" />
            <path d="M4 12h10a6 6 0 0 1 6 6" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}
