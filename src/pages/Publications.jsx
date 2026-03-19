// src/pages/Publications.jsx
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";

// Path data from bioloom.svg, potrace coordinate transform
const _PT = "translate(0,239) scale(0.1,-0.1)";
const _FABRIC_D = "M535 924 c-71 -7 -189 -22 -262 -34 -73 -11 -137 -20 -142 -20 -6 0 -15 -9 -21 -21 -19 -34 2 -46 98 -54 93 -7 258 -41 267 -55 3 -5 -21 -17 -52 -27 -45 -14 -59 -23 -61 -40 -6 -40 24 -43 140 -13 l107 28 68 -47 c105 -74 105 -76 31 -98 -56 -16 -63 -22 -66 -46 -5 -43 27 -43 169 -1 18 5 156 -162 144 -174 -3 -4 -25 -14 -48 -22 -33 -12 -43 -21 -45 -42 -4 -35 22 -43 78 -23 67 24 76 21 121 -47 57 -85 99 -128 125 -128 38 0 41 37 6 74 -34 36 -92 120 -92 134 0 5 45 17 99 26 l100 18 79 -81 c81 -82 120 -103 147 -81 25 21 17 36 -39 79 -112 87 -108 95 55 106 l97 7 53 -42 c91 -72 158 -93 173 -54 9 24 -4 42 -37 54 -18 5 -45 21 -62 34 l-30 24 44 9 c52 10 72 33 51 58 -14 17 -76 16 -146 -1 -17 -4 -32 4 -63 35 -52 52 -51 59 5 63 113 7 79 68 -37 68 l-79 0 -25 40 c-31 49 -31 48 6 52 77 8 58 68 -22 68 -44 0 -51 4 -91 46 -74 79 -186 107 -538 134 -154 11 -135 12 -305 -6z m293 -94 c70 -30 66 -37 -25 -45 -43 -4 -103 -10 -133 -15 -39 -5 -62 -4 -80 5 -14 7 -56 22 -93 35 -81 26 -80 29 15 40 125 14 256 6 316 -20z m299 -5 c187 -27 237 -62 72 -51 -130 9 -171 18 -205 45 l-27 21 26 0 c15 0 75 -7 134 -15z m-68 -161 c29 -31 51 -58 49 -59 -2 -2 -58 -9 -126 -15 l-122 -12 -63 58 c-34 31 -63 61 -65 65 -4 9 58 14 189 17 l87 2 51 -56z m222 30 l87 -6 21 -38 c11 -21 21 -40 21 -44 0 -3 -47 -6 -104 -6 l-104 0 -36 50 c-44 61 -44 64 -3 57 17 -3 71 -9 118 -13z m-109 -181 c20 -24 78 -121 78 -131 0 -5 -35 -14 -77 -21 -43 -7 -89 -14 -103 -17 -22 -5 -34 5 -89 76 -73 94 -73 92 22 100 129 12 153 11 169 -7z m285 9 c12 -4 40 -30 62 -59 l41 -51 -37 -6 c-21 -3 -72 -8 -113 -11 l-75 -6 -29 48 c-17 26 -36 58 -44 71 l-14 22 93 -1 c52 -1 104 -4 116 -7z";
const _PLANT_D = "M1030 2332 c-291 -106 -445 -404 -346 -672 14 -38 15 -52 4 -92 -17 -68 -24 -60 -31 35 -19 267 -183 435 -458 469 -153 19 -186 -13 -157 -152 60 -284 210 -427 471 -447 l78 -6 15 -36 c31 -73 43 -150 49 -324 l7 -177 -44 0 c-143 -1 -496 -58 -509 -82 -18 -33 5 -45 99 -53 93 -7 258 -41 267 -55 3 -5 -20 -17 -52 -27 -101 -32 -82 -46 53 -39 138 6 120 6 209 -1 63 -4 68 -3 56 11 -20 24 -16 25 130 32 l134 6 24 -26 c29 -31 136 -42 111 -11 -7 9 -11 17 -9 20 8 8 234 -18 241 -28 9 -15 140 1 158 19 26 26 0 48 -61 54 -49 4 -59 10 -94 48 -67 75 -216 112 -512 129 l-102 6 -5 36 c-47 323 -3 609 100 646 240 85 354 255 354 525 -1 217 -28 247 -180 192z m-202 -1502 c70 -30 66 -37 -25 -45 -43 -4 -103 -10 -133 -15 -39 -5 -62 -4 -80 5 -14 7 -56 22 -93 35 -81 26 -80 29 15 40 125 14 256 6 316 -20z m299 -5 c187 -27 237 -62 72 -51 -130 9 -171 18 -205 45 l-27 21 26 0 c15 0 75 -7 134 -15z";
const _PEOPLE_DS = [
  "M660 1570 c0 -29 3 -50 7 -46 7 7 5 87 -3 95 -2 2 -4 -20 -4 -49z",
  "M864 1546 c-58 -49 -20 -146 57 -146 70 0 106 94 54 145 -31 32 -75 32 -111 1z",
  "M871 1366 c-45 -25 -50 -49 -51 -243 l0 -182 -27 -3 c-16 -3 8 -5 51 -6 44 -1 99 -4 123 -8 l43 -6 0 205 0 205 -31 26 c-33 28 -71 33 -108 12z",
  "M1093 1320 c-46 -19 -55 -69 -18 -105 58 -59 152 21 98 83 -22 25 -51 33 -80 22z",
  "M1067 1160 c-26 -21 -27 -24 -27 -130 0 -78 -4 -110 -12 -112 -7 -3 21 -8 63 -11 42 -4 83 -9 93 -13 26 -10 24 236 -3 260 -31 28 -82 31 -114 6z",
];
const _TEXT_DS = [
  "M2775 1688 c-63 -37 -59 -112 8 -137 50 -19 97 16 97 72 0 51 -63 90 -105 65z",
  "M3395 1686 c-250 -61 -406 -326 -340 -579 138 -531 925 -426 925 123 0 316 -276 531 -585 456z m238 -132 c230 -75 287 -416 98 -586 -225 -203 -562 -33 -549 277 10 245 215 385 451 309z",
  "M5173 1685 c-450 -122 -469 -768 -26 -905 283 -87 570 90 614 380 51 336 -259 613 -588 525z m263 -140 c210 -94 260 -397 93 -564 -162 -162 -430 -118 -531 87 -145 294 144 608 438 477z",
  "M6231 1685 c-454 -128 -455 -794 -1 -911 431 -110 764 358 517 727 -103 156 -330 236 -516 184z m276 -146 c120 -58 183 -164 183 -309 0 -404 -556 -481 -656 -91 -74 290 207 528 473 400z",
  "M7010 1681 c-15 -30 -14 -883 2 -899 16 -16 103 -15 117 1 7 9 12 113 13 313 l3 300 140 -170 c174 -212 143 -212 316 0 l144 177 5 -314 5 -314 60 0 60 0 3 458 c3 578 31 554 -250 215 -213 -260 -151 -262 -384 17 -196 235 -214 252 -234 216z",
  "M1932 1682 c-10 -7 -12 -105 -10 -458 l3 -449 160 -3 c248 -4 359 21 429 98 102 113 61 324 -71 364 -22 7 -21 9 19 39 136 104 105 315 -54 381 -76 31 -437 52 -476 28z m407 -144 c171 -85 68 -242 -159 -243 l-125 0 -3 124 c-1 69 0 131 3 139 9 25 225 9 284 -20z m2 -379 c213 -72 100 -263 -156 -264 l-130 0 -3 138 -3 137 129 0 c71 0 144 -5 163 -11z",
  "M4172 1682 c-10 -7 -12 -105 -10 -458 l3 -449 275 0 275 0 3 54 c4 72 9 71 -225 71 l-203 0 0 389 c0 432 5 401 -68 401 -20 0 -43 -4 -50 -8z",
  "M2755 1445 l-25 -24 0 -326 0 -325 75 0 75 0 0 329 0 330 -26 20 c-35 28 -69 26 -99 -4z",
];

// Looping logo: layers enter sequentially (like About page), then ALL exit together.
// Cycle: 4.2s total. Entrance stagger 0–1.3s. All visible 1.7–2.7s. All exit 2.7–3.1s. Gap 3.1–4.2s.
const _CYCLE = 4.2;
const _ENTER = [0.15, 0.6, 1.05, 1.5]; // when each layer starts fading in (fabric gets a small offset so it visibly fades in)
const _ENTER_DUR = 0.35;               // how long the fade-in takes
const _EXIT_START = 2.8;               // all layers start fading out together
const _EXIT_END = 3.2;                 // all layers fully gone

function _loopTransition(idx) {
  const s = _ENTER[idx];
  const f = s + _ENTER_DUR;
  return {
    duration: _CYCLE,
    repeat: Infinity,
    ease: "easeInOut",
    times: [0, s / _CYCLE, f / _CYCLE, _EXIT_START / _CYCLE, _EXIT_END / _CYCLE, 1],
  };
}
function _loopOpacity() {
  return [0, 0, 1, 1, 0, 0];
}
function _loopX() {
  return [-18, -18, 0, 0, 18, 18];
}

function BioloomLoading() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 800 239"
        style={{ height: "90px", width: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g animate={{ opacity: _loopOpacity(), x: _loopX() }} transition={_loopTransition(0)}>
          <g transform={_PT} fill="#10b981" stroke="none"><path d={_FABRIC_D} /></g>
        </motion.g>
        <motion.g animate={{ opacity: _loopOpacity(), x: _loopX() }} transition={_loopTransition(1)}>
          <g transform={_PT} fill="#10b981" stroke="none"><path d={_PLANT_D} /></g>
        </motion.g>
        <motion.g animate={{ opacity: _loopOpacity(), x: _loopX() }} transition={_loopTransition(2)}>
          <g transform={_PT} fill="#a7f3d0" stroke="none">{_PEOPLE_DS.map((d, i) => <path key={i} d={d} />)}</g>
        </motion.g>
        <motion.g animate={{ opacity: _loopOpacity(), x: _loopX() }} transition={_loopTransition(3)}>
          <g transform={_PT} fill="#a7f3d0" stroke="none">{_TEXT_DS.map((d, i) => <path key={i} d={d} />)}</g>
        </motion.g>
      </svg>
      <p className="text-sm tracking-wide uppercase text-white/60">
        Loading publications…
      </p>
    </div>
  );
}

// ---------- CARD COMPONENT ----------

function PubItem({
  title,
  authorsText,
  journal,
  journalUrl,
  year,
  abstractText,
  link,
  labAuthorNames,
  citations,
  appearOrder = 0,
}) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState("auto");
  const innerRef = useRef(null);

  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false); // reveal-on-mount

  const isInteractive = !!abstractText;

  // Detect if the device actually supports hover (desktop/laptop with mouse)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");

    const update = (ev) => {
      setHoverEnabled(ev.matches);
    };

    setHoverEnabled(mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener("change", update);
    } else if (mq.addListener) {
      mq.addListener(update);
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", update);
      } else if (mq.removeListener) {
        mq.removeListener(update);
      }
    };
  }, []);

  // Measure content height to animate smoothly
  useLayoutEffect(() => {
    if (!innerRef.current || !isInteractive) {
      setHeight("auto");
      return;
    }

    if (expanded) {
      const fullHeight = innerRef.current.scrollHeight;
      setHeight(fullHeight + "px");
    } else {
      const headerEl = innerRef.current.firstChild; // wrapper containing image + header
      const collapsedHeight = headerEl
        ? headerEl.scrollHeight
        : innerRef.current.scrollHeight;
      setHeight(collapsedHeight + "px");
    }
  }, [expanded, isInteractive]);

  // Staggered fade-in / slide-up animation on mount
  useEffect(() => {
    if (hasAppeared) return;

    const stagger = 15;
    const delay = appearOrder * stagger;

    const timer = setTimeout(() => {
      setHasAppeared(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [appearOrder, hasAppeared]);

  function handleClick() {
    if (!isInteractive) return;
    setExpanded((v) => !v);
  }

  function handleMouseEnter() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(true);
  }

  function handleMouseLeave() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(false);
  }

  const articleClassName = [
    "rounded-2xl",
    "border",
    "border-white/10",
    // keep a subtle translucent background, but no backdrop blur
    "bg-white/5",
    "overflow-hidden",
    "transform-gpu", // fine to keep transforms now
    isInteractive ? "cursor-pointer" : "cursor-default",
    expanded
      ? "scale-[1.015] shadow-xl shadow-brand-900/40 border-brand-300/50"
      : "scale-100",
    hasAppeared ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
  ].join(" ");

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={articleClassName}
      style={{
        height: isInteractive ? height : "auto",
        transition:
          "height 220ms ease, transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
      }}
    >
      <div ref={innerRef}>
        <header className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {/* Title + journal pill */}
            <h3 className="font-semibold text-white flex flex-wrap items-center gap-2">
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline decoration-emerald-300/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  {title}
                </a>
              ) : (
                title
              )}
              {journal && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-emerald-100">
                  {journalUrl ? (
                    <a
                      href={journalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline flex items-center gap-1"
                    >
                      <span className="truncate max-w-[10rem]">{journal}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="truncate max-w-[10rem]">{journal}</span>
                  )}
                </span>
              )}
            </h3>

            {/* Authors + year */}
            <div className={["mt-1 text-sm text-white/70", expanded ? "" : "line-clamp-2"].join(" ")}>
              {authorsText}
              {year && <> · {year}</>}
            </div>

            {/* Citation count */}
            {citations > 0 && (
              <div className="mt-1 text-xs text-white/50">
                {citations.toLocaleString()} citation{citations !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Lab authors */}
          {labAuthorNames && labAuthorNames.length > 0 && (
            <div className="md:ml-4 mt-1 md:mt-0 min-w-[160px]">
              <div className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white/70">
                <span className="block font-semibold text-[11px] tracking-wide uppercase text-white/50 mb-1">
                  Lab authors
                </span>
                <div className="flex flex-wrap gap-1">
                  {labAuthorNames.map((name) => (
                    <span key={name} className="pill text-[11px] px-2 py-0.5 bg-white/10 border-white/25">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Expanding abstract */}
        {abstractText && (
          <div
            className={[
              "px-6 pb-6 text-sm text-white/80 leading-relaxed transition-all duration-300",
              expanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none",
            ].join(" ")}
          >
            {abstractText}
          </div>
        )}
      </div>
    </article>
  );
}

// ---------- MAIN PAGE ----------

export default function Publications() {
  const location = useLocation();
  const [pubs, setPubs] = useState([]);
  const [labAuthorNames, setLabAuthorNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("search") || "";
  });
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const lastLocationSearchRef = useRef(location.search);

  // Sync ?search= query param from other pages
  useEffect(() => {
    if (location.search === lastLocationSearchRef.current) return;
    lastLocationSearchRef.current = location.search;
    setSearch(new URLSearchParams(location.search).get("search") || "");
  }, [location.search]);

  // ---------- LOAD scholar-publications.json ----------

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Lab member names from scholar_authors.jsonc (for highlighting)
        const authorConfig = await fetchJSONC("/scholar_authors.jsonc");
        const labNames = (authorConfig || []).map((a) => a.name).filter(Boolean);
        setLabAuthorNames(labNames);
        const labNameSet = new Set(labNames.map((n) => n.toLowerCase()));

        // Static pre-fetched publications
        const res = await fetch("/scholar-publications.json");
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("json")) {
          setError(
            "No publications found. Run: python scripts/fetch_scholar.py"
          );
          return;
        }
        const data = await res.json();

        // Match a paper author string against a known full lab name.
        // Handles "S. Pironon" → "Samuel Pironon" and exact matches.
        // Returns the canonical lab name if matched, otherwise null.
        function matchLabAuthor(paperAuthor, labName) {
          const pa = paperAuthor.trim().split(/\s+/);
          const la = labName.trim().split(/\s+/);
          // Last names must match exactly (case-insensitive)
          const paLast = pa[pa.length - 1].toLowerCase();
          const laLast = la[la.length - 1].toLowerCase();
          if (paLast !== laLast) return null;
          // First name: exact, or abbreviated (e.g. "S." or "S" matches "Samuel")
          const paFirst = pa[0].toLowerCase().replace(/\./g, "");
          const laFirst = la[0].toLowerCase();
          if (paFirst === laFirst) return labName;
          if (paFirst.length === 1 && laFirst.startsWith(paFirst)) return labName;
          return null;
        }

        const pubsArray = data
          .filter((p) => !!p.year) // drop entries with no year (catches garbled/supplementary items)
          .map((p, i) => {
            const authors = Array.isArray(p.authors) ? p.authors : [];
            const labInPaper = [];

            // Normalise author list — replace abbreviated lab names with full names
            const normalisedAuthors = authors.map((a) => {
              for (const ln of labNames) {
                if (matchLabAuthor(a, ln)) return ln;
              }
              return a;
            });

            // Collect unique matched lab authors from normalised list
            normalisedAuthors.forEach((a) => {
              if (labNameSet.has(a.toLowerCase()) && !labInPaper.includes(a)) {
                labInPaper.push(a);
              }
            });

            // Always credit the lab member whose Scholar page this came from —
            // some papers list them under initials or a variant not caught above
            const fetchedFor = p._fetched_for;
            if (fetchedFor && labNames.includes(fetchedFor) && !labInPaper.includes(fetchedFor)) {
              labInPaper.push(fetchedFor);
            }

            return {
              id: `scholar-${i}`,
              title: p.title || "Untitled",
              year: p.year || null,
              journal: p.journal || "",
              journalUrl: p.url || "",
              link: p.url || "",
              abstractText: p.abstract || "",
              authorsText: normalisedAuthors.join(", "),
              labAuthorNames: labInPaper,
              citations: p.citations || 0,
            };
          });

        setPubs(pubsArray);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load publications");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------- FILTER OPTIONS ----------

  const authorOptions = useMemo(() => {
    const countMap = new Map();
    pubs.forEach((p) =>
      (p.labAuthorNames || []).forEach((n) =>
        countMap.set(n, (countMap.get(n) || 0) + 1)
      )
    );
    return labAuthorNames.map((name) => ({
      value: name,
      label: name,
      count: countMap.get(name) || 0,
    }));
  }, [labAuthorNames, pubs]);

  const minYear = useMemo(
    () => (pubs.length ? Math.min(...pubs.map((p) => p.year || Infinity)) : ""),
    [pubs]
  );
  const maxYear = useMemo(
    () => (pubs.length ? Math.max(...pubs.map((p) => p.year || -Infinity)) : ""),
    [pubs]
  );

  // ---------- FILTERING ----------

  const filteredPubs = useMemo(() => {
    const s = search.trim().toLowerCase();
    const yf = yearFrom ? Number(yearFrom) : null;
    const yt = yearTo ? Number(yearTo) : null;

    return pubs.filter((p) => {
      if (s) {
        const haystack = [p.title, p.abstractText, p.journal, p.authorsText]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      if (authorFilter) {
        if (!(p.labAuthorNames || []).includes(authorFilter)) return false;
      }
      if (yf !== null && (!p.year || p.year < yf)) return false;
      if (yt !== null && (!p.year || p.year > yt)) return false;
      return true;
    });
  }, [pubs, search, authorFilter, yearFrom, yearTo]);

  const orderIndexById = useMemo(() => {
    const map = new Map();
    filteredPubs.forEach((p, idx) => map.set(p.id, idx));
    return map;
  }, [filteredPubs]);

  function clearFilters() {
    setSearch("");
    setAuthorFilter("");
    setYearFrom("");
    setYearTo("");
  }

  // Group by year
  const groupedByYear = [];
  let currentYear = null;
  filteredPubs.forEach((p) => {
    const y = p.year || "No year";
    if (y !== currentYear) {
      groupedByYear.push({ year: y, items: [p] });
      currentYear = y;
    } else {
      groupedByYear[groupedByYear.length - 1].items.push(p);
    }
  });

  // ---------- RENDER ----------

  return (
    <section className="section">
      <h2 className="h2-grad">Publications</h2>

      {/* Filters */}
      <div className="mt-6 glass rounded-2xl p-4 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm mb-1 text-white/70">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, author, journal…"
            className="input-glass"
          />
        </div>

        {authorOptions.length > 0 && (
          <div className="min-w-[200px]">
            <label className="block text-sm mb-1 text-white/70">Author</label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="select-glass"
            >
              <option value="">All authors ({pubs.length})</option>
              {authorOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label} ({a.count})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <div>
            <label className="block text-sm mb-1 text-white/70">
              From {minYear && `(${minYear})`}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="input-glass w-24"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/70">
              To {maxYear && `(${maxYear})`}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="input-glass w-24"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="btn-secondary text-sm px-4 py-2"
        >
          Clear
        </button>
      </div>

      {loading && <BioloomLoading />}
      {error && <p className="mt-6 text-red-300">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-4 text-sm text-white/60">
            Showing{" "}
            <span className="font-semibold text-brand-300">{filteredPubs.length}</span>{" "}
            of {pubs.length} publications
          </p>

          <div className="mt-6">
            {groupedByYear.map((group) => (
              <div key={group.year} className="mb-6">
                <h3 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">
                  {group.year}
                </h3>
                <div className="list-vertical">
                  {group.items.map((p) => (
                    <PubItem
                      key={p.id}
                      {...p}
                      appearOrder={orderIndexById.get(p.id) ?? 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
