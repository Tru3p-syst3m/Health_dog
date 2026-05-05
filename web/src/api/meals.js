import { apiFetch } from "./client";
export const createMeal = (body) =>
    apiFetch("/meals/", { method: "POST", body: JSON.stringify(body) });