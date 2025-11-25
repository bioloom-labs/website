// src/pages/Publications.jsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { ExternalLink } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";

// 🔧 Put YOUR email here so OpenAlex can contact you if needed
const OPENALEX_MAILTO = "your-email@example.com";

// Reconstruct abstract from abstract_inverted_index
function reconstructAbstract(inverted) {
  if (!inverted || typeof inverted !== "object") return "";
  const entries = Object.entries(inverted);
  if (entries.length === 0) return "";

  const positionToWord = [];
  for (const [word, positions] of entries) {
    positions.forEach((pos) => {
      positionToWord[pos] = word;
    });
  }
  return positionToWord
    .map((w) => (w === null || w === undefined ? "" : w))
    .join(" ")
    .trim();
}

// Map OpenAlex type -> nice label (colour handled later)
function getTypeLabel(rawType) {
  const t = (rawType || "").toLowerCase();

  switch (t) {
    case "journal-article":
      return "Article";
    case "review-article":
    case "review":
      return "Review";
    case "dataset":
      return "Dataset";
    case "book-chapter":
      return "Book chapter";
    case "proceedings-article":
      return "Conference article";
    case "report":
      return "Report";
    default: {
      if (!t) return "Other";
      const pretty = t
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return pretty;
    }
  }
}

function LoadingPen() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 text-white/70">
      <div className="pen-loading-wrapper">
        <svg
          viewBox="0 0 260 70"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 40 C 40 10, 80 10, 110 40 S 180 70, 230 40"
            className="pen-path"
            fill="none"
            stroke="rgba(45, 212, 191, 0.9)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-sm tracking-wide uppercase text-white/60">
        Loading publications…
      </p>
    </div>
  );
}

// Normalise DOI into a stable key (remove doi.org, doi:, lowercase)
function normalizeDoi(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  s = s.replace(/^doi:/i, "");
  return s.toLowerCase();
}

// Normalise title for deduplication (case-insensitive, strip punctuation/extra spaces)
function makeTitleKey(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Turn a normalised DOI into a safe thumbnail path under /public/thumbs/
function doiToThumbPath(normalizedDoi) {
  if (!normalizedDoi) return "";
  const safe = normalizedDoi.replace(/[^a-z0-9]+/gi, "_");
  // This will resolve to /public/thumbs/<safe>.jpg in a Vite/React app
  return `/thumbs/${safe}.jpg`;
}

// ---------- CARD COMPONENT ----------

function PubItem({
  title,
  authorsText,
  journal,
  journalUrl,
  year,
  abstractText,
  topic,
  subfield,
  field,
  domain,
  typeLabel,
  typeColorClass,
  link,
  labAuthorNames,
  thumbnailUrl, // derived from DOI
  appearOrder = 0, // used for staggered animation
}) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState("auto");
  const innerRef = useRef(null);

  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false); // reveal-on-mount

  // Only keep topic hierarchy in the chips (less noise)
  const chips = [topic, subfield, field, domain].filter(Boolean);
  const isInteractive = !!(abstractText || chips.length);

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
        {/* IMAGE + HEADER BLOCK (always visible) */}
        <div>
          {thumbnailUrl && (
            <div className="px-6 pt-6">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <img
                  src={thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          <header className="px-6 pb-4 pt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            {/* Left side: title + inline journal pill + authors + type */}
            <div className="min-w-0">
              {/* Title + DOI/journal pill inline */}
              <h3 className="font-semibold text-white flex flex-wrap items-center gap-2">
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline decoration-emerald-300/70"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {title}
                  </a>
                ) : (
                  title
                )}

                {journal && journalUrl && (
                  <a
                    href={journalUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-emerald-100 hover:border-emerald-300/70 hover:bg-emerald-400/15 transition"
                    title="Open article"
                  >
                    <span className="truncate max-w-[10rem]">{journal}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </h3>

              {/* Authors + year, clamped to 3 lines when collapsed */}
              <div
                className={[
                  "mt-1",
                  "text-sm",
                  "text-white/70",
                  expanded ? "" : "line-clamp-3",
                ].join(" ")}
              >
                {authorsText}
                {year && <> • {year}</>}
              </div>

              {/* Type with coloured dot */}
              {typeLabel && (
                <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                  <span
                    className={[
                      "inline-block",
                      "h-2",
                      "w-2",
                      "rounded-full",
                      typeColorClass || "bg-slate-400",
                    ].join(" ")}
                  />
                  <span>{typeLabel}</span>
                </div>
              )}
            </div>

            {/* Right side: special lab authors box */}
            {labAuthorNames && labAuthorNames.length > 0 && (
              <div className="md:ml-4 mt-1 md:mt-0 min-w-[180px]">
                <div className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white/70">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[11px] tracking-wide uppercase text-white/60">
                      Lab authors
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-400/20 text-emerald-100 px-2 py-0.5 text-[10px]">
                      {labAuthorNames.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {labAuthorNames.map((name) => (
                      <span
                        key={name}
                        className="pill text-[11px] px-2 py-0.5 bg-white/10 border-white/25"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </header>
        </div>

        {/* EXPANDING CONTENT: abstract + topic pills */}
        <div
          className={[
            "px-6",
            "pb-6",
            "transition-all",
            "duration-300",
            expanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none",
          ].join(" ")}
        >
          {abstractText && (
            <p className="text-sm text-white/80 leading-relaxed">
              {abstractText}
            </p>
          )}

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <li key={i} className="pill">
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

// ---------- MAIN PAGE ----------

export default function Publications() {
  const [labAuthors, setLabAuthors] = useState([]); // from JSONC
  const [pubs, setPubs] = useState([]); // flattened + normalised works
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState(""); // author.id (short OpenAlex ID)
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // type label

  // ---------- FETCH + DEDUPE (BY TITLE) + EDITS ----------

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const authors = await fetchJSONC("/openalex-authors.jsonc");
        setLabAuthors(authors || []);

        // Load edit config (may not exist)
        let edits = [];
        try {
          edits = await fetchJSONC("/edit-publications.jsonc");
        } catch {
          edits = [];
        }

        if (!authors || authors.length === 0) {
          setPubs([]);
          return;
        }

        const authorIds = authors.map((a) => a.id); // short IDs
        const labIdSet = new Set(authorIds);

        // Fetch works for each author
        const requests = authorIds.map(async (id) => {
          const maxWorks = authors.find((a) => a.id === id)?.max_works || 50;
          const url = new URL("https://api.openalex.org/works");
          url.searchParams.set(
            "filter",
            `authorships.author.id:${encodeURIComponent(id)}`
          );
          url.searchParams.set("sort", "publication_year:desc");
          url.searchParams.set("per-page", String(maxWorks));
          if (OPENALEX_MAILTO) {
            url.searchParams.set("mailto", OPENALEX_MAILTO);
          }

          const res = await fetch(url.toString());
          if (!res.ok) {
            throw new Error(`OpenAlex request failed for author ${id}`);
          }
          const data = await res.json();
          return data.results || [];
        });

        const worksByAuthor = await Promise.all(requests);
        const allWorks = worksByAuthor.flat();

        // Deduplicate primarily by title (fallback: OpenAlex ID)
        const workMap = new Map(); // key: titleKey || workId

        function chooseBetterWork(a, b) {
          // Prefer non-dataset over dataset
          const aType = (a.type || "").toLowerCase();
          const bType = (b.type || "").toLowerCase();
          const aIsDataset = aType === "dataset";
          const bIsDataset = bType === "dataset";
          if (aIsDataset && !bIsDataset) return b;
          if (bIsDataset && !aIsDataset) return a;

          // Prefer "journal" source
          const aSourceType = a.primary_location?.source?.type || "";
          const bSourceType = b.primary_location?.source?.type || "";
          const aIsJournal = aSourceType.toLowerCase().includes("journal");
          const bIsJournal = bSourceType.toLowerCase().includes("journal");
          if (aIsJournal && !bIsJournal) return a;
          if (bIsJournal && !aIsJournal) return b;

          // Prefer newer year
          const ay = a.publication_year || 0;
          const by = b.publication_year || 0;
          if (ay > by) return a;
          if (by > ay) return b;

          return a; // fallback
        }

        for (const w of allWorks) {
          if (!w || !w.id) continue;
          const titleKey = makeTitleKey(w.display_name);
          const key = titleKey || w.id;

          const existing = workMap.get(key);
          if (!existing) {
            workMap.set(key, w);
          } else {
            workMap.set(key, chooseBetterWork(existing, w));
          }
        }

        // Normalise deduped works into our pub objects
        let pubsArray = Array.from(workMap.values()).map((w) => {
          const allAuthors = (w.authorships || [])
            .map((au) => au.author?.display_name)
            .filter(Boolean);

          const workAuthorShortIds = (w.authorships || [])
            .map((au) => au.author?.id)
            .filter(Boolean)
            .map((full) => {
              const parts = String(full).split("/");
              return parts[parts.length - 1];
            });

          const workLabAuthorIds = workAuthorShortIds.filter((id) =>
            labIdSet.has(id)
          );

          const workLabAuthorNames = (w.authorships || [])
            .filter((au) => {
              const full = au.author?.id;
              if (!full) return false;
              const parts = String(full).split("/");
              const short = parts[parts.length - 1];
              return labIdSet.has(short);
            })
            .map((au) => au.author?.display_name)
            .filter(Boolean);

          // Abstract
          let abstractText =
            w.abstract ||
            reconstructAbstract(w.abstract_inverted_index) ||
            "";

          // Type label
          const typeLabel = getTypeLabel(w.type);

          // Remove abstracts for datasets
          if (typeLabel === "Dataset") {
            abstractText = "";
          }

          // Topic hierarchy
          const pt = w.primary_topic || null;
          const topic = pt?.display_name || "";
          const subfield = pt?.subfield?.display_name || "";
          const field = pt?.field?.display_name || "";
          const domain = pt?.domain?.display_name || "";

          const journalName =
            w.primary_location?.source?.display_name ||
            w.primary_location?.landing_page_url ||
            "";

          const doiNorm = w.doi ? normalizeDoi(w.doi) : "";

          const link =
            w.primary_location?.landing_page_url ||
            w.open_access?.oa_url ||
            (doiNorm ? `https://doi.org/${doiNorm}` : "") ||
            w.id;

          // Prefer DOI link for the inline journal pill
          let doiUrl = "";
          if (doiNorm) {
            doiUrl = `https://doi.org/${doiNorm}`;
          }

          const journalUrl = doiUrl || link;

          // Thumbnail URL derived from DOI
          const thumbnailUrl = doiNorm ? doiToThumbPath(doiNorm) : "";

          return {
            id: w.id,
            title: w.display_name || "Untitled",
            year: w.publication_year || null,
            journal: journalName,
            journalUrl,
            link,
            abstractText,
            allAuthors,
            authorsText: allAuthors.join(", "),
            labAuthorIds: workLabAuthorIds,
            labAuthorNames: workLabAuthorNames,
            topic,
            subfield,
            field,
            domain,
            rawType: w.type || "",
            typeLabel,
            doi: doiNorm,
            thumbnailUrl,
          };
        });

        // ---- APPLY EDITS (remove + add) ----
        const removeRules = (edits || []).filter(
          (e) => e && e.action === "remove"
        );
        const removeDoiSet = new Set(
          removeRules
            .map((e) => normalizeDoi(e.doi))
            .filter(Boolean)
        );

        if (removeDoiSet.size > 0) {
          pubsArray = pubsArray.filter((p) => {
            const key = normalizeDoi(p.doi);
            if (!key) return true;
            return !removeDoiSet.has(key);
          });
        }

        const addRules = (edits || []).filter((e) => e && e.action === "add");
        for (const e of addRules) {
          const doiNorm = normalizeDoi(e.doi || "");
          const typeLabel = getTypeLabel(e.type || e.rawType || "");
          const authorsArr = Array.isArray(e.authors) ? e.authors : [];

          const manualLink = (() => {
            if (e.link) return e.link;
            if (e.doi) {
              const s = String(e.doi).trim();
              if (s.startsWith("http")) return s;
              return `https://doi.org/${normalizeDoi(s)}`;
            }
            if (e.journalUrl) return e.journalUrl;
            return "";
          })();

          const manualJournalUrl = (() => {
            if (e.journalUrl) return e.journalUrl;
            if (e.doi) {
              const s = String(e.doi).trim();
              if (s.startsWith("http")) return s;
              return `https://doi.org/${normalizeDoi(s)}`;
            }
            return manualLink;
          })();

          const thumbnailUrl = doiNorm ? doiToThumbPath(doiNorm) : "";

          pubsArray.push({
            id:
              e.id ||
              `manual:${doiNorm || e.title || Math.random().toString(36).slice(2)
              }`,
            title: e.title || "Untitled",
            year: e.year || null,
            journal: e.journal || "",
            journalUrl: manualJournalUrl || "",
            link: manualLink || "",
            abstractText: e.abstractText || "",
            allAuthors: authorsArr,
            authorsText:
              authorsArr.length > 0
                ? authorsArr.join(", ")
                : e.authorsText || "",
            labAuthorIds: [],
            labAuthorNames: e.labAuthorNames || [],
            topic: e.topic || "",
            subfield: e.subfield || "",
            field: e.field || "",
            domain: e.domain || "",
            rawType: e.type || e.rawType || "",
            typeLabel,
            doi: doiNorm,
            thumbnailUrl,
          });
        }

        // Sort newest → oldest
        pubsArray.sort((a, b) => {
          const ay = a.year || 0;
          const by = b.year || 0;
          return by - ay;
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

  // ---------- DROPDOWN OPTIONS + COUNTS ----------

  const authorOptions = useMemo(() => {
    const countMap = new Map();
    pubs.forEach((p) => {
      (p.labAuthorIds || []).forEach((id) => {
        countMap.set(id, (countMap.get(id) || 0) + 1);
      });
    });

    return labAuthors.map((a) => {
      const id = a.id;
      const label = a.name || a.label || a.id;
      const count = countMap.get(id) || 0;
      return { value: id, label, count };
    });
  }, [labAuthors, pubs]);

  const typeOptions = useMemo(() => {
    const countMap = new Map();
    pubs.forEach((p) => {
      if (!p.typeLabel) return;
      countMap.set(p.typeLabel, (countMap.get(p.typeLabel) || 0) + 1);
    });

    return Array.from(countMap.entries())
      .map(([typeLabel, count]) => ({ typeLabel, count }))
      .sort((a, b) => a.typeLabel.localeCompare(b.typeLabel));
  }, [pubs]);

  // Dynamic colour mapping: one colour per typeLabel
  const typeColorMap = useMemo(() => {
    const palette = [
      "bg-emerald-400",
      "bg-purple-400",
      "bg-sky-400",
      "bg-amber-400",
      "bg-rose-400",
      "bg-cyan-400",
      "bg-lime-400",
      "bg-fuchsia-400",
      "bg-teal-400",
      "bg-indigo-400",
    ];

    const map = new Map();
    typeOptions.forEach((t, index) => {
      const colorClass = palette[index % palette.length];
      map.set(t.typeLabel, colorClass);
    });
    if (!map.has("Other")) {
      map.set("Other", "bg-slate-400");
    }
    return map;
  }, [typeOptions]);

  const minYear = useMemo(
    () =>
      pubs.length ? Math.min(...pubs.map((p) => p.year || Infinity)) : "",
    [pubs]
  );
  const maxYear = useMemo(
    () =>
      pubs.length ? Math.max(...pubs.map((p) => p.year || -Infinity)) : "",
    [pubs]
  );

  // ---------- FILTERING ----------

  const filteredPubs = useMemo(() => {
    const s = search.trim().toLowerCase();
    const yf = yearFrom ? Number(yearFrom) : null;
    const yt = yearTo ? Number(yearTo) : null;

    return pubs.filter((p) => {
      if (s) {
        const haystack = [
          p.title || "",
          p.abstractText || "",
          p.topic || "",
          p.subfield || "",
          p.field || "",
          p.domain || "",
          p.typeLabel || "",
          p.journal || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(s)) return false;
      }

      if (authorFilter) {
        if (!p.labAuthorIds || !p.labAuthorIds.includes(authorFilter)) {
          return false;
        }
      }

      if (typeFilter) {
        if (!p.typeLabel || p.typeLabel !== typeFilter) return false;
      }

      if (yf !== null) {
        if (!p.year || p.year < yf) return false;
      }
      if (yt !== null) {
        if (!p.year || p.year > yt) return false;
      }

      return true;
    });
  }, [pubs, search, authorFilter, typeFilter, yearFrom, yearTo]);

  // Map pub.id -> appearance order for staggered animation
  const orderIndexById = useMemo(() => {
    const map = new Map();
    filteredPubs.forEach((p, idx) => {
      map.set(p.id, idx);
    });
    return map;
  }, [filteredPubs]);

  function clearFilters() {
    setSearch("");
    setAuthorFilter("");
    setTypeFilter("");
    setYearFrom("");
    setYearTo("");
  }

  // Group filtered pubs by year for separators
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

      {/* Filters panel */}
      <div className="mt-6 glass rounded-2xl p-4 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm mb-1 text-white/70">
            Search (title, abstract, topic, type)
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="E.g. genetic diversity, dataset, review..."
            className="input-glass"
          />
        </div>

        {/* Author */}
        <div className="min-w-[220px]">
          <label className="block text-sm mb-1 text-white/70">
            Author
          </label>
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="select-glass"
          >
            <option value="">All lab authors ({pubs.length})</option>
            {authorOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} ({a.count})
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm mb-1 text-white/70">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-glass"
          >
            <option value="">All types ({pubs.length})</option>
            {typeOptions.map((t) => (
              <option key={t.typeLabel} value={t.typeLabel}>
                {t.typeLabel} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Year range */}
        <div className="flex gap-2">
          <div>
            <label className="block text-sm mb-1 text-white/70">
              From year {minYear && `(${minYear})`}
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
              To year {maxYear && `(${maxYear})`}
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

        {/* Clear */}
        <div className="flex md:flex-col gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="btn-secondary text-sm px-4 py-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Status + results */}
      {loading && <LoadingPen />}

      {error && <p className="mt-6 text-red-300">Error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-4 text-sm text-white/60">
            Showing{" "}
            <span className="font-semibold text-brand-300">
              {filteredPubs.length}
            </span>{" "}
            filtered works (total {pubs.length})
          </p>

          <div className="mt-6">
            {groupedByYear.map((group) => (
              <div key={group.year} className="mb-6">
                <h3 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">
                  {group.year || "No year"}
                </h3>
                <div className="list-vertical">
                  {group.items.map((p) => (
                    <PubItem
                      key={p.id}
                      {...p}
                      typeColorClass={
                        typeColorMap.get(p.typeLabel) || "bg-slate-400"
                      }
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
