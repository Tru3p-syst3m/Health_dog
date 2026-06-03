const API = "http://192.168.3.2:8000";

export async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...opts,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    if (res.status === 204) return null;
    return res.json();
}