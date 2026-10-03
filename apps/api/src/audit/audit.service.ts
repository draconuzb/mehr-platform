import { Injectable } from "@nestjs/common";
import type { Prisma } from "@mehr/db";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  reason?: string;
  diff?: Prisma.InputJsonValue;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.auditLog.create({ data: { ...entry, actorId: entry.actorId ?? null } });
  }
}
