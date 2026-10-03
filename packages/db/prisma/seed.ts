import { PrismaClient, TagType } from "@prisma/client";
import {
  FAMILY_ACTIVE_LIMITS,
  INTEREST_LIMITS,
  INTEREST_TTL_DAYS,
  MATCH_WEIGHTS,
  latinToCyrillic,
} from "@mehr/shared";

const prisma = new PrismaClient();

// 14 ta hudud. kaa — qoraqalpoq (lotin), tarjimon tekshiruvidan o'tkazilishi kerak.
const REGIONS: Array<[code: string, uz: string, ru: string, kaa: string]> = [
  ["TOS", "Toshkent shahri", "г. Ташкент", "Tashkent qalası"],
  ["TOV", "Toshkent viloyati", "Ташкентская область", "Tashkent wálayatı"],
  ["AND", "Andijon viloyati", "Андижанская область", "Ándijan wálayatı"],
  ["BUX", "Buxoro viloyati", "Бухарская область", "Buxara wálayatı"],
  ["FAR", "Farg'ona viloyati", "Ферганская область", "Ferǵana wálayatı"],
  ["JIZ", "Jizzax viloyati", "Джизакская область", "Jizzax wálayatı"],
  ["XOR", "Xorazm viloyati", "Хорезмская область", "Xorezm wálayatı"],
  ["NAM", "Namangan viloyati", "Наманганская область", "Namangan wálayatı"],
  ["NAV", "Navoiy viloyati", "Навоийская область", "Nawayı wálayatı"],
  ["QAS", "Qashqadaryo viloyati", "Кашкадарьинская область", "Qashqadárya wálayatı"],
  ["SAM", "Samarqand viloyati", "Самаркандская область", "Samarqand wálayatı"],
  ["SIR", "Sirdaryo viloyati", "Сырдарьинская область", "Sırdárya wálayatı"],
  ["SUR", "Surxondaryo viloyati", "Сурхандарьинская область", "Surxandárya wálayatı"],
  ["QQR", "Qoraqalpog'iston Respublikasi", "Республика Каракалпакстан", "Qaraqalpaqstan Respublikası"],
];

const CITIES: Array<[regionCode: string, uz: string, ru: string]> = [
  ["TOS", "Toshkent", "Ташкент"],
  ["TOV", "Nurafshon", "Нурафшан"],
  ["AND", "Andijon", "Андижан"],
  ["BUX", "Buxoro", "Бухара"],
  ["FAR", "Farg'ona", "Фергана"],
  ["JIZ", "Jizzax", "Джизак"],
  ["XOR", "Urganch", "Ургенч"],
  ["NAM", "Namangan", "Наманган"],
  ["NAV", "Navoiy", "Навои"],
  ["QAS", "Qarshi", "Карши"],
  ["SAM", "Samarqand", "Самарканд"],
  ["SIR", "Guliston", "Гулистан"],
  ["SUR", "Termiz", "Термез"],
  ["QQR", "Nukus", "Нукус"],
];

const TASHKENT_DISTRICTS: Array<[uz: string, ru: string]> = [
  ["Bektemir", "Бектемир"],
  ["Chilonzor", "Чиланзар"],
  ["Mirobod", "Мирабад"],
  ["Mirzo Ulug'bek", "Мирзо-Улугбек"],
  ["Olmazor", "Алмазар"],
  ["Sergeli", "Сергели"],
  ["Shayxontohur", "Шайхантахур"],
  ["Uchtepa", "Учтепа"],
  ["Yakkasaroy", "Яккасарай"],
  ["Yashnobod", "Яшнабад"],
  ["Yunusobod", "Юнусабад"],
  ["Yangihayot", "Янгихаёт"],
];

const TAGS: Record<TagType, string[]> = {
  INTEREST: ["IT", "Futbol", "Kitob", "Musiqa", "Oshpazlik", "Shaxmat", "Sayohat", "Rasm chizish", "Sport", "Tillar"],
  SKILL: ["Repetitorlik", "Uy ishlari", "Kompyuter", "Ta'mirlash", "Bog'dorchilik", "Oshpazlik"],
  MENTOR_AREA: ["Kasbga yo'naltirish", "Til", "IT", "Biznes", "Sport", "Hunar"],
};

const slugify = (s: string) => s.toLowerCase().replace(/['ʻ’]/g, "").replace(/\s+/g, "-");

async function main() {
  for (const [code, uz, ru, kaa] of REGIONS) {
    const names = { uz_latn: uz, uz_cyrl: latinToCyrillic(uz), ru, kaa };
    await prisma.region.upsert({ where: { code }, update: { names }, create: { code, names } });
  }

  // Har bir hududning markazi (boshqa shaharlar admin paneldan qo'shiladi)
  for (const [code, uz, ru] of CITIES) {
    const region = await prisma.region.findUniqueOrThrow({ where: { code } });
    const exists = await prisma.city.findFirst({ where: { regionId: region.id, names: { path: ["uz_latn"], equals: uz } } });
    if (!exists) {
      await prisma.city.create({ data: { regionId: region.id, names: { uz_latn: uz, uz_cyrl: latinToCyrillic(uz), ru } } });
    }
  }

  const tashkent = await prisma.city.findFirstOrThrow({ where: { names: { path: ["uz_latn"], equals: "Toshkent" } } });
  for (const [uz, ru] of TASHKENT_DISTRICTS) {
    const exists = await prisma.district.findFirst({ where: { cityId: tashkent.id, names: { path: ["uz_latn"], equals: uz } } });
    if (!exists) {
      await prisma.district.create({ data: { cityId: tashkent.id, names: { uz_latn: uz, uz_cyrl: latinToCyrillic(uz), ru } } });
    }
  }

  for (const [type, labels] of Object.entries(TAGS) as Array<[TagType, string[]]>) {
    for (const label of labels) {
      const slug = slugify(label);
      await prisma.tag.upsert({
        where: { type_slug: { type, slug } },
        update: {},
        create: { type, slug, approved: true, labels: { uz_latn: label, uz_cyrl: latinToCyrillic(label) } },
      });
    }
  }

  const settings: Record<string, unknown> = {
    "matching.weights": MATCH_WEIGHTS,
    "limits.interests": INTEREST_LIMITS,
    "limits.familyActive": FAMILY_ACTIVE_LIMITS,
    "interests.ttlDays": INTEREST_TTL_DAYS,
    "platform.minAge": 18, // MVP; v2 da 14
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: value as object } });
  }

  console.log("Seed tayyor: hududlar, teglar, sozlamalar");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
