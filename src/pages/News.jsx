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
// Below this per-page width we drop the spread for a single portrait page.
// This MUST equal the flip-book's `minWidth` prop: StPageFlip switches to
// portrait when its container is narrower than `minWidth * 2`, so if our
// threshold and its threshold disagree the wrapper ends up sized for one mode
// while the book renders the other — which is what made it overflow.
const MIN_PAGE_W = 180;
const FIT_MARGIN = 16; // breathing room so the book never touches the edges

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
  const w = Math.max(0, availW - FIT_MARGIN);
  const h = Math.max(0, availH - FIT_MARGIN);
  // Landscape spread. Each page is capped by HALF the width, the max page width,
  // and — crucially — the FULL available height (page height = pageW · RATIO, so
  // pageW ≤ h / RATIO keeps the spread within the viewport on both axes).
  const landPageW = Math.min(w / 2, MAX_PAGE_W, h / PAGE_RATIO);
  if (landPageW >= MIN_PAGE_W) {
    return { width: Math.floor(landPageW) * 2, portrait: false };
  }
  // Portrait single page: capped the same way against the full width.
  const portPageW = Math.min(w, MAX_PAGE_W, h / PAGE_RATIO);
  return { width: Math.floor(portPageW), portrait: true };
}

/* ─── Monthly editions / archive ─────────────────────────────────────────── */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LAUNCH_YEAR = 2024;
const LAUNCH_MONTH = 0; // January 2024 — "Established 2024"

function enrichItems(raw) {
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  return (raw || []).map((it, idx) => {
    const dateObj = parseDate(it.date);
    return {
      ...it,
      dateObj,
      upcoming: dateObj ? dateObj >= todayMid : false,
      id: it.id || `${it.title || "news"}-${idx}`,
    };
  });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// An edition for a specific calendar month (the items dated within it).
function editionForMonth(raw, y, m) {
  const monthItems = enrichItems(raw)
    .filter((e) => e.dateObj && e.dateObj.getFullYear() === y && e.dateObj.getMonth() === m)
    .sort((a, b) => a.dateObj - b.dateObj);
  const [lead, ...rest] = monthItems;
  return {
    year: y,
    month: m,
    vol: toRoman(y),
    issue: toRoman(m + 1),
    dateLabel: `${MONTH_NAMES[m]} ${y}`.toUpperCase(),
    lead: lead || null,
    dispatches: rest,
    empty: monthItems.length === 0,
    fileName: `BioLoom-Chronicle-${y}-${pad2(m + 1)}.pdf`,
  };
}

// Every month from the current one forward to the latest dated dispatch.
function buildArchiveMonths(today, raw) {
  const curY = today.getFullYear();
  const curM = today.getMonth();
  let lastY = curY;
  let lastM = curM;
  enrichItems(raw).forEach((e) => {
    if (!e.dateObj) return;
    const y = e.dateObj.getFullYear();
    const m = e.dateObj.getMonth();
    if (y > lastY || (y === lastY && m > lastM)) {
      lastY = y;
      lastM = m;
    }
  });
  const out = [];
  let y = curY;
  let m = curM;
  while (y < lastY || (y === lastY && m <= lastM)) {
    out.push({ y, m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
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

function BotanicalPlate({ className = "", style }) {
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
    <svg viewBox="0 0 300 360" className={className} style={style} role="img" aria-label="Botanical engraving">
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

/* Drop-cap paragraph as a real floated element (a CSS ::first-letter pseudo
   doesn't survive the foreignObject rasterisation used for the PDF export). */
function DropCapP({ className = "", children }) {
  const text = typeof children === "string" ? children : String(children ?? "");
  return (
    <p className={`bp-body bp-justify ${className}`}>
      <span className="bp-dropcap-letter">{text.charAt(0)}</span>
      {text.slice(1)}
    </p>
  );
}

/* ─── Page content blocks ─── */

function FrontCover({ vol, issue, dateLabel, lead }) {
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
        {dateLabel}
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
          <DropCapP>
            {lead.text || "Details to follow inside this edition of the Chronicle."}
          </DropCapP>
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

      <DropCapP className="ink">
        Biodiversity and the people who lean on it are too often studied apart.
        The Chronicle exists to read them together — to follow a thread from a
        plant in the field to a meal, a medicine or a livelihood, and back again.
      </DropCapP>
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

function BackCover({ year }) {
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
        <p className="bp-folio mt-[0.8em]">© {year} BioLoom Labs</p>
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
        src="/images/news/news-background-4k.webp"
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </svg>
  );
}

/* ─── Build the six book pages for any edition (used by the live flip-book
   and the flattened multi-page PDF export alike) ─── */
function editionBookPages(edition) {
  return [
    FrontCover({ vol: edition.vol, issue: edition.issue, dateLabel: edition.dateLabel, lead: edition.lead }),
    DispatchesPage({ items: edition.dispatches }),
    FieldPage({}),
    EditorialPage({}),
    NoticesPage({}),
    BackCover({ year: edition.year }),
  ];
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
  const lastPageRef = useRef(0); // remembers the page across a mode remount
  const rafRef = useRef(null);
  const shiftRef = useRef(0);
  const totalRef = useRef(6);
  const frameRef = useRef(null);
  const areaRef = useRef(null);
  const [frameH, setFrameH] = useState(null);
  const [avail, setAvail] = useState({ w: 0, h: 0 });
  const [printEdition, setPrintEdition] = useState(null);
  const [archivesOpen, setArchivesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [printSize, setPrintSize] = useState({ w: 460, h: 622, fs: 15.4 });
  const printRef = useRef(null);
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

  // StPageFlip grows/shrinks its container on a live resize but doesn't reliably
  // re-flow the page contents — they stay at the old size, anchored left, and
  // the centring shift pushes them off-screen with no way to recover. Asking it
  // to re-lay-out (update()) once the resize settles fixes it in place without
  // losing the reader's page. The timer resets on each size change, so a drag
  // only triggers one re-layout when it stops. Same-size re-renders don't refire
  // this (fit is referentially stable).
  useEffect(() => {
    if (!fit) return undefined;
    const id = setTimeout(() => {
      try {
        bookRef.current?.pageFlip?.()?.update?.();
      } catch {
        /* ignore — the reset effect below still re-centres */
      }
    }, 160);
    return () => clearTimeout(id);
  }, [fit]);

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

  // The current edition (what the Download button saves) and the archive.
  const currentEdition = useMemo(
    () => ({
      year: today.getFullYear(),
      month: today.getMonth(),
      vol: toRoman(today.getFullYear()),
      issue: toRoman(today.getMonth() + 1),
      dateLabel: fmtDateline(today),
      lead,
      dispatches,
      empty: !lead && dispatches.length === 0,
      fileName: `BioLoom-Chronicle-${today.getFullYear()}-${pad2(today.getMonth() + 1)}.pdf`,
    }),
    [today, lead, dispatches]
  );

  const archiveYears = useMemo(() => {
    const map = new Map();
    buildArchiveMonths(today, items).forEach(({ y, m }) => {
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(m);
    });
    return Array.from(map.entries()).map(([year, months]) => ({ year, months }));
  }, [today, items]);

  const monthsWithItems = useMemo(() => {
    const set = new Set();
    enrichItems(items).forEach((e) => {
      if (e.dateObj) set.add(`${e.dateObj.getFullYear()}-${e.dateObj.getMonth()}`);
    });
    return set;
  }, [items]);

  const downloadEdition = useCallback(
    (edition) => {
      if (busy) return;
      // Match the live book's page size so the type sets identically — no reflow.
      const r = bookRef.current?.pageFlip?.()?.getBoundsRect?.();
      const w = Math.round(r?.pageWidth || 460);
      const h = Math.round(r?.height || w * PAGE_RATIO);
      setPrintSize({ w, h, fs: +(w * 0.0335).toFixed(2) });
      setBusy(true);
      setPrintEdition(edition);
    },
    [busy]
  );

  // Render the queued edition off-screen, then rasterise it into a one-page PDF.
  useEffect(() => {
    if (!printEdition) return;
    let cancelled = false;
    (async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 180)); // let layout & SVGs settle
        if (cancelled || !printRef.current) return;
        const [htmlToImage, jspdf] = await Promise.all([
          import("html-to-image"),
          import("jspdf"),
        ]);
        const JsPDF = jspdf.jsPDF || jspdf.default;
        // Flatten each book page to its own PDF page. html-to-image renders
        // through the browser's own engine (SVG foreignObject), so justified
        // text, small-caps and hyphenation come out exactly as in the book —
        // unlike a re-typesetting rasteriser.
        const leaves = printRef.current.querySelectorAll(".pdf-page");
        // Embed the web fonts once and reuse across pages (much faster).
        const fontEmbedCSS = await htmlToImage
          .getFontEmbedCSS(printRef.current)
          .catch(() => undefined);
        let pdf = null;
        for (const el of leaves) {
          const canvas = await htmlToImage.toCanvas(el, {
            pixelRatio: 2,
            backgroundColor: "#f2ead6",
            fontEmbedCSS,
          });
          if (cancelled) return;
          const w = canvas.width / 2;
          const h = canvas.height / 2;
          if (!pdf) {
            pdf = new JsPDF({ orientation: "p", unit: "px", format: [w, h], hotfixes: ["px_scaling"] });
          } else {
            pdf.addPage([w, h], "p");
          }
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
        }
        if (pdf) pdf.save(printEdition.fileName);
      } catch (e) {
        console.error("Chronicle PDF export failed:", e);
      } finally {
        if (!cancelled) {
          setBusy(false);
          setPrintEdition(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [printEdition]);

  const onFlip = useCallback((e) => {
    lastPageRef.current = e.data;
    setPage(e.data);
  }, []);

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
      const count = pf.getPageCount();
      setPageCount(count);
      // After a portrait↔landscape remount, jump straight back to the page the
      // reader was on (no animation) so the switch is seamless.
      const want = lastPageRef.current || 0;
      if (want > 0 && count > 0 && typeof pf.turnToPage === "function") {
        pf.turnToPage(Math.min(want, count - 1));
      }
      setPage(pf.getCurrentPageIndex?.() ?? want);
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
  const pages = useMemo(() => editionBookPages(currentEdition), [currentEdition]);

  const total = pageCount || 6;
  const indicator =
    page <= 0
      ? "Front Page"
      : page >= total - 1
      ? "Back Page"
      : fit?.portrait
      ? `Page ${page + 1}`
      : `Pages ${page}–${page + 1}`;

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
      <div ref={areaRef} className="book-area relative z-10 flex-1 min-h-0 flex items-center justify-center px-2 sm:px-4">
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
              // Remount on the portrait↔landscape switch so StPageFlip rebuilds
              // its geometry from scratch instead of mutating stale bounds (the
              // page is restored in onInit). Same-mode resizes re-lay-out in
              // place via update() — see the effect above.
              key={fit.portrait ? "portrait" : "landscape"}
              ref={bookRef}
              width={445}
              height={602}
              size="stretch"
              minWidth={MIN_PAGE_W}
              maxWidth={MAX_PAGE_W}
              minHeight={Math.round(MIN_PAGE_W * PAGE_RATIO)}
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

          <span className="book-rail-sep" aria-hidden="true" />

          <button type="button" className="book-btn book-btn--rail" onClick={() => downloadEdition(currentEdition)} disabled={busy} aria-label="Download this edition as a PDF">
            <span style={{ width: "0.8rem", height: "0.8rem", display: "inline-flex" }}>
              <DownloadIcon />
            </span>
            {busy ? "…" : "PDF"}
          </button>
          <button type="button" className="book-btn book-btn--rail" onClick={() => setArchivesOpen(true)} aria-label="Open the archive of past editions">
            <span style={{ width: "0.8rem", height: "0.8rem", display: "inline-flex" }}>
              <ArchiveIcon />
            </span>
            Archive
          </button>
        </aside>
      )}

      {/* Off-screen flat copies of the book pages, rendered only while
          exporting — each becomes one flattened page in the PDF */}
      <div
        ref={printRef}
        aria-hidden="true"
        style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none", zIndex: -1 }}
      >
        {printEdition &&
          editionBookPages(printEdition).map((pg, i) => (
            <div
              className="pdf-page newspaper"
              key={i}
              style={{ width: `${printSize.w}px`, height: `${printSize.h}px`, "--print-fs": `${printSize.fs}px` }}
            >
              {pg}
            </div>
          ))}
      </div>

      {/* Archive — every edition since launch, one-click PDFs */}
      {archivesOpen && (
        <div className="archive-overlay" role="dialog" aria-modal="true" onClick={() => setArchivesOpen(false)}>
          <div className="archive-panel newspaper" onClick={(e) => e.stopPropagation()}>
            <button className="archive-close" onClick={() => setArchivesOpen(false)} aria-label="Close archive">
              ×
            </button>
            <p className="archive-kicker">The BioLoom Chronicle</p>
            <h2 className="archive-title">The Archive</h2>
            <p className="archive-sub">This month onward · one-click PDF{busy ? " · setting the type…" : ""}</p>
            <div className="archive-rule" />
            <div className="archive-scroll">
              {archiveYears.map((yr) => (
                <div key={yr.year} className="archive-year">
                  <h3 className="archive-year-label">{yr.year}</h3>
                  <div className="archive-grid">
                    {yr.months.map((m) => {
                      const isCurrent = yr.year === today.getFullYear() && m === today.getMonth();
                      const has = isCurrent ? !currentEdition.empty : monthsWithItems.has(`${yr.year}-${m}`);
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`archive-month${has ? " has-items" : ""}${isCurrent ? " is-current" : ""}`}
                          disabled={busy}
                          onClick={() => downloadEdition(isCurrent ? currentEdition : editionForMonth(items, yr.year, m))}
                          title={`${MONTH_NAMES[m]} ${yr.year}${isCurrent ? " — current edition" : has ? " — has dispatches" : ""}`}
                        >
                          <span>{MONTH_ABBR[m]}</span>
                          <span className="archive-dl">
                            <DownloadIcon />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
