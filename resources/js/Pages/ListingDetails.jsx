import BookCoverImage, {
    resolveBookImageUrl,
} from '@/Components/BookCoverImage';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
const WhatsAppIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
    >
        <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.5Z" />
        <path d="M8.5 8.2c.2-.5.4-.5.8-.5h.4c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.6.7c-.2.2-.1.4 0 .6.6 1 1.4 1.8 2.4 2.4.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .5-.2 1.5-.9 2-.6.5-1.4.8-2.5.5-1.2-.3-2.8-1-4.4-2.5-1.3-1.3-2.2-2.8-2.5-4-.3-1 .1-1.7.4-2.1Z" />
    </svg>
);

const ShareIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.7 6.8-4.4" />
        <path d="m8.6 13.3 6.8 4.4" />
    </svg>
);

export default function ListingDetails({
    listing,
    is_admin = false,
}) {
    const { t, i18n } = useTranslation('common');
    const fromReports =
    is_admin &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('from_reports') === '1';

const [showAdminDeleteConfirmation, setShowAdminDeleteConfirmation] =
    useState(false);

const [deletingListing, setDeletingListing] = useState(false);

 const [activeImage, setActiveImage] = useState(0);
const [linkCopied, setLinkCopied] = useState(false);
const [showSafetyModal, setShowSafetyModal] = useState(false);

useEffect(() => {
    if (!showSafetyModal) {
        return;
    }

    window.history.pushState(
        { kitabakSafetyModal: true },
        '',
        window.location.href,
    );

    const handleBackButton = () => {
        setShowSafetyModal(false);
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
        window.removeEventListener(
            'popstate',
            handleBackButton,
        );
    };
}, [showSafetyModal]);
const closeSafetyModal = () => {
    if (showSafetyModal) {
        window.history.back();
    }
};
    const [markingSold, setMarkingSold] = useState(false);
    const [showSoldConfirmation, setShowSoldConfirmation] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
const [reportTarget, setReportTarget] = useState('listing');
const [reportReason, setReportReason] = useState('');
const [reportDetails, setReportDetails] = useState('');
const [reporting, setReporting] = useState(false);
const [reportError, setReportError] = useState('');
const [reportSuccess, setReportSuccess] = useState('');

useEffect(() => {
    if (!showReportModal) {
        return;
    }

    window.history.pushState(
        { kitabakReportModal: true },
        '',
        window.location.href,
    );

    const handlePopState = () => {
        setShowReportModal(false);
        setReportTarget('listing');
        setReportReason('');
        setReportDetails('');
        setReportError('');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
}, [showReportModal]);

const markAsSold = () => {
    setMarkingSold(true);

    router.patch(
        route('listings.mark-sold', listing.id),
        {
            from_listing_details: true,
        },
        {
            onFinish: () => {
                setMarkingSold(false);
            },
        },
    );
};
const removeListingAsAdmin = () => {
    if (!is_admin || deletingListing) {
        return;
    }

    setDeletingListing(true);

    router.delete(route('listings.destroy', listing.id), {
        data: {
            from_reports: fromReports,
            from_admin: !fromReports,
        },

        preserveScroll: true,

        onFinish: () => {
            setDeletingListing(false);
            setShowAdminDeleteConfirmation(false);
        },
    });
};

    const book = listing.book;

    const money = new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
    });

    const price = money.format(Number(listing.price));

    const images = listing.images?.length
        ? listing.images
        : [
              {
                  id: 'cover',
                  image_path:
                      listing.photo_url ||
                      book.cover_image_url,
              },
          ].filter((image) => image.image_path);

    const isMobileDevice =
        navigator.userAgentData?.mobile === true ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(
            navigator.userAgent,
        );

    const whatsappUrl = route(
        'listings.contact.whatsapp',
        {
            listing: listing.id,
            locale: (
                i18n.resolvedLanguage ||
                i18n.language ||
                'en'
            ).split('-')[0],
            target: isMobileDevice
                ? 'app'
                : 'web',
        },
    );

    const showPreviousImage = () => {
        setActiveImage((current) =>
            (current - 1 + images.length) % images.length,
        );
    };

    const showNextImage = () => {
        setActiveImage((current) =>
            (current + 1) % images.length,
        );
    };
const getShareUrl = () =>
    route('listings.share', listing.id);

const getShareText = () =>
    book.title
        ? `${book.title} - Kitabak`
        : 'Kitabak';




const copyShareLink = async () => {
    try {
        await navigator.clipboard.writeText(
            getShareUrl(),
        );

        setLinkCopied(true);

        window.setTimeout(() => {
            setLinkCopied(false);
        }, 2000);
    } catch (error) {
        console.error(
            'Copy link failed:',
            error,
        );
    }
};

const shareListing = async () => {
    const shareData = {
        title: book.title || 'Kitabak',
        text: getShareText(),
        url: getShareUrl(),
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }

        await copyShareLink();
    } catch (error) {
        if (error?.name !== 'AbortError') {
            console.error(
                'Share failed:',
                error,
            );
        }
    }
};

        const listingReportReasons = [
        'fake_or_misleading',
        'inappropriate_content',
        'wrong_information',
        'scam_or_suspicious',
        'duplicate',
        'other',
    ];

    const userReportReasons = [
        'scam_or_suspicious',
        'inappropriate_behavior',
        'spam',
        'impersonation',
        'other',
    ];

const closeReportModal = () => {
    if (reporting) return;

    if (window.history.state?.kitabakReportModal) {
        window.history.back();
        return;
    }

    setShowReportModal(false);
    setReportTarget('listing');
    setReportReason('');
    setReportDetails('');
    setReportError('');
};

    const changeReportTarget = (target) => {
        setReportTarget(target);
        setReportReason('');
        setReportDetails('');
        setReportError('');
    };

    const submitReport = () => {
        if (!reportReason) {
            setReportError(
                t('listing_details.report_reason_required', {
                    defaultValue: 'Please choose a reason.',
                }),
            );
            return;
        }

        setReporting(true);
        setReportError('');

        const reportRoute =
            reportTarget === 'listing'
                ? route('listings.reports.store', listing.id)
                : route('users.reports.store', listing.seller.id);

        router.post(
            reportRoute,
            {
                reason: reportReason,
                details: reportDetails.trim() || null,
            },
            {
                preserveScroll: true,

               onSuccess: () => {
    setShowReportModal(false);
    setReportTarget('listing');
    setReportReason('');
    setReportDetails('');
    setReportError('');

    setReportSuccess(
        t('listing_details.report_success', {
            defaultValue:
                'Report submitted successfully. Thank you. We will review your report.',
        }),
    );

    window.setTimeout(() => {
        setReportSuccess('');
    }, 5000);
},

                onError: (errors) => {
                    setReportError(
                        errors.reason ||
                            errors.details ||
                            t('listing_details.report_error', {
                                defaultValue:
                                    'The report could not be submitted. Please try again.',
                            }),
                    );
                },

                onFinish: () => {
                    setReporting(false);
                },
            },
        );
    };

   const action = listing.is_owner ? (
    <button
        type="button"
        disabled={markingSold}
        onClick={() => setShowSoldConfirmation(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
        {markingSold
            ? t('my_books.updating', {
                  defaultValue: 'Updating...',
              })
            : t('my_books.mark_sold', {
                  defaultValue: 'Mark as sold',
              })}
    </button>
) : listing.can_contact_seller ? (
    <button
        type="button"
        onClick={() => setShowSafetyModal(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
    >
        <WhatsAppIcon />

        {t(
            'listing_details.whatsapp',
        )}
    </button>
    ) : (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            {t(
                'listing_details.no_phone',
            )}
        </p>
    );

    return (
        <AuthenticatedLayout compactMobile>
            <Modal
    show={showSafetyModal}
    onClose={closeSafetyModal}
    maxWidth="md"
>
    <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
            <div
className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:h-11 sm:w-11"            >
                <svg
                    viewBox="0 0 24 24"
className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M12 3 20 7v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V7l8-4Z" />
                    <path d="M12 8v5" />
                    <path d="M12 17h.01" />
                </svg>
            </div>

            <div>
                <h2
className="text-base font-black leading-5 text-slate-900 dark:text-white sm:text-lg sm:leading-normal"                >
                    {t('listing_details.safety_title', {
                        defaultValue: 'Your safety matters to us',
                    })}
                </h2>

                <p
className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm"                >
                    {t('listing_details.safety_description', {
                        defaultValue:
                            'Before contacting the seller, please keep these safety tips in mind.',
                    })}
                </p>
            </div>
        </div>
<div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70 sm:mt-5 sm:p-4">
    <ul className="space-y-2 text-xs leading-5 text-slate-700 dark:text-slate-200 sm:space-y-3 sm:text-sm sm:leading-6">
                <li className="flex gap-2 sm:gap-3">
                    <span className="font-black text-emerald-600">✓</span>
                    <span>
                        {t('listing_details.safety_public', {
                            defaultValue:
                                'Meet in a public and crowded place.',
                        })}
                    </span>
                </li>

                <li className="flex gap-2 sm:gap-3">
                    <span className="font-black text-emerald-600">✓</span>
                    <span>
                        {t('listing_details.safety_not_alone', {
                            defaultValue:
                                'Do not meet alone. Take someone you trust with you.',
                        })}
                    </span>
                </li>

                <li className="flex gap-2 sm:gap-3">
                    <span className="font-black text-emerald-600">✓</span>
                    <span>
                        {t('listing_details.safety_inspect', {
                            defaultValue:
                                'Check the book carefully before buying it.',
                        })}
                    </span>
                </li>

                <li className="flex gap-2 sm:gap-3">
                    <span className="font-black text-emerald-600">✓</span>
                    <span>
                        {t('listing_details.safety_payment', {
                            defaultValue:
                                'Do not pay or transfer money in advance.',
                        })}
                    </span>
                </li>
            </ul>
        </div>

        <div className="mt-4 flex gap-2 sm:mt-6 sm:gap-3">
            <button
                type="button"
                onClick={closeSafetyModal}
                className="min-h-10 sm:min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
             {t('actions.cancel', {
    defaultValue: 'Cancel',
})}
            </button>

            <a
                href={whatsappUrl}
                onClick={() => setShowSafetyModal(false)}
                className="inline-flex min-h-10 sm:min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-center text-sm font-black text-white transition hover:bg-emerald-700"
            >
                <WhatsAppIcon />

                {t('listing_details.safety_continue', {
                    defaultValue: 'Continue',
                })}
            </a>
        </div>
    </div>
</Modal>

 <Modal
    show={showAdminDeleteConfirmation}
    onClose={() => {
        if (!deletingListing) {
            setShowAdminDeleteConfirmation(false);
        }
    }}
    maxWidth="md"
>
    <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                </svg>
            </span>

            <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                    {t('listing_details.remove_listing_title', {
                        defaultValue: 'Remove listing?',
                    })}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                    {t(
                        'listing_details.remove_listing_description',
                        {
                            defaultValue:
                                "This will permanently remove this seller's listing and its condition photos. The shared catalog book will not be deleted.",
                        },
                    )}
                </p>
            </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
            <button
                type="button"
                disabled={deletingListing}
                onClick={() =>
                    setShowAdminDeleteConfirmation(false)
                }
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                {t('actions.cancel', {
                    defaultValue: 'Cancel',
                })}
            </button>

            <button
                type="button"
                disabled={deletingListing}
                onClick={removeListingAsAdmin}
                className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {deletingListing
                    ? t('listing_details.removing_listing', {
                          defaultValue: 'Removing...',
                      })
                    : t('listing_details.remove_listing', {
                          defaultValue: 'Remove listing',
                      })}
            </button>
        </div>
    </div>
</Modal>
            <Modal
    show={showSoldConfirmation}
    onClose={() => setShowSoldConfirmation(false)}
    maxWidth="md"
>
    <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 2.5 2.5L16 9" />
                </svg>
            </span>

            <button
                type="button"
                onClick={() => setShowSoldConfirmation(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={t('actions.close', {
                    defaultValue: 'Close',
                })}
            >
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </div>

        <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {t('my_books.mark_sold', {
                defaultValue: 'Mark as sold',
            })}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
            {t('my_books.confirm_sold', {
                defaultValue: 'Mark this book as sold?',
            })}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
            <button
                type="button"
                disabled={markingSold}
                onClick={() => setShowSoldConfirmation(false)}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                {t('actions.cancel', {
                    defaultValue: 'Cancel',
                })}
            </button>

            <button
                type="button"
                disabled={markingSold}
                onClick={() => {
                    setShowSoldConfirmation(false);
                    markAsSold();
                }}
                className="min-h-12 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {markingSold
                    ? t('my_books.updating', {
                          defaultValue: 'Updating...',
                      })
                    : t('my_books.mark_sold', {
                          defaultValue: 'Mark as sold',
                      })}
            </button>
        </div>
    </div>
</Modal>
<Modal
    show={showReportModal}
    onClose={closeReportModal}
    maxWidth="md"
>
    <div className="p-4 sm:p-7">
        {/* Top icon + close */}
        <div className="flex items-start justify-between gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:h-12 sm:w-12 sm:rounded-2xl">
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                </svg>
            </span>

            <button
                type="button"
                disabled={reporting}
                onClick={closeReportModal}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white sm:h-10 sm:w-10"
                aria-label={t('actions.close', {
                    defaultValue: 'Close',
                })}
            >
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </div>

        {/* Title */}
        <h2 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-white sm:mt-5 sm:text-2xl">
            {t('listing_details.report_title', {
                defaultValue: 'Report',
            })}
        </h2>

        {/* Description - hidden on very small phone height to save space */}
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
            {t('listing_details.report_description', {
                defaultValue:
                    'Tell us what you would like to report. Your report will be reviewed by the moderation team.',
            })}
        </p>

        {/* Report target */}
        <div className="mt-3 sm:mt-5">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 sm:text-sm">
                {t('listing_details.report_what', {
                    defaultValue: 'What would you like to report?',
                })}
            </p>

            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-2">
                <button
                    type="button"
                    disabled={reporting}
                    onClick={() => changeReportTarget('listing')}
                    className={`min-h-10 rounded-xl border px-2 text-xs font-bold transition sm:min-h-12 sm:px-3 sm:text-sm ${
                        reportTarget === 'listing'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/15 dark:bg-indigo-500/10 dark:text-indigo-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                    {t('listing_details.report_listing', {
                        defaultValue: 'This listing',
                    })}
                </button>

                <button
                    type="button"
                    disabled={reporting}
                    onClick={() => changeReportTarget('user')}
                    className={`min-h-10 rounded-xl border px-2 text-xs font-bold transition sm:min-h-12 sm:px-3 sm:text-sm ${
                        reportTarget === 'user'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/15 dark:bg-indigo-500/10 dark:text-indigo-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                    {t('listing_details.report_seller', {
                        defaultValue: 'This seller',
                    })}
                </button>
            </div>
        </div>

        {/* Reason */}
        <div className="mt-3 sm:mt-5">
            <label
                htmlFor="report-reason"
                className="text-xs font-extrabold text-slate-800 dark:text-slate-200 sm:text-sm"
            >
                {t('listing_details.report_reason', {
                    defaultValue: 'Reason',
                })}
            </label>

            <select
                id="report-reason"
                value={reportReason}
                disabled={reporting}
                onChange={(event) => {
                    setReportReason(event.target.value);
                    setReportError('');

                    if (event.target.value !== 'other') {
                        setReportDetails('');
                    }
                }}
                className="mt-1.5 block min-h-10 w-full rounded-xl border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:mt-2 sm:min-h-12 sm:py-2 sm:text-sm"
            >
                <option value="">
                    {t('listing_details.report_choose_reason', {
                        defaultValue: 'Choose a reason',
                    })}
                </option>

                {(reportTarget === 'listing'
                    ? listingReportReasons
                    : userReportReasons
                ).map((reason) => (
                    <option key={reason} value={reason}>
                        {t(
                            `listing_details.report_reasons.${reason}`,
                            {
                                defaultValue: reason.replaceAll(
                                    '_',
                                    ' ',
                                ),
                            },
                        )}
                    </option>
                ))}
            </select>
        </div>

        {/* Details only for Other */}
        {reportReason === 'other' && (
            <div className="mt-3 sm:mt-5">
                <label
                    htmlFor="report-details"
                    className="text-xs font-extrabold text-slate-800 dark:text-slate-200 sm:text-sm"
                >
                    {t('listing_details.report_details', {
                        defaultValue:
                            'Additional details (optional)',
                    })}
                </label>

                <textarea
                    id="report-details"
                    rows={2}
                    maxLength={1000}
                    value={reportDetails}
                    disabled={reporting}
                    onChange={(event) =>
                        setReportDetails(event.target.value)
                    }
                    placeholder={t(
                        'listing_details.report_details_placeholder',
                        {
                            defaultValue:
                                'Add any information that may help us review this report.',
                        },
                    )}
                    className="mt-1.5 block w-full resize-none rounded-xl border-slate-300 bg-white text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:mt-2 sm:text-sm"
                />

                <p className="mt-1 text-end text-[10px] font-semibold text-slate-400 sm:text-xs">
                    {reportDetails.length}/1000
                </p>
            </div>
        )}

        {/* Error */}
        {reportError && (
            <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300 sm:text-sm">
                {reportError}
            </div>
        )}

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
            <button
                type="button"
                disabled={reporting}
                onClick={closeReportModal}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:min-h-12 sm:px-4 sm:text-sm"
            >
                {t('actions.cancel', {
                    defaultValue: 'Cancel',
                })}
            </button>

            <button
                type="button"
                disabled={reporting || !reportReason}
                onClick={submitReport}
                className="min-h-10 rounded-xl bg-indigo-600 px-3 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:px-4 sm:text-sm"
            >
                {reporting
                    ? t('listing_details.report_submitting', {
                          defaultValue: 'Submitting...',
                      })
                    : t('listing_details.report_submit', {
                          defaultValue: 'Submit report',
                      })}
            </button>
        </div>
    </div>
</Modal>
            {reportSuccess && (
    <div className="fixed left-1/2 top-5 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl dark:border-emerald-800 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m5 12 4 4L19 6"
                    />
                </svg>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('listing_details.report_success_title', {
                        defaultValue: 'Report submitted',
                    })}
                </p>

                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {reportSuccess}
                </p>
            </div>

            <button
                type="button"
                onClick={() => setReportSuccess('')}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
            >
                <span className="text-lg leading-none">×</span>
            </button>
        </div>
    </div>
)}
            <Head title={book.title} />

<main className="page-shell min-h-[calc(100dvh-8rem)] overflow-visible py-3 pb-24 sm:min-h-0 sm:py-6 sm:pb-12">                <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
                   <button
    type="button"
    onClick={() => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(route('dashboard'));
    }}
                        className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 ps-1.5 pe-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:group-hover:bg-indigo-500/25">
                            <DirectionalArrowIcon
                                direction="back"
                                variant="chevron"
                            />
                        </span>

                        <span>
                            {t(
                                'listing_details.back_home',
                                {
                                    defaultValue:
                                        'Back to Home',
                                },
                            )}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={shareListing}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 sm:px-4"
                    >
                        <ShareIcon />

                        <span className="hidden sm:inline">
                            {linkCopied
                                ? t(
                                      'listing_details.link_copied',
                                      {
                                          defaultValue:
                                              'Link copied',
                                      },
                                  )
                                : t(
                                      'listing_details.share',
                                      {
                                          defaultValue:
                                              'Share',
                                      },
                                  )}
                        </span>
                    </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)] lg:gap-5">
                    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                        <div
                            className="relative flex h-[31dvh] max-h-60 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950 sm:h-[68vh] sm:max-h-[44rem] sm:min-h-[32rem] sm:rounded-2xl"
                        >
                            {images[activeImage] && (
                                <BookCoverImage
                                    src={resolveBookImageUrl(
                                        images[activeImage].image_path,
                                    )}
                                    alt={`${book.title} ${activeImage + 1}`}
                                    className="block h-full w-full object-contain p-2 sm:p-3"
                                />
                            )}

                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={showPreviousImage}
                                        aria-label={t('actions.previous', {
                                            defaultValue: 'Previous photo',
                                        })}
                                        className="absolute start-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-slate-950/65 text-white shadow-lg backdrop-blur transition hover:bg-slate-950/85 sm:start-4 sm:h-12 sm:w-12"
                                    >
                                      <DirectionalArrowIcon
    direction="back"
    variant="chevron"
    className="h-6 w-6"
    strokeWidth={2.5}
/>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={showNextImage}
                                        aria-label={t('actions.next', {
                                            defaultValue: 'Next photo',
                                        })}
                                        className="absolute end-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-slate-950/65 text-white shadow-lg backdrop-blur transition hover:bg-slate-950/85 sm:end-4 sm:h-12 sm:w-12"
                                    >
                                       <DirectionalArrowIcon
    direction="forward"
    variant="chevron"
    className="h-6 w-6"
    strokeWidth={2.5}
/>
                                    </button>

                                    <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 sm:bottom-4">
                                        {images.map((image, index) => (
                                            <button
                                                key={image.id ?? index}
                                                type="button"
                                                onClick={() => setActiveImage(index)}
                                                aria-label={`${index + 1} / ${images.length}`}
                                                className={`h-1.5 rounded-full shadow transition-all ${
                                                    index === activeImage
                                                        ? 'w-5 bg-indigo-600'
                                                        : 'w-1.5 bg-white/90 hover:bg-white'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {images.length > 0 && (
                                <span className="absolute end-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur sm:end-4 sm:top-4 sm:text-xs">
                                    {activeImage + 1}/{images.length}
                                </span>
                            )}
                        </div>
                    </section>

<aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:p-4">
                            <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[.16em] text-indigo-600 dark:text-indigo-300 sm:text-xs">
                                    {t(
                                        'listing_details.eyebrow',
                                    )}
                                </p>

                                <h1
className="mt-1 line-clamp-2 text-lg font-black leading-tight text-slate-950 dark:text-white sm:mt-1.5 sm:text-2xl"                                 >
                                    {
                                        book.title
                                    }
                                </h1>
                            </div>

                            <strong className="shrink-0 rounded-2xl bg-emerald-50 px-3 py-2 text-base font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:text-xl">
                                {price}
                            </strong>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">
                            {book.author ||
                                t(
                                    'books.unknown_author',
                                )}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
                            <CompactDetail
                                label={t(
                                    'listing_details.seller',
                                )}
                                value={
                                    <SellerLink
                                        seller={
                                            listing.seller
                                        }
                                    />
                                }
                            />

                            <CompactDetail
                                label={t(
                                    'listing_details.location',
                                )}
                                value={
                                    listing.location ||
                                    '—'
                                }
                            />
                            <CompactDetail
   label={t('listing_details.condition')}
    value={
        listing.condition
            ? t(
                  `book_form.condition_${listing.condition}`,
                  {
                      defaultValue:
                          listing.condition === 'like_new'
                              ? 'Like New'
                              : listing.condition === 'very_old'
                                ? 'Very Old'
                                : listing.condition
                                      .charAt(0)
                                      .toUpperCase() +
                                  listing.condition.slice(1),
                  },
              )
            : '—'
    }
/>

<div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {t('listing_details.notes')}
    </p>

    <div className="mt-0.5 max-h-8 overflow-y-auto break-words pe-1 text-xs font-extrabold leading-4 text-slate-800 dark:text-white">
        {listing.notes?.trim() || '—'}
    </div>
</div>
                        </div>

<dl className="mt-4 hidden grid-cols-2 gap-2 text-sm sm:grid">                            <Detail
                                label={t(
                                    'listing_details.price',
                                )}
                                value={
                                    price
                                }
                            />

                            <Detail
                                label={t(
                                    'listing_details.location',
                                )}
                                value={
                                    listing.location ||
                                    '—'
                                }
                            />

                            <Detail
  label={t('listing_details.condition')}
    value={
        listing.condition
            ? t(
                  `book_form.condition_${listing.condition}`,
                  {
                      defaultValue:
                          listing.condition === 'like_new'
                              ? 'Like New'
                              : listing.condition === 'very_old'
                                ? 'Very Old'
                                : listing.condition
                                      .charAt(0)
                                      .toUpperCase() +
                                  listing.condition.slice(1),
                  },
              )
            : '—'
    }
/>

<Detail
  label={t('listing_details.notes')}
    value={listing.notes?.trim() || '—'}
/>

                            <Detail
                                label={t(
                                    'listing_details.seller',
                                )}
                                value={
                                    <SellerLink
                                        seller={
                                            listing.seller
                                        }
                                    />
                                }
                            />

                            <Detail
                                label={t(
                                    'book_form.publisher',
                                )}
                                value={
                                    book.publisher ||
                                    '—'
                                }
                            />

                            <Detail
                                label={t(
                                    'book_metadata.book_type',
                                )}
                                value={
                                    book.book_type
                                        ? t(
                                              `book_metadata.${book.book_type}`,
                                          )
                                        : '—'
                                }
                            />

                            <Detail
                                label={t(
                                    'book_metadata.part',
                                )}
                                value={
                                    book.part ||
                                    '—'
                                }
                            />

                            <Detail
                                label={t(
                                    'book_form.grade',
                                )}
                                value={
                                    book.grade ||
                                    '—'
                                }
                            />

                            <Detail
                                label={t(
                                    'book_form.isbn',
                                )}
                                value={
                                    book.isbn ||
                                    '—'
                                }
                            />
                        </dl>

                  <div className="mt-3">
    {is_admin && fromReports && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-500/10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500 dark:text-red-300">
                {t('listing_details.admin_moderation', {
    defaultValue: 'Admin moderation',
})}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {t('listing_details.review_reported_listing', {
    defaultValue: 'Review this reported listing',
})}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
                {listing.seller?.id && (
                    <Link
                        href={route(
                            'sellers.books',
                            listing.seller.id,
                        )}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                    >
                        {t('listing_details.view_seller', {
    defaultValue: 'View seller',
})}
                    </Link>
                )}

                <button
                    type="button"
                    onClick={() =>
                        setShowAdminDeleteConfirmation(true)
                    }
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-black text-white transition hover:bg-red-700 sm:text-sm"
                >
                    {t('listing_details.remove_listing', {
    defaultValue: 'Remove listing',
})}
                </button>
            </div>
        </div>
    )}

    {action}

    {!listing.is_owner && listing.seller?.id && (
        <button
            type="button"
            onClick={() => {
                setReportTarget('listing');
                setReportReason('');
                setReportDetails('');
                setReportError('');
                setShowReportModal(true);
            }}
className="mt-1.5 inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-xl px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300 sm:text-sm"
        >
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
                <path d="M5 21V4" />
                <path d="M5 4h10l-1 4 1 4H5" />
            </svg>

            {t('listing_details.report', {
                defaultValue: 'Report',
            })}
        </button>
    )}
</div>
                    </aside>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}

function CompactDetail({
    label,
    value,
}) {
    return (
        <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-0.5 truncate text-xs font-extrabold text-slate-800 dark:text-white">
                {value}
            </p>
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
            <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {label}
            </dt>

            <dd className="mt-1 break-words font-bold text-slate-950 dark:text-white">
                {value}
            </dd>
        </div>
    );
}

function SellerLink({ seller }) {
    if (!seller) {
        return '—';
    }

    return (
        <Link
            href={route('sellers.books', seller.id)}
            className="inline-flex max-w-full items-center gap-1.5 text-indigo-600 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-800 hover:decoration-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
            <span className="truncate">{seller.name}</span>
            <svg
                className="h-3.5 w-3.5 shrink-0 rtl:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        </Link>
    );
}
