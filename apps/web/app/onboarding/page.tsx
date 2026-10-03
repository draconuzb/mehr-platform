"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { FAMILY_DEFAULTS, FAMILY_STEPS, YOUTH_DEFAULTS, YOUTH_STEPS, type Draft, type Step } from "./steps";

type OnboardingState = {
  role: "YOUTH" | "FAMILY_ADULT" | null;
  step: string | null;
  draft: Draft;
  prefill: { firstName: string | null; lastName: string | null };
  checklist: { items: Array<{ key: string; done: boolean }> };
};

type ApiError = { error?: { code?: string; details?: Array<{ path: Array<string | number>; message: string }> } };

const isPlain = (v: unknown): v is Draft => typeof v === "object" && v !== null && !Array.isArray(v);

/** Server bilan bir xil qoida: obyektlar birlashadi, massivlar almashtiriladi, null — o'chiradi */
function merge(base: Draft, patch: Draft): Draft {
  const out: Draft = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else if (isPlain(v) && isPlain(out[k])) out[k] = merge(out[k], v);
    else out[k] = v;
  }
  return out;
}

const SAVE_DELAY_MS = 800;

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, authFetch } = useAuth();
  const [loaded, setLoaded] = useState<OnboardingState | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef<Draft>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allSteps: Step[] = loaded?.role === "FAMILY_ADULT" ? FAMILY_STEPS : YOUTH_STEPS;
  const steps = useMemo(() => allSteps.filter((s) => !s.when || s.when(draft)), [allSteps, draft]);
  const reviewIndex = steps.length;
  const requested = params.get("step");
  const index = useMemo(() => {
    const id = requested ?? loaded?.step;
    if (id === "review") return reviewIndex;
    const i = steps.findIndex((s) => s.id === id);
    return i >= 0 ? i : 0;
  }, [requested, loaded?.step, steps, reviewIndex]);
  const step = steps[index];

  const flush = useCallback(
    async (stepId?: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const data = pending.current;
      pending.current = {};
      if (Object.keys(data).length === 0 && !stepId) return true;
      setSaving("saving");
      const r = await authFetch("/onboarding", { method: "PATCH", body: JSON.stringify({ step: stepId, data }) }).catch(() => null);
      if (!r || r.status !== 200) {
        pending.current = merge(data, pending.current); // keyingi urinishda qayta yuboriladi
        setSaving("failed");
        return false;
      }
      setSaving("saved");
      return true;
    },
    [authFetch],
  );

  // Kirish va rolni tekshirish, qoralamani yuklash
  useEffect(() => {
    if (state.status === "anon") return router.replace("/login");
    if (state.status !== "authed") return;
    if (!state.user.role) return router.replace("/onboarding/role");
    void authFetch<OnboardingState>("/onboarding").then((r) => {
      if (r.status !== 200) return setError("Ma'lumotlarni yuklab bo'lmadi");
      if (r.body.checklist.items.find((i) => i.key === "profile")?.done) return router.replace("/app");
      // Telegram'dagi ism va standart qiymatlar bilan avtomatik to'ldirish — foydalanuvchi faqat tasdiqlaydi
      const isYouth = r.body.role === "YOUTH";
      const defaults = isYouth ? YOUTH_DEFAULTS : FAMILY_DEFAULTS;
      const names = { firstName: r.body.prefill.firstName ?? undefined, lastName: r.body.prefill.lastName ?? undefined };
      const prefilled = isYouth ? names : { self: names };
      const initial = merge(merge(defaults, JSON.parse(JSON.stringify(prefilled))), r.body.draft);
      setDraft(initial);
      setLoaded(r.body);
      // Standart qiymatlar va Telegram ismi ham serverdagi qoralamaga tushishi kerak
      pending.current = initial;
      void flush();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const set = useCallback(
    (patch: Draft) => {
      setError(null);
      setDraft((d) => merge(d, patch));
      pending.current = merge(pending.current, patch);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush],
  );

  // Sahifadan chiqib ketishda saqlanmagan o'zgarishlarni yuborish
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const goTo = useCallback(
    (i: number) => {
      const id = i >= reviewIndex ? "review" : steps[i]!.id;
      void flush(id);
      setError(null);
      router.push(`/onboarding?step=${id}`, { scroll: true });
    },
    [flush, router, steps, reviewIndex],
  );

  const next = () => {
    const problem = step?.check(draft);
    if (problem) return setError(problem);
    goTo(index + 1);
  };

  async function submit() {
    setSubmitting(true);
    setError(null);
    await flush("review");
    const r = await authFetch<ApiError>("/onboarding/complete", { method: "POST" });
    setSubmitting(false);
    if (r.status === 200 || r.status === 409) return router.replace("/app?welcome=1");
    const detail = r.body?.error?.details?.[0];
    const target = detail ? steps.findIndex((s) => s.fields.includes(String(detail.path[0]))) : -1;
    if (target >= 0) {
      router.push(`/onboarding?step=${steps[target]!.id}`);
      setError(detail!.message);
    } else setError(detail?.message ?? "Saqlab bo'lmadi. Qayta urinib ko'ring.");
  }

  if (!loaded) {
    return (
      <main className="wrap">
        <p className="lead">{error ?? "Yuklanmoqda…"}</p>
      </main>
    );
  }

  const total = steps.length + 1;
  const progress = Math.round(((index + 1) / total) * 100);

  return (
    <main className="wizard">
      <header className="wizard-top">
        <button type="button" className="link" onClick={() => (index > 0 ? goTo(index - 1) : router.push("/app"))} aria-label="Orqaga">
          ←
        </button>
        <div className="progress" aria-label={`${index + 1} / ${total}`}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className="save-state" aria-live="polite">
          {saving === "saving" ? "Saqlanmoqda…" : saving === "saved" ? "Saqlandi ✓" : saving === "failed" ? "Saqlanmadi" : ""}
        </span>
      </header>

      <section className="wizard-body">
        {step ? (
          <>
            <h1>{step.title}</h1>
            {step.subtitle && <p className="lead">{step.subtitle}</p>}
            <step.Body d={draft} set={set} />
          </>
        ) : (
          <Review steps={steps} draft={draft} goTo={goTo} isYouth={loaded.role === "YOUTH"} />
        )}
      </section>

      <footer className="wizard-bar">
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {step ? (
          <button type="button" className="btn" onClick={next}>
            Davom etish
          </button>
        ) : (
          <button type="button" className="btn" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Saqlanmoqda…" : "Profilni yaratish"}
          </button>
        )}
      </footer>
    </main>
  );
}

function Review({ steps, draft, goTo, isYouth }: { steps: Step[]; draft: Draft; goTo: (i: number) => void; isYouth: boolean }) {
  const problems = steps.map((s) => s.check(draft));
  const firstName = isYouth ? draft.firstName : draft.self?.firstName;
  return (
    <>
      <h1>Deyarli tayyor{firstName ? `, ${firstName}` : ""}!</h1>
      <p className="lead">Hammasini tekshiring. Keyin rasmlar va hujjatlarni yuklaysiz.</p>
      <ul className="review">
        {steps.map((s, i) => (
          <li key={s.id}>
            <span className={problems[i] ? "st-warn" : "st-ok"}>{problems[i] ? "!" : "✓"}</span>
            <span className="review-title">
              {s.title}
              {problems[i] && <small>{problems[i]}</small>}
            </span>
            <button type="button" className="link" onClick={() => goTo(i)}>
              {problems[i] ? "To'ldirish" : "O'zgartirish"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="wrap"><p className="lead">Yuklanmoqda…</p></main>}>
      <Wizard />
    </Suspense>
  );
}
