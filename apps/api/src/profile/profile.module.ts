import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChecklistService } from "../onboarding/checklist.service";
import { OnboardingController } from "../onboarding/onboarding.controller";
import { ReferenceController } from "../reference/reference.controller";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [AuthModule],
  controllers: [ProfileController, OnboardingController, ReferenceController],
  providers: [ProfileService, ChecklistService],
  exports: [ProfileService, ChecklistService],
})
export class ProfileModule {}
