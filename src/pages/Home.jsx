import { ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  const [showScrollHint, setShowScrollHint] = useState(true);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    fetchJSONC("/home.jsonc")
      .then(setData)
      .catch((err) => console.error("home.jsonc load error:", err));
  }, []);

  // Hide scroll hint when near the bottom of the page
  useEffect(() => {
    function handleScroll() {
      const viewport = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const full =
        document.documentElement.scrollHeight ||
        document.body.scrollHeight ||
        0;
      if (full <= viewport + 100) {
        setShowScrollHint(false);
        return;
      }
      const atBottom = scrollY + viewport >= full - 150;
      setShowScrollHint(!atBottom);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Preload images once data arrives
  useEffect(() => {
    if (!data?.images) return;
    data.images.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, [data]);

  if (!data) {
    return <div className="min-h-screen" />;
  }

  const { hero, images = [] } = data;
  const heroImage = images[0];
  const mosaicImages = images.slice(1, 7);
  const subtitleParagraphs = hero?.subtitle?.split("\n\n") || [];

  return (
    <>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section ref={heroRef} className="relative h-dvh overflow-hidden">
        {/* Parallax background image */}
        <motion.div className="absolute inset-0 scale-110" style={{ y: heroY }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: heroImage ? `url(${heroImage.src})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Gradient overlay — lets image breathe up top, anchors text at bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(to bottom,",
                "rgba(2,44,34,0.25) 0%,",
                "rgba(2,44,34,0.10) 35%,",
                "rgba(2,44,34,0.50) 70%,",
                "rgba(2,44,34,0.92) 100%)",
              ].join(" "),
            }}
          />
        </motion.div>

        {/* Hero content — anchored to bottom */}
        <motion.div
          className="relative z-10 flex flex-col justify-end h-full max-w-7xl mx-auto px-6 md:px-10 pb-24 md:pb-32"
          style={{ opacity: heroOpacity }}
        >
          {hero?.lead && (
            <motion.span
              className="inline-flex items-center self-start rounded-full border border-white/20 bg-white/5 backdrop-blur px-4 py-1.5 text-sm md:text-base tracking-wide text-white/90"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              {hero.lead}
            </motion.span>
          )}

          <motion.h1
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.5rem] leading-[1.05] tracking-tight mt-5 max-w-5xl pb-2"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #d1fae5 40%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
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
                {hero.cta_primary.label}{" "}
                <ChevronRight className="h-4 w-4" />
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
        </motion.div>

        {/* Photo credit */}
        {heroImage?.credit?.url && heroImage?.credit?.name && (
          <a
            href={heroImage.credit.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-8 right-6 z-10 text-[10px] text-white/25 hover:text-white/50 transition-colors font-editorial"
          >
            Photo: {heroImage.credit.name}
          </a>
        )}
      </section>

      {/* ═══════════════════════ MISSION ═══════════════════════ */}
      <section className="relative py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16">
            {/* Left column — editorial heading */}
            <motion.div
              className="md:col-span-5"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.15] text-white/95">
                Reconnecting{" "}
                <em className="text-brand-300">people</em> and{" "}
                <em className="text-brand-300">nature</em> through research
              </h2>
            </motion.div>

            {/* Right column — body text */}
            <motion.div
              className="md:col-span-6 md:col-start-7 space-y-5"
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
                  className="font-editorial text-base md:text-lg text-white/55 leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="home-rule" />
      </div>

      {/* ═══════════════════ IMAGE MOSAIC ═══════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <motion.p
            className="font-editorial text-sm tracking-[0.2em] uppercase text-white/30 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            People &amp; biodiversity
          </motion.p>

          <div className="home-mosaic">
            {mosaicImages.map((img, i) => (
              <motion.div
                key={img.src}
                className={`home-mosaic-item home-mosaic-item-${i + 1} group relative overflow-hidden rounded-2xl`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.08,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="absolute bottom-4 left-4 right-4 font-editorial text-sm text-white/90 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  {img.alt}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="home-rule" />
      </div>

      {/* ═══════════════════ CLOSING CTA ═══════════════════ */}
      <section className="py-24 md:py-32">
        <motion.div
          className="max-w-3xl mx-auto px-6 md:px-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="font-display text-3xl md:text-5xl text-white/95">
            Interested in our work?
          </h2>
          <p className="mt-5 text-lg text-white/45 font-editorial">
            We're always looking for collaborators, students, and partners.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/research"
              className="btn-primary text-base px-7 py-3.5"
            >
              Explore research <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="btn-secondary text-base px-7 py-3.5"
            >
              Get in touch
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ Fixed "Keep scrolling" indicator ═══════════ */}
      {showScrollHint && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none fixed bottom-6 inset-x-0 flex justify-center z-40"
        >
          <button
            type="button"
            onClick={() => {
              window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
            }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:bg-white/15 transition-colors"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-white/20">
              <ChevronDown className="h-3.5 w-3.5 text-white/90" />
            </span>
            <span className="text-sm font-medium text-white/90 tracking-wide">
              Keep scrolling
            </span>
          </button>
        </motion.div>
      )}
    </>
  );
}
