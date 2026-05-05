import { useState, useMemo } from 'react';
import { IconSearch, IconPlus } from "../Icons";

export default function DateSelector({ onChange, onLookup, onAdd, defaultValue, minYear, maxYear }) {
    const [date, setDate] = useState(defaultValue || { day: '', month: '', year: '' });
    const currentYear = new Date().getFullYear();

    const years = useMemo(
        () => Array.from({ length: (maxYear || currentYear) - (minYear || currentYear - 100) + 1 }, (_, i) => (minYear || currentYear - 100) + i),
        [minYear, maxYear]
    );

    const handleChange = (field, val) => {
        const updated = { ...date, [field]: val };
        setDate(updated);
        onChange?.(updated);
    };

    const options = [
        { key: 'day', label: 'День', arr: Array.from({ length: 31 }, (_, i) => i + 1) },
        { key: 'month', label: 'Месяц', arr: Array.from({ length: 12 }, (_, i) => i + 1) },
        { key: 'year', label: 'Год', arr: years }
    ];

    return (
        <div style={{ display: 'flex', gap: 8, padding: 10 }}>
            {options.map(({ key, label, arr }) => (
                <select key={key} value={date[key]} onChange={e => handleChange(key, e.target.value)} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px 18px", fontSize: 15, fontWeight: 350, color: "#111", width: 100, height: 50, textAlign: "center" }}>
                    <option value="">{label}</option>
                    {arr.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            ))}
            <button onClick={onLookup} title="Найти" className="icon-button" style={{ width: 50, height: 50 }}>
                <IconSearch />
            </button>
            <button onClick={onAdd} className="button">
                <IconPlus /> Добавить
            </button>
        </div >
    );
};