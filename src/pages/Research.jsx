import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJSONC } from "../utils/jsonc.js";

function ResearchCard({ item, index }) {
  const targetLink = item.link
    ? item.link
    : item.search
    ? `/publications?search=${encodeURIComponent(item.search)}`
    : null;
  const comingSoon = Boolean(item.comingSoon);
  const clickable = Boolean(targetLink) && !comingSoon;

  const bgStyle = item.image
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(16,185,129,0.32), rgba(34,197,235,0.12)), url(${item.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.25), transparent 40%), radial-gradient(circle at 50% 100%, rgba(6,95,70,0.4), transparent 45%)",
      };

  const Wrapper = clickable ? Link : "div";
  const wrapperProps = clickable ? { to: targetLink } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        "group relative block rounded-3xl overflow-hidden",
        "border border-emerald-300/20 bg-brand-950/70",
        "shadow-[0_25px_60px_rgba(0,0,0,0.35)]",
        "transition transform-gpu",
        clickable ? "hover:-translate-y-1.5 hover:shadow-emerald-900/40" : "",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
      ].join(" ")}
      style={bgStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/70 via-brand-950/80 to-black/70" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_20%_30%,rgba(74,222,128,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_45%)]" />

      <div className="relative p-6 flex flex-col gap-4 min-h-[240px]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/70">
            Theme {String(index + 1).padStart(2, "0")}
          </span>
          {comingSoon && (
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-semibold text-amber-200">
              Coming soon
            </span>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xl md:text-2xl font-semibold text-white">
            {item.title}
          </h3>
          <p className="text-white/80 leading-relaxed text-sm md:text-base">
            {item.text}
          </p>
        </div>

        <div className="flex-1" />

        {clickable && (
          <div className="inline-flex items-center gap-2 text-brand-100 font-semibold text-sm">
            View publications
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export default function Research() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchJSONC("/research.jsonc")
      .then((data) => {
        setItems(data);
        setTimeout(() => setLoaded(true), 60);
      })
      .catch((e) =>
        setError(e?.message || "Failed to load research topics")
      );
  }, []);

  return (
    <section className="section space-y-8">
      <div className="space-y-3 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          Our research threads
        </p>
        <h2 className="h2-grad">Research Themes</h2>
        <p className="text-white/75">
          Click a theme to jump into our publications filtered to that topic. If a
          theme is still in progress, you will see it marked as coming soon.
        </p>
      </div>

      {error && (
        <p className="mt-4 text-red-300">Error: {error}</p>
      )}

      <div
        className={[
          "grid gap-6 md:grid-cols-2 xl:grid-cols-3",
          "transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {items.map((item, idx) => (
          <ResearchCard key={item.id ?? idx} item={item} index={idx} />
        ))}
      </div>

      {!error && items.length === 0 && (
        <p className="mt-4 text-zinc-400">No research topics found.</p>
      )}
    </section>
  );
}
