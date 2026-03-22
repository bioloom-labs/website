import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

/* ── Per-thread accent palette ──────────────────────────────────────────── */
const ACCENTS = [
  { hex: "#6ee7b7", bg: "rgba(110,231,183,0.08)", glow: "rgba(110,231,183,0.14)" },
  { hex: "#5eead4", bg: "rgba(94,234,212,0.08)",  glow: "rgba(94,234,212,0.13)"  },
  { hex: "#67e8f9", bg: "rgba(103,232,249,0.07)", glow: "rgba(103,232,249,0.12)" },
  { hex: "#86efac", bg: "rgba(134,239,172,0.07)", glow: "rgba(134,239,172,0.12)" },
  { hex: "#34d399", bg: "rgba(52,211,153,0.08)",  glow: "rgba(52,211,153,0.14)"  },
  { hex: "#2dd4bf", bg: "rgba(45,212,191,0.08)",  glow: "rgba(45,212,191,0.13)"  },
  { hex: "#22d3ee", bg: "rgba(34,211,238,0.07)",  glow: "rgba(34,211,238,0.12)"  },
  { hex: "#4ade80", bg: "rgba(74,222,128,0.07)",  glow: "rgba(74,222,128,0.12)"  },
  { hex: "#10b981", bg: "rgba(16,185,129,0.08)",  glow: "rgba(16,185,129,0.14)"  },
  { hex: "#14b8a6", bg: "rgba(20,184,166,0.08)",  glow: "rgba(20,184,166,0.13)"  },
];

/* ── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.055,
      ease: [0.215, 0.61, 0.355, 1.0],
    },
  }),
};

/* ── Research entry row ─────────────────────────────────────────────────── */
function ResearchEntry({ item, index, featured = false }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const link =
    item.link ??
    (item.search
      ? `/publications?search=${encodeURIComponent(item.search)}`
      : null);
  const clickable = Boolean(link) && !item.comingSoon;
  const Wrapper = clickable ? Link : "div";
  const wrapperProps = clickable ? { to: link } : {};

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      custom={Math.min(index, 5)}
      viewport={{ once: true, margin: "-30px" }}
      className={featured ? "col-span-full" : ""}
    >
      <Wrapper
        {...wrapperProps}
        className="group relative block rounded-xl border border-white/[0.055] overflow-hidden transition-colors duration-300"
        style={{ cursor: clickable ? "pointer" : "default", background: "rgba(255,255,255,0.015)" }}
      >
        {/* Hover glow sweep */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 70% at 0% 50%, ${accent.glow}, transparent)`,
          }}
        />

        {/* Left accent strip */}
        <div
          className="absolute left-0 top-[18%] bottom-[18%] w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accent.hex}, transparent)`,
          }}
        />

        <div
          className={[
            "relative flex items-start gap-5 px-6",
            featured ? "py-7 md:py-8" : "py-5",
          ].join(" ")}
        >
          {/* Thread number */}
          <span
            className="flex-shrink-0 font-black font-mono tabular-nums transition-all duration-200 group-hover:opacity-80"
            style={{
              color: accent.hex,
              opacity: 0.4,
              fontSize: featured ? "1.5rem" : "1.125rem",
              lineHeight: 1.2,
              marginTop: "1px",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-1.5">
              <h3
                className={[
                  "font-semibold text-white/90 leading-snug",
                  featured ? "text-xl md:text-2xl" : "text-base",
                ].join(" ")}
              >
                {item.title}
              </h3>
              {item.comingSoon && (
                <span className="flex-shrink-0 text-[9px] font-black tracking-[0.18em] uppercase bg-amber-400/[0.09] text-amber-300/70 px-2.5 py-1 rounded-full border border-amber-400/15">
                  Soon
                </span>
              )}
            </div>
            <p
              className={[
                "text-white/45 leading-relaxed",
                featured ? "text-base max-w-2xl" : "text-sm",
              ].join(" ")}
            >
              {item.text}
            </p>

            {/* Inline CTA for featured */}
            {featured && clickable && (
              <p
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: accent.hex }}
              >
                View publications
                <ArrowRight className="w-4 h-4" />
              </p>
            )}
          </div>

          {/* Arrow for non-featured */}
          {!featured && clickable && (
            <div
              className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 -translate-x-1.5 group-hover:translate-x-0 transition-all duration-200"
              style={{ color: accent.hex }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </Wrapper>
    </motion.div>
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
      className="mt-8 flex items-center gap-2.5 w-fit"
      aria-hidden="true"
    >
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300/70 border border-emerald-500/20"
        style={{ background: "rgba(16,185,129,0.06)" }}
      >
        Scroll to explore our research
        {/* animated chevron */}
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
      [34,  211, 238], // #22d3ee
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

      const vw = video.videoWidth  || 800;
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

  useEffect(() => {
    fetchJSONC("/research.jsonc")
      .then(setItems)
      .catch((e) => setError(e?.message ?? "Failed to load research topics"));
  }, []);

  const [featured, ...rest] = items;

  return (
    <div className="min-h-screen">
      {/* ══ Hero ═══════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-28 min-h-[520px] md:min-h-[620px]">
        {/* Photo background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=85"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay — heavy on left for text, lighter on right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(2,44,34,0.97) 0%, rgba(2,44,34,0.88) 35%, rgba(2,44,34,0.55) 65%, rgba(2,44,34,0.35) 100%)",
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
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[10px] font-black tracking-[0.32em] uppercase text-emerald-400/55 mb-7"
          >
            Research · BioLoom Labs
          </motion.p>

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
            className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed"
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
      <main className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        {/* Section label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-10"
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
                {items.length} areas
              </span>
            )}
          </div>
          <div
            className="mt-3 h-px max-w-xs"
            style={{
              background:
                "linear-gradient(90deg, rgba(16,185,129,0.35), transparent)",
            }}
          />
        </motion.div>

        {error && (
          <p className="mb-8 text-sm text-red-300/80">Error: {error}</p>
        )}

        {/* Featured first entry — full width */}
        {featured && (
          <div className="mb-2">
            <ResearchEntry item={featured} index={0} featured />
          </div>
        )}

        {/* Rest in 2-column grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rest.map((item, i) => (
              <ResearchEntry key={item.id ?? i + 1} item={item} index={i + 1} />
            ))}
          </div>
        )}

        {/* ── Publications CTA ─────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-10"
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
    </div>
  );
}
