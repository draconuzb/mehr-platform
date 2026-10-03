import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import type { Env } from "./config/env";

/** main.ts va testlar uchun umumiy sozlama */
export function configureApp(app: INestApplication, env: Env): void {
  const express = app as NestExpressApplication;
  // Reverse proxy (nginx) orqasida haqiqiy IP ni olish uchun
  if (env.NODE_ENV === "production") express.set("trust proxy", 1);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: [env.WEB_ORIGIN, env.ADMIN_ORIGIN], credentials: true });
  app.setGlobalPrefix("v1");
  app.enableShutdownHooks();
}
