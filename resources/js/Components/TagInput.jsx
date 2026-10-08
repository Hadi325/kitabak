import { useState } from 'react';

export default function TagInput({ value = [], onChange, max = 15 }) {
    const [text, setText] = useState('');

    const add = (raw) => {
        const cleaned = raw
            .split(',')
            .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
            .filter(Boolean);
        const next = Array.from(new Set([...value, ...cleaned])).slice(0, max);
        onChange(next);
        setText('');
    };

    const remove = (t) => onChange(value.filter((x) => x !== t));

    return (
        <div className="rounded border border-gray-300 bg-white px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-1">
                {value.map((t) => (
                    <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
                    >
                        #{t}
                        <button
                            type="button"
                            onClick={() => remove(t)}
                            className="text-indigo-400 hover:text-indigo-700"
                        >
                            ✕
                        </button>
                    </span>
                ))}
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            if (text.trim()) add(text);
                        } else if (e.key === 'Backspace' && !text && value.length) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => text.trim() && add(text)}
                    placeholder={value.length === 0 ? 'before-after, ...' : ''}
                    className="min-w-[8rem] flex-1 border-0 p-1 text-sm focus:ring-0"
                />
            </div>
        </div>
    );
}
