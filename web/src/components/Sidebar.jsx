import { IconHome, IconList } from "./Icons";
import '../styles/blocks.css';
const NAV_ITEMS = [
    { id: "home", label: "Главная", icon: <IconHome /> },
    { id: "foods", label: "Все продукты", icon: <IconList /> },
    { id: "fridge", label: "Холодильник", icon: <IconHome /> },
];

export default function Sidebar({ open, page, onNavigate }) {
    return (
        <aside
            className="sidebar"
            style={{
                width: open ? 220 : 0,
                minWidth: open ? 220 : 0,
            }}>
            {/* Logo */}
            <div className="header">
                <div >
                    Health dog
                </div>
            </div>

            <nav style={{ padding: "10px 8px", flex: 1 }}>
                {NAV_ITEMS.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className="button"
                        style={{
                            width: "100%",
                            background: page === id ? "#E1F5EE" : "transparent",
                            color: "#666",
                        }}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </nav>
        </aside>
    );
}