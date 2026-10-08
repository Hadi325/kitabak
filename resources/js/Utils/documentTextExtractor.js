import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PDF_PAGES = 10;

const canvasToFile = (canvas, name) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(new File([blob], name, { type: 'image/jpeg' })) : reject(new Error('empty_document')), 'image/jpeg', 0.84);
});

const renderPdfPages = async (file, onProgress) => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    if (pdf.numPages > MAX_PDF_PAGES) throw new Error('pdf_page_limit');
    const images = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        onProgress?.({ stage: 'pdf', current: pageNumber, total: pdf.numPages });
        const page = await pdf.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2.2, 1800 / Math.max(base.width, base.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;
        images.push(await canvasToFile(canvas, `school-list-page-${pageNumber}.jpg`));
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
    }
    await pdf.destroy();
    return { images, text: '' };
};

export async function prepareDocumentForAi(file, onProgress) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (file.size > MAX_FILE_SIZE) throw new Error('file_too_large');
    if (file.type === 'application/pdf' || extension === 'pdf') return renderPdfPages(file, onProgress);
    if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onProgress?.({ stage: 'docx', progress: 0.25 });
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default ?? mammothModule;
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        if (!result.value.trim()) throw new Error('empty_document');
        return { images: [], text: result.value };
    }
    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return { images: [file], text: '' };
    if (file.type === 'text/plain' || extension === 'txt') {
        const text = await file.text();
        if (!text.trim()) throw new Error('empty_document');
        return { images: [], text };
    }
    throw new Error('unsupported_file');
}
