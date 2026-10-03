import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FamilyController, InternalFamilyController } from "./family.controller";
import { FamilyInviteService } from "./family-invite.service";

@Module({ imports: [AuthModule], controllers: [FamilyController, InternalFamilyController], providers: [FamilyInviteService] })
export class FamilyModule {}
