// TZ.md qarorlari asosidagi konstantalar. Ish vaqtida o'zgaradiganlari
// (og'irliklar, limitlar) Setting jadvalida saqlanadi; bu yerdagilar — standart qiymatlar.

/** Platformadagi minimal yosh (qaror #5) */
export const MIN_AGE = 14;
/** MVP bosqichida minimal yosh; 14–17 v2 da yoqiladi */
export const MVP_MIN_AGE = 18;
export const ADULT_AGE = 18;

/** Qiziqish bildirish limitlari (TZ 5C) */
export const INTEREST_LIMITS = {
  FAMILY: { daily: 3, open: 5 },
  YOUTH: { daily: 5, open: 10 },
} as const;

/** Javobsiz qiziqish shuncha kundan keyin yopiladi */
export const INTEREST_TTL_DAYS = 14;

/** Oila uchun bir vaqtdagi faol munosabatlar (qaror #15) */
export const FAMILY_ACTIVE_LIMITS = { LIVING: 2, OTHER: 5 } as const;

/** Moslik og'irliklari (TZ 5C), jami 100 */
export const MATCH_WEIGHTS = {
  interestsAndMentoring: 35,
  temperamentAndRoutine: 20,
  languageAndReligion: 15,
  familyComposition: 10,
  regionPreference: 10,
  relationTypeOverlap: 10,
} as const;

/** Yangi profil bonusi beriladigan muddat (kun) */
export const NEW_PROFILE_BOOST_DAYS = 14;

/** Media qoidalari (TZ 5A/5B) */
export const MEDIA_RULES = {
  photos: { min: 3, max: 6 },
  video: { max: 1, maxDurationSec: 60 },
  housingPhotos: { min: 2, max: 4 },
  voiceMessageMaxSec: 120,
} as const;

/** Sinov davri (TZ 5D) */
export const TRIAL = { minWeeks: 2, maxWeeks: 4, minMeetings: 3 } as const;

/** Check-in eslatmalari (TZ 5D) */
export const CHECKIN = { reminderAfterDays: 3, escalateAfterDays: 7 } as const;

export const LOCALES = ["uz-Latn", "uz-Cyrl", "ru", "kaa"] as const;
export type AppLocale = (typeof LOCALES)[number];
