import type { ConfirmResult } from "./api";

// Bot matnlari (hozircha o'zbek lotin). i18n — keyingi sprintda, foydalanuvchi tili bo'yicha.
export const TEXT = {
  welcome: "Assalomu alaykum! Bu Mehr boti: kirish, bildirishnomalar, oylik check-in va SOS shu yerda.",
  openApp: "Ilovani ochish",
  askPhone:
    "Ro'yxatdan o'tish uchun telefon raqamingizni tasdiqlang.\n\nRaqamingiz oilalarga ko'rinmaydi — faqat fond tekshiruvi uchun kerak.",
  sharePhoneButton: "📱 Raqamimni yuborish",
  notOwnContact: "Iltimos, boshqa odamning emas, o'zingizning raqamingizni tugma orqali yuboring.",
  noPending: "Kirish so'rovi topilmadi yoki eskirgan. Saytda «Telegram orqali kirish» tugmasini qaytadan bosing.",
  error: "Xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
  sos: "Agar xavf ostida bo'lsangiz, darhol 112 ga qo'ng'iroq qiling. Ishonch telefoni: 1146.",
} as const;

export function confirmText(r: ConfirmResult): string {
  switch (r.result) {
    case "OK":
      return r.isNew
        ? "✅ Ro'yxatdan o'tdingiz! Ilovaga qayting — kirish avtomatik davom etadi."
        : "✅ Kirish tasdiqlandi. Ilovaga qayting — kirish avtomatik davom etadi.";
    case "NEED_PHONE":
      return TEXT.askPhone;
    case "EXPIRED":
      return "⌛ Havola eskirgan. Saytda «Telegram orqali kirish» tugmasini qaytadan bosing.";
    case "INVALID_PHONE":
      return "Raqamni o'qib bo'lmadi. Tugma orqali qaytadan yuboring.";
    case "PHONE_TAKEN":
      return "Bu raqam boshqa Telegram akkauntiga bog'langan. Agar bu sizning raqamingiz bo'lsa, fond bilan bog'laning.";
    case "BLOCKED":
      return "Akkauntingiz bloklangan. Savollar bo'yicha fond bilan bog'laning.";
  }
}
