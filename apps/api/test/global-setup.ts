import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { PrismaClient } from "@mehr/db";

/** Test bazasini yaratadi (yo'q bo'lsa) va migratsiyalarni qo'llaydi */
export default async function setup() {
  const admin = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_DEV } } });
  try {
    await admin.$executeRawUnsafe("CREATE DATABASE mehr_test");
  } catch (e) {
    if (!String(e).includes("already exists")) throw e;
  } finally {
    await admin.$disconnect();
  }
  execSync("pnpm exec prisma migrate deploy", {
    cwd: resolve(__dirname, "../../../packages/db"),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
  // Ma'lumotnomalar (hududlar, shaharlar, teglar) — idempotent
  execSync("pnpm exec tsx prisma/seed.ts", {
    cwd: resolve(__dirname, "../../../packages/db"),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
}
