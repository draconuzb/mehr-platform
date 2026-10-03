import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, codeFrom, confirm, login, prisma, refreshCookie, resetUsers, startApp, stopApp } from "./helpers";

beforeAll(startApp);
beforeEach(resetUsers);
afterAll(stopApp);

describe("Telegram orqali kirish", () => {
  it("yangi foydalanuvchi: raqam so'raladi, keyin ro'yxatdan o'tadi va kiradi", async () => {
    const start = await api("/auth/telegram/start", { method: "POST" });
    expect(start.status).toBe(201);
    expect(start.body.deepLink).toMatch(/^https:\/\/t\.me\/mehr_test_bot\?start=login_/);

    const code = codeFrom(start.body.deepLink);
    const pollBody = { loginId: start.body.loginId, pollToken: start.body.pollToken };

    expect((await api("/auth/telegram/poll", { method: "POST", json: pollBody })).body).toEqual({ status: "PENDING" });

    expect((await confirm({ code, telegramId: "555001" })).body).toEqual({ result: "NEED_PHONE" });
    expect((await confirm({ code, telegramId: "555001", phone: "998901112233" })).body).toEqual({ result: "OK", isNew: true });

    const poll = await api("/auth/telegram/poll", { method: "POST", json: pollBody });
    expect(poll.status).toBe(200);
    expect(poll.body.status).toBe("OK");
    expect(poll.body.user).toMatchObject({ role: null, status: "PENDING" });
    expect(poll.headers.getSetCookie().join()).toMatch(/mehr_rt=.*HttpOnly/i);

    const me = await api("/me", { headers: { authorization: `Bearer ${poll.body.accessToken}` } });
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ phone: "+998901112233", telegramLinked: true, onboarding: { roleChosen: false } });

    // Bir martalik: qayta poll qilib bo'lmaydi
    expect((await api("/auth/telegram/poll", { method: "POST", json: pollBody })).status).toBe(410);

    const audit = await prisma.auditLog.findMany({ orderBy: { id: "asc" } });
    expect(audit.map((a) => a.action)).toEqual(["auth.telegram.register", "auth.login"]);
  });

  it("qaytgan foydalanuvchidan raqam qayta so'ralmaydi", async () => {
    await login("555002", "+998901112244");
    const second = await login("555002");
    expect(second.confirm.body).toEqual({ result: "OK", isNew: false });
    expect(second.poll.body.status).toBe("OK");
    expect(await prisma.user.count()).toBe(1);
  });

  it("boshqa Telegram akkauntiga bog'langan raqamni egallab bo'lmaydi", async () => {
    await login("555003", "+998901112255");
    const attacker = await login("999999", "+998901112255");
    expect(attacker.confirm.body).toEqual({ result: "PHONE_TAKEN" });
    expect(attacker.poll.body).toEqual({ status: "PENDING" });
  });

  it("ishlatilgan kod bilan qayta tasdiqlab bo'lmaydi", async () => {
    const first = await login("555004", "+998901112266");
    expect((await confirm({ code: first.code, telegramId: "555004" })).body).toEqual({ result: "EXPIRED" });
  });

  it("muddati o'tgan so'rov tasdiqlanmaydi", async () => {
    const start = await api("/auth/telegram/start", { method: "POST" });
    await prisma.loginRequest.update({ where: { id: start.body.loginId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await confirm({ code: codeFrom(start.body.deepLink), telegramId: "555005", phone: "+998901112277" })).body).toEqual({
      result: "EXPIRED",
    });
    const poll = await api("/auth/telegram/poll", {
      method: "POST",
      json: { loginId: start.body.loginId, pollToken: start.body.pollToken },
    });
    expect(poll.body).toEqual({ status: "EXPIRED" });
  });

  it("noto'g'ri pollToken bilan sessiya olinmaydi", async () => {
    const start = await api("/auth/telegram/start", { method: "POST" });
    await confirm({ code: codeFrom(start.body.deepLink), telegramId: "555006", phone: "+998901112288" });
    const poll = await api("/auth/telegram/poll", {
      method: "POST",
      json: { loginId: start.body.loginId, pollToken: "x".repeat(43) },
    });
    expect(poll.status).toBe(404);
  });

  it("bloklangan foydalanuvchi kira olmaydi", async () => {
    await login("555007", "+998901112299");
    await prisma.user.update({ where: { telegramId: 555007n }, data: { status: "BANNED" } });
    expect((await login("555007")).confirm.body).toEqual({ result: "BLOCKED" });
  });
});

describe("Ichki endpoint himoyasi", () => {
  it("sirsiz yoki noto'g'ri sir bilan rad etiladi", async () => {
    const start = await api("/auth/telegram/start", { method: "POST" });
    const body = { code: codeFrom(start.body.deepLink), telegramId: "1", phone: "+998900000000" };
    expect((await api("/internal/telegram/login-confirm", { method: "POST", json: body })).status).toBe(401);
    expect((await confirm(body, "wrong-secret-wrong-secret")).status).toBe(401);
  });

  it("noto'g'ri formatdagi kod rad etiladi", async () => {
    expect((await confirm({ code: "../../etc", telegramId: "1" })).status).toBe(400);
  });
});

describe("Sessiyalar", () => {
  it("refresh tokenni almashtiradi, eski token qayta kelsa — barcha sessiyalar bekor qilinadi", async () => {
    const { poll } = await login("555010", "+998901113300");
    const cookie1 = refreshCookie(poll.headers);

    const r1 = await api("/auth/refresh", { method: "POST", headers: { cookie: cookie1 } });
    expect(r1.status).toBe(200);
    const cookie2 = refreshCookie(r1.headers);
    expect(cookie2).not.toBe(cookie1);

    // Hujumchi eski tokenni grace oynasidan keyin ishlatadi
    await prisma.session.updateMany({ data: { lastUsedAt: new Date(Date.now() - 60_000) } });
    expect((await api("/auth/refresh", { method: "POST", headers: { cookie: cookie1 } })).status).toBe(401);

    // Endi haqiqiy egasining tokeni ham, access token ham yaroqsiz
    expect((await api("/auth/refresh", { method: "POST", headers: { cookie: cookie2 } })).status).toBe(401);
    expect((await api("/me", { headers: { authorization: `Bearer ${r1.body.accessToken}` } })).status).toBe(401);

    const sessions = await prisma.session.findMany();
    expect(sessions.every((s) => s.revokeReason === "REFRESH_TOKEN_REUSE")).toBe(true);
    expect((await prisma.auditLog.findMany()).map((a) => a.action)).toContain("auth.refresh.reuse_detected");
  });

  it("parallel refresh (ikki tab) grace oynasida sessiyalarni bekor qilmaydi", async () => {
    const { poll } = await login("555012", "+998901113322");
    const cookie1 = refreshCookie(poll.headers);
    const r1 = await api("/auth/refresh", { method: "POST", headers: { cookie: cookie1 } });
    const cookie2 = refreshCookie(r1.headers);

    // Ikkinchi tab hali eski cookie bilan so'rov yuboradi — rad etiladi, lekin hech narsa bekor qilinmaydi
    expect((await api("/auth/refresh", { method: "POST", headers: { cookie: cookie1 } })).status).toBe(401);
    expect((await api("/auth/refresh", { method: "POST", headers: { cookie: cookie2 } })).status).toBe(200);
    expect(await prisma.session.count({ where: { revokedAt: { not: null } } })).toBe(0);
  });

  it("logout'dan keyin access va refresh token ishlamaydi", async () => {
    const { poll } = await login("555011", "+998901113311");
    const auth = { authorization: `Bearer ${poll.body.accessToken}` };
    expect((await api("/auth/logout", { method: "POST", headers: auth })).status).toBe(204);
    expect((await api("/me", { headers: auth })).status).toBe(401);
    expect((await api("/auth/refresh", { method: "POST", headers: { cookie: refreshCookie(poll.headers) } })).status).toBe(401);
  });

  it("soxta yoki tokensiz so'rov rad etiladi", async () => {
    expect((await api("/me")).status).toBe(401);
    expect((await api("/me", { headers: { authorization: "Bearer abc.def.ghi" } })).status).toBe(401);
    expect((await api("/auth/refresh", { method: "POST" })).status).toBe(401);
  });
});

describe("Rol tanlash", () => {
  it("rol bir marta tanlanadi va yangi token rolni o'z ichiga oladi", async () => {
    const { poll } = await login("555020", "+998901114400");
    const auth = { authorization: `Bearer ${poll.body.accessToken}` };

    const r = await api("/me/role", { method: "POST", headers: auth, json: { role: "YOUTH" } });
    expect(r.status).toBe(200);
    expect(r.body.user.role).toBe("YOUTH");
    expect(r.body.me.onboarding.roleChosen).toBe(true);

    const payload = JSON.parse(Buffer.from(r.body.accessToken.split(".")[1], "base64url").toString());
    expect(payload.role).toBe("YOUTH");

    const again = await api("/me/role", { method: "POST", headers: auth, json: { role: "FAMILY_ADULT" } });
    expect(again.status).toBe(409);
    expect((await prisma.user.findFirstOrThrow()).role).toBe("YOUTH");
    expect((await prisma.auditLog.findMany()).map((a) => a.action)).toContain("user.role.set");
  });

  it("xodim rolini o'zi tanlay olmaydi", async () => {
    const { poll } = await login("555021", "+998901114411");
    const auth = { authorization: `Bearer ${poll.body.accessToken}` };
    for (const role of ["ADMIN", "COORDINATOR", "MODERATOR", "GUARDIAN"]) {
      expect((await api("/me/role", { method: "POST", headers: auth, json: { role } })).status).toBe(400);
    }
    expect((await prisma.user.findFirstOrThrow()).role).toBeNull();
  });

  it("parallel so'rovlardan faqat bittasi rolni o'rnatadi", async () => {
    const { poll } = await login("555022", "+998901114422");
    const auth = { authorization: `Bearer ${poll.body.accessToken}` };
    const results = await Promise.all(
      (["YOUTH", "FAMILY_ADULT", "YOUTH", "FAMILY_ADULT"] as const).map((role) =>
        api("/me/role", { method: "POST", headers: auth, json: { role } }),
      ),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
  });

  it("tokensiz rad etiladi", async () => {
    expect((await api("/me/role", { method: "POST", json: { role: "YOUTH" } })).status).toBe(401);
  });
});

// Oxirida turadi: limitdan oshgach throttler IP ni ttl davomida bloklaydi
describe("Rate limit", () => {
  it("start endpointi limitdan oshganda 429 qaytaradi", async () => {
    process.env.AUTH_START_LIMIT_PER_MIN = "3";
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) statuses.push((await api("/auth/telegram/start", { method: "POST" })).status);
      expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    } finally {
      process.env.AUTH_START_LIMIT_PER_MIN = "1000";
    }
  });
});
