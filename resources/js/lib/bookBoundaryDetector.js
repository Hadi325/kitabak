const DETECTION_MAX_DIMENSION = 960;
const MIN_DOCUMENT_AREA_RATIO = 0.08;
const MAX_DOCUMENT_AREA_RATIO = 0.985;
const MIN_BOOK_PORTRAIT_RATIO = 1.2;
const MAX_BOOK_PORTRAIT_RATIO = 2.4;

let openCvPromise;

const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));

const resolveOpenCv = async () => {
    if (!openCvPromise) {
        openCvPromise = import('@techstark/opencv-js')
            .then(async (module) => {
                let cv = module.default ?? module;

                if (cv instanceof Promise) {
                    cv = await cv;
                } else if (!cv.Mat) {
                    await new Promise((resolve, reject) => {
                        const timeout = window.setTimeout(
                            () => reject(new Error('OpenCV initialization timed out.')),
                            15000,
                        );

                        cv.onRuntimeInitialized = () => {
                            window.clearTimeout(timeout);
                            resolve();
                        };
                    });
                }

                if (!cv?.Mat) {
                    throw new Error('OpenCV could not be initialized.');
                }

                return cv;
            })
            .catch((error) => {
                openCvPromise = null;
                throw error;
            });
    }

    return openCvPromise;
};

export const preloadBookBoundaryDetector = () => {
    void resolveOpenCv().catch(() => {
        // Detection remains optional; manual crop is always available.
    });
};

const pointsFromContour = (contour) => {
    const values = contour.data32S?.length
        ? contour.data32S
        : contour.data32F;

    if (!values?.length) {
        return [];
    }

    const points = [];

    for (let index = 0; index + 1 < values.length; index += 2) {
        points.push({
            x: Number(values[index]),
            y: Number(values[index + 1]),
        });
    }

    return points;
};

const polygonArea = (points) => {
    let area = 0;

    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        area += current.x * next.y - next.x * current.y;
    }

    return Math.abs(area) / 2;
};

const boundsFromPoints = (points) => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);

    return {
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
    };
};

const candidateScore = ({
    bounds,
    contourArea,
    quadrilateral,
    imageWidth,
    imageHeight,
    passWeight,
}) => {
    if (!bounds.width || !bounds.height) {
        return null;
    }

    const imageArea = imageWidth * imageHeight;
    const boundsArea = bounds.width * bounds.height;
    const boundsAreaRatio = boundsArea / imageArea;

    if (
        boundsAreaRatio < MIN_DOCUMENT_AREA_RATIO ||
        boundsAreaRatio > MAX_DOCUMENT_AREA_RATIO
    ) {
        return null;
    }

    const portraitRatio = bounds.height / bounds.width;

    if (
        bounds.width < imageWidth * 0.18 ||
        bounds.height < imageHeight * 0.18 ||
        portraitRatio < MIN_BOOK_PORTRAIT_RATIO ||
        portraitRatio > MAX_BOOK_PORTRAIT_RATIO
    ) {
        return null;
    }

    const fillsFrame =
        bounds.x <= 2 &&
        bounds.y <= 2 &&
        bounds.x + bounds.width >= imageWidth - 2 &&
        bounds.y + bounds.height >= imageHeight - 2;

    if (fillsFrame) {
        return null;
    }

    const shapeArea = quadrilateral
        ? polygonArea(quadrilateral)
        : contourArea;
    const rectangularity = clamp(shapeArea / boundsArea, 0, 1);

    if (!quadrilateral && rectangularity < 0.42) {
        return null;
    }

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const centerDistance = Math.hypot(
        (centerX - imageWidth / 2) / (imageWidth / 2),
        (centerY - imageHeight / 2) / (imageHeight / 2),
    );
    const centeredness = 1 - clamp(centerDistance / Math.SQRT2, 0, 1);

    // Keep detection sensitive for books that nearly fill the photo, even
    // when a cover edge is close to the image boundary. Small off-centre
    // rectangles are much more likely to be windows, furniture, or signs.
    if (boundsAreaRatio < 0.16 && centeredness < 0.58) {
        return null;
    }

    const bookShapeConfidence = Math.exp(
        -Math.abs(Math.log(portraitRatio / 1.42)),
    );

    // Once a candidate covers roughly half the photo, making it larger should
    // not automatically make it better. This prevents a desk, scanner tray,
    // or transparent book stand from outranking the tighter book boundary.
    const usefulArea = Math.min(boundsAreaRatio, 0.5);

    return (
        usefulArea * 2.1 +
        rectangularity * 2.7 +
        centeredness * 1.4 +
        bookShapeConfidence +
        (quadrilateral ? 1.8 : 0) +
        passWeight * 0.2
    );
};

const inspectContours = (
    cv,
    mask,
    imageWidth,
    imageHeight,
    passWeight,
    currentBest,
) => {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    let best = currentBest;

    try {
        cv.findContours(
            mask,
            contours,
            hierarchy,
            cv.RETR_LIST,
            cv.CHAIN_APPROX_SIMPLE,
        );

        for (let index = 0; index < contours.size(); index += 1) {
            const contour = contours.get(index);
            const approximation = new cv.Mat();

            try {
                const area = Math.abs(cv.contourArea(contour));

                if (area < imageWidth * imageHeight * 0.04) {
                    continue;
                }

                const perimeter = cv.arcLength(contour, true);
                let quadrilateral = null;

                for (const epsilon of [0.015, 0.025, 0.035, 0.05]) {
                    cv.approxPolyDP(
                        contour,
                        approximation,
                        perimeter * epsilon,
                        true,
                    );

                    if (
                        approximation.rows === 4 &&
                        cv.isContourConvex(approximation)
                    ) {
                        quadrilateral = pointsFromContour(approximation);
                        break;
                    }
                }

                const bounds = quadrilateral?.length === 4
                    ? boundsFromPoints(quadrilateral)
                    : cv.boundingRect(contour);
                const score = candidateScore({
                    bounds,
                    contourArea: area,
                    quadrilateral,
                    imageWidth,
                    imageHeight,
                    passWeight,
                });

                if (score !== null && (!best || score > best.score)) {
                    best = {
                        score,
                        bounds,
                    };
                }
            } finally {
                approximation.delete();
                contour.delete();
            }
        }
    } finally {
        hierarchy.delete();
        contours.delete();
    }

    return best;
};

const normalizeBounds = (bounds, imageWidth, imageHeight) => {
    const horizontalPadding = imageWidth * 0.012;
    const verticalPadding = imageHeight * 0.012;
    const left = clamp(bounds.x - horizontalPadding, 0, imageWidth);
    const top = clamp(bounds.y - verticalPadding, 0, imageHeight);
    const right = clamp(
        bounds.x + bounds.width + horizontalPadding,
        left,
        imageWidth,
    );
    const bottom = clamp(
        bounds.y + bounds.height + verticalPadding,
        top,
        imageHeight,
    );

    return {
        x: left / imageWidth,
        y: top / imageHeight,
        width: (right - left) / imageWidth,
        height: (bottom - top) / imageHeight,
    };
};

const median = (values) => {
    if (!values.length) {
        return 0;
    }

    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
};

const bookAspectDistance = (width, height) => {
    const portraitRatio = height / Math.max(1, width);

    return Math.abs(Math.log(portraitRatio / 1.42));
};

const refineBookBottomEdge = (grayscale, bounds) => {
    // This pass targets portrait covers. A transparent stand or desk can form
    // a larger outer rectangle even though the real cover has a clear lower
    // color transition inside it.
    if (bounds.height < bounds.width * 1.52) {
        return bounds;
    }

    const width = grayscale.cols;
    const height = grayscale.rows;
    const pixels = grayscale.data;
    const left = clamp(
        Math.round(bounds.x + bounds.width * 0.08),
        1,
        width - 2,
    );
    const right = clamp(
        Math.round(bounds.x + bounds.width * 0.92),
        left + 1,
        width - 2,
    );
    const searchStart = clamp(
        Math.round(bounds.y + bounds.height * 0.68),
        2,
        height - 3,
    );
    const searchEnd = clamp(
        Math.round(bounds.y + bounds.height * 0.93),
        searchStart + 1,
        height - 3,
    );
    const slantRadius = clamp(
        Math.round(bounds.height * 0.016),
        2,
        8,
    );
    const rowScores = [];

    for (let y = searchStart; y <= searchEnd; y += 1) {
        let score = 0;

        for (let x = left; x <= right; x += 1) {
            let strongestDifference = 0;

            // Use a small vertical window so a slightly angled book edge is
            // still treated as one continuous boundary.
            for (let offset = -slantRadius; offset <= slantRadius; offset += 1) {
                const sampleY = clamp(y + offset, 1, height - 2);
                const difference = Math.abs(
                    pixels[(sampleY + 1) * width + x] -
                        pixels[(sampleY - 1) * width + x],
                );

                strongestDifference = Math.max(
                    strongestDifference,
                    difference,
                );
            }

            score += strongestDifference;
        }

        rowScores.push({
            y,
            score: score / (right - left + 1),
        });
    }

    const typicalScore = median(rowScores.map(({ score }) => score));
    const strongestRow = rowScores.reduce(
        (best, current) =>
            !best || current.score > best.score ? current : best,
        null,
    );

    if (
        !strongestRow ||
        strongestRow.score < Math.max(12, typicalScore * 1.55)
    ) {
        return bounds;
    }

    const edgePadding = Math.max(2, Math.round(bounds.height * 0.012));
    const refinedBottom = Math.min(
        bounds.y + bounds.height,
        strongestRow.y + slantRadius + edgePadding,
    );
    const refinedHeight = refinedBottom - bounds.y;
    const retainedHeight = refinedHeight / bounds.height;
    const refinedPortraitRatio = refinedHeight / bounds.width;

    // A strong line inside a window or another rectangular object can look
    // like a lower cover edge. Never let that refinement turn an initially
    // portrait candidate into a square or landscape crop.
    if (
        refinedPortraitRatio < MIN_BOOK_PORTRAIT_RATIO ||
        refinedPortraitRatio > MAX_BOOK_PORTRAIT_RATIO
    ) {
        return bounds;
    }

    if (retainedHeight < 0.58 || retainedHeight > 0.94) {
        return bounds;
    }

    const originalAspectDistance = bookAspectDistance(
        bounds.width,
        bounds.height,
    );
    const refinedAspectDistance = bookAspectDistance(
        bounds.width,
        refinedHeight,
    );

    if (refinedAspectDistance > originalAspectDistance - 0.06) {
        return bounds;
    }

    return {
        ...bounds,
        height: refinedHeight,
    };
};

export const detectBookBounds = async (image) => {
    if (!image?.naturalWidth || !image.naturalHeight) {
        return null;
    }

    const cv = await resolveOpenCv();
    const scale = Math.min(
        1,
        DETECTION_MAX_DIMENSION /
            Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: true,
    });

    if (!context) {
        return null;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const source = cv.matFromImageData(
        context.getImageData(0, 0, canvas.width, canvas.height),
    );
    const grayscale = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const processed = new cv.Mat();
    const thresholded = new cv.Mat();
    const inverted = new cv.Mat();
    const adaptive = new cv.Mat();
    const rgb = new cv.Mat();
    const hsv = new cv.Mat();
    const hsvChannels = new cv.MatVector();
    let saturation = null;
    const kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(3, 3),
    );
    let best = null;

    try {
        cv.cvtColor(source, grayscale, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(source, rgb, cv.COLOR_RGBA2RGB);
        cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
        cv.split(hsv, hsvChannels);
        saturation = hsvChannels.get(1);
        cv.GaussianBlur(
            grayscale,
            blurred,
            new cv.Size(5, 5),
            0,
            0,
            cv.BORDER_DEFAULT,
        );

        for (const [low, high, weight] of [
            [18, 60, 0.1],
            [30, 90, 0.15],
            [55, 165, 0.2],
            [85, 230, 0.15],
        ]) {
            cv.Canny(blurred, edges, low, high, 3, true);
            cv.morphologyEx(
                edges,
                processed,
                cv.MORPH_CLOSE,
                kernel,
                new cv.Point(-1, -1),
                2,
            );
            cv.dilate(
                processed,
                processed,
                kernel,
                new cv.Point(-1, -1),
                1,
            );

            best = inspectContours(
                cv,
                processed,
                canvas.width,
                canvas.height,
                weight,
                best,
            );
        }

        cv.threshold(
            blurred,
            thresholded,
            0,
            255,
            cv.THRESH_BINARY + cv.THRESH_OTSU,
        );
        cv.morphologyEx(
            thresholded,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            2,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.1,
            best,
        );

        cv.bitwise_not(thresholded, inverted);
        cv.morphologyEx(
            inverted,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            2,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.1,
            best,
        );

        // Colour often separates a printed cover from a neutral desk, clear
        // holder, or scanner bed even when their grayscale edges overlap.
        cv.threshold(
            saturation,
            thresholded,
            30,
            255,
            cv.THRESH_BINARY,
        );
        cv.morphologyEx(
            thresholded,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            3,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.35,
            best,
        );

        cv.bitwise_not(thresholded, inverted);
        cv.morphologyEx(
            inverted,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            2,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.2,
            best,
        );

        cv.adaptiveThreshold(
            blurred,
            adaptive,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            31,
            7,
        );
        cv.morphologyEx(
            adaptive,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            1,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.05,
            best,
        );

        cv.bitwise_not(adaptive, inverted);
        cv.morphologyEx(
            inverted,
            processed,
            cv.MORPH_CLOSE,
            kernel,
            new cv.Point(-1, -1),
            1,
        );
        best = inspectContours(
            cv,
            processed,
            canvas.width,
            canvas.height,
            0.05,
            best,
        );

        const refinedBounds = best
            ? refineBookBottomEdge(grayscale, best.bounds)
            : null;

        return refinedBounds
            ? normalizeBounds(
                  refinedBounds,
                  canvas.width,
                  canvas.height,
              )
            : null;
    } finally {
        kernel.delete();
        saturation?.delete();
        hsvChannels.delete();
        hsv.delete();
        rgb.delete();
        adaptive.delete();
        inverted.delete();
        thresholded.delete();
        processed.delete();
        edges.delete();
        blurred.delete();
        grayscale.delete();
        source.delete();

        canvas.width = 1;
        canvas.height = 1;
    }
};
