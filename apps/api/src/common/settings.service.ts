import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Setting jadvalidagi qiymatlar (admin panelda o'zgartiriladi) — standart qiymat bilan */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? (row.value as T) : fallback;
  }
}
