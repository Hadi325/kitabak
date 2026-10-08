import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prepareDocumentForAi } from '@/Utils/documentTextExtractor';
import BookCoverImage from '@/Components/BookCoverImage';
import { useImageCropper } from '@/Components/ImageCropDialog';

const statusStyles = {
    available: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    possible: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    unavailable: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
    not_found: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function Create() {
    const { t } = useTranslation('bookLists');
    const { cropImage, cropDialog } = useImageCropper();
    const inputRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const cameraSessionRef = useRef(0);
    const [file, setFile] = useState(null);
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [state, setState] = useState('idle');
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState({});
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraState, setCameraState] = useState('idle');
    const [cameraError, setCameraError] = useState(null);
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    const visibleItems = useMemo(() => result?.items?.filter((item) => filter === 'all' || item.status === filter) ?? [], [result, filter]);
    const selectedListings = useMemo(() => Object.values(selected), [selected]);
    const totalPrice = selectedListings.reduce((sum, option) => sum + Number(option.price || 0), 0);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    const closeCamera = useCallback(() => {
        cameraSessionRef.current += 1;
        stopCamera();
        setCameraOpen(false);
        setCameraState('idle');
        setCameraError(null);
        setCapturedPhoto(null);
    }, [stopCamera]);

    useEffect(() => () => stopCamera(), [stopCamera]);

    useEffect(() => {
        if (!cameraOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [cameraOpen]);

    const chooseFile = async (chosen, shouldCrop = true) => {
        if (!chosen) return;
        const nextFile = shouldCrop && chosen.type?.startsWith('image/')
            ? await cropImage(chosen)
            : chosen;
        if (!nextFile) return;
        setFile(nextFile);
        setText('');
        setResult(null);
        setSelected({});
        setError(null);
        setState('idle');
    };

    const openCamera = async () => {
        const session = cameraSessionRef.current + 1;
        cameraSessionRef.current = session;
        stopCamera();
        setCameraOpen(true);
        setCameraState('starting');
        setCameraError(null);
        setCapturedPhoto(null);

        try {
            if (!window.isSecureContext) throw new Error('secure_context');
            if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            if (cameraSessionRef.current !== session) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;
            await new Promise((resolve) => requestAnimationFrame(resolve));
            if (!videoRef.current) throw new Error('unavailable');
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraState('ready');
        } catch (caught) {
            stopCamera();
            const key = caught?.message === 'secure_context'
                ? 'secure_context'
                : caught?.name === 'NotAllowedError'
                    ? 'permission_denied'
                    : caught?.message === 'unavailable'
                        ? 'unavailable'
                        : 'error';
            setCameraError(t(`camera.${key}`));
            setCameraState('error');
        }
    };

    const capturePhoto = async () => {
        const video = videoRef.current;
        if (!video?.videoWidth || !video?.videoHeight) return;
        setCameraState('capturing');

        try {
            const maxDimension = 2400;
            const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            canvas.getContext('2d', { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('capture_failed')), 'image/jpeg', 0.92));
            const capturedFile = new File([blob], `school-list-${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            setCapturedPhoto(capturedFile);
            setCameraState('review');
        } catch {
            setCameraError(t('camera.capture_error'));
            setCameraState('ready');
        }
    };

    const analyze = async () => {
        if (!file) return;
        setState('extracting');
        setError(null);
        setProgress({ stage: 'preparing', progress: 0 });

        try {
            const document = await prepareDocumentForAi(file, setProgress);
            setState('matching');
            const payload = new FormData();
            payload.append('file_name', file.name);
            if (document.text) payload.append('text', document.text);
            document.images.forEach((image) => payload.append('images[]', image));
            const response = await axios.post(route('book-lists.analyze'), payload);
            setText(response.data.extracted_text || document.text || '');
            setResult(response.data);
            setState('complete');
        } catch (caught) {
            if (caught?.response?.data?.message) {
                setError(caught.response.data.message);
                setState('error');
                return;
            }
            const key = caught?.message || (caught?.response ? 'server_error' : 'unknown_error');
            setError(t(`errors.${key}`, { defaultValue: t('errors.unknown_error') }));
            setState('error');
        }
    };

    const rerun = async () => {
        if (!text.trim()) return;
        setState('matching');
        setError(null);
        try {
            const response = await axios.post(route('book-lists.analyze'), { text, file_name: file?.name });
            setText(response.data.extracted_text || text);
            setResult(response.data);
            setSelected({});
            setState('complete');
        } catch {
            setError(t('errors.server_error'));
            setState('error');
        }
    };

    const selectListing = (item, match, listing) => {
        setSelected((current) => ({
            ...current,
            [item.id]: { ...listing, itemId: item.id, requestedTitle: item.title, bookId: match.id, bookTitle: match.title },
        }));
    };

    return (
        <AuthenticatedLayout>
            {cropDialog}
            <Head title={t('title')} />
            <main className="page-shell max-w-7xl">
               <section
    className="
        relative overflow-hidden rounded-3xl
        border border-indigo-200
        bg-gradient-to-br from-white via-indigo-50 to-violet-100
        px-5 py-10 text-slate-900
        shadow-xl shadow-indigo-200/60
        dark:border-indigo-500/20
        dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950
        dark:text-white dark:shadow-black/30
        sm:px-10 lg:px-14
    "
>
    <div
        className="
            pointer-events-none absolute -end-24 -top-28
            h-72 w-72 rounded-full
            bg-violet-300/30 blur-3xl
            dark:bg-indigo-500/15
        "
    />

    <div
        className="
            pointer-events-none absolute -bottom-32 start-20
            h-64 w-64 rounded-full
            bg-indigo-300/20 blur-3xl
            dark:bg-violet-500/10
        "
    />

    <div className="relative max-w-4xl">
        <span
            className="
                inline-flex rounded-full
                border border-indigo-200
                bg-white/70 px-4 py-1.5
                text-xs font-extrabold uppercase tracking-[.18em]
                text-indigo-700 shadow-sm
                dark:border-white/20 dark:bg-white/10
                dark:text-indigo-200
            "
        >
            {t('eyebrow')}
        </span>

        <h1
            className="
                mt-6 text-3xl font-black tracking-tight
                text-slate-950
                dark:text-white
                sm:text-4xl lg:text-5xl
            "
        >
            {t('title')}
        </h1>

        <p
            className="
                mt-5 max-w-4xl
                text-base leading-7
                text-slate-600
                dark:text-slate-300
                sm:text-lg
            "
        >
            {t('description')}
        </p>
    </div>
</section>

                {!result && (
                    <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }} className="group grid min-h-64 w-full place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/5">
                            <span>
                                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"><UploadIcon /></span>
                                <span className="mt-5 block text-lg font-extrabold text-slate-900 dark:text-white">{file ? file.name : t('upload.title')}</span>
                                <span className="mt-2 block text-sm leading-6 text-slate-500 dark:text-slate-400">{file ? t('upload.change') : t('upload.help')}</span>
                                <span className="mt-4 inline-flex rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">PDF · DOCX · JPG · PNG · WEBP · TXT</span>
                            </span>
                        </button>
                        <input ref={inputRef} type="file" className="sr-only" accept=".pdf,.docx,.txt,image/jpeg,image/png,image/webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ''; chooseFile(selected); }} />

                        <div className="mt-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                            <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{t('camera.or')}</span>
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <button type="button" onClick={openCamera} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-5 text-sm font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20">
                            <CameraIcon />
                            {t('camera.action')}
                        </button>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t('upload.privacy')}</p>
                            <button type="button" disabled={!file || ['extracting', 'matching'].includes(state)} onClick={analyze} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                                {['extracting', 'matching'].includes(state) && <Spinner />}
                                {state === 'extracting' ? t('processing.extracting') : state === 'matching' ? t('processing.matching') : t('upload.action')}
                            </button>
                        </div>

                        {progress && state === 'extracting' && <Progress progress={progress} t={t} />}
                        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
                    </section>
                )}

                {result && (
                    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                        <section className="min-w-0 space-y-5">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                <SummaryCard label={t('summary.total')} value={result.summary.total} tone="slate" />
                                <SummaryCard label={t('summary.available')} value={result.summary.available} tone="emerald" />
                                <SummaryCard label={t('summary.possible')} value={result.summary.possible} tone="amber" />
                                <SummaryCard label={t('summary.unavailable')} value={result.summary.unavailable} tone="rose" />
                                <SummaryCard label={t('summary.not_found')} value={result.summary.not_found} tone="slate" />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['all', 'available', 'possible', 'unavailable', 'not_found'].map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${filter === value ? 'bg-slate-950 text-white dark:bg-indigo-600' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>{t(`filters.${value}`)}</button>)}
                                </div>
                            </div>

                            {visibleItems.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">{t('results.empty_filter')}</div>}
                            {visibleItems.map((item, index) => <ResultItem key={item.id} item={item} index={index} selected={selected[item.id]} onSelect={selectListing} t={t} />)}

                            <details className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                <summary className="cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-100">{t('review.title')}</summary>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('review.help')}</p>
                                <textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-4 min-h-64 w-full rounded-xl border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950" />
                                <button type="button" onClick={rerun} className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-indigo-600">{t('review.rerun')}</button>
                            </details>
                        </section>

                        <aside className="space-y-4 xl:sticky xl:top-24">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{t('selection.eyebrow')}</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{t('selection.title')}</h2>
                                <div className="mt-5 space-y-3">
                                    {selectedListings.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:bg-slate-950 dark:text-slate-400">{t('selection.empty')}</p> : selectedListings.map((option) => <div key={option.itemId} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="truncate text-sm font-bold">{option.bookTitle}</p><div className="mt-1 flex justify-between text-xs text-slate-500"><span>{option.seller || t('selection.seller')}</span><span className="font-bold text-emerald-600">${Number(option.price).toFixed(2)}</span></div></div>)}
                                </div>
                                <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-4 dark:border-slate-800"><span className="text-sm text-slate-500">{t('selection.total')}</span><strong className="text-2xl text-slate-950 dark:text-white">${totalPrice.toFixed(2)}</strong></div>
                                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('selection.notice')}</p>
                            </section>
                            <button type="button" onClick={() => { setResult(null); setFile(null); setText(''); setSelected({}); setProgress(null); }} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{t('new_analysis')}</button>
                        </aside>
                    </div>
                )}
            </main>

            {cameraOpen && (
                <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="school-list-camera-title" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCamera(); }}>
                    <section className="my-auto flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
                        <header className="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-slate-950/95 p-4 backdrop-blur sm:p-6">
                            <div>
                                <h2 id="school-list-camera-title" className="text-lg font-black sm:text-xl">{cameraState === 'review' ? t('camera.crop_title') : t('camera.title')}</h2>
                                <p className="mt-1 hidden text-sm leading-6 text-slate-400 sm:block">{cameraState === 'review' ? t('camera.crop_description') : t('camera.description')}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {cameraState !== 'review' && <button type="button" disabled={cameraState !== 'ready'} onClick={capturePhoto} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"><CameraIcon /><span>{cameraState === 'capturing' ? t('camera.capturing') : t('camera.capture')}</span></button>}
                                <button type="button" onClick={closeCamera} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold transition hover:bg-slate-800" aria-label={t('camera.close')}>{t('camera.close')}</button>
                            </div>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
                            {cameraState === 'review' && capturedPhoto ? <PhotoCropper file={capturedPhoto} onUse={(cropped) => { chooseFile(cropped, false); closeCamera(); }} t={t} /> : <div className="relative flex max-h-[70dvh] min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-black"><video ref={videoRef} autoPlay playsInline muted className="max-h-[70dvh] w-full object-contain" />{cameraState === 'starting' && <div className="absolute inset-0 grid place-items-center bg-slate-950/80"><span className="inline-flex items-center gap-3 text-sm font-bold text-slate-200"><Spinner />{t('camera.starting')}</span></div>}</div>}
                            {cameraError && <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">{cameraError}</p>}
                        </div>
                    </section>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function ResultItem({ item, index, selected, onSelect, t }) {
    return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.subject || t('results.unknown_subject')} · {item.grade || t('results.unknown_grade')}</p><h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white"><span className="me-2 text-slate-400">{index + 1}.</span>{item.title}</h2><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.raw}</p></div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[item.status]}`}>{t(`status.${item.status}`)}</span>
        </div>
        {item.matches.length === 0 ? <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400"><strong className="block text-slate-800 dark:text-slate-200">{t('reasons.no_catalog_match_title')}</strong><span className="mt-1 block">{t('reasons.no_catalog_match')}</span></div> : <div className="mt-5 space-y-3">{item.matches.map((match) => <div key={match.id} className={`rounded-xl border p-4 transition ${selected?.bookId === match.id ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/10 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex gap-3"><div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"><BookCoverImage src={match.cover_image_url} alt="" className="h-full w-full object-cover" fallback={<span className="grid h-full place-items-center text-slate-400"><BookIcon /></span>} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-extrabold text-slate-900 dark:text-white">{match.title}</h3><p className="mt-1 text-xs text-slate-500">{[match.author, match.publisher, match.edition_year].filter(Boolean).join(' · ')}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{Math.round(match.score * 100)}% {t('results.match')}</span></div><p className="mt-2 text-xs font-semibold text-slate-500">{match.available_count > 0 ? t('results.options', { count: match.available_count }) : t('reasons.no_available_copy')}</p></div></div>
            {match.listings.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{match.listings.map((listing) => <button type="button" key={listing.id} onClick={() => onSelect(item, match, listing)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-start text-xs transition ${selected?.id === listing.id ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-400 dark:border-slate-700'}`}><span><strong className="block">{listing.seller || t('selection.seller')}</strong><span className={selected?.id === listing.id ? 'text-indigo-100' : 'text-slate-500'}>{listing.location || t('results.location_unknown')}</span></span><strong className="text-sm">${Number(listing.price).toFixed(2)}</strong></button>)}</div>}
        </div>)}</div>}
    </article>;
}

function SummaryCard({ label, value, tone }) { const tones = { emerald: 'text-emerald-600 dark:text-emerald-400', amber: 'text-amber-600 dark:text-amber-400', rose: 'text-rose-600 dark:text-rose-400', slate: 'text-slate-950 dark:text-white' }; return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><strong className={`block text-2xl font-black ${tones[tone]}`}>{value}</strong><span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span></div>; }
function Progress({ progress, t }) { return <div className="mt-5 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10"><div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300"><span>{t(`processing.${progress.stage}`, { current: progress.current, total: progress.total })}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" /></div></div>; }
function PhotoCropper({ file, onUse, t }) {
    const imageRef = useRef(null);
    const dragRef = useRef(null);
    const [source, setSource] = useState('');
    const [selection, setSelection] = useState({ x: 0.04, y: 0.04, width: 0.92, height: 0.92 });
    const [working, setWorking] = useState(false);
    const [cropError, setCropError] = useState('');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setSource(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const point = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        return {
            x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
            y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
        };
    };

    const startCrop = (event) => {
        const start = point(event);
        dragRef.current = start;
        event.currentTarget.setPointerCapture(event.pointerId);
        setSelection({ x: start.x, y: start.y, width: 0, height: 0 });
    };

    const updateCrop = (event) => {
        if (!dragRef.current) return;
        const current = point(event);
        const start = dragRef.current;
        setSelection({ x: Math.min(start.x, current.x), y: Math.min(start.y, current.y), width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y) });
    };

    const finishCrop = () => {
        dragRef.current = null;
        setSelection((current) => current.width < 0.03 || current.height < 0.03 ? { x: 0.04, y: 0.04, width: 0.92, height: 0.92 } : current);
    };

    const cropAndUse = async () => {
        const image = imageRef.current;
        if (!image?.naturalWidth || selection.width <= 0 || selection.height <= 0) return;
        setWorking(true);
        setCropError('');
        try {
            const sourceX = Math.round(selection.x * image.naturalWidth);
            const sourceY = Math.round(selection.y * image.naturalHeight);
            const sourceWidth = Math.max(1, Math.round(selection.width * image.naturalWidth));
            const sourceHeight = Math.max(1, Math.round(selection.height * image.naturalHeight));
            const scale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));
            canvas.getContext('2d', { alpha: false }).drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('crop_failed')), 'image/jpeg', 0.9));
            onUse(new File([blob], `school-list-cropped-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        } catch {
            setCropError(t('camera.crop_error'));
        } finally {
            setWorking(false);
        }
    };

    return <div>
        <div className="sticky top-0 z-20 -mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur">
            <p className="text-xs leading-5 text-slate-300 sm:text-sm">{t('camera.crop_help')}</p>
            <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => onUse(file)} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-bold transition hover:bg-slate-800 sm:text-sm">{t('camera.use_full')}</button>
                <button type="button" disabled={working} onClick={cropAndUse} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold transition hover:bg-indigo-500 disabled:opacity-50 sm:px-4 sm:text-sm"><CropIcon />{working ? t('camera.cropping') : t('camera.crop_use')}</button>
            </div>
        </div>
        <div className="flex justify-center overflow-hidden rounded-2xl bg-black p-1">
            <div className="relative inline-block max-w-full touch-none cursor-crosshair select-none" onPointerDown={startCrop} onPointerMove={updateCrop} onPointerUp={finishCrop} onPointerCancel={finishCrop}>
                <img ref={imageRef} src={source} alt={t('camera.crop_preview')} draggable="false" className="block max-h-[62dvh] max-w-full object-contain" />
                <div className="pointer-events-none absolute border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(2,6,23,.65)]" style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%`, width: `${selection.width * 100}%`, height: `${selection.height * 100}%` }}><span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" /><span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" /></div>
            </div>
        </div>
        {cropError && <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">{cropError}</p>}
    </div>;
}
function Spinner() { return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" /><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>; }
function UploadIcon() { return <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" /></svg>; }
function CameraIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3a1 1 0 011 1v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5a1 1 0 011-1z" /><circle cx="12" cy="13" r="3.5" /></svg>; }
function CropIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3v14a2 2 0 002 2h12M3 7h14a2 2 0 012 2v12" /></svg>; }
function BookIcon() { return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 4.5A2.5 2.5 0 017.5 2H19v17H7.5A2.5 2.5 0 005 21.5v-17zM5 19h14" /></svg>; }
