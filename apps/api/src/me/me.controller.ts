import { Controller, Get, UseGuards } from "@nestjs/common";
import type { AccessClaims } from "../auth/access-token.service";
import { Auth, AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("me")
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@Auth() auth: AccessClaims) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub } });
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
}
