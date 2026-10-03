import type { AppLocale } from "@mehr/shared";
import { LOCALES } from "@mehr/shared";
import { t } from "@/lib/i18n";
import { InstallPrompt } from "./install-prompt";

const LOCALE_LABELS: Record<AppLocale, string> = {
  "uz-Latn": "O'zbek",
  "uz-Cyrl": "Ўзбек",
  ru: "Русский",
  kaa: "Qaraqalpaq",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const locale = (LOCALES as readonly string[]).includes(lang ?? "") ? (lang as AppLocale) : "uz-Latn";

  return (
    <main className="wrap">
      <header className="top">
        <b className="brand">Mehr</b>
        <nav className="langs" aria-label="Til">
          {LOCALES.map((l) => (
            <a key={l} href={`?lang=${l}`} aria-current={l === locale ? "true" : undefined}>
              {LOCALE_LABELS[l]}
            </a>
          ))}
        </nav>
      </header>
      <h1>{t(locale, "tagline")}</h1>
      <p className="lead">{t(locale, "lead")}</p>
      <div className="row">
        <a className="btn" href="/login">{t(locale, "ctaYouth")}</a>
        <a className="btn sec" href="/login">{t(locale, "ctaFamily")}</a>
      </div>
      <InstallPrompt label={t(locale, "install")} iosHint={t(locale, "iosHint")} />
    </main>
  );
}
