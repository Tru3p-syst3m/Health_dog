import { apiFetch } from "./client";

export const getFoods = () => apiFetch("/foods/");
export const getFridge = () => apiFetch("/foods/fridge/");

export const createFood = (body) =>
    apiFetch("/foods/", { method: "POST", body: JSON.stringify(body) });

export const updateFood = (id, body) =>
    apiFetch(`/foods/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const addToFridge = (id, body) =>
    apiFetch(`/foods/fridge/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteFood = (id) =>
    apiFetch(`/foods/${id}`, { method: "DELETE" });

export const deleteFromFridge = (id) =>
    apiFetch(`/foods/fridge/${id}`, { method: "DELETE" });

export const getScalesWeight = () => apiFetch("/scales/weight");