// Chat va profil matnlari uchun kontakt filtri (TZ 5D, 6-bo'lim).
// Mos kelsa, xabar "HELD" holatiga tushadi va moderatorga yuboriladi.

export type ContactFlag = "PHONE" | "USERNAME" | "LINK" | "EMAIL";

const DIGIT_WORDS = /\b(nol|bir|ikki|uch|to'rt|besh|olti|yetti|sakkiz|to'qqiz|ноль|один|два|три|четыре|пять|шесть|семь|восемь|девять)\b/gi;

export function detectContacts(text: string): ContactFlag[] {
  const flags = new Set<ContactFlag>();
  const normalized = text.normalize("NFKC");

  // 7+ raqam, oralarida bo'sh joy, chiziqcha, nuqta yoki qavs bo'lishi mumkin
  const digitsOnly = normalized.replace(/[\s\-().]/g, "");
  if (/\+?\d{7,}/.test(digitsOnly)) flags.add("PHONE");
  // Raqamlarni so'z bilan yozishga urinish: "to'qqiz nol bir ikki ..."
  if ((normalized.match(DIGIT_WORDS) ?? []).length >= 5) flags.add("PHONE");

  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(normalized)) flags.add("EMAIL");
  else if (/(^|[^\w])@[a-z0-9_]{4,}/i.test(normalized)) flags.add("USERNAME");

  if (/(https?:\/\/|www\.|t\.me\/|\b[a-z0-9-]+\.(uz|com|ru|org|net|me|io)\b)/i.test(normalized)) flags.add("LINK");

  return [...flags];
}
