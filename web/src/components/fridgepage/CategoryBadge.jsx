import { CAT_COLORS } from "../../constants";

export default function CategoryBadge({ cat }) {
    if (!cat) return <span style={{ color: "#aaa", fontSize: 12 }}>—</span>;
    const { bg, color } = CAT_COLORS[cat] ?? CAT_COLORS["другое"];
    return (
        <span style={{
            background: bg, color,
            fontSize: 11, padding: "2px 8px",
            borderRadius: 99, fontWeight: 500,
            letterSpacing: "0.02em",
        }}>
            {cat}
        </span>
    );
}