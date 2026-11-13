import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, flagOf, cleanDigits, checkPhone, hintFor } from "./phone.js";

// حقل رقم هاتف: قائمة دول منسدلة بالأعلام ورمز الدولة + تحقق حسب الدولة
export default function PhoneField({ iso, onIso, value, onValue, labelId }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [touched, setTouched] = useState(false);
  const box = useRef(null);
  const search = useRef(null);
  const country = COUNTRIES.find((c) => c.iso === iso) || COUNTRIES[0];
  const res = useMemo(() => checkPhone(iso, value), [iso, value]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^\+/, "");
    if (!s) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.includes(s) || c.iso.toLowerCase() === s || c.code.startsWith(s) || c.iso.toLowerCase().startsWith(s)
    );
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    search.current && search.current.focus();
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const pick = (c) => { onIso(c.iso); setOpen(false); setQ(""); };
  const showErr = touched && value && !res.ok;

  return (
    <div className="phone-wrap" ref={box}>
      <div className={`phone${showErr ? " bad" : ""}${res.ok ? " good" : ""}`}>
        <button
          type="button" className="phone-cc" aria-haspopup="listbox" aria-expanded={open}
          aria-label={`رمز الدولة: ${country.name} +${country.code}`}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          <img src={flagOf(country.iso)} alt="" width="26" height="17" />
          <bdi dir="ltr">+{country.code}</bdi>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className={open ? "up" : ""}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <input
          required type="tel" inputMode="tel" dir="ltr" autoComplete="tel-national"
          aria-labelledby={labelId} aria-invalid={showErr ? "true" : "false"}
          value={value}
          onChange={(e) => onValue(cleanDigits(e.target.value))}
          onBlur={() => setTouched(true)}
        />
      </div>

      {open && (
        <div className="phone-menu">
          <input
            ref={search} className="phone-search" placeholder="ابحث عن دولة أو رمز" aria-label="ابحث عن دولة"
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") { e.preventDefault(); if (list[0]) pick(list[0]); }
            }}
          />
          <ul role="listbox" aria-label="الدول">
            {list.map((c) => (
              <li key={c.iso} role="option" aria-selected={c.iso === iso}>
                <button type="button" className={c.iso === iso ? "on" : ""} onClick={() => pick(c)}>
                  <img src={flagOf(c.iso)} alt="" width="26" height="17" loading="lazy" />
                  <span className="cn">{c.name}</span>
                  <bdi dir="ltr" className="ck">+{c.code}</bdi>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="none">لا توجد نتائج</li>}
          </ul>
        </div>
      )}

      <p className={`field-note${showErr ? " err-text" : ""}`} role={showErr ? "alert" : undefined}>
        {showErr ? res.error : hintFor(iso)}
      </p>
    </div>
  );
}
