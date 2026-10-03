"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type Item = { key: string; done: boolean; required: boolean; count?: number; min?: number };
type Checklist = { items: Item[]; readyToSubmit: boolean; submitted: boolean };
type Onboarding = { role: string | null; checklist: Checklist };

const ITEM_TEXT: Record<string, { title: string; text: string; href?: string }> = {
  profile: { title: "Profil", text: "Asosiy ma'lumotlar", href: "/onboarding" },
  photos: { title: "Rasmlar", text: "3–6 ta rasm, kamida bittasida yuzingiz aniq ko'rinsin", href: "/app/media" },
  video: { title: "Tanishtiruv videosi", text: "60 soniyagacha. Ixtiyoriy, lekin ishonchni oshiradi", href: "/app/media" },
  doc_passport: { title: "Pasport yoki ID karta", text: "Faqat fond ko'radi", href: "/app/documents" },
  doc_study_certificate: { title: "O'qish joyidan ma'lumotnoma", text: "Faqat fond ko'radi", href: "/app/documents" },
  doc_criminal_record: { title: "Sudlanmaganlik ma'lumotnomasi", text: "my.gov.uz orqali olinadi. Faqat fond ko'radi", href: "/app/documents" },
};

function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, authFetch, logout } = useAuth();
  const [data, setData] = useState<Onboarding | null>(null);

  useEffect(() => {
    if (state.status === "anon") router.replace("/login");
    if (state.status === "authed" && !state.user.role) router.replace("/onboarding/role");
  }, [state, router]);

  const authed = state.status === "authed";
  useEffect(() => {
    if (!authed) return;
    void authFetch<Onboarding>("/onboarding").then((r) => {
      if (r.status !== 200) return;
      if (!r.body.checklist.items.find((i) => i.key === "profile")?.done) return router.replace("/onboarding");
      setData(r.body);
    });
  }, [authed, authFetch, router]);

  if (!data) return <main className="wrap"><p className="lead">Yuklanmoqda…</p></main>;

  const items = data.checklist.items.filter((i) => i.key !== "role");
  const left = items.filter((i) => i.required && !i.done).length;

  return (
    <main className="wrap">
      <header className="top">
        <b className="brand">Mehr</b>
        <button className="btn sec small" onClick={() => void logout().then(() => router.replace("/"))}>
          Chiqish
        </button>
      </header>

      {params.get("welcome") && <div className="banner ok">🎉 Profilingiz yaratildi!</div>}

      {data.checklist.submitted ? (
        <div className="banner">
          ⏳ <b>Profilingiz tekshirilmoqda.</b> Odatda 1–3 ish kuni. Natijani Telegram orqali yuboramiz.
        </div>
      ) : (
        <>
          <h1>{left === 0 ? "Hammasi tayyor!" : `Yana ${left} ta qadam`}</h1>
          <p className="lead">
            Tekshiruvdan o'tgach, {data.role === "YOUTH" ? "sizga mos oilalarni" : "sizga mos yoshlarni"} ko'rsatamiz.
          </p>
        </>
      )}

      <ul className="checklist">
        {items.map((i) => {
          const t = ITEM_TEXT[i.key] ?? { title: i.key, text: "" };
          return (
            <li key={i.key} className={i.done ? "done" : ""}>
              <span className="mark">{i.done ? "✓" : i.required ? "•" : "○"}</span>
              <span className="body">
                <b>
                  {t.title}
                  {i.min ? ` (${i.count ?? 0}/${i.min})` : ""}
                </b>
                <small>{t.text}</small>
              </span>
              {t.href && (
                <a className="link" href={t.href}>
                  {i.done ? "O'zgartirish" : "Qo'shish"}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default function AppHome() {
  return (
    <Suspense fallback={<main className="wrap"><p className="lead">Yuklanmoqda…</p></main>}>
      <Home />
    </Suspense>
  );
}
