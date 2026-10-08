import BrowseLayout from "@/Layouts/BrowseLayout";
import { Head, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

export default function TagsIndex({ tags }) {
    const { t } = useTranslation("posts");
    return (
        <BrowseLayout
            header={
                <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {t("tags.eyebrow")}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {t("tags.title")}
                    </h1>
                </div>
            }
        >
            <Head title="Kitabak" />
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                {tags.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                        {t("tags.empty")}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        {tags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={route("tags.show", tag.slug)}
                                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                #{tag.name}
                                <span className="ml-1 text-xs text-gray-400">
                                    ({tag.posts_count})
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </BrowseLayout>
    );
}
