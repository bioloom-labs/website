import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { fetchJSONC } from "../utils/jsonc.js";

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
    >
      <path d="M3 13L13 3M13 3H6M13 3v7" />
    </svg>
  );
}

function ArrowRight({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  );
}

/* ── Colour helper ──────────────────────────────────────────────────────── */
function rgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── Per-thread accent hue ──────────────────────────────────────────────────
   Each thread carries its own colour so the page doesn't read as a flat
   "sea of green". Human-facing threads (food, health) take warm tones; the
   rest stay cool. Unknown ids fall back by index so the page never breaks if
   the data changes. The thread's chip label lives in research.jsonc (tag). */
const HUE = {
  "macroecology":        "#6ee7b7",
  "food":                "#fcd34d",
  "health":              "#fca5a5",
  "people-biodiversity": "#7dd3fc",
  "species-use-data":    "#5eead4",
  "species-used":        "#a3e635",
};
const HUE_FALLBACK = ["#6ee7b7", "#7dd3fc", "#fcd34d", "#fca5a5", "#a3e635", "#5eead4"];

function hueFor(item, index = 0) {
  return (item?.id && HUE[item.id]) || HUE_FALLBACK[index % HUE_FALLBACK.length];
}

/* ── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.05,
      ease: [0.215, 0.61, 0.355, 1.0],
    },
  }),
};

/* ── Thread card — image, title, teaser; opens the detail window ────────── */
function ThreadCard({ item, index, onOpen }) {
  const hex = hueFor(item, index);

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(index)}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      custom={Math.min(index, 4)}
      viewport={{ once: true, margin: "-30px" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "linear-gradient(155deg, rgba(255,255,255,0.04), rgba(255,255,255,0.008))",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = rgba(hex, 0.32))}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={item.image}
          alt={item.alt || ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
        />
        {/* legibility + blend gradient into the card body */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(2,17,13,0.95), rgba(2,17,13,0.15) 48%, transparent 72%)",
          }}
        />
        {/* tag chip */}
        <span
          className="absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em] backdrop-blur-sm"
          style={{ color: hex, borderColor: rgba(hex, 0.32), background: "rgba(0,0,0,0.38)" }}
        >
          {item.tag}
        </span>
      </div>

      {/* text */}
      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        {/* top hairline on hover */}
        <div
          className="absolute left-0 right-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, ${hex}, transparent 70%)` }}
        />
        <h3
          className="mb-2 leading-snug text-white/90"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.2rem" }}
        >
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed text-white/45">{item.teaser}</p>
        <span
          className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold opacity-70 transition-all duration-200 group-hover:gap-2.5 group-hover:opacity-100"
          style={{ color: hex }}
        >
          Read more
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.button>
  );
}

/* ── Research detail window ─────────────────────────────────────────────── */
function ResearchModal({ item, index = 0, onClose }) {
  const hex = item ? hueFor(item, index) : "#6ee7b7";
  const papers = item?.papers ?? [];
  const search = item?.search;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border md:grid-cols-2"
            style={{
              maxHeight: "88vh",
              borderColor: rgba(hex, 0.22),
              background: "linear-gradient(160deg, #0a1f18, #061410)",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
          >
            {/* image side */}
            <div className="relative h-52 md:h-auto md:min-h-[460px]">
              <img
                src={item.image}
                alt={item.alt || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* fade the bottom (mobile) and the right edge (desktop) into the panel */}
              <div
                className="absolute inset-0 md:hidden"
                style={{ background: "linear-gradient(to top, #0a1f18, transparent 55%)" }}
              />
              <div
                className="absolute inset-0 hidden md:block"
                style={{ background: "linear-gradient(to right, transparent 58%, #0a1f18)" }}
              />
              {item.credit?.name && (
                <a
                  href={item.credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2.5 left-3 text-[10px] text-white/55 transition-colors hover:text-white/85"
                >
                  Photo · {item.credit.name} / Unsplash
                </a>
              )}
            </div>

            {/* content side */}
            <div
              className="relative flex flex-col overflow-y-auto p-7 md:p-9"
              style={{ maxHeight: "88vh" }}
            >
              {/* close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>

              <span
                className="mb-4 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em]"
                style={{ color: hex, borderColor: rgba(hex, 0.3), background: rgba(hex, 0.08) }}
              >
                {item.tag}
              </span>

              <h2
                className="mb-5 pr-8 leading-[1.1] text-white"
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                }}
              >
                {item.title}
              </h2>

              <div className="space-y-3.5">
                {(item.body ?? []).map((para, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed text-white/65">
                    {para}
                  </p>
                ))}
              </div>

              {/* papers / related publications */}
              <div className="mt-7 border-t border-white/10 pt-6">
                <p
                  className="mb-3 text-[10px] font-black uppercase tracking-[0.22em]"
                  style={{ color: hex }}
                >
                  Selected publications
                </p>

                {papers.length > 0 ? (
                  <ul className="space-y-3">
                    {papers.map((p, i) => (
                      <li key={i}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="group/p block"
                        >
                          <span className="text-sm text-white/85 transition-colors group-hover/p:text-white">
                            {p.title}
                          </span>
                          {(p.authors || p.year) && (
                            <span className="mt-0.5 block text-xs text-white/40">
                              {[p.authors, p.year].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-white/35">
                    Selected papers will be added here as they are published.
                  </p>
                )}

                {search && (
                  <Link
                    to={`/publications?search=${encodeURIComponent(search)}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-2.5"
                    style={{ color: hex }}
                  >
                    Browse related publications
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Editorial interlude — breaks the list rhythm halfway down ──────────── */
function Interlude() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="relative my-3 overflow-hidden rounded-[1.75rem] border border-white/[0.06] px-8 py-12 md:px-14 md:py-16"
      style={{
        background:
          "linear-gradient(120deg, rgba(251,191,36,0.06), rgba(16,185,129,0.05) 55%, rgba(125,211,252,0.05))",
      }}
    >
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(80% 140% at 50% 0%, rgba(255,255,255,0.04), transparent 60%)" }}
      />
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-10 bg-white/15" />
          <span className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald-300/55">
            One loom
          </span>
          <span className="h-px w-10 bg-white/15" />
        </div>
        <p
          className="text-white/85 leading-[1.3]"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.45rem, 3.2vw, 2.2rem)",
          }}
        >
          Each thread is a single strand. Read together, they trace how
          biodiversity and people are woven into one another &mdash; and what
          unravels when a strand is pulled.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Atmospheric backdrop for the threads section ───────────────────────── */
function ThreadsBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* multi-hue depth glows — deliberately NOT all green */}
      <div
        className="absolute -top-32 -left-40 w-[42rem] h-[42rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.14), transparent 62%)" }}
      />
      <div
        className="absolute top-[34%] -right-48 w-[40rem] h-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.09), transparent 62%)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[38rem] h-[38rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(125,211,252,0.08), transparent 62%)" }}
      />

      {/* faint contour pattern */}
      <svg
        className="absolute inset-x-0 top-0 w-full opacity-[0.05]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="#6ee7b7"
        strokeWidth="1"
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 40 + i * 56;
          return (
            <path
              key={i}
              d={`M-20 ${y} C 220 ${y - 46}, 420 ${y + 40}, 640 ${y - 12} S 1040 ${y + 38}, 1220 ${y - 18}`}
            />
          );
        })}
      </svg>

      {/* grain overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay">
        <filter id="research-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#research-grain)" />
      </svg>
    </div>
  );
}

/* ── Scroll hint pill ───────────────────────────────────────────────────── */
function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY <= 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
      transition={{ duration: visible ? 0.5 : 0.3, delay: visible ? 0.55 : 0, ease: "easeOut" }}
      className="pointer-events-none fixed bottom-6 inset-x-0 flex justify-center z-40"
      aria-hidden="true"
    >
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300/70 border border-emerald-500/20"
        style={{ background: "rgba(16,185,129,0.06)" }}
      >
        Scroll to explore our research
        <motion.svg
          viewBox="0 0 12 12"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M2 4l4 4 4-4" />
        </motion.svg>
      </span>
    </motion.div>
  );
}

/* ── Canvas-keyed handwriting video ─────────────────────────────────────── */
// Renders the .mov frame-by-frame: white → transparent, dark ink → gradient.
// This is the only reliable way to get clean alpha from a white-bg screen recording.
function FabricOfLifeVideo() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Gradient stops: emerald → teal → sky
    const STOPS = [
      [110, 231, 183], // #6ee7b7
      [34, 211, 238], // #22d3ee
      [103, 232, 249], // #67e8f9
    ];

    function lerpCh(a, b, t) { return Math.round(a + (b - a) * t); }

    function gradientAt(t) {
      if (t < 0.5) {
        const s = t * 2;
        return [lerpCh(STOPS[0][0], STOPS[1][0], s), lerpCh(STOPS[0][1], STOPS[1][1], s), lerpCh(STOPS[0][2], STOPS[1][2], s)];
      }
      const s = (t - 0.5) * 2;
      return [lerpCh(STOPS[1][0], STOPS[2][0], s), lerpCh(STOPS[1][1], STOPS[2][1], s), lerpCh(STOPS[1][2], STOPS[2][2], s)];
    }

    function render() {
      if (video.readyState < 2) { rafRef.current = requestAnimationFrame(render); return; }

      const vw = video.videoWidth || 800;
      const vh = video.videoHeight || 240;
      // Crop 3% from each horizontal edge to remove recording-frame border lines
      const CROP_X = Math.round(vw * 0.03);
      const CROP_Y = Math.round(vh * 0.02);
      const cw = vw - CROP_X * 2;
      const ch = vh - CROP_Y * 2;
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

      // Draw only the inner region of the video (skip the border artifacts)
      ctx.drawImage(video, CROP_X, CROP_Y, cw, ch, 0, 0, cw, ch);
      const img = ctx.getImageData(0, 0, cw, ch);
      const d = img.data;
      const THRESHOLD = 210; // pixels brighter than this → transparent

      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (gray >= THRESHOLD) {
          d[i + 3] = 0;
        } else {
          const x = (i / 4) % cw;
          const [r, g, b] = gradientAt(x / cw);
          d[i] = r; d[i + 1] = g; d[i + 2] = b;
          // soft alpha: fully opaque in the darkest ink, fading at edges
          d[i + 3] = Math.round(((THRESHOLD - gray) / THRESHOLD) * 255);
        }
      }

      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(render);
    }

    function begin() {
      render();
      video.play().catch(() => {});
    }

    function start() {
      // On iOS Safari, seeking currentTime is async — wait for seeked before
      // rendering to avoid a flash of a partial/wrong frame at startup.
      if (video.currentTime === 0) {
        begin();
      } else {
        video.addEventListener("seeked", begin, { once: true });
        video.currentTime = 0;
      }
    }

    // Safari may already have the video buffered (readyState ≥ 2) before the
    // listener is attached, so check immediately and fall back to the event.
    if (video.readyState >= 2) {
      // Force a seek to frame 0 so iOS doesn't flash a mid-stream frame
      video.addEventListener("seeked", begin, { once: true });
      video.currentTime = 0;
    } else {
      video.addEventListener("loadeddata", start, { once: true });
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <span style={{ display: "inline-block", verticalAlign: "bottom", height: "1.65em", border: "none", outline: "none" }}>
      <video ref={videoRef} src="/images/research/fabric-of-life.mov" muted playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} aria-label="fabric of life" style={{ display: "block", height: "100%", width: "auto", border: "none", outline: "none" }} />
    </span>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function Research() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetchJSONC("/research.jsonc")
      .then(setItems)
      .catch((e) => setError(e?.message ?? "Failed to load research topics"));
  }, []);

  const openThread = useCallback((i) => setActiveIndex(i), []);
  const closeThread = useCallback(() => setActiveIndex(null), []);

  // While the detail window is open, lock background scroll and close on Escape.
  useEffect(() => {
    if (activeIndex == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setActiveIndex(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIndex]);

  // Split the threads around the editorial interlude.
  const SPLIT = 3;
  const firstHalf = items.slice(0, SPLIT);
  const secondHalf = items.slice(SPLIT);
  const active = activeIndex != null ? items[activeIndex] : null;

  return (
    <div className="min-h-screen">
      {/* ══ Hero ═══════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-28 min-h-[520px] md:min-h-[620px]">
        {/* Photo background */}
        <div className="absolute inset-0">
          <img
            src="/images/research/DarioEndara_L.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay — heavy on left for text, lighter on right (75% strength) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(2,44,34,0.7275) 0%, rgba(2,44,34,0.66) 35%, rgba(2,44,34,0.4125) 65%, rgba(2,44,34,0.2625) 100%)",
            }}
          />
          {/* Bottom fade into page */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{
              background: "linear-gradient(to top, rgba(2,44,34,1), transparent)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          {/* Display heading */}
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.215, 0.61, 0.355, 1.0] }}
            className="text-white mb-8"
            style={{
              fontFamily: "'DM Serif Display', 'Georgia', serif",
              fontSize: "clamp(2.9rem, 8vw, 6.8rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.015em",
            }}
          >
            Weaving the
            <br />
            <FabricOfLifeVideo />
          </motion.h1>

          {/* Lead */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: "easeOut" }}
            className="text-lg md:text-xl text-emerald-50/90 max-w-xl leading-relaxed"
          >
            We map where biodiversity thrives, how it is changing, and what it
            means for people — weaving ecology, data science, and human
            wellbeing into one coherent picture.
          </motion.p>

          {/* Scroll hint pill */}
          <ScrollHint />

          {/* Animated rule */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.38, ease: [0.215, 0.61, 0.355, 1.0] }}
            className="mt-12 h-px origin-left max-w-2xl"
            style={{
              background:
                "linear-gradient(90deg, rgba(16,185,129,0.45), rgba(20,184,166,0.2), transparent)",
            }}
          />
        </div>
      </header>

      {/* ══ Research threads ═══════════════════════════════════════════════ */}
      <section className="relative">
        <ThreadsBackdrop />

        <main className="relative max-w-7xl mx-auto px-6 md:px-10 pb-24">
          {/* Section label */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-10 pt-4"
          >
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2
                className="text-3xl md:text-4xl font-normal text-white"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Active Research Threads
              </h2>
              {items.length > 0 && (
                <span className="text-sm font-mono text-white/30">
                  {String(items.length).padStart(2, "0")} areas
                </span>
              )}
            </div>
            <p className="mt-3 text-white/45 max-w-2xl leading-relaxed">
              Six interlocking lines of enquiry — from global biodiversity
              patterns to the food, health and species that nature sustains.
              Open any thread to read more.
            </p>
            <div
              className="mt-5 h-px max-w-xs"
              style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.35), transparent)" }}
            />
          </motion.div>

          {error && <p className="mb-8 text-sm text-red-300/80">Error: {error}</p>}

          {/* First batch */}
          {firstHalf.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {firstHalf.map((item, i) => (
                <ThreadCard key={item.id ?? i} item={item} index={i} onOpen={openThread} />
              ))}
            </div>
          )}

          {/* Editorial interlude — the quote */}
          {items.length > SPLIT && <Interlude />}

          {/* Second batch */}
          {secondHalf.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {secondHalf.map((item, i) => (
                <ThreadCard
                  key={item.id ?? i + SPLIT}
                  item={item}
                  index={i + SPLIT}
                  onOpen={openThread}
                />
              ))}
            </div>
          )}

          {/* ── Publications CTA ─────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-12"
          >
            <Link
              to="/publications"
              className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-white/[0.055] px-8 py-8 overflow-hidden transition-all duration-300 hover:border-emerald-500/25"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(6,78,59,0.12))",
              }}
            >
              {/* Hover sweep */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 100% at 0% 50%, rgba(16,185,129,0.07), transparent)",
                }}
              />
              <div className="relative">
                <p className="text-[9px] font-black tracking-[0.28em] uppercase text-emerald-400/55 mb-2">
                  Publications
                </p>
                <h3
                  className="text-2xl md:text-3xl text-white font-normal"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Browse the full research catalogue
                </h3>
                <p className="mt-2 text-sm text-white/40 max-w-md leading-relaxed">
                  Peer-reviewed papers, data releases, and opinion pieces from
                  BioLoom Labs, indexed and searchable by research thread.
                </p>
              </div>
              <span
                className="relative flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border transition-all duration-200 group-hover:bg-emerald-500/10"
                style={{
                  color: "#6ee7b7",
                  borderColor: "rgba(110,231,183,0.2)",
                  background: "rgba(110,231,183,0.05)",
                }}
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </motion.div>
        </main>
      </section>

      <ResearchModal item={active} index={activeIndex ?? 0} onClose={closeThread} />
    </div>
  );
}
