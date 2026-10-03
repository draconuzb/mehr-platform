"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { MVP_MIN_AGE, checkAge, detectContacts } from "@mehr/shared";
import { Cards, Chips, DateSelect, Field, Scale, TextArea, TextInput, YesNo } from "@/components/ui";
import { label, useRef_, type City, type District, type Region, type Tag } from "@/lib/ref";

export type Draft = Record<string, any>;
export type SetDraft = (patch: Draft) => void;

export type Step = {
  id: string;
  title: string;
  subtitle?: string;
  /** Server xatosi qaysi qadamga tegishli ekanini aniqlash uchun — yo'lning birinchi kaliti */
  fields: string[];
  /** Davom etishdan oldin tekshiruv: xato matni yoki null */
  check: (d: Draft) => string | null;
  /** Qadam ko'rsatiladimi (masalan, uy — faqat yashash taklif qilinsa) */
  when?: (d: Draft) => boolean;
  Body: (p: { d: Draft; set: SetDraft }) => React.ReactNode;
};

const THIS_YEAR = new Date().getFullYear();
const fullDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ageError = (v: string | undefined, min: number, max = 35) => (fullDate(v) ? checkAge(v!, min, max) : "Tug'ilgan sanani to'liq tanlang");

// ───────────── Umumiy tanlovlar ─────────────

const RELATION_OPTIONS = [
  { value: "LIVING", icon: "🏠", title: "Oilada yashash", text: "Oila uyida, alohida xonada yashash" },
  { value: "MENTORING", icon: "🎓", title: "Mentorlik", text: "Alohida yashayman, lekin maslahat, uchrashuvlar, bayramlar" },
  { value: "SUPPORT", icon: "💛", title: "Moddiy yordam", text: "Kontrakt, ijara, ovqat, kurslar va h.k." },
] as const;

const LANG_OPTIONS = [
  { value: "UZ", label: "O'zbek" },
  { value: "RU", label: "Rus" },
  { value: "KAA", label: "Qoraqalpoq" },
  { value: "TJ", label: "Tojik" },
  { value: "OTHER", label: "Boshqa" },
];

function ReligionField({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <Field label="Diniy amaliyot" hint="Ixtiyoriy. Moslikni hisoblashda ishlatiladi, boshqalarga ko'rinmaydi.">
      <Chips
        options={[
          { value: "NOT_IMPORTANT", label: "Muhim emas" },
          { value: "SIMILAR", label: "O'xshash bo'lsin" },
        ]}
        value={value?.importance}
        onChange={(v) => onChange(v === "SIMILAR" ? { importance: v, level: value?.level ?? 3 } : { importance: v })}
      />
      {value?.importance === "SIMILAR" && (
        <Scale value={value.level} onChange={(level) => onChange({ ...value, level })} left="Kam" right="Ko'p" />
      )}
    </Field>
  );
}

function TagStep({ type, d, set, field, min }: { type: Tag["type"]; d: Draft; set: SetDraft; field: string; min: number }) {
  const tags = useRef_<Tag[]>(`/ref/tags?type=${type}`);
  const count = (d[field] ?? []).length;
  return (
    <>
      <p className="hint">
        {count < min ? `Yana kamida ${min - count} ta tanlang` : `${count} ta tanlandi`}
      </p>
      {tags ? (
        <Chips multiple max={15} options={tags.map((t) => ({ value: t.id, label: label(t.labels) }))} value={d[field]} onChange={(v) => set({ [field]: v })} />
      ) : (
        <p className="hint">Yuklanmoqda…</p>
      )}
    </>
  );
}

function CityChips({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const cities = useRef_<City[]>("/ref/cities");
  if (!cities) return <p className="hint">Yuklanmoqda…</p>;
  return <Chips options={cities.map((c) => ({ value: c.id, label: label(c.names) }))} value={value} onChange={(v) => onChange(v as number)} />;
}

function DistrictChips({ cityId, value, onChange }: { cityId: number | undefined; value: number | undefined; onChange: (v: number) => void }) {
  const districts = useRef_<District[]>(cityId ? `/ref/districts?cityId=${cityId}` : null);
  if (!cityId) return <p className="hint">Avval shaharni tanlang</p>;
  if (!districts) return <p className="hint">Yuklanmoqda…</p>;
  if (districts.length === 0) return <p className="hint">Bu shahar uchun tumanlar ro'yxati hali yo'q</p>;
  return <Chips options={districts.map((x) => ({ value: x.id, label: label(x.names) }))} value={value} onChange={(v) => onChange(v as number)} />;
}

const contactError = (text: string | undefined) =>
  text && detectContacts(text).length ? "Telefon, username yoki havola yozmang — aloqa platforma ichida bo'ladi" : null;

// ───────────── Yosh ─────────────

export const YOUTH_DEFAULTS: Draft = {
  temperament: { calmActive: 3, quietOpen: 3 },
  prefs: { familyComposition: [], pets: "OK", smokingAtHome: "AGAINST", languages: ["UZ"], religion: { importance: "NOT_IMPORTANT" } },
};

export const YOUTH_STEPS: Step[] = [
  {
    id: "name",
    title: "Tanishaylik",
    subtitle: "Familiyangiz oilalarga faqat bosh harfi bilan ko'rinadi: «Aziz K.»",
    fields: ["firstName", "lastName", "birthDate", "gender"],
    check: (d) =>
      !d.firstName?.trim() || !d.lastName?.trim()
        ? "Ism va familiyani kiriting"
        : ageError(d.birthDate, MVP_MIN_AGE) ?? (!d.gender ? "Jinsni tanlang" : null),
    Body: ({ d, set }) => (
      <>
        <Field label="Ism">
          <TextInput value={d.firstName} onChange={(v) => set({ firstName: v })} autoComplete="given-name" maxLength={50} />
        </Field>
        <Field label="Familiya">
          <TextInput value={d.lastName} onChange={(v) => set({ lastName: v })} autoComplete="family-name" maxLength={50} />
        </Field>
        <Field label="Tug'ilgan sana">
          <DateSelect value={d.birthDate} onChange={(v) => set({ birthDate: v })} fromYear={THIS_YEAR - 35} toYear={THIS_YEAR - 14} />
        </Field>
        <Field label="Jins">
          <Chips options={[{ value: "MALE", label: "Yigit" }, { value: "FEMALE", label: "Qiz" }]} value={d.gender} onChange={(v) => set({ gender: v })} />
        </Field>
      </>
    ),
  },
  {
    id: "from",
    title: "Qayerdan keldingiz?",
    subtitle: "Faqat viloyat ko'rinadi — tuman va qishloq so'ralmaydi",
    fields: ["homeRegionId", "cityId"],
    check: (d) => (!d.homeRegionId ? "Viloyatni tanlang" : !d.cityId ? "Hozir qaysi shaharda ekaningizni tanlang" : null),
    Body: function From({ d, set }) {
      const regions = useRef_<Region[]>("/ref/regions");
      return (
        <>
          <Field label="Viloyatingiz">
            {regions ? (
              <Chips options={regions.map((r) => ({ value: r.id, label: label(r.names).replace(" viloyati", "") }))} value={d.homeRegionId} onChange={(v) => set({ homeRegionId: v })} />
            ) : (
              <p className="hint">Yuklanmoqda…</p>
            )}
          </Field>
          <Field label="Hozir qaysi shaharda o'qiysiz?">
            <CityChips value={d.cityId} onChange={(v) => set({ cityId: v })} />
          </Field>
        </>
      );
    },
  },
  {
    id: "study",
    title: "O'qishingiz",
    subtitle: "O'quv joyingiz nomi faqat juftlikdan keyin ko'rinadi",
    fields: ["schoolType", "schoolName", "fieldOfStudy", "course"],
    check: (d) =>
      !d.schoolType
        ? "O'quv joyi turini tanlang"
        : (d.schoolName?.trim().length ?? 0) < 2
          ? "O'quv joyi nomini kiriting"
          : (d.fieldOfStudy?.trim().length ?? 0) < 2
            ? "Yo'nalishingizni kiriting"
            : null,
    Body: ({ d, set }) => (
      <>
        <Field label="Qayerda o'qiysiz?">
          <Chips
            options={[
              { value: "UNIVERSITY", label: "OTM" },
              { value: "TECHNIKUM", label: "Texnikum" },
              { value: "COLLEGE", label: "Kollej" },
              { value: "LYCEUM", label: "Litsey" },
            ]}
            value={d.schoolType}
            onChange={(v) => set({ schoolType: v })}
          />
        </Field>
        <Field label="O'quv joyi nomi">
          <TextInput value={d.schoolName} onChange={(v) => set({ schoolName: v })} placeholder="Masalan: TATU" maxLength={200} />
        </Field>
        <Field label="Yo'nalish">
          <TextInput value={d.fieldOfStudy} onChange={(v) => set({ fieldOfStudy: v })} placeholder="Masalan: Dasturiy injiniring" maxLength={200} />
        </Field>
        <Field label="Kurs">
          <Chips options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))} value={d.course} onChange={(v) => set({ course: v })} />
        </Field>
      </>
    ),
  },
  {
    id: "interests",
    title: "Nimalarga qiziqasiz?",
    subtitle: "Shu bo'yicha sizga mos oilalarni topamiz",
    fields: ["interestTagIds"],
    check: (d) => ((d.interestTagIds?.length ?? 0) < 3 ? "Kamida 3 ta qiziqish tanlang" : null),
    Body: ({ d, set }) => <TagStep type="INTEREST" d={d} set={set} field="interestTagIds" min={3} />,
  },
  {
    id: "skills",
    title: "Nima qila olasiz?",
    subtitle: "Oilalar yordam beradigan yoshlarni qadrlashadi",
    fields: ["skillTagIds"],
    check: (d) => ((d.skillTagIds?.length ?? 0) < 2 ? "Kamida 2 ta ko'nikma tanlang" : null),
    Body: ({ d, set }) => <TagStep type="SKILL" d={d} set={set} field="skillTagIds" min={2} />,
  },
  {
    id: "character",
    title: "Xarakteringiz",
    subtitle: "Birga yashashda eng muhim narsa",
    fields: ["temperament", "routine", "smokes"],
    check: (d) =>
      d.routine?.earlyRiser === undefined || d.routine?.homeOften === undefined
        ? "Kun tartibingizni belgilang"
        : d.smokes === undefined
          ? "Chekish haqidagi savolga javob bering"
          : null,
    Body: ({ d, set }) => (
      <>
        <Field label="Qanday odamsiz?">
          <Scale value={d.temperament?.calmActive} onChange={(v) => set({ temperament: { calmActive: v } })} left="Tinch" right="Faol" />
          <Scale value={d.temperament?.quietOpen} onChange={(v) => set({ temperament: { quietOpen: v } })} left="Kamgap" right="Ochiq" />
        </Field>
        <Field label="Ertalab">
          <YesNo value={d.routine?.earlyRiser} onChange={(v) => set({ routine: { earlyRiser: v } })} yes="Erta turaman" no="Kech turaman" />
        </Field>
        <Field label="Bo'sh vaqtda">
          <YesNo value={d.routine?.homeOften} onChange={(v) => set({ routine: { homeOften: v } })} yes="Ko'proq uydaman" no="Ko'proq tashqarida" />
        </Field>
        <Field label="Chekasizmi?">
          <YesNo value={d.smokes} onChange={(v) => set({ smokes: v })} />
        </Field>
      </>
    ),
  },
  {
    id: "wish",
    title: "Qanday yordam kerak?",
    subtitle: "Bir nechtasini tanlash mumkin",
    fields: ["prefs"],
    check: (d) => ((d.prefs?.relationTypes?.length ?? 0) === 0 ? "Kamida bittasini tanlang" : null),
    Body: ({ d, set }) => (
      <>
        <Cards options={[...RELATION_OPTIONS]} value={d.prefs?.relationTypes} onChange={(v) => set({ prefs: { relationTypes: v } })} />
        <Field label="Qanday oila?" hint="Hech narsa tanlamasangiz — farqi yo'q">
          <Chips
            multiple
            options={[
              { value: "WITH_CHILDREN", label: "Bolali" },
              { value: "NO_CHILDREN", label: "Bolasiz" },
              { value: "ELDERLY_COUPLE", label: "Keksa juftlik" },
              { value: "SINGLE_MOTHER", label: "Yolg'iz ona" },
            ]}
            value={d.prefs?.familyComposition}
            onChange={(v) => set({ prefs: { familyComposition: v } })}
          />
        </Field>
      </>
    ),
  },
  {
    id: "home",
    title: "Uy sharoiti",
    subtitle: "Qaysi oilalar sizga to'g'ri kelmasligini bilishimiz uchun",
    fields: [],
    check: (d) => ((d.prefs?.languages?.length ?? 0) === 0 ? "Kamida bitta tilni tanlang" : null),
    Body: ({ d, set }) => (
      <>
        <Field label="Uy hayvonlari">
          <Chips
            options={[
              { value: "OK", label: "Farqi yo'q" },
              { value: "NO", label: "Bo'lmasin" },
              { value: "ALLERGY", label: "Allergiyam bor" },
            ]}
            value={d.prefs?.pets}
            onChange={(v) => set({ prefs: { pets: v } })}
          />
        </Field>
        <Field label="Uyda chekish">
          <Chips
            options={[
              { value: "AGAINST", label: "Qarshiman" },
              { value: "ANY", label: "Farqi yo'q" },
            ]}
            value={d.prefs?.smokingAtHome}
            onChange={(v) => set({ prefs: { smokingAtHome: v } })}
          />
        </Field>
        <Field label="Uyda qaysi tilda gaplashilsin?">
          <Chips multiple options={LANG_OPTIONS} value={d.prefs?.languages} onChange={(v) => set({ prefs: { languages: v } })} />
        </Field>
        <ReligionField value={d.prefs?.religion} onChange={(v) => set({ prefs: { religion: v } })} />
      </>
    ),
  },
  {
    id: "about",
    title: "O'zingiz haqingizda",
    subtitle: "Maqsadlaringiz, orzularingiz, nega ikkinchi oila qidiryapsiz",
    fields: ["bioGoals"],
    check: (d) => ((d.bioGoals?.trim().length ?? 0) < 50 ? "Kamida 50 ta belgi yozing" : contactError(d.bioGoals)),
    Body: ({ d, set }) => (
      <>
        <TextArea
          value={d.bioGoals}
          onChange={(v) => set({ bioGoals: v })}
          min={50}
          max={1000}
          placeholder="Masalan: Xorazmdan kelganman, TATUda 2-kursda o'qiyman. Dasturchi bo'lmoqchiman. Toshkentda tanishlarim yo'q, maslahat beradigan katta odamlar kerak…"
        />
        {contactError(d.bioGoals) && <p className="field-error">{contactError(d.bioGoals)}</p>}
        <p className="hint">🔒 Telefon raqam yoki Telegram username yozmang — aloqa faqat platforma ichida.</p>
      </>
    ),
  },
];

// ───────────── Oila ─────────────

export const FAMILY_DEFAULTS: Draft = {
  members: [],
  offerTypes: [],
  supportTypes: [],
  mentorTagIds: [],
  houseRules: { returnBy: "22:00", helpWithChores: true, guests: "BY_AGREEMENT" },
  prefs: { ageMin: 18, ageMax: 25, gender: "ANY", regionIds: [], languages: ["UZ"], religion: { importance: "NOT_IMPORTANT" } },
};

const ROLE_OPTIONS = [
  { value: "FATHER", label: "Ota", gender: "MALE" },
  { value: "MOTHER", label: "Ona", gender: "FEMALE" },
  { value: "GRANDFATHER", label: "Bobo", gender: "MALE" },
  { value: "GRANDMOTHER", label: "Buvi", gender: "FEMALE" },
  { value: "CHILD", label: "Farzand" },
  { value: "OTHER_RELATIVE", label: "Boshqa qarindosh" },
] as const;

const genderForRole = (role: string) => ROLE_OPTIONS.find((r) => r.value === role && "gender" in r) as { gender?: string } | undefined;

function memberError(m: Draft, i: number): string | null {
  const n = `${i + 1}-a'zo`;
  if (!m.firstName?.trim()) return `${n}: ismni kiriting`;
  if (!m.roleInFamily) return `${n}: kimligini tanlang`;
  if (!m.gender) return `${n}: jinsni tanlang`;
  if (!fullDate(m.birthDate)) return `${n}: tug'ilgan sanani tanlang`;
  return null;
}

function MemberEditor({ m, onChange, onRemove }: { m: Draft; onChange: (m: Draft) => void; onRemove: () => void }) {
  return (
    <div className="member">
      <div className="member-head">
        <b>{m.firstName || "Yangi a'zo"}</b>
        <button type="button" className="link danger" onClick={onRemove}>
          O'chirish
        </button>
      </div>
      <Chips
        options={ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
        value={m.roleInFamily}
        onChange={(v) => onChange({ ...m, roleInFamily: v, gender: genderForRole(v as string)?.gender ?? m.gender })}
      />
      <div className="row2">
        <TextInput value={m.firstName} onChange={(v) => onChange({ ...m, firstName: v })} placeholder="Ism" maxLength={50} />
        <TextInput value={m.lastName} onChange={(v) => onChange({ ...m, lastName: v })} placeholder="Familiya" maxLength={50} />
      </div>
      {!genderForRole(m.roleInFamily)?.gender && (
        <Chips options={[{ value: "MALE", label: "O'g'il / erkak" }, { value: "FEMALE", label: "Qiz / ayol" }]} value={m.gender} onChange={(v) => onChange({ ...m, gender: v })} />
      )}
      <DateSelect value={m.birthDate} onChange={(v) => onChange({ ...m, birthDate: v })} fromYear={THIS_YEAR - 100} toYear={THIS_YEAR} />
      <YesNo value={m.livesInHouse} onChange={(v) => onChange({ ...m, livesInHouse: v })} yes="Shu uyda yashaydi" no="Alohida yashaydi" />
    </div>
  );
}

export const FAMILY_STEPS: Step[] = [
  {
    id: "self",
    title: "Siz haqingizda",
    subtitle: "Oilaning boshqa kattalarini keyingi qadamda qo'shasiz",
    fields: ["self"],
    check: (d) => {
      const s = d.self ?? {};
      if (!s.firstName?.trim() || !s.lastName?.trim()) return "Ism va familiyani kiriting";
      if (!s.roleInFamily) return "Oiladagi o'rningizni tanlang";
      const e = ageError(s.birthDate, 18, 100);
      if (e) return e;
      if ((s.occupation?.trim().length ?? 0) < 2) return "Kasbingizni kiriting";
      return null;
    },
    Body: ({ d, set }) => (
      <>
        <div className="row2">
          <Field label="Ism">
            <TextInput value={d.self?.firstName} onChange={(v) => set({ self: { firstName: v } })} autoComplete="given-name" maxLength={50} />
          </Field>
          <Field label="Familiya">
            <TextInput value={d.self?.lastName} onChange={(v) => set({ self: { lastName: v } })} autoComplete="family-name" maxLength={50} />
          </Field>
        </div>
        <Field label="Oilada siz kimsiz?">
          <Chips
            options={ROLE_OPTIONS.filter((r) => r.value !== "CHILD").map((r) => ({ value: r.value, label: r.label }))}
            value={d.self?.roleInFamily}
            onChange={(v) => set({ self: { roleInFamily: v, gender: genderForRole(v as string)?.gender ?? d.self?.gender } })}
          />
        </Field>
        {d.self?.roleInFamily === "OTHER_RELATIVE" && (
          <Field label="Jins">
            <Chips options={[{ value: "MALE", label: "Erkak" }, { value: "FEMALE", label: "Ayol" }]} value={d.self?.gender} onChange={(v) => set({ self: { gender: v } })} />
          </Field>
        )}
        <Field label="Tug'ilgan sana">
          <DateSelect value={d.self?.birthDate} onChange={(v) => set({ self: { birthDate: v } })} fromYear={THIS_YEAR - 100} toYear={THIS_YEAR - 18} />
        </Field>
        <Field label="Kasbingiz" hint="Yoshlar mentorlik uchun shunga qarab tanlashadi">
          <TextInput value={d.self?.occupation} onChange={(v) => set({ self: { occupation: v } })} placeholder="Masalan: dasturchi, o'qituvchi, shifokor" maxLength={100} />
        </Field>
      </>
    ),
  },
  {
    id: "where",
    title: "Qayerda yashaysiz?",
    subtitle: "Aniq manzil so'ralmaydi — faqat shahar va tuman",
    fields: ["cityId", "districtId"],
    check: (d) => (!d.cityId ? "Shaharni tanlang" : null),
    Body: ({ d, set }) => (
      <>
        <Field label="Shahar">
          <CityChips value={d.cityId} onChange={(v) => set({ cityId: v, districtId: null })} />
        </Field>
        <Field label="Tuman" hint="Ixtiyoriy">
          <DistrictChips cityId={d.cityId} value={d.districtId} onChange={(v) => set({ districtId: v })} />
        </Field>
      </>
    ),
  },
  {
    id: "members",
    title: "Oila a'zolari",
    subtitle: "Shu uyda yashaydiganlar. Kattalarni keyin Telegram orqali taklif qilasiz — ular forma to'ldirmaydi",
    fields: ["members"],
    check: (d) => (d.members ?? []).map(memberError).find(Boolean) ?? null,
    Body: ({ d, set }) => {
      const members: Draft[] = d.members ?? [];
      const lastName = d.self?.lastName ?? "";
      const add = (m: Draft) => set({ members: [...members, { lastName, livesInHouse: true, ...m }] });
      const spouse =
        d.self?.roleInFamily === "MOTHER" ? { roleInFamily: "FATHER", gender: "MALE" } : { roleInFamily: "MOTHER", gender: "FEMALE" };
      return (
        <>
          {members.length === 0 && <p className="hint">Hozircha faqat siz. Yolg'iz yashasangiz — shunchaki davom eting.</p>}
          {members.map((m, i) => (
            <MemberEditor
              key={i}
              m={m}
              onChange={(nm) => set({ members: members.map((x, j) => (j === i ? nm : x)) })}
              onRemove={() => set({ members: members.filter((_, j) => j !== i) })}
            />
          ))}
          <div className="chips">
            <button type="button" className="chip add" onClick={() => add(spouse)}>
              + Turmush o'rtog'im
            </button>
            <button type="button" className="chip add" onClick={() => add({ roleInFamily: "CHILD" })}>
              + Farzand
            </button>
            <button type="button" className="chip add" onClick={() => add({ roleInFamily: "GRANDMOTHER", gender: "FEMALE" })}>
              + Buvi
            </button>
            <button type="button" className="chip add" onClick={() => add({ roleInFamily: "GRANDFATHER", gender: "MALE" })}>
              + Bobo
            </button>
            <button type="button" className="chip add" onClick={() => add({ roleInFamily: "OTHER_RELATIVE" })}>
              + Boshqa
            </button>
          </div>
        </>
      );
    },
  },
  {
    id: "offer",
    title: "Nima taklif qilasiz?",
    subtitle: "Bir nechtasini tanlash mumkin",
    fields: ["offerTypes", "supportTypes", "mentorTagIds"],
    check: (d) =>
      (d.offerTypes?.length ?? 0) === 0
        ? "Kamida bittasini tanlang"
        : d.offerTypes.includes("SUPPORT") && (d.supportTypes?.length ?? 0) === 0
          ? "Qanday moddiy yordam berishingizni tanlang"
          : null,
    Body: function Offer({ d, set }) {
      const tags = useRef_<Tag[]>("/ref/tags?type=MENTOR_AREA");
      return (
        <>
          <Cards options={[...RELATION_OPTIONS]} value={d.offerTypes} onChange={(v) => set({ offerTypes: v })} />
          {d.offerTypes?.includes("SUPPORT") && (
            <Field label="Qanday yordam?" hint="Summa so'ralmaydi">
              <Chips
                multiple
                options={[
                  { value: "TUITION", label: "Kontrakt" },
                  { value: "RENT", label: "Ijara" },
                  { value: "FOOD", label: "Ovqat" },
                  { value: "CLOTHING", label: "Kiyim" },
                  { value: "COURSES", label: "Kurslar" },
                  { value: "TRANSPORT", label: "Transport" },
                ]}
                value={d.supportTypes}
                onChange={(v) => set({ supportTypes: v })}
              />
            </Field>
          )}
          {d.offerTypes?.includes("MENTORING") && tags && (
            <Field label="Qaysi sohada maslahat bera olasiz?" hint="Ixtiyoriy">
              <Chips multiple options={tags.map((t) => ({ value: t.id, label: label(t.labels) }))} value={d.mentorTagIds} onChange={(v) => set({ mentorTagIds: v })} />
            </Field>
          )}
        </>
      );
    },
  },
  {
    id: "housing",
    title: "Uyingiz",
    subtitle: "🔒 Aniq manzilni faqat fond koordinatori ko'radi — uyga tashrif uchun",
    fields: ["housing"],
    when: (d) => d.offerTypes?.includes("LIVING"),
    check: (d) => {
      const h = d.housing ?? {};
      if (!h.type) return "Uy turini tanlang";
      if (!h.districtId) return "Tumanni tanlang";
      if ((h.address?.trim().length ?? 0) < 5) return "Manzilni kiriting";
      if (h.hasPrivateRoom === undefined || h.pets === undefined || h.smokingInside === undefined) return "Barcha savollarga javob bering";
      return null;
    },
    Body: ({ d, set }) => (
      <>
        <Field label="Uy turi">
          <Chips options={[{ value: "APARTMENT", label: "Kvartira" }, { value: "HOUSE", label: "Hovli" }]} value={d.housing?.type} onChange={(v) => set({ housing: { type: v } })} />
        </Field>
        <Field label="Tuman">
          <DistrictChips cityId={d.cityId} value={d.housing?.districtId ?? d.districtId} onChange={(v) => set({ housing: { districtId: v } })} />
        </Field>
        <Field label="Aniq manzil" hint="🔒 Shifrlangan holda saqlanadi">
          <TextInput value={d.housing?.address} onChange={(v) => set({ housing: { address: v } })} placeholder="Ko'cha, uy, xonadon" maxLength={300} autoComplete="street-address" />
        </Field>
        <Field label="Yoshga alohida xona bormi?">
          <YesNo value={d.housing?.hasPrivateRoom} onChange={(v) => set({ housing: { hasPrivateRoom: v } })} />
        </Field>
        <Field label="Uy hayvoni bormi?">
          <YesNo value={d.housing?.pets} onChange={(v) => set({ housing: { pets: v } })} />
        </Field>
        <Field label="Uyda chekiladimi?">
          <YesNo value={d.housing?.smokingInside} onChange={(v) => set({ housing: { smokingInside: v } })} />
        </Field>
      </>
    ),
  },
  {
    id: "rules",
    title: "Uy qoidalari",
    subtitle: "Kelishuvga avtomatik kiritiladi — keyin tushunmovchilik bo'lmasligi uchun",
    fields: ["houseRules"],
    check: (d) => contactError(d.houseRules?.note),
    Body: ({ d, set }) => (
      <>
        <Field label="Kechqurun qaytish vaqti">
          <Chips
            options={[
              { value: "20:00", label: "20:00" },
              { value: "21:00", label: "21:00" },
              { value: "22:00", label: "22:00" },
              { value: "23:00", label: "23:00" },
              { value: "NONE", label: "Cheklovsiz" },
            ]}
            value={d.houseRules?.returnBy ?? "NONE"}
            onChange={(v) => set({ houseRules: { returnBy: v === "NONE" ? null : v } })}
          />
        </Field>
        <Field label="Uy ishlarida yordam">
          <YesNo value={d.houseRules?.helpWithChores} onChange={(v) => set({ houseRules: { helpWithChores: v } })} yes="Kutamiz" no="Shart emas" />
        </Field>
        <Field label="Mehmon chaqirish">
          <Chips
            options={[
              { value: "ALLOWED", label: "Mumkin" },
              { value: "BY_AGREEMENT", label: "Kelishib" },
              { value: "NOT_ALLOWED", label: "Mumkin emas" },
            ]}
            value={d.houseRules?.guests}
            onChange={(v) => set({ houseRules: { guests: v } })}
          />
        </Field>
        <Field label="Qo'shimcha" hint="Ixtiyoriy">
          <TextArea value={d.houseRules?.note} onChange={(v) => set({ houseRules: { note: v } })} min={0} max={500} placeholder="Masalan: juma kuni oilaviy kechki ovqat" />
        </Field>
      </>
    ),
  },
  {
    id: "wish",
    title: "Qanday yoshga yordam bermoqchisiz?",
    fields: ["prefs"],
    check: (d) =>
      d.prefs?.ageMin > d.prefs?.ageMax ? "Yosh oralig'ini to'g'rilang" : (d.prefs?.languages?.length ?? 0) === 0 ? "Kamida bitta tilni tanlang" : null,
    Body: function Wish({ d, set }) {
      const regions = useRef_<Region[]>("/ref/regions");
      const ages = Array.from({ length: 13 }, (_, i) => 18 + i);
      return (
        <>
          <Field label="Yoshi">
            <div className="row2">
              <select className="input" aria-label="dan" value={d.prefs?.ageMin} onChange={(e) => set({ prefs: { ageMin: Number(e.target.value) } })}>
                {ages.map((a) => (
                  <option key={a} value={a}>
                    {a} dan
                  </option>
                ))}
              </select>
              <select className="input" aria-label="gacha" value={d.prefs?.ageMax} onChange={(e) => set({ prefs: { ageMax: Number(e.target.value) } })}>
                {ages.map((a) => (
                  <option key={a} value={a}>
                    {a} gacha
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Kim?">
            <Chips
              options={[
                { value: "ANY", label: "Farqi yo'q" },
                { value: "FEMALE", label: "Qiz" },
                { value: "MALE", label: "Yigit" },
              ]}
              value={d.prefs?.gender}
              onChange={(v) => set({ prefs: { gender: v } })}
            />
          </Field>
          <Field label="Qaysi viloyatdan?" hint="Ixtiyoriy. Ro'yxatni tartiblaydi, boshqalarni yashirmaydi">
            {regions && (
              <Chips
                multiple
                options={regions.map((r) => ({ value: r.id, label: label(r.names).replace(" viloyati", "") }))}
                value={d.prefs?.regionIds}
                onChange={(v) => set({ prefs: { regionIds: v } })}
              />
            )}
          </Field>
          <Field label="Uyda qaysi tilda gaplashasiz?">
            <Chips multiple options={LANG_OPTIONS} value={d.prefs?.languages} onChange={(v) => set({ prefs: { languages: v } })} />
          </Field>
          <ReligionField value={d.prefs?.religion} onChange={(v) => set({ prefs: { religion: v } })} />
        </>
      );
    },
  },
  {
    id: "story",
    title: "Oilangiz haqida",
    subtitle: "Nega yordam bermoqchisiz, qanday oilasiz — yoshlar buni birinchi o'qiydi",
    fields: ["story"],
    check: (d) => ((d.story?.trim().length ?? 0) < 30 ? "Kamida 30 ta belgi yozing" : contactError(d.story)),
    Body: ({ d, set }) => (
      <>
        <TextArea
          value={d.story}
          onChange={(v) => set({ story: v })}
          min={30}
          max={1000}
          placeholder="Masalan: Farzandlarimiz katta bo'lib, boshqa shaharga ketishdi. Uyimiz tinch, kitob o'qishni yaxshi ko'ramiz…"
        />
        {contactError(d.story) && <p className="field-error">{contactError(d.story)}</p>}
      </>
    ),
  },
];
