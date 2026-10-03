import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient } from "@mehr/db";
import { AppModule } from "../src/app.module";
import { loadEnv } from "../src/config/env";
import { configureApp } from "../src/setup";

export const SECRET = "test-internal-secret-123456";
export const prisma = new PrismaClient();
let app: INestApplication;
let base: string;

export async function startApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app, loadEnv());
  await app.listen(0);
  base = (await app.getUrl()).replace("[::1]", "localhost");
}

export async function stopApp() {
  await app?.close();
  await prisma.$disconnect();
}

/** Foydalanuvchi ma'lumotlarini tozalash (ma'lumotnomalar — hududlar, teglar — qoladi) */
export async function resetUsers() {
  // AuditLog trigger'i UPDATE/DELETE ni bloklaydi, TRUNCATE esa ishlaydi
  await prisma.$executeRawUnsafe(
    'TRUNCATE "AuditLog", "LoginRequest", "Session", "User", "Family", "FamilyInvite", "OnboardingDraft" RESTART IDENTITY CASCADE',
  );
}

export async function api(path: string, init: RequestInit & { json?: unknown } = {}) {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("content-type", "application/json");
  const res = await fetch(`${base}/v1${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (text ? JSON.parse(text) : null) as any, headers: res.headers };
}

export const internal = (path: string, json: unknown, secret = SECRET) =>
  api(`/internal/telegram/${path}`, { method: "POST", json, headers: { "x-internal-secret": secret } });

export const confirm = (json: unknown, secret = SECRET) => internal("login-confirm", json, secret);

export function codeFrom(deepLink: string, prefix = "login_"): string {
  const m = new RegExp(`start=${prefix}([A-Za-z0-9_-]+)$`).exec(deepLink);
  if (!m?.[1]) throw new Error(`deep-link noto'g'ri: ${deepLink}`);
  return m[1];
}

export function refreshCookie(headers: Headers): string {
  const raw = headers.getSetCookie().find((c) => c.startsWith("mehr_rt="));
  if (!raw) throw new Error("refresh cookie yo'q");
  return raw.split(";")[0]!;
}

/** To'liq kirish: start → bot tasdiqlaydi → poll */
export async function login(telegramId: string, phone?: string, names: { firstName?: string; lastName?: string } = {}) {
  const start = await api("/auth/telegram/start", { method: "POST" });
  const code = codeFrom(start.body.deepLink);
  const c = await confirm({ code, telegramId, phone, ...names });
  const poll = await api("/auth/telegram/poll", { method: "POST", json: { loginId: start.body.loginId, pollToken: start.body.pollToken } });
  return { start, code, confirm: c, poll };
}

/** Kirib, rol tanlab, Authorization sarlavhasini qaytaradi */
export async function loginWithRole(telegramId: string, phone: string, role: "YOUTH" | "FAMILY_ADULT", names = {}) {
  const { poll } = await login(telegramId, phone, names);
  const r = await api("/me/role", { method: "POST", headers: { authorization: `Bearer ${poll.body.accessToken}` }, json: { role } });
  return { authorization: `Bearer ${r.body.accessToken}` };
}
