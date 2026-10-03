import { Inject, Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { ENV, type Env } from "../config/env";

export interface AccessClaims {
  sub: string;
  sid: string;
  role: string | null;
}

const ISSUER = "mehr-api";
const AUDIENCE = "mehr";

@Injectable()
export class AccessTokenService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  sign(claims: AccessClaims): string {
    return jwt.sign({ sid: claims.sid, role: claims.role }, this.env.JWT_ACCESS_SECRET, {
      algorithm: "HS256",
      subject: claims.sub,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: this.env.JWT_ACCESS_TTL_SEC,
    });
  }

  /** Noto'g'ri yoki muddati o'tgan token uchun null qaytaradi */
  verify(token: string): AccessClaims | null {
    try {
      const p = jwt.verify(token, this.env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      if (typeof p === "string" || !p.sub || typeof p.sid !== "string") return null;
      return { sub: p.sub, sid: p.sid, role: (p.role as string | null) ?? null };
    } catch {
      return null;
    }
  }
}
