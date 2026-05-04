import { useState, useEffect, useCallback } from "react";
import { getFoods, deleteFood } from "../api/foods";
import Toast from "../components/Toast";
import CategoryBadge from "../components/foodspage/CategoryBadge";
import FoodModal from "../components/foodspage/FoodModal";
import Toolbar from "../components/foodspage/Toolbar";
import { IconPlus, IconEdit, IconTrash, IconSearch, IconRefresh } from "../components/Icons";
import '../styles/buttons.css';

export default function FoodsPage() {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null); // null | {} (new) | food (edit)
    const [toast, setToast] = useState("");
    const [deleting, setDeleting] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getFoods();
            setFoods(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function handleSaved(saved, isEdit) {
        if (isEdit) setFoods((f) => f.map((x) => (x.id === saved.id ? saved : x)));
        else setFoods((f) => [...f, saved]);
        setModal(null);
        showToast(isEdit ? "Продукт обновлён" : "Продукт добавлен");
    }

    async function handleDelete(id) {
        setDeleting(id);
        try {
            await deleteFood(id);
            setFoods((f) => f.filter((x) => x.id !== id));
            showToast("Удалено");
        } catch (e) {
            showToast("Ошибка: " + e.message);
        } finally {
            setDeleting(null);
        }
    }

    const filtered = foods.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.category ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const thStyle = {
        padding: "10px 14px", textAlign: "left",
        fontSize: 11, fontWeight: 700, color: "#999",
        letterSpacing: "0.06em", textTransform: "uppercase",
        background: "#fafafa", borderBottom: "1px solid #f0f0f0",
    };
    const tdStyle = {
        padding: "11px 14px", fontSize: 13,
        color: "#222", borderBottom: "1px solid #f5f5f5",
    };

    return (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Toolbar */}
            <Toolbar
                search={search}
                onSearch={setSearch}
                onRefresh={load}
                onAdd={() => setModal({})}
            />

            {/* Table */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, overflow: "hidden" }}>
                {loading && (
                    <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 13 }}>Загрузка...</div>
                )}

                {error && (
                    <div style={{ padding: 40, textAlign: "center", color: "#d44", fontSize: 13 }}>
                        Ошибка: {error}.<br />
                        <span style={{ color: "#aaa" }}>Убедись, что сервер запущен на localhost:8000</span>
                    </div>
                )}

                {!loading && !error && (
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: 40 }}>#</th>
                                <th style={thStyle}>Название</th>
                                <th style={thStyle}>Категория</th>
                                <th style={thStyle}>Ккал/100г</th>
                                <th style={thStyle}>Белки</th>
                                <th style={thStyle}>Жиры</th>
                                <th style={thStyle}>Углеводы</th>
                                <th style={{ ...thStyle, width: 130 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 13 }}>
                                        {search ? "Ничего не найдено" : "База пуста — добавь первый продукт"}
                                    </td>
                                </tr>
                            )}
                            {filtered.map((f) => (
                                <tr
                                    key={f.id}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    style={{ transition: "background 0.1s" }}
                                >
                                    <td style={{ ...tdStyle, color: "#ccc", fontSize: 11 }}>{f.id}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{f.name}</td>
                                    <td style={tdStyle}><CategoryBadge cat={f.category} /></td>
                                    <td style={tdStyle}>{f.calories_per_100g ?? "—"}</td>
                                    <td style={tdStyle}>{f.protein_per_100g ?? "—"}</td>
                                    <td style={tdStyle}>{f.fat_per_100g ?? "—"}</td>
                                    <td style={tdStyle}>{f.carbs_per_100g ?? "—"}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <button
                                                onClick={() => setModal(f)}
                                                title="Редактировать"
                                                className="icon-button"
                                            >
                                                <IconEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(f.id)}
                                                disabled={deleting === f.id}
                                                title="Удалить"
                                                className="icon-button"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {
                modal !== null && (
                    <FoodModal
                        food={Object.keys(modal).length ? modal : null}
                        onClose={() => setModal(null)}
                        onSaved={handleSaved}
                    />
                )
            }

            <Toast msg={toast} />
        </div >
    );
}