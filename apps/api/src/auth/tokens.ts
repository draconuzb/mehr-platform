import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** URL va Telegram deep-link uchun xavfsiz tasodifiy token ([A-Za-z0-9_-]) */
export const randomToken = (bytes = 24): string => randomBytes(bytes).toString("base64url");

export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function safeEqualString(a: string, b: string): boolean {
  return safeEqualHex(sha256(a), sha256(b));
}

/** Telegram kontaktidagi raqamni E.164 ko'rinishiga keltiradi: "998901234567" → "+998901234567" */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return `+${digits}`;
}
