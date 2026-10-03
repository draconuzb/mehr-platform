import { Module } from "@nestjs/common";
import { AccessTokenService } from "./access-token.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { InternalSecretGuard } from "./internal-secret.guard";
import { InternalTelegramController } from "./internal-telegram.controller";
import { SessionService } from "./session.service";
import { TelegramLoginService } from "./telegram-login.service";

@Module({
  controllers: [AuthController, InternalTelegramController],
  providers: [AccessTokenService, SessionService, TelegramLoginService, AuthGuard, InternalSecretGuard],
  exports: [AccessTokenService, SessionService, AuthGuard, InternalSecretGuard, TelegramLoginService],
})
export class AuthModule {}
