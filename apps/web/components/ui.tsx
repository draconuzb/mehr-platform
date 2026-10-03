"use client";

import { useId } from "react";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function TextInput(props: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      className="input"
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      autoComplete={props.autoComplete}
      maxLength={props.maxLength}
      inputMode={props.inputMode}
    />
  );
}

export function TextArea(props: { value: string | undefined; onChange: (v: string) => void; placeholder?: string; min: number; max: number }) {
  const len = (props.value ?? "").trim().length;
  return (
    <div className="textarea-wrap">
      <textarea
        className="input textarea"
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        maxLength={props.max}
        rows={6}
      />
      <span className={`counter ${len < props.min ? "low" : ""}`}>
        {len < props.min ? `Yana kamida ${props.min - len} ta belgi` : `${len} / ${props.max}`}
      </span>
    </div>
  );
}

/** Bir yoki bir nechta qiymat tanlash uchun katta chip'lar */
export function Chips<T extends string | number>(props: {
  options: Array<{ value: T; label: string; icon?: string }>;
  value: T[] | T | undefined;
  onChange: (v: T[] | T) => void;
  multiple?: boolean;
  max?: number;
}) {
  const selected = new Set(Array.isArray(props.value) ? props.value : props.value !== undefined ? [props.value] : []);
  const toggle = (v: T) => {
    if (!props.multiple) return props.onChange(v);
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else if (!props.max || next.size < props.max) next.add(v);
    props.onChange([...next]);
  };
  return (
    <div className="chips" role={props.multiple ? "group" : "radiogroup"}>
      {props.options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="chip"
          role={props.multiple ? "checkbox" : "radio"}
          aria-checked={selected.has(o.value)}
          onClick={() => toggle(o.value)}
        >
          {o.icon && <span aria-hidden>{o.icon} </span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Katta kartochkali tanlov (masalan, munosabat turlari) */
export function Cards<T extends string>(props: {
  options: Array<{ value: T; title: string; text: string; icon: string }>;
  value: T[] | undefined;
  onChange: (v: T[]) => void;
}) {
  const selected = new Set(props.value ?? []);
  return (
    <div className="cards">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="checkbox"
          aria-checked={selected.has(o.value)}
          className="card-option"
          onClick={() => {
            const next = new Set(selected);
            if (next.has(o.value)) next.delete(o.value);
            else next.add(o.value);
            props.onChange([...next]);
          }}
        >
          <span className="card-icon" aria-hidden>
            {o.icon}
          </span>
          <span>
            <b>{o.title}</b>
            <small>{o.text}</small>
          </span>
          <span className="card-check" aria-hidden>
            {selected.has(o.value) ? "✓" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

export function YesNo(props: { value: boolean | undefined; onChange: (v: boolean) => void; yes?: string; no?: string }) {
  return (
    <Chips
      options={[
        { value: "yes", label: props.yes ?? "Ha" },
        { value: "no", label: props.no ?? "Yo'q" },
      ]}
      value={props.value === undefined ? undefined : props.value ? "yes" : "no"}
      onChange={(v) => props.onChange(v === "yes")}
    />
  );
}

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

/** Sana: uchta select (telefonda uzun g'ildirakni aylantirishdan qulayroq). Qiymat — YYYY-MM-DD */
export function DateSelect(props: { value: string | undefined; onChange: (v: string | undefined) => void; fromYear: number; toYear: number }) {
  const id = useId();
  const [y, m, d] = (props.value ?? "--").split("-");
  const set = (ny = y, nm = m, nd = d) => {
    if (ny && nm && nd) {
      const max = new Date(Date.UTC(Number(ny), Number(nm), 0)).getUTCDate();
      const day = String(Math.min(Number(nd), max)).padStart(2, "0");
      props.onChange(`${ny}-${nm}-${day}`);
    } else props.onChange(`${ny ?? ""}-${nm ?? ""}-${nd ?? ""}`);
  };
  const years = [];
  for (let i = props.toYear; i >= props.fromYear; i--) years.push(i);
  return (
    <div className="date-select">
      <select aria-label="Kun" id={`${id}-d`} className="input" value={d || ""} onChange={(e) => set(y, m, e.target.value)}>
        <option value="">Kun</option>
        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((v) => (
          <option key={v} value={v}>
            {Number(v)}
          </option>
        ))}
      </select>
      <select aria-label="Oy" className="input" value={m || ""} onChange={(e) => set(y, e.target.value, d)}>
        <option value="">Oy</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, "0")}>
            {name}
          </option>
        ))}
      </select>
      <select aria-label="Yil" className="input" value={y || ""} onChange={(e) => set(e.target.value, m, d)}>
        <option value="">Yil</option>
        {years.map((v) => (
          <option key={v} value={String(v)}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Scale(props: { value: number | undefined; onChange: (v: number) => void; left: string; right: string }) {
  return (
    <div className="scale">
      <span>{props.left}</span>
      <div className="scale-dots" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={props.value === n}
            aria-label={`${n}`}
            className="scale-dot"
            onClick={() => props.onChange(n)}
          />
        ))}
      </div>
      <span>{props.right}</span>
    </div>
  );
}
