import "../css/app.css";
import "./bootstrap";
import "./i18n";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

const savedTheme = localStorage.getItem("app_theme");
const selectedTheme =
    savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
        ? savedTheme
        : "system";
const initialTheme =
    selectedTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
        : selectedTheme;
document.documentElement.classList.toggle("dark", initialTheme === "dark");
document.documentElement.style.colorScheme = initialTheme;

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

// Pages can register a synchronous browser-back guard here. This listener is
// installed before Inertia initializes its own popstate handler, so Android
// Back, iOS Safari Back/swipe, and desktop browser Back can be handled without
// Inertia remounting the page and clearing local form/File state first.
window.addEventListener(
    "popstate",
    (event) => {
        const guard = window.__kitabakBrowserBackGuard;

        if (typeof guard === "function" && guard(event) === true) {
            event.stopImmediatePropagation();
        }
    },
    true,
);

createInertiaApp({
    title: () => "Kitabak",
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
