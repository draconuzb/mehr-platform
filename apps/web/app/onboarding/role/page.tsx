"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, type Role, type SessionUser } from "@/lib/auth";

type Choice = Extract<Role, "YOUTH" | "FAMILY_ADULT">;

const OPTIONS: Array<{ role: Choice; title: string; text: string }> = [
  {
    role: "YOUTH",
    title: "Men yoshman",
    text: "Boshqa viloyatdan o'qishga kelganman va yangi shaharda ikkinchi oila, mentor yoki yordam qidiryapman.",
  },
  {
    role: "FAMILY_ADULT",
    title: "Biz oilamiz",
    text: "O'qishga kelgan yoshga uy, maslahat yoki moddiy yordam bermoqchimiz. Oilaning boshqa kattalari keyinroq qo'shiladi.",
  },
];

export default function RolePage() {
  const router = useRouter();
  const { state, authFetch, setSession, refresh } = useAuth();
  const [picked, setPicked] = useState<Choice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "anon") router.replace("/login");
    if (state.status === "authed" && state.user.role) router.replace("/app");
  }, [state, router]);

  async function save() {
    if (!picked) return;
    setSaving(true);
    setError(null);
    const r = await authFetch<{ accessToken: string; user: SessionUser }>("/me/role", {
      method: "POST",
      body: JSON.stringify({ role: picked }),
    });
    setSaving(false);
    if (r.status === 200) {
      setSession(r.body.accessToken, r.body.user);
      router.replace("/app");
    } else if (r.status === 409) {
      // Boshqa tabda allaqachon tanlangan — yangi rol bilan token olib davom etamiz
      await refresh();
      router.replace("/app");
    } else {
      setError("Saqlab bo'lmadi. Qayta urinib ko'ring.");
    }
  }

  if (state.status !== "authed" || state.user.role) return <main className="wrap"><p className="lead">Yuklanmoqda…</p></main>;

  return (
    <main className="wrap">
      <p className="hint">1-qadam, jami 6 ta</p>
      <h1>Siz kimsiz?</h1>
      <div className="choices" role="radiogroup" aria-label="Rol">
        {OPTIONS.map((o) => (
          <button
            key={o.role}
            type="button"
            role="radio"
            aria-checked={picked === o.role}
            className="choice"
            onClick={() => setPicked(o.role)}
          >
            <b>{o.title}</b>
            <span>{o.text}</span>
          </button>
        ))}
      </div>
      {picked && <p className="hint">Rolni keyin o'zgartirib bo'lmaydi. Xato tanlasangiz, fond orqali tuzatiladi.</p>}
      {error && <p className="hint error">{error}</p>}
      <button className="btn" disabled={!picked || saving} onClick={() => void save()}>
        {saving ? "Saqlanmoqda…" : "Davom etish"}
      </button>
    </main>
  );
}
