import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { Prisma } from "@mehr/db";
import type { AccessClaims } from "../auth/access-token.service";
import { Auth, AuthGuard } from "../auth/auth.guard";
import { parseBody } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "../profile/profile.service";
import { ChecklistService } from "./checklist.service";

const MAX_DRAFT_BYTES = 32 * 1024;

const PatchBody = z.object({
  step: z.string().max(40).optional(),
  data: z.record(z.unknown()),
});

type Json = Record<string, unknown>;
const isPlain = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** Ichma-ich obyektlar birlashtiriladi, massivlar va oddiy qiymatlar almashtiriladi; null — maydonni o'chiradi */
export function mergeDraft(base: Json, patch: Json): Json {
  const out: Json = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    if (v === null) delete out[k];
    else if (isPlain(v) && isPlain(out[k])) out[k] = mergeDraft(out[k] as Json, v);
    else out[k] = v;
  }
  return out;
}

@Controller("onboarding")
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
    private readonly checklist: ChecklistService,
  ) {}

  @Get()
  async state(@Auth() auth: AccessClaims) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub }, include: { onboardingDraft: true } });
    return {
      role: user.role,
      step: user.onboardingDraft?.step ?? null,
      draft: (user.onboardingDraft?.data as Json | undefined) ?? {},
      // Telegram'dagi ism — birinchi qadamni avtomatik to'ldirish uchun
      prefill: { firstName: user.tgFirstName, lastName: user.tgLastName },
      checklist: await this.checklist.forUser(auth.sub),
    };
  }

  @Patch()
  async saveDraft(@Auth() auth: AccessClaims, @Body() body: unknown) {
    const { step, data } = parseBody(PatchBody, body);
    const existing = await this.prisma.onboardingDraft.findUnique({ where: { userId: auth.sub } });
    const merged = mergeDraft((existing?.data as Json | undefined) ?? {}, data);
    if (Buffer.byteLength(JSON.stringify(merged)) > MAX_DRAFT_BYTES) {
      throw new BadRequestException({ error: { code: "DRAFT_TOO_LARGE" } });
    }
    const json = merged as Prisma.InputJsonObject;
    await this.prisma.onboardingDraft.upsert({
      where: { userId: auth.sub },
      create: { userId: auth.sub, step, data: json },
      update: { step, data: json },
    });
    return { ok: true, draft: merged };
  }

  /** Qoralamadan haqiqiy profil yaratadi. Xatolar maydon yo'li bilan qaytadi — sayt kerakli qadamga o'tkazadi. */
  @Post("complete")
  @HttpCode(200)
  async complete(@Auth() auth: AccessClaims) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub }, include: { onboardingDraft: true } });
    const draft = user.onboardingDraft?.data ?? {};
    if (user.role === "YOUTH") await this.profiles.createYouth(user.id, draft);
    else if (user.role === "FAMILY_ADULT") await this.profiles.createFamily(user.id, draft);
    else throw new ForbiddenException({ error: { code: "ROLE_REQUIRED" } });
    return { ok: true, checklist: await this.checklist.forUser(user.id) };
  }
}
