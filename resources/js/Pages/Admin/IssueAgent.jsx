import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminTabs from '@/Components/AdminTabs';

const statusClasses = {
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    failed: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
    processing: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    duplicate_candidate: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    needs_clarification: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
};

function formatDate(value) {
    if (!value) return '—';

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function AiPreview({ result }) {
    if (!result) {
        return <span className="text-slate-400">â€”</span>;
    }

    const labels = Array.isArray(result.suggested_labels)
        ? result.suggested_labels.slice(0, 3)
        : [];

    return (
        <div className="max-w-md space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">
                {result.title || 'Untitled issue'}
            </div>
            {result.actionable === false && (
                <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                    Needs more detail
                </div>
            )}
            <div className="flex flex-wrap gap-1">
                {[result.type, result.priority, result.module, ...labels]
                    .filter(Boolean)
                    .map((item) => (
                        <span
                            key={item}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                            {item}
                        </span>
                    ))}
            </div>
            {result.summary && (
                <div className="max-h-10 overflow-hidden text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {result.summary}
                </div>
            )}
        </div>
    );
}

function ReporterCell({ request }) {
    const reporterName = request.payload?.reporter_name || request.payload?.reporter || null;
    const reporterId = request.slack_user_id || request.payload?.reporter_user_id || null;

    if (!reporterName && !reporterId) {
        return '—';
    }

    return (
        <div className="space-y-0.5">
            <div className="font-medium text-slate-800 dark:text-slate-100">
                {reporterName || reporterId}
            </div>
            {reporterName && reporterId && reporterName !== reporterId && (
                <div className="text-xs text-slate-400">
                    {reporterId}
                </div>
            )}
        </div>
    );
}

function RepositoryCell({ request }) {
    if (!request.github_owner && !request.github_repository) {
        return '—';
    }

    return (
        <div className="whitespace-nowrap">
            <div className="font-medium text-slate-800 dark:text-slate-100">
                {request.github_repository || '—'}
            </div>
            {request.github_owner && (
                <div className="text-xs text-slate-400">
                    {request.github_owner}
                </div>
            )}
        </div>
    );
}

export default function IssueAgent({ auth, requests }) {
    const rows = requests?.data ?? [];
    const [selectedAi, setSelectedAi] = useState(null);

    const retry = (id) => {
        router.post(route('admin.issue-agent.retry', id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Administration
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                            Issue Agent
                        </h1>
                    </div>
                    <AdminTabs active="issue-agent" />
                </div>
            }
        >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Repository</th>
                                    <th className="px-4 py-3">Reporter</th>
                                    <th className="px-4 py-3">Issue</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">AI model</th>
                                    <th className="px-4 py-3">Error</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map((request) => (
                                    <tr key={request.id} className="text-slate-700 dark:text-slate-200">
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td className="px-4 py-3 capitalize">
                                            {request.source}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RepositoryCell request={request} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <ReporterCell request={request} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {request.github_issue_url ? (
                                                <a
                                                    href={request.github_issue_url}
                                                    className="font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    #{request.github_issue_number}
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[request.status] ?? statusClasses.pending}`}>
                                                {request.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {request.ai_model || '—'}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3" title={request.error_message || ''}>
                                            {request.error_message || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {request.ai_result && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedAi(request)}
                                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        View AI
                                                    </button>
                                                )}

                                                {request.status === 'failed' && !request.github_issue_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() => retry(request.id)}
                                                        className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                                                    >
                                                        Retry
                                                    </button>
                                                )}

                                                {!request.ai_result && request.status !== 'failed' && '—'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-10 text-center text-slate-500" colSpan="9">
                                            No Issue Agent requests yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {requests?.links?.length > 3 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {requests.links.map((link, index) => (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded-md px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                        : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800'
                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedAi && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    AI generated issue
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                                    {selectedAi.ai_result?.title || 'Untitled issue'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAi(null)}
                                className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-5 px-6 py-5 text-sm text-slate-700 dark:text-slate-200">
                            <AiPreview result={selectedAi.ai_result} />

                            {selectedAi.ai_result?.actionable === false && (
                                <section className="rounded-md bg-orange-50 p-4 text-orange-900 dark:bg-orange-950 dark:text-orange-100">
                                    <h3 className="font-semibold">
                                        Needs clarification
                                    </h3>
                                    <p className="mt-2">
                                        {selectedAi.ai_result?.rejection_reason || 'The report does not contain enough detail to create a useful issue.'}
                                    </p>
                                    {selectedAi.ai_result?.clarifying_question && (
                                        <p className="mt-3 font-medium">
                                            {selectedAi.ai_result.clarifying_question}
                                        </p>
                                    )}
                                </section>
                            )}

                            {selectedAi.ai_result?.steps_to_reproduce?.length > 0 && (
                                <section>
                                    <h3 className="font-semibold text-slate-950 dark:text-white">
                                        Steps to reproduce
                                    </h3>
                                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                                        {selectedAi.ai_result.steps_to_reproduce.map((step, index) => (
                                            <li key={`${step}-${index}`}>{step}</li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <section>
                                    <h3 className="font-semibold text-slate-950 dark:text-white">
                                        Expected behavior
                                    </h3>
                                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                                        {selectedAi.ai_result?.expected_behavior || 'Not provided.'}
                                    </p>
                                </section>
                                <section>
                                    <h3 className="font-semibold text-slate-950 dark:text-white">
                                        Actual behavior
                                    </h3>
                                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                                        {selectedAi.ai_result?.actual_behavior || 'Not provided.'}
                                    </p>
                                </section>
                            </div>

                            {selectedAi.ai_result?.additional_information && (
                                <section>
                                    <h3 className="font-semibold text-slate-950 dark:text-white">
                                        Additional information
                                    </h3>
                                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                                        {selectedAi.ai_result.additional_information}
                                    </p>
                                </section>
                            )}

                            <div className="grid gap-4 border-t border-slate-200 pt-4 text-xs dark:border-slate-800 md:grid-cols-3">
                                <div>
                                    <span className="font-semibold text-slate-500">Platform</span>
                                    <div>{selectedAi.ai_result?.platform || 'Unknown'}</div>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-500">Module</span>
                                    <div>{selectedAi.ai_result?.module || 'Unknown'}</div>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-500">Confidence</span>
                                    <div>{selectedAi.ai_result?.confidence ?? '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
