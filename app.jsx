/* U·Capital Inmobiliaria — landing page app */

const { useState, useEffect, useRef, useContext, createContext } = React;

/* ============================================================
   LANGUAGE-NEUTRAL CONTENT
   Swap any image URL below — copy lives in i18n.js
   ============================================================ */

const HERO_IMAGE = "https://ucapital.mx/Laja_hero.jpg";

const PORTFOLIO = [
  { name: "Estela Nativa",     location: "Conkal, Mérida", image: "https://ucapital.mx/Estela_Nativa.jpg" },
  { name: "Aldoria",           location: "Conkal, Mérida", image: "https://ucapital.mx/Aldoria.jpg" },
  { name: "NAIA",              location: "Conkal, Mérida", image: "https://ucapital.mx/NAIA.jpg" },
  { name: "Cumbres Novonorte", location: "Conkal, Mérida", image: "https://ucapital.mx/CUMBRES.jpg" },
];

const GALLERY = [
  { id: "01", url: "https://ucapital.mx/Laja_hero.jpg",     caption: "Laja Residencial" },
  { id: "02", url: "https://ucapital.mx/Estela_Nativa.jpg", caption: "Estela Nativa" },
  { id: "03", url: "https://ucapital.mx/NAIA.jpg",          caption: "NAIA" },
  { id: "04", url: "https://ucapital.mx/Aldoria.jpg",       caption: "Aldoria" },
  { id: "05", url: "https://ucapital.mx/CUMBRES.jpg",       caption: "Cumbres Novonorte" },
  { id: "06", url: "https://ucapital.mx/veta.jpg",          caption: "Veta" },
];

const LOGO_WHITE = "https://ucapital.mx/ucapital_white.png";

/* ============================================================
   LANGUAGE CONTEXT
   ============================================================ */

const LangContext = createContext({ lang: "es", t: window.TRANSLATIONS.es, setLang: () => {} });
const useT = () => useContext(LangContext);

const PrivacyContext = createContext({ open: () => {}, close: () => {} });
const usePrivacy = () => useContext(PrivacyContext);

function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem("ucapital_lang");
      if (stored === "es" || stored === "en") return stored;
    } catch (e) {}
    const navLang = (navigator.language || "es").toLowerCase();
    return navLang.startsWith("en") ? "en" : "es";
  });
  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem("ucapital_lang", l); } catch (e) {}
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = window.TRANSLATIONS[lang];
  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

function LangToggle({ compact = false }) {
  const { lang, setLang } = useT();
  return (
    <div className={`lang ${compact ? "lang--compact" : ""}`} role="group" aria-label="Language">
      <button type="button"
        className={`lang__btn ${lang === "es" ? "is-active" : ""}`}
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}>ES</button>
      <span className="lang__sep" aria-hidden="true">·</span>
      <button type="button"
        className={`lang__btn ${lang === "en" ? "is-active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}>EN</button>
    </div>
  );
}

/* ============================================================
   PRIVACY MODAL
   ============================================================ */

function PrivacyModal({ open, onClose }) {
  const { t } = useT();
  const p = t.privacy;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => { if (ref.current) ref.current.scrollTop = 0; }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const renderP = (para, i) => {
    if (Array.isArray(para)) {
      return para.map((s, j) => renderP(s, `${i}-${j}`));
    }
    if (para.includes("\n")) {
      return (
        <p key={i} className="priv__list">
          {para.split("\n").map((line, k) => (
            <span key={k}>{line}</span>
          ))}
        </p>
      );
    }
    return <p key={i}>{para}</p>;
  };

  return (
    <div className="priv" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="priv-title">
      <div className="priv__panel" onClick={(e) => e.stopPropagation()} ref={ref}>
        <header className="priv__head">
          <div>
            <span className="eyebrow no-rule">— Legal</span>
            <h2 id="priv-title">{p.title}</h2>
            <span className="priv__updated">{p.updated}</span>
          </div>
          <button className="priv__close" onClick={onClose} aria-label={p.close}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </header>
        <div className="priv__body">
          <p className="priv__intro">{p.intro}</p>
          {p.sections.map((s, i) => (
            <section key={i} className="priv__sect">
              <h3>{s.h}</h3>
              {Array.isArray(s.p) ? s.p.map((para, j) => renderP(para, j)) : renderP(s.p, 0)}
            </section>
          ))}
        </div>
        <footer className="priv__foot">
          <button className="btn btn--primary" onClick={onClose}>
            {p.accept} <span className="arrow">→</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTS
   ============================================================ */

function Nav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="shell nav__inner">
        <a href="#top" className="nav__brand">
          <span className="nav__mark">U<span className="dot">·</span>Capital</span>
          <span className="nav__sub">Inmobiliaria</span>
        </a>
        <ul className="nav__links">
          <li><a href="#portafolio">{t.nav.portfolio}</a></li>
          <li><a href="#inspiracion">{t.nav.inspiration}</a></li>
          <li><a href="#nosotros">{t.nav.about}</a></li>
          <li><a href="#contacto">{t.nav.contact}</a></li>
        </ul>
        <div className="nav__right">
          <LangToggle />
          <a href="#contacto" className="nav__cta">
            <span className="pulse"></span>
            {t.nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const { t } = useT();
  return (
    <section className="hero" id="top">
      <div className="hero__bg" style={{ backgroundImage: `url("${HERO_IMAGE}")` }}></div>
      <div className="shell hero__shell">
        <div className="hero__grid">
          <div>
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 className="hero__title">
              {t.hero.title1}<br />
              {t.hero.title2} <span className="it">{t.hero.titleEm}</span><br />
              {t.hero.title3}
            </h1>
            <p className="hero__sub">{t.hero.sub}</p>
            <div className="hero__actions">
              <a href="#contacto" className="btn btn--primary">
                {t.hero.ctaPrimary} <span className="arrow">→</span>
              </a>
              <a href="#portafolio" className="btn btn--ghost">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="hero__meta">
            {t.hero.metaTop}<br />
            <strong>{t.hero.metaBottom}</strong>
          </div>
        </div>
      </div>
      <div className="hero__scroll">
        <span>{t.hero.scroll}</span>
        <span className="line"></span>
      </div>
    </section>
  );
}

function Metrics() {
  const { t } = useT();
  return (
    <section className="metrics reveal">
      <div className="shell">
        <div className="metrics__grid">
          {t.metrics.map((m, i) => (
            <div className="metric" key={i}>
              <div className="metric__num">
                {m.unit && <span className="unit">{m.unit}</span>}
                {m.num}
              </div>
              <div className="metric__label">{m.label}</div>
              <div className="metric__desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t } = useT();
  return (
    <section className="about reveal" id="nosotros">
      <div className="shell">
        <div className="about__grid">
          <div className="about__head">
            <span className="eyebrow">{t.about.eyebrow}</span>
            <h2>
              {t.about.title1} <span className="it">{t.about.titleEm}</span> {t.about.title2}
            </h2>
          </div>
          <div className="about__body">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
            <div className="about__pull">
              <span className="about__quote-mark">“</span>
              <p>{t.about.pull}</p>
            </div>
            <div className="about__pillars">
              {t.about.pillars.map((p, i) => (
                <div className="about__pillar" key={i}>
                  <span className="about__pillar-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="about__pillar-label">{p.label}</span>
                  <span className="about__pillar-desc">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  const { t } = useT();
  const variants = ["a", "b", "c", "d"];
  return (
    <section className="portfolio reveal" id="portafolio">
      <div className="shell">
        <header className="section-head">
          <div className="section-head__left">
            <span className="eyebrow">{t.portfolio.eyebrow}</span>
            <h2>{t.portfolio.title1} <span className="it">{t.portfolio.titleEm}</span> {t.portfolio.title2}</h2>
          </div>
          <p className="section-head__lede">{t.portfolio.lede}</p>
        </header>
        <div className="portfolio__grid">
          {PORTFOLIO.map((p, i) => (
            <a key={p.name} className={`port-card port-card--${variants[i]}`} href="#contacto">
              <div className="port-card__img">
                <span className="port-card__index">{String(i + 1).padStart(2, "0")}</span>
                <img src={p.image} alt={p.name} loading="lazy" />
              </div>
              <div className="port-card__body">
                <div>
                  <div className="port-card__name">{p.name}</div>
                </div>
                <div className="port-card__meta">
                  <span className="port-card__loc">{p.location}</span>
                  <span className="port-card__view">{t.portfolio.view}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { t } = useT();
  return (
    <section className="gallery reveal" id="inspiracion">
      <div className="shell">
        <header className="section-head">
          <div className="section-head__left">
            <span className="eyebrow">{t.gallery.eyebrow}</span>
            <h2>{t.gallery.title1} <span className="it">{t.gallery.titleEm}</span> {t.gallery.title2}</h2>
          </div>
          <p className="section-head__lede">{t.gallery.lede}</p>
        </header>
        <div className="gallery__grid">
          {GALLERY.map(g => (
            <figure key={g.id} className={`gallery__item gallery__item--${g.id}`}>
              <img src={g.url} alt={g.caption} loading="lazy" />
              <figcaption className="gallery__caption">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const { t } = useT();
  const { open: openPrivacy } = usePrivacy();
  const [data, setData] = useState({
    name: "", whatsapp: "", email: "", budget: "", propertyType: "", delivery: "", purpose: "", message: "",
  });
  const [sent, setSent] = useState(false);

  const update = (k) => (e) => setData({ ...data, [k]: e.target.value });
  const setChip = (k, v) => setData({ ...data, [k]: v });

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const firstName = data.name.split(" ")[0];

  return (
    <section className="contact" id="contacto">
      <div className="shell">
        <div className="contact__grid">
          <div className="contact__intro">
            <span className="eyebrow">{t.contact.eyebrow}</span>
            <h2>{t.contact.title1} <span className="it">{t.contact.titleEm}</span> {t.contact.title2}</h2>
            <p>{t.contact.lede}</p>
            <div className="contact__sig">
              <div className="contact__sig-item">
                <span className="l">{t.contact.sigPhone}</span>
                <span className="v it">999 956 2850</span>
              </div>
              <div className="contact__sig-item">
                <span className="l">{t.contact.sigWa}</span>
                <a className="v it" href="https://wa.me/529999562850" target="_blank" rel="noopener">
                  wa.me/529999562850
                </a>
              </div>
              <div className="contact__sig-item">
                <span className="l">{t.contact.sigOffice}</span>
                <span className="v">{t.contact.officeValue}</span>
              </div>
            </div>
          </div>

          {sent ? (
            <div className="form__success">
              <span className="check" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <h3>{t.contact.successTitle}, {firstName || t.contact.successFallback}.</h3>
              <p>{t.contact.successBody}</p>
              <button className="btn btn--ghost" style={{ marginTop: 8 }}
                onClick={() => { setSent(false); setData({ name:"", whatsapp:"", email:"", budget:"", propertyType:"", delivery:"", purpose:"", message:"" }); }}>
                {t.contact.successAgain}
              </button>
            </div>
          ) : (
          <form className="form" onSubmit={submit}>
            <div className="form__row">
              <div className="field">
                <label htmlFor="f-name">{t.contact.labelName} <span className="req">*</span></label>
                <input id="f-name" type="text" required value={data.name} onChange={update("name")} placeholder={t.contact.phName} />
              </div>
              <div className="field">
                <label htmlFor="f-wa">{t.contact.labelWhatsapp} <span className="req">*</span></label>
                <input id="f-wa" type="tel" required value={data.whatsapp} onChange={update("whatsapp")} placeholder={t.contact.phWa} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-email">{t.contact.labelEmail}</label>
              <input id="f-email" type="email" value={data.email} onChange={update("email")} placeholder={t.contact.phEmail} />
            </div>
            <div className="field">
              <label>{t.contact.labelBudget} <span className="req">*</span></label>
              <div className="chips">
                {t.contact.budgets.map(b => (
                  <button type="button" key={b}
                    className={`chip ${data.budget === b ? "is-active" : ""}`}
                    onClick={() => setChip("budget", b)}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>{t.contact.labelType}</label>
              <div className="chips">
                {t.contact.types.map(ty => (
                  <button type="button" key={ty}
                    className={`chip ${data.propertyType === ty ? "is-active" : ""}`}
                    onClick={() => setChip("propertyType", ty)}>
                    {ty}
                  </button>
                ))}
              </div>
            </div>
            <div className="form__row">
              <div className="field">
                <label>{t.contact.labelDelivery}</label>
                <div className="chips">
                  {t.contact.deliveries.map(d => (
                    <button type="button" key={d}
                      className={`chip ${data.delivery === d ? "is-active" : ""}`}
                      onClick={() => setChip("delivery", d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>{t.contact.labelPurpose}</label>
                <div className="chips">
                  {t.contact.purposes.map(p => (
                    <button type="button" key={p}
                      className={`chip ${data.purpose === p ? "is-active" : ""}`}
                      onClick={() => setChip("purpose", p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-msg">{t.contact.labelMessage}</label>
              <input id="f-msg" type="text" value={data.message} onChange={update("message")} placeholder={t.contact.phMessage} />
            </div>
            <div className="form__submit">
              <span className="form__hint">
                {t.contact.hint.split(/(aviso de privacidad|privacy notice)/i).map((part, i) =>
                  /^(aviso de privacidad|privacy notice)$/i.test(part)
                    ? <a key={i} href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }} className="form__hint-link">{part}</a>
                    : <React.Fragment key={i}>{part}</React.Fragment>
                )}
              </span>
              <button type="submit" className="btn btn--primary" disabled={!data.name || !data.whatsapp || !data.budget}>
                {t.contact.submit} <span className="arrow">→</span>
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useT();
  const { open: openPrivacy } = usePrivacy();
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src={LOGO_WHITE} alt="U·Capital Inmobiliaria" />
            <p>{t.footer.blurb}</p>
            <div className="footer__lang">
              <LangToggle />
            </div>
          </div>
          <div className="footer__col">
            <h4>{t.footer.colExplore}</h4>
            <ul>
              <li><a href="#portafolio">{t.footer.linkPortfolio}</a></li>
              <li><a href="#inspiracion">{t.footer.linkInspiration}</a></li>
              <li><a href="#contacto">{t.footer.linkContact}</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{t.footer.colContact}</h4>
            <ul>
              <li><a href="tel:+529999562850" className="footer__phone">999 956 2850</a></li>
              <li><a href="https://wa.me/529999562850" target="_blank" rel="noopener">{t.footer.whatsapp}</a></li>
              <li>{t.footer.location}</li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>{t.footer.colLegal}</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }}>{t.footer.privacy}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); openPrivacy(); }}>{t.footer.terms}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span className="footer__legal">© {new Date().getFullYear()} U·Capital Inmobiliaria. {t.footer.rights}</span>
          <span className="footer__legal">{t.footer.made}</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Reveal-on-scroll
   ============================================================ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ============================================================
   Tweaks
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c9a961",
  "background": "#0a0a0a",
  "headlineStyle": "elegant"
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const root = document.documentElement;
  root.style.setProperty("--accent", t.accent);
  const hex = t.accent.replace("#", "");
  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);
  root.style.setProperty("--accent-dim", `rgba(${r}, ${g}, ${b}, 0.4)`);
  root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty("--bg", t.background);
  root.style.setProperty("--bg-2", t.background === "#0a0a0a" ? "#0f0f0f" : "#181410");

  if (t.headlineStyle === "modern") {
    root.style.setProperty("--serif", '"Tenor Sans", "Cormorant Garamond", serif');
  } else if (t.headlineStyle === "editorial") {
    root.style.setProperty("--serif", '"Bodoni Moda", "Cormorant Garamond", serif');
  } else {
    root.style.setProperty("--serif", '"Cormorant Garamond", "EB Garamond", Georgia, serif');
  }
}

function Tweaks() {
  const { lang } = useT();
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => { applyTweaks(tw); }, [tw]);
  const L = lang === "en"
    ? { color: "Color", accent: "Accent", bg: "Background", type: "Typography", head: "Headlines" }
    : { color: "Color", accent: "Acento", bg: "Fondo", type: "Tipografía", head: "Titulares" };
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label={L.color}>
        <TweakColor label={L.accent} value={tw.accent} onChange={v => setTweak("accent", v)}
          options={["#c9a961", "#b8965e", "#d4b878", "#e8dfd0", "#a87f3e"]} />
        <TweakColor label={L.bg} value={tw.background} onChange={v => setTweak("background", v)}
          options={["#0a0a0a", "#171310", "#0f0d0a", "#1a1612"]} />
      </TweakSection>
      <TweakSection label={L.type}>
        <TweakRadio label={L.head} value={tw.headlineStyle} onChange={v => setTweak("headlineStyle", v)}
          options={[
            { value: "elegant", label: "Cormorant" },
            { value: "editorial", label: "Bodoni" },
            { value: "modern", label: "Tenor" },
          ]} />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ============================================================
   App
   ============================================================ */
function App() {
  useReveal();
  useEffect(() => { applyTweaks(TWEAK_DEFAULTS); }, []);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const privacyCtx = {
    open: () => setPrivacyOpen(true),
    close: () => setPrivacyOpen(false),
  };
  return (
    <LangProvider>
      <PrivacyContext.Provider value={privacyCtx}>
        <Nav />
        <Hero />
        <Metrics />
        <About />
        <Portfolio />
        <Gallery />
        <ContactForm />
        <Footer />
        <Tweaks />
        <PrivacyModal open={privacyOpen} onClose={privacyCtx.close} />
      </PrivacyContext.Provider>
    </LangProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
