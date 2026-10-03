import { describe, expect, it } from "vitest";
import { ageOn, isMinor } from "./age";

describe("age", () => {
  const on = new Date("2026-10-03T00:00:00Z");
  it("tug'ilgan kundan oldin", () => expect(ageOn(new Date("2008-10-04T00:00:00Z"), on)).toBe(17));
  it("tug'ilgan kuni", () => expect(ageOn(new Date("2008-10-03T00:00:00Z"), on)).toBe(18));
  it("isMinor", () => {
    expect(isMinor(new Date("2010-01-01T00:00:00Z"), on)).toBe(true);
    expect(isMinor(new Date("2006-01-01T00:00:00Z"), on)).toBe(false);
  });
});
