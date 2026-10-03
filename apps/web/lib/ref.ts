"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export type Names = { uz_latn: string; uz_cyrl?: string; ru?: string; kaa?: string };
export type Region = { id: number; code: string; names: Names };
export type City = { id: number; regionId: number; names: Names };
export type District = { id: number; names: Names };
export type Tag = { id: number; type: "INTEREST" | "SKILL" | "MENTOR_AREA"; slug: string; labels: Names };

// Til tanlash keyingi bosqichda — hozircha o'zbek (lotin)
export const label = (n: Names | undefined) => n?.uz_latn ?? "";

const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      apiFetch<T>(path).then((r) => {
        if (r.status !== 200) {
          cache.delete(path);
          throw new Error(`${path}: ${r.status}`);
        }
        return r.body;
      }),
    );
  }
  return cache.get(path) as Promise<T>;
}

/** Ma'lumotnomani yuklaydi va keshlaydi; path null bo'lsa — hech narsa yuklanmaydi */
export function useRef_<T>(path: string | null): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!path) return setData(null);
    let alive = true;
    load<T>(path).then((d) => alive && setData(d)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [path]);
  return data;
}
