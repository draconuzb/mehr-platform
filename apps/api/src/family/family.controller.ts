import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { z } from "zod";
import type { AccessClaims } from "../auth/access-token.service";
import { Auth, AuthGuard } from "../auth/auth.guard";
import { InternalSecretGuard } from "../auth/internal-secret.guard";
import { parseBody } from "../common/zod";
import { FamilyInviteService } from "./family-invite.service";

@Controller("family")
@UseGuards(AuthGuard)
export class FamilyController {
  constructor(private readonly invites: FamilyInviteService) {}

  @Post("members/:memberId/invite")
  @HttpCode(201)
  invite(@Auth() auth: AccessClaims, @Param("memberId", ParseUUIDPipe) memberId: string) {
    return this.invites.create(auth.sub, memberId);
  }
}

const JoinBody = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
  telegramId: z.union([z.string().regex(/^\d{1,20}$/), z.number().int().positive()]).transform((v) => BigInt(v)),
  phone: z.string().max(32).optional(),
  firstName: z.string().max(64).optional(),
  lastName: z.string().max(64).optional(),
});

@Controller("internal/telegram")
@UseGuards(InternalSecretGuard)
@SkipThrottle()
export class InternalFamilyController {
  constructor(private readonly invites: FamilyInviteService) {}

  @Post("family-join")
  @HttpCode(200)
  join(@Body() body: unknown) {
    const { code, ...identity } = parseBody(JoinBody, body);
    return this.invites.join(code, identity);
  }
}
