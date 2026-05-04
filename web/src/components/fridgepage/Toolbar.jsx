import { IconSearch, IconRefresh, IconPlus } from "../Icons";

export default function Toolbar({ search, onSearch, onRefresh, onAdd }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb" }}>
                    <IconSearch />
                </span>
                <input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Поиск по названию или категории..."
                    style={{
                        width: "100%", padding: "9px 12px 9px 36px",
                        border: "1px solid #e8e8e8", borderRadius: 9,
                        fontSize: 13, outline: "none",
                        background: "#fff", color: "#222", fontFamily: "inherit",
                    }}
                />
            </div>

            <button onClick={onRefresh} title="Обновить" className="icon-button">
                <IconRefresh />
            </button>

            <button onClick={onAdd} className="button">
                <IconPlus /> Добавить
            </button>
        </div>
    );
}