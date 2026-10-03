import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { Bot, InlineKeyboard } from "grammy";

loadDotenv({ path: resolve(__dirname, "../../../.env") });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.log("TELEGRAM_BOT_TOKEN yo'q — bot ishga tushmadi. @BotFather'dan token olib .env ga yozing.");
  process.exit(0);
}

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const bot = new Bot(token);

// /start <kod> — akkauntni ulash (kod API dagi POST /me/telegram/link orqali beriladi)
bot.command("start", async (ctx) => {
  const code = ctx.match?.trim();
  if (code) {
    // TODO(MVP S7): kodni API orqali tekshirish va telegramId ni bog'lash
    await ctx.reply("Akkauntni ulash tez orada ishlaydi.");
    return;
  }
  await ctx.reply("Assalomu alaykum! Bu Mehr boti: bildirishnomalar, oylik check-in va SOS shu yerda.", {
    reply_markup: new InlineKeyboard().url("Ilovani ochish", WEB_ORIGIN),
  });
});

bot.command("sos", async (ctx) => {
  // TODO(MVP S8): POST /sos — eng yuqori ustuvorlik
  await ctx.reply("Agar xavf ostida bo'lsangiz, darhol 112 ga qo'ng'iroq qiling. Ishonch telefoni: 1146.");
});

bot.catch((err) => console.error("Bot xatosi:", err.error));

// Dev: long polling. Production: webhook (POST /internal/telegram/webhook, secret token bilan)
void bot.start({ onStart: (me) => console.log(`Bot ishga tushdi: @${me.username}`) });
