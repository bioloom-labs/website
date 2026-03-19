import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";

const sceneCardClass =
  "rounded-[2.5rem] border border-white/20 bg-white/10 px-8 py-10 backdrop-blur-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.35)]";

/* -------------------- Paragraph stack (intro text) -------------------- */

function ParagraphStack({ intro = [] }) {
  if (!intro.length) return null;
  return (
    <div className="mt-6 space-y-6 max-w-4xl">
      {intro.map((text, idx) => (
        <p key={idx} className="text-lg text-white/80 leading-relaxed">
          {text}
        </p>
      ))}
    </div>
  );
}

/* -------------------- Hero section -------------------- */

function AboutHero({ eyebrow, title, introParagraphs }) {
  return (
    <div
      className={[
        sceneCardClass,
        "relative overflow-hidden px-6 py-10 md:px-10 md:py-14",
      ].join(" ")}
    >
      {/* Specular highlight strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-[2.5rem]" />

      <div className="relative">
        {eyebrow && (
          <p className="uppercase tracking-[0.3em] text-xs text-white/60">
            {eyebrow}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <h2 className="h2-grad text-3xl md:text-4xl lg:text-5xl">
            {title || "Inside the Lab"}
          </h2>
        </div>

        <ParagraphStack intro={introParagraphs} />
      </div>
    </div>
  );
}

/* -------------------- Narrative section -------------------- */

function NarrativeSection({ blocks = [] }) {
  // (Keep existing implementation - omitted for brevity as it was fine)
  // In a real file, ensure you keep the full NarrativeSection code here
  // or import it if you've split files.
  return null;
}

/* -------------------- BioLoom logo — 4-layer vectorised animation -------------------- */
// Each layer traced separately from bioloom.png via potrace (800×239 viewBox).
// Outer <motion.g> handles animation; inner <g> holds the potrace coordinate transform
// so framer-motion never clobbers the SVG transform attribute.

const PT = "translate(0,239) scale(0.1,-0.1)";

const FABRIC_D = "M535 924 c-71 -7 -189 -22 -262 -34 -73 -11 -137 -20 -142 -20 -6 0 -15 -9 -21 -21 -19 -34 2 -46 98 -54 93 -7 258 -41 267 -55 3 -5 -21 -17 -52 -27 -45 -14 -59 -23 -61 -40 -6 -40 24 -43 140 -13 l107 28 68 -47 c105 -74 105 -76 31 -98 -56 -16 -63 -22 -66 -46 -5 -43 27 -43 169 -1 18 5 156 -162 144 -174 -3 -4 -25 -14 -48 -22 -33 -12 -43 -21 -45 -42 -4 -35 22 -43 78 -23 67 24 76 21 121 -47 57 -85 99 -128 125 -128 38 0 41 37 6 74 -34 36 -92 120 -92 134 0 5 45 17 99 26 l100 18 79 -81 c81 -82 120 -103 147 -81 25 21 17 36 -39 79 -112 87 -108 95 55 106 l97 7 53 -42 c91 -72 158 -93 173 -54 9 24 -4 42 -37 54 -18 5 -45 21 -62 34 l-30 24 44 9 c52 10 72 33 51 58 -14 17 -76 16 -146 -1 -17 -4 -32 4 -63 35 -52 52 -51 59 5 63 113 7 79 68 -37 68 l-79 0 -25 40 c-31 49 -31 48 6 52 77 8 58 68 -22 68 -44 0 -51 4 -91 46 -74 79 -186 107 -538 134 -154 11 -135 12 -305 -6z m293 -94 c70 -30 66 -37 -25 -45 -43 -4 -103 -10 -133 -15 -39 -5 -62 -4 -80 5 -14 7 -56 22 -93 35 -81 26 -80 29 15 40 125 14 256 6 316 -20z m299 -5 c187 -27 237 -62 72 -51 -130 9 -171 18 -205 45 l-27 21 26 0 c15 0 75 -7 134 -15z m-68 -161 c29 -31 51 -58 49 -59 -2 -2 -58 -9 -126 -15 l-122 -12 -63 58 c-34 31 -63 61 -65 65 -4 9 58 14 189 17 l87 2 51 -56z m222 30 l87 -6 21 -38 c11 -21 21 -40 21 -44 0 -3 -47 -6 -104 -6 l-104 0 -36 50 c-44 61 -44 64 -3 57 17 -3 71 -9 118 -13z m-109 -181 c20 -24 78 -121 78 -131 0 -5 -35 -14 -77 -21 -43 -7 -89 -14 -103 -17 -22 -5 -34 5 -89 76 -73 94 -73 92 22 100 129 12 153 11 169 -7z m285 9 c12 -4 40 -30 62 -59 l41 -51 -37 -6 c-21 -3 -72 -8 -113 -11 l-75 -6 -29 48 c-17 26 -36 58 -44 71 l-14 22 93 -1 c52 -1 104 -4 116 -7z";

const PLANT_D = "M1030 2332 c-291 -106 -445 -404 -346 -672 14 -38 15 -52 4 -92 -17 -68 -24 -60 -31 35 -19 267 -183 435 -458 469 -153 19 -186 -13 -157 -152 60 -284 210 -427 471 -447 l78 -6 15 -36 c31 -73 43 -150 49 -324 l7 -177 -44 0 c-143 -1 -496 -58 -509 -82 -18 -33 5 -45 99 -53 93 -7 258 -41 267 -55 3 -5 -20 -17 -52 -27 -101 -32 -82 -46 53 -39 138 6 120 6 209 -1 63 -4 68 -3 56 11 -20 24 -16 25 130 32 l134 6 24 -26 c29 -31 136 -42 111 -11 -7 9 -11 17 -9 20 8 8 234 -18 241 -28 9 -15 140 1 158 19 26 26 0 48 -61 54 -49 4 -59 10 -94 48 -67 75 -216 112 -512 129 l-102 6 -5 36 c-47 323 -3 609 100 646 240 85 354 255 354 525 -1 217 -28 247 -180 192z m-202 -1502 c70 -30 66 -37 -25 -45 -43 -4 -103 -10 -133 -15 -39 -5 -62 -4 -80 5 -14 7 -56 22 -93 35 -81 26 -80 29 15 40 125 14 256 6 316 -20z m299 -5 c187 -27 237 -62 72 -51 -130 9 -171 18 -205 45 l-27 21 26 0 c15 0 75 -7 134 -15z";

const PEOPLE_DS = [
  "M660 1570 c0 -29 3 -50 7 -46 7 7 5 87 -3 95 -2 2 -4 -20 -4 -49z",
  "M864 1546 c-58 -49 -20 -146 57 -146 70 0 106 94 54 145 -31 32 -75 32 -111 1z",
  "M871 1366 c-45 -25 -50 -49 -51 -243 l0 -182 -27 -3 c-16 -3 8 -5 51 -6 44 -1 99 -4 123 -8 l43 -6 0 205 0 205 -31 26 c-33 28 -71 33 -108 12z",
  "M1093 1320 c-46 -19 -55 -69 -18 -105 58 -59 152 21 98 83 -22 25 -51 33 -80 22z",
  "M1067 1160 c-26 -21 -27 -24 -27 -130 0 -78 -4 -110 -12 -112 -7 -3 21 -8 63 -11 42 -4 83 -9 93 -13 26 -10 24 236 -3 260 -31 28 -82 31 -114 6z",
];

const TEXT_DS = [
  "M2775 1688 c-63 -37 -59 -112 8 -137 50 -19 97 16 97 72 0 51 -63 90 -105 65z",
  "M3395 1686 c-250 -61 -406 -326 -340 -579 138 -531 925 -426 925 123 0 316 -276 531 -585 456z m238 -132 c230 -75 287 -416 98 -586 -225 -203 -562 -33 -549 277 10 245 215 385 451 309z",
  "M5173 1685 c-450 -122 -469 -768 -26 -905 283 -87 570 90 614 380 51 336 -259 613 -588 525z m263 -140 c210 -94 260 -397 93 -564 -162 -162 -430 -118 -531 87 -145 294 144 608 438 477z",
  "M6231 1685 c-454 -128 -455 -794 -1 -911 431 -110 764 358 517 727 -103 156 -330 236 -516 184z m276 -146 c120 -58 183 -164 183 -309 0 -404 -556 -481 -656 -91 -74 290 207 528 473 400z",
  "M7010 1681 c-15 -30 -14 -883 2 -899 16 -16 103 -15 117 1 7 9 12 113 13 313 l3 300 140 -170 c174 -212 143 -212 316 0 l144 177 5 -314 5 -314 60 0 60 0 3 458 c3 578 31 554 -250 215 -213 -260 -151 -262 -384 17 -196 235 -214 252 -234 216z",
  "M1932 1682 c-10 -7 -12 -105 -10 -458 l3 -449 160 -3 c248 -4 359 21 429 98 102 113 61 324 -71 364 -22 7 -21 9 19 39 136 104 105 315 -54 381 -76 31 -437 52 -476 28z m407 -144 c171 -85 68 -242 -159 -243 l-125 0 -3 124 c-1 69 0 131 3 139 9 25 225 9 284 -20z m2 -379 c213 -72 100 -263 -156 -264 l-130 0 -3 138 -3 137 129 0 c71 0 144 -5 163 -11z",
  "M4172 1682 c-10 -7 -12 -105 -10 -458 l3 -449 275 0 275 0 3 54 c4 72 9 71 -225 71 l-203 0 0 389 c0 432 5 401 -68 401 -20 0 -43 -4 -50 -8z",
  "M2755 1445 l-25 -24 0 -326 0 -325 75 0 75 0 0 329 0 330 -26 20 c-35 28 -69 26 -99 -4z",
];

function BioloomLogoAnim() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (isInView) setAnimKey((k) => k + 1);
  }, [isInView]);

  const ease = [0.22, 1, 0.36, 1];

  return (
    <div ref={ref} className="flex justify-center pt-8">
      <svg
        key={animKey}
        viewBox="0 0 800 239"
        style={{ height: "110px", width: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Fabric — rises up first */}
        <motion.g
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0, ease }}
        >
          <g transform={PT} fill="#10b981" stroke="none">
            <path d={FABRIC_D} />
          </g>
        </motion.g>

        {/* 2. Plant — rises from ground */}
        <motion.g
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45, ease }}
        >
          <g transform={PT} fill="#10b981" stroke="none">
            <path d={PLANT_D} />
          </g>
        </motion.g>

        {/* 3. People — rise up */}
        <motion.g
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9, ease: [0.34, 1.4, 0.64, 1] }}
        >
          <g transform={PT} fill="#a7f3d0" stroke="none">
            {PEOPLE_DS.map((d, i) => <path key={i} d={d} />)}
          </g>
        </motion.g>

        {/* 4. Text — slides in from left */}
        <motion.g
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.3, ease }}
        >
          <g transform={PT} fill="#a7f3d0" stroke="none">
            {TEXT_DS.map((d, i) => <path key={i} d={d} />)}
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

function NarrativeCard({ block, index }) {
  if (!block) return null;

  const paragraphs = Array.isArray(block.paragraphs)
    ? block.paragraphs
    : block.text
      ? [block.text]
      : [];
  const hasList = Array.isArray(block.list) && block.list.length > 0;
  const hasValues = Array.isArray(block.values) && block.values.length > 0;

  return (
    <motion.article
      // Added z-index and layout projection
      layout
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      // Moved GPU triggers to the motion parent
      className="relative z-10 transform-gpu will-change-transform"
    >
      <motion.div
        initial={{ opacity: 0.6, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={[
          sceneCardClass,
          "relative w-full overflow-hidden isolation-isolate bg-clip-padding",
        ].join(" ")}
      >
        {/* Specular highlight strip */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-[2.5rem]" />

        <div className="relative space-y-4 z-20">
          {block.heading && (
            <h3 className="text-3xl md:text-4xl font-semibold text-emerald-200">
              {block.heading}
            </h3>
          )}

          {paragraphs.length > 0 && (
            <div className="space-y-3 text-emerald-50/90 text-lg leading-relaxed">
              {paragraphs.map((text, idx) => (
                <p key={`paragraph-${idx}`}>{text}</p>
              ))}
            </div>
          )}

          {hasList && (
            <ul className="mt-2 space-y-2 text-emerald-50/90 text-base leading-relaxed list-disc list-inside">
              {block.list.map((item, idx) => (
                <li key={`list-${idx}`} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          )}

          {hasValues && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {block.values.map((value, idx) => (
                  <div
                    key={value.title || idx}
                    className="rounded-xl border border-white/15 bg-white/8 p-4 space-y-2 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  >
                    {value.title && (
                      <h4 className="text-base font-semibold text-emerald-200">
                        {value.title}
                      </h4>
                    )}
                    {value.text && (
                      <p className="text-sm text-emerald-50/85 leading-relaxed">
                        {value.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <BioloomLogoAnim />
            </>
          )}
        </div>
      </motion.div>
    </motion.article>
  );
}

/* -------------------- Section Grid -------------------- */
function SectionGrid({ sections = [] }) {
  if (!sections.length) return null;

  return (
    <div className={sceneCardClass}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="grid gap-6 md:grid-cols-3"
      >
        {sections.map((section, idx) => (
          <div
            key={section.heading || idx}
            className="rounded-2xl border border-emerald-300/20 bg-emerald-950/60 p-6 flex flex-col gap-3"
          >
            {section.heading && (
              <h4 className="text-lg font-semibold text-brand-200">
                {section.heading}
              </h4>
            )}
            <p className="text-sm text-white/80 leading-relaxed">
              {section.text}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------- Collaborators scene -------------------- */

function CollaboratorsScene() {
  const partners = [
    {
      name: "Queen Mary University of London",
      logo: "/images/logos/qmul.png",
      href: "https://www.qmul.ac.uk/",
    },
    {
      name: "Royal Botanic Gardens, Kew",
      logo: "/images/logos/kew.png",
      href: "https://www.kew.org/",
    },
    {
      name: "UKRI BBSRC",
      logo: "/images/logos/bbsrc.png",
      href: "https://www.ukri.org/councils/bbsrc/",
    },
    {
      name: "The Calleva Foundation",
      logo: "/images/logos/calleva.png",
      href: null,
    },
  ];

  return (
    <div className="text-center space-y-6 mx-auto max-w-5xl rounded-[2.5rem] border border-white/20 bg-white/10 px-8 py-10 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-50/60">
          With gratitude
        </p>
        <h3 className="text-3xl md:text-4xl font-semibold text-emerald-200">
          Thank you to our partners and hosts
        </h3>
        <p className="text-lg text-emerald-50/90 leading-relaxed">
          Our work is built on long-term partnerships and shared stewardship.
          Discover the institutions that make it possible.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-10">
        {partners.map((partner) => {
          const inner = (
            <>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 transition group-hover:border-brand-200/70">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-16 w-auto object-contain filter brightness-0 invert"
                  loading="lazy"
                />
              </div>
              <span className="text-sm text-white/75 group-hover:text-white">
                {partner.name}
              </span>
            </>
          );
          return partner.href ? (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex flex-col items-center gap-3"
            >
              {inner}
            </a>
          ) : (
            <div key={partner.name} className="group inline-flex flex-col items-center gap-3">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Transparency demo -------------------- */

function TransparencyDemoScene({ id, onInView, videoSrc }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) onInView?.(id); }),
      { threshold: 0.55 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, onInView]);

  const levels = [
    { label: "5%",  bg: "bg-white/5"  },
    { label: "10%", bg: "bg-white/10" },
    { label: "15%", bg: "bg-white/15" },
    { label: "20%", bg: "bg-white/20" },
    { label: "25%", bg: "bg-white/25" },
    { label: "30%", bg: "bg-white/30" },
  ];

  return (
    <section
      id={id}
      ref={ref}
      className="about-scene relative flex min-h-screen items-center justify-center px-4 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-6xl space-y-6">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-50/50">
          Transparency reference — pick your favourite
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {levels.map(({ label, bg }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              {/* Individual video per panel */}
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={videoSrc}
                muted
                loop
                playsInline
                autoPlay
              />
              {/* Glass overlay */}
              <div
                className={[
                  bg,
                  "relative z-10 border border-white/20 rounded-[2.5rem] px-8 py-10 backdrop-blur-2xl",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.05)]",
                  "space-y-3",
                ].join(" ")}
              >
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-emerald-50/50">{label}</p>
                <h3 className="text-xl font-semibold text-emerald-200">
                  The quick brown fox
                </h3>
                <p className="text-emerald-50/90 text-sm leading-relaxed">
                  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- OPTIMIZED BACKGROUND VIDEO MANAGER -------------------- */

/**
 * This component manages a pool of video players.
 * It ensures the current video plays, and the *next* video preloads in the background.
 */
function OptimizedBackgroundVideo({
  scenes,
  activeSceneId,
  isIdle,
  onReady,
}) {
  // Find the index of the active scene to determine neighbors
  const activeIndex = useMemo(
    () => scenes.findIndex((s) => s.id === activeSceneId),
    [scenes, activeSceneId]
  );

  // De-duplicate videos. If multiple scenes use the same video URL, we only want one DOM node.
  const uniqueVideos = useMemo(() => {
    const map = new Map();
    scenes.forEach((scene) => {
      if (scene.video && !map.has(scene.video)) {
        map.set(scene.video, { src: scene.video, poster: scene.poster });
      }
    });
    return Array.from(map.values());
  }, [scenes]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      {uniqueVideos.map((vid) => {
        // Determine if this video belongs to the active scene
        const isActive = scenes[activeIndex]?.video === vid.src;

        // Determine if this video belongs to the NEXT or PREV scene (for preloading)
        const isNext = scenes[activeIndex + 1]?.video === vid.src;
        const isPrev = scenes[activeIndex - 1]?.video === vid.src;

        // We keep the DOM node mounted if it's active or an immediate neighbor (warm start)
        // We unmount distant videos to save memory, unless your videos are very small.
        // For smoother experience, let's keep them all mounted but manage 'src' if list is short (<10).
        // Assuming <10 videos: Keep all mounted.

        const shouldPreload = isActive || isNext || isPrev;

        return (
          <VideoPlayer
            key={vid.src}
            src={vid.src}
            poster={vid.poster}
            isActive={isActive}
            shouldPreload={shouldPreload}
            isIdle={isIdle}
            onReady={isActive ? onReady : undefined}
          />
        );
      })}

      {/* Global overlay for idle dimming */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

function VideoPlayer({ src, poster, isActive, shouldPreload, isIdle, onReady }) {
  const videoRef = useRef(null);
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isActive) setHasBeenActive(true);
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div
      className={`absolute inset-0 ${isActive
          ? "opacity-100 z-10 transition-opacity duration-1000 ease-in-out"
          : hasBeenActive
            ? "opacity-0 z-0 transition-opacity duration-1000 ease-in-out"
            : "opacity-0 z-0"
        }`}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        // Only load the video data if it's active or the "next up" video
        preload={shouldPreload ? "auto" : "none"}
        poster={poster}
        onCanPlay={isActive ? onReady : undefined}
      >
        {/* Using key={src} inside here is NOT needed because the parent 
              VideoPlayer is already keyed by src. The node persists.
            */}
        <source src={src} />
      </video>

      {/* Idle animation overlay per video */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: (isActive && isIdle) ? 0.4 : 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </div>
  );
}

/* -------------------- Full-screen scene wrapper -------------------- */

function Scene({ id, onInView, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onInView?.(id);
          }
        });
      },
      { threshold: 0.55 } // Slightly lowered threshold for snappier detection
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [id, onInView]);

  return (
    <section
      id={id}
      ref={ref}
      className="about-scene relative flex min-h-screen items-center justify-center px-4"
    >
      <div className="w-full max-w-6xl space-y-10">{children}</div>
    </section>
  );
}

/* -------------------- Video attribution overlay -------------------- */

function VideoAttributionOverlay({ activeSceneId, scenes }) {
  if (!activeSceneId || !scenes.length) return null;
  const scene = scenes.find((s) => s.id === activeSceneId);
  const credit = scene?.credit;
  if (!credit || !credit.href || !credit.label) return null;

  return (
    <div className="fixed bottom-3 right-3 z-30 text-[11px] text-white/70 drop-shadow">
      <a
        href={credit.href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-brand-100"
      >
        {credit.label}
      </a>
    </div>
  );
}

/* -------------------- Main About page -------------------- */

export default function About() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [sceneIdle, setSceneIdle] = useState(false);
  const [initialVideoReady, setInitialVideoReady] = useState(false);

  // Load JSONC content
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await fetchJSONC("/about.jsonc");
        if (mounted) {
          setData(payload);
          setError(null);
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load About content");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("about-scroll-container");
    return () => { root.classList.remove("about-scroll-container"); };
  }, []);

  const [allowVideo, setAllowVideo] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return;
    if (connection.saveData || (connection.effectiveType && connection.effectiveType.includes("2g"))) {
      setAllowVideo(false);
    }
  }, []);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const viewport = window.innerHeight || 0;
      const full = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      if (full <= viewport + 100) { setShowScrollHint(false); return; }
      const atBottom = scrollY + viewport >= full - 150;
      setShowScrollHint(!atBottom);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const introParagraphs = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.intro)) return data.intro;
    return typeof data.intro === "string" ? [data.intro] : [];
  }, [data]);

  // Construct Scene Objects
  const scenes = useMemo(() => {
    if (!data) return [];
    const narrativeBlocks = data.narrative || [];
    const sections = data.sections || [];
    const videos = data.videos || {};
    const posters = data.videoPosters || {};
    const attributions = data.videoAttributions || {};
    const narrativeVideos = Array.isArray(videos.narrative) ? videos.narrative : [];
    const narrativePosters = Array.isArray(posters.narrative) ? posters.narrative : [];
    const narrativeAttributions = Array.isArray(attributions.narrative) ? attributions.narrative : [];
    const collaboratorsVideo =
      videos.collaborators ||
      videos.sections ||
      videos.intro ||
      narrativeVideos[0] ||
      "/images/videos/about/handseeds.mov";
    const collaboratorsPoster =
      (posters.collaborators || posters.sections || posters.intro || null);
    const collaboratorsCredit =
      attributions.collaborators || attributions.sections || null;

    const scenesList = [
      {
        id: "about-intro",
        type: "intro",
        video: videos.intro || "/images/videos/about/holdingplant.mov",
        poster: posters.intro,
        credit: attributions.intro || null,
      },
      ...narrativeBlocks.map((block, idx) => ({
        id: `about-narrative-${idx}`,
        type: "narrative",
        block,
        index: idx,
        video: narrativeVideos[idx] || "/images/videos/about/handseeds.mov",
        poster: narrativePosters[idx],
        credit: narrativeAttributions[idx] || null,
      })),
    ];

    if ((sections && sections.length) || data.closing) {
      scenesList.push({
        id: "about-sections",
        type: "sections",
        sections,
        video: videos.sections || "/images/videos/about/beereddahlia.mp4",
        poster: posters.sections,
        credit: attributions.sections || null,
      });
    }

    scenesList.push({
      id: "about-collaborators",
      type: "collaborators",
      video: collaboratorsVideo,
      poster: collaboratorsPoster,
      credit: collaboratorsCredit,
    });

    return scenesList;
  }, [data]);

  // Set initial scene
  useEffect(() => {
    if (scenes.length && !activeSceneId) {
      setActiveSceneId(scenes[0].id);
    }
  }, [activeSceneId, scenes]);

  // Ensure cards appear (blur + content) even before video fully loads
  useEffect(() => {
    if (initialVideoReady) return;
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      setInitialVideoReady(true);
      return;
    }
    const raf = window.requestAnimationFrame(() => setInitialVideoReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [initialVideoReady]);

  // Idle Timer
  useEffect(() => {
    if (!activeSceneId) return;
    setSceneIdle(false);
    const timeoutId = window.setTimeout(() => setSceneIdle(true), 15000);
    return () => window.clearTimeout(timeoutId);
  }, [activeSceneId]);

  const handleInitialVideoReady = useCallback(() => {
    setInitialVideoReady(true);
  }, []);

  if (error) return <section className="section"><h2 className="h2-grad">About</h2><p className="mt-4 text-red-400">{error}</p></section>;
  if (loading || !data) return <section className="section"><h2 className="h2-grad">About</h2><p className="mt-4 text-white/70">Loading story…</p></section>;

  return (
    <motion.main
      className="relative min-h-screen"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* OPTIMIZED BACKGROUND VIDEO MANAGER */}
      {allowVideo && (
        <OptimizedBackgroundVideo
          scenes={scenes}
          activeSceneId={activeSceneId}
          isIdle={sceneIdle}
          onReady={!initialVideoReady ? handleInitialVideoReady : undefined}
        />
      )}

      <VideoAttributionOverlay activeSceneId={activeSceneId} scenes={scenes} />

      <div
        className={[
          "relative z-10 transition-opacity duration-700 delay-100",
          initialVideoReady ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {scenes.map((scene) => {
          if (scene.type === "intro") {
            return (
              <Scene key={scene.id} id={scene.id} onInView={setActiveSceneId}>
                <AboutHero
                  eyebrow={data.eyebrow}
                  title={data.title}
                  introParagraphs={introParagraphs}
                />
              </Scene>
            );
          }
          if (scene.type === "narrative") {
            return (
              <Scene key={scene.id} id={scene.id} onInView={setActiveSceneId}>
                <NarrativeCard block={scene.block} index={scene.index} />
              </Scene>
            );
          }
          if (scene.type === "sections") {
            return (
              <Scene key={scene.id} id={scene.id} onInView={setActiveSceneId}>
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-semibold text-brand-100">
                    Where the story goes next
                  </h3>
                  <SectionGrid sections={scene.sections || []} />
                  {data.closing && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-5% 0px -5% 0px" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="rounded-3xl border border-brand-300/40 bg-brand-400/10 p-8 md:p-10 max-w-4xl"
                    >
                      <p className="text-white/90 text-lg leading-relaxed">{data.closing}</p>
                    </motion.div>
                  )}
                </div>
              </Scene>
            );
          }
          if (scene.type === "collaborators") {
            return (
              <Scene key={scene.id} id={scene.id} onInView={setActiveSceneId}>
                <CollaboratorsScene />
              </Scene>
            );
          }
          if (scene.type === "transparency-demo") {
            return (
              <TransparencyDemoScene
                key={scene.id}
                id={scene.id}
                onInView={setActiveSceneId}
                videoSrc={scene.video}
              />
            );
          }
          return null;
        })}
      </div>

      {(() => {
        const finalSceneId = scenes.length ? scenes[scenes.length - 1].id : null;
        const shouldShowHint = showScrollHint && activeSceneId !== finalSceneId;
        if (!shouldShowHint) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              type="button"
              onClick={() => {
                if (!scenes.length) return;
                const currentIndex = scenes.findIndex(
                  (scene) => scene.id === activeSceneId
                );
                const nextIndex =
                  currentIndex === -1
                    ? 0
                    : Math.min(currentIndex + 1, scenes.length - 1);
                const nextId = scenes[nextIndex]?.id;
                if (!nextId) return;
                const el = document.getElementById(nextId);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:bg-white/15 transition-colors"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-white/20">
                <ChevronDown className="h-3.5 w-3.5 text-white/90" />
              </span>
              <span className="text-sm font-medium text-white/90 tracking-wide">
                Keep scrolling
              </span>
            </button>
          </motion.div>
        );
      })()}
    </motion.main>
  );
}
