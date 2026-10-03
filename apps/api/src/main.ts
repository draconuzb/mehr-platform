import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { configureApp } from "./setup";

loadDotenv({ path: resolve(__dirname, "../../../.env") });

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app, env);
  await app.listen(env.API_PORT);
  console.log(`API: http://localhost:${env.API_PORT}/v1/health`);
}

void bootstrap();
