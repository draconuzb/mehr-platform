import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "http://localhost:3000",
  ADMIN_ORIGIN: "http://localhost:3001",
  JWT_ACCESS_SECRET: "change-me-access",
  JWT_REFRESH_SECRET: "change-me-refresh",
};

describe("loadEnv", () => {
  it("to'g'ri env'ni qabul qiladi", () => {
    expect(loadEnv(base).API_PORT).toBe(4000);
  });
  it("DATABASE_URL bo'lmasa xato beradi", () => {
    const { DATABASE_URL: _, ...rest } = base;
    expect(() => loadEnv(rest)).toThrow(/DATABASE_URL/);
  });
  it("production'da standart JWT sirini rad etadi", () => {
    expect(() => loadEnv({ ...base, NODE_ENV: "production" })).toThrow(/JWT_ACCESS_SECRET/);
  });
});
