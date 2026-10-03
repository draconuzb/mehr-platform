# Mehr — "Ikkinchi oila" platformasi

Boshqa viloyatdan o'qishga kelgan yoshlar va ularga yordam bermoqchi bo'lgan oilalarni NNT nazorati ostida xavfsiz bog'laydigan platforma.

## Fayllar
| Fayl | Nima |
|---|---|
| [TZ.md](TZ.md) | To'liq texnik topshiriq: qarorlar, rollar, oqim, profillar, moslik algoritmi, ma'lumotlar modeli, ekranlar, API, safeguarding, roadmap |
| [WIREFRAMES.md](WIREFRAMES.md) | 16 ta asosiy ekranning ASCII wireframe'lari |
| [prototype.html](prototype.html) | Bosiladigan prototipning manbasi |
| [docs/index.html](docs/index.html) | GitHub Pages uchun prototip |

## Prototip
👉 **https://draconuzb.github.io/mehr-platform/**

## Tuzilma

```
apps/
  api/     NestJS API (REST + keyinchalik WebSocket)       :4000
  web/     Next.js PWA — yoshlar, oilalar, ota-onalar      :3000
  admin/   Next.js — xodimlar paneli (alohida domen)       :3001
  bot/     Telegram bot (grammY)
packages/
  db/      Prisma sxemasi, biznes-qoidalar SQL, seed
  shared/  Konstantalar, lotin↔kirill, kontakt filtri
docs/      GitHub Pages: prototip
```

## Ishga tushirish

Talablar: Node 22 (`nvm use`), pnpm 9 (`corepack enable`), Docker.

```bash
pnpm install
cp .env.example .env            # birinchi marta
pnpm infra:up                   # Postgres + Redis + SeaweedFS (S3)
pnpm db:migrate                 # migratsiyalar (biznes-qoidalar ham shu yerda)
pnpm --filter @mehr/db seed     # hududlar, teglar, sozlamalar
pnpm dev                        # hamma ilovalar
```

- API health: http://localhost:4000/v1/health
- Web: http://localhost:3000 (`?lang=uz-Cyrl`, `ru`, `kaa`)
- Admin: http://localhost:3001
- S3 (SeaweedFS): http://localhost:8333, master UI: http://localhost:9333

Biznes-qoidalar (1 yosh = 1 faol oila, oila limitlari, append-only audit) bazaning o'zida: `packages/db/prisma/migrations/*_business_constraints`. Manba — `packages/db/prisma/sql/constraints.sql`.

## Telegram bot (kirish uchun)

1. [@BotFather](https://t.me/BotFather) → `/newbot` → tokenni oling
2. `.env` ga yozing: `TELEGRAM_BOT_TOKEN=...` va `TELEGRAM_BOT_USERNAME=bot_nomi` (`@` siz)
3. `pnpm dev` — API, web va bot birga ishga tushadi
4. http://localhost:3000/login → «Telegram orqali kirish»

Kirish oqimi: sayt deep-link oladi → botda Start → (birinchi marta) «Raqamimni yuborish» → sayt avtomatik kiradi.

## Tekshiruvlar

```bash
pnpm turbo run build typecheck test
```

## Holat
TZ v1.3 · Bosqich 0 ✅ · MVP S1: Telegram orqali kirish ✅ (e2e testlar bilan). Keyingi: rol tanlash, PWA'da sessiyani saqlash.
