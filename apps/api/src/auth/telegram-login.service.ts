import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Prisma, type User } from "@mehr/db";
import { AuditService } from "../audit/audit.service";
import type { RequestMeta } from "../common/request-meta";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { normalizePhone, randomToken, safeEqualHex, sha256 } from "./tokens";

export const LOGIN_START_PREFIX = "login_";

export interface TelegramIdentity {
  telegramId: bigint;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface ConfirmInput extends TelegramIdentity {
  code: string;
}

export type ResolveResult =
  | { ok: true; user: User; isNew: boolean }
  | { ok: false; result: "NEED_PHONE" | "INVALID_PHONE" | "PHONE_TAKEN" | "BLOCKED" };

export type ConfirmResult =
  | { result: "OK"; isNew: boolean }
  | { result: "NEED_PHONE" }
  | { result: "EXPIRED" }
  | { result: "INVALID_PHONE" }
  | { result: "PHONE_TAKEN" }
  | { result: "BLOCKED" };

export type PollResult =
  | { status: "PENDING" }
  | { status: "EXPIRED" }
  | { status: "CONSUMED" }
  | { status: "NOT_FOUND" }
  | { status: "OK"; user: User };

const BLOCKED_STATUSES = new Set(["BANNED", "DELETED"]);

@Injectable()
export class TelegramLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** 1-qadam (sayt): deep-link va so'rov tokenini yaratadi */
  async start(meta: RequestMeta) {
    if (!this.env.TELEGRAM_BOT_USERNAME) {
      throw new ServiceUnavailableException({ error: { code: "TELEGRAM_NOT_CONFIGURED" } });
    }
    const code = randomToken(24);
    const pollToken = randomToken(32);
    const expiresAt = new Date(Date.now() + this.env.LOGIN_REQUEST_TTL_SEC * 1000);

    const req = await this.prisma.loginRequest.create({
      data: { codeHash: sha256(code), pollTokenHash: sha256(pollToken), expiresAt, ip: meta.ip, userAgent: meta.userAgent },
    });

    return {
      loginId: req.id,
      pollToken,
      deepLink: `https://t.me/${this.env.TELEGRAM_BOT_USERNAME}?start=${LOGIN_START_PREFIX}${code}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * 2-qadam (bot): foydalanuvchini aniqlaydi yoki yaratadi va so'rovni tasdiqlaydi.
   * Bot telefon raqamini faqat contact.user_id === from.id bo'lganda yuboradi.
   */
  async confirm(input: ConfirmInput): Promise<ConfirmResult> {
    const req = await this.prisma.loginRequest.findUnique({ where: { codeHash: sha256(input.code) } });
    if (!req || req.status !== "PENDING" || req.expiresAt < new Date()) return { result: "EXPIRED" };

    const resolved = await this.resolveUser(input);
    if (!resolved.ok) return { result: resolved.result };
    const { user, isNew } = resolved;

    const updated = await this.prisma.loginRequest.updateMany({
      where: { id: req.id, status: "PENDING" },
      data: { status: "CONFIRMED", userId: user.id, telegramId: input.telegramId, confirmedAt: new Date() },
    });
    if (updated.count !== 1) return { result: "EXPIRED" };

    await this.audit.log({
      actorId: user.id,
      action: isNew ? "auth.telegram.register" : "auth.telegram.confirm",
      entity: "LoginRequest",
      entityId: req.id,
    });
    return { result: "OK", isNew };
  }

  /**
   * Telegram ID bo'yicha foydalanuvchini topadi yoki (tasdiqlangan raqam bilan) yaratadi.
   * Login va oilaga qo'shilish oqimlari uchun umumiy.
   */
  async resolveUser(input: TelegramIdentity): Promise<ResolveResult> {
    const names = {
      tgFirstName: input.firstName?.slice(0, 64) || undefined,
      tgLastName: input.lastName?.slice(0, 64) || undefined,
    };
    let user = await this.prisma.user.findUnique({ where: { telegramId: input.telegramId } });
    let isNew = false;

    if (!user) {
      if (!input.phone) return { ok: false, result: "NEED_PHONE" };
      const phone = normalizePhone(input.phone);
      if (!phone) return { ok: false, result: "INVALID_PHONE" };

      const byPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (byPhone) {
        // Raqam boshqa Telegram akkauntiga bog'langan bo'lsa — qayta bog'lamaymiz (akkauntni egallab olishning oldini olish)
        if (byPhone.telegramId !== null) return { ok: false, result: "PHONE_TAKEN" };
        user = await this.prisma.user.update({ where: { id: byPhone.id }, data: { telegramId: input.telegramId, ...names } });
      } else {
        try {
          user = await this.prisma.user.create({ data: { phone, telegramId: input.telegramId, ...names } });
          isNew = true;
        } catch (e) {
          // Parallel so'rov xuddi shu raqam yoki Telegram ID bilan foydalanuvchi yaratib ulgurgan
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, result: "PHONE_TAKEN" };
          throw e;
        }
      }
    } else if (names.tgFirstName && names.tgFirstName !== user.tgFirstName) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: names });
    }

    if (BLOCKED_STATUSES.has(user.status)) return { ok: false, result: "BLOCKED" };
    return { ok: true, user, isNew };
  }

  /** 3-qadam (sayt): tasdiqlangan so'rovni bir martalik iste'mol qiladi */
  async poll(loginId: string, pollToken: string): Promise<PollResult> {
    const req = await this.prisma.loginRequest.findUnique({ where: { id: loginId }, include: { user: true } });
    if (!req || !safeEqualHex(req.pollTokenHash, sha256(pollToken))) return { status: "NOT_FOUND" };

    if (req.status === "CONSUMED") return { status: "CONSUMED" };
    if (req.status === "PENDING") {
      if (req.expiresAt < new Date()) {
        await this.prisma.loginRequest.updateMany({ where: { id: req.id, status: "PENDING" }, data: { status: "EXPIRED" } });
        return { status: "EXPIRED" };
      }
      return { status: "PENDING" };
    }
    if (req.status === "EXPIRED" || !req.user) return { status: "EXPIRED" };

    const consumed = await this.prisma.loginRequest.updateMany({
      where: { id: req.id, status: "CONFIRMED" },
      data: { status: "CONSUMED", consumedAt: new Date() },
    });
    if (consumed.count !== 1) return { status: "CONSUMED" };
    return { status: "OK", user: req.user };
  }
}
