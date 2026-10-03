import { Injectable } from "@nestjs/common";
import { MEDIA_RULES } from "@mehr/shared";
import { PrismaService } from "../prisma/prisma.service";

export type ChecklistItem = { key: string; done: boolean; required: boolean; count?: number; min?: number };

/** Ro'yxatdan o'tish checklisti (TZ 5F, B8): nima tayyor, nima yetishmaydi */
@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string): Promise<{ items: ChecklistItem[]; readyToSubmit: boolean; submitted: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { youthProfile: true, familyMember: { include: { family: true } } },
    });
    const items: ChecklistItem[] = [{ key: "role", done: user.role !== null, required: true }];
    if (!user.role) return { items, readyToSubmit: false, submitted: false };

    const isYouth = user.role === "YOUTH";
    const familyId = user.familyMember?.familyId ?? null;
    const profileDone = isYouth ? !!user.youthProfile : !!familyId;
    items.push({ key: "profile", done: profileDone, required: true });

    const mediaOwner = isYouth ? { youthUserId: userId } : { familyId: familyId ?? "00000000-0000-0000-0000-000000000000" };
    const notRejected = { moderationStatus: { not: "REJECTED" as const } };
    const photos = await this.prisma.media.count({ where: { ...mediaOwner, kind: "PHOTO", ...notRejected } });
    const videos = await this.prisma.media.count({ where: { ...mediaOwner, kind: "VIDEO", ...notRejected } });
    items.push({ key: "photos", done: photos >= MEDIA_RULES.photos.min, required: true, count: photos, min: MEDIA_RULES.photos.min });
    items.push({ key: "video", done: videos >= 1, required: false, count: videos, min: 1 });

    const docTypes = isYouth ? (["PASSPORT", "STUDY_CERTIFICATE"] as const) : (["PASSPORT", "CRIMINAL_RECORD"] as const);
    for (const type of docTypes) {
      const n = await this.prisma.document.count({ where: { ownerUserId: userId, type, status: { in: ["UPLOADED", "ACCEPTED"] } } });
      items.push({ key: `doc_${type.toLowerCase()}`, done: n > 0, required: true });
    }

    const verification = await this.prisma.verification.findFirst({
      where: isYouth ? { subjectUserId: userId, type: "YOUTH" } : { familyId: familyId ?? undefined, type: "FAMILY" },
      orderBy: { createdAt: "desc" },
    });
    const submitted = !!verification && verification.status !== "REJECTED" && verification.status !== "NEEDS_INFO";
    const readyToSubmit = items.filter((i) => i.required).every((i) => i.done);
    return { items, readyToSubmit, submitted };
  }
}
