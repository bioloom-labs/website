import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExternalLink } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = parseDate(value);
  if (!d) return "Date TBA";
  return dateFormatter.format(d);
}

function LoadingPen({ label = "Loading news…" }) {
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

      <p className="text-sm tracking-wide uppercase text-white/60">{label}</p>
    </div>
  );
}

function NewsCard({ item, status = "past", appearOrder = 0 }) {
  const {
    title,
    text,
    link,
    formattedDate,
    dateObj,
    thumbnail,
    tags = [],
  } = item;
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState("auto");
  const innerRef = useRef(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  const chips = [
    status === "upcoming" ? "Upcoming" : "Recent",
    ...(Array.isArray(tags) ? tags : []),
  ].filter(Boolean);
  const hasLink = Boolean(link);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handler = (ev) => setHoverEnabled(ev.matches);
    setHoverEnabled(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, []);

  useLayoutEffect(() => {
    if (!innerRef.current) {
      setHeight("auto");
      return;
    }
    if (expanded) {
      setHeight(innerRef.current.scrollHeight + "px");
    } else {
      const firstChild = innerRef.current.firstChild;
      const collapsed = firstChild
        ? firstChild.scrollHeight
        : innerRef.current.scrollHeight;
      setHeight(collapsed + "px");
    }
  }, [expanded, text, hasLink, chips.length]);

  useEffect(() => {
    if (hasAppeared) return;
    const delay = appearOrder * 20;
    const timer = setTimeout(() => setHasAppeared(true), delay);
    return () => clearTimeout(timer);
  }, [appearOrder, hasAppeared]);

  const isInteractive = Boolean(text || hasLink);
  const cardClass = [
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/5",
    "backdrop-blur",
    "overflow-hidden",
    "transform-gpu",
    isInteractive ? "cursor-pointer" : "cursor-default",
    expanded
      ? "scale-[1.015] shadow-xl shadow-brand-900/40 border-brand-300/60"
      : "scale-100",
    hasAppeared ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
  ].join(" ");

  const statusAccent =
    status === "upcoming"
      ? "text-emerald-300 bg-emerald-400/10 border-emerald-300/40"
      : "text-brand-200 bg-brand-300/10 border-brand-200/40";

  function handleClick() {
    if (!isInteractive) return;
    setExpanded((prev) => !prev);
  }

  function handleMouseEnter() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(true);
  }

  function handleMouseLeave() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(false);
  }

  return (
    <article
      className={cardClass}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        height: isInteractive ? height : "auto",
        transition:
          "height 220ms ease, transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
      }}
      aria-expanded={isInteractive ? expanded : undefined}
    >
      <div ref={innerRef}>
        <div className="px-6 py-5 flex items-center gap-4">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="h-20 w-24 rounded-xl object-cover border border-white/10"
              loading="lazy"
              aria-hidden="true"
            />
          ) : (
            <div className="h-20 w-24 rounded-xl bg-gradient-to-br from-brand-500/40 to-emerald-400/20 border border-white/10 flex items-center justify-center text-sm font-medium text-white/70">
              {dateObj ? dateObj.toLocaleString("en-GB", { month: "short" }) : "-"}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span className="tracking-[0.2em] uppercase">{formattedDate}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {chips.map((chip, idx) => (
                  <span
                    key={`${chip}-${idx}`}
                    className={[
                      "pill text-[0.7rem]",
                      idx === 0 ? statusAccent : "text-white/70 border-white/15",
                    ].join(" ")}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isInteractive && (
          <div
            className={[
              "px-6 pb-6 text-sm text-white/80 leading-relaxed",
              "transition-all duration-200",
              expanded
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none",
            ].join(" ")}
          >
            {text && <p>{text}</p>}
            {hasLink && (
              <a
                href={link}
                className="mt-3 inline-flex items-center gap-2 text-brand-200 hover:text-brand-100 transition"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Read more
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function NewsSection({ title, blurb, items = [], status, offset = 0 }) {
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <span className="pill text-xs text-white/70 bg-white/5 border-white/25">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        {blurb && <p className="mt-2 mb-2 text-sm text-white/70">{blurb}</p>}      </div>
      <div className="grid gap-5">
        {items.map((item, idx) => (
          <NewsCard
            key={item.id || `${item.title}-${idx}`}
            item={item}
            status={status}
            appearOrder={offset + idx}
          />
        ))}
      </div>
    </div>
  );
}

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingItems = [];
    const pastItems = [];

    (items || []).forEach((item, idx) => {
      const dateObj = parseDate(item.date);
      const enriched = {
        ...item,
        dateObj,
        formattedDate: formatDate(item.date),
        id: item.id || `${item.title || "news"}-${idx}`,
      };
      if (dateObj && dateObj >= today) {
        upcomingItems.push(enriched);
      } else {
        pastItems.push(enriched);
      }
    });

    upcomingItems.sort((a, b) => {
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return a.dateObj - b.dateObj;
    });

    pastItems.sort((a, b) => {
      if (!a.dateObj && !b.dateObj) return 0;
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return b.dateObj - a.dateObj;
    });

    return { upcoming: upcomingItems, past: pastItems };
  }, [items]);

  return (
    <section className="section">
      <div className="max-w-3xl">
        <h2 className="h2-grad">News & Updates</h2>
        <p className="mt-3 text-white/80">
          Follow what BioLoom Labs is preparing next and catch up on recent
          highlights, publications, and events.
        </p>
      </div>

      {error && (
        <p className="mt-6 text-red-300">
          Unable to load news right now: {error}
        </p>
      )}

      {loading ? (
        <LoadingPen label="Gathering the latest…" />
      ) : (
        <div className="mt-10 space-y-12">
          <NewsSection
            title="Upcoming events & launches"
            blurb="Mark your calendar for upcoming talks, releases, and opportunities."
            items={upcoming}
            status="upcoming"
            offset={0}
          />
          <NewsSection
            title="Recent highlights"
            blurb="Past activities, announcements, and milestones from the lab."
            items={past}
            status="past"
            offset={upcoming.length}
          />
          {!upcoming.length && !past.length && (
            <p className="text-sm text-white/60">No news items yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
