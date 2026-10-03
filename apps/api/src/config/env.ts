import { z } from "zod";

// Ishga tushishda env tekshiriladi — noto'g'ri sozlama bilan server ko'tarilmaydi
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Env sozlamalari noto'g'ri:\n${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_ACCESS_SECRET.startsWith("change-me")) {
    throw new Error("Production'da JWT_ACCESS_SECRET standart qiymatda qolmasligi kerak");
  }
  return parsed.data;
}
