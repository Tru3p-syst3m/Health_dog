export default function StatsPanel({ count, totalKcal }) {
    const items = [
        { label: "Всего продуктов", value: count },
        { label: "Суммарно ккал", value: totalKcal },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, tableLayout: "fixed" }}>
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