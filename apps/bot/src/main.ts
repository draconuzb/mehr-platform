import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { createApi } from "./api";
import { TEXT, confirmText } from "./texts";

loadDotenv({ path: resolve(__dirname, "../../../.env") });

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.BOT_INTERNAL_SECRET;
if (!token || !secret) {
  console.log("TELEGRAM_BOT_TOKEN yoki BOT_INTERNAL_SECRET yo'q — bot ishga tushmadi. .env ni to'ldiring.");
  process.exit(0);
}

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const api = createApi(process.env.API_INTERNAL_URL ?? "http://localhost:4000", secret);
const bot = new Bot(token);

// Raqam kutilayotgan kirish so'rovlari: telegramId → kod. Bot qayta ishga tushsa,
// foydalanuvchi saytdagi tugmani qayta bosadi (so'rov baribir 10 daqiqada eskiradi).
const PENDING_TTL_MS = 10 * 60 * 1000;
const pending = new Map<number, { code: string; at: number }>();

const openAppKeyboard = () => new InlineKeyboard().url(TEXT.openApp, WEB_ORIGIN);
const phoneKeyboard = () => new Keyboard().requestContact(TEXT.sharePhoneButton).resized().oneTime();

// Faqat shaxsiy chatlar: guruhda kontakt yoki kirish kodini qayta ishlamaymiz
bot.use(async (ctx, next) => {
  if (ctx.chat?.type !== "private") return;
  await next();
});

bot.command("start", async (ctx) => {
  const payload = ctx.match?.trim() ?? "";
  if (!payload.startsWith("login_")) {
    await ctx.reply(TEXT.welcome, { reply_markup: openAppKeyboard() });
    return;
  }

  const code = payload.slice("login_".length);
  const result = await api.confirmLogin({ code, telegramId: String(ctx.from!.id) });
  if (result.result === "NEED_PHONE") {
    pending.set(ctx.from!.id, { code, at: Date.now() });
    await ctx.reply(confirmText(result), { reply_markup: phoneKeyboard() });
    return;
  }
  await ctx.reply(confirmText(result), result.result === "OK" ? { reply_markup: openAppKeyboard() } : {});
});

bot.on("message:contact", async (ctx) => {
  const contact = ctx.message.contact;
  // Telegram faqat o'z raqamini "requestContact" tugmasi orqali yuborganda user_id === from.id bo'ladi
  if (contact.user_id !== ctx.from.id) {
    await ctx.reply(TEXT.notOwnContact, { reply_markup: phoneKeyboard() });
    return;
  }

  const entry = pending.get(ctx.from.id);
  pending.delete(ctx.from.id);
  if (!entry || Date.now() - entry.at > PENDING_TTL_MS) {
    await ctx.reply(TEXT.noPending, { reply_markup: { remove_keyboard: true } });
    return;
  }

  const result = await api.confirmLogin({ code: entry.code, telegramId: String(ctx.from.id), phone: contact.phone_number });
  await ctx.reply(confirmText(result), { reply_markup: { remove_keyboard: true } });
  if (result.result === "OK") await ctx.reply("👇", { reply_markup: openAppKeyboard() });
});

bot.command("sos", async (ctx) => {
  // TODO(MVP S8): POST /sos — eng yuqori ustuvorlik
  await ctx.reply(TEXT.sos);
});

bot.catch(async (err) => {
  console.error("Bot xatosi:", err.error);
  await err.ctx.reply(TEXT.error).catch(() => undefined);
});

// Eskirgan kutish yozuvlarini tozalash
setInterval(() => {
  const now = Date.now();
  for (const [id, v] of pending) if (now - v.at > PENDING_TTL_MS) pending.delete(id);
}, 60_000).unref();

// Dev: long polling. Production: webhook (secret token bilan)
void bot.start({ onStart: (me) => console.log(`Bot ishga tushdi: @${me.username}`) });
