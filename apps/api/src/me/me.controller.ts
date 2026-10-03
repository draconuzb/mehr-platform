import { Body, ConflictException, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import type { User } from "@mehr/db";
import { AuditService } from "../audit/audit.service";
import { AccessTokenService, type AccessClaims } from "../auth/access-token.service";
import { publicUser } from "../auth/auth.controller";
import { Auth, AuthGuard } from "../auth/auth.guard";
import { parseBody } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";

// Foydalanuvchi o'zi tanlay oladigan rollar. Xodim rollarini faqat admin beradi;
// ota-ona (GUARDIAN) roli v2 da taklif havolasi orqali beriladi.
const RoleBody = z.object({ role: z.enum(["YOUTH", "FAMILY_ADULT"]) });

function meView(u: User) {
  return {
    id: u.id,
    phone: u.phone,
    role: u.role,
    status: u.status,
    locale: u.locale,
    telegramLinked: u.telegramId !== null,
    // Onboarding checklisti (TZ 5F, B8) — keyingi sprintlarda kengayadi
    onboarding: { roleChosen: u.role !== null },
  };
}

@Controller("me")
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: AccessTokenService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async me(@Auth() auth: AccessClaims) {
    return meView(await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub } }));
  }

  /** Rol bir marta tanlanadi. Yangi rol bilan access token qaytariladi. */
  @Post("role")
  @HttpCode(200)
  async chooseRole(@Auth() auth: AccessClaims, @Body() body: unknown, @Req() req: Request) {
    const { role } = parseBody(RoleBody, body);
    // Shartli yangilash: parallel so'rovlardan faqat bittasi o'tadi
    const updated = await this.prisma.user.updateMany({ where: { id: auth.sub, role: null }, data: { role } });
    if (updated.count !== 1) throw new ConflictException({ error: { code: "ROLE_ALREADY_SET" } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub } });
    await this.audit.log({ actorId: user.id, action: "user.role.set", entity: "User", entityId: user.id, diff: { role }, ip: req.ip });
    return {
      user: publicUser(user),
      me: meView(user),
      accessToken: this.tokens.sign({ sub: user.id, sid: auth.sid, role: user.role }),
    };
  }
}
