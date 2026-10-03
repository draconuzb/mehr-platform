import { latinToCyrillic, type AppLocale } from "@mehr/shared";
import uzLatn from "../messages/uz-Latn.json";
import ru from "../messages/ru.json";
import kaa from "../messages/kaa.json";

export type MessageKey = keyof typeof uzLatn;

const dictionaries: Record<Exclude<AppLocale, "uz-Cyrl">, Partial<Record<MessageKey, string>>> = {
  "uz-Latn": uzLatn,
  ru,
  // Qoraqalpoq tarjimasi hali yo'q — o'zbek (lotin) matni ko'rsatiladi
  kaa,
};

/**
 * uz-Cyrl uchun alohida fayl saqlanmaydi: lotin matni avtomatik o'giriladi (qaror #11).
 * Tarjimon tekshirgan matn kerak bo'lsa, messages/uz-Cyrl.json qo'shiladi va u ustun bo'ladi.
 */
export function t(locale: AppLocale, key: MessageKey): string {
  if (locale === "uz-Cyrl") return latinToCyrillic(uzLatn[key]);
  return dictionaries[locale][key] ?? uzLatn[key];
}
