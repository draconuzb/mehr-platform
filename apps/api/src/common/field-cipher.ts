import { Inject, Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ENV, type Env } from "../config/env";

const VERSION = 1;

/**
 * 🔒 maydonlar uchun AES-256-GCM. Format: [versiya 1B][iv 12B][tag 16B][shifrlangan matn].
 * Versiya kalitni almashtirish (rotation) uchun.
 */
@Injectable()
export class FieldCipher {
  private readonly key: Buffer;

  constructor(@Inject(ENV) env: Env) {
    this.key = Buffer.from(env.FIELD_ENCRYPTION_KEY, "base64");
  }

  encrypt(plain: string): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), data]);
  }

  decrypt(blob: Uint8Array): string {
    const buf = Buffer.from(blob);
    if (buf[0] !== VERSION) throw new Error("Noma'lum shifr versiyasi");
    const decipher = createDecipheriv("aes-256-gcm", this.key, buf.subarray(1, 13));
    decipher.setAuthTag(buf.subarray(13, 29));
    return Buffer.concat([decipher.update(buf.subarray(29)), decipher.final()]).toString("utf8");
  }
}
