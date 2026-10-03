import { BadRequestException } from "@nestjs/common";
import type { ZodType, ZodTypeDef } from "zod";

export function parseBody<T>(schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      error: { code: "VALIDATION_FAILED", details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
    });
  }
  return parsed.data;
}
