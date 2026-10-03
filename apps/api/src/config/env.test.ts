import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "http://localhost:3000",
  ADMIN_ORIGIN: "http://localhost:3001",
  JWT_ACCESS_SECRET: "change-me-access",
  BOT_INTERNAL_SECRET: "change-me-bot-internal",
  FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
};

const prod = {
  ...base,
  NODE_ENV: "production",
  JWT_ACCESS_SECRET: "x".repeat(40),
  BOT_INTERNAL_SECRET: "y".repeat(40),
  COOKIE_SECURE: "true",
};

describe("loadEnv", () => {
  it("to'g'ri env'ni qabul qiladi", () => {
    const env = loadEnv(base);
    expect(env.API_PORT).toBe(4000);
    expect(env.COOKIE_SECURE).toBe(false);
  });
  it("DATABASE_URL bo'lmasa xato beradi", () => {
    const { DATABASE_URL: _, ...rest } = base;
    expect(() => loadEnv(rest)).toThrow(/DATABASE_URL/);
  });
  it("production'da to'g'ri sozlamani qabul qiladi", () => {
    expect(loadEnv(prod).COOKIE_SECURE).toBe(true);
  });
  it("production'da standart JWT sirini rad etadi", () => {
    expect(() => loadEnv({ ...prod, JWT_ACCESS_SECRET: "change-me-access" })).toThrow(/JWT_ACCESS_SECRET/);
  });
  it("production'da standart bot sirini rad etadi", () => {
    expect(() => loadEnv({ ...prod, BOT_INTERNAL_SECRET: "change-me-bot-internal" })).toThrow(/BOT_INTERNAL_SECRET/);
  });
  it("production'da secure bo'lmagan cookie'ni rad etadi", () => {
    expect(() => loadEnv({ ...prod, COOKIE_SECURE: "false" })).toThrow(/COOKIE_SECURE/);
  });
});
