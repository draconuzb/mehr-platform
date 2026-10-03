import type { Request } from "express";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.headers["user-agent"]?.slice(0, 300) };
}
