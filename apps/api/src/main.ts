import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";

loadDotenv({ path: resolve(__dirname, "../../../.env") });

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.enableCors({ origin: [env.WEB_ORIGIN, env.ADMIN_ORIGIN], credentials: true });
  app.setGlobalPrefix("v1");
  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
  console.log(`API: http://localhost:${env.API_PORT}/v1/health`);
}

void bootstrap();
