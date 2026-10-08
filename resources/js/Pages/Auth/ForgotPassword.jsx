import ApplicationLogo from '@/Components/ApplicationLogo';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword({ status }) {
    const { t, i18n } = useTranslation(['auth', 'common']);
    const isArabic = i18n.language?.startsWith('ar');

    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        email: '',
    });

    /*
     * Keep authentication page:
     * - Light mode
     * - LTR layout
     *
     * Arabic still translates text,
     * but the visual layout does not flip.
     */
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const desktopQuery = window.matchMedia('(min-width: 768px)');
const wasDark = html.classList.contains('dark');

const applyAuthTheme = () => {
    if (desktopQuery.matches) {
        html.classList.remove('dark');
    } else if (wasDark) {
        html.classList.add('dark');
    }
};

applyAuthTheme();
desktopQuery.addEventListener('change', applyAuthTheme);

        const oldHtmlDir = html.getAttribute('dir');
        const oldBodyDir = body.getAttribute('dir');

        const oldHtmlDirection = html.style.direction;
        const oldBodyDirection = body.style.direction;

        const oldHtmlColorScheme = html.style.colorScheme;
        const oldBodyColorScheme = body.style.colorScheme;



        html.setAttribute('dir', 'ltr');
        body.setAttribute('dir', 'ltr');

        html.style.direction = 'ltr';
        body.style.direction = 'ltr';

        html.style.colorScheme = 'light';
        body.style.colorScheme = 'light';

        return () => {
            desktopQuery.removeEventListener('change', applyAuthTheme);

if (wasDark) {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
}
            if (wasDark) {
                html.classList.add('dark');
            }

            if (oldHtmlDir) {
                html.setAttribute('dir', oldHtmlDir);
            } else {
                html.removeAttribute('dir');
            }

            if (oldBodyDir) {
                body.setAttribute('dir', oldBodyDir);
            } else {
                body.removeAttribute('dir');
            }

            html.style.direction = oldHtmlDirection;
            body.style.direction = oldBodyDirection;

            html.style.colorScheme = oldHtmlColorScheme;
            body.style.colorScheme = oldBodyColorScheme;
        };
    }, [i18n.language]);

    const submit = (event) => {
        event.preventDefault();

        post(route('password.email'));
    };

   const fieldClass = `
    auth-input
    h-10 w-full rounded-xl
    border border-slate-400
    bg-white
    text-sm text-slate-900
    shadow-sm outline-none transition
    placeholder:text-slate-400
    focus:border-blue-500
    focus:ring-4 focus:ring-blue-500/10

    dark:border-[#334155]
    dark:bg-[#111827]
    dark:text-slate-100
    dark:placeholder:text-[#64748b]
    dark:shadow-none
    dark:focus:border-blue-500
    dark:focus:ring-2
    dark:focus:ring-blue-500/15

    md:!border-slate-400
    md:!bg-white
    md:!text-slate-900
    md:!shadow-sm
    md:placeholder:!text-slate-400

    sm:h-11
    md:h-12
    md:text-base

    ${
        isArabic
            ? 'pe-10 ps-3 text-right sm:pe-11 md:pe-12 md:ps-4'
            : 'ps-10 pe-3 text-left sm:ps-11 md:ps-12 md:pe-4'
    }
`;

    // const inputStyle = {
    //     backgroundColor: '#ffffff',
    //     color: '#0f172a',
    //     WebkitTextFillColor: '#0f172a',
    //     WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
    //     caretColor: '#0f172a',
    //     colorScheme: 'light',
    // };

    return (
        <div
            dir="ltr"
            style={{
                direction: 'ltr',
                colorScheme: 'light',
            }}
            className="
                relative
                min-h-[100dvh]
                overflow-y-auto
                bg-[#f4f8ff]
                text-slate-900
            "
        >
            <Head
                title={t('auth:forgot_password.title', {
                    defaultValue: 'Forgot password',
                })}
            />

            {/* DESKTOP BACKGROUND */}
            <div
                className="fixed inset-0 hidden bg-no-repeat md:block"
                style={{
                    backgroundImage:
                        "url('/images/login-background.jpg')",
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center center',
                }}
            />

            {/* MOBILE BACKGROUND */}
<div
    className="
        fixed inset-0 md:hidden
        bg-gradient-to-b
        from-[#eef5ff]
        via-[#f7faff]
        to-[#edf4ff]

        dark:from-slate-950
        dark:via-slate-900
        dark:to-slate-950
    "
/>
            {/* LIGHT OVERLAY */}
            <div className="pointer-events-none fixed inset-0 bg-white/5" />

            {/* LANGUAGE */}
            <div
                dir="ltr"
                className="
                    fixed
                    right-3
                    top-3
                    z-40

                    sm:right-4
                    sm:top-4
                "
            >
                <LanguageSwitcher />
            </div>

            {/* LEFT PROMO */}
            <PromoSection t={t} />

            {/* MAIN */}
            <main
                dir="ltr"
                className="
                    relative
                    z-10
                    flex
                    h-[100dvh]
                    w-full
                    items-start
                    justify-center
                    overflow-y-auto
                    px-6
                    pb-12
                    pt-24

                    md:items-center
                    md:overflow-visible
                    md:px-3
                    md:py-2
                "
            >
                <div
                    dir="ltr"
                    className="
                        flex
                        w-full
                        max-w-none
                        flex-col
                        items-center

                        md:max-w-[500px]
                    "
                >
                    {/* RESET CARD */}
                    <div
                        dir="ltr"
                        style={{
                            colorScheme: 'light',
                        }}
                        className="
                            w-full
                            px-0
                            py-0

                            sm:px-0
                            sm:py-0

                            md:max-w-[480px]
                            md:rounded-[26px]
                            md:border
                            md:border-white/80
                            md:!bg-white
                            md:px-7
                            md:shadow-[0_18px_50px_rgba(15,23,42,0.12)]
                            md:backdrop-blur-md
                            md:py-6

                            xl:-translate-y-6
                        "
                    >
                        {/* LOGO */}
                        <section className="text-center">
                            <Link
                                href="/"
                                className="inline-flex flex-col items-center"
                            >
                                <ApplicationLogo
                                    className="
                                        h-10
                                        w-10

                                        sm:h-10
                                        sm:w-10

                                        md:h-11
                                        md:w-11
                                    "
                                />

                                <span
                                    className="
                                        mt-0.5
                                        text-[28px]
                                        font-black
                                        tracking-tight
text-slate-950
dark:text-white
md:!text-slate-950
                                        md:text-2xl
                                    "
                                >
                                    kitabak
                                </span>
                            </Link>

                            {/* TITLE */}
                            <h1
                                className="
                                    mt-2
                                    text-lg
                                    font-black
                                    text-slate-900

                                    md:text-lg
                                "
                            >
                                {t(
                                    'auth:forgot_password.heading',
                                    {
                                        defaultValue:
                                            'Reset your password',
                                    },
                                )}
                            </h1>

                            {/* COLORED LINE */}
                            <div
                                className="
                                    mx-auto
                                    mt-2.5
                                    h-[2px]
                                    w-16
                                    rounded-full
                                    bg-gradient-to-r
                                    from-purple-300
                                    via-blue-400
                                    to-emerald-300
                                "
                            />

                            {/* DESCRIPTION */}
                            <p
                                className="
                                    mx-auto
                                    mt-4
                                    max-w-[350px]
                                    text-xs
                                    leading-5
                                    text-slate-500

                                    sm:text-sm
                                "
                            >
                                {t(
                                    'auth:forgot_password.description',
                                    {
                                        defaultValue:
                                            'Enter your email address and we will send you a password reset link.',
                                    },
                                )}
                            </p>
                        </section>

                        {/* STATUS */}
                        {status && (
                            <div
                                className="
                                    mt-4
                                    rounded-xl
                                    border
                                    border-emerald-200
                                    bg-emerald-50
                                    px-3
                                    py-2
                                    text-xs
                                    font-medium
                                    text-emerald-700

                                    sm:text-sm
                                "
                            >
                                {status}
                            </div>
                        )}

                        {/* FORM */}
                        <form
                            onSubmit={submit}
                            className="
                                mt-5
                                space-y-3
                            "
                        >
                            <div>
                                <div className="relative">
                                    <EmailIcon isArabic={isArabic} />

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className={fieldClass}

                                        autoComplete="email"
                                        required
                                        aria-label={t(
                                            'auth:forgot_password.email',
                                            {
                                                defaultValue:
                                                    'Email address',
                                            },
                                        )}
                                        placeholder={t(
                                            'auth:forgot_password.email',
                                            {
                                                defaultValue:
                                                    'Email address',
                                            },
                                        )}
                                        onChange={(event) =>
                                            setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <InputError
                                    message={errors.email}
                                    className="mt-1"
                                />
                            </div>

                            {/* SEND BUTTON */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="
                                    flex
                                    h-10
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-blue-600
                                    px-4
                                    text-xs
                                    font-bold
                                    text-white
                                    shadow-lg
                                    shadow-blue-600/20
                                    transition
                                    hover:bg-blue-700
                                    focus:outline-none
                                    focus:ring-4
                                    focus:ring-blue-500/25
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60

                                    sm:h-11
                                    sm:text-sm

                                    md:text-base
                                "
                            >
                                <span>
                                    {processing
                                        ? t(
                                              'auth:forgot_password.sending',
                                              {
                                                  defaultValue:
                                                      'Sending...',
                                              },
                                          )
                                        : t(
                                              'auth:forgot_password.submit',
                                              {
                                                  defaultValue:
                                                      'Send reset link',
                                              },
                                          )}
                                </span>

                                {!processing && <DirectionalArrowIcon className="h-3.5 w-3.5" />}
                            </button>
                        </form>

                        {/* BACK TO LOGIN */}
                        <p
                            className="
                                mt-4
                                text-center
                                text-xs
                                text-slate-500

                                sm:text-sm
                            "
                        >
                            {t(
                                'auth:forgot_password.remembered',
                                {
                                    defaultValue:
                                        'Remember your password?',
                                },
                            )}{' '}

                            <Link
                                href={route('login')}
                                className="
                                    font-bold
                                    text-blue-600
                                    transition
                                    hover:text-blue-700
                                "
                            >
                                {t(
                                    'auth:forgot_password.back_to_login',
                                    {
                                        defaultValue:
                                            'Back to sign in',
                                    },
                                )}
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* =====================================================
                DESKTOP FEATURES
                Hidden on phone / tablet / smaller laptop.
            ====================================================== */}
            <div
                dir="ltr"
                className="
                    hidden

                    xl:fixed
                    xl:bottom-[55px]
                    xl:left-1/2
                    xl:z-30
                    xl:grid
                    xl:w-[530px]
                    xl:-translate-x-1/2
                    xl:grid-cols-3
                    xl:gap-3
                    xl:px-4
                    xl:text-center
                "
            >
                <Feature
                    icon={<BookIcon />}
                    title={t(
                        'auth:features.discover.title',
                        {
                            defaultValue: 'Discover',
                        },
                    )}
                    subtitle={t(
                        'auth:features.discover.subtitle',
                        {
                            defaultValue:
                                'New perspectives',
                        },
                    )}
                />

                <Feature
                    icon={<UsersIcon />}
                    title={t(
                        'auth:features.join.title',
                        {
                            defaultValue: 'Join',
                        },
                    )}
                    subtitle={t(
                        'auth:features.join.subtitle',
                        {
                            defaultValue:
                                'A growing community',
                        },
                    )}
                />

                <Feature
                    icon={<GrowIcon />}
                    title={t(
                        'auth:features.grow.title',
                        {
                            defaultValue: 'Grow',
                        },
                    )}
                    subtitle={t(
                        'auth:features.grow.subtitle',
                        {
                            defaultValue:
                                'A brighter you',
                        },
                    )}
                />
            </div>

            {/* COPYRIGHT */}
            <footer
                dir="ltr"
                className="
                    fixed
                    bottom-1
                    left-1/2
                    z-30
                    -translate-x-1/2
                    whitespace-nowrap
                    text-center
                    text-[8px]
                    leading-3
                    text-slate-600

                    sm:text-[9px]

                    xl:bottom-[12px]
                    xl:text-[10px]
                "
            >
                © 2026 Kitabak.{' '}
                {t('auth:footer.rights', {
                    defaultValue:
                        'All rights reserved.',
                })}
            </footer>
        </div>
    );
}

/* =====================================================
   LEFT PROMO
===================================================== */

function PromoSection({ t }) {
    return (
        <section
            dir="ltr"
            style={{
                left: '6%',
                top: '7%',
                width: '330px',
                textAlign: 'left',
            }}
            className="
                absolute
                z-20
                hidden
                text-left
                lg:block
            "
        >
            <p
                className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.3em]
                    text-slate-400
                "
            >
                {t('auth:promo.eyebrow')}
            </p>

            <h2
                className="
                    mt-2.5
                    text-[38px]
                    font-black
                    leading-[1.04]
                    tracking-tight
                    text-slate-900

                    xl:text-[42px]
                "
            >
                {t('auth:promo.title_start')}

                <br />

                {t('auth:promo.title_middle')}{' '}

               <span
    className="
        bg-gradient-to-r
        from-blue-800
        via-blue-600
        to-blue-400
        bg-clip-text
        text-transparent
    "
>
    {t('auth:promo.title_highlight')}
</span>
            </h2>

            <p
                className="
                    mt-4
                    max-w-[300px]
                    text-sm
                    leading-6
                    text-slate-500
                "
            >
                {t('auth:promo.description')}
            </p>

            {/* MESSAGE */}
           <div
    className="
        mt-5
        max-w-[285px]
        rounded-[18px]
        border
        border-blue-100/60
        bg-blue-50/75
        px-4
        py-3.5
        shadow-[0_10px_30px_rgba(59,130,246,0.06)]
        backdrop-blur-[4px]
    "
>
                <div className="text-2xl font-black leading-none text-blue-500/60">
                    “
                </div>

                <p
                    className="
                        -mt-0.5
                        text-[13px]
                        font-medium
                        italic
                        leading-5
                        text-slate-600/90
                    "
                >
                    {t('auth:promo.quote')}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-[3px] w-4 rounded-full bg-emerald-400/80" />

                    <span className="text-[10px] font-medium text-slate-500">
                        {t(
                            'auth:promo.community',
                        )}
                    </span>
                </div>
            </div>
        </section>
    );
}

/* =====================================================
   FEATURE
===================================================== */

function Feature({ icon, title, subtitle }) {
    return (
        <div className="flex min-w-0 flex-col items-center">
            {icon}

            <span
                className="
                    mt-0.5
                    text-[10px]
                    font-bold
                    leading-3
                    text-slate-700

                    sm:text-[11px]
                    md:text-xs
                "
            >
                {title}
            </span>

            <span
                className="
                    mt-0.5
                    max-w-[95px]
                    text-[7px]
                    leading-3
                    text-slate-500

                    sm:text-[8px]
                    md:text-[9px]
                "
            >
                {subtitle}
            </span>
        </div>
    );
}

/* =====================================================
   EMAIL ICON
===================================================== */

function EmailIcon({ isArabic }) {
    return (
        <svg
            className={`
                pointer-events-none
                absolute
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
                md:h-5
                md:w-5
                ${isArabic ? 'right-3 md:right-4' : 'left-3 md:left-4'}
            `}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

/* =====================================================
   DISCOVER
===================================================== */

function BookIcon() {
    return (
        <svg
            className="
                h-4
                w-4
                text-slate-500

                sm:h-5
                sm:w-5
            "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5V5.5Z"
            />
        </svg>
    );
}

/* =====================================================
   JOIN
===================================================== */

function UsersIcon() {
    return (
        <svg
            className="
                h-4
                w-4
                text-slate-500

                sm:h-5
                sm:w-5
            "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <circle
                cx="9"
                cy="8"
                r="3"
            />

            <circle
                cx="16"
                cy="9"
                r="2.5"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.5 19a5.5 5.5 0 0 1 11 0"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 18.5a4.5 4.5 0 0 1 7.5 0"
            />
        </svg>
    );
}

/* =====================================================
   GROW
===================================================== */

function GrowIcon() {
    return (
        <svg
            className="
                h-4
                w-4
                text-slate-500

                sm:h-5
                sm:w-5
            "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21V10"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14c-4 0-6-2.5-6-6 4 0 6 2.5 6 6Z"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11c0-4 2.5-6 6-6 0 4-2.5 6-6 6Z"
            />
        </svg>
    );
}
