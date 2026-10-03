import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import type { Prisma, TagType } from "@mehr/db";
import {
  MVP_MIN_AGE,
  checkAge,
  familyProfileSchema,
  youthProfileSchema,
  type FamilyProfileInput,
  type YouthProfileInput,
} from "@mehr/shared";
import { AuditService } from "../audit/audit.service";
import { FieldCipher } from "../common/field-cipher";
import { SettingsService } from "../common/settings.service";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

function invalid(path: Array<string | number>, message: string): never {
  throw new BadRequestException({ error: { code: "VALIDATION_FAILED", details: [{ path, message }] } });
}

function zodFail(issues: Array<{ path: Array<string | number>; message: string }>): never {
  throw new BadRequestException({
    error: { code: "VALIDATION_FAILED", details: issues.map((i) => ({ path: i.path, message: i.message })) },
  });
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: FieldCipher,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  // ───────────── Tekshiruvlar ─────────────

  parseYouth(data: unknown): YouthProfileInput {
    const r = youthProfileSchema.safeParse(data);
    if (!r.success) zodFail(r.error.issues);
    return r.data;
  }

  parseFamily(data: unknown): FamilyProfileInput {
    const r = familyProfileSchema.safeParse(data);
    if (!r.success) zodFail(r.error.issues);
    return r.data;
  }

  private async checkTags(ids: number[], type: TagType, path: string) {
    if (ids.length === 0) return;
    const unique = [...new Set(ids)];
    const found = await this.prisma.tag.count({ where: { id: { in: unique }, type, approved: true } });
    if (found !== unique.length) invalid([path], "Noma'lum teg");
  }

  private async checkCity(cityId: number, path: string) {
    if (!(await this.prisma.city.findUnique({ where: { id: cityId } }))) invalid([path], "Noma'lum shahar");
  }

  private async checkDistrict(districtId: number, cityId: number, path: Array<string | number>) {
    const d = await this.prisma.district.findUnique({ where: { id: districtId } });
    if (!d || d.cityId !== cityId) invalid(path, "Tuman tanlangan shaharga tegishli emas");
  }

  private async validateYouthRefs(v: YouthProfileInput) {
    const minAge = await this.settings.get<number>("platform.minAge", MVP_MIN_AGE);
    const ageError = checkAge(v.birthDate, minAge);
    if (ageError) invalid(["birthDate"], ageError);
    if (!(await this.prisma.region.findUnique({ where: { id: v.homeRegionId } }))) invalid(["homeRegionId"], "Noma'lum hudud");
    await this.checkCity(v.cityId, "cityId");
    await this.checkTags(v.interestTagIds, "INTEREST", "interestTagIds");
    await this.checkTags(v.skillTagIds, "SKILL", "skillTagIds");
  }

  private async validateFamilyRefs(v: FamilyProfileInput) {
    const ageError = checkAge(v.self.birthDate, 18, 100);
    if (ageError) invalid(["self", "birthDate"], ageError);
    v.members.forEach((m, i) => {
      if (checkAge(m.birthDate, 0, 110)) invalid(["members", i, "birthDate"], "Sana noto'g'ri");
    });
    await this.checkCity(v.cityId, "cityId");
    if (v.districtId) await this.checkDistrict(v.districtId, v.cityId, ["districtId"]);
    if (v.housing) await this.checkDistrict(v.housing.districtId, v.cityId, ["housing", "districtId"]);
    await this.checkTags(v.mentorTagIds, "MENTOR_AREA", "mentorTagIds");
    if (v.prefs.regionIds.length) {
      const n = await this.prisma.region.count({ where: { id: { in: v.prefs.regionIds } } });
      if (n !== new Set(v.prefs.regionIds).size) invalid(["prefs", "regionIds"], "Noma'lum hudud");
    }
  }

  // ───────────── Yosh ─────────────

  private youthData(v: YouthProfileInput) {
    return {
      firstName: v.firstName,
      lastName: v.lastName,
      homeRegionId: v.homeRegionId,
      cityId: v.cityId,
      schoolType: v.schoolType,
      schoolName: v.schoolName,
      fieldOfStudy: v.fieldOfStudy,
      course: v.course ?? null,
      bioGoals: v.bioGoals,
      temperament: v.temperament,
      routine: v.routine,
      smokes: v.smokes,
      prefs: v.prefs,
    };
  }

  private async writeYouthTags(tx: Tx, userId: string, v: YouthProfileInput) {
    await tx.youthTag.deleteMany({ where: { youthUserId: userId } });
    const tagIds = [...new Set([...v.interestTagIds, ...v.skillTagIds])];
    await tx.youthTag.createMany({ data: tagIds.map((tagId) => ({ youthUserId: userId, tagId })) });
  }

  async youthToInput(userId: string): Promise<YouthProfileInput | null> {
    const p = await this.prisma.youthProfile.findUnique({
      where: { userId },
      include: { tags: { include: { tag: true } }, user: true },
    });
    if (!p || !p.user.birthDate || !p.user.gender) return null;
    return {
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: toIso(p.user.birthDate),
      gender: p.user.gender,
      homeRegionId: p.homeRegionId,
      cityId: p.cityId,
      schoolType: p.schoolType,
      schoolName: p.schoolName,
      fieldOfStudy: p.fieldOfStudy,
      course: p.course ?? undefined,
      interestTagIds: p.tags.filter((t) => t.tag.type === "INTEREST").map((t) => t.tagId),
      skillTagIds: p.tags.filter((t) => t.tag.type === "SKILL").map((t) => t.tagId),
      temperament: p.temperament as YouthProfileInput["temperament"],
      routine: p.routine as YouthProfileInput["routine"],
      smokes: p.smokes,
      prefs: p.prefs as YouthProfileInput["prefs"],
      bioGoals: p.bioGoals,
    };
  }

  async createYouth(userId: string, raw: unknown) {
    const v = this.parseYouth(raw);
    await this.validateYouthRefs(v);
    return this.prisma.$transaction(async (tx) => {
      if (await tx.youthProfile.findUnique({ where: { userId } })) throw new ConflictException({ error: { code: "PROFILE_EXISTS" } });
      await tx.user.update({ where: { id: userId }, data: { birthDate: toDate(v.birthDate), gender: v.gender, regionId: v.homeRegionId } });
      await tx.youthProfile.create({ data: { userId, ...this.youthData(v), visibility: "DRAFT" } });
      await this.writeYouthTags(tx, userId, v);
      await this.audit.log({ actorId: userId, action: "profile.youth.create", entity: "YouthProfile", entityId: userId }, tx);
    });
  }

  async updateYouth(userId: string, raw: unknown) {
    const v = this.parseYouth(raw);
    await this.validateYouthRefs(v);
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.youthProfile.findUnique({ where: { userId }, include: { user: true } });
      if (!existing) throw new ForbiddenException({ error: { code: "PROFILE_NOT_FOUND" } });
      // Tug'ilgan sana va jins verifikatsiyadan keyin faqat fond orqali o'zgaradi
      const locked = existing.user.status === "ACTIVE";
      if (locked && (toIso(existing.user.birthDate!) !== v.birthDate || existing.user.gender !== v.gender)) {
        invalid(["birthDate"], "Tasdiqlangan profilda sana va jinsni fond orqali o'zgartirish mumkin");
      }
      await tx.user.update({ where: { id: userId }, data: { birthDate: toDate(v.birthDate), gender: v.gender, regionId: v.homeRegionId } });
      // O'zgartirilgan matn qayta moderatsiyadan o'tadi
      const visibility = existing.visibility === "VISIBLE" ? "IN_REVIEW" : existing.visibility;
      await tx.youthProfile.update({ where: { userId }, data: { ...this.youthData(v), visibility } });
      await this.writeYouthTags(tx, userId, v);
      await this.audit.log({ actorId: userId, action: "profile.youth.update", entity: "YouthProfile", entityId: userId }, tx);
    });
  }

  // ───────────── Oila ─────────────

  private familyData(v: FamilyProfileInput) {
    return {
      cityId: v.cityId,
      districtId: v.districtId ?? null,
      offerTypes: v.offerTypes,
      supportTypes: v.supportTypes,
      houseRules: v.houseRules,
      prefs: { ...v.prefs, story: v.story },
    };
  }

  private memberData(m: FamilyProfileInput["members"][number]) {
    return {
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: toDate(m.birthDate),
      gender: m.gender,
      roleInFamily: m.roleInFamily,
      occupation: m.occupation ?? null,
      livesInHouse: m.livesInHouse,
    };
  }

  private async writeFamilyExtras(tx: Tx, familyId: string, v: FamilyProfileInput) {
    await tx.familyTag.deleteMany({ where: { familyId } });
    await tx.familyTag.createMany({ data: [...new Set(v.mentorTagIds)].map((tagId) => ({ familyId, tagId })) });
    if (v.housing) {
      const h = v.housing;
      const data = {
        type: h.type,
        cityId: v.cityId,
        districtId: h.districtId,
        exactAddressEnc: this.cipher.encrypt(h.address),
        hasPrivateRoom: h.hasPrivateRoom,
        pets: h.pets,
        smokingInside: h.smokingInside,
      };
      await tx.housing.upsert({ where: { familyId }, create: { familyId, ...data }, update: data });
    } else {
      await tx.housing.deleteMany({ where: { familyId } });
    }
  }

  async familyIdOf(userId: string): Promise<string | null> {
    const m = await this.prisma.familyMember.findUnique({ where: { userId }, select: { familyId: true } });
    return m?.familyId ?? null;
  }

  async familyToInput(userId: string): Promise<(FamilyProfileInput & { memberIds: Array<string | null> }) | null> {
    const familyId = await this.familyIdOf(userId);
    if (!familyId) return null;
    const f = await this.prisma.family.findUniqueOrThrow({
      where: { id: familyId },
      include: { members: { orderBy: { createdAt: "asc" } }, housing: true, tags: true },
    });
    const self = f.members.find((m) => m.userId === userId)!;
    const others = f.members.filter((m) => m.id !== self.id);
    const toMember = (m: (typeof f.members)[number]) => ({
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: toIso(m.birthDate),
      gender: m.gender,
      roleInFamily: m.roleInFamily,
      occupation: m.occupation ?? undefined,
      livesInHouse: m.livesInHouse,
    });
    const { story, ...prefs } = f.prefs as FamilyProfileInput["prefs"] & { story: string };
    return {
      self: { ...toMember(self), occupation: self.occupation ?? "" },
      cityId: f.cityId,
      districtId: f.districtId ?? undefined,
      members: others.map(toMember),
      memberIds: others.map((m) => m.id),
      offerTypes: f.offerTypes,
      supportTypes: f.supportTypes,
      mentorTagIds: f.tags.map((t) => t.tagId),
      houseRules: f.houseRules as FamilyProfileInput["houseRules"],
      housing: f.housing
        ? {
            type: f.housing.type,
            districtId: f.housing.districtId,
            address: this.cipher.decrypt(f.housing.exactAddressEnc),
            hasPrivateRoom: f.housing.hasPrivateRoom,
            pets: f.housing.pets,
            smokingInside: f.housing.smokingInside,
          }
        : undefined,
      prefs,
      story,
    };
  }

  async createFamily(userId: string, raw: unknown) {
    const v = this.parseFamily(raw);
    await this.validateFamilyRefs(v);
    return this.prisma.$transaction(async (tx) => {
      if (await tx.familyMember.findUnique({ where: { userId } })) throw new ConflictException({ error: { code: "PROFILE_EXISTS" } });
      await tx.user.update({ where: { id: userId }, data: { birthDate: toDate(v.self.birthDate), gender: v.self.gender } });
      const family = await tx.family.create({ data: { ...this.familyData(v), visibility: "DRAFT" } });
      await tx.familyMember.create({ data: { familyId: family.id, userId, ...this.memberData(v.self) } });
      if (v.members.length) {
        await tx.familyMember.createMany({ data: v.members.map((m) => ({ familyId: family.id, ...this.memberData(m) })) });
      }
      await this.writeFamilyExtras(tx, family.id, v);
      await this.audit.log({ actorId: userId, action: "profile.family.create", entity: "Family", entityId: family.id }, tx);
      return family.id;
    });
  }

  /**
   * To'liq yangilash. `memberIds[i]` — `members[i]` qaysi mavjud a'zoga tegishli (yangi bo'lsa null).
   * Ro'yxatda yo'q, o'z logini bo'lmagan a'zolar o'chiriladi; logini bor a'zolar saqlanib qoladi.
   */
  async updateFamily(userId: string, raw: unknown, memberIds: Array<string | null> = []) {
    const v = this.parseFamily(raw);
    await this.validateFamilyRefs(v);
    const familyId = await this.familyIdOf(userId);
    if (!familyId) throw new ForbiddenException({ error: { code: "PROFILE_NOT_FOUND" } });

    await this.prisma.$transaction(async (tx) => {
      const family = await tx.family.findUniqueOrThrow({ where: { id: familyId }, include: { members: true } });
      const visibility = family.visibility === "VISIBLE" ? "IN_REVIEW" : family.visibility;
      await tx.family.update({ where: { id: familyId }, data: { ...this.familyData(v), visibility } });

      const self = family.members.find((m) => m.userId === userId)!;
      await tx.familyMember.update({ where: { id: self.id }, data: this.memberData(v.self) });

      const owned = new Map(family.members.filter((m) => m.id !== self.id).map((m) => [m.id, m]));
      const kept = new Set<string>();
      for (const [i, m] of v.members.entries()) {
        const id = memberIds[i];
        if (id && owned.has(id)) {
          await tx.familyMember.update({ where: { id }, data: this.memberData(m) });
          kept.add(id);
        } else {
          await tx.familyMember.create({ data: { familyId, ...this.memberData(m) } });
        }
      }
      const removable = [...owned.values()].filter((m) => !kept.has(m.id) && !m.userId).map((m) => m.id);
      if (removable.length) await tx.familyMember.deleteMany({ where: { id: { in: removable } } });

      await this.writeFamilyExtras(tx, familyId, v);
      await this.audit.log({ actorId: userId, action: "profile.family.update", entity: "Family", entityId: familyId }, tx);
    });
  }
}
