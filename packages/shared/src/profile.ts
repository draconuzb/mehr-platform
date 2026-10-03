// Profil va onboarding sxemalari (TZ 5A, 5B). Web va API bir xil qoidalardan foydalanadi.
import { z } from "zod";
import { ageOn } from "./age";
import { detectContacts } from "./contact-filter";

export const GENDERS = ["MALE", "FEMALE"] as const;
export const SCHOOL_TYPES = ["LYCEUM", "COLLEGE", "TECHNIKUM", "UNIVERSITY"] as const;
export const RELATION_TYPES = ["LIVING", "MENTORING", "SUPPORT"] as const;
export const SUPPORT_TYPES = ["TUITION", "RENT", "FOOD", "CLOTHING", "COURSES", "TRANSPORT"] as const;
export const FAMILY_ROLES = ["FATHER", "MOTHER", "CHILD", "GRANDMOTHER", "GRANDFATHER", "OTHER_RELATIVE"] as const;
export const HOUSING_TYPES = ["HOUSE", "APARTMENT"] as const;
export const FAMILY_COMPOSITIONS = ["WITH_CHILDREN", "NO_CHILDREN", "ELDERLY_COUPLE", "SINGLE_MOTHER"] as const;
export const HOME_LANGUAGES = ["UZ", "RU", "KAA", "TJ", "OTHER"] as const;
export const PET_PREFS = ["OK", "NO", "ALLERGY"] as const;
export const GUEST_RULES = ["ALLOWED", "BY_AGREEMENT", "NOT_ALLOWED"] as const;

const name = z.string().trim().min(1, "Kiriting").max(50);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD ko'rinishida");
const id = z.number().int().positive();

/** Kontakt ma'lumoti (telefon, @username, havola) bo'lmagan erkin matn */
const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Kamida ${min} ta belgi`)
    .max(max, `Ko'pi bilan ${max} ta belgi`)
    .refine((v) => detectContacts(v).length === 0, "Telefon, username yoki havola yozmang — aloqa platforma ichida bo'ladi");

export const religionPref = z.object({
  importance: z.enum(["NOT_IMPORTANT", "SIMILAR"]),
  level: z.number().int().min(1).max(5).optional(),
});

export const youthProfileSchema = z.object({
  firstName: name,
  lastName: name,
  birthDate: isoDate,
  gender: z.enum(GENDERS),
  homeRegionId: id,
  cityId: id,
  schoolType: z.enum(SCHOOL_TYPES),
  schoolName: z.string().trim().min(2).max(200),
  fieldOfStudy: z.string().trim().min(2).max(200),
  course: z.number().int().min(1).max(6).optional(),
  interestTagIds: z.array(id).min(3, "Kamida 3 ta qiziqish tanlang").max(15),
  skillTagIds: z.array(id).min(2, "Kamida 2 ta ko'nikma tanlang").max(15),
  temperament: z.object({ calmActive: z.number().int().min(1).max(5), quietOpen: z.number().int().min(1).max(5) }),
  routine: z.object({ earlyRiser: z.boolean(), homeOften: z.boolean() }),
  smokes: z.boolean(),
  prefs: z.object({
    relationTypes: z.array(z.enum(RELATION_TYPES)).min(1, "Kamida bittasini tanlang"),
    familyComposition: z.array(z.enum(FAMILY_COMPOSITIONS)), // bo'sh — farqi yo'q
    pets: z.enum(PET_PREFS),
    smokingAtHome: z.enum(["AGAINST", "ANY"]),
    languages: z.array(z.enum(HOME_LANGUAGES)).min(1),
    religion: religionPref,
  }),
  bioGoals: cleanText(50, 1000),
});
export type YouthProfileInput = z.infer<typeof youthProfileSchema>;

export const familyMemberSchema = z.object({
  firstName: name,
  lastName: name,
  birthDate: isoDate,
  gender: z.enum(GENDERS),
  roleInFamily: z.enum(FAMILY_ROLES),
  occupation: z.string().trim().max(100).optional(),
  livesInHouse: z.boolean().default(true),
});
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

export const housingSchema = z.object({
  type: z.enum(HOUSING_TYPES),
  districtId: id,
  address: z.string().trim().min(5).max(300),
  hasPrivateRoom: z.boolean(),
  pets: z.boolean(),
  smokingInside: z.boolean(),
});

export const houseRulesSchema = z.object({
  returnBy: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  helpWithChores: z.boolean(),
  guests: z.enum(GUEST_RULES),
  note: cleanText(0, 500).optional(),
});

export const familyProfileSchema = z
  .object({
    self: familyMemberSchema.extend({ occupation: z.string().trim().min(2).max(100) }),
    cityId: id,
    districtId: id.optional(),
    members: z.array(familyMemberSchema).max(15),
    offerTypes: z.array(z.enum(RELATION_TYPES)).min(1, "Kamida bittasini tanlang"),
    supportTypes: z.array(z.enum(SUPPORT_TYPES)),
    mentorTagIds: z.array(id).max(15),
    houseRules: houseRulesSchema,
    housing: housingSchema.optional(),
    prefs: z.object({
      ageMin: z.number().int().min(14).max(30),
      ageMax: z.number().int().min(14).max(30),
      gender: z.enum(["MALE", "FEMALE", "ANY"]),
      regionIds: z.array(id), // yumshoq afzallik; bo'sh — farqi yo'q
      languages: z.array(z.enum(HOME_LANGUAGES)).min(1),
      religion: religionPref,
    }),
    story: cleanText(30, 1000),
  })
  .superRefine((v, ctx) => {
    if (v.prefs.ageMin > v.prefs.ageMax) {
      ctx.addIssue({ code: "custom", path: ["prefs", "ageMax"], message: "Yuqori chegara pastkisidan kichik" });
    }
    if (v.offerTypes.includes("LIVING") && !v.housing) {
      ctx.addIssue({ code: "custom", path: ["housing"], message: "Yashash taklif qilinsa, uy ma'lumotlari kerak" });
    }
    if (v.offerTypes.includes("SUPPORT") && v.supportTypes.length === 0) {
      ctx.addIssue({ code: "custom", path: ["supportTypes"], message: "Qanday yordam berishingizni tanlang" });
    }
  });
export type FamilyProfileInput = z.infer<typeof familyProfileSchema>;

/** Yosh chegarasi tekshiruvi (MVP: 18+, v2: 14+) */
export function checkAge(birthDate: string, minAge: number, maxAge = 35, on = new Date()): string | null {
  const d = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "Sana noto'g'ri";
  const age = ageOn(d, on);
  if (age < minAge) return `Platformadan ${minAge} yoshdan foydalanish mumkin`;
  if (age > maxAge) return "Sana noto'g'ri ko'rinadi";
  return null;
}
