import { describe, expect, it } from "vitest";
import { cyrillicToLatin, latinToCyrillic } from "./translit";

describe("latinToCyrillic", () => {
  it.each([
    ["O'zbekiston", "Ўзбекистон"],
    ["G'ayrat", "Ғайрат"],
    ["Shahnoza", "Шаҳноза"],
    ["Yunusobod", "Юнусобод"],
    ["ertaga", "эртага"],
    ["Toshkent", "Тошкент"],
    ["ma'lumot", "маълумот"],
    ["Mehr", "Меҳр"],
    ["yer", "ер"],
    ["oʻqish", "ўқиш"],
    ["SHAHAR", "ШАҲАР"],
  ])("%s → %s", (lat, cyr) => {
    expect(latinToCyrillic(lat)).toBe(cyr);
  });
});

describe("cyrillicToLatin", () => {
  it.each([
    ["Ўзбекистон", "O'zbekiston"],
    ["Ёшлар", "Yoshlar"],
    ["Шаҳноза", "Shahnoza"],
    ["маълумот", "ma'lumot"],
    ["эртага", "ertaga"],
    ["ер", "yer"],
    ["ШАҲАР", "SHAHAR"],
  ])("%s → %s", (cyr, lat) => {
    expect(cyrillicToLatin(cyr)).toBe(lat);
  });
});
