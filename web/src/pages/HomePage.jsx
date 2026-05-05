import { useState } from "react";
import StatsPanel from "../components/homepage/StatsPanel";
import DateSelector from "../components/homepage/DateSelector";
export default function HomePage() {
    const [selected, setSelected] = useState(null);
    const today = {
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    };

    return (
        <div>
            <h1 className="homepage_header">Статистика за сегодня</h1>
            <StatsPanel count={1200} totalKcal={2500} />
            <div>
                <DateSelector defaultValue={today} onChange={setSelected} />
            </div>


        </div>
    );
}