import { Controller, Get, Header, ParseIntPipe, Query } from "@nestjs/common";
import type { TagType } from "@mehr/db";
import { PrismaService } from "../prisma/prisma.service";

const TAG_TYPES = new Set<TagType>(["INTEREST", "SKILL", "MENTOR_AREA"]);

/** Ochiq ma'lumotnomalar: hududlar, shaharlar, tumanlar, teglar */
@Controller("ref")
export class ReferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("regions")
  @Header("Cache-Control", "public, max-age=3600")
  regions() {
    return this.prisma.region.findMany({ select: { id: true, code: true, names: true }, orderBy: { id: "asc" } });
  }

  @Get("cities")
  @Header("Cache-Control", "public, max-age=3600")
  cities(@Query("regionId", new ParseIntPipe({ optional: true })) regionId?: number) {
    return this.prisma.city.findMany({
      where: regionId ? { regionId } : {},
      select: { id: true, regionId: true, names: true },
      orderBy: { id: "asc" },
    });
  }

  @Get("districts")
  @Header("Cache-Control", "public, max-age=3600")
  districts(@Query("cityId", ParseIntPipe) cityId: number) {
    return this.prisma.district.findMany({ where: { cityId }, select: { id: true, names: true }, orderBy: { id: "asc" } });
  }

  @Get("tags")
  @Header("Cache-Control", "public, max-age=600")
  tags(@Query("type") type?: string) {
    const where = type && TAG_TYPES.has(type as TagType) ? { type: type as TagType, approved: true } : { approved: true };
    return this.prisma.tag.findMany({ where, select: { id: true, type: true, slug: true, labels: true }, orderBy: { id: "asc" } });
  }
}
