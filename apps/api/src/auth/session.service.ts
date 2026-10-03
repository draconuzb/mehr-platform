import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Session, User } from "@mehr/db";
import { AuditService } from "../audit/audit.service";
import type { RequestMeta } from "../common/request-meta";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { randomToken, sha256 } from "./tokens";

const BLOCKED_STATUSES = new Set(["BANNED", "DELETED"]);

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private expiry(): Date {
    return new Date(Date.now() + this.env.REFRESH_TTL_DAYS * 24 * 3600 * 1000);
  }

  async create(userId: string, meta: RequestMeta): Promise<{ session: Session; refreshToken: string }> {
    const refreshToken = randomToken(32);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: sha256(refreshToken),
        device: meta.userAgent,
        ip: meta.ip,
        expiresAt: this.expiry(),
      },
    });
    return { session, refreshToken };
  }

  /**
   * Refresh token rotatsiyasi. Avvalgi (allaqachon almashtirilgan) token qayta kelsa —
   * u o'g'irlangan deb hisoblanadi va foydalanuvchining barcha sessiyalari bekor qilinadi.
   */
  async rotate(refreshToken: string, meta: RequestMeta): Promise<{ session: Session; user: User; refreshToken: string }> {
    const hash = sha256(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash }, include: { user: true } });

    if (!session) {
      const reused = await this.prisma.session.findFirst({ where: { prevRefreshTokenHash: hash } });
      if (reused) {
        await this.revokeAllForUser(reused.userId, "REFRESH_TOKEN_REUSE");
        await this.audit.log({
          actorId: reused.userId,
          action: "auth.refresh.reuse_detected",
          entity: "Session",
          entityId: reused.id,
          ip: meta.ip,
        });
      }
      throw new UnauthorizedException({ error: { code: "INVALID_REFRESH" } });
    }

    if (session.revokedAt || session.expiresAt < new Date() || BLOCKED_STATUSES.has(session.user.status)) {
      throw new UnauthorizedException({ error: { code: "INVALID_REFRESH" } });
    }

    const next = randomToken(32);
    // Shartli yangilash: parallel so'rovlardan faqat bittasi muvaffaqiyatli bo'ladi
    const updated = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: hash, revokedAt: null },
      data: { refreshTokenHash: sha256(next), prevRefreshTokenHash: hash, lastUsedAt: new Date(), ip: meta.ip },
    });
    if (updated.count !== 1) throw new UnauthorizedException({ error: { code: "INVALID_REFRESH" } });

    const { user, ...rest } = session;
    return { session: rest, user, refreshToken: next };
  }

  async isActive(sessionId: string): Promise<boolean> {
    const s = await this.prisma.session.findUnique({ where: { id: sessionId }, select: { revokedAt: true, expiresAt: true } });
    return !!s && !s.revokedAt && s.expiresAt > new Date();
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async revokeAllForUser(userId: string, reason: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }
}
