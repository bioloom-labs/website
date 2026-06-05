import { ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fetchJSONC } from "../utils/jsonc.js";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

export default function Home() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState(0);
  // Slide being previewed while the pointer hovers an indicator dot.
  const [preview, setPreview] = useState(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    fetchJSONC("/home.jsonc")
      .then(setData)
      .catch((err) => console.error("home.jsonc load error:", err));
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mql.matches;
  }, []);

  // Full-screen vertical snap on the document root (matches the About page
  // approach); cleaned up on unmount so other routes scroll normally.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("snap-y-container");
    return () => root.classList.remove("snap-y-container");
  }, []);

  // Preload all slideshow images up front
  useEffect(() => {
    if (!data?.images) return;
    data.images.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, [data]);

  // Advance the slideshow; the timer resets whenever the active slide
  // changes (auto OR manual) so the progress circle stays in sync.
  // Paused while a dot is being previewed.
  useEffect(() => {
    const images = data?.images || [];
    if (images.length < 2) return;
    if (preview !== null) return;
    const interval = data?.interval_ms || 5000;
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % images.length);
    }, interval);
    return () => clearTimeout(id);
  }, [data, active, preview]);

  if (!data) {
    return <div className="min-h-dvh" />;
  }

  const { hero, images = [], fade_ms = 900 } = data;
  const interval = data?.interval_ms || 5000;
  // While hovering a dot we show its slide; otherwise the live one.
  const display = preview !== null ? preview : active;
  const current = images[display];
  const subtitleParagraphs = hero?.subtitle?.split("\n\n") || [];

  function scrollToMission() {
    document
      .getElementById("mission")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ════════════ SCREEN 1 — slideshow hero (no description) ════════════ */}
      <section className="snap-screen relative h-dvh w-full overflow-hidden">
        {/* ── Crossfading slideshow background (V1) ── */}
        <div className="absolute inset-0">
          {images.map((img, i) => (
            <div
              key={img.src}
              aria-hidden={i !== display}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: i === display ? 1 : 0,
                transitionDuration: `${fade_ms}ms`,
              }}
            >
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  backgroundImage: `url(${img.src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transform:
                    i === display && !reducedMotion.current
                      ? "scale(1.08)"
                      : "scale(1)",
                  transition: reducedMotion.current
                    ? "none"
                    : `transform ${interval + fade_ms}ms linear`,
                }}
              />
            </div>
          ))}

          {/* Bottom-anchored neutral scrim — keeps the bottom-left text legible */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(to bottom,",
                "rgba(0,0,0,0.25) 0%,",
                "rgba(0,0,0,0.05) 35%,",
                "rgba(0,0,0,0.45) 70%,",
                "rgba(0,0,0,0.92) 100%)",
              ].join(" "),
            }}
          />
        </div>

        {/* ── Hero content — V2 layout, bottom-left, no subtitle ── */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24 pt-24 md:px-10 md:pb-6 md:pt-0">
          {hero?.lead && (
            <motion.div
              className="self-start"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              {hero.lead_to ? (
                <Link
                  to={hero.lead_to}
                  className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[1.1375rem] tracking-wide text-emerald-50/90 backdrop-blur transition-colors hover:border-white/35 hover:bg-white/10 hover:text-emerald-50 md:text-[1.3rem]"
                >
                  {hero.lead}
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[1.1375rem] tracking-wide text-emerald-50/90 backdrop-blur md:text-[1.3rem]">
                  {hero.lead}
                </span>
              )}
            </motion.div>
          )}

          <motion.h1
            className="mt-5 max-w-5xl pb-2 font-display tracking-tight"
            style={{
              // Fluid size: scales with the viewport, big on desktop,
              // auto-shrinks on small screens so it never overflows.
              fontSize: "clamp(2.25rem, 5.2vw + 1rem, 6.5rem)",
              lineHeight: 1.06,
              textWrap: "balance",
              background:
                "linear-gradient(135deg, #ffffff 0%, #d1fae5 40%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 3px 16px rgba(0,0,0,0.55))",
            }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            {hero?.title}
          </motion.h1>

          <motion.div
            className="mt-10 flex flex-wrap gap-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {hero?.cta_primary && (
              <Link
                to={hero.cta_primary.to}
                className="btn-primary text-base px-7 py-3.5"
              >
                {hero.cta_primary.label} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            {hero?.cta_secondary && (
              <Link
                to={hero.cta_secondary.to}
                className="btn-secondary text-base px-7 py-3.5"
              >
                {hero.cta_secondary.label}
              </Link>
            )}
          </motion.div>

          {/* ── Slide indicators with hover-preview (V1) ── */}
          {images.length > 1 && (
            <div
              className="mt-10 flex items-center self-start"
              onMouseLeave={() => {
                if (preview !== null) {
                  setActive(preview);
                  setPreview(null);
                }
              }}
            >
              {images.map((img, i) => {
                const isCurrent = i === display;
                const showProgress = preview === null && i === active;
                return (
                  <button
                    key={img.src}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    onMouseEnter={() => setPreview(i)}
                    onFocus={() => setPreview(i)}
                    onClick={() => {
                      setActive(i);
                      setPreview(null);
                    }}
                    className="group flex cursor-pointer items-center px-1.5 py-3"
                  >
                    <span
                      className={`relative block h-2 rounded-full transition-all duration-500 ${
                        isCurrent
                          ? showProgress
                            ? "w-10 bg-white/25"
                            : "w-10 bg-brand-300"
                          : "w-2 bg-white/40 group-hover:bg-white/70"
                      }`}
                    >
                      {showProgress && (
                        <motion.span
                          key={active}
                          className="absolute left-0 top-0 h-2 w-2 rounded-full bg-brand-300 shadow-[0_0_8px_rgba(110,231,183,0.85)]"
                          initial={{ x: 0 }}
                          animate={{ x: 32 }}
                          transition={{
                            duration: interval / 1000,
                            ease: "linear",
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Photo credit for the current slide ── */}
        {current?.credit?.url && current?.credit?.name && (
          <a
            href={current.credit.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-6 right-6 z-10 font-editorial text-[10px] text-white/35 transition-colors hover:text-white/70"
          >
            Photo: {current.credit.name}
          </a>
        )}

        {/* ── Scroll-down cue ── */}
        <motion.button
          type="button"
          onClick={scrollToMission}
          aria-label="Scroll to mission"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 p-2.5 backdrop-blur transition-colors hover:bg-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.8 },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <ChevronDown className="h-4 w-4 text-white/90" />
        </motion.button>
      </section>

      {/* ════════════ SCREEN 2 — mission (V2) ════════════ */}
      <section
        id="mission"
        className="snap-screen relative flex min-h-dvh items-center py-24 md:py-0"
      >
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <motion.div
              className="md:col-span-5"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2 className="font-display text-3xl leading-[1.15] text-white/95 md:text-4xl lg:text-5xl">
                Reconnecting <em className="text-brand-300">people</em> and{" "}
                <em className="text-brand-300">nature</em> through research
              </h2>
            </motion.div>

            <motion.div
              className="space-y-5 md:col-span-6 md:col-start-7"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                delay: 0.15,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {subtitleParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="font-editorial text-base leading-relaxed text-white/60 md:text-lg"
                >
                  {para}
                </p>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
