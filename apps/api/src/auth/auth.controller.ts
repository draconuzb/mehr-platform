import { Body, Controller, GoneException, HttpCode, Inject, NotFoundException, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { z } from "zod";
import type { User } from "@mehr/db";
import { AuditService } from "../audit/audit.service";
import { requestMeta } from "../common/request-meta";
import { parseBody } from "../common/zod";
import { ENV, type Env } from "../config/env";
import { AccessTokenService } from "./access-token.service";
import { Auth, AuthGuard } from "./auth.guard";
import type { AccessClaims } from "./access-token.service";
import { SessionService } from "./session.service";
import { TelegramLoginService } from "./telegram-login.service";

export const REFRESH_COOKIE = "mehr_rt";
const REFRESH_COOKIE_PATH = "/v1/auth";

// Limit so'rov vaqtida o'qiladi — testlarda va yuklama sinovlarida env orqali o'zgartiriladi
const startLimit = () => Number(process.env.AUTH_START_LIMIT_PER_MIN ?? 10);

const PollBody = z.object({ loginId: z.string().uuid(), pollToken: z.string().min(20).max(100) });

export function publicUser(u: User) {
  return { id: u.id, role: u.role, status: u.status, locale: u.locale };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly telegram: TelegramLoginService,
    private readonly sessions: SessionService,
    private readonly tokens: AccessTokenService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.env.COOKIE_SECURE,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      maxAge: this.env.REFRESH_TTL_DAYS * 24 * 3600 * 1000,
    });
  }

  @Post("telegram/start")
  @HttpCode(201)
  @Throttle({ default: { limit: startLimit, ttl: 60_000 } })
  start(@Req() req: Request) {
    return this.telegram.start(requestMeta(req));
  }

  @Post("telegram/poll")
  @HttpCode(200)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async poll(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { loginId, pollToken } = parseBody(PollBody, body);
    const result = await this.telegram.poll(loginId, pollToken);

    switch (result.status) {
      case "NOT_FOUND":
        throw new NotFoundException({ error: { code: "LOGIN_NOT_FOUND" } });
      case "CONSUMED":
        throw new GoneException({ error: { code: "LOGIN_ALREADY_USED" } });
      case "PENDING":
      case "EXPIRED":
        return { status: result.status };
      case "OK": {
        const meta = requestMeta(req);
        const { session, refreshToken } = await this.sessions.create(result.user.id, meta);
        this.setRefreshCookie(res, refreshToken);
        await this.audit.log({ actorId: result.user.id, action: "auth.login", entity: "Session", entityId: session.id, ip: meta.ip });
        return {
          status: "OK",
          accessToken: this.tokens.sign({ sub: result.user.id, sid: session.id, role: result.user.role }),
          user: publicUser(result.user),
        };
      }
    }
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== "string" || !token) throw new UnauthorizedException({ error: { code: "INVALID_REFRESH" } });
    try {
      const { session, user, refreshToken } = await this.sessions.rotate(token, requestMeta(req));
      this.setRefreshCookie(res, refreshToken);
      return { accessToken: this.tokens.sign({ sub: user.id, sid: session.id, role: user.role }), user: publicUser(user) };
    } catch (e) {
      res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
      throw e;
    }
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(@Auth() auth: AccessClaims, @Res({ passthrough: true }) res: Response) {
    await this.sessions.revoke(auth.sid, "LOGOUT");
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }
}
