import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll } from "framer-motion";
import { ArrowUpRight, ChevronRight, X } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";
import useSeo from "../utils/useSeo.js";
import { ROUTES } from "../utils/seoMeta.js";

/* ════════════════════════════════════════════════════════════════════════
   News — a timeline strung on a single thread, latest first.
   One entry per row. The thread unspools from a ball of yarn, winds down the
   left rail and curls into a spiral at each entry, with a lit run riding along
   it as the page scrolls. Each entry's pictures sit on a flip board of tiles
   that keep turning over while they are on screen.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Dates ──────────────────────────────────────────────────────────────── */
function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtLong(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtBoard(d) {
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(".", "");
}

/* ── Colour ─────────────────────────────────────────────────────────────── */
function rgba(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/* Each kind of dispatch carries its own hue so the page doesn't read as a
   flat sea of green. Tags not listed here fall back by position, so adding a
   new tag to news.jsonc never breaks the page. */
const ACCENT = {
  "publication": "#7dd3fc",
  "preprint": "#7dd3fc",
  "open data": "#5eead4",
  "dataset": "#5eead4",
  "talk": "#fcd34d",
  "event": "#fcd34d",
  "award": "#a3e635",
  "press": "#fca5a5",
  "fieldwork": "#6ee7b7",
  "people": "#c4b5fd",
};
const ACCENT_FALLBACK = ["#6ee7b7", "#7dd3fc", "#fcd34d", "#a3e635", "#5eead4", "#fca5a5"];

function accentFor(item, index = 0) {
  const key = (item?.tag || "").trim().toLowerCase();
  return ACCENT[key] || ACCENT_FALLBACK[index % ACCENT_FALLBACK.length];
}

/* ── Data ───────────────────────────────────────────────────────────────────
   news.jsonc is hand-edited, so accept the loose shapes it may arrive in:
   `image` (one string) as well as `images`, `link` as a bare URL string as
   well as { url, label }, and `text` standing in for a missing `body`. */
function normalise(item, idx) {
  const dateObj = parseDate(item.date);
  const rawImages = item.images ?? (item.image ? [item.image] : []);
  const images = (Array.isArray(rawImages) ? rawImages : [])
    .map((img) => (typeof img === "string" ? { src: img } : img))
    .filter((img) => img && img.src);

  const link =
    typeof item.link === "string"
      ? item.link && item.link !== "#"
        ? { url: item.link, label: "Read more" }
        : null
      : item.link?.url
        ? { label: "Read more", ...item.link }
        : null;

  const body = Array.isArray(item.body) && item.body.length ? item.body : item.text ? [item.text] : [];

  return {
    ...item,
    id: item.id || `${item.title || "news"}-${idx}`,
    dateObj,
    images,
    link,
    body,
    teaser: item.text || body[0] || "",
  };
}

/* Strictly latest first. Anything dated ahead of today is still "latest", and
   is flagged as upcoming rather than pulled out into its own group. */
function orderItems(list) {
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  return list
    .map(normalise)
    .map((e) => ({ ...e, upcoming: e.dateObj ? e.dateObj >= todayMid : false }))
    .sort((a, b) => {
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return b.dateObj - a.dateObj;
    });
}

/* ── Motion preference ──────────────────────────────────────────────────── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/* ── The thread ─────────────────────────────────────────────────────────────
   A serpentine down the rail that curls into a spiral at each entry. Both the
   path and the curls are generated from the measured row positions, so the
   thread stays pinned to the entries at any width or entry count. */
function serpentine(height, nodes, cx, amp, startX) {
  if (!height || !nodes.length) return "";
  let d = `M ${startX} 0`;
  let prev = 0;
  nodes.forEach((y, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const a = prev + (y - prev) * 0.34;
    const b = prev + (y - prev) * 0.74;
    d += ` C ${cx + amp * dir} ${a}, ${cx - amp * dir} ${b}, ${cx} ${y}`;
    prev = y;
  });
  // Run the thread off the bottom of the last entry rather than stopping dead.
  d += ` C ${cx + amp} ${prev + (height - prev) * 0.4}, ${cx - amp} ${prev + (height - prev) * 0.75}, ${cx} ${height}`;
  return d;
}

function spiral(cx, cy, r0, r1, turns, steps = 44) {
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = r0 + (r1 - r0) * t;
    const x = (cx + Math.cos(angle) * r).toFixed(2);
    const y = (cy + Math.sin(angle) * r).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

/* The ball of yarn the whole timeline unspools from. Its art is cropped so the
   thread leaves the right edge at BALL_EXIT_Y down; the ball is placed so that
   point sits exactly on the rail's origin, where the thread path begins. */
const BALL_SCALE = 0.82; // of the rail's width
const BALL_ASPECT = 756 / 768; // the cropped art's width / height
const BALL_EXIT_Y = 0.6824;

function ballBox(railWidth) {
  const w = railWidth * BALL_SCALE;
  const h = w / BALL_ASPECT;
  return { w, h, top: -h * BALL_EXIT_Y };
}

/* The thread fills in behind the reader, and the lit end sits wherever the
   middle of the window is. Arc length doesn't run evenly against height — the
   thread wanders more in some stretches than others — so the path is sampled
   once into a height-to-length table and the fill is read off that. Without it
   the lit end would drift from the centre line wherever the thread meanders. */
function fractionAtY(samples, y) {
  const last = samples.length - 1;
  if (last < 1 || y <= samples[0]) return 0;
  if (y >= samples[last]) return 1;
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid] <= y) lo = mid;
    else hi = mid;
  }
  const span = samples[hi] - samples[lo] || 1;
  return (lo + (y - samples[lo]) / span) / last;
}

function ThreadRail({ width, height, nodes }) {
  const cx = width * 0.38;
  const amp = Math.max(10, width * 0.3);
  const path = width && height ? serpentine(height, nodes.map((n) => n.y), cx, amp, ballBox(width).w) : "";
  const curlR = Math.min(17, width * 0.27);

  const litRef = useRef(null);
  const fill = useMotionValue(0);
  const [samples, setSamples] = useState([]);
  const { scrollY } = useScroll();

  useLayoutEffect(() => {
    const el = litRef.current;
    if (!path || !el) {
      setSamples([]);
      return;
    }
    const total = el.getTotalLength();
    const STEPS = 240;
    setSamples(Array.from({ length: STEPS + 1 }, (_, i) => el.getPointAtLength((i / STEPS) * total).y));
  }, [path]);

  useEffect(() => {
    const apply = () => {
      const svg = litRef.current?.ownerSVGElement;
      if (!svg || samples.length < 2) return;
      const rect = svg.getBoundingClientRect();
      // the middle of the window, in the rail's own coordinates
      const middle = window.innerHeight / 2 - rect.top;

      // The middle of the window stops short of the end of the thread — the
      // page runs out of scroll first, with the footer still below — so the
      // tail would never light. Over the last run of scroll, ease the fill on
      // from the middle to the end of the thread instead. Smoothstepped, so it
      // joins the middle-tracking without a kink and arrives exactly at the
      // bottom of the page.
      const doc = document.documentElement;
      const left = Math.max(0, doc.scrollHeight - window.innerHeight - window.scrollY);
      const runout = window.innerHeight * 0.5;
      const t = runout > 0 ? Math.min(1, Math.max(0, 1 - left / runout)) : 1;
      const target = middle + (rect.height - middle) * (t * t * (3 - 2 * t));

      fill.set(fractionAtY(samples, target));
    };
    apply();
    const unsub = scrollY.on("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      unsub();
      window.removeEventListener("resize", apply);
    };
  }, [samples, scrollY, fill]);

  if (!width || !height) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="thread-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a3e635" />
        </linearGradient>
      </defs>

      {/* the slack thread, always fully drawn */}
      <path d={path} stroke="rgba(255,255,255,0.11)" strokeWidth="1.75" strokeLinecap="round" />
      {/* and the lit thread, filled in as far as the middle of the window */}
      <motion.path
        ref={litRef}
        d={path}
        stroke="url(#thread-grad)"
        strokeWidth="2.25"
        strokeLinecap="round"
        style={{ pathLength: fill, opacity: 0.9 }}
      />

      {nodes.map((n, i) => (
        <g key={n.id}>
          <path
            d={spiral(cx, n.y, 1.5, curlR, 1.55)}
            stroke={n.hex}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* the tie-off from the curl across to the entry */}
          <path
            d={`M ${cx + curlR} ${n.y} L ${width} ${n.y}`}
            stroke={n.hex}
            strokeWidth="1.2"
            opacity="0.35"
          />
          <circle cx={cx} cy={n.y} r="3" fill={n.hex} />
          <circle cx={cx} cy={n.y} r="7" fill={n.hex} opacity={i === 0 ? 0.22 : 0.1} />
        </g>
      ))}
    </svg>
  );
}

/* ── The flip board ────────────────────────────────────────────────────────
   The pictures for one entry, on three or four unevenly sized tiles that never
   rest. A tile turns over to a picture nobody else is showing, so the board
   never doubles up, and the tile that turns is picked at random each time
   (never the same one twice running) so the motion moves around the board.

   The tile count follows the number of pictures. When there are more pictures
   than tiles the spare ones wait off the board and a flip turns one tile to a
   picture nobody is showing. When every picture is already on the board there
   is nothing new to turn to, so two tiles trade places instead — both turn,
   and the board still moves. Boards of one or two pictures sit still: there is
   nothing to reveal that isn't already on show. One timer per entry drives it;
   a timer per tile
   would be a lot of clocks for one page, and each row starts its clock half a
   second after the one above so the page doesn't turn over in lockstep. */
const FLIP_EVERY = 5000; // ms between one tile turning and the next
// Rows enter the cycle a beat apart so the page doesn't turn over all at once.
// The phases divide the interval evenly, so a row only falls back in step with
// another once FLIP_EVERY / FLIP_OFFSET rows separate them.
const FLIP_OFFSET = 1500;
const FLIP_PHASES = Math.round(FLIP_EVERY / FLIP_OFFSET);

function tileLayout(cells) {
  if (cells <= 1) return { grid: "grid-cols-1 grid-rows-1", spans: [""] };
  if (cells === 2) return { grid: "grid-cols-3 grid-rows-1", spans: ["col-span-2", ""] };
  if (cells === 3) return { grid: "grid-cols-3 grid-rows-2", spans: ["col-span-2 row-span-2", "", ""] };
  return { grid: "grid-cols-4 grid-rows-2", spans: ["col-span-2 row-span-2", "col-span-2", "", ""] };
}

function ImageMosaic({ images, title, index = 0, onOpen }) {
  const total = images.length;
  // Alternate four- and three-tile boards down the timeline so the page isn't
  // one repeated shape. Every picture gets a tile up to that cap.
  const cells = Math.max(1, Math.min(index % 2 === 0 ? 4 : 3, total));

  const wrap = useRef(null);
  const reduced = useReducedMotion();

  // A tile carries both its faces: the one on show, and the one already
  // loaded behind it so a picture is never seen arriving blank.
  const [tiles, setTiles] = useState(() =>
    Array.from({ length: cells }, (_, i) => ({ turn: 0, a: i % Math.max(total, 1), b: i % Math.max(total, 1) }))
  );

  useEffect(() => {
    setTiles(Array.from({ length: cells }, (_, i) => ({ turn: 0, a: i % Math.max(total, 1), b: i % Math.max(total, 1) })));
  }, [cells, total]);

  useEffect(() => {
    // A single picture has nowhere to turn to, and a pair would only trade the
    // same two faces back and forth, so neither board turns.
    if (reduced || total < 3 || cells < 1) return undefined;

    let timer = null;
    let last = -1;

    const tick = () =>
      setTiles((prev) => {
        const onShow = prev.map((t) => (t.turn % 2 === 0 ? t.a : t.b));
        const out = prev.slice();
        // Load the hidden face, then turn it to the front.
        const turnTo = (idx, img) => {
          const t = out[idx];
          out[idx] = t.turn % 2 === 0 ? { turn: t.turn + 1, a: t.a, b: img } : { turn: t.turn + 1, a: img, b: t.b };
        };

        // Never the same tile twice running, so the motion moves around.
        let k = Math.floor(Math.random() * prev.length);
        if (prev.length > 1) {
          let guard = 0;
          while (k === last && guard < 8) {
            k = Math.floor(Math.random() * prev.length);
            guard += 1;
          }
        }
        last = k;

        if (total > prev.length) {
          // Pictures to spare: walk on from this tile's own to the first one
          // no tile is holding, so the board never doubles up.
          const taken = new Set(onShow);
          for (let stride = 1; stride <= total; stride += 1) {
            const cand = (onShow[k] + stride) % total;
            if (!taken.has(cand)) {
              turnTo(k, cand);
              break;
            }
          }
        } else if (prev.length > 1) {
          // Every picture is already on the board, so two tiles trade places.
          const j = (k + 1 + Math.floor(Math.random() * (prev.length - 1))) % prev.length;
          turnTo(k, onShow[j]);
          turnTo(j, onShow[k]);
        }
        return out;
      });

    let kickoff = null;
    const stop = () => {
      clearTimeout(kickoff);
      clearInterval(timer);
      kickoff = timer = null;
    };

    // A board nobody can see should not be flipping.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !timer && !kickoff) {
          kickoff = setTimeout(() => {
            kickoff = null;
            timer = setInterval(tick, FLIP_EVERY);
          }, (index % FLIP_PHASES) * FLIP_OFFSET);
        } else if (!entry.isIntersecting) {
          stop();
        }
      },
      { rootMargin: "160px" }
    );
    if (wrap.current) io.observe(wrap.current);

    return () => {
      io.disconnect();
      stop();
    };
  }, [reduced, total, cells, index]);

  if (!total) return null;
  const layout = tileLayout(cells);

  return (
    <div ref={wrap} className={`absolute inset-0 grid gap-[3px] ${layout.grid}`}>
      {tiles.map((tile, i) => {
        const facing = tile.turn % 2 === 0 ? tile.a : tile.b;
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(facing);
            }}
            // Opening at a particular picture is a mouse convenience. Keeping
            // every tile in the tab order would put four stops on each entry
            // of a news page; the row's title reaches the same window.
            tabIndex={-1}
            aria-label={`${title} — open image ${facing + 1} of ${total}`}
            className={`flip-tile group/img relative overflow-hidden ${layout.spans[i]}`}
          >
            <span className="flip-tile-inner" style={{ transform: `rotateX(${tile.turn * 180}deg)` }}>
              <span className="flip-tile-face">
                <img
                  src={images[tile.a].src}
                  alt={images[tile.a].alt || (i === 0 ? title || "" : "")}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="flip-tile-face is-back">
                <img src={images[tile.b].src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </span>
            </span>
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/img:bg-black/20" />
          </button>
        );
      })}
    </div>
  );
}

/* ── One entry ──────────────────────────────────────────────────────────── */
const NewsRow = ({ item, index, onOpen, innerRef }) => {
  const hex = accentFor(item, index);

  return (
    <motion.article
      ref={innerRef}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      onClick={() => onOpen(0)}
      className="news-row group relative cursor-pointer overflow-hidden rounded-2xl border transition-colors duration-300"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "linear-gradient(150deg, rgba(255,255,255,0.04), rgba(255,255,255,0.008))",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = rgba(hex, 0.3))}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* accent hairline picking up the thread's colour */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, ${rgba(hex, 0.55)}, transparent 60%)` }}
      />

      <div
        className={
          item.images.length
            ? "grid gap-0 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]"
            : "grid gap-0"
        }
      >
        {/* text side */}
        <div className="flex flex-col p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            {item.tag && (
              <span
                className="rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em]"
                style={{ color: hex, borderColor: rgba(hex, 0.32), background: rgba(hex, 0.08) }}
              >
                {item.tag}
              </span>
            )}
            {item.dateObj && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                {fmtBoard(item.dateObj)}
              </span>
            )}
            {item.upcoming && (
              <span
                className="rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em]"
                style={{ color: "#fcd34d", borderColor: "rgba(252,211,77,0.35)", background: "rgba(252,211,77,0.08)" }}
              >
                Upcoming
              </span>
            )}
          </div>

          <h2 className="leading-snug">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(0);
              }}
              className="text-left text-white/90 transition-colors group-hover:text-white"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(1.35rem, 2.4vw, 1.85rem)" }}
            >
              {item.title}
            </button>
          </h2>

          {item.teaser && <p className="mt-3 text-[0.92rem] leading-relaxed text-white/50">{item.teaser}</p>}

          <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 group-hover:gap-2.5"
              style={{ color: hex }}
            >
              Read more
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            {item.link && (
              <a
                href={item.link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition-all duration-200 hover:gap-2.5 hover:text-white/80"
              >
                {item.link.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* pictures */}
        {item.images.length > 0 && (
          <div className="news-row-media relative overflow-hidden">
            <ImageMosaic images={item.images} title={item.title} index={index} onOpen={onOpen} />
            {/* blend the mosaic into the card on each layout's joining edge */}
            <div
              className="pointer-events-none absolute inset-0 lg:hidden"
              style={{ background: "linear-gradient(to bottom, rgba(2,17,13,0.55), transparent 22%)" }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 lg:block"
              style={{ background: "linear-gradient(to right, rgba(6,20,16,0.75), transparent)" }}
            />
          </div>
        )}
      </div>
    </motion.article>
  );
};

/* Fitting a handful of pictures to the window's picture side ───────────────
   Up to five pictures are laid out to fill the side exactly, so none of them
   needs scrolling to. They keep their order and are cut into consecutive rows;
   within a row the widths follow the pictures' own proportions, and the row
   heights are set so the side is filled.

   Doing that pulls every tile away from its picture's true shape by the same
   factor, whatever the cut — so the best arrangement is simply the one whose
   factor is nearest 1, and there are at most sixteen cuts to try for five
   pictures. Past six the window falls back to the scrolling wall. */
const FIT_MAX = 5;
// How far a tile may sit from its picture's shape before cropping bites. Past
// this the pictures are shown whole instead, on the side behind them — the
// only way a lone near-square picture can sit in a tall box without losing its
// edges.
const FIT_CROP_LIMIT = 1.5;

function packRows(ratios, boxAspect) {
  const n = ratios.length;
  let best = null;

  for (let mask = 0; mask < 1 << (n - 1); mask += 1) {
    const rows = [];
    let row = [0];
    for (let i = 1; i < n; i += 1) {
      if (mask & (1 << (i - 1))) {
        rows.push(row);
        row = [];
      }
      row.push(i);
    }
    rows.push(row);

    const sums = rows.map((r) => r.reduce((s, i) => s + ratios[i], 0));
    const stretch = boxAspect * sums.reduce((s, x) => s + 1 / x, 0);
    const cost = Math.abs(Math.log(stretch));
    if (!best || cost < best.cost) best = { cost, rows, sums, stretch };
  }

  return {
    fit: Math.max(best.stretch, 1 / best.stretch) > FIT_CROP_LIMIT ? "contain" : "cover",
    // Weights rather than percentages, so the seams come out of the tiles
    // rather than pushing the last row off the bottom.
    rows: best.rows.map((r, k) => ({
      weight: boxAspect / best.sums[k] / best.stretch,
      items: r.map((i) => ({ index: i, weight: ratios[i] / best.sums[k] })),
    })),
  };
}

/* ── Detail window: the full picture set plus the write-up ──────────────── */
function NewsModal({ item, index = 0, startAt = 0, onClose }) {
  const hex = item ? accentFor(item, index) : "#6ee7b7";
  const count = item?.images.length ?? 0;
  const tileRefs = useRef([]);

  // Neither the picture side's proportions nor the pictures' own are known
  // until they are on the page, so the scrolling wall stands in until both
  // have arrived.
  const [boxEl, setBoxEl] = useState(null);
  const [boxAspect, setBoxAspect] = useState(0);
  const [ratios, setRatios] = useState([]);

  useEffect(() => {
    setRatios(new Array(count).fill(0));
  }, [item?.id, count]);

  useLayoutEffect(() => {
    if (!boxEl) return undefined;
    const measure = () => {
      const r = boxEl.getBoundingClientRect();
      setBoxAspect(r.height ? r.width / r.height : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boxEl);
    return () => ro.disconnect();
  }, [boxEl]);

  const noteRatio = (i, el) => {
    if (!el || !el.naturalWidth || !el.naturalHeight) return;
    const r = el.naturalWidth / el.naturalHeight;
    setRatios((prev) => {
      if (prev.length <= i || prev[i] === r) return prev;
      const next = prev.slice();
      next[i] = r;
      return next;
    });
  };

  const fitted = useMemo(
    () =>
      count > 0 && count <= FIT_MAX && boxAspect && ratios.length === count && ratios.every(Boolean)
        ? packRows(ratios, boxAspect)
        : null,
    [count, boxAspect, ratios]
  );

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  /* Opening from one of the row's tiles brings that picture into view in the
     wall, so the click lands where the eye already was. */
  useEffect(() => {
    if (!item || !startAt) return;
    tileRefs.current[startAt]?.scrollIntoView({ block: "nearest" });
  }, [item?.id, startAt]);

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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            className="relative z-10 grid w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl border md:grid-cols-2 md:grid-rows-1"
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
            {/* The picture side and the write-up each carry their own scroll, so
                working through the pictures leaves the text where it was. */}
            <div className="relative flex max-h-[40vh] min-h-[14rem] flex-col bg-black/25 md:max-h-[88vh] md:min-h-[460px]">
              {count > 0 && fitted ? (
                /* Few enough pictures to fit the side, so they are cut into
                   rows sized to their own proportions and fill it exactly —
                   nothing to scroll to. */
                <div className="min-h-0 flex-1 p-3">
                  <div ref={setBoxEl} className="flex h-full w-full flex-col gap-2">
                    {fitted.rows.map((row, r) => (
                      <div key={r} className="flex min-h-0 gap-2" style={{ flexGrow: row.weight, flexBasis: 0 }}>
                        {row.items.map(({ index: i, weight }) => (
                          <figure
                            key={i}
                            ref={(el) => (tileRefs.current[i] = el)}
                            className="min-w-0 overflow-hidden rounded-lg border"
                            style={{
                              flexGrow: weight,
                              flexBasis: 0,
                              // Shown whole, a frame around the picture would
                              // only outline the space beside it.
                              borderColor:
                                i === startAt && startAt > 0
                                  ? rgba(hex, 0.7)
                                  : fitted.fit === "contain"
                                    ? "transparent"
                                    : "rgba(255,255,255,0.08)",
                            }}
                          >
                            <img
                              src={item.images[i].src}
                              alt={item.images[i].alt || (i === 0 ? item.title : "")}
                              loading="lazy"
                              ref={(el) => el && el.complete && noteRatio(i, el)}
                              onLoad={(e) => noteRatio(i, e.currentTarget)}
                              className={`h-full w-full ${fitted.fit === "contain" ? "object-contain" : "object-cover"}`}
                            />
                          </figure>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : count > 0 ? (
                /* More pictures than the side can hold at a readable size, so
                   they go on a scrolling wall: two columns fed alternately,
                   each tile keeping its own shape, so portraits and landscapes
                   pack against one another instead of being cropped to a common
                   frame. Column heights stay close because the orientations
                   interleave. */
                <div className="min-h-0 flex-1 p-3">
                  <div ref={setBoxEl} className="flex h-full gap-2 overflow-y-auto">
                    {[0, 1].map((col) => (
                      <div key={col} className="flex w-1/2 shrink-0 flex-col gap-2 self-start">
                        {item.images
                          .map((img, i) => ({ img, i }))
                          .filter(({ i }) => i % 2 === col)
                          .map(({ img, i }) => (
                            <figure
                              key={i}
                              ref={(el) => (tileRefs.current[i] = el)}
                              className="shrink-0 overflow-hidden rounded-lg border"
                              style={{
                                borderColor:
                                  i === startAt && startAt > 0 ? rgba(hex, 0.7) : "rgba(255,255,255,0.08)",
                              }}
                            >
                              <img
                                src={img.src}
                                alt={img.alt || (i === 0 ? item.title : "")}
                                loading="lazy"
                                ref={(el) => el && el.complete && noteRatio(i, el)}
                                onLoad={(e) => noteRatio(i, e.currentTarget)}
                                className="block w-full"
                              />
                            </figure>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center"
                  style={{ background: `linear-gradient(150deg, ${rgba(hex, 0.16)}, rgba(255,255,255,0.02) 70%)` }}
                >
                  {item.dateObj && (
                    <>
                      <span
                        className="leading-none text-white/85"
                        style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
                      >
                        {item.dateObj.getDate()}
                      </span>
                      <span className="mt-1 text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: hex }}>
                        {item.dateObj.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative flex flex-col overflow-y-auto p-7 md:p-9" style={{ maxHeight: "88vh" }}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2 pr-10">
                {item.tag && (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em]"
                    style={{ color: hex, borderColor: rgba(hex, 0.3), background: rgba(hex, 0.08) }}
                  >
                    {item.tag}
                  </span>
                )}
                {item.upcoming && (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "#fcd34d", borderColor: "rgba(252,211,77,0.35)", background: "rgba(252,211,77,0.08)" }}
                  >
                    Upcoming
                  </span>
                )}
              </div>

              {item.dateObj && (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {fmtLong(item.dateObj)}
                </p>
              )}

              <h2
                className="mb-5 leading-[1.1] text-white"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.1rem)" }}
              >
                {item.title}
              </h2>

              <div className="space-y-3.5">
                {item.body.map((para, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed text-white/65">
                    {para}
                  </p>
                ))}
              </div>

              {item.link && (
                <a
                  href={item.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex w-fit items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-2.5"
                  style={{ color: hex }}
                >
                  {item.link.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Atmospheric backdrop, sibling to the Research page's ───────────────── */
function NewsBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-40 right-[-12rem] h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.14), transparent 62%)" }}
      />
      <div
        className="absolute top-[38%] -left-48 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(125,211,252,0.09), transparent 62%)" }}
      />
      <div
        className="absolute bottom-[-8%] right-[18%] h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.08), transparent 62%)" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="news-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#news-grain)" />
      </svg>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function News() {
  useSeo(ROUTES["/news"]);

  const [raw, setRaw] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // { id, at }

  useEffect(() => {
    let live = true;
    fetchJSONC("/news.jsonc")
      .then((data) => live && setRaw(Array.isArray(data) ? data : []))
      .catch((e) => live && setError(e?.message ?? "Failed to load news"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo(() => orderItems(raw), [raw]);

  /* Measure the rail and where each entry meets it, so the thread's curls land
     on the rows rather than on guessed offsets. */
  const listRef = useRef(null);
  const railRef = useRef(null);
  const rowRefs = useRef([]);
  const [rail, setRail] = useState({ width: 0, height: 0, nodes: [] });

  useLayoutEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const railEl = railRef.current;
      if (!list || !railEl) return;
      const top = list.getBoundingClientRect().top;
      const nodes = items
        .map((item, i) => {
          const el = rowRefs.current[i];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          // Meet each entry level with its split-flap board, not its middle.
          return { id: item.id, hex: accentFor(item, i), y: r.top - top + Math.min(56, r.height / 2) };
        })
        .filter(Boolean);
      setRail({ width: railEl.clientWidth, height: list.offsetHeight, nodes });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    rowRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  const activeIndex = open ? items.findIndex((it) => it.id === open.id) : -1;
  const active = activeIndex >= 0 ? items[activeIndex] : null;

  return (
    <div className="min-h-screen">
      {/* ══ Hero ═══════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden px-6 pb-14 pt-20 md:px-10 md:pb-20 md:pt-28">
        <NewsBackdrop />
        <div className="relative mx-auto max-w-7xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300/80"
          >
            News
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.215, 0.61, 0.355, 1] }}
            className="mt-6 text-white"
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2.6rem, 7vw, 5.6rem)",
              lineHeight: 0.94,
              letterSpacing: "-0.015em",
            }}
          >
            From the loom
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: "easeOut" }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-50/80 md:text-xl"
          >
            Papers and preprints, datasets and talks, fieldwork and the people
            behind it — what the lab has been working on, as it happens.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.38, ease: [0.215, 0.61, 0.355, 1] }}
            className="mt-10 h-px max-w-2xl origin-left"
            style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.45), rgba(20,184,166,0.2), transparent)" }}
          />
        </div>
      </header>

      {/* ══ Timeline ═══════════════════════════════════════════════════════ */}
      <main className="relative mx-auto max-w-7xl px-6 pb-28 md:px-10">
        {loading && <p className="py-16 text-center text-sm text-white/40">Loading the latest…</p>}
        {error && <p className="py-16 text-center text-sm text-red-300/70">Unable to load the news ({error}).</p>}
        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-sm italic text-white/35">Nothing here yet — check back soon.</p>
        )}

        {items.length > 0 && (
          <div ref={listRef} className="relative mt-12 flex md:mt-24">
            <div ref={railRef} className="relative w-16 shrink-0 md:w-32">
              {rail.width > 0 && (
                <div
                  className="yarn-ball"
                  aria-hidden="true"
                  style={{
                    width: ballBox(rail.width).w,
                    height: ballBox(rail.width).h,
                    top: ballBox(rail.width).top,
                  }}
                />
              )}
              <ThreadRail width={rail.width} height={rail.height} nodes={rail.nodes} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-8 md:gap-12">
              {items.map((item, i) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  index={i}
                  innerRef={(el) => (rowRefs.current[i] = el)}
                  onOpen={(at) => setOpen({ id: item.id, at })}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <NewsModal
        item={active}
        index={activeIndex < 0 ? 0 : activeIndex}
        startAt={open?.at ?? 0}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
