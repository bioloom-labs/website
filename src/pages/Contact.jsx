import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Github } from "lucide-react";
import useSeo from "../utils/useSeo.js";
import { ROUTES } from "../utils/seoMeta.js";
import ThreadRule from "../components/ThreadRule.jsx";

/* ── Lab details ────────────────────────────────────────────────────────── */
const EMAIL = "s.pironon@qmul.ac.uk";
const ADDRESS = [
  "Room 5.03, G.E. Fogg Building",
  "Queen Mary University of London",
  "Mile End Road",
  "London E1 4DQ",
  "United Kingdom",
];
const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1241.230786325812!2d-0.0424528!3d51.5230934!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761d28e6df513b%3A0x18bbe65eb28ce876!2sG.E.%20Fogg%20Building!5e0!3m2!1sen!2suk!4v1762772892075!5m2!1sen!2suk";
const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent("G.E. Fogg Building, Queen Mary University of London, Mile End Road, London E1 4DQ");

/* Each kind of enquiry carries its own hue, the same set the research threads
   and news tags use, so the form reads as part of the same loom. The topic
   only sets the subject line of the email draft. */
const TOPICS = [
  { id: "collaboration", label: "A collaboration", subject: "Collaboration enquiry", hex: "#7dd3fc" },
  { id: "joining", label: "Joining the lab", subject: "Enquiry about joining the lab", hex: "#a3e635" },
  { id: "visit", label: "Visiting or giving a talk", subject: "Visit / talk enquiry", hex: "#fcd34d" },
  { id: "press", label: "Press", subject: "Press enquiry", hex: "#fca5a5" },
  { id: "other", label: "Something else", subject: "General enquiry", hex: "#6ee7b7" },
];
const DEFAULT_HEX = "#6ee7b7";

/* ── Icons ──────────────────────────────────────────────────────────────── */
function ArrowUpRight({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 13L13 3M13 3H6M13 3v7" />
    </svg>
  );
}

function XLogoIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
      <path d="M714.163 519.284L1160.89 0H1056.7L666.754 450.887L361.82 0H0L466.076 681.821L0 1226.37H104.19L515.941 752.678L838.18 1226.37H1200L714.137 519.284H714.163ZM571.152 689.908L521.28 618.782L142.107 80.126H310.005L609.627 508.444L659.498 579.57L1068.04 1146.24H900.142L571.152 689.934V689.908Z" />
    </svg>
  );
}

/* ── Colour helper ──────────────────────────────────────────────────────── */
function rgba(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/* ── Animation ──────────────────────────────────────────────────────────── */
const EASE = [0.215, 0.61, 0.355, 1];
const rise = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.65, delay, ease: EASE },
});

/* ── Atmospheric backdrop, sibling to the Research and News pages' ──────── */
function ContactBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-40 -left-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.14), transparent 62%)" }}
      />
      <div
        className="absolute top-[22%] -right-48 h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.10), transparent 62%)" }}
      />
      <div
        className="absolute bottom-[-6%] left-[24%] h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(125,211,252,0.08), transparent 62%)" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="contact-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#contact-grain)" />
      </svg>
    </div>
  );
}

/* ── Panel chrome shared by the three blocks ────────────────────────────── */
const panelStyle = {
  borderColor: "rgba(255,255,255,0.07)",
  background: "linear-gradient(155deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))",
};
const headingStyle = { fontFamily: "'DM Serif Display', Georgia, serif" };
const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/25 outline-none transition-colors duration-200 focus:border-brand-300/60 focus:ring-2 focus:ring-brand-300/20";

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-white/55">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Copy the address to the clipboard; confirms in place ───────────────── */
function CopyEmail() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      /* clipboard unavailable — the address is still on screen to select */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Email address copied" : "Copy email address"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ── The letter ─────────────────────────────────────────────────────────── */
function WriteToUs() {
  const [topic, setTopic] = useState(null);
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState("");

  const chosen = TOPICS.find((t) => t.id === topic);
  const hex = chosen?.hex ?? DEFAULT_HEX;

  const handleSend = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `${chosen?.subject ?? "General enquiry"}${name ? ` from ${name}` : ""}`
    );
    const body = encodeURIComponent(
      [message, "", "--", `Name: ${name || "N/A"}`, `Email: ${fromEmail || "N/A"}`].join("\n")
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <motion.form
      {...rise(0.3)}
      onSubmit={handleSend}
      className="relative overflow-hidden rounded-3xl border p-7 md:p-9"
      style={panelStyle}
    >
      {/* hairline that takes the chosen topic's colour */}
      <div
        className="absolute left-0 right-0 top-0 h-px transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${hex}, transparent 70%)` }}
      />

      <h2 className="text-2xl text-white md:text-3xl" style={headingStyle}>
        Write to us
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">
        Tell us what you have in mind. Sending opens a draft in your email app, addressed to the lab.
      </p>

      <fieldset className="mt-7">
        <legend className="text-xs font-semibold text-white/55">What is it about?</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = t.id === topic;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTopic(active ? null : t.id)}
                className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200"
                style={
                  active
                    ? { color: t.hex, borderColor: rgba(t.hex, 0.45), background: rgba(t.hex, 0.1) }
                    : {
                        color: "rgba(255,255,255,0.55)",
                        borderColor: "rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.03)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.borderColor = rgba(t.hex, 0.35);
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Your name">
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field id="contact-email" label="Your email">
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field id="contact-message" label="Message">
          <textarea
            id="contact-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </Field>
      </div>

      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="btn-primary justify-center">
          Send via email
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>
            Or write directly to{" "}
            <a href={`mailto:${EMAIL}`} className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline">
              {EMAIL}
            </a>
          </span>
          <CopyEmail />
        </div>
      </div>
    </motion.form>
  );
}

/* ── Where the lab is ───────────────────────────────────────────────────── */
function FindUs() {
  return (
    <motion.div {...rise(0.4)} className="flex h-full flex-col overflow-hidden rounded-3xl border" style={panelStyle}>
      <div className="relative min-h-52 flex-1">
        <iframe
          src={MAP_EMBED}
          title="Map showing the G.E. Fogg Building at Queen Mary University of London"
          className="absolute inset-0 h-full w-full"
          style={{
            border: 0,
            // Google's light map inverted and hue-rotated back, so it sits in the page's dark green
            filter: "invert(0.92) hue-rotate(180deg) saturate(0.55) brightness(0.9) contrast(1.05)",
          }}
          loading="lazy"
          allowFullScreen=""
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="p-7">
        <h2 className="text-2xl text-white" style={headingStyle}>
          Find us
        </h2>
        <address className="mt-3 text-sm not-italic leading-relaxed text-white/65">
          {ADDRESS.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-2.5"
          style={{ color: "#fcd34d" }}
        >
          Get directions
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.div>
  );
}

/* ── Follow ─────────────────────────────────────────────────────────────── */
const SOCIALS = [
  { href: "https://x.com/pirononlab", name: "X", handle: "@pirononlab", note: "News and papers from the lab", Icon: XLogoIcon, hex: "#7dd3fc" },
  { href: "https://github.com/bioloom-labs", name: "GitHub", handle: "bioloom-labs", note: "Code and data", Icon: Github, hex: "#c4b5fd" },
];

function FollowUs() {
  return (
    <motion.div
      {...rise(0.5)}
      className="flex flex-col gap-5 rounded-3xl border p-7 md:flex-row md:items-center md:justify-between"
      style={panelStyle}
    >
      <h2 className="text-2xl text-white" style={headingStyle}>
        Follow the lab
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIALS.map(({ href, name, handle, note, Icon, hex }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-200 md:min-w-[16rem]"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = rgba(hex, 0.4))}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
              style={{ color: hex, borderColor: rgba(hex, 0.3), background: rgba(hex, 0.08) }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
                {name}
                <ArrowUpRight className="h-3 w-3 text-white/35 transition-colors group-hover:text-white/70" />
              </span>
              <span className="block truncate text-xs text-white/50">{handle}</span>
              <span className="mt-1 block text-xs text-white/35">{note}</span>
            </span>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Contact() {
  useSeo(ROUTES["/contact"]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ContactBackdrop />

      {/* ══ Hero ═══════════════════════════════════════════════════════════ */}
      <header className="relative mx-auto max-w-7xl px-6 pb-10 pt-20 md:px-10 md:pb-14 md:pt-28">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300/80"
        >
          Contact
        </motion.span>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="mt-6 text-white"
          style={{
            ...headingStyle,
            fontSize: "clamp(2.6rem, 7vw, 5.6rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.015em",
          }}
        >
          Start a thread
        </motion.h1>

        <ThreadRule />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.22, ease: "easeOut" }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-emerald-50/80 md:text-xl"
        >
          We are a small and new lab group constantly developing new ideas and looking for new
          perspectives. We will answer your email, we value collaboration, and we love hosting guest
          speakers and lunches where outside-the-box ideas are never too outside-the-box.
        </motion.p>
      </header>

      {/* ══ Panels ═════════════════════════════════════════════════════════ */}
      <main className="relative mx-auto max-w-7xl px-6 pb-28 md:px-10">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <WriteToUs />
          </div>
          <div className="lg:col-span-5">
            <FindUs />
          </div>
          <div className="lg:col-span-12">
            <FollowUs />
          </div>
        </div>
      </main>
    </div>
  );
}
