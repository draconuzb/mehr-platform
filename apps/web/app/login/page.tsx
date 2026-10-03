"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type Start = { loginId: string; pollToken: string; deepLink: string; expiresAt: string };
type Poll =
  | { status: "PENDING" | "EXPIRED" }
  | { status: "OK"; accessToken: string; user: { id: string; role: string | null; status: string } };
type Me = { phone: string; role: string | null; status: string };

type View =
  | { kind: "loading" }
  | { kind: "ready"; start: Start }
  | { kind: "done"; me: Me }
  | { kind: "error"; message: string };

const POLL_MS = 2000;

export default function LoginPage() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [opened, setOpened] = useState(false);
  const startRef = useRef<Start | null>(null);

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

  useEffect(() => {
    void begin();
  }, [begin]);

  // Telegram'da tasdiqlanishini kutish. iOS'da foydalanuvchi Telegram'dan qaytganda sahifa
  // qayta faollashadi — interval o'sha paytda ham ishlashda davom etadi.
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
        const me = await apiFetch<Me>("/me", { token: r.body.accessToken });
        setView({ kind: "done", me: me.body });
      }
    };
    const id = setInterval(() => void tick(), POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [view.kind, begin]);

  return (
    <main className="wrap">
      <a href="/" className="hint">← Bosh sahifa</a>
      <h1>Kirish</h1>

      {view.kind === "loading" && <p className="lead">Tayyorlanmoqda…</p>}

      {view.kind === "ready" && (
        <>
          <p className="lead">
            Kirish va ro'yxatdan o'tish Telegram orqali. Raqamingiz Telegram tomonidan tasdiqlanadi — SMS kerak emas.
          </p>
          <a className="btn" href={view.start.deepLink} target="_blank" rel="noopener" onClick={() => setOpened(true)}>
            ✈ Telegram orqali kirish
          </a>
          {opened && (
            <p className="hint">
              Telegram'da <b>Start</b> tugmasini bosing. Birinchi marta bo'lsa, raqamingizni yuborish so'raladi. Keyin shu sahifaga
              qayting — kirish avtomatik davom etadi.
            </p>
          )}
        </>
      )}

      {view.kind === "done" && (
        <div className="lead">
          <p>✅ Kirdingiz: {view.me.phone}</p>
          <p className="hint">
            Holat: {view.me.status} · Rol: {view.me.role ?? "hali tanlanmagan"}
          </p>
        </div>
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
