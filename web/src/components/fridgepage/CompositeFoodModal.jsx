import { useState, useEffect, useMemo } from "react";
import { getFridge, createCompositeFood, getScalesWeight } from "../../api/foods";
import { IconX, IconPlus, IconTrash } from "../Icons";

export default function CompositeFoodModal({ onClose, onSaved }) {
    const [name, setName] = useState("");
    const [rows, setRows] = useState([{ food_id: "", weight: "" }]);
    const [fridgeItems, setFridgeItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fetchingWeightRow, setFetchingWeightRow] = useState(null);

    useEffect(() => {
        let mounted = true;
        getFridge().then(data => { if (mounted) setFridgeItems(data); }).catch(() => { });
        return () => { mounted = false; };
    }, []);

    const addRow = () => setRows([...rows, { food_id: "", weight: "" }]);
    const removeRow = (i) => { if (rows.length <= 1) return; setRows(rows.filter((_, idx) => idx !== i)); };
    const updateRow = (i, key, val) => {
        const next = [...rows]; next[i][key] = val; setRows(next);
    };

    const availableForRow = (currentIdx) => {
        const takenIds = rows.map((r, idx) => (idx !== currentIdx && r.food_id) ? Number(r.food_id) : null).filter(Boolean);
        return fridgeItems.filter(f => !takenIds.includes(f.id));
    };

    const handleFetchWeight = async (rowIndex) => {
        setFetchingWeightRow(rowIndex);
        try {
            const data = await getScalesWeight();
            updateRow(rowIndex, "weight", data.weight_g.toString());
        } catch (e) {
            setError(`Ошибка весов: ${e.message}`);
        } finally {
            setFetchingWeightRow(null);
        }
    };

    const preview = useMemo(() => {
        let totalW = 0, totalCal = 0, totalP = 0, totalF = 0, totalC = 0;
        rows.forEach(r => {
            if (!r.food_id || !r.weight) return;
            const food = fridgeItems.find(f => f.id == r.food_id);
            if (!food) return;
            const w = parseFloat(r.weight);
            if (w <= 0) return;
            totalW += w;
            const f = w / 100;
            totalCal += (food.calories_per_100g || 0) * f;
            totalP += (food.protein_per_100g || 0) * f;
            totalF += (food.fat_per_100g || 0) * f;
            totalC += (food.carbs_per_100g || 0) * f;
        });
        const toPer100 = (v) => totalW > 0 ? Number((v / totalW * 100).toFixed(2)) : 0;
        return { totalW: Number(totalW.toFixed(1)), cal: toPer100(totalCal), p: toPer100(totalP), f: toPer100(totalF), c: toPer100(totalC) };
    }, [rows, fridgeItems]);

    const submit = async () => {
        if (!name.trim()) { setError("Введите название блюда"); return; }
        const validRows = rows.filter(r => r.food_id && r.weight && parseFloat(r.weight) > 0);
        if (validRows.length === 0) { setError("Добавьте хотя бы один ингредиент с весом"); return; }

        setSaving(true); setError("");
        try {
            const payload = {
                name: name.trim(),
                ingredients: validRows.map(r => ({ food_id: Number(r.food_id), weight_g: parseFloat(r.weight) }))
            };
            const created = await createCompositeFood(payload);
            onSaved(created, preview.totalW);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fafafa", color: "#1a1a1a", fontFamily: "inherit" };
    const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000030", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 520, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Составное блюдо</h2>
                    <button onClick={onClose} className="icon-button"><IconX /></button>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Название блюда *</label>
                    <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Например, Овсянка с ягодами" autoFocus />
                </div>

                <div style={{ maxHeight: "40vh", overflowY: "auto", marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", gap: 10, alignItems: "end", borderBottom: "1px solid #f0f0f0", paddingBottom: 8 }}>
                        <span style={labelStyle}>Ингредиент</span>
                        <span style={labelStyle}>Вес (г)</span>
                        <span style={{ ...labelStyle, visibility: "hidden" }}>.</span>
                    </div>
                    {rows.map((row, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 36px", gap: 10, alignItems: "end", marginTop: 10 }}>
                            <select style={inputStyle} value={row.food_id} onChange={e => updateRow(i, "food_id", e.target.value)}>
                                <option value="">— Выберите —</option>
                                {availableForRow(i).map(f => (
                                    <option key={f.id} value={f.id}>{f.name} (доступно: {f.weight_g}г)</option>
                                ))}
                            </select>
                            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                                <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" value={row.weight} onChange={e => updateRow(i, "weight", e.target.value)} placeholder="100" />
                                <button
                                    type="button"
                                    onClick={() => handleFetchWeight(i)}
                                    disabled={fetchingWeightRow === i}
                                    className="icon-button"
                                    style={{ width: 36, height: 36, marginBottom: 2 }}
                                    title="Получить вес с весов"
                                >
                                    {fetchingWeightRow === i ? "⏳" : "⚖️"}
                                </button>
                            </div>
                            <button type="button" className="icon-button" style={{ width: 36, height: 36, marginBottom: 2 }} onClick={() => removeRow(i)} disabled={rows.length <= 1}><IconTrash /></button>
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className="button" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}><IconPlus /> Добавить ингредиент</button>
                </div>

                {preview.totalW > 0 && (
                    <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#555", display: "flex", gap: 16, justifyContent: "center" }}>
                        <span>🍽 Итого: {preview.totalW}г</span>
                        <span>🔥 {preview.cal} ккал/100г</span>
                        <span>🥩 Б: {preview.p}</span>
                        <span>🧈 Ж: {preview.f}</span>
                        <span>🌾 У: {preview.c}</span>
                    </div>
                )}

                {error && <p style={{ color: "#d44", fontSize: 12, margin: "8px 0" }}>{error}</p>}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #e0e0e0", borderRadius: 8, background: "none", fontSize: 13, cursor: "pointer", color: "#555" }}>Отмена</button>
                    <button onClick={submit} disabled={saving} className="button">{saving ? "Создание..." : "Создать блюдо"}</button>
                </div>
            </div>
        </div>
    );
}