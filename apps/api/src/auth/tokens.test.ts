import { describe, expect, it } from "vitest";
import { normalizePhone, randomToken, safeEqualString, sha256 } from "./tokens";

describe("tokens", () => {
  it("randomToken deep-link uchun yaroqli", () => {
    const t = randomToken(24);
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(`login_${t}`.length).toBeLessThanOrEqual(64); // Telegram start parametri limiti
  });
  it("sha256 deterministik", () => {
    expect(sha256("a")).toBe(sha256("a"));
    expect(sha256("a")).not.toBe(sha256("b"));
  });
  it("safeEqualString", () => {
    expect(safeEqualString("abc", "abc")).toBe(true);
    expect(safeEqualString("abc", "abd")).toBe(false);
  });
  it.each([
    ["998901234567", "+998901234567"],
    ["+998 90 123-45-67", "+998901234567"],
    ["12345", null],
  ])("normalizePhone(%s) → %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });
});
