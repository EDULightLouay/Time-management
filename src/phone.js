import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/mobile";

// أعلام الدول (علم سوريا الجديد: أخضر/أبيض/أسود بثلاث نجوم حمراء). تُحمَّل كملفات منفصلة.
const flagFiles = import.meta.glob("./assets/flags/*.svg", { eager: true, query: "?url", import: "default" });
export const flagOf = (iso) => flagFiles[`./assets/flags/${iso}.svg`];

export const DEFAULT_COUNTRY = "SY";

const names = new Intl.DisplayNames(["ar"], { type: "region" });

// قائمة الدول: سوريا أولاً ثم البقية أبجدياً بالعربية
export const COUNTRIES = getCountries()
  .filter((iso) => flagOf(iso))
  .map((iso) => ({ iso, name: names.of(iso) || iso, code: getCountryCallingCode(iso) }))
  .sort((a, b) =>
    a.iso === DEFAULT_COUNTRY ? -1 : b.iso === DEFAULT_COUNTRY ? 1 : a.name.localeCompare(b.name, "ar")
  );

// أرقام عربية/فارسية → لاتينية، وإبقاء الأرقام فقط
export function cleanDigits(v) {
  return String(v)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
    .replace(/\D/g, "")
    .slice(0, 15);
}

// شروط خاصة بكل دولة (فوق قواعد مكتبة libphonenumber لأرقام الموبايل في كل دول العالم)
const RULES = {
  SY: {
    test: (n) => /^9\d{8}$/.test(n), // 9 أرقام تبدأ بالرقم 9
    hint: "٩ أرقام تبدأ بالرقم 9، بدون رمز الدولة",
    error: "رقم سوري غير صحيح: يجب أن يتكون من 9 أرقام ويبدأ بالرقم 9 (مثال: 944123456).",
  },
};

export function hintFor(iso) {
  return RULES[iso]?.hint || "اكتب الرقم بدون رمز الدولة";
}

// يعيد { ok, full, error } — full بصيغة دولية مثل ‎+963 944 123 456
export function checkPhone(iso, raw) {
  let n = cleanDigits(raw);
  if (!n) return { ok: false, full: "", error: "" };
  n = n.replace(/^0+/, ""); // الصفر الأول (بادئة الاتصال المحلي) لا يُحتسب

  const rule = RULES[iso];
  if (rule && !rule.test(n)) return { ok: false, full: "", error: rule.error };

  const p = parsePhoneNumberFromString(n, iso);
  if (!p || !p.isValid()) {
    return { ok: false, full: "", error: "رقم الهاتف غير صالح لهذه الدولة، تأكد منه وأعد المحاولة." };
  }
  return { ok: true, full: p.formatInternational(), error: "" };
}
