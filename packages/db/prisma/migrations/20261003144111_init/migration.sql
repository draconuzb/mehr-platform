-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('YOUTH', 'FAMILY_ADULT', 'GUARDIAN', 'COORDINATOR', 'MODERATOR', 'PSYCHOLOGIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'FROZEN', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('UZ_LATN', 'UZ_CYRL', 'RU', 'KAA');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('LYCEUM', 'COLLEGE', 'TECHNIKUM', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('LIVING', 'MENTORING', 'SUPPORT');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('TUITION', 'RENT', 'FOOD', 'CLOTHING', 'COURSES', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('FATHER', 'MOTHER', 'CHILD', 'GRANDMOTHER', 'GRANDFATHER', 'OTHER_RELATIVE');

-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('HOUSE', 'APARTMENT');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('DRAFT', 'IN_REVIEW', 'VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'APPROVED', 'REVOKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('INTEREST', 'SKILL', 'MENTOR_AREA');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'CRIMINAL_RECORD', 'STUDY_CERTIFICATE', 'GUARDIAN_CONSENT', 'AGREEMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('YOUTH', 'FAMILY', 'FAMILY_MEMBER', 'GUARDIAN', 'HOUSING');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO', 'VOICE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('YOUTH', 'FAMILY');

-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MatchState" AS ENUM ('MATCHED', 'CHATTING', 'MEETING_SCHEDULED', 'MET', 'TRIAL', 'TRIAL_CONFIRMED', 'AGREEMENT_PENDING', 'ACTIVE', 'ENDED', 'FROZEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('TEXT', 'PHOTO', 'VOICE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DELIVERED', 'HELD', 'REJECTED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('FOUNDATION_OFFICE', 'PARTNER');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'SIGNING', 'SIGNED', 'APPROVED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('INAPPROPRIATE_CONTENT', 'HARASSMENT', 'OFF_PLATFORM_CONTACT', 'MONEY_REQUEST', 'SAFETY_CONCERN', 'FAKE_PROFILE', 'OTHER');

-- CreateEnum
CREATE TYPE "SosType" AS ENUM ('DANGER', 'WANT_TO_LEAVE', 'WANT_TO_TALK');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RiskSignalType" AS ENUM ('NIGHT_ACTIVITY', 'OFF_PLATFORM_CONTACT', 'MASS_INTEREST', 'NARROW_TARGETING', 'GIFT_OR_MONEY', 'LIMIT_ABUSE', 'CHECKIN_NEGATIVE', 'CHECKIN_MISSED');

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "names" JSONB NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "names" JSONB NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "names" JSONB NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "telegramId" BIGINT,
    "oneidId" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "locale" "Locale" NOT NULL DEFAULT 'UZ_LATN',
    "birthDate" DATE,
    "gender" "Gender",
    "regionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "device" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRegion" (
    "userId" UUID NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "StaffRegion_pkey" PRIMARY KEY ("userId","regionId")
);

-- CreateTable
CREATE TABLE "YouthProfile" (
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "homeRegionId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "schoolType" "SchoolType" NOT NULL,
    "schoolName" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "course" INTEGER,
    "bioGoals" TEXT NOT NULL,
    "temperament" JSONB NOT NULL,
    "routine" JSONB NOT NULL,
    "smokes" BOOLEAN NOT NULL DEFAULT false,
    "prefs" JSONB NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YouthProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GuardianLink" (
    "id" UUID NOT NULL,
    "youthUserId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "relation" TEXT NOT NULL,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "consentDocId" UUID,
    "consentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" UUID NOT NULL,
    "cityId" INTEGER NOT NULL,
    "districtId" INTEGER,
    "offerTypes" "RelationType"[],
    "supportTypes" "SupportType"[],
    "houseRules" JSONB NOT NULL,
    "prefs" JSONB NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'DRAFT',
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "userId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "roleInFamily" "FamilyRole" NOT NULL,
    "occupation" TEXT,
    "livesInHouse" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Housing" (
    "familyId" UUID NOT NULL,
    "type" "HousingType" NOT NULL,
    "cityId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "exactAddressEnc" BYTEA NOT NULL,
    "hasPrivateRoom" BOOLEAN NOT NULL,
    "pets" BOOLEAN NOT NULL DEFAULT false,
    "smokingInside" BOOLEAN NOT NULL DEFAULT false,
    "inspectedAt" TIMESTAMP(3),
    "inspectedById" UUID,

    CONSTRAINT "Housing_pkey" PRIMARY KEY ("familyId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "type" "TagType" NOT NULL,
    "slug" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouthTag" (
    "youthUserId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "YouthTag_pkey" PRIMARY KEY ("youthUserId","tagId")
);

-- CreateTable
CREATE TABLE "FamilyTag" (
    "familyId" UUID NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "FamilyTag_pkey" PRIMARY KEY ("familyId","tagId")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" UUID NOT NULL,
    "type" "VerificationType" NOT NULL,
    "subjectUserId" UUID,
    "familyId" UUID,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" UUID NOT NULL,
    "passportHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "addedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "youthUserId" UUID,
    "familyId" UUID,
    "kind" "MediaKind" NOT NULL,
    "originalKey" TEXT NOT NULL,
    "processedKey" TEXT,
    "hlsKey" TEXT,
    "durationSec" INTEGER,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchScore" (
    "youthUserId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchScore_pkey" PRIMARY KEY ("youthUserId","familyId")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" UUID NOT NULL,
    "fromSide" "Side" NOT NULL,
    "youthUserId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "status" "InterestStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL,
    "youthUserId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "interestId" UUID,
    "state" "MatchState" NOT NULL DEFAULT 'MATCHED',
    "offerTypes" "RelationType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchStateHistory" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "fromState" "MatchState",
    "toState" "MatchState" NOT NULL,
    "actorId" UUID,
    "reason" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchStateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "kind" "MessageKind" NOT NULL,
    "body" TEXT,
    "mediaId" UUID,
    "transcript" TEXT,
    "filterFlags" JSONB,
    "status" "MessageStatus" NOT NULL DEFAULT 'DELIVERED',
    "hiddenFor" UUID[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "startedById" UUID NOT NULL,
    "participants" UUID[],
    "supervisorId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "cityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" "VenueType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "coordinatorId" UUID,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisit" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "coordinatorId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "doneAt" TIMESTAMP(3),
    "result" JSONB,

    CONSTRAINT "HomeVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "pdfKey" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementSignature" (
    "agreementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "smsCodeHash" TEXT NOT NULL,
    "ip" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementSignature_pkey" PRIMARY KEY ("agreementId","userId")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "respondentId" UUID NOT NULL,
    "answers" JSONB,
    "riskFlag" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExitSurvey" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "respondentId" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExitSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetUserId" UUID,
    "messageId" UUID,
    "mediaId" UUID,
    "category" "ReportCategory",
    "isSos" BOOLEAN NOT NULL DEFAULT false,
    "sosType" "SosType",
    "location" JSONB,
    "text" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" UUID,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSignal" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "type" "RiskSignalType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "details" JSONB NOT NULL,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" BIGSERIAL NOT NULL,
    "viewerId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "side" "Side" NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "diff" JSONB,
    "ip" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "consents" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "City_regionId_idx" ON "City"("regionId");

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_oneidId_key" ON "User"("oneidId");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "YouthProfile_cityId_visibility_idx" ON "YouthProfile"("cityId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLink_youthUserId_guardianUserId_key" ON "GuardianLink"("youthUserId", "guardianUserId");

-- CreateIndex
CREATE INDEX "Family_cityId_visibility_idx" ON "Family"("cityId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_userId_key" ON "FamilyMember"("userId");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_type_slug_key" ON "Tag"("type", "slug");

-- CreateIndex
CREATE INDEX "Document_ownerUserId_type_idx" ON "Document"("ownerUserId", "type");

-- CreateIndex
CREATE INDEX "Verification_status_createdAt_idx" ON "Verification"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_passportHash_key" ON "Blacklist"("passportHash");

-- CreateIndex
CREATE INDEX "Media_moderationStatus_createdAt_idx" ON "Media"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "MatchScore_youthUserId_score_idx" ON "MatchScore"("youthUserId", "score");

-- CreateIndex
CREATE INDEX "MatchScore_familyId_score_idx" ON "MatchScore"("familyId", "score");

-- CreateIndex
CREATE INDEX "Interest_youthUserId_status_idx" ON "Interest"("youthUserId", "status");

-- CreateIndex
CREATE INDEX "Interest_familyId_status_idx" ON "Interest"("familyId", "status");

-- CreateIndex
CREATE INDEX "Interest_status_expiresAt_idx" ON "Interest"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_interestId_key" ON "Match"("interestId");

-- CreateIndex
CREATE INDEX "Match_youthUserId_state_idx" ON "Match"("youthUserId", "state");

-- CreateIndex
CREATE INDEX "Match_familyId_state_idx" ON "Match"("familyId", "state");

-- CreateIndex
CREATE INDEX "MatchStateHistory_matchId_at_idx" ON "MatchStateHistory"("matchId", "at");

-- CreateIndex
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_status_createdAt_idx" ON "Message"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Call_matchId_idx" ON "Call"("matchId");

-- CreateIndex
CREATE INDEX "Meeting_coordinatorId_scheduledAt_idx" ON "Meeting"("coordinatorId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_matchId_key" ON "Agreement"("matchId");

-- CreateIndex
CREATE INDEX "Checkin_dueAt_answeredAt_idx" ON "Checkin"("dueAt", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExitSurvey_matchId_respondentId_key" ON "ExitSurvey"("matchId", "respondentId");

-- CreateIndex
CREATE INDEX "Report_isSos_status_createdAt_idx" ON "Report"("isSos", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RiskSignal_reviewedAt_createdAt_idx" ON "RiskSignal"("reviewedAt", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_viewedAt_idx" ON "ProfileView"("viewerId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileView_profileId_viewedAt_idx" ON "ProfileView"("profileId", "viewedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_at_idx" ON "AuditLog"("actorId", "at");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRegion" ADD CONSTRAINT "StaffRegion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRegion" ADD CONSTRAINT "StaffRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_homeRegionId_fkey" FOREIGN KEY ("homeRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_consentDocId_fkey" FOREIGN KEY ("consentDocId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthTag" ADD CONSTRAINT "YouthTag_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthTag" ADD CONSTRAINT "YouthTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTag" ADD CONSTRAINT "FamilyTag_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTag" ADD CONSTRAINT "FamilyTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_youthUserId_fkey" FOREIGN KEY ("youthUserId") REFERENCES "YouthProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchStateHistory" ADD CONSTRAINT "MatchStateHistory_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchStateHistory" ADD CONSTRAINT "MatchStateHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSignature" ADD CONSTRAINT "AgreementSignature_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSignature" ADD CONSTRAINT "AgreementSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitSurvey" ADD CONSTRAINT "ExitSurvey_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitSurvey" ADD CONSTRAINT "ExitSurvey_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
