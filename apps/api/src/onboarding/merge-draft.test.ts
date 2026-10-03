import { describe, expect, it } from "vitest";
import { mergeDraft } from "./onboarding.controller";

describe("mergeDraft", () => {
  it("ichma-ich obyektlarni birlashtiradi, massivni almashtiradi", () => {
    const r = mergeDraft({ a: 1, prefs: { x: 1, list: [1, 2] } }, { prefs: { y: 2, list: [3] } });
    expect(r).toEqual({ a: 1, prefs: { x: 1, y: 2, list: [3] } });
  });
  it("null maydonni o'chiradi", () => {
    expect(mergeDraft({ a: 1, b: 2 }, { b: null })).toEqual({ a: 1 });
  });
  it("prototype pollution'ni bloklaydi", () => {
    const r = mergeDraft({}, JSON.parse('{"__proto__": {"polluted": true}}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(r)).toEqual([]);
  });
});
