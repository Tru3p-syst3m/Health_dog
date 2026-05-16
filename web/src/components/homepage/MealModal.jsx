import { useState, useEffect } from "react";
import { getFridge } from "../../api/foods";
import { IconX, IconPlus, IconTrash } from "../Icons";

export default function MealModal({ onClose, onSaved }) {
    const [fridgeItems, setFridgeItems] = useState([]);
    const [rows, setRows] = useState([{ id: "", weight: "", max: 0 }]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await getFridge();
                if (mounted) setFridgeItems(data);
            } catch (e) {
                if (mounted) setError(e.message);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const addRow = () => setRows([...rows, { id: "", weight: "", max: 0 }]);

    const removeRow = (i) => {
        setRows(rows.filter((_, idx) => idx !== i));
        if (error.includes("нельзя добавлять дважды")) setError("");
    };

    const updateRow = (i, key, val) => {
        const next = [...rows];
        next[i][key] = val;
        if (key === "id") {
            const idNum = Number(val);
            const item = fridgeItems.find(f => f.id === idNum);
            next[i].max = item ? item.weight_g : 0;
        }
        setRows(next);
    };

    const getAvailableOptions = (currentIdx) => {
        const takenIds = rows
            .map((r, idx) => (idx !== currentIdx && r.id) ? Number(r.id) : null)
            .filter(Boolean);
        return fridgeItems.filter(f => !takenIds.includes(f.id));
    };

    const submit = async () => {
        setError("");
        const validRows = rows.filter(r => r.id && r.weight);
        if (validRows.length === 0) {
            setError("Добавь хотя бы один продукт с весом");
            return;
        }

        const ids = validRows.map(r => Number(r.id));
        if (new Set(ids).size !== ids.length) {
            setError("Один и тот же продукт нельзя добавлять дважды");
            return;
        }

        for (const r of validRows) {
            const w = parseFloat(r.weight);
            if (isNaN(w) || w <= 0) {
                setError("Вес должен быть положительным числом");
                return;
            }
            if (w > r.max) {
                const item = fridgeItems.find(f => f.id === r.id);
                setError(`Недостаточно "${item?.name}" в холодильнике`);
                return;
            }
        }

        setSaving(true);
        try {
            onSaved(validRows.map(r => ({
                fridge_id: Number(r.id),
                consumed_g: parseFloat(r.weight)
            })));
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
        borderRadius: 8, fontSize: 13, outline: "none", background: "#fafafa",
        color: "#1a1a1a", fontFamily: "inherit"
    };
    const labelStyle = {
        display: "block", fontSize: 11, fontWeight: 600, color: "#888",
        marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase"
    };

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "#00000030",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
                width: 480, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 0
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111" }}>Новый приём пищи</h2>
                    <button onClick={onClose} className="icon-button"><IconX /></button>
                </div>

                {/* Dynamic List */}
                <div style={{ display: "flex", flexDirection: "column", maxHeight: "60vh", overflowY: "auto" }}>
                    {/* Шапка столбцов */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 100px 36px",
                        gap: 10,
                        alignItems: "end",
                        borderBottom: "1px solid #f0f0f0"
                    }}>
                        <span style={{ ...labelStyle, marginBottom: 0 }}>Продукт</span>
                        <span style={{ ...labelStyle, marginBottom: 0 }}>Вес (г)</span>
                        <span style={{ ...labelStyle, marginBottom: 0, visibility: "hidden" }}>.</span>
                    </div>

                    {rows.map((row, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 36px", gap: 10, alignItems: "end" }}>
                            <div>
                                <select
                                    style={inputStyle}
                                    value={row.id}
                                    onChange={e => updateRow(i, "id", e.target.value)}
                                >
                                    <option value="">— Выберите —</option>
                                    {getAvailableOptions(i).map(f => (
                                        <option key={f.id} value={f.id}>{f.name} (доступно: {f.weight_g}г)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <input style={inputStyle} type="number" min="0" value={row.weight}
                                    onChange={e => updateRow(i, "weight", e.target.value)} placeholder="50" />
                            </div>
                            <div>
                                <label style={{ ...labelStyle, visibility: "hidden" }}>.</label>
                                <button type="button" className="icon-button" style={{ width: 36, height: 36, marginBottom: 2 }}
                                    onClick={() => removeRow(i)} disabled={rows.length <= 1} title="Удалить строку">
                                    <IconTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addRow} className="button" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
                    <IconPlus /> Добавить продукт
                </button>

                {error && <p style={{ color: "#d44", fontSize: 12, margin: "12px 0 0" }}>{error}</p>}

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} style={{
                        padding: "9px 18px", border: "1px solid #e0e0e0", borderRadius: 8,
                        background: "none", fontSize: 13, cursor: "pointer", color: "#555"
                    }}>Отмена</button>
                    <button onClick={submit} disabled={saving} className="button">
                        {saving ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
}