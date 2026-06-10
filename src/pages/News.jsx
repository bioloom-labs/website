import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import { fetchJSONC } from "../utils/jsonc.js";

/* ════════════════════════════════════════════════════════════════════════
   The BioLoom Chronicle — the News page as a real, drag-to-turn newspaper.
   Front & back are single covers; the inner leaves are double-page spreads.
   ════════════════════════════════════════════════════════════════════════ */

/* ─── Date & numeral helpers ─── */

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDateline(d) {
  return d
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

function fmtStory(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

function fmtKicker(d) {
  return d
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(".", "");
}

function toRoman(num) {
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out || "—";
}

/* ─── Fit the book to the available screen area ───
   StPageFlip derives book height from width, so we choose a wrapper width
   such that the resulting spread (or single page) fits both the available
   width AND height — the whole spread is visible with no scrolling. */
const PAGE_RATIO = 602 / 445; // one page: height / width
const MAX_PAGE_W = 700;
const MIN_PAGE_W = 300;

// With showCover the pages group into spreads whose *first* page indices are
// not sequential: front [0], then [1,2], [3,4], …, back [n-1] → starts 0,1,3,5…
// We predict turns against this list so the centring slide targets the right
// spread (esp. the back cover, which jumps two indices from the last spread).
function spreadStarts(n) {
  const arr = [0];
  for (let i = 1; i < n - 1; i += 2) arr.push(i);
  if (n > 1) arr.push(n - 1);
  return arr;
}

function fitBook(availW, availH) {
  if (!availW || !availH) return null;
  const w = Math.max(0, availW - 12);
  const h = Math.max(0, availH - 12);
  // Landscape spread: bookW = 2·pageW, bookH = pageW·RATIO = bookW·RATIO/2
  const landW = Math.min(w, MAX_PAGE_W * 2, h * (2 / PAGE_RATIO));
  if (landW >= MIN_PAGE_W * 2) return { width: Math.floor(landW), portrait: false };
  // Portrait single page
  const portW = Math.min(w, MAX_PAGE_W, h / PAGE_RATIO);
  return { width: Math.floor(portW), portrait: true };
}

/* ─── A hand-drawn botanical engraving (woodcut style) ─── */

function Leaf({ x, y, rotate, scale = 1, flip = 1 }) {
  const veins = [1, 2, 3, 4, 5].map((i) => {
    const px = i * 15;
    return (
      <g key={i}>
        <line x1={px} y1="0" x2={px + 11} y2={-9} />
        <line x1={px} y1="0" x2={px + 11} y2={9} />
      </g>
    );
  });
  const hatch = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const px = 12 + i * 10;
    return <line key={`h${i}`} x1={px} y1={-2} x2={px + 6} y2={-11} strokeWidth="0.8" />;
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale} ${scale * flip})`}>
      <path d="M0 0 C 26 -19, 66 -19, 92 0 C 66 19, 26 19, 0 0 Z" strokeWidth="1.7" />
      <line x1="2" y1="0" x2="90" y2="0" strokeWidth="1.2" />
      {veins}
      {hatch}
    </g>
  );
}

function BotanicalPlate({ className = "" }) {
  const ground = Array.from({ length: 18 }).map((_, i) => {
    const gx = 34 + i * 12;
    return <line key={i} x1={gx} y1="338" x2={gx - 10} y2="350" strokeWidth="0.9" />;
  });
  const petals = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const cx = 150 + Math.cos(a) * 4;
    const cy = 60 + Math.sin(a) * 4;
    const ex = 150 + Math.cos(a) * 30;
    const ey = 60 + Math.sin(a) * 30;
    const nx = Math.cos(a + Math.PI / 2) * 8;
    const ny = Math.sin(a + Math.PI / 2) * 8;
    return (
      <path
        key={i}
        d={`M${cx} ${cy} C ${cx + nx} ${cy + ny}, ${ex + nx} ${ey + ny}, ${ex} ${ey} C ${ex - nx} ${ey - ny}, ${cx - nx} ${cy - ny}, ${cx} ${cy} Z`}
        strokeWidth="1.2"
      />
    );
  });
  const seeds = Array.from({ length: 9 }).map((_, i) => {
    const a = (i / 9) * Math.PI * 2;
    return <circle key={i} cx={150 + Math.cos(a) * 5} cy={60 + Math.sin(a) * 5} r="1.4" fill="#211f17" stroke="none" />;
  });
  return (
    <svg viewBox="0 0 300 360" className={className} role="img" aria-label="Botanical engraving">
      <g stroke="#211f17" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {ground}
        <path d="M150 340 C 146 296, 156 262, 151 214 C 147 172, 156 120, 150 88" strokeWidth="2.6" />
        <Leaf x={151} y={300} rotate={172} scale={0.95} flip={1} />
        <Leaf x={150} y={278} rotate={8} scale={0.95} flip={-1} />
        <Leaf x={152} y={238} rotate={156} scale={1.1} flip={1} />
        <Leaf x={149} y={214} rotate={24} scale={1.1} flip={-1} />
        <Leaf x={151} y={170} rotate={150} scale={0.8} flip={1} />
        <Leaf x={150} y={150} rotate={30} scale={0.8} flip={-1} />
        <path d="M150 120 C 138 108, 128 96, 126 82" strokeWidth="1.4" />
        <path d="M150 120 C 162 108, 172 96, 174 82" strokeWidth="1.4" />
        <circle cx="124" cy="78" r="7" strokeWidth="1.3" />
        <circle cx="176" cy="78" r="7" strokeWidth="1.3" />
        {petals}
        <circle cx="150" cy="60" r="11" strokeWidth="1.4" />
        {seeds}
      </g>
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ─── A page shell (forwardRef is required by react-pageflip) ─── */
const Page = forwardRef(function Page({ children, cover = false, className = "" }, ref) {
  return (
    <div className={`book-page ${cover ? "is-cover" : ""} ${className}`} ref={ref} data-density={cover ? "hard" : "soft"}>
      <div className="bp-inner bp">{children}</div>
    </div>
  );
});

/* Running head used at the top of inner pages */
function RunHead({ page }) {
  return (
    <>
      <div className="flex items-center justify-between bp-folio">
        <span>The BioLoom Chronicle</span>
        <span>Page&nbsp;{page}</span>
      </div>
      <div className="bp-rule mt-[0.4em] mb-[0.7em]" />
    </>
  );
}

function Folio({ page }) {
  return (
    <div className="mt-auto pt-[0.8em]">
      <div className="bp-rule-soft mb-[0.4em]" />
      <p className="bp-folio text-center">· {page} ·</p>
    </div>
  );
}

/* ─── Page content blocks ─── */

function FrontCover({ today, lead }) {
  const vol = toRoman(today.getFullYear());
  const issue = toRoman(today.getMonth() + 1);
  return (
    <Page cover>
      <div className="flex items-center justify-between bp-folio">
        <span>Vol.&nbsp;{vol} · No.&nbsp;{issue}</span>
        <span>Price · Free</span>
      </div>
      <div className="bp-rule-double mt-[0.4em]" />

      <h1 className="bp-mast text-center my-[0.5em]" style={{ fontSize: "2.7em" }}>
        The BioLoom Chronicle
      </h1>

      <div className="bp-rule" />
      <p className="text-center bp-folio my-[0.45em]" style={{ fontSize: "0.56em" }}>
        {fmtDateline(today)}
      </p>
      <p className="text-center bp-byline ink-soft mb-[0.5em]" style={{ fontSize: "0.82em" }}>
        “All the biodiversity that’s fit to print.”
      </p>
      <div className="bp-rule-thick" />

      {lead ? (
        <div className="mt-[0.9em] flex-1 flex flex-col">
          <p className="bp-kicker text-center mb-[0.4em]">
            {lead.upcoming ? "Forthcoming · From the Desk" : "Lead Dispatch"}
          </p>
          <h2 className="bp-headline text-center" style={{ fontSize: "2.05em" }}>
            {lead.title}
          </h2>
          <p className="text-center bp-byline ink-faint mt-[0.5em]" style={{ fontSize: "0.72em" }}>
            By the BioLoom Desk · {lead.dateObj ? fmtStory(lead.dateObj) : "Undated"}
          </p>
          <div className="flex items-center justify-center my-[0.7em] gap-[0.6em]">
            <span className="bp-rule-soft flex-1" />
            <img src="/images/news/bioloom-logo.svg" alt="BioLoom" className="h-[1.7em] w-auto" />
            <span className="bp-rule-soft flex-1" />
          </div>
          <p className="bp-body bp-justify bp-dropcap bp-leadin">
            {lead.text || "Details to follow inside this edition of the Chronicle."}
          </p>
        </div>
      ) : (
        <p className="mt-[1em] bp-body text-center ink-faint">No dispatches have gone to press yet.</p>
      )}

      <div className="book-corner-hint">
        Drag to open
        <ArrowGlyph />
      </div>
      <span className="book-dogear" />
    </Page>
  );
}

function DispatchesPage({ items }) {
  return (
    <Page>
      <RunHead page="2" />
      <p className="bp-section ink text-center" style={{ fontSize: "0.92em" }}>
        Dispatches
      </p>
      <div className="bp-rule mt-[0.5em] mb-[0.8em]" />

      <div className="flex-1 flex flex-col gap-[0.85em]">
        {items.length === 0 && (
          <p className="bp-body ink-faint italic text-center mt-[1em]">
            The wire is quiet. Check back next edition.
          </p>
        )}
        {items.map((item, i) => (
          <article key={item.id}>
            {i > 0 && <div className="bp-rule-soft mb-[0.85em]" />}
            <div className="flex items-center gap-[0.5em] mb-[0.25em]">
              <span className={`bp-kicker ${item.upcoming ? "ink-accent" : "ink-faint"}`} style={{ fontSize: "0.56em" }}>
                {item.upcoming ? "Forthcoming" : "Dispatch"}
              </span>
              <span className="bp-rule-soft flex-1" />
              {item.dateObj && (
                <span className="bp-folio" style={{ fontSize: "0.54em" }}>
                  {fmtKicker(item.dateObj)}
                </span>
              )}
            </div>
            <h3 className="bp-sub ink" style={{ fontSize: "1.15em" }}>
              {item.title}
            </h3>
            {item.text && <p className="bp-body bp-justify ink-soft mt-[0.2em]" style={{ fontSize: "0.9em" }}>{item.text}</p>}
            {item.link && item.link !== "#" ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="bp-kicker ink-accent inline-block mt-[0.3em]" style={{ fontSize: "0.52em", borderBottom: "1px solid currentColor" }}>
                Continued&nbsp;→
              </a>
            ) : (
              <span className="bp-folio ink-faint inline-block mt-[0.3em]" style={{ fontSize: "0.52em" }}>
                — In the archive —
              </span>
            )}
          </article>
        ))}
      </div>

      <Folio page="2" />
    </Page>
  );
}

function FieldPage() {
  return (
    <Page>
      <RunHead page="3" />
      <p className="bp-section ink text-center" style={{ fontSize: "0.92em" }}>
        From the Field
      </p>
      <div className="bp-rule mt-[0.5em] mb-[0.7em]" />

      <figure className="px-[0.4em]">
        <div className="border-y-[0.16em] border-[#211f17] py-[0.6em]">
          <BotanicalPlate className="w-[64%] mx-auto" />
        </div>
        <figcaption className="bp-caption text-center mt-[0.4em]">
          Fig. 1 — A specimen from the BioLoom collection, engraved for these pages.
        </figcaption>
      </figure>

      <div className="flex items-center justify-center my-[0.8em] gap-[0.6em]" aria-hidden="true">
        <span className="bp-rule-soft flex-1" />
        <span className="bp-pull ink-accent" style={{ fontSize: "1.1em" }}>❦</span>
        <span className="bp-rule-soft flex-1" />
      </div>

      <blockquote className="bp-pull ink text-center px-[0.5em]" style={{ fontSize: "1.12em" }}>
        “We map where biodiversity thrives, how it is changing, and what it means
        for people.”
      </blockquote>
      <p className="bp-folio text-center mt-[0.5em]">— The BioLoom mission</p>

      <Folio page="3" />
    </Page>
  );
}

function EditorialPage() {
  return (
    <Page>
      <RunHead page="4" />
      <p className="bp-section ink text-center" style={{ fontSize: "0.92em" }}>
        From the Desk · Editorial
      </p>
      <div className="bp-rule mt-[0.5em] mb-[0.8em]" />

      <p className="bp-body bp-justify bp-dropcap bp-leadin ink">
        Biodiversity and the people who lean on it are too often studied apart.
        The Chronicle exists to read them together — to follow a thread from a
        plant in the field to a meal, a medicine or a livelihood, and back again.
      </p>
      <p className="bp-body bp-justify ink mt-[0.7em]" style={{ fontSize: "0.95em" }}>
        Our work weaves ecology, data science and human wellbeing into one
        picture: where nature is richest, how it is shifting under a changing
        climate, and what is owed to the communities who steward it. These pages
        gather the lab’s latest releases, talks and notices as they go to press.
      </p>

      <div className="flex items-center justify-center my-[0.8em] gap-[0.6em]" aria-hidden="true">
        <span className="bp-rule-soft flex-1" />
        <img src="/images/news/bioloom-logo.svg" alt="BioLoom" className="h-[1.7em] w-auto" />
        <span className="bp-rule-soft flex-1" />
      </div>

      <p className="bp-byline ink-soft text-right pr-[0.4em]" style={{ fontSize: "0.86em" }}>
        — The Editors, BioLoom Labs
      </p>

      <Folio page="4" />
    </Page>
  );
}

function NoticesPage() {
  const rows = [
    { to: "/research", label: "Research", note: "Ten threads, from macro-ecology to genetics.", pg: "p.2" },
    { to: "/people", label: "The People", note: "Who tends the loom — leads, students, alumni.", pg: "p.4" },
    { to: "/publications", label: "Publications", note: "Papers, data releases & opinion pieces.", pg: "p.7" },
    { to: "/contact", label: "Correspondence", note: "Write to the desk; collaborations welcome.", pg: "p.8" },
  ];
  return (
    <Page>
      <RunHead page="5" />
      <p className="bp-section ink text-center" style={{ fontSize: "0.92em" }}>
        Notices &amp; Index
      </p>
      <div className="bp-rule mt-[0.5em] mb-[0.8em]" />

      <ul className="flex-1 flex flex-col gap-[0.9em]">
        {rows.map((row, i) => (
          <li key={row.to}>
            {i > 0 && <div className="bp-rule-soft mb-[0.9em]" />}
            <div className="flex items-baseline gap-[0.5em]">
              <Link to={row.to} className="bp-sub ink-accent" style={{ fontSize: "1.1em" }}>
                {row.label}
              </Link>
              <span className="bp-leader" />
              <span className="bp-folio">{row.pg}</span>
            </div>
            <p className="bp-body ink-soft mt-[0.15em]" style={{ fontSize: "0.88em" }}>
              {row.note}
            </p>
          </li>
        ))}
      </ul>

      <Folio page="5" />
    </Page>
  );
}

function BackCover({ today }) {
  return (
    <Page cover>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[0.4em]">
        <p className="bp-kicker mb-[0.6em]">And finally</p>
        <div className="bp-pull ink-accent mb-[0.5em]" style={{ fontSize: "1.4em" }} aria-hidden="true">⁂</div>

        <h2 className="bp-mast ink mb-[0.5em]" style={{ fontSize: "1.7em" }}>
          The BioLoom Chronicle
        </h2>

        <p className="bp-body ink-soft mb-[1em]" style={{ fontSize: "0.92em" }}>
          Set in Playfair Display &amp; Newsreader. Printed in pixels and
          peer-reviewed in practice.
        </p>

        <Link to="/contact" className="bp-kicker ink-accent" style={{ borderBottom: "0.12em solid currentColor", paddingBottom: "0.1em" }}>
          Correspondence to the Contact desk →
        </Link>

        <div className="flex items-center justify-center my-[1em] gap-[0.6em] w-[70%]" aria-hidden="true">
          <span className="bp-rule-soft flex-1" />
          <img src="/images/news/bioloom-logo.svg" alt="BioLoom" className="h-[1.7em] w-auto" />
          <span className="bp-rule-soft flex-1" />
        </div>

        <p className="bp-byline ink-soft" style={{ fontSize: "0.82em" }}>
          “All the biodiversity that’s fit to print.”
        </p>
        <p className="bp-folio mt-[0.8em]">© {today.getFullYear()} BioLoom Labs</p>
      </div>
    </Page>
  );
}

/* ─── The botanist's desk the newspaper rests on (a photograph) ─── */
function BotanistDesk() {
  return (
    <div className="book-desk" aria-hidden="true">
      {/* Photographic desk; falls back to the drawn wood if the file is absent */}
      <img
        className="book-desk-photo"
        src="/images/news/news-background-4k.jpg"
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="book-desk-vignette" />
      {/* Subtle darken at the very top so the transparent navbar stays legible */}
      <div className="book-desk-topshade" />
    </div>
  );
}

/* ─── Page ─── */
export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const bookRef = useRef(null);
  const bookClampRef = useRef(null);
  const rafRef = useRef(null);
  const shiftRef = useRef(0);
  const totalRef = useRef(6);
  const frameRef = useRef(null);
  const areaRef = useRef(null);
  const [frameH, setFrameH] = useState(null);
  const [avail, setAvail] = useState({ w: 0, h: 0 });
  const today = useMemo(() => new Date(), []);

  // Lock the view to the screen: the frame fills the viewport below the navbar.
  useLayoutEffect(() => {
    function measure() {
      if (!frameRef.current) return;
      const top = frameRef.current.getBoundingClientRect().top;
      setFrameH(Math.max(320, window.innerHeight - top));
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [loading]);

  // Measure the area left for the book (between navbar and controls).
  useEffect(() => {
    if (!areaRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setAvail({ w: cr.width, h: cr.height });
    });
    ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, [loading]);

  const fit = useMemo(() => fitBook(avail.w, avail.h), [avail]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const response = await fetchJSONC("/news.jsonc");
        if (!mounted) return;
        setItems(Array.isArray(response) ? response : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load news");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const { lead, dispatches } = useMemo(() => {
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const enriched = (items || []).map((item, idx) => {
      const dateObj = parseDate(item.date);
      return {
        ...item,
        dateObj,
        upcoming: dateObj ? dateObj >= todayMid : false,
        id: item.id || `${item.title || "news"}-${idx}`,
      };
    });
    const upcoming = enriched.filter((e) => e.upcoming).sort((a, b) => (a.dateObj && b.dateObj ? a.dateObj - b.dateObj : 0));
    const past = enriched.filter((e) => !e.upcoming).sort((a, b) => {
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return b.dateObj - a.dateObj;
    });
    const leadItem = upcoming[0] || past[0] || null;
    const rest = enriched.filter((e) => e.id !== leadItem?.id);
    const restUpcoming = rest.filter((e) => e.upcoming).sort((a, b) => (a.dateObj && b.dateObj ? a.dateObj - b.dateObj : 0));
    const restPast = rest.filter((e) => !e.upcoming).sort((a, b) => {
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return b.dateObj - a.dateObj;
    });
    return { lead: leadItem, dispatches: [...restUpcoming, ...restPast] };
  }, [items]);

  const onFlip = useCallback((e) => setPage(e.data), []);

  // Horizontal centre offset for a page index: front cover sits left of the
  // spine, back cover right of it, spreads dead-centre.
  const offsetForPage = useCallback((idx) => {
    const s = shiftRef.current;
    const n = totalRef.current;
    if (!s) return 0;
    if (idx <= 0) return -s;
    if (idx >= n - 1) return s;
    return 0;
  }, []);

  const setClampTx = useCallback((px) => {
    const el = bookClampRef.current;
    if (el) el.style.transform = `translateX(${px}px)`;
  }, []);

  // Drive the centring slide from the LIVE fold progress so it tracks the turn
  // exactly — for drags of any speed, button flips and snap-backs alike. A
  // fixed-duration CSS transition can't stay in sync because StPageFlip's
  // release animation lasts in proportion to how far the page was dragged.
  const animateTx = useCallback(() => {
    const pf = bookRef.current?.pageFlip?.();
    const calc = pf?.getFlipController?.()?.getCalculation?.();
    if (!pf) {
      rafRef.current = null;
      return;
    }
    if (calc) {
      const cur = pf.getCurrentPageIndex?.() ?? 0; // from-page (stable mid-flip)
      const dir = calc.getDirection?.() === 1 ? -1 : 1; // FlipDirection.BACK === 1
      const starts = spreadStarts(pf.getPageCount?.() ?? 6);
      const idx = starts.indexOf(cur);
      const to = idx >= 0 ? starts[Math.max(0, Math.min(starts.length - 1, idx + dir))] : cur;
      const p = Math.max(0, Math.min(100, calc.getFlippingProgress?.() ?? 0)) / 100;
      const from = offsetForPage(cur);
      setClampTx(from + (offsetForPage(to) - from) * p);
      rafRef.current = requestAnimationFrame(animateTx);
    } else {
      // Settled — snap exactly onto the current page's centre.
      setClampTx(offsetForPage(pf.getCurrentPageIndex?.() ?? 0));
      rafRef.current = null;
    }
  }, [offsetForPage, setClampTx]);

  const onChangeState = useCallback(
    (e) => {
      if ((e.data === "user_fold" || e.data === "flipping") && rafRef.current == null) {
        rafRef.current = requestAnimationFrame(animateTx);
      }
    },
    [animateTx]
  );

  const onInit = useCallback(() => {
    // NB: the init event's `data` is an object ({page, mode}), not a number —
    // read the current index from the API instead.
    const pf = bookRef.current?.pageFlip?.();
    if (!pf) return;
    try {
      setPageCount(pf.getPageCount());
      setPage(pf.getCurrentPageIndex?.() ?? 0);
      // Front & back stay HARD (the showCover default) so they swing like rigid
      // 3D hardback covers; the inner sheets keep their soft newspaper fold.
    } catch {
      /* ignore */
    }
  }, []);

  const flipPrev = useCallback(() => bookRef.current?.pageFlip?.()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip?.()?.flipNext(), []);

  // Arrow-key navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") flipPrev();
      else if (e.key === "ArrowRight") flipNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext]);

  // Memoise the pages so the children prop stays referentially stable.
  // react-pageflip resets its internal child-ref list on every children
  // change; an unstable array races with — and aborts — initialisation.
  const pages = useMemo(
    () => [
      FrontCover({ today, lead }),
      DispatchesPage({ items: dispatches }),
      FieldPage({}),
      EditorialPage({}),
      NoticesPage({}),
      BackCover({ today }),
    ],
    [today, lead, dispatches]
  );

  const total = pageCount || 6;
  const indicator =
    page <= 0 ? "Front Page" : page >= total - 1 ? "Back Page" : `Pages ${page}–${page + 1}`;

  // Feed the rAF with current layout values, and settle the book onto the
  // current page whenever nothing is flipping (initial load, resize, page set).
  const shift = fit && !fit.portrait ? fit.width / 4 : 0;
  shiftRef.current = shift;
  totalRef.current = total;

  useEffect(() => {
    if (rafRef.current != null) return; // a flip owns the transform right now
    setClampTx(offsetForPage(page));
  }, [shift, total, page, fit, setClampTx, offsetForPage]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <>
      {/* Fixed full-viewport desk — sits behind the transparent navbar too */}
      <BotanistDesk />

      <div
        ref={frameRef}
        className="relative flex flex-row overflow-hidden"
        style={frameH ? { height: frameH } : { minHeight: "60vh" }}
      >
        {/* Left spacer balances the right rail so the book centres on-screen */}
        {!loading && !error && <div className="book-side" aria-hidden="true" />}

      {/* Book area — fills the screen between the navbar and the side rail */}
      <div ref={areaRef} className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-2 sm:px-4">
        {error ? (
          <p className="font-headline italic text-center text-[#fca5a5]">
            The presses jammed — unable to load the news ({error}).
          </p>
        ) : loading ? (
          <p className="font-headline tracking-[0.22em] uppercase text-sm text-white/50">
            Setting the type…
          </p>
        ) : fit ? (
          <div className="book-clamp" ref={bookClampRef} style={{ width: fit.width }}>
            <HTMLFlipBook
              ref={bookRef}
              width={445}
              height={602}
              size="stretch"
              minWidth={MIN_PAGE_W}
              maxWidth={MAX_PAGE_W}
              minHeight={406}
              maxHeight={1000}
              autoSize
              drawShadow
              maxShadowOpacity={0.5}
              flippingTime={800}
              showCover
              showPageCorners={false}
              usePortrait
              mobileScrollSupport
              clickEventForward
              useMouseEvents
              renderOnlyPageLengthChange
              onFlip={onFlip}
              onInit={onInit}
              onChangeState={onChangeState}
              className="chronicle-book"
            >
              {/* Pages are forwardRef <Page> elements in a memoised array so
                  react-pageflip can inject refs and init reliably. */}
              {pages}
            </HTMLFlipBook>
          </div>
        ) : null}
        </div>

        {/* Right spacer reserves the fixed rail's width so the book stays centred */}
        {!loading && !error && <div className="book-side" aria-hidden="true" />}
      </div>

      {/* Side rail — fixed full height so its panel runs continuously behind
          the transparent navbar instead of being cut at the navbar line */}
      {!loading && !error && (
        <aside className="book-rail">
          <span className="book-rail-label">The<br />Chronicle</span>
          <button type="button" className="book-btn book-btn--rail" onClick={flipPrev} disabled={page <= 0} aria-label="Previous page">
            <span style={{ width: "0.8rem", height: "0.8rem", display: "inline-flex", transform: "scaleX(-1)" }}>
              <ArrowGlyph />
            </span>
            Prev
          </button>
          <span className="book-indicator">{indicator}</span>
          <button type="button" className="book-btn book-btn--rail" onClick={flipNext} disabled={page >= total - 1} aria-label="Next page">
            Next
            <span style={{ width: "0.8rem", height: "0.8rem", display: "inline-flex" }}>
              <ArrowGlyph />
            </span>
          </button>
        </aside>
      )}
    </>
  );
}
