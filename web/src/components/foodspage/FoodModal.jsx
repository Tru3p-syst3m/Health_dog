import { useState } from "react";
import { CATEGORIES, EMPTY_FOOD_FORM } from "../../constants";
import { createFood, updateFood } from "../../api/foods";
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

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    async function submit() {
        if (!form.name.trim()) {
            setError("Заполни название");
            return;
        }
        setSaving(true);
        setError("");

        const body = {
            name: form.name.trim(),
            category: form.category || null,
            calories_per_100g: form.calories_per_100g !== "" ? parseFloat(form.calories_per_100g) : null,
            protein_per_100g: form.protein_per_100g !== "" ? parseFloat(form.protein_per_100g) : null,
            fat_per_100g: form.fat_per_100g !== "" ? parseFloat(form.fat_per_100g) : null,
            carbs_per_100g: form.carbs_per_100g !== "" ? parseFloat(form.carbs_per_100g) : null,
        };

        try {
            const saved = isEdit ? await updateFood(food.id, body) : await createFood(body);
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
                    <div>
                        <label style={labelStyle}>Название *</label>
                        <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Например, Яблоко" autoFocus />
                    </div>

                    <div style={{ gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Категория</label>
                            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.category} onChange={set("category")}>
                                <option value="">—</option>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Ккал / 100г</label>
                            <input style={inputStyle} type="number" value={form.calories_per_100g} onChange={set("calories_per_100g")} placeholder="52" />
                        </div>
                        <div>
                            <label style={labelStyle}>Белки / 100г</label>
                            <input style={inputStyle} type="number" value={form.protein_per_100g} onChange={set("protein_per_100g")} placeholder="0.3" />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Жиры / 100г</label>
                            <input style={inputStyle} type="number" value={form.fat_per_100g} onChange={set("fat_per_100g")} placeholder="0.2" />
                        </div>
                        <div>
                            <label style={labelStyle}>Углеводы / 100г</label>
                            <input style={inputStyle} type="number" value={form.carbs_per_100g} onChange={set("carbs_per_100g")} placeholder="13.8" />
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