import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ageOn } from "@mehr/shared";
import { AuditService } from "../audit/audit.service";
import { randomToken, sha256 } from "../auth/tokens";
import { TelegramLoginService, type TelegramIdentity } from "../auth/telegram-login.service";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";

export const JOIN_START_PREFIX = "join_";
const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;

export type JoinResult =
  | { result: "OK"; familyName: string }
  | { result: "NEED_PHONE" | "INVALID_PHONE" | "PHONE_TAKEN" | "BLOCKED" | "EXPIRED" | "ALREADY_REGISTERED" };

/**
 * Oilaning boshqa katta a'zosini taklif qilish: a'zo Telegram havolasini bosadi va
 * hech qanday forma to'ldirmasdan oilaga qo'shiladi (ma'lumotlari allaqachon kiritilgan).
 */
@Injectable()
export class FamilyInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramLoginService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async create(inviterId: string, memberId: string) {
    if (!this.env.TELEGRAM_BOT_USERNAME) throw new ServiceUnavailableException({ error: { code: "TELEGRAM_NOT_CONFIGURED" } });
    const inviter = await this.prisma.familyMember.findUnique({ where: { userId: inviterId } });
    const member = await this.prisma.familyMember.findUnique({ where: { id: memberId } });
    if (!inviter || !member || member.familyId !== inviter.familyId) throw new NotFoundException({ error: { code: "MEMBER_NOT_FOUND" } });
    if (member.userId) throw new BadRequestException({ error: { code: "MEMBER_ALREADY_LINKED" } });
    if (ageOn(member.birthDate) < 18) throw new ForbiddenException({ error: { code: "MEMBER_IS_MINOR" } });

    // Eski taklifni bekor qilish — bir a'zoga bitta faol havola
    await this.prisma.familyInvite.updateMany({ where: { memberId, usedAt: null }, data: { expiresAt: new Date() } });
    const code = randomToken(24);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await this.prisma.familyInvite.create({
      data: { codeHash: sha256(code), familyId: member.familyId, memberId, createdById: inviterId, expiresAt },
    });
    await this.audit.log({ actorId: inviterId, action: "family.invite.create", entity: "FamilyMember", entityId: memberId });
    return {
      deepLink: `https://t.me/${this.env.TELEGRAM_BOT_USERNAME}?start=${JOIN_START_PREFIX}${code}`,
      expiresAt: expiresAt.toISOString(),
      memberName: member.firstName,
    };
  }

  async join(code: string, identity: TelegramIdentity): Promise<JoinResult> {
    const invite = await this.prisma.familyInvite.findUnique({
      where: { codeHash: sha256(code) },
      include: { member: true, family: { include: { members: { where: { userId: { not: null } }, take: 1 } } } },
    });
    if (!invite || invite.usedAt || invite.expiresAt < new Date() || invite.member.userId) return { result: "EXPIRED" };

    const resolved = await this.telegram.resolveUser(identity);
    if (!resolved.ok) return { result: resolved.result };
    const { user } = resolved;

    // Allaqachon yosh, boshqa oila a'zosi yoki xodim bo'lsa — qo'shib bo'lmaydi
    const otherMembership = await this.prisma.familyMember.findUnique({ where: { userId: user.id } });
    if ((user.role && user.role !== "FAMILY_ADULT") || otherMembership) return { result: "ALREADY_REGISTERED" };

    const linked = await this.prisma.$transaction(async (tx) => {
      const used = await tx.familyInvite.updateMany({ where: { id: invite.id, usedAt: null }, data: { usedAt: new Date() } });
      if (used.count !== 1) return false;
      const member = await tx.familyMember.updateMany({ where: { id: invite.memberId, userId: null }, data: { userId: user.id } });
      if (member.count !== 1) return false;
      await tx.user.update({
        where: { id: user.id },
        data: { role: "FAMILY_ADULT", birthDate: invite.member.birthDate, gender: invite.member.gender },
      });
      await this.audit.log({ actorId: user.id, action: "family.invite.accept", entity: "FamilyMember", entityId: invite.memberId }, tx);
      return true;
    });
    if (!linked) return { result: "EXPIRED" };

    const head = invite.family.members[0];
    return { result: "OK", familyName: head ? `${head.lastName}lar oilasi` : "oila" };
  }
}
