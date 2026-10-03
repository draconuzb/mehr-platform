export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<{ status: number; body: T }> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  // credentials: refresh cookie (httpOnly) API tomonidan o'rnatiladi va yuboriladi
  const res = await fetch(`${API_URL}/v1${path}`, { ...init, headers, credentials: "include" });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : null) as T };
}
