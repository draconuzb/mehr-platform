-- Mehr — Prisma ifodalay olmaydigan biznes-qoidalar (TZ.md, 5E bo'limi oxiri).
-- Birinchi `prisma migrate dev` dan keyin alohida migratsiya sifatida qo'shiladi:
--   pnpm --filter @mehr/db exec prisma migrate dev --create-only --name business_constraints
--   va shu fayl mazmunini yaratilgan migration.sql ga ko'chiring.

-- 1) Yosh bir vaqtda faqat 1 ta faol munosabatda bo'ladi (qaror #14)
CREATE UNIQUE INDEX IF NOT EXISTS match_one_active_per_youth
  ON "Match" ("youthUserId")
  WHERE state = 'ACTIVE';

-- 2) Oila limitlari: yashash ≤ 2, boshqa turlar ≤ 5 (qaror #15)
CREATE OR REPLACE FUNCTION check_family_active_limits() RETURNS trigger AS $$
DECLARE
  living_cnt int;
  other_cnt  int;
BEGIN
  IF NEW.state <> 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  -- Bitta oila uchun parallel tranzaksiyalarni ketma-ket qilish
  PERFORM pg_advisory_xact_lock(hashtext(NEW."familyId"::text));

  SELECT
    count(*) FILTER (WHERE 'LIVING' = ANY ("offerTypes")),
    count(*) FILTER (WHERE NOT ('LIVING' = ANY ("offerTypes")))
  INTO living_cnt, other_cnt
  FROM "Match"
  WHERE "familyId" = NEW."familyId" AND state = 'ACTIVE' AND id <> NEW.id;

  IF 'LIVING' = ANY (NEW."offerTypes") AND living_cnt >= 2 THEN
    RAISE EXCEPTION 'FAMILY_LIVING_LIMIT' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT ('LIVING' = ANY (NEW."offerTypes")) AND other_cnt >= 5 THEN
    RAISE EXCEPTION 'FAMILY_OTHER_LIMIT' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_family_limits ON "Match";
CREATE TRIGGER match_family_limits
  BEFORE INSERT OR UPDATE OF state, "offerTypes" ON "Match"
  FOR EACH ROW EXECUTE FUNCTION check_family_active_limits();

-- 3) Media yoki yoshga, yoki oilaga tegishli bo'ladi (ikkalasiga emas)
ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS media_single_owner;
ALTER TABLE "Media" ADD CONSTRAINT media_single_owner
  CHECK (("youthUserId" IS NULL) <> ("familyId" IS NULL));

-- 4) Ko'rishlar va audit logi — faqat qo'shiladi (append-only)
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'APPEND_ONLY_TABLE: %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only ON "AuditLog";
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

DROP TRIGGER IF EXISTS profile_view_append_only ON "ProfileView";
CREATE TRIGGER profile_view_append_only
  BEFORE UPDATE OR DELETE ON "ProfileView"
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- 5) 14–17 qoidalari (jins, alohida xona) — v2 da ilova qatlamida va
--    kelishuv tasdiqlanishida tekshiriladi; bu yerda faqat sana sanity-check:
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS user_birthdate_sane;
ALTER TABLE "User" ADD CONSTRAINT user_birthdate_sane
  CHECK ("birthDate" IS NULL OR "birthDate" > DATE '1900-01-01');
