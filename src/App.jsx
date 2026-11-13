import { useEffect, useRef, useState } from "react";
import "./App.css";
import logo from "./assets/logo.png";
import heroImg from "./assets/edulight.jpg";
import qrImg from "./assets/shamcash-qr.jpg";
import r1 from "./assets/reviews/r1.jpg";
import r2 from "./assets/reviews/r2.jpg";
import r3 from "./assets/reviews/r3.jpg";
import r4 from "./assets/reviews/r4.jpg";

// الصق هنا رابط Web App الناتج عن Google Apps Script (انظر README.txt)
const YT_LINK = "https://youtube.com/@edu_light?si=3mWQACSP5dUV3vKV";
const WA_NUMBER = "963964699143";
const WA_CONTACT = `https://wa.me/${WA_NUMBER}`;
const reviews = [r1, r2, r3, r4];
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEsC6g72r5FKm7cA0Cv-DispHJeH0_84E-G_pKhGt26TQ1IEr7z15MwQRHzY25jHZRGA/exec";

// المحتوى الأصلي نفسه، بصياغة أقصر وأوضح، مع عنوان مختصر لكل فائدة
// المحتوى الأصلي نفسه، مرتّباً في ثلاثة محاور واضحة
const groups = [
  {
    title: "وضوح تام",
    items: [
      ["اعرف لماذا فشلت محاولاتك السابقة", "نعالج المشكلة من جذورها، فلا تعود إلى الدائرة نفسها كل أسبوع."],
      ["اعرف ماذا تدرس ومتى", "تنتهي الحيرة بين المدرسة والمعهد والمنصة واليوتيوب والخصوصي."],
    ],
  },
  {
    title: "إنجاز فعلي",
    items: [
      ["أنهِ التراكم", "طريقة عملية ومنظمة توقف التأجيل وتعيد لك السيطرة على موادك."],
      ["للطالب الحر", "نظام يناسبك أنت، ويبقيك ملتزماً حتى في الأيام الصعبة."],
    ],
  },
  {
    title: "توازن يدوم",
    items: [
      ["استمتع بوقتك دون تأنيب ضمير", "الهاتف والتسلية والخروج كلها موجودة ضمن نظام يريحك ويُنجزك."],
      ["برنامج مرن لا ينكسر", "يتغير مع ظروفك، بدل برنامج مثالي ينهار عند أول ظرف طارئ."],
      ["مهارة تبقى معك طوال السنة", "السيطرة على وقتك مهما تغيرت الظروف."],
    ],
  },
];

const steps = [
  <>امسح الكود وحوّل <bdi>15$</bdi> عبر شام كاش (الليرة السورية مقبولة).</>,
  "ارفع صورة وصل التحويل في الأسفل.",
  "نفعّل لك الكورس وتبدأ مباشرة.",
];

// تصغير الصورة قبل الإرسال لتبقى خفيفة
function shrink(file, max = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = url;
  });
}

const CONTACT_NOTE = "سيتم التواصل معك بأقرب وقت، خلال مدة أقصاها 6 ساعات من تاريخ إرسال وصل الدفع.";

// رسالة واضحة لكل سبب رفض يرجعه الخادم
const ERROR_MESSAGES = {
  network: "تعذّر الإرسال، تحقق من الاتصال وحاول مرة أخرى.",
  server: "وصل الطلب لكن الخادم لم يردّ بشكل صحيح. أعد نشر Apps Script ثم حاول مرة أخرى.",
};

function ReceiptForm({ onDone }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const input = useRef(null);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setStatus("sending");
    try {
      const data = await shrink(file);
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name,
          phone,
          fileName: `${name || "receipt"}-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          data,
        }),
      });
      let result;
      try {
        result = await res.json();
      } catch {
        throw new Error("bad_response");
      }

      if (result.ok) {
        setStatus("done");
        onDone && onDone();
      } else {
        setErrorMsg(result.detail ? `تعذّر حفظ الوصل: ${result.detail}` : ERROR_MESSAGES.network);
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err && err.message === "bad_response" ? ERROR_MESSAGES.server : ERROR_MESSAGES.network);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="done" role="status">
        <p>تم استلام الوصل وتسجيل بياناتك.</p>
        <p className="done-note">{CONTACT_NOTE}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form">
      <label>
        الاسم
        <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label>
        رقم الهاتف
        <input
          required
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </label>
      <button type="button" className="pick" onClick={() => input.current.click()}>
        {file ? `تم اختيار: ${file.name}` : "اختر صورة الوصل"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button className="btn" disabled={!file || status === "sending"}>
        {status === "sending" ? "جارٍ الإرسال…" : "أرسل الوصل"}
      </button>
      <p className="note">{CONTACT_NOTE}</p>
      {status === "error" && (
        <p className="err" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

const PAY_CODE = "bdfef7b2cfc74571ccea5322d02b40e7";

// خانة نسخ الكود: نقرة واحدة تنسخ الكود كاملاً
function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // احتياط للمتصفحات القديمة أو الاتصال غير الآمن
      const t = document.createElement("textarea");
      t.value = code;
      t.setAttribute("readonly", "");
      t.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); } catch { /* تجاهل */ }
      document.body.removeChild(t);
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="copybox">
      <span className="copybox-label">أو انسخ الكود يدوياً</span>
      <button type="button" className={`copycode${copied ? " ok" : ""}`} onClick={copy} aria-label={`نسخ الكود ${code}`}>
        <code className="copycode-text" dir="ltr">{code}</code>
        <span className="copycode-act" aria-hidden="true">
          <svg className="ic-copy" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></svg>
          <svg className="ic-check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <span className="copycode-word">{copied ? "تم النسخ" : "انقر للنسخ"}</span>
        </span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">{copied ? "تم نسخ الكود" : ""}</span>
    </div>
  );
}

// توهّج يتبع المؤشر داخل البطاقة الزجاجية
function spot(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

// شريط اشتراك ثابت على الهاتف بين الهيرو وقسم الاشتراك
function useStickyCta(heroRef, subRef) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const seen = { hero: true, sub: false };
    const update = () => setShow(!seen.hero && !seen.sub);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        seen[en.target === heroRef.current ? "hero" : "sub"] = en.isIntersecting;
      });
      update();
    });
    if (heroRef.current) io.observe(heroRef.current);
    if (subRef.current) io.observe(subRef.current);
    return () => io.disconnect();
  }, [heroRef, subRef]);
  return show;
}

// آراء الطلاب: رزمة أوراق لعب. تخرج الورقة الأمامية يميناً وتختفي، ثم تعود إلى آخر الرزمة فلا تنتهي الصور أبداً.
const LOOP = [...reviews, ...reviews]; // نسختان حتى تبقى خمس طبقات ظاهرة دائماً
const VISIBLE = 5; // ثلاث واضحة في الأمام واثنتان خلفها
const FLY_MS = 560;

function Reviews() {
  const wrap = useRef(null);
  const dlg = useRef(null);
  const press = useRef(null);
  const busy = useRef(false);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(null); // { i, dir }
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(true);
  const [open, setOpen] = useState(null);
  const total = LOOP.length;
  activeRef.current = active;

  const advance = (dir = 1) => {
    if (busy.current) return;
    busy.current = true;
    setLeaving({ i: activeRef.current % total, dir });
    setActive((a) => a + 1);
    setTimeout(() => { setLeaving(null); busy.current = false; }, FLY_MS);
  };

  // تشغيل تلقائي هادئ، يتوقف عند اللمس أو التمرير بالفأرة أو التكبير أو خروج القسم من الشاشة
  const paused = hover || dragging || !inView || open !== null;
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => advance(1), 4200);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    const io = new IntersectionObserver(([en]) => setInView(en.isIntersecting), { threshold: 0.35 });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const d = dlg.current;
    if (open !== null && d && !d.open) d.showModal();
  }, [open]);

  const onDown = (e) => {
    if (busy.current) return;
    press.current = { x: e.clientX, moved: false };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    const p = press.current;
    if (!p) return;
    const v = e.clientX - p.x;
    if (Math.abs(v) > 6) p.moved = true;
    setDx(v);
  };
  const onUp = () => {
    const p = press.current;
    if (!p) return;
    press.current = null;
    setDragging(false);
    const v = dx;
    setDx(0);
    if (Math.abs(v) > 70) advance(v > 0 ? 1 : -1);
    else if (!p.moved) setOpen(activeRef.current % reviews.length);
  };
  const onCancel = () => { press.current = null; setDragging(false); setDx(0); };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(active % reviews.length); }
    if (e.key === "ArrowRight") advance(1);
    if (e.key === "ArrowLeft") advance(-1);
  };

  const current = active % reviews.length;

  return (
    <div className="reviews glass" ref={wrap} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="reviews-head">
        <h3 className="h3">آراء الطلاب</h3>
        <div className="arrows">
          <button type="button" aria-label="التالي" onClick={() => advance(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div className="deck">
        {LOOP.map((src, i) => {
          const k = (((i - active) % total) + total) % total;
          const isLeaving = leaving && leaving.i === i;
          const front = k === 0 && !isLeaving;
          let style = { zIndex: 20 - k };
          if (isLeaving) {
            style = { zIndex: 40, opacity: 0, transform: `translateX(${leaving.dir * 130}%) rotate(${leaving.dir * 14}deg)` };
          } else if (front && dragging) {
            style = { zIndex: 30, transition: "none", transform: `translateX(${dx}px) rotate(${dx / 18}deg)` };
          }
          const handlers = front
            ? { role: "button", tabIndex: 0, "aria-label": `تكبير رأي الطالب ${current + 1}`, onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onCancel, onKeyDown: onKey }
            : { "aria-hidden": true };
          return (
            <div key={i} className={`card${front ? " front" : ""}`} data-k={k < VISIBLE ? k : "x"} style={style} {...handlers}>
              <div className="card-bg" style={{ backgroundImage: `url(${src})` }} />
              <img className="card-img" src={src} alt={front ? `رأي طالب ${current + 1} في الكورس` : ""} draggable={false} />
            </div>
          );
        })}
      </div>

      <div className="pips" aria-hidden="true">
        {reviews.map((_, i) => <span key={i} className={i === current ? "on" : ""} />)}
      </div>
      <p className="deck-hint">اسحب البطاقة لعرض التالي، أو اضغط عليها للتكبير</p>

      <dialog ref={dlg} className="lightbox" onClose={() => setOpen(null)} onClick={() => dlg.current.close()}>
        {open !== null && <img src={reviews[open]} alt={`رأي طالب ${open + 1} في الكورس`} />}
      </dialog>
    </div>
  );
}

export default function App() {
  const [sent, setSent] = useState(false);
  const heroRef = useRef(null);
  const subRef = useRef(null);
  const showBar = useStickyCta(heroRef, subRef);

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <img src={heroImg} alt="" />
      </div>

      <main className="page">
        <header className="hero" ref={heroRef}>
          <div className="hero-copy">
            <img className="logo" src={logo} alt="EDUCATION Light" />
            <h1 className="title">كورس تنظيم الوقت لطلاب البكالوريا</h1>
            <p className="lead">
              امتلك وقتك قبل أن يمتلكك الامتحان: خطة واضحة لما تدرسه ومتى، تناسب ظروفك وتبقى معك حتى نهاية السنة.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#inside">
                اعرف التفاصيل
              </a>
              <p className="hero-note">فيديوهات مسجلة، واشتراك لمرة واحدة يبقى معك حتى نهاية السنة.</p>
            </div>
          </div>

          <figure className="hero-photo glass">
            <img src={heroImg} alt="مدرّس الكورس" width="800" height="800" fetchpriority="high" />
          </figure>
        </header>

        <section className="section" aria-labelledby="inside">
          <h2 id="inside" className="h2">سوف تحصل على</h2>
          <div className="groups">
            {groups.map((g) => (
              <article key={g.title} className="glass group" onPointerMove={spot}>
                <h3 className="group-title">{g.title}</h3>
                <ul className="checks">
                  {g.items.map(([t, d]) => (
                    <li key={t}>
                      <strong>{t}</strong>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section subscribe" id="subscribe" ref={subRef} aria-labelledby="how">
          <div className="glass pay">
            <div className="pay-info">
              <h2 id="how" className="h2">طريقة الاشتراك</h2>
              <div className="price">
                <del className="was"><bdi>30$</bdi></del>
                <bdi className="price-num">15$</bdi>
                <span className="price-words">
                  خمسة عشر دولاراً أو ما يعادلها بالليرة السورية بسعر يوم التحويل
                  <br />
                  دفعة واحدة
                </span>
              </div>
              <p className="promo">حسم مؤقت فقط: ادفع <bdi>15$</bdi></p>
              <ol className="steps">
                {steps.map((s, i) => (
                  <li key={i}><span>{s}</span></li>
                ))}
              </ol>
              <div className="qr">
                <img src={qrImg} alt="كود الدفع عبر شام كاش" loading="lazy" />
              </div>
              <CopyCode code={PAY_CODE} />
            </div>
            <div className="pay-form">
              <ReceiptForm onDone={() => setSent(true)} />
              <a className={`wa-help${sent ? " gold" : ""}`} href={WA_CONTACT} target="_blank" rel="noreferrer">
                للتواصل والاستفسار عبر واتساب
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <section className="about" aria-labelledby="about-title">
          <h2 id="about-title" className="h2">لمحة عن المهندس لؤي أبو منذر</h2>
          <p className="bio">
            مهندس معلوماتية .<br />
            خبرة 4 سنوات بالتعامل مع طلاب البكالوريا ومشاكلهم<br />
            ساعد اكثر من 600طالب بشكل خاص بالوصول لاحلامهم طوال 4سنوات<br />
            و ساعد اكثر 55الف طالب بشكل عام
          </p>
        </section>
        <Reviews />
        <p className="copy">© {new Date().getFullYear()} EDU Light</p>
      </footer>

      <div className="floats">
        <a className="float" href={WA_CONTACT} target="_blank" rel="noreferrer" aria-label="تواصل عبر واتساب" data-tip="تواصل معنا">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.2 15l-.3-.18-3 .87.9-2.9-.2-.3A8.1 8.1 0 0 1 12.04 3.8Zm-3 3.9c-.2 0-.5.07-.75.35-.26.28-1 1-1 2.4s1.03 2.8 1.18 3c.14.2 2 3.2 4.9 4.35 2.4.95 2.9.76 3.4.7.52-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.28-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.2.28-.74.94-.9 1.13-.17.2-.33.22-.62.08-.28-.14-1.2-.44-2.28-1.4-.85-.76-1.42-1.7-1.58-1.98-.17-.28-.02-.44.12-.58.13-.13.28-.33.42-.5.14-.16.2-.28.28-.47.1-.2.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55Z" /></svg>
        </a>
        <a className="float" href={YT_LINK} target="_blank" rel="noreferrer" aria-label="قناتنا على يوتيوب" data-tip="اشترك بقناتنا">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.78 2 12 2 12s0 3.22.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.22 22 12 22 12s0-3.22-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>
        </a>
      </div>

      <a className={`sticky-cta btn ${showBar ? "on" : ""}`} href="#subscribe" tabIndex={showBar ? 0 : -1}>
        اشترك الآن
      </a>
    </>
  );
}
