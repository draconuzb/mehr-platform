# Mehr — Wireframe'lar (ASCII, v1)

> TZ.md → 5F bo'limidagi ekranlar asosida. Mobil ekran ~360px, admin paneli — desktop.
> Belgilar: `[Tugma]` · `( )` radio · `[ ]` checkbox · `▾` select · `▓` rasm · `▶` video · `🔒` yopiq

---

## 1. A1 — Landing (mehmon)

```
┌────────────────────────────────┐
│ Mehr                 UZ ▾  [Kirish] │
├────────────────────────────────┤
│                                │
│   Yangi shaharda —             │
│   ikkinchi oilang bor.         │
│                                │
│   Boshqa viloyatdan o'qishga   │
│   kelgan yoshlar va yordam     │
│   bermoqchi oilalarni          │
│   xavfsiz bog'laymiz.          │
│                                │
│  [  Men yoshman  ] [ Biz oila ]│
│                                │
├────────────────────────────────┤
│  Qanday ishlaydi               │
│  ① Profil + tekshiruv          │
│  ② Mos oilani/yoshni topish    │
│  ③ Fond ishtirokida tanishuv   │
├────────────────────────────────┤
│  🛡 Xavfsizlik                  │
│  ✓ Har bir oila tekshiriladi   │
│  ✓ Sudlanmaganlik ma'lumotnomasi│
│  ✓ Birinchi uchrashuv — fondda │
│  ✓ SOS 24/7                    │
│  [Batafsil →]                  │
├────────────────────────────────┤
│   312 juftlik · 14 viloyat     │
│   (anonim statistika)          │
├────────────────────────────────┤
│  Hikoyalar · FAQ · Xayriya     │
│  📲 Telefonga o'rnatish         │
└────────────────────────────────┘
```

## 2. A6 — iOS'ga o'rnatish ko'rsatmasi

```
┌────────────────────────────────┐
│  Mehr'ni iPhone'ga o'rnating   │
├────────────────────────────────┤
│  1. Pastdagi  [⬆︎]  tugmasini  │
│     bosing (Safari'da)         │
│     ┌──────────────────────┐   │
│     │  ▓▓ screenshot 1 ▓▓  │   │
│     └──────────────────────┘   │
│  2. "Bosh ekranga qo'shish"    │
│     ┌──────────────────────┐   │
│     │  ▓▓ screenshot 2 ▓▓  │   │
│     └──────────────────────┘   │
│  3. "Qo'shish" → tayyor ✓      │
│                                │
│  ℹ️ Bildirishnomalar faqat      │
│  o'rnatilgandan keyin ishlaydi.│
│  Telegram botni ham ulang:     │
│  [ Telegram bot ]              │
│                                │
│        [ Keyinroq ]            │
└────────────────────────────────┘
```
> Android'da bu ekran o'rniga bitta `[ O'rnatish ]` tugmasi chiqadi.

## 3. B1 — Kirish

```
┌────────────────────────────────┐
│ ←                              │
│                                │
│   Kirish yoki ro'yxatdan o'tish│
│                                │
│   Telefon raqam                │
│   ┌──────────────────────────┐ │
│   │ +998 │ __ ___ __ __      │ │
│   └──────────────────────────┘ │
│   [     SMS kod olish      ]   │
│                                │
│   ───────── yoki ─────────     │
│                                │
│   [  ✈ Telegram orqali     ]   │
│                                │
│   Davom etish orqali Oferta va │
│   Maxfiylik siyosatiga rozilik │
│   bildirasiz.                  │
└────────────────────────────────┘

    ↓ (kod yuborilgach)

│   SMS kod: ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐ │
│            └─┘└─┘└─┘└─┘└─┘└─┘ │
│   Qayta yuborish: 0:58         │
```

## 4. B2 + B3 — Rol va tez profil (yosh)

```
┌────────────────────────────────┐
│ ←   Profil         ▓▓▓░░░░ 2/6 │
├────────────────────────────────┤
│  Siz kimsiz?                   │
│  ( ) Yoshman — oila qidiraman  │
│  ( ) Oilamiz — yoshga yordam   │
│      bermoqchimiz              │
├────────────────────────────────┤
│  Ism        [______________]   │
│  Familiya   [______________]   │
│  Tug'ilgan sana [__.__.____]   │
│  Jins       ( ) Yigit ( ) Qiz  │
│  Qayerdan   [ Viloyat      ▾]  │
│  Hozir      [ Shahar       ▾]  │
│  O'qish     [ OTM          ▾]  │
│  Yo'nalish  [______________]   │
│  Kurs       [ 2           ▾ ]  │
│                                │
│  🔒 Familiyangiz va o'qish joyi │
│  faqat juftlikdan keyin        │
│  ko'rinadi.                    │
│                                │
│  [        Davom etish       ]  │
└────────────────────────────────┘
```

## 5. B4 — So'rovnoma (qadamlardan biri)

```
┌────────────────────────────────┐
│ ←   O'zing haqingda   ▓▓▓▓░░ 4/6│
├────────────────────────────────┤
│  Qiziqishlar (kamida 3)        │
│  [IT✓] [Futbol✓] [Kitob]       │
│  [Musiqa] [Oshpazlik✓] [Shaxmat]│
│  [Sayohat] [+ boshqa]          │
│                                │
│  Nima qila olasan? (kamida 2)  │
│  [Repetitorlik✓] [Uy ishlari✓] │
│  [Kompyuter] [Ta'mirlash] [+]  │
│                                │
│  Xarakter                      │
│  Tinch ●───○───○───○ Faol      │
│  Kamgap ○───●───○───○ Ochiq    │
│                                │
│  Kun tartibi                   │
│  ( ) Erta turaman  ( ) Kech    │
│  Uyda: ( ) Ko'p  ( ) Kam       │
│  Chekasanmi? ( ) Yo'q ( ) Ha   │
│                                │
│  [ Orqaga ]  [   Davom    ]    │
│  Saqlandi ✓ · keyin davom etish│
└────────────────────────────────┘
```

## 6. B8 — Kutish holati (verifikatsiya)

```
┌────────────────────────────────┐
│ Mehr                    🔔  SOS │
├────────────────────────────────┤
│  ⏳ Profilingiz tekshirilmoqda │
│  Odatda 1–3 ish kuni           │
│                                │
│  ✅ Telefon tasdiqlandi         │
│  ✅ Profil to'ldirildi          │
│  ✅ Rasmlar (4) — tekshiruvda   │
│  ⚠️ Video — yuklanmagan  [+]    │
│  ⚠️ Pasport — yuklanmagan [+]   │
│  ⚠️ O'qish ma'lumotnomasi  [+]  │
│                                │
│  [ Hujjatlarni yuklash ]       │
│                                │
│  Bu orada: [Qanday ishlaydi?]  │
│            [Telegram'ni ulash] │
├────────────────────────────────┤
│ 🏠🔒  🔍🔒   💛    💬    👤      │
└────────────────────────────────┘
```

## 7. C — Bosh (yosh): tavsiyalar lentasi

```
┌────────────────────────────────┐
│ Mehr                    🔔  SOS │
├────────────────────────────────┤
│  📅 Ertaga 15:00 — uchrashuv   │
│     Karimovlar · Fond ofisi  > │
├────────────────────────────────┤
│  Sizga mos oilalar             │
│  ┌──────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  │ ▓▓▓▓▓ oila rasmi ▓▓▓▓▓▓▓ │  │
│  │ Karimovlar oilasi    87% │  │
│  │ Toshkent · Yunusobod     │  │
│  │ 🏠 Yashash · 🎓 Mentorlik │  │
│  │ ✦ Umumiy: IT, futbol     │  │
│  │ ✦ Ikkalangiz ham erta    │  │
│  │   turasiz                │  │
│  │ ⭐ 2 muvaffaqiyatli juftlik│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  │ Aliyevlar oilasi     81% │  │
│  │ ...                      │  │
├────────────────────────────────┤
│ 🏠    🔍    💛    💬    👤      │
└────────────────────────────────┘
```

## 8. C — Oila profili (yosh ko'radi)

```
┌────────────────────────────────┐
│ ←                    ⋯ Shikoyat │
├────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓ ◀ 1/5 ▶ ▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓ (watermark) ▓▓▓▓▓▓▓▓ │
├────────────────────────────────┤
│  Karimovlar oilasi        87%  │
│  Toshkent · Yunusobod tumani   │
│  ▶ Oila videosi (0:45)         │
├────────────────────────────────┤
│  Nega mos?                     │
│  ✦ Umumiy qiziqishlar: IT,     │
│    futbol                      │
│  ✦ Otasi dasturchi — IT bo'yicha│
│    mentorlik                   │
│  ✦ Uyda o'zbek tilida          │
├────────────────────────────────┤
│  Oila a'zolari                 │
│  👨 Rustam K., 48 · ota · dasturchi│
│  👩 Dilnoza K., 45 · ona · o'qituvchi│
│  👧 Farzand, 12 · qiz          │
├────────────────────────────────┤
│  Taklif                        │
│  🏠 Yashash  🎓 Mentorlik       │
│  💰 Yordam: ovqat, kurslar     │
├────────────────────────────────┤
│  Uy: kvartira · alohida xona ✓ │
│  ▓▓ xona ▓▓  ▓▓ xona ▓▓        │
├────────────────────────────────┤
│  Uy qoidalari                  │
│  • 22:00 gacha qaytish         │
│  • Uy ishlarida yordam         │
│  • Mehmonlar — kelishib        │
├────────────────────────────────┤
│  [   💛 Qiziqish bildirish    ]│
│  Bugun: 2/5 qoldi              │
└────────────────────────────────┘
```

## 9. C — Qiziqishlar

```
┌────────────────────────────────┐
│ Qiziqishlar           Bugun 3/5│
├────────────────────────────────┤
│ [Kiruvchi 2] [Yuborilgan] [Juftliklar] │
├────────────────────────────────┤
│  ▓▓ Aliyevlar oilasi     81%   │
│     2 kun oldin                │
│     [ Rad etish ] [ Qabul ✓ ]  │
├────────────────────────────────┤
│  ▓▓ Saidovlar oilasi     74%   │
│     5 kun oldin · 9 kun qoldi  │
│     [ Rad etish ] [ Qabul ✓ ]  │
├────────────────────────────────┤
│  ℹ️ Javobsiz qiziqishlar 14     │
│  kundan keyin yopiladi.        │
├────────────────────────────────┤
│ 🏠    🔍    💛    💬    👤      │
└────────────────────────────────┘
```

## 10. C — Chat

```
┌────────────────────────────────┐
│ ←  ▓ Karimovlar        📅  ⋯   │
│    Sinov davri · 2-hafta       │
├────────────────────────────────┤
│                                │
│ ┌───────────────────────┐      │
│ │ Rustam aka (ota):     │      │
│ │ Assalomu alaykum!     │      │
│ │ Shanba kuni bo'shmisiz?│     │
│ └───────────────────────┘ 10:12│
│        ┌────────────────────┐  │
│        │ Va alaykum assalom! │  │
│        │ Ha, bo'shman 🙂     │  │
│        └────────────────────┘ ✓✓│
│ ┌───────────────────────┐      │
│ │ Dilnoza opa (ona):    │      │
│ │ ▶ ━━━━━━━ 0:23 (ovoz) │      │
│ └───────────────────────┘      │
│        ┌────────────────────┐  │
│        │ ⚠️ Xabar tekshiruvda │  │
│        │ (kontakt ma'lumoti  │  │
│        │ aniqlandi)          │  │
│        └────────────────────┘  │
├────────────────────────────────┤
│ [📷] [__xabar yozing______] [🎤]│
└────────────────────────────────┘
```
> 14–17 (v2): yuqorida doimiy banner chiqadi — `👁 Ota-onangiz ham bu chatni ko'radi`.

## 11. C — Juftlik sahifasi (stepper)

```
┌────────────────────────────────┐
│ ←  Karimovlar bilan            │
├────────────────────────────────┤
│  ✅ Juftlik         12.09      │
│  ✅ Chat                       │
│  ✅ 1-uchrashuv     18.09 fond │
│  ● Sinov davri     2/4 hafta   │
│  ○ Kelishuv                    │
│  ○ Faol                        │
├────────────────────────────────┤
│  Sinov checklisti              │
│  [✓] 1-uchrashuv               │
│  [✓] 2-uchrashuv               │
│  [ ] 3-uchrashuv  [Bron qilish]│
│  [ ] Dam olish kuni mehmonda   │
├────────────────────────────────┤
│  Sinov tugagach:               │
│  [ To'xtatamiz ] [Davom etamiz]│
│  (javobingizni oila ko'rmaydi) │
├────────────────────────────────┤
│  Koordinator: Malika S.        │
│  [ 💬 Yozish ]                 │
│  [ Munosabatni tugatish ]      │
└────────────────────────────────┘
```

## 12. C — Kelishuv va imzolash

```
┌────────────────────────────────┐
│ ←  Kelishuv                    │
├────────────────────────────────┤
│  Tomonlar: Aziz K. ↔ Karimovlar│
│  Turi: Yashash + Mentorlik     │
│  Muddat: 30.06.2028 gacha      │
│  ────────────────────────────  │
│  1. Majburiyatlar ...          │
│  2. Uy qoidalari ...           │
│  3. Yordam turlari ...         │
│  4. Chiqib ketish tartibi ...  │
│  5. Fond va SOS kontaktlari    │
│  ────────────────────────────  │
│  Imzolar                       │
│  ✅ Rustam K.                   │
│  ✅ Dilnoza K.                  │
│  ○ Aziz K. (siz)               │
│  ○ Koordinator tasdig'i        │
│                                │
│  [✓] O'qidim va roziman        │
│  [    SMS kod bilan imzolash  ]│
└────────────────────────────────┘
```

## 13. C — SOS

```
┌────────────────────────────────┐
│ ✕                          SOS │
├────────────────────────────────┤
│                                │
│   Nima bo'ldi?                 │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🚨 Xavf ostidaman         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🚪 Hozir ketmoqchiman     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 💬 Koordinator bilan      │  │
│  │    gaplashmoqchiman       │  │
│  └──────────────────────────┘  │
│                                │
│  [✓] Joylashuvimni yuborish    │
│                                │
│  Favqulodda: 📞 112             │
│  Ishonch telefoni: 📞 1146      │
│                                │
│  Bu oilaga ko'rinmaydi.        │
└────────────────────────────────┘
```

## 14. D — Oila: a'zolar va limitlar

```
┌────────────────────────────────┐
│ ←  Oilamiz                     │
├────────────────────────────────┤
│  Holat: ✅ Tasdiqlangan         │
│  Faol: 🏠 Yashash 1/2 · 🎓 0/5  │
├────────────────────────────────┤
│  A'zolar                       │
│  👨 Rustam, 48 · ota            │
│     ✅ login · ✅ hujjatlar      │
│  👩 Dilnoza, 45 · ona           │
│     ✅ login · ⚠️ ma'lumotnoma   │
│                    [Yuklash]   │
│  👧 Madina, 12 · qiz            │
│     — (voyaga yetmagan)        │
│  [ + A'zo qo'shish ]           │
├────────────────────────────────┤
│  Uy-sharoit            [Tahr.] │
│  Taklif va qoidalar    [Tahr.] │
│  Media (5 rasm, 1 video)[Tahr.]│
└────────────────────────────────┘
```

## 15. F — Admin: Dashboard (desktop)

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ Mehr Admin   │  Dashboard                     Malika S. · Toshkent ▾│
│              ├──────────────────────────────────────────────────────┤
│ ▸ Dashboard  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│   Verifik.(12)│ │ 🚨 SOS  │ │ Verifik.│ │ Moderat.│ │ Signal  │       │
│   Moderat.(31)│ │   1     │ │   12    │ │   31    │ │   4     │       │
│   Shikoyat(3)│ │ 04:12 ⏱ │ │ eng eski│ │         │ │         │       │
│   SOS (1)    │ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│   Signallar  │                                                       │
│   Foydalan.  │  Bugungi uchrashuvlar                                 │
│   Juftliklar │  ┌────────┬───────────────┬──────────┬────────┐       │
│   Uchrashuv  │  │ 11:00  │ Aziz ↔ Karimov│ Fond ofisi│ [Ochish]│      │
│   Kelishuv   │  │ 15:00  │ Laylo ↔ Saidov│ Kutubxona │ [Ochish]│      │
│   Check-in   │  └────────┴───────────────┴──────────┴────────┘       │
│   Kontent    │                                                       │
│   Sozlamalar │  Viloyatlar xaritasi        Voronka (30 kun)          │
│   Audit      │  ┌──────────────────┐       Ro'yxat   1240 ████████   │
│   Analitika  │  │   ▓ xarita ▓      │       Tasdiq.   610 ████       │
│              │  │                  │       Juftlik   180 █▌         │
│              │  └──────────────────┘       Faol       64 ▌          │
└──────────────┴──────────────────────────────────────────────────────┘
```

## 16. F — Admin: Verifikatsiya navbati

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ ...          │  Verifikatsiya  ·  12 ta navbatda   [Filtr: Oila ▾]   │
│              ├───────────────────────┬──────────────────────────────┤
│              │ ● Karimovlar   2 kun  │  Karimovlar oilasi · Toshkent │
│              │ ○ Aziz K.      1 kun  │  ──────────────────────────── │
│              │ ○ Saidovlar    1 kun  │  Rustam K. (ota)              │
│              │ ○ Laylo M.     3 s    │   Pasport  [▓▓▓ ko'rish ▓▓▓]  │
│              │ ...                   │   Sudlanmaganlik [▓▓ ko'rish] │
│              │                       │   ✓ Qora ro'yxatda yo'q       │
│              │                       │  Dilnoza K. (ona)             │
│              │                       │   Pasport  [▓▓▓ ko'rish ▓▓▓]  │
│              │                       │   ⚠️ Ma'lumotnoma yo'q         │
│              │                       │  ──────────────────────────── │
│              │                       │  Hujjatni ochish sababi:      │
│              │                       │  [Verifikatsiya ▾] (auditga)  │
│              │                       │  ──────────────────────────── │
│              │                       │  Izoh: [__________________]   │
│              │                       │  [Rad etish] [So'rash] [✓ OK] │
└──────────────┴───────────────────────┴──────────────────────────────┘
```

---

## Keyingi qadam
Ushbu 16 ta ekran asosida **bosiladigan HTML prototip** (mobil ekranlar + admin paneli).
