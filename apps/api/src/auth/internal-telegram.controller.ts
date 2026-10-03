import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { z } from "zod";
import { parseBody } from "../common/zod";
import { InternalSecretGuard } from "./internal-secret.guard";
import { TelegramLoginService } from "./telegram-login.service";

const ConfirmBody = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
  telegramId: z.union([z.string().regex(/^\d{1,20}$/), z.number().int().positive()]).transform((v) => BigInt(v)),
  phone: z.string().max(32).optional(),
  firstName: z.string().max(64).optional(),
  lastName: z.string().max(64).optional(),
});

/** Faqat Telegram bot chaqiradi (X-Internal-Secret bilan) */
@Controller("internal/telegram")
@UseGuards(InternalSecretGuard)
@SkipThrottle()
export class InternalTelegramController {
  constructor(private readonly telegram: TelegramLoginService) {}

  @Post("login-confirm")
  @HttpCode(200)
  confirm(@Body() body: unknown) {
    return this.telegram.confirm(parseBody(ConfirmBody, body));
  }
}
