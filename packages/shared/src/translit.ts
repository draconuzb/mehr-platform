// O'zbek tili: lotin ↔ kirill transliteratsiyasi (qaror #11).
// UI matnlari i18n fayllarida alohida saqlanadi; bu funksiya foydalanuvchi
// kiritgan matnni (ism, bio) boshqa yozuvda ko'rsatish uchun ishlatiladi.

const APOSTROPHES = /[‘’ʻʼ`´]/g;
const LAT_VOWELS = "aeiouAEIOU";
const CYR_VOWELS = "аеёиоуўэюяАЕЁИОУЎЭЮЯ";

const LAT_DIGRAPHS: Record<string, string> = {
  "o'": "ў", "g'": "ғ", sh: "ш", ch: "ч", yo: "ё", yu: "ю", ya: "я", ye: "е",
};
const LAT_SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л",
  m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в",
  x: "х", y: "й", z: "з", c: "с", w: "в",
};

const isUpper = (ch: string | undefined) => !!ch && ch !== ch.toLowerCase() && ch === ch.toUpperCase();
const isLetter = (ch: string | undefined) => !!ch && ch.toLowerCase() !== ch.toUpperCase();

export function latinToCyrillic(input: string): string {
  const s = input.replace(APOSTROPHES, "'");
  let out = "";
  for (let i = 0; i < s.length; ) {
    const c = s[i]!;
    const pair = s.slice(i, i + 2);
    const lowerPair = pair.toLowerCase();

    if (LAT_DIGRAPHS[lowerPair] && !(lowerPair === "ye" && i > 0 && isLetter(s[i - 1]) && !LAT_VOWELS.includes(s[i - 1]!))) {
      const cyr = LAT_DIGRAPHS[lowerPair]!;
      out += isUpper(c) ? cyr.toUpperCase() : cyr;
      i += 2;
      continue;
    }

    const lower = c.toLowerCase();
    if (lower === "e") {
      const prev = s[i - 1];
      const wordStart = !isLetter(prev) && prev !== "'";
      const afterVowel = !!prev && LAT_VOWELS.includes(prev);
      const cyr = wordStart || afterVowel ? "э" : "е";
      out += isUpper(c) ? cyr.toUpperCase() : cyr;
      i += 1;
      continue;
    }
    if (c === "'") {
      // tutuq belgisi (ma'lumot → маълумот)
      out += isLetter(s[i - 1]) ? "ъ" : c;
      i += 1;
      continue;
    }
    const cyr = LAT_SINGLE[lower];
    out += cyr ? (isUpper(c) ? cyr.toUpperCase() : cyr) : c;
    i += 1;
  }
  return out;
}

const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "x", ч: "ch", ш: "sh", щ: "sh", ъ: "'", ы: "i", ь: "", э: "e", ю: "yu",
  я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};

export function cyrillicToLatin(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    const lower = c.toLowerCase();
    let lat: string | undefined;

    if (lower === "е") {
      const prev = input[i - 1];
      lat = !isLetter(prev) || (prev && CYR_VOWELS.includes(prev)) || prev === "ъ" || prev === "Ъ" ? "ye" : "e";
    } else if (lower === "ц") {
      lat = !isLetter(input[i - 1]) ? "s" : "ts";
    } else {
      lat = CYR_MAP[lower];
    }

    if (lat === undefined) {
      out += c;
      continue;
    }
    if (!isUpper(c) || lat.length === 0) {
      out += lat;
      continue;
    }
    // Katta harf: butun so'z katta bo'lsa — hammasi katta, aks holda faqat birinchi harf
    const next = input[i + 1];
    const wordUpper = isUpper(next) || (!isLetter(next) && isUpper(input[i - 1]));
    out += wordUpper ? lat.toUpperCase() : lat[0]!.toUpperCase() + lat.slice(1);
  }
  return out;
}
