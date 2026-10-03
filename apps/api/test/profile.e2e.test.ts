import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, codeFrom, internal, login, loginWithRole, prisma, resetUsers, startApp, stopApp } from "./helpers";

let ref: { xorazm: number; tashkent: number; yunusobod: number; nukus: number; interests: number[]; skills: number[]; mentor: number[] };

beforeAll(async () => {
  await startApp();
  const region = (code: string) => prisma.region.findUniqueOrThrow({ where: { code } });
  const city = (uz: string) => prisma.city.findFirstOrThrow({ where: { names: { path: ["uz_latn"], equals: uz } } });
  const tags = async (type: "INTEREST" | "SKILL" | "MENTOR_AREA") =>
    (await prisma.tag.findMany({ where: { type }, orderBy: { id: "asc" } })).map((t) => t.id);
  const tashkent = await city("Toshkent");
  ref = {
    xorazm: (await region("XOR")).id,
    tashkent: tashkent.id,
    yunusobod: (await prisma.district.findFirstOrThrow({ where: { cityId: tashkent.id, names: { path: ["uz_latn"], equals: "Yunusobod" } } })).id,
    nukus: (await city("Nukus")).id,
    interests: await tags("INTEREST"),
    skills: await tags("SKILL"),
    mentor: await tags("MENTOR_AREA"),
  };
});
beforeEach(resetUsers);
afterAll(stopApp);

const youthDraft = () => ({
  firstName: "Aziz",
  lastName: "Karimov",
  birthDate: "2006-03-14",
  gender: "MALE",
  homeRegionId: ref.xorazm,
  cityId: ref.tashkent,
  schoolType: "UNIVERSITY",
  schoolName: "TATU",
  fieldOfStudy: "Dasturiy injiniring",
  course: 2,
  interestTagIds: ref.interests.slice(0, 3),
  skillTagIds: ref.skills.slice(0, 2),
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
});

const familyDraft = () => ({
  self: { firstName: "Rustam", lastName: "Karimov", birthDate: "1978-05-01", gender: "MALE", roleInFamily: "FATHER", occupation: "Dasturchi" },
  cityId: ref.tashkent,
  districtId: ref.yunusobod,
  members: [
    { firstName: "Dilnoza", lastName: "Karimova", birthDate: "1981-02-02", gender: "FEMALE", roleInFamily: "MOTHER", livesInHouse: true },
    { firstName: "Madina", lastName: "Karimova", birthDate: "2014-06-06", gender: "FEMALE", roleInFamily: "CHILD", livesInHouse: true },
  ],
  offerTypes: ["LIVING", "MENTORING"],
  supportTypes: [],
  mentorTagIds: ref.mentor.slice(0, 2),
  houseRules: { returnBy: "22:00", helpWithChores: true, guests: "BY_AGREEMENT" },
  housing: { type: "APARTMENT", districtId: ref.yunusobod, address: "Yunusobod 4-mavze, 12-uy, 34-xonadon", hasPrivateRoom: true, pets: false, smokingInside: false },
  prefs: { ageMin: 18, ageMax: 25, gender: "ANY", regionIds: [ref.xorazm], languages: ["UZ"], religion: { importance: "NOT_IMPORTANT" } },
  story: "Farzandlarimiz katta bo'lib ketdi, yoshlarga yordam bermoqchimiz.",
});

describe("Ma'lumotnomalar", () => {
  it("hududlar, shaharlar, tumanlar va teglar ochiq", async () => {
    expect((await api("/ref/regions")).body).toHaveLength(14);
    expect((await api(`/ref/cities?regionId=${ref.xorazm}`)).body[0].names.uz_latn).toBe("Urganch");
    expect((await api(`/ref/districts?cityId=${ref.tashkent}`)).body).toHaveLength(12);
    expect((await api("/ref/tags?type=SKILL")).body.every((t: { type: string }) => t.type === "SKILL")).toBe(true);
  });
});

describe("Yosh onboarding", () => {
  it("Telegram ismi bilan to'ldiriladi, qadamma-qadam saqlanadi va profil yaratiladi", async () => {
    const auth = await loginWithRole("600001", "+998901200001", "YOUTH", { firstName: "Aziz", lastName: "Karimov" });

    const state = await api("/onboarding", { headers: auth });
    expect(state.body.prefill).toEqual({ firstName: "Aziz", lastName: "Karimov" });
    expect(state.body.checklist.items.find((i: { key: string }) => i.key === "profile").done).toBe(false);

    // Qadamlar bo'lib saqlash — ichma-ich obyektlar birlashadi
    const d = youthDraft();
    const { prefs, ...rest } = d;
    await api("/onboarding", { method: "PATCH", headers: auth, json: { step: "basics", data: rest } });
    await api("/onboarding", { method: "PATCH", headers: auth, json: { step: "prefs1", data: { prefs: { relationTypes: prefs.relationTypes, familyComposition: [] } } } });
    const saved = await api("/onboarding", {
      method: "PATCH",
      headers: auth,
      json: { step: "prefs2", data: { prefs: { pets: "OK", smokingAtHome: "AGAINST", languages: ["UZ"], religion: { importance: "NOT_IMPORTANT" } } } },
    });
    expect(saved.body.draft.prefs).toEqual(prefs);

    const done = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(done.status).toBe(200);
    expect(done.body.checklist.items.find((i: { key: string }) => i.key === "profile").done).toBe(true);

    const me = await api("/profile/me", { headers: auth });
    expect(me.body.profile).toMatchObject({ firstName: "Aziz", cityId: ref.tashkent, interestTagIds: ref.interests.slice(0, 3) });

    // Ikkinchi marta yaratib bo'lmaydi
    expect((await api("/onboarding/complete", { method: "POST", headers: auth })).status).toBe(409);
  });

  it("xatolar maydon yo'li bilan qaytadi", async () => {
    const auth = await loginWithRole("600002", "+998901200002", "YOUTH");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { ...youthDraft(), interestTagIds: [ref.interests[0]] } } });
    const r = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].path).toEqual(["interestTagIds"]);
  });

  it("MVP'da 18 yoshdan kichiklar rad etiladi", async () => {
    const auth = await loginWithRole("600003", "+998901200003", "YOUTH");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { ...youthDraft(), birthDate: "2010-01-01" } } });
    const r = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].path).toEqual(["birthDate"]);
  });

  it("noto'g'ri turdagi teg (ko'nikma o'rniga qiziqish) rad etiladi", async () => {
    const auth = await loginWithRole("600004", "+998901200004", "YOUTH");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { ...youthDraft(), skillTagIds: ref.interests.slice(0, 2) } } });
    expect((await api("/onboarding/complete", { method: "POST", headers: auth })).status).toBe(400);
  });

  it("bio'dagi kontakt ma'lumoti rad etiladi", async () => {
    const auth = await loginWithRole("600005", "+998901200005", "YOUTH");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { ...youthDraft(), bioGoals: "Telegramda yozing: @aziz_karimov, gaplashamiz albatta, kutaman" } } });
    const r = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].path).toEqual(["bioGoals"]);
  });

  it("profilni tahrirlash", async () => {
    const auth = await loginWithRole("600006", "+998901200006", "YOUTH");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: youthDraft() } });
    await api("/onboarding/complete", { method: "POST", headers: auth });
    const r = await api("/profile/me", { method: "PUT", headers: auth, json: { ...youthDraft(), fieldOfStudy: "Kiberxavfsizlik" } });
    expect(r.status).toBe(200);
    expect(r.body.profile.fieldOfStudy).toBe("Kiberxavfsizlik");
  });

  it("qoralama hajmi cheklangan", async () => {
    const auth = await loginWithRole("600007", "+998901200007", "YOUTH");
    const r = await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { junk: "x".repeat(40_000) } } });
    expect(r.status).toBe(400);
  });
});

describe("Oila onboarding", () => {
  it("oila, a'zolar va shifrlangan manzil bilan yaratiladi", async () => {
    const auth = await loginWithRole("700001", "+998901300001", "FAMILY_ADULT");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: familyDraft() } });
    const r = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(r.status).toBe(200);

    const family = await prisma.family.findFirstOrThrow({ include: { members: true, housing: true, tags: true } });
    expect(family.members).toHaveLength(3);
    expect(family.tags).toHaveLength(2);
    // Manzil bazada ochiq matnda saqlanmaydi
    expect(Buffer.from(family.housing!.exactAddressEnc).toString("utf8")).not.toContain("Yunusobod");

    const me = await api("/profile/me", { headers: auth });
    expect(me.body.profile.housing.address).toBe("Yunusobod 4-mavze, 12-uy, 34-xonadon");
    expect(me.body.profile.members.map((m: { firstName: string }) => m.firstName)).toEqual(["Dilnoza", "Madina"]);
  });

  it("yashash taklif qilinsa uy ma'lumoti majburiy", async () => {
    const auth = await loginWithRole("700002", "+998901300002", "FAMILY_ADULT");
    const { housing: _, ...noHousing } = familyDraft();
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: noHousing } });
    const r = await api("/onboarding/complete", { method: "POST", headers: auth });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].path).toEqual(["housing"]);
  });

  it("boshqa shahar tumanini tanlab bo'lmaydi", async () => {
    const auth = await loginWithRole("700003", "+998901300003", "FAMILY_ADULT");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: { ...familyDraft(), cityId: ref.nukus } } });
    expect((await api("/onboarding/complete", { method: "POST", headers: auth })).status).toBe(400);
  });

  it("tahrirlashda a'zolar yangilanadi, o'chiriladi va qo'shiladi", async () => {
    const auth = await loginWithRole("700004", "+998901300004", "FAMILY_ADULT");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: familyDraft() } });
    await api("/onboarding/complete", { method: "POST", headers: auth });
    const me = await api("/profile/me", { headers: auth });
    const [motherId] = me.body.profile.memberIds;

    const { memberIds: _, ...profile } = me.body.profile;
    profile.members = [
      { ...profile.members[0], occupation: "O'qituvchi" },
      { firstName: "Bobur", lastName: "Karimov", birthDate: "1950-01-01", gender: "MALE", roleInFamily: "GRANDFATHER", livesInHouse: true },
    ];
    const r = await api("/profile/me", { method: "PUT", headers: auth, json: { profile, memberIds: [motherId, null] } });
    expect(r.status).toBe(200);
    expect(r.body.profile.members.map((m: { firstName: string }) => m.firstName)).toEqual(["Dilnoza", "Bobur"]);
    expect(r.body.profile.memberIds[0]).toBe(motherId);
    expect(r.body.profile.members[0].occupation).toBe("O'qituvchi");
  });
});

describe("Oilaga taklif (Telegram)", () => {
  async function familyWithMother() {
    const auth = await loginWithRole("800001", "+998901400001", "FAMILY_ADULT");
    await api("/onboarding", { method: "PATCH", headers: auth, json: { data: familyDraft() } });
    await api("/onboarding/complete", { method: "POST", headers: auth });
    const me = await api("/profile/me", { headers: auth });
    return { auth, motherId: me.body.profile.memberIds[0] as string, childId: me.body.profile.memberIds[1] as string };
  }

  it("ona havolani bosadi, raqamini yuboradi va formasiz oilaga qo'shiladi", async () => {
    const { auth, motherId } = await familyWithMother();
    const inv = await api(`/family/members/${motherId}/invite`, { method: "POST", headers: auth });
    expect(inv.status).toBe(201);
    const code = codeFrom(inv.body.deepLink, "join_");

    expect((await internal("family-join", { code, telegramId: "800002" })).body).toEqual({ result: "NEED_PHONE" });
    const joined = await internal("family-join", { code, telegramId: "800002", phone: "+998901400002" });
    expect(joined.body.result).toBe("OK");

    // Endi ona saytga kiradi — rol va profil tayyor
    const { poll } = await login("800002");
    expect(poll.body.user.role).toBe("FAMILY_ADULT");
    const me = await api("/profile/me", { headers: { authorization: `Bearer ${poll.body.accessToken}` } });
    expect(me.body.profile.self.firstName).toBe("Dilnoza");

    // Havola bir martalik
    expect((await internal("family-join", { code, telegramId: "800003", phone: "+998901400003" })).body.result).toBe("EXPIRED");
  });

  it("voyaga yetmagan a'zoni taklif qilib bo'lmaydi", async () => {
    const { auth, childId } = await familyWithMother();
    expect((await api(`/family/members/${childId}/invite`, { method: "POST", headers: auth })).status).toBe(403);
  });

  it("boshqa oilaning a'zosini taklif qilib bo'lmaydi", async () => {
    const { motherId } = await familyWithMother();
    const stranger = await loginWithRole("800010", "+998901400010", "FAMILY_ADULT");
    expect((await api(`/family/members/${motherId}/invite`, { method: "POST", headers: stranger })).status).toBe(404);
  });

  it("yosh sifatida ro'yxatdan o'tgan odam oilaga qo'shila olmaydi", async () => {
    const { auth, motherId } = await familyWithMother();
    await loginWithRole("800020", "+998901400020", "YOUTH");
    const inv = await api(`/family/members/${motherId}/invite`, { method: "POST", headers: auth });
    const r = await internal("family-join", { code: codeFrom(inv.body.deepLink, "join_"), telegramId: "800020" });
    expect(r.body.result).toBe("ALREADY_REGISTERED");
  });
});
