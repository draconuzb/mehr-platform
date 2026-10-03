"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { nextPathFor, useAuth, type SessionUser } from "@/lib/auth";

type Start = { loginId: string; pollToken: string; deepLink: string; expiresAt: string };
type Poll = { status: "PENDING" | "EXPIRED" } | { status: "OK"; accessToken: string; user: SessionUser };

type View = { kind: "loading" } | { kind: "ready"; start: Start } | { kind: "error"; message: string };

const POLL_MS = 2000;

export default function LoginPage() {
  const router = useRouter();
  const { state, setSession } = useAuth();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [opened, setOpened] = useState(false);
  const startRef = useRef<Start | null>(null);
  const startedRef = useRef(false);

  // Allaqachon kirgan bo'lsa — kerakli sahifaga
  useEffect(() => {
    if (state.status === "authed") router.replace(nextPathFor(state.user));
  }, [state, router]);

  const begin = useCallback(async () => {
    setView({ kind: "loading" });
    setOpened(false);
    try {
      const r = await apiFetch<Start>("/auth/telegram/start", { method: "POST" });
      if (r.status === 503) return setView({ kind: "error", message: "Telegram bot hali sozlanmagan." });
      if (r.status === 429) return setView({ kind: "error", message: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring." });
      if (r.status !== 201) return setView({ kind: "error", message: "Serverga ulanib bo'lmadi." });
      startRef.current = r.body;
      setView({ kind: "ready", start: r.body });
    } catch {
      setView({ kind: "error", message: "Serverga ulanib bo'lmadi. Internetni tekshiring." });
    }
  }, []);

  // Kirish so'rovi faqat sessiya yo'qligi aniq bo'lgandan keyin va bir marta yaratiladi
  useEffect(() => {
    if (state.status !== "anon" || startedRef.current) return;
    startedRef.current = true;
    void begin();
  }, [state.status, begin]);

  // Telegram'da tasdiqlanishini kutish (foydalanuvchi Telegram'dan qaytganda ham davom etadi)
  useEffect(() => {
    if (view.kind !== "ready") return;
    let stopped = false;
    const tick = async () => {
      const s = startRef.current;
      if (!s || stopped || document.visibilityState === "hidden") return;
      const r = await apiFetch<Poll>("/auth/telegram/poll", {
        method: "POST",
        body: JSON.stringify({ loginId: s.loginId, pollToken: s.pollToken }),
      }).catch(() => null);
      if (!r || stopped) return;
      if (r.body?.status === "EXPIRED") return void begin();
      if (r.body?.status === "OK") {
        stopped = true;
        setSession(r.body.accessToken, r.body.user);
        router.replace(nextPathFor(r.body.user));
      }
    };
    const id = setInterval(() => void tick(), POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [view.kind, begin, setSession, router]);

  return (
    <main className="wrap">
      <a href="/" className="hint">← Bosh sahifa</a>
      <h1>Kirish</h1>

      {(view.kind === "loading" || state.status !== "anon") && <p className="lead">Tayyorlanmoqda…</p>}

      {view.kind === "ready" && state.status === "anon" && (
        <>
          <p className="lead">
            Kirish va ro'yxatdan o'tish Telegram orqali. Raqamingizni Telegram tasdiqlaydi, SMS kerak emas.
          </p>
          <a className="btn" href={view.start.deepLink} target="_blank" rel="noopener" onClick={() => setOpened(true)}>
            ✈ Telegram orqali kirish
          </a>
          {opened && (
            <p className="hint">
              Telegram'da <b>Start</b> tugmasini bosing. Birinchi marta kirayotgan bo'lsangiz, raqamingizni yuborish so'raladi.
              Keyin shu sahifaga qayting, kirish o'zi davom etadi.
            </p>
          )}
        </>
      )}

      {view.kind === "error" && (
        <>
          <p className="lead">{view.message}</p>
          <button className="btn sec" onClick={() => void begin()}>
            Qayta urinish
          </button>
        </>
      )}
    </main>
  );
}
