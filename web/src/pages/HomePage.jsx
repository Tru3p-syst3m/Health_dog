export default function HomePage({ onNavigate }) {
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 16, padding: 40,
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: 18, background: "#E1F5EE",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4C10 4 5 9 5 14c0 7 11 16 11 16s11-9 11-16c0-5-5-10-11-10z"
                        fill="#1D9E75" opacity="0.2" />
                    <path d="M16 4C10 4 5 9 5 14c0 7 11 16 11 16s11-9 11-16c0-5-5-10-11-10z"
                        stroke="#1D9E75" strokeWidth="1.5" fill="none" />
                    <circle cx="16" cy="14" r="4" fill="#1D9E75" />
                </svg>
            </div>

            <div style={{ textAlign: "center" }}>
                <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
                    Добро пожаловать
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: "#888", lineHeight: 1.7, maxWidth: 320 }}>
                    Это главный экран FoodAPI Dashboard. Здесь будет статистика и аналитика.
                    Пока — переходи в раздел продуктов.
                </p>
            </div>

            <button
                onClick={() => onNavigate("foods")}
                className="button"
            >
                Перейти к продуктам →
            </button>
        </div>
    );
}