import { useState, useEffect, useCallback, Fragment } from "react";
import StatsPanel from "../components/homepage/StatsPanel";
import MealModal from "../components/homepage/MealModal";
import DateSelector from "../components/homepage/DateSelector";
import { getMeals } from "../api/meals";
import { createMeal } from "../api/meals";
import Toast from "../components/Toast";
import '../styles/buttons.css';

export default function HomePage() {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState("");

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    };

    const loadMeals = useCallback(async (date) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMeals(date);
            setMeals(data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMeals(todayStr); }, []);

    const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

    const handleSaved = async (mealItems) => {
        try {
            await createMeal({ items: mealItems });
            setModal(null);
            showToast("Приём пищи добавлен");
            loadMeals(todayStr);
        } catch (e) {
            showToast("Ошибка: " + e.message);
        }
    };

    const sortedMeals = [...meals].sort((a, b) => new Date(a.eaten_at) - new Date(b.eaten_at));

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
    const tdSubStyle = {
        ...tdStyle, background: "#fafafa", fontSize: 12, color: "#444"
    };

    return (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 className="homepage_header">Статистика за сегодня</h1>

            <StatsPanel count={1200} totalKcal={2500} />

            <DateSelector
                onChange={(d) => {
                    const dateStr = d.year && d.month && d.day
                        ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
                        : todayStr;
                    setSelectedDate(dateStr);
                    loadMeals(dateStr);
                }}
                onLookup={() => loadMeals(selectedDate)}
                onAdd={() => setModal(true)}
                defaultValue={{
                    day: now.getDate(),
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                }}
            />

            {/* Таблица приёмов пищи */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, overflow: "hidden" }}>
                {loading && <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 13 }}>Загрузка...</div>}
                {error && <div style={{ padding: 40, textAlign: "center", color: "#d44", fontSize: 13 }}>Ошибка: {error}</div>}

                {!loading && !error && (
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Название</th>
                                <th style={thStyle}>Ккал</th>
                                <th style={thStyle}>Белки</th>
                                <th style={thStyle}>Жиры</th>
                                <th style={thStyle}>Углеводы</th>
                                <th style={{ ...thStyle, width: 100 }}>Время</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMeals.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 13 }}>
                                        Приёмов пищи за этот день пока нет
                                    </td>
                                </tr>
                            )}

                            {sortedMeals.map((meal, idx) => (
                                <Fragment key={meal.id}>
                                    {/* Основная строка приёма пищи */}
                                    <tr
                                        onClick={() => toggleExpand(meal.id)}
                                        style={{ cursor: "pointer", transition: "background 0.1s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8f8")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                                            Приём пищи #{idx + 1}
                                        </td>
                                        <td style={tdStyle}>{meal.total_calories}</td>
                                        <td style={tdStyle}>{meal.total_protein}</td>
                                        <td style={tdStyle}>{meal.total_fat}</td>
                                        <td style={tdStyle}>{meal.total_carbs}</td>
                                        <td style={tdStyle}>
                                            {new Date(meal.eaten_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                    </tr>

                                    {/* Раскрывающаяся строка с продуктами */}
                                    {expandedId === meal.id && meal.items?.length > 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 0 }}>
                                                <div style={{ padding: "12px 14px", background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Продукт</th>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Вес (г)</th>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Ккал</th>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Белки</th>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Жиры</th>
                                                                <th style={{ ...thStyle, background: "transparent", fontSize: 10, padding: "6px 14px" }}>Углеводы</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {meal.items.map(item => (
                                                                <tr key={item.id}>
                                                                    <td style={{ ...tdSubStyle, fontWeight: 500 }}>{item.food_name || "Удалённый продукт"}</td>
                                                                    <td style={tdSubStyle}>{item.weight_consumed_g}</td>
                                                                    <td style={tdSubStyle}>{item.calories}</td>
                                                                    <td style={tdSubStyle}>{item.protein}</td>
                                                                    <td style={tdSubStyle}>{item.fat}</td>
                                                                    <td style={tdSubStyle}>{item.carbs}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal && (
                <MealModal
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                />
            )}
            <Toast msg={toast} />
        </div>
    );
}