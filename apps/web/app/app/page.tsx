"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type Me = { phone: string; role: string | null; status: string; onboarding: { roleChosen: boolean } };

const ROLE_LABEL: Record<string, string> = { YOUTH: "Yosh", FAMILY_ADULT: "Oila" };

export default function AppHome() {
  const router = useRouter();
  const { state, authFetch, logout } = useAuth();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (state.status === "anon") router.replace("/login");
    if (state.status === "authed" && !state.user.role) router.replace("/onboarding/role");
  }, [state, router]);

  const authed = state.status === "authed";
  useEffect(() => {
    if (!authed) return;
    void authFetch<Me>("/me").then((r) => r.status === 200 && setMe(r.body));
  }, [authed, authFetch]);

  if (!me) return <main className="wrap"><p className="lead">Yuklanmoqda…</p></main>;

  return (
    <main className="wrap">
      <header className="top">
        <b className="brand">Mehr</b>
        <button
          className="btn sec small"
          onClick={() => void logout().then(() => router.replace("/"))}
        >
          Chiqish
        </button>
      </header>
      <h1>Xush kelibsiz!</h1>
      <div className="panel">
        <p>📱 {me.phone}</p>
        <p>👤 {me.role ? ROLE_LABEL[me.role] ?? me.role : "—"}</p>
        <p>⏳ Holat: profil tekshirilmagan</p>
      </div>
      <p className="hint">Keyingi qadamlar (profil, hujjatlar, rasmlar) keyingi sprintlarda qo'shiladi.</p>
    </main>
  );
}
