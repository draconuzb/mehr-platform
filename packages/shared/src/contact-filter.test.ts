import { describe, expect, it } from "vitest";
import { detectContacts } from "./contact-filter";

describe("detectContacts", () => {
  it("toza matnni o'tkazadi", () => {
    expect(detectContacts("Shanba kuni soat 15:00 da uchrashamiz")).toEqual([]);
  });
  it.each([
    ["+998 90 123 45 67", "PHONE"],
    ["raqamim 90-123-45-67", "PHONE"],
    ["to'qqiz nol bir ikki uch to'rt", "PHONE"],
    ["telegramda @aziz_k yoz", "USERNAME"],
    ["t.me/aziz", "LINK"],
    ["https://example.com", "LINK"],
    ["aziz@mail.uz", "EMAIL"],
  ])("%s → %s", (text, flag) => {
    expect(detectContacts(text)).toContain(flag);
  });
});
