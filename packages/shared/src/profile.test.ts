import { describe, expect, it } from "vitest";
import { checkAge, familyProfileSchema, youthProfileSchema } from "./profile";

const youth = {
  firstName: "Aziz",
  lastName: "Karimov",
  birthDate: "2006-03-14",
  gender: "MALE",
  homeRegionId: 7,
  cityId: 1,
  schoolType: "UNIVERSITY",
  schoolName: "TATU",
  fieldOfStudy: "Dasturiy injiniring",
  course: 2,
  interestTagIds: [1, 2, 3],
  skillTagIds: [11, 12],
  temperament: { calmActive: 2, quietOpen: 3 },
  routine: { earlyRiser: true, homeOften: false },
  smokes: false,
  prefs: {
    relationTypes: ["LIVING", "MENTORING"],
    familyComposition: [],
    pets: "OK",
    smokingAtHome: "AGAINST",
    languages: ["UZ"],
    religion: { importance: "NOT_IMPORTANT" },
  },
  bioGoals: "Dasturchi bo'lmoqchiman, kelajakda o'z startapimni ochish niyatim bor.",
};

describe("youthProfileSchema", () => {
  it("to'g'ri profilni qabul qiladi", () => {
    expect(youthProfileSchema.safeParse(youth).success).toBe(true);
  });
  it("matndagi telefon raqamini rad etadi", () => {
    const r = youthProfileSchema.safeParse({ ...youth, bioGoals: `${youth.bioGoals} Raqamim +998 90 123 45 67` });
    expect(r.success).toBe(false);
  });
  it("kamida 3 ta qiziqish talab qiladi", () => {
    expect(youthProfileSchema.safeParse({ ...youth, interestTagIds: [1] }).success).toBe(false);
  });
});

const family = {
  self: { firstName: "Rustam", lastName: "Karimov", birthDate: "1978-05-01", gender: "MALE", roleInFamily: "FATHER", occupation: "Dasturchi" },
  cityId: 1,
  districtId: 11,
  members: [{ firstName: "Dilnoza", lastName: "Karimova", birthDate: "1981-02-02", gender: "FEMALE", roleInFamily: "MOTHER" }],
  offerTypes: ["MENTORING"],
  supportTypes: [],
  mentorTagIds: [],
  houseRules: { helpWithChores: true, guests: "BY_AGREEMENT" },
  prefs: { ageMin: 18, ageMax: 25, gender: "ANY", regionIds: [], languages: ["UZ"], religion: { importance: "NOT_IMPORTANT" } },
  story: "Farzandlarimiz katta bo'lib ketdi, yoshlarga yordam bermoqchimiz.",
};

describe("familyProfileSchema", () => {
  it("to'g'ri profilni qabul qiladi", () => {
    expect(familyProfileSchema.safeParse(family).success).toBe(true);
  });
  it("yashash taklif qilinsa uy ma'lumotini talab qiladi", () => {
    expect(familyProfileSchema.safeParse({ ...family, offerTypes: ["LIVING"] }).success).toBe(false);
  });
  it("yosh oralig'i teskari bo'lsa rad etadi", () => {
    expect(familyProfileSchema.safeParse({ ...family, prefs: { ...family.prefs, ageMin: 25, ageMax: 18 } }).success).toBe(false);
  });
});

describe("checkAge", () => {
  const on = new Date("2026-10-03T00:00:00Z");
  it("MVP: 18 dan kichik rad etiladi", () => expect(checkAge("2010-01-01", 18, 35, on)).toMatch(/18/));
  it("18+ qabul qilinadi", () => expect(checkAge("2006-01-01", 18, 35, on)).toBeNull());
});
