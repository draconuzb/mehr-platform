"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "./api";

export type Role = "YOUTH" | "FAMILY_ADULT" | "GUARDIAN" | "COORDINATOR" | "MODERATOR" | "PSYCHOLOGIST" | "ADMIN";
export type SessionUser = { id: string; role: Role | null; status: string; locale: string };

type AuthState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "authed"; user: SessionUser; accessToken: string };

type AuthContextValue = {
  state: AuthState;
  /** Login yoki rol tanlangandan keyin yangi sessiyani o'rnatadi */
  setSession: (accessToken: string, user: SessionUser) => void;
  /** Access token bilan so'rov; 401 bo'lsa bir marta refresh qilib qaytadan urinadi */
  authFetch: <T>(path: string, init?: RequestInit) => Promise<{ status: number; body: T }>;
  logout: () => Promise<void>;
  /** Sessiyani serverdan qayta o'qish (masalan, rol boshqa tabda o'zgarganda) */
  refresh: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type RefreshResult = { accessToken: string; user: SessionUser } | null;

// Bitta tab ichida parallel refresh'larni birlashtiradi (masalan, React strict mode'da effekt ikki marta ishlaganda)
let inflight: Promise<RefreshResult> | null = null;

async function doRefresh(): Promise<RefreshResult> {
  const res = await fetch(`${API_URL}/v1/auth/refresh`, { method: "POST", credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as { accessToken: string; user: SessionUser };
}

/**
 * Refresh token har safar almashtiriladi, eski token qayta kelsa server barcha sessiyalarni bekor qiladi.
 * Shuning uchun refresh so'rovlari tablar o'rtasida Web Locks bilan navbatga qo'yiladi: ikkinchi tab
 * navbat kelganda allaqachon yangilangan cookie'ni yuboradi.
 */
function refreshSession(): Promise<RefreshResult> {
  if (!inflight) {
    const run = () => doRefresh().catch(() => null);
    const locked =
      typeof navigator !== "undefined" && "locks" in navigator
        ? navigator.locks.request("mehr-refresh", run)
        : run();
    inflight = locked.finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** JWT ichidagi exp (soniya) — faqat taymer uchun, tekshiruv serverda */
function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const stateRef = useRef(state);
  stateRef.current = state;

  const setSession = useCallback((accessToken: string, user: SessionUser) => {
    setState({ status: "authed", accessToken, user });
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    const r = await refreshSession();
    if (r) {
      setState({ status: "authed", accessToken: r.accessToken, user: r.user });
      return r.accessToken;
    }
    setState({ status: "anon" });
    return null;
  }, []);

  // Sahifa ochilganda: httpOnly refresh cookie orqali sessiyani tiklash
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Access token muddati tugashidan 1 daqiqa oldin yangilash
  useEffect(() => {
    if (state.status !== "authed") return;
    const exp = tokenExpiry(state.accessToken);
    if (!exp) return;
    const ms = Math.max(exp * 1000 - Date.now() - 60_000, 5_000);
    const id = setTimeout(() => void refresh(), ms);
    return () => clearTimeout(id);
  }, [state, refresh]);

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> => {
      const send = async (token: string | null) => {
        const headers = new Headers(init.headers);
        if (init.body) headers.set("content-type", "application/json");
        if (token) headers.set("authorization", `Bearer ${token}`);
        const res = await fetch(`${API_URL}/v1${path}`, { ...init, headers, credentials: "include" });
        const text = await res.text();
        return { status: res.status, body: (text ? JSON.parse(text) : null) as T };
      };
      const current = stateRef.current;
      const first = await send(current.status === "authed" ? current.accessToken : null);
      if (first.status !== 401) return first;
      const fresh = await refresh();
      return fresh ? send(fresh) : first;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    const current = stateRef.current;
    if (current.status === "authed") {
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { authorization: `Bearer ${current.accessToken}` },
      }).catch(() => undefined);
    }
    setState({ status: "anon" });
  }, []);

  const value = useMemo(
    () => ({ state, setSession, authFetch, logout, refresh }),
    [state, setSession, authFetch, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

/** Sahifa uchun kerakli holatga yo'naltirish: kirmagan → /login, rol yo'q → /onboarding/role */
export function nextPathFor(user: SessionUser): string {
  return user.role ? "/app" : "/onboarding/role";
}
