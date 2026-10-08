import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import FlashMessages from '@/Components/FlashMessages';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import SocialButtons from '@/Components/SocialButtons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';


export default function Login({ status, canResetPassword }) {
    const { t, i18n } = useTranslation(['auth', 'common']);
    const isArabic = i18n.language?.startsWith('ar');
    const [showPassword, setShowPassword] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    /*
     * Keep this page:
     * - light mode
     * - LTR layout
     *
     * Arabic still translates the words,
     * but the layout itself does not flip.
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

    html.setAttribute('dir', 'ltr');
    body.setAttribute('dir', 'ltr');

    html.style.direction = 'ltr';
    body.style.direction = 'ltr';

    return () => {

        desktopQuery.removeEventListener('change', applyAuthTheme);

if (wasDark) {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
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
    };
}, [i18n.language]);
    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
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
    md:focus:!border-blue-500
    md:focus:!ring-4
    md:focus:!ring-blue-500/10

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
    auth-page
    relative
    h-[100dvh]
    overflow-y-auto
    bg-slate-100
    text-slate-900

    md:min-h-screen
"        >
            <Head title={t('auth:login.title')} />

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
{/* MOBILE SIMPLE BACKGROUND */}
<div
    className="
        fixed
        inset-0
        md:hidden
        bg-gradient-to-b
        from-[#eef5ff]
        via-[#f7faff]
        to-[#edf4ff]

        dark:from-slate-950
        dark:via-slate-900
        dark:to-slate-950
    "
/>

            {/* Very light overlay */}
            <div className="pointer-events-none fixed inset-0 bg-white/5" />

            {/* LANGUAGE SWITCHER */}
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

            {/* CENTER LOGIN AREA */}
            <main
                dir="ltr"
                style={{ direction: 'ltr' }}
                className="
    relative
    z-10
    -translate-y-5
md:translate-y-0
    flex
    h-[100dvh]
    w-full
    items-center
    justify-center
    overflow-hidden
    px-5
    pb-2
    pt-14

    sm:px-8
    sm:pt-14

    md:h-screen
    md:overflow-visible
    md:px-4
    md:py-3
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

        md:max-w-[550px]
    "
>
                    {/* LOGIN CARD */}
                    <div
                        dir="ltr"
                        style={{
                            direction: 'ltr',
                            colorScheme: 'light',
                        }}
                        className="
                            w-full
                            px-0
                            py-4
                            sm:px-0
                            sm:py-5
                            md:max-w-[530px]
                            xl:-translate-y-8
                            md:rounded-[28px]
                            md:border
                            md:border-white/80
                            md:!bg-white
                            md:px-7
                            md:shadow-[0_18px_55px_rgba(15,23,42,0.14)]
                            md:backdrop-blur-md
                            md:py-6
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
                                        sm:h-11
                                        sm:w-11
                                        md:h-14
                                        md:w-14
                                    "
                                />

                                <span
                                    className="
                                        mt-0.5
                                        text-[24px]
                                        font-black
                                        tracking-tight
                                        text-slate-950 dark:text-white md:!text-slate-950
                                        md:mt-1
                                        md:text-[28px]
                                    "
                                >
                                    kitabak
                                </span>
                            </Link>

                            <h1
                                className="
                                    mt-1
                                    text-center
                                    text-sm
                                    font-bold
                                    text-slate-700 dark:text-slate-200 md:!text-slate-700
                                    md:mt-1.5
                                    md:text-base
                                "
                            >
                                {t('common:layout.headline')}
                            </h1>

                            <div
                                className="
                                    mx-auto
                                    mt-2
                                    h-[2px]
                                    w-20
                                    rounded-full
                                    bg-gradient-to-r
                                    from-purple-300
                                    via-blue-400
                                    to-emerald-300
                                    md:mt-2.5
                                    md:h-[3px]
                                    md:w-24
                                "
                            />
                        </section>

                        <FlashMessages />

                        {status && (
                            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 md:mt-3 md:text-sm">
                                {status}
                            </div>
                        )}

                        {/* FORM */}
                        <form
                            onSubmit={submit}
                            dir="ltr"
                            className="
                                mt-4
                                space-y-2.5
                                md:mt-5
                                md:space-y-3
                            "
                        >
                            {/* LOGIN */}
                            <div>
                                <div className="relative">
                                    <UserIcon isArabic={isArabic} />

                                    <input
                                        id="login"
                                        type="text"
                                        name="login"
                                        value={data.login}
                                        className={fieldClass}
                                        //style={inputStyle}
                                        autoComplete="username"
                                        inputMode="email"
                                        required
                                        aria-label={t(
                                            'auth:login.identifier',
                                        )}
                                        placeholder={t(
                                            'auth:login.identifier',
                                        )}
                                        onChange={(event) =>
                                            setData(
                                                'login',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <InputError
                                    message={errors.login}
                                    className="mt-1"
                                />
                            </div>

                            {/* PASSWORD */}
                            <div>
                                <div className="relative">
                                    <LockIcon isArabic={isArabic} />

                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        name="password"
                                        value={data.password}
                                        className={`${fieldClass} ${isArabic ? 'ps-11' : 'pe-11'}`}
                                       // style={inputStyle}
                                        autoComplete="current-password"
                                        required
                                        aria-label={t(
                                            'auth:login.password',
                                        )}
                                        placeholder={t(
                                            'auth:login.password',
                                        )}
                                        onChange={(event) =>
                                            setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (visible) => !visible,
                                            )
                                        }
                                        className={`
                                            absolute
                                            top-1/2
                                            -translate-y-1/2
                                            rounded-lg
                                            p-1.5
                                            text-blue-600
                                            transition
                                            hover:bg-blue-50
                                            md:p-2
                                            ${isArabic ? 'left-2' : 'right-2'}
                                        `}
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        <EyeIcon
                                            crossed={showPassword}
                                        />
                                    </button>
                                </div>

                                <InputError
                                    message={errors.password}
                                    className="mt-1"
                                />
                            </div>

                            {/* REMEMBER + FORGOT */}
                            <div
                                dir="ltr"
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-2
                                    text-[11px]
                                    sm:text-xs
                                    md:text-sm
                                "
                            >
                                <label className="flex min-w-0 items-center text-slate-500 dark:text-slate-300 md:!text-slate-500">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(event) =>
                                            setData(
                                                'remember',
                                                event.target.checked,
                                            )
                                        }
                                    />

                                    <span className="ml-2 whitespace-nowrap">
                                        {t(
                                            'auth:login.remember_me',
                                        )}
                                    </span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route(
                                            'password.request',
                                        )}
                                        className="
                                            text-right
                                            font-bold
                                            text-blue-600
                                            transition
                                            hover:text-blue-700
                                        "
                                    >
                                        {t(
                                            'auth:login.forgot_password',
                                        )}
                                    </Link>
                                )}
                            </div>

                            {/* SIGN IN */}
                            <button
                                type="submit"
                                disabled={processing}
                                dir="ltr"
                                className="
                                    flex
                                    h-10
                                    w-full
                                    items-center
                                    justify-center
                                    gap-3
                                    rounded-xl
                                    bg-blue-600
                                    px-5
                                    text-sm
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
                                    md:h-11
                                    md:text-base
                                "
                            >
                                <span>
                                    {processing
                                        ? t(
                                              'auth:login.submitting',
                                              {
                                                  defaultValue:
                                                      'Signing in...',
                                              },
                                          )
                                        : t('auth:login.submit')}
                                </span>

                                {!processing && <DirectionalArrowIcon />}
                            </button>
                        </form>

                        {/* CONTINUE */}


                        {/* GOOGLE */}
                        <div
                            dir="ltr"
                            className="w-full"
                        >
                            <SocialButtons />
                        </div>

                        {/* REGISTER */}
                        <p
                            className="
                                mt-3
                                text-center
                                text-xs
                                text-slate-500
                                md:mt-4
                                md:text-sm
                            "
                        >
                            {t('auth:login.no_account')}{' '}

                            <Link
                                href={route('register')}
                                className="font-bold text-blue-600 transition hover:text-blue-700"
                            >
                                {t('auth:login.sign_up')}
                            </Link>
                        </p>
                    </div>

                    {/* THREE FEATURES */}
            {/* THREE FEATURES */}
</div>
</main>

{/* DESKTOP BOTTOM FEATURES - INDEPENDENT FROM LOGIN CARD */}
<div
    dir="ltr"
    className="
        hidden
        md:grid

        md:mt-4
        md:w-full
        md:max-w-[450px]
        md:grid-cols-3
        md:gap-2
        md:px-1
        md:text-center

        xl:fixed
        xl:bottom-[55px]
        xl:left-1/2
        xl:z-30
        xl:mt-0
        xl:w-[530px]
        xl:max-w-[530px]
        xl:-translate-x-1/2
        xl:gap-3
        xl:px-4
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

{/* DESKTOP COPYRIGHT - INDEPENDENT */}
<footer
    dir="ltr"
    className="
        fixed
        bottom-2
        left-1/2
        z-30
        -translate-x-1/2
        whitespace-nowrap
        text-center
        text-[8px]
        text-slate-600

        md:text-[9px]

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
   LEFT PROMO + MESSAGE
===================================================== */

function PromoSection({ t }) {
    return (
        <section
            dir="ltr"
            style={{
                direction: 'ltr',
                left: '6%',
                top: '8%',
                width: '340px',
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
            {/* EYEBROW */}
            <p
                className="
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.3em]
                    text-slate-400
                "
            >
                {t('auth:promo.eyebrow')}
            </p>

            {/* TITLE */}
            <h2
                className="
                    mt-3
                    text-[42px]
                    font-black
                    leading-[1.05]
                    tracking-tight
                    text-slate-900
                    xl:text-[44px]
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

            {/* DESCRIPTION */}
            <p
                className="
                    mt-5
                    max-w-[315px]
                    text-[15px]
                    leading-6
                    text-slate-500
                "
            >
                {t('auth:promo.description')}
            </p>

            {/* MESSAGE BOX */}
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
                <div className="text-3xl font-black leading-none text-blue-500/60">
                    “
                </div>

                <p
                    className="
                        -mt-1
                        text-[14px]
                        font-medium
                        italic
                        leading-6
                        text-slate-600/90
                    "
                >
                    {t('auth:promo.quote')}
                </p>

                <div className="mt-3 flex items-center gap-2">
                    <div className="h-[3px] w-5 rounded-full bg-emerald-400/80" />

                    <span className="text-[11px] font-medium text-slate-500">
                        {t('auth:promo.community')}
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
                    text-[11px]
                    font-bold
                    leading-4
                    text-slate-700
                    sm:text-xs
                    md:mt-1
                    md:text-sm
                "
            >
                {title}
            </span>

            <span
                className="
                    mt-0.5
                    max-w-[105px]
                    text-[8px]
                    leading-3
                    text-slate-500
                    sm:text-[9px]
                    md:max-w-none
                    md:text-[10px]
                "
            >
                {subtitle}
            </span>
        </div>
    );
}

/* =====================================================
   USER ICON
===================================================== */

function UserIcon({ isArabic }) {
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
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <circle cx="12" cy="8" r="4" />

            <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
    );
}

/* =====================================================
   LOCK ICON
===================================================== */

function LockIcon({ isArabic }) {
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
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

/* =====================================================
   EYE ICON
===================================================== */

function EyeIcon({ crossed }) {
    return (
        <svg
            className="
                h-4
                w-4
                md:h-5
                md:w-5
            "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

            <circle
                cx="12"
                cy="12"
                r="2.5"
            />

            {crossed && (
                <path d="m4 4 16 16" />
            )}
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
            <circle cx="9" cy="8" r="3" />
            <circle cx="16" cy="9" r="2.5" />

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
