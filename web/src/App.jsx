import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { IconMenu } from "./components/Icons";
import HomePage from "./pages/HomePage";
import FoodsPage from "./pages/FoodsPage";
import FridgePage from "./pages/FridgePage";
import './styles/buttons.css';
import './styles/blocks.css';

const PAGE_TITLES = {
    home: "Главная",
    foods: "Все продукты",
    fridge: "Мой холодильник",
};

export default function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [page, setPage] = useState("foods");

    return (
        <div style={{
            display: "flex", height: "100vh",
            background: "#f7f7f5",
            fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        }}>
            <Sidebar open={sidebarOpen} page={page} onNavigate={setPage} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
                <header className="header">
                    <button
                        className="icon-button"
                        style={{ width: 32, height: 32 }}
                        onClick={() => setSidebarOpen((v) => !v)}
                    >
                        <IconMenu />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                        {PAGE_TITLES[page]}
                    </span>
                </header>

                <main style={{ flex: 1, overflowY: "auto" }}>
                    {page === "home" && <HomePage />}
                    {page === "fridge" && <FridgePage />}
                    {page === "foods" && <FoodsPage />}
                </main>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        button:focus-visible { outline: 2px solid #1D9E75; outline-offset: 2px; }
        input:focus {
          border-color: #1D9E75 !important;
          box-shadow: 0 0 0 3px rgba(29,158,117,0.12) !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
      `}</style>
        </div>
    );
}