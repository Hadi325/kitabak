import BookCoverImage, { resolveBookImageUrl } from '@/Components/BookCoverImage';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import EmptyState from '@/Components/EmptyState';
import AdminTabs from '@/Components/AdminTabs';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'SE', 'SV', 'SG', 'LH'];
const gradeLabels = { '9': 'Brevet', '10': 'Second', '11': 'Bac1' };
const gradeLabel = (grade) => gradeLabels[grade] ?? grade;
const coverUrl = (book) => resolveBookImageUrl(book.cover_image_url || book.images?.[0]?.image_path);

const SearchIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
const BookIcon = () => <svg className="h-9 w-9 sm:h-12 sm:w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
const EditIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></svg>;
const DeleteIcon = () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>;

function BookCard({ book, currentUserId, deletingId, isAdmin, onDelete, shelf = false, t }) {
    const owned = book.created_by === currentUserId;
    const cover = coverUrl(book);
    const available = book.listings?.filter((listing) => listing.status === 'available').length ?? 0;

    return (
        <article className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50 ${shelf ? 'w-[9.5rem] flex-none snap-start sm:w-[13rem] lg:w-[14rem]' : ''}`}>
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-950">
                {cover ? <BookCoverImage src={cover} alt={t('books.cover_alt', { title: book.title })} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center text-center text-indigo-300 dark:text-indigo-500"><div><BookIcon /><span className="mt-1 block text-[10px] font-bold sm:text-xs">{t('books.no_cover')}</span></div></div>}
                {owned && <span className="absolute start-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[9px] font-bold text-white backdrop-blur sm:text-xs">{t('books.owned')}</span>}
            </div>
            <div className="flex flex-1 flex-col p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 sm:text-xs"><span className="truncate">{book.subject || '—'}</span>{book.grade && <><span className="text-slate-300 dark:text-slate-700">•</span><span>{gradeLabel(book.grade)}</span></>}</div>
                <h2 className="mt-1.5 line-clamp-2 min-h-9 text-sm font-extrabold leading-[1.15rem] text-slate-950 dark:text-white sm:min-h-11 sm:text-base sm:leading-[1.35rem]">{book.title}</h2>
                {(book.book_type || book.part) && <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 sm:text-xs">{[book.book_type ? t(`book_metadata.${book.book_type}`) : null, book.part ? t('book_metadata.part_value', { part: book.part }) : null].filter(Boolean).join(' · ')}</p>}
                <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{book.author ? t('books.by', { author: book.author }) : t('books.unknown_author')}</p>
                <div className="mt-2 hidden space-y-1 text-xs text-slate-500 dark:text-slate-400 sm:block"><p className="truncate">{book.publisher || t('books.unknown_publisher')}</p>{book.edition_year && <p>{t('books.edition', { year: book.edition_year })}</p>}</div>
                <div className="mt-auto flex items-center justify-between gap-1 border-t border-slate-100 pt-2 dark:border-slate-800 sm:pt-3">
                    <span className={`truncate text-[9px] font-bold sm:text-xs ${available ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{available ? t('books.available', { count: available }) : t('books.no_listings')}</span>
                    {isAdmin && <div className="flex shrink-0 gap-0.5"><Link href={route('books.edit', book.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800 dark:hover:text-indigo-300" title={t('actions.edit')}><EditIcon /></Link><button type="button" onClick={() => onDelete(book)} disabled={deletingId === book.id} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title={t('actions.delete')}><DeleteIcon /></button></div>}
                </div>
            </div>
        </article>
    );
}

export default function Books({ books = [] }) {
    const { t, i18n } = useTranslation('common');
    const { t: tAdmin } = useTranslation('admin');
    const page = usePage();
    const currentUserId = page.props.auth?.user?.id;
    const isAdmin = page.props.auth?.user?.roles?.includes('admin');
    const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('search') ?? '');
    const [grade, setGrade] = useState('');
    const [gradeMenuOpen, setGradeMenuOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [visibleByGrade, setVisibleByGrade] = useState({});
    const gradeMenuRef = useRef(null);
    const user = usePage().props.auth?.user;

    useEffect(() => {
        const closeMenu = (event) => {
            if (!gradeMenuRef.current?.contains(event.target)) setGradeMenuOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setGradeMenuOpen(false);
        };
        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    const filteredBooks = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase(i18n.language);
        return books.filter((book) => {
            if (grade && String(book.grade) !== grade) return false;
            const content = [book.title, book.author, book.publisher, book.subject, book.book_type, book.part, book.isbn].filter(Boolean).join(' ').toLocaleLowerCase(i18n.language);
            return !normalized || content.includes(normalized);
        });
    }, [books, grade, i18n.language, query]);

    const gradeShelves = useMemo(() => {
        const groups = new Map();
        books.forEach((book) => {
            const key = String(book.grade || 'other');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(book);
        });

        const order = [...grades, 'other'];
        return [...groups.entries()].sort(([left], [right]) => {
            const leftIndex = order.indexOf(left);
            const rightIndex = order.indexOf(right);
            return (leftIndex < 0 ? order.length : leftIndex) - (rightIndex < 0 ? order.length : rightIndex);
        });
    }, [books]);

    const filteredView = Boolean(query.trim() || grade);
    const showMore = (gradeKey) => setVisibleByGrade((current) => ({
        ...current,
        [gradeKey]: (current[gradeKey] ?? 15) + 10,
    }));

    const removeBook = (book) => {
        if (!window.confirm(t('books.confirm_delete'))) return;
        setDeletingId(book.id);
        router.delete(route('books.destroy', book.id), { preserveScroll: true, onFinish: () => setDeletingId(null) });
    };

    const clearFilters = () => {
        setQuery('');
        setGrade('');
    };
    const scrollToResults = () => {
    window.setTimeout(() => {
        document
            .getElementById('books-results')
            ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
    }, 100);
};

const submitSearch = (event) => {
    event.preventDefault();

    if (!query.trim() && !grade) {
        return;
    }

    scrollToResults();
};


        return (
    <AuthenticatedLayout
    header={
        isAdmin ? (
            <div>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {tAdmin('dashboard.eyebrow')}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {tAdmin('tabs.books')}
                </h1>
            </div>
        ) : null
    }
>
        <Head title={t('books.title')} />
        <FlashMessages />

        <main className="page-shell pb-24 sm:pb-10">

            {isAdmin && (
                <AdminTabs active="books" />
            )}

            <header className="mb-4 flex items-end justify-between gap-2 sm:mb-6 sm:gap-4">
                       <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400 sm:text-xs">{t('books.eyebrow')}</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{t('books.title')}</h1>
                        <p className="mt-2 hidden max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:block">{t('books.description')}</p>
                    </div>
                        {user && (
                        <Link
                            href={route('add.book')}
                            className="inline-flex shrink-0 whitespace-nowrap rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                            {t('books.add')}
                        </Link>
                    )}
                </header>

         <section className="mb-4 sm:mb-6">
    <div className="flex w-full items-center gap-2">

        {/* SEARCH BAR */}
        <form
    onSubmit={submitSearch}
            className="
                flex
                h-11
                min-w-0
                flex-1
                items-center
                rounded-[18px]
                border
                border-slate-200
                bg-white
                p-1
                shadow-sm
                transition

                focus-within:border-violet-300
                focus-within:ring-2
                focus-within:ring-violet-200/50

                dark:border-slate-700
                dark:bg-slate-900
                dark:focus-within:border-violet-500
                dark:focus-within:ring-violet-500/20

                sm:h-12
            "
        >
            <span className="sr-only">
                {t('actions.search')}
            </span>

            <input
                type="search"
                value={query}
                onChange={(event) =>
                    setQuery(event.target.value)
                }
                placeholder={t('books.search_placeholder')}
                className="
                    h-full
                    min-w-0
                    flex-1
                    border-0
                    bg-transparent
                    px-3
                    text-xs
                    font-medium
                    text-slate-700
                    outline-none
                    placeholder:text-slate-500
                    focus:border-0
                    focus:ring-0

                    dark:text-white
                    dark:placeholder:text-slate-400

                    sm:px-4
                    sm:text-sm
                "
            />

          <button
    type="submit"
    disabled={!query.trim()}
    aria-label={t('actions.search')}
    title={t('actions.search')}
    className="
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-[13px]

        bg-gradient-to-r
        from-indigo-600
        to-violet-600
        text-white

        shadow-md
        shadow-indigo-500/25

        transition

        hover:-translate-y-0.5
        hover:shadow-lg

        active:translate-y-0
        active:scale-95

        disabled:cursor-not-allowed
        disabled:opacity-40
        disabled:shadow-none

        dark:from-indigo-500
        dark:to-violet-500

        sm:h-10
        sm:w-10
    "
>
    <SearchIcon />
</button>
        </form>


        {/* ALL GRADES */}
        <div
            ref={gradeMenuRef}
            className="
                relative
                w-[105px]
                shrink-0

                sm:w-[155px]
            "
        >
            <button
                type="button"
                onClick={() =>
                    setGradeMenuOpen(
                        (open) => !open
                    )
                }
                aria-haspopup="listbox"
                aria-expanded={gradeMenuOpen}
                className="
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    gap-1
                    rounded-[18px]
                    border
                    border-slate-200
                    bg-white
                    px-2
                    text-[11px]
                    font-semibold
                    text-slate-600
                    shadow-sm
                    transition

                    hover:bg-slate-50

                    focus:outline-none
                    focus:ring-2
                    focus:ring-violet-300/50

                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-200
                    dark:hover:bg-slate-800
                    dark:focus:ring-violet-500/30

                    sm:h-12
                    sm:gap-2
                    sm:px-3
                    sm:text-sm
                "
            >
                <span className="truncate">
                    {grade
                        ? gradeLabel(grade)
                        : t('books.all_grades')}
                </span>

                <svg
                    className={`
                        h-3
                        w-3
                        shrink-0
                        text-slate-400
                        transition-transform

                        sm:h-3.5
                        sm:w-3.5

                        ${
                            gradeMenuOpen
                                ? 'rotate-180'
                                : ''
                        }
                    `}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>


            {/* GRADE DROPDOWN */}
            {gradeMenuOpen && (
                <div
                    role="listbox"
                    aria-label={t('books.all_grades')}
                    className="
                        absolute
                        inset-x-0
                        top-full
                        z-50
                        mt-2
                        max-h-64
                        overflow-y-auto
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-1.5
                        text-slate-800
                        shadow-xl

                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-slate-100
                    "
                >
                    {[
                        [
                            '',
                            t('books.all_grades'),
                        ],
                        ...grades.map(
                            (item) => [
                                item,
                                gradeLabel(item),
                            ]
                        ),
                    ].map(([value, label]) => (
                        <button
                            key={value || 'all'}
                            type="button"
                            role="option"
                            aria-selected={
                                grade === value
                            }
                            onClick={() => {
                                setGrade(value);
                                setGradeMenuOpen(
                                    false
                                );
                            }}
                            className={`
                                flex
                                w-full
                                items-center
                                rounded-xl
                                px-3
                                py-2
                                text-start
                                text-xs
                                font-semibold
                                transition

                                sm:text-sm

                                ${
                                    grade === value
                                        ? 'bg-violet-500 text-white'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>


    {/* BOOK COUNT + CLEAR */}
    <div
        className="
            mt-1.5
            flex
            items-center
            justify-end
            gap-3
            px-1
            text-[10px]
            font-bold
            text-slate-500

            dark:text-slate-400

            sm:text-xs
        "
    >
        <span>
            {t('books.results', {
                count: filteredBooks.length,
            })}
        </span>

        {(query || grade) && (
            <button
                type="button"
                onClick={clearFilters}
                className="
                    text-violet-600
                    hover:underline

                    dark:text-violet-400
                "
            >
                {t('actions.clear')}
            </button>
        )}
    </div>
</section>

<div
    id="books-results"
    className="scroll-mt-24"
/>

                {filteredView ? (filteredBooks.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredBooks.map((book) => {
                            const owned = book.created_by === currentUserId;
                            const cover = coverUrl(book);
                            const available = book.listings?.filter((listing) => listing.status === 'available').length ?? 0;
                            return (
                                <article key={book.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50">
                                    <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-950">
                                        {cover ? <BookCoverImage src={cover} alt={t('books.cover_alt', { title: book.title })} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center text-center text-indigo-300 dark:text-indigo-500"><div><BookIcon /><span className="mt-1 block text-[10px] font-bold sm:text-xs">{t('books.no_cover')}</span></div></div>}
                                        {owned && <span className="absolute start-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[9px] font-bold text-white backdrop-blur sm:text-xs">{t('books.owned')}</span>}
                                    </div>
                                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                                        <div className="flex min-w-0 items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 sm:text-xs"><span className="truncate">{book.subject || '—'}</span>{book.grade && <><span className="text-slate-300 dark:text-slate-700">•</span><span>{gradeLabel(book.grade)}</span></>}</div>
                                        <h2 className="mt-1.5 line-clamp-2 min-h-9 text-sm font-extrabold leading-[1.15rem] text-slate-950 dark:text-white sm:min-h-11 sm:text-base sm:leading-[1.35rem]">{book.title}</h2>
                                        {(book.book_type || book.part) && <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 sm:text-xs">{[book.book_type ? t(`book_metadata.${book.book_type}`) : null, book.part ? t('book_metadata.part_value', { part: book.part }) : null].filter(Boolean).join(' · ')}</p>}
                                        <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{book.author ? t('books.by', { author: book.author }) : t('books.unknown_author')}</p>
                                        <div className="mt-2 hidden space-y-1 text-xs text-slate-500 dark:text-slate-400 sm:block"><p className="truncate">{book.publisher || t('books.unknown_publisher')}</p>{book.edition_year && <p>{t('books.edition', { year: book.edition_year })}</p>}</div>
                                        <div className="mt-auto flex items-center justify-between gap-1 border-t border-slate-100 pt-2 dark:border-slate-800 sm:pt-3">
                                            <span className={`truncate text-[9px] font-bold sm:text-xs ${available ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{available ? t('books.available', { count: available }) : t('books.no_listings')}</span>
                                            {isAdmin && <div className="flex shrink-0 gap-0.5"><Link href={route('books.edit', book.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800 dark:hover:text-indigo-300" title={t('actions.edit')}><EditIcon /></Link><button type="button" onClick={() => removeBook(book)} disabled={deletingId === book.id} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300" title={t('actions.delete')}><DeleteIcon /></button></div>}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : <EmptyState title={t('books.empty_title')} message={t('books.empty_description')} action={<Link href={route('add.book')} className="inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{t('books.add')}</Link>} />) : (
                    <div className="space-y-8 sm:space-y-10">
                        {gradeShelves.map(([gradeKey, gradeBooks]) => {
                            const visibleCount = visibleByGrade[gradeKey] ?? 15;
                            const visibleBooks = gradeBooks.slice(0, visibleCount);
                            const remaining = gradeBooks.length - visibleBooks.length;

                            return (
                                <section key={gradeKey}>
                                    <div className="mb-3 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-indigo-600 dark:text-indigo-400">{gradeKey === 'other' ? t('books.other_grade') : t('books.grade', { grade: gradeLabel(gradeKey) })}</p>
                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('books.results', { count: gradeBooks.length })}</p>
                                        </div>
                                    </div>

                                    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:-mx-1 sm:gap-5 sm:px-1">
                                        {visibleBooks.map((book) => <BookCard key={book.id} book={book} currentUserId={currentUserId} deletingId={deletingId} isAdmin={isAdmin} onDelete={removeBook} shelf t={t} />)}
                                        {remaining > 0 && (
                                            <button type="button" onClick={() => showMore(gradeKey)} className="group flex h-fit flex-none snap-start items-center gap-1 self-center rounded-lg px-2 py-2 text-xs font-extrabold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200 sm:text-sm" aria-label={t('books.show_more')}>
                                                <span>{t('books.show_more')}</span>
                                                <DirectionalArrowIcon variant="chevron" className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
        </AuthenticatedLayout>
    );
}
