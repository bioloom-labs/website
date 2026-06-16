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

/* ── Colour helper ──────────────────────────────────────────────────────── */
function rgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── Per-thread identity ────────────────────────────────────────────────────
   The previous page tinted every card the same green, which read as a flat
   "sea of green" once you scrolled past the hero. Here each thread gets its
   own hue, kicker tag and generative line-art motif. The human-facing threads
   (NCPs, food, health) carry warm tones so a warm band breaks the cool field
   roughly halfway down the page. Unknown ids fall back by index, so the page
   never breaks if the data changes. */
const COOL_FALLBACK = ["#6ee7b7", "#7dd3fc", "#2dd4bf", "#67e8f9", "#a3e635"];
const MOTIF_FALLBACK = ["rings", "contour", "web", "circuit", "bars"];

const THREADS = {
  "macro-ecology":          { hex: "#6ee7b7", tag: "Ecology",       motif: "rings"   },
  "climate-biodiversity":   { hex: "#7dd3fc", tag: "Climate",       motif: "contour" },
  "ncps":                   { hex: "#fbbf24", tag: "People",        motif: "web"     },
  "food":                   { hex: "#fcd34d", tag: "People · Food", motif: "wheat"   },
  "health":                 { hex: "#fca5a5", tag: "People · Health", motif: "leaf"  },
  "next-gen-methods":       { hex: "#67e8f9", tag: "Methods",       motif: "circuit" },
  "agriculture-biodiversity": { hex: "#a3e635", tag: "Land Use",    motif: "furrows" },
  "genetics-biodiversity":  { hex: "#2dd4bf", tag: "Genetics",      motif: "helix"   },
  "opinions":               { hex: "#e7d3a1", tag: "Voice",         motif: "quote"   },
  "open-data":              { hex: "#5eead4", tag: "Open Data",     motif: "bars"    },
};

function threadMeta(item, index) {
  const known = item?.id && THREADS[item.id];
  const hex = known ? known.hex : COOL_FALLBACK[index % COOL_FALLBACK.length];
  const motif = known ? known.motif : MOTIF_FALLBACK[index % MOTIF_FALLBACK.length];
  const tag = known ? known.tag : "Thread";
  return { hex, motif, tag };
}

/* ── Generative line-art motifs ─────────────────────────────────────────────
   Each is deterministic (index-based maths, no randomness) so it never shifts
   between renders. Drawn in a 200×200 box with currentColor; the parent sets
   colour + opacity so the same component works as a faint watermark or a bold
   feature graphic. */
function ThreadMotif({ kind, className = "", style }) {
  const s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  let body = null;

  if (kind === "rings") {
    body = (
      <g {...s}>
        {[16, 32, 50, 70, 92].map((r, i) => (
          <circle key={r} cx="100" cy="100" r={r} opacity={0.95 - i * 0.13} />
        ))}
        {Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 92}
              y1={100 + Math.sin(a) * 92}
              x2={100 + Math.cos(a) * 100}
              y2={100 + Math.sin(a) * 100}
              opacity="0.5"
            />
          );
        })}
        <circle cx="100" cy="100" r="3.5" fill="currentColor" stroke="none" />
      </g>
    );
  } else if (kind === "contour") {
    body = (
      <g {...s}>
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 26 + i * 25;
          const k = i * 0.6;
          const d = `M-6 ${y} C 40 ${y - 16 + k}, 74 ${y + 18 - k}, 110 ${y - 8} S 184 ${y + 14}, 212 ${y - 5}`;
          return <path key={i} d={d} opacity={0.9 - i * 0.09} />;
        })}
      </g>
    );
  } else if (kind === "web") {
    const nodes = [
      [100, 100], [100, 30], [158, 64], [168, 132],
      [122, 172], [58, 160], [34, 96], [60, 44],
    ];
    body = (
      <g {...s}>
        {nodes.slice(1).map((n, i) => (
          <line key={"c" + i} x1="100" y1="100" x2={n[0]} y2={n[1]} opacity="0.4" />
        ))}
        {nodes.slice(1).map((n, i) => {
          const m = nodes[((i + 1) % (nodes.length - 1)) + 1];
          return <line key={"r" + i} x1={n[0]} y1={n[1]} x2={m[0]} y2={m[1]} opacity="0.28" />;
        })}
        {nodes.map((n, i) => (
          <circle
            key={"n" + i}
            cx={n[0]}
            cy={n[1]}
            r={i === 0 ? 5 : 3.6}
            fill="currentColor"
            stroke="none"
            opacity={i === 0 ? 1 : 0.85}
          />
        ))}
      </g>
    );
  } else if (kind === "wheat") {
    body = (
      <g {...s}>
        <path d="M100 186 L100 56" />
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 64 + i * 15;
          const len = 30 - i * 1.5;
          return (
            <g key={i} opacity={0.95 - i * 0.05}>
              <path d={`M100 ${y} C ${100 - len * 0.5} ${y - 2}, ${100 - len} ${y - 12}, ${100 - len} ${y - 20}`} />
              <path d={`M100 ${y} C ${100 + len * 0.5} ${y - 2}, ${100 + len} ${y - 12}, ${100 + len} ${y - 20}`} />
            </g>
          );
        })}
        <path d="M100 60 C 96 50, 96 42, 100 34 C 104 42, 104 50, 100 60 Z" />
      </g>
    );
  } else if (kind === "leaf") {
    body = (
      <g {...s}>
        <path d="M100 26 C 146 58, 154 124, 100 178 C 46 124, 54 58, 100 26 Z" />
        <path d="M100 40 L100 168" />
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 64 + i * 22;
          const spread = 30 - i * 3;
          return (
            <g key={i} opacity={0.7}>
              <path d={`M100 ${y} C ${100 - spread * 0.6} ${y + 4}, ${100 - spread} ${y + 6}, ${100 - spread - 4} ${y + 18}`} />
              <path d={`M100 ${y} C ${100 + spread * 0.6} ${y + 4}, ${100 + spread} ${y + 6}, ${100 + spread + 4} ${y + 18}`} />
            </g>
          );
        })}
      </g>
    );
  } else if (kind === "circuit") {
    const pts = [
      [40, 50], [100, 40], [160, 56], [56, 110],
      [120, 100], [168, 120], [44, 164], [104, 158], [156, 170],
    ];
    body = (
      <g {...s}>
        <path d="M40 50 H100 V100 H168" opacity="0.4" />
        <path d="M160 56 V100" opacity="0.4" />
        <path d="M56 110 V164 H104 V158" opacity="0.4" />
        <path d="M120 100 V158" opacity="0.4" />
        <path d="M104 158 H156 V170" opacity="0.4" />
        {pts.map((p, i) => (
          <rect
            key={i}
            x={p[0] - 4}
            y={p[1] - 4}
            width="8"
            height="8"
            rx="1.5"
            fill={i % 3 === 0 ? "currentColor" : "none"}
            opacity={i % 3 === 0 ? 0.9 : 1}
          />
        ))}
      </g>
    );
  } else if (kind === "furrows") {
    body = (
      <g {...s}>
        <line x1="-6" y1="78" x2="206" y2="78" opacity="0.5" />
        {Array.from({ length: 11 }).map((_, i) => {
          const x = -40 + i * 28;
          return <line key={i} x1={x} y1="200" x2={100} y2="80" opacity={0.65 - Math.abs(i - 5) * 0.06} />;
        })}
        {[110, 140, 174].map((y, i) => (
          <line key={"h" + y} x1={-6 + i * 4} y1={y} x2={206 - i * 4} y2={y} opacity={0.3 - i * 0.06} />
        ))}
      </g>
    );
  } else if (kind === "helix") {
    const A = [];
    const B = [];
    const rungs = [];
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = 20 + t * 160;
      const phase = t * Math.PI * 4;
      const xa = 100 + Math.sin(phase) * 34;
      const xb = 100 - Math.sin(phase) * 34;
      A.push(`${i === 0 ? "M" : "L"}${xa.toFixed(1)} ${y.toFixed(1)}`);
      B.push(`${i === 0 ? "M" : "L"}${xb.toFixed(1)} ${y.toFixed(1)}`);
      if (i % 3 === 0) rungs.push([xa, xb, y]);
    }
    body = (
      <g {...s}>
        <path d={A.join(" ")} />
        <path d={B.join(" ")} />
        {rungs.map((r, i) => (
          <line key={i} x1={r[0]} y1={r[2]} x2={r[1]} y2={r[2]} opacity="0.4" />
        ))}
      </g>
    );
  } else if (kind === "quote") {
    body = (
      <g>
        <text
          x="92"
          y="158"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "210px" }}
        >
          &ldquo;
        </text>
      </g>
    );
  } else {
    // "bars" — data series
    const heights = Array.from({ length: 9 }).map((_, i) => 30 + (Math.sin(i * 1.1) * 0.5 + 0.5) * 110);
    body = (
      <g {...s}>
        <line x1="20" y1="176" x2="186" y2="176" opacity="0.5" />
        {heights.map((h, i) => {
          const x = 26 + i * 18;
          return <line key={i} x1={x} y1="176" x2={x} y2={176 - h} strokeWidth="6" opacity={0.55} />;
        })}
        <path
          d={heights
            .map((h, i) => `${i === 0 ? "M" : "L"}${26 + i * 18} ${176 - h}`)
            .join(" ")}
          opacity="0.9"
        />
        {heights.map((h, i) => (
          <circle key={"d" + i} cx={26 + i * 18} cy={176 - h} r="2.6" fill="currentColor" stroke="none" />
        ))}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      {body}
    </svg>
  );
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

/* ── Featured (flagship) thread — full width ────────────────────────────── */
function FeaturedThread({ item, index }) {
  const { hex, motif, tag } = threadMeta(item, index);
  const link =
    item.link ??
    (item.search ? `/publications?search=${encodeURIComponent(item.search)}` : null);
  const clickable = Boolean(link) && !item.comingSoon;
  const Wrapper = clickable ? Link : "div";
  const wrapperProps = clickable ? { to: link } : {};

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="mb-3"
    >
      <Wrapper
        {...wrapperProps}
        className="group relative grid md:grid-cols-[1.18fr_0.82fr] rounded-[1.75rem] overflow-hidden border transition-colors duration-300"
        style={{
          cursor: clickable ? "pointer" : "default",
          borderColor: rgba(hex, 0.16),
          background: `linear-gradient(135deg, ${rgba(hex, 0.07)}, rgba(255,255,255,0.012) 55%)`,
        }}
      >
        {/* hover sweep */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(60% 120% at 0% 50%, ${rgba(hex, 0.1)}, transparent 60%)` }}
        />

        {/* text panel */}
        <div className="relative p-8 md:p-11 flex flex-col">
          <div className="flex items-center gap-3 mb-7">
            <span
              className="text-[10px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full border"
              style={{ color: hex, borderColor: rgba(hex, 0.28), background: rgba(hex, 0.08) }}
            >
              {tag}
            </span>
            <span className="text-[10px] font-black tracking-[0.24em] uppercase text-white/35">
              Flagship thread
            </span>
          </div>

          <div
            className="font-black tabular-nums mb-3"
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1,
              color: hex,
              opacity: 0.85,
            }}
          >
            01
          </div>

          <h3
            className="text-white leading-[1.08] mb-4"
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(1.7rem, 3.2vw, 2.6rem)",
            }}
          >
            {item.title}
          </h3>

          <p className="text-white/55 text-base md:text-lg leading-relaxed max-w-xl">
            {item.text}
          </p>

          {clickable && (
            <span
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: hex }}
            >
              View publications
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* motif panel */}
        <div
          className="relative hidden md:flex items-center justify-center overflow-hidden"
          style={{ background: rgba(hex, 0.04), borderLeft: `1px solid ${rgba(hex, 0.1)}` }}
        >
          <div
            className="absolute w-72 h-72 rounded-full blur-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-80"
            style={{ background: `radial-gradient(circle, ${rgba(hex, 0.22)}, transparent 65%)` }}
          />
          <ThreadMotif
            kind={motif}
            className="relative w-56 h-56 transition-transform duration-700 group-hover:scale-105"
            style={{ color: hex, opacity: 0.85 }}
          />
        </div>
      </Wrapper>
    </motion.div>
  );
}

/* ── Standard thread card ───────────────────────────────────────────────── */
function ThreadCard({ item, index }) {
  const { hex, motif, tag } = threadMeta(item, index);
  const link =
    item.link ??
    (item.search ? `/publications?search=${encodeURIComponent(item.search)}` : null);
  const clickable = Boolean(link) && !item.comingSoon;
  const Wrapper = clickable ? Link : "div";
  const wrapperProps = clickable ? { to: link } : {};

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      custom={Math.min(index, 4)}
      viewport={{ once: true, margin: "-30px" }}
      className="h-full"
    >
      <Wrapper
        {...wrapperProps}
        className="group relative flex h-full min-h-[208px] flex-col rounded-2xl border overflow-hidden transition-all duration-300"
        style={{
          cursor: clickable ? "pointer" : "default",
          borderColor: "rgba(255,255,255,0.06)",
          background: "linear-gradient(155deg, rgba(255,255,255,0.038), rgba(255,255,255,0.008))",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = rgba(hex, 0.3))}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
      >
        {/* accent corner wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(115% 80% at 100% 0%, ${rgba(hex, 0.09)}, transparent 58%)` }}
        />
        {/* motif watermark */}
        <ThreadMotif
          kind={motif}
          className="absolute -right-7 -bottom-9 w-44 h-44 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3"
          style={{ color: hex, opacity: 0.16 }}
        />
        {/* hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(85% 120% at 0% 0%, ${rgba(hex, 0.1)}, transparent 55%)` }}
        />
        {/* top hairline on hover */}
        <div
          className="absolute left-0 right-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, ${hex}, transparent 70%)` }}
        />

        <div className="relative flex flex-col h-full p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span
              className="text-[9.5px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border"
              style={{ color: hex, borderColor: rgba(hex, 0.26), background: rgba(hex, 0.07) }}
            >
              {tag}
            </span>
            <span
              className="font-black tabular-nums leading-none"
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "1.75rem",
                color: hex,
                opacity: 0.34,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <h3 className="font-semibold text-white/90 text-[1.05rem] leading-snug mb-2 pr-8">
            {item.title}
            {item.comingSoon && (
              <span className="ml-2 align-middle text-[8.5px] font-black tracking-[0.16em] uppercase text-amber-300/70 bg-amber-400/[0.09] px-2 py-0.5 rounded-full border border-amber-400/15">
                Soon
              </span>
            )}
          </h3>

          <p className="text-sm text-white/45 leading-relaxed pr-4">{item.text}</p>

          <div className="mt-auto pt-5">
            {clickable ? (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:gap-2.5"
                style={{ color: hex }}
              >
                Explore thread
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="text-xs font-medium text-white/25">In preparation</span>
            )}
          </div>
        </div>
      </Wrapper>
    </motion.div>
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

  useEffect(() => {
    fetchJSONC("/research.jsonc")
      .then(setItems)
      .catch((e) => setError(e?.message ?? "Failed to load research topics"));
  }, []);

  const [featured, ...rest] = items;
  // Split the remaining threads around the editorial interlude.
  const SPLIT = 4;
  const firstHalf = rest.slice(0, SPLIT);
  const secondHalf = rest.slice(SPLIT);

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
              Ten interlocking lines of enquiry — from global biodiversity
              patterns to the food, health and culture that nature sustains.
              Follow any strand through to its publications.
            </p>
            <div
              className="mt-5 h-px max-w-xs"
              style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.35), transparent)" }}
            />
          </motion.div>

          {error && <p className="mb-8 text-sm text-red-300/80">Error: {error}</p>}

          {/* Featured flagship thread */}
          {featured && <FeaturedThread item={featured} index={0} />}

          {/* First batch */}
          {firstHalf.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {firstHalf.map((item, i) => (
                <ThreadCard key={item.id ?? i + 1} item={item} index={i + 1} />
              ))}
            </div>
          )}

          {/* Editorial interlude */}
          {rest.length > SPLIT && <Interlude />}

          {/* Second batch */}
          {secondHalf.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {secondHalf.map((item, i) => (
                <ThreadCard key={item.id ?? i + 1 + SPLIT} item={item} index={i + 1 + SPLIT} />
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
    </div>
  );
}
