export default function EmptyState({ title, message, action = null }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg></div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
            {message && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
