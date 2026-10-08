import ApplicationLogo from '@/Components/ApplicationLogo';
import DirectionalArrowIcon from '@/Components/DirectionalArrowIcon';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import SocialButtons from '@/Components/SocialButtons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Register() {
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
        clearErrors,
    } = useForm({
        name: '',
        registration_method: 'email',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

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

    const selectMethod = (method) => {
        setData('registration_method', method);
        clearErrors('email', 'phone');
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('register'), {
            onFinish: () =>
                reset(
                    'password',
                    'password_confirmation',
                ),
        });
    };

   const fieldClass = `
    auth-input
    h-10 w-full rounded-xl
    border border-slate-400
    bg-white
    text-[13px] text-slate-900
    shadow-[0_4px_12px_rgba(15,23,42,0.05)]
    outline-none transition
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
    md:!shadow-[0_4px_12px_rgba(15,23,42,0.05)]
    md:placeholder:!text-slate-400

    sm:h-10
    sm:text-sm
    md:h-10
    md:text-sm

    ${
        isArabic
            ? 'pe-9 ps-3 text-right sm:pe-10'
            : 'ps-9 pe-3 text-left sm:ps-10'
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
                h-[100dvh]
                overflow-hidden
                bg-[#f4f8ff]
                text-slate-900
            "
        >
            <Head title={t('auth:register.title')} />

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
            <div className="pointer-events-none fixed inset-0 bg-white/5" />

            {/* LANGUAGE */}
            <div
                dir="ltr"
                className="fixed right-3 top-3 z-40 sm:right-4 sm:top-4"
            >
                <LanguageSwitcher />
            </div>

            {/* LEFT PROMO */}
            <PromoSection t={t} />

            {/* MAIN REGISTER AREA */}
            <main
                dir="ltr"
                className="
                    relative
                    z-10
                    flex
                    h-[100dvh]
                    w-full
                    items-center
                    justify-center
                    overflow-hidden
                    px-6
                    py-2

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
                    {/* REGISTER CARD */}
                    <div
                        dir="ltr"
                        style={{
                            colorScheme: 'light',
                        }}
                        className="
                            w-full
                            px-0
                            py-2.5
                            sm:px-0
                            sm:py-4
                            md:max-w-[480px]
                            md:rounded-[24px]
                            md:border
                            md:border-white/80
                            md:!bg-white
                            md:px-6
                            md:shadow-[0_18px_50px_rgba(15,23,42,0.12)]
                            md:backdrop-blur-md
                            md:py-4

                            xl:-translate-y-8
                        "
                    >
                        {/* LOGO + TITLE */}
                        <section className="text-center">
                            <Link
                                href="/"
                                className="inline-flex flex-col items-center"
                            >
                                <ApplicationLogo
                                    className="
                                        h-8
                                        w-8

                                        sm:h-9
                                        sm:w-9

                                        md:h-10
                                        md:w-10
                                    "
                                />

                                <span
                                    className="
                                        mt-0.5
                                        text-xl
                                        font-black
                                        tracking-tight
                                        text-slate-950
                                        dark:text-white
md:!text-slate-950
                                        md:text-[22px]
                                    "
                                >
                                    kitabak
                                </span>
                            </Link>

                            <h1
                                className="
                                    mt-0.5
                                    text-[13px]
                                    font-bold
                                    text-slate-700
                                    dark:text-slate-200
md:!text-slate-700
                                    sm:text-sm
                                "
                            >
                                {t('auth:register.title')}
                            </h1>

                            <div
                                className="
                                    mx-auto
                                    mt-1.5
                                    h-[2px]
                                    w-16
                                    rounded-full
                                    bg-gradient-to-r
                                    from-purple-300
                                    via-blue-400
                                    to-emerald-300
                                "
                            />
                        </section>

                        {/* FORM */}
                        <form
                            onSubmit={submit}
                            className="
                                mt-2
                                space-y-1.5

                                sm:mt-3
                                sm:space-y-2
                            "
                        >
                            {/* NAME */}
                            <Field
                                icon={<UserIcon isArabic={isArabic} />}
                                error={errors.name}
                            >
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    className={fieldClass}

                                    autoComplete="name"
                                    required
                                    placeholder={t(
                                        'auth:register.name',
                                    )}
                                />
                            </Field>

                            {/* EMAIL / PHONE SELECTOR */}
                            <div
                                className="
                                    grid
                                    grid-cols-2
                                    rounded-xl
                                   bg-slate-100
dark:bg-slate-800
md:!bg-slate-100
p-1
                                "
                                role="group"
                                aria-label={t(
                                    'auth:register.method',
                                )}
                            >
                                {['email', 'phone'].map(
                                    (method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() =>
                                                selectMethod(
                                                    method,
                                                )
                                            }
                                            className={`
                                                h-8
                                                rounded-lg
                                                text-[11px]
                                                font-bold
                                                transition

                                                sm:h-9
                                                sm:text-xs

                                                ${
                                                    data.registration_method === method
    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white md:!text-slate-600 md:hover:!text-slate-950'
                                                }
                                            `}
                                            aria-pressed={
                                                data.registration_method ===
                                                method
                                            }
                                        >
                                            {t(
                                                `auth:register.${method}`,
                                            )}
                                        </button>
                                    ),
                                )}
                            </div>

                            {/* EMAIL OR PHONE */}
                            {data.registration_method ===
                            'email' ? (
                                <Field
                                    icon={<MailIcon isArabic={isArabic} />}
                                    error={errors.email}
                                >
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        className={fieldClass}

                                        autoComplete="email"
                                        required
                                        placeholder={t(
                                            'auth:register.email_address',
                                        )}
                                    />
                                </Field>
                            ) : (
                               <Field error={errors.phone}>
    <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="
            relative
            flex
            h-9
            overflow-hidden
            rounded-xl
            border
           border-slate-400
bg-white
text-xs

dark:border-[#334155]
dark:bg-[#111827]

md:!border-slate-400
md:!bg-white
            shadow-[0_4px_12px_rgba(15,23,42,0.05)]
            focus-within:border-blue-500
            focus-within:ring-4
            focus-within:ring-blue-500/10
            sm:h-10
        "
    >
        <span
            className={`
                flex
                items-center
                gap-1
                px-2
                font-bold
                text-blue-600

                ${
                    isArabic
                        ? 'border-l border-slate-400'
                        : 'border-r border-slate-400'
                }
            `}
        >
            <span>🇱🇧</span>
            <span dir="ltr">+961</span>
        </span>

        <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(event) =>
                setData('phone', event.target.value)
            }

            className={`
                min-w-0
                flex-1
                border-0
                bg-transparent
                px-2.5
                text-xs
                text-slate-900
dark:text-slate-100
md:!text-slate-900
                outline-none
                placeholder:text-slate-400
dark:placeholder:text-[#64748b]
md:placeholder:!text-slate-400
                focus:ring-0
                sm:text-sm

                ${isArabic ? 'text-right' : 'text-left'}
            `}
            autoComplete="tel"
            required
            placeholder={t(
                'auth:register.phone_number',
            )}
        />
    </div>
</Field>
                            )}

                            {/* PASSWORD */}
                            <Field
                                icon={<LockIcon isArabic={isArabic} />}
                                error={errors.password}
                            >
                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={data.password}
                                    onChange={(event) =>
                                        setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    className={`${fieldClass} ${isArabic ? 'ps-10' : 'pe-10'}`}

                                    autoComplete="new-password"
                                    required
                                    placeholder={t(
                                        'auth:register.password',
                                    )}
                                />

                                <VisibilityButton
                                    visible={showPassword}
                                    isArabic={isArabic}
                                    onClick={() =>
                                        setShowPassword(
                                            (value) => !value,
                                        )
                                    }
                                />
                            </Field>

                            {/* CONFIRM PASSWORD */}
                            <Field
                                icon={<CheckIcon isArabic={isArabic} />}
                                error={
                                    errors.password_confirmation
                                }
                            >
                                <input
                                    id="password_confirmation"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={
                                        data.password_confirmation
                                    }
                                    onChange={(event) =>
                                        setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    className={`${fieldClass} ${isArabic ? 'ps-10' : 'pe-10'}`}

                                    autoComplete="new-password"
                                    required
                                    placeholder={t(
                                        'auth:register.confirm_password',
                                    )}
                                />
                            </Field>

                            {/* CREATE ACCOUNT */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="
                                    flex
                                    h-9
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
                                    disabled:opacity-60

                                    sm:h-10
                                    sm:text-sm
                                "
                            >
                                <span>
                                    {processing
                                        ? t(
                                              'auth:register.submitting',
                                          )
                                        : t(
                                              'auth:register.submit',
                                          )}
                                </span>

                                {!processing && <DirectionalArrowIcon className="h-3.5 w-3.5" />}
                            </button>
                        </form>

                        {/* SOCIAL LOGIN */}
                        <div className="w-full">
                            <SocialButtons />
                        </div>

                        {/* LOGIN LINK */}
                        <p
                            className="
                                mt-2
                                text-center
                                text-[10px]
                                text-slate-500
                                dark:text-slate-300
md:!text-slate-500
                                sm:mt-2.5
                                sm:text-xs
                            "
                        >
                            {t(
                                'auth:register.have_account',
                            )}{' '}

                            <Link
                                href={route('login')}
                                className="font-bold text-blue-600 hover:text-blue-700"
                            >
                                {t('auth:login.submit')}
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* DESKTOP FEATURES ONLY */}
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
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
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
   FIELD
===================================================== */

function Field({ icon, error, children }) {
    return (
        <div>
            <div className="relative">
                {icon}
                {children}
            </div>

            <InputError
                message={error}
                className="mt-0.5 text-[10px]"
            />
        </div>
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
   BASE ICON
===================================================== */

function BaseIcon({ children, isArabic }) {
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
                ${isArabic ? 'right-3' : 'left-3'}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            {children}
        </svg>
    );
}

function UserIcon({ isArabic }) {
    return (
        <BaseIcon isArabic={isArabic}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </BaseIcon>
    );
}

function MailIcon({ isArabic }) {
    return (
        <BaseIcon isArabic={isArabic}>
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <path d="m4 7 8 6 8-6" />
        </BaseIcon>
    );
}

function LockIcon({ isArabic }) {
    return (
        <BaseIcon isArabic={isArabic}>
            <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </BaseIcon>
    );
}

function CheckIcon({ isArabic }) {
    return (
        <BaseIcon isArabic={isArabic}>
            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="m8 12 2.5 2.5L16 9" />
        </BaseIcon>
    );
}

/* =====================================================
   PASSWORD VISIBILITY
===================================================== */

function VisibilityButton({
    visible,
    onClick,
    isArabic,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                absolute
                top-1/2
                -translate-y-1/2
                rounded-lg
                p-1
                text-blue-600
                transition
                hover:bg-blue-50
                ${isArabic ? 'left-2' : 'right-2'}
            `}
            aria-label={
                visible
                    ? 'Hide passwords'
                    : 'Show passwords'
            }
        >
            <svg
                className="h-4 w-4"
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

                {visible && (
                    <path d="m4 4 16 16" />
                )}
            </svg>
        </button>
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
