import { z } from "zod";

export const ENV = Symbol("ENV");

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

// Ishga tushishda env tekshiriladi — noto'g'ri sozlama bilan server ko'tarilmaydi
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: bool.default("false"),
  TELEGRAM_BOT_USERNAME: z.string().default(""),
  BOT_INTERNAL_SECRET: z.string().min(16),
  LOGIN_REQUEST_TTL_SEC: z.coerce.number().int().positive().default(10 * 60),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Env sozlamalari noto'g'ri:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    if (env.JWT_ACCESS_SECRET.startsWith("change-me") || env.JWT_ACCESS_SECRET.length < 32) {
      throw new Error("Production'da JWT_ACCESS_SECRET kamida 32 belgi va standart qiymatdan farqli bo'lishi kerak");
    }
    if (env.BOT_INTERNAL_SECRET.startsWith("change-me")) {
      throw new Error("Production'da BOT_INTERNAL_SECRET standart qiymatda qolmasligi kerak");
    }
    if (!env.COOKIE_SECURE) throw new Error("Production'da COOKIE_SECURE=true bo'lishi kerak");
  }
  return env;
}
