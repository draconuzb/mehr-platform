import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

loadDotenv({ path: resolve(__dirname, "../../.env") });

// e2e testlar alohida "mehr_test" bazasida ishlaydi — dev ma'lumotlariga tegmaydi
const devUrl = new URL(process.env.DATABASE_URL ?? "postgresql://mehr:mehr_dev_password@localhost:5432/mehr");
const testUrl = new URL(devUrl);
testUrl.pathname = "/mehr_test";
process.env.DATABASE_URL_DEV = devUrl.toString();
process.env.DATABASE_URL = testUrl.toString();

export default defineConfig({
  // NestJS DI uchun decorator metadata kerak — esbuild buni bermaydi, shuning uchun SWC
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globalSetup: ["./test/global-setup.ts"],
    env: {
      DATABASE_URL: testUrl.toString(),
      TELEGRAM_BOT_USERNAME: "mehr_test_bot",
      BOT_INTERNAL_SECRET: "test-internal-secret-123456",
      NODE_ENV: "test",
      AUTH_START_LIMIT_PER_MIN: "1000",
      FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    },
    fileParallelism: false,
  },
});
