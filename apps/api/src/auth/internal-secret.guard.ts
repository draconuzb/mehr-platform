import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { ENV, type Env } from "../config/env";
import { safeEqualString } from "./tokens";

/** Faqat ichki servislar (Telegram bot) uchun: X-Internal-Secret sarlavhasi */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(@Inject(ENV) private readonly env: Env) {}

  canActivate(ctx: ExecutionContext): boolean {
    const header = ctx.switchToHttp().getRequest<Request>().headers["x-internal-secret"];
    if (typeof header !== "string" || !safeEqualString(header, this.env.BOT_INTERNAL_SECRET)) {
      throw new UnauthorizedException({ error: { code: "UNAUTHENTICATED" } });
    }
    return true;
  }
}
