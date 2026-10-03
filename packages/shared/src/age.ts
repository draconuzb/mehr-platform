import { ADULT_AGE } from "./constants";

/** To'liq yillar bo'yicha yosh (UTC sanalar bilan) */
export function ageOn(birthDate: Date, on: Date = new Date()): number {
  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = on.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}

export function isMinor(birthDate: Date, on: Date = new Date()): boolean {
  return ageOn(birthDate, on) < ADULT_AGE;
}
