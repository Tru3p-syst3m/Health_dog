import { useState, useEffect } from "react";
import { CATEGORIES, EMPTY_FOOD_FORM } from "../../constants";
import { createFood, addToFridge, getFoods } from "../../api/foods";
import { IconX } from "../Icons";

export default function FoodModal({ food, onClose, onSaved }) {
    const isEdit = !!food?.id;

    const [form, setForm] = useState(
        food
            ? {
                ...food,
                category: food.category ?? "",
                calories_per_100g: food.calories_per_100g ?? "",
                protein_per_100g: food.protein_per_100g ?? "",
                fat_per_100g: food.fat_per_100g ?? "",
                carbs_per_100g: food.carbs_per_100g ?? "",
            }
            : EMPTY_FOOD_FORM
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (form.name.length < 2) { setSuggestions([]); return; }
        const t = setTimeout(async () => {
            const all = await getFoods();
            const matches = all.filter(f =>
                f.name.toLowerCase().includes(form.name.toLowerCase()) && f.id !== food?.id
            ).slice(0, 5);
            setSuggestions(matches);
            setShowSuggestions(true);
        }, 200);
        return () => clearTimeout(t);
    }, [form.name]);

    const fillFromSuggestion = (s) => {
        setForm(f => ({
            ...f, name: s.name, category: s.category ?? "",
            calories_per_100g: s.calories_per_100g ?? "",
            protein_per_100g: s.protein_per_100g ?? "",
            fat_per_100g: s.fat_per_100g ?? "",
            carbs_per_100g: s.carbs_per_100g ?? "",
            weight_g: ""
        }));
        setShowSuggestions(false); setSuggestions([]);
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    async function submit() {
        if (!form.name.trim() || !form.weight_g) {
            setError("Заполни название и вес");
            return;
        }
        setSaving(true);
        setError("");

        const nameVal = form.name.trim();
        const weightVal = parseFloat(form.weight_g);

        try {
            if (weightVal <= 0 || isNaN(weightVal)) {
                setError("Вес должен быть положительным числом");
                setSaving(false);
                return;
            }
            const all = await getFoods();
            const target = all.find(f => f.name.toLowerCase() === nameVal.toLowerCase());

            if (!target) {
                setError("Продукт не найден в справочнике");
                return;
            }

            const saved = await addToFridge(target.id, { weight_g: weightVal });
            onSaved(saved, isEdit);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    const inputStyle = {
        width: "100%", padding: "8px 10px",
        border: "1px solid #e0e0e0", borderRadius: 8,
        fontSize: 13, outline: "none",
        background: "#fafafa", color: "#1a1a1a",
        fontFamily: "inherit",
    };
    const labelStyle = {
        display: "block", fontSize: 11, fontWeight: 600,
        color: "#888", marginBottom: 4,
        letterSpacing: "0.06em", textTransform: "uppercase",
    };

    return (
        // Under window
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "#00000030",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
                    width: 400,
                    display: "flex", flexDirection: "column", gap: 0,
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111" }}>
                        {isEdit ? "Редактировать продукт" : "Новый продукт"}
                    </h2>
                    <button onClick={onClose} className="icon-button">
                        <IconX />
                    </button>
                </div>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                        <label style={labelStyle}>Название *</label>
                        <input
                            style={inputStyle}
                            value={form.name}
                            onChange={(e) => { set("name")(e); setShowSuggestions(true); }}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            placeholder="Начни вводить..."
                            autoFocus
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul style={{
                                position: "absolute", top: "100%", left: 0, right: 0,
                                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
                                margin: "4px 0 0", padding: 0, listStyle: "none",
                                zIndex: 10, maxHeight: 200, overflowY: "auto",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}>
                                {suggestions.map(s => (
                                    <li
                                        key={s.id}
                                        onClick={() => fillFromSuggestion(s)}
                                        style={{
                                            padding: "8px 12px", cursor: "pointer", fontSize: 13,
                                            borderBottom: "1px solid #f5f5f5",
                                            background: "#fff", color: "#222"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8f8f8"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                                    >
                                        {s.name} <span style={{ color: "#aaa" }}>· {s.category || "—"}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Вес (г) *</label>
                            <input style={inputStyle} type="number" value={form.weight_g} onChange={set("weight_g")} placeholder="150" />
                        </div>
                    </div>
                </div>

                {error && <p style={{ color: "#d44", fontSize: 12, margin: "10px 0 0" }}>{error}</p>}

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} style={{
                        padding: "9px 18px", border: "1px solid #e0e0e0", borderRadius: 8,
                        background: "none", fontSize: 13, cursor: "pointer", color: "#555",
                    }}>
                        Отмена
                    </button>
                    <button onClick={submit} disabled={saving} className="button">
                        {saving ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
}