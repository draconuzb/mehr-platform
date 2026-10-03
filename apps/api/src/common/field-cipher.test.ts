import { describe, expect, it } from "vitest";
import type { Env } from "../config/env";
import { FieldCipher } from "./field-cipher";

const cipher = new FieldCipher({ FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString("base64") } as Env);

describe("FieldCipher", () => {
  it("shifrlaydi va ochadi", () => {
    const blob = cipher.encrypt("Yunusobod 4-mavze, 12-uy, 34-xonadon");
    expect(blob.toString("utf8")).not.toContain("Yunusobod");
    expect(cipher.decrypt(blob)).toBe("Yunusobod 4-mavze, 12-uy, 34-xonadon");
  });
  it("har safar boshqa natija beradi (tasodifiy IV)", () => {
    expect(cipher.encrypt("a").equals(cipher.encrypt("a"))).toBe(false);
  });
  it("o'zgartirilgan ma'lumotni rad etadi", () => {
    const blob = cipher.encrypt("manzil");
    blob.writeUInt8(blob.readUInt8(blob.length - 1) ^ 1, blob.length - 1);
    expect(() => cipher.decrypt(blob)).toThrow();
  });
});
