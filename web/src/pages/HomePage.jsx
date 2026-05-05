import { useState, useCallback } from "react";
import StatsPanel from "../components/homepage/StatsPanel";
import DateSelector from "../components/homepage/DateSelector";
export default function HomePage() {
    const [curentdata, setCurentdata] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const lookup = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getFoods();
            setCurentdata(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

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
                <DateSelector
                    defaultValue={today}
                    onChange={setSelected}
                    onLookup={lookup}
                />
            </div>


        </div>
    );
}