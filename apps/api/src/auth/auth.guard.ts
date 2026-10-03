import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";
import { AccessTokenService, type AccessClaims } from "./access-token.service";
import { SessionService } from "./session.service";

export type AuthedRequest = Request & { auth: AccessClaims };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokens: AccessTokenService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    const claims = scheme === "Bearer" && token ? this.tokens.verify(token) : null;
    // Sessiya bekor qilingan bo'lsa (logout, o'g'irlik aniqlangan) — access token ham darhol yaroqsiz
    if (!claims || !(await this.sessions.isActive(claims.sid))) {
      throw new UnauthorizedException({ error: { code: "UNAUTHENTICATED" } });
    }
    req.auth = claims;
    return true;
  }
}

export const Auth = createParamDecorator((_: unknown, ctx: ExecutionContext): AccessClaims => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().auth;
});
