export default function StatsPanel({ calories = 0, protein = 0, fat = 0, carbs = 0 }) {
    const items = [
        { label: "Ккал", value: Math.round(calories) },
        { label: "Белки", value: protein.toFixed(1) },
        { label: "Жиры", value: fat.toFixed(1) },
        { label: "Углеводы", value: carbs.toFixed(1) },
    ];

    return (
        <div style={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {items.map(({ label, value }) => (
                <div key={label} style={{
                    background: "#fff", border: "1px solid #f0f0f0",
                    borderRadius: 12, padding: "14px 18px",
                }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{value}</div>
                </div>
            ))}
        </div>
    );
}