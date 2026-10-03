import { Body, Controller, ForbiddenException, Get, Put, UseGuards } from "@nestjs/common";
import { z } from "zod";
import type { AccessClaims } from "../auth/access-token.service";
import { Auth, AuthGuard } from "../auth/auth.guard";
import { parseBody } from "../common/zod";
import { ChecklistService } from "../onboarding/checklist.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "./profile.service";

const FamilyPutBody = z.object({
  profile: z.unknown(),
  memberIds: z.array(z.string().uuid().nullable()).max(15).default([]),
});

/** O'z profilini ko'rish va tahrirlash (onboarding shakli bilan bir xil) */
@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
    private readonly checklist: ChecklistService,
  ) {}

  private async role(userId: string) {
    return (await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } })).role;
  }

  @Get("me")
  async mine(@Auth() auth: AccessClaims) {
    const role = await this.role(auth.sub);
    const profile =
      role === "YOUTH"
        ? await this.profiles.youthToInput(auth.sub)
        : role === "FAMILY_ADULT"
          ? await this.profiles.familyToInput(auth.sub)
          : null;
    return { role, profile, checklist: await this.checklist.forUser(auth.sub) };
  }

  @Put("me")
  async update(@Auth() auth: AccessClaims, @Body() body: unknown) {
    const role = await this.role(auth.sub);
    if (role === "YOUTH") await this.profiles.updateYouth(auth.sub, body);
    else if (role === "FAMILY_ADULT") {
      const { profile, memberIds } = parseBody(FamilyPutBody, body);
      await this.profiles.updateFamily(auth.sub, profile, memberIds);
    } else throw new ForbiddenException({ error: { code: "ROLE_REQUIRED" } });
    return this.mine(auth);
  }
}
