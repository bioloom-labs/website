import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { fetchJSONC } from "../utils/jsonc.js";

/* ─── Date helpers ─── */

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ─── Loading state ─── */

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

/* ─── Single timeline entry ─── */

function NewsEntry({ item, index, isUpcoming = false, isLast = false }) {
  const { title, text, link, dateObj, tags = [] } = item;

  const day = dateObj ? dateObj.getDate() : "—";
  const month = dateObj
    ? dateObj.toLocaleString("en-GB", { month: "short" }).toUpperCase()
    : "";
  const year = dateObj ? dateObj.getFullYear() : "";

  return (
    <motion.article
      className="group grid grid-cols-[3.5rem_2px_1fr] md:grid-cols-[5rem_2px_1fr] gap-4 md:gap-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {/* Date column */}
      <div className="text-right pt-0.5">
        <span className="font-display text-3xl md:text-4xl text-white/80 leading-none">
          {day}
        </span>
        <div className="font-editorial text-[10px] tracking-[0.2em] text-white/40 mt-1">
          {month}
        </div>
        <div className="font-editorial text-xs text-white/25 mt-0.5">
          {year}
        </div>
      </div>

      {/* Timeline spine + dot */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div
          className={[
            "h-3 w-3 rounded-full border-2 border-brand-950 mt-2 z-10 shrink-0 transition-colors",
            isUpcoming
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : "bg-white/20 group-hover:bg-brand-300",
          ].join(" ")}
        />
        {/* Connecting line — hidden on last item */}
        {!isLast && <div className="flex-1 w-px bg-white/10" />}
      </div>

      {/* Content */}
      <div className={isLast ? "pb-0" : "pb-10"}>
        <h3 className="font-display text-xl md:text-[1.35rem] text-white/95 leading-snug">
          {title}
        </h3>

        {text && (
          <p className="mt-2 font-editorial text-base text-white/50 leading-relaxed">
            {text}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="pill text-[0.7rem] text-white/60 border-white/15"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-editorial text-sm text-brand-300/70 hover:text-brand-200 transition-colors"
          >
            Read more <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </motion.article>
  );
}

/* ─── Page ─── */

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
      {/* ─── Page header ─── */}
      <motion.div
        className="max-w-3xl mb-16 md:mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white/95 pb-1">
          News &amp; Updates
        </h2>
        <p className="mt-4 font-editorial text-lg text-white/45 max-w-xl leading-relaxed">
          Follow what BioLoom Labs is preparing next and catch up on recent
          highlights, publications, and events.
        </p>
      </motion.div>

      {error && (
        <p className="mt-6 text-red-300 font-editorial">
          Unable to load news right now: {error}
        </p>
      )}

      {loading ? (
        <LoadingPen label="Gathering the latest…" />
      ) : (
        <div className="max-w-3xl space-y-16">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <motion.h3
                className="font-editorial text-sm tracking-[0.2em] uppercase text-emerald-300/60 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Upcoming
              </motion.h3>
              {upcoming.map((item, i) => (
                <NewsEntry
                  key={item.id}
                  item={item}
                  index={i}
                  isUpcoming
                  isLast={i === upcoming.length - 1}
                />
              ))}
            </div>
          )}

          {/* Divider between sections */}
          {upcoming.length > 0 && past.length > 0 && (
            <div className="home-rule" />
          )}

          {/* Past / recent */}
          {past.length > 0 && (
            <div>
              <motion.h3
                className="font-editorial text-sm tracking-[0.2em] uppercase text-white/30 mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Recent
              </motion.h3>
              {past.map((item, i) => (
                <NewsEntry
                  key={item.id}
                  item={item}
                  index={i}
                  isLast={i === past.length - 1}
                />
              ))}
            </div>
          )}

          {!upcoming.length && !past.length && (
            <p className="font-editorial text-base text-white/40">
              No news items yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
