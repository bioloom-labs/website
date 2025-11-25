import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { fetchJSONC } from "../utils/jsonc.js";

export default function Home() {
  const layerRef = useRef(null);
  const timerRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [intervalMs, setIntervalMs] = useState(5000);
  const [fadeMs, setFadeMs] = useState(900);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  const [hero, setHero] = useState({
    lead: "Led by Dr. Samuel Pironon",
    title: "Biodiversity, ecology, and plant–human interactions",
    subtitle:
      "We study how people and plants are connected through nutrition, medicine, and culture. Our team blends data science, field ecology, and network thinking to map, model, and safeguard nature’s pharmacopeia.",
    cta_primary: { label: "Explore research", to: "/research" },
    cta_secondary: { label: "Get in touch", to: "/contact" },
  });

  // Load config
  useEffect(() => {
    fetchJSONC("/home.jsonc")
      .then((data) => {
        if (Array.isArray(data.images)) setSlides(data.images);
        if (data.interval_ms) setIntervalMs(Number(data.interval_ms));
        if (data.fade_ms) setFadeMs(Number(data.fade_ms));
        if (data.hero) setHero((h) => ({ ...h, ...data.hero }));
      })
      .catch((err) => console.error("home.jsonc load error:", err));
  }, []);

  // Simple mount animation for the foreground content
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // Keep index in range if slides change
  useEffect(() => {
    if (slides.length && index >= slides.length) setIndex(0);
  }, [slides, index]);

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY * 0.3;
      if (layerRef.current) layerRef.current.style.transform = `translateY(${y}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Preload images
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, [slides]);

  // Helper to (re)start autoplay
  const restartTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % (slides.length || 1));
    }, intervalMs);
  };

  // Autoplay effect
  useEffect(() => {
    if (!slides.length) return;
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const start = () => {
      if (prefersReduced || paused) return;
      restartTimer();
    };
    const stop = () => clearInterval(timerRef.current);

    start();

    const handleVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [slides, intervalMs, paused]);

  const current = slides[index] || {};

  return (
    <section className="relative overflow-hidden min-h-screen">
      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        <div
          ref={layerRef}
          className="absolute inset-0 will-change-transform transition-transform duration-300 ease-out"
          aria-hidden
        >
          {/* Base fallback image that gently fades out once slides are loaded */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/home/home-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: slides.length ? 0 : 1,
              transition: `opacity ${fadeMs}ms ease-in-out`,
            }}
          />

          {/* Slideshow images fade over the base background */}
          {slides.map((s, i) => (
            <div
              key={s.src}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: i === index ? 1 : 0,
                transitionDuration: `${fadeMs}ms`,
                backgroundImage: `url(${s.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              role="img"
              aria-label={s.alt || ""}
            />
          ))}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      {/* Foreground text */}
      <div
        className={[
          "section relative z-10 transition-all duration-700",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        ].join(" ")}
      >
        {hero.lead && <span className="pill">{hero.lead}</span>}
        <h1 className="h1-grad mt-4">{hero.title}</h1>
        {hero.subtitle && (
          <p className="mt-5 max-w-2xl text-lg text-white/80 leading-relaxed">
            {hero.subtitle}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {hero.cta_primary && (
            <Link to={hero.cta_primary.to} className="btn-primary">
              {hero.cta_primary.label} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          {hero.cta_secondary && (
            <Link to={hero.cta_secondary.to} className="btn-secondary">
              {hero.cta_secondary.label}
            </Link>
          )}
        </div>
      </div>

      {/* Dots (top-right corner) */}
      {slides.length > 1 && (
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                // Jump to slide; autoplay continues after a full interval
                setIndex(i);
                restartTimer();
              }}
              onMouseEnter={() => {
                // Pause only when hovering a dot; persist the chosen slide
                setPaused(true);
                setIndex(i);
                clearInterval(timerRef.current);
              }}
              onMouseLeave={() => {
                // Resume autoplay when leaving the dots
                setPaused(false);
                restartTimer();
              }}
              onFocus={() => {
                // Keyboard users: pause while a dot is focused
                setPaused(true);
                setIndex(i);
                clearInterval(timerRef.current);
              }}
              onBlur={() => {
                setPaused(false);
                restartTimer();
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={[
                "h-2.5 w-2.5 rounded-full transition-opacity duration-300",
                i === index
                  ? "bg-white opacity-100"
                  : "bg-white/70 opacity-60 hover:opacity-90",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {/* Credit overlay (bottom-right) */}
      {current?.credit?.url && current?.credit?.name && (
        <a
          href={current.credit.url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 right-4 z-10 text-[11px] leading-tight text-white/75 hover:text-white transition-opacity"
          style={{ transitionDuration: `${fadeMs}ms` }}
        >
          Photo by <span className="underline">{current.credit.name}</span> on Unsplash
        </a>
      )}
    </section>
  );
}
