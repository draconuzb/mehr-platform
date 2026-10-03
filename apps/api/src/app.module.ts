import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { ConfigModule } from "./config/config.module";
import { FamilyModule } from "./family/family.module";
import { HealthController } from "./health/health.controller";
import { MeModule } from "./me/me.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    CommonModule,
    // Standart: IP bo'yicha daqiqasiga 120 so'rov; nozik endpointlarda alohida limit
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    AuthModule,
    MeModule,
    ProfileModule,
    FamilyModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
