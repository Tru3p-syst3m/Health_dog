import { apiFetch } from "./client";

export const getMeals = (date) => {
    const params = date ? `?date=${date}` : "";
    return apiFetch(`/meals/${params}`);
};

export const createMeal = (body) =>
    apiFetch("/meals/", { method: "POST", body: JSON.stringify(body) });