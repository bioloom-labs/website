import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fetchJSONC } from "../utils/jsonc.js";

const sceneCardClass =
  "rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-xl shadow-[0_30px_120px_rgba(2,6,23,0.45)]";

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
      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0,rgba(45,212,191,0.2),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(34,211,238,0.25),transparent_55%)] opacity-70" />
      </div>

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
          <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs text-white/70">
            Story mode
          </span>
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

function NarrativeCard({ block, index }) {
  if (!block) return null;

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
        {/* Fixed Gradient Layer */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.25),transparent_55%)] opacity-70" />

        <div className="relative space-y-4 z-20">
          <div className="flex flex-wrap items-center gap-3">
            {block.tag && (
              <span className="pill text-xs text-brand-100 border-brand-200/60">
                {block.tag}
              </span>
            )}
            <span className="rounded-full bg-black/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-white/70">
              Scene {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {block.heading && (
            <h3 className="text-3xl md:text-4xl font-semibold text-white">
              {block.heading}
            </h3>
          )}

          {block.text && (
            <p className="text-white/85 text-lg leading-relaxed max-w-3xl">
              {block.text}
            </p>
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
            className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3"
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
      name: "Royal Botanic Gardens, Kew",
      logo: "/images/logos/kew.png",
      href: "https://www.kew.org/",
    },
    {
      name: "Queen Mary University of London",
      logo: "/images/logos/qmul.png",
      href: "https://www.qmul.ac.uk/",
    },
  ];

  return (
    <div className="text-center space-y-6 mx-auto max-w-5xl rounded-[2.5rem] border border-white/10 bg-white/5/50 px-8 py-10 backdrop-blur-xl shadow-[0_30px_120px_rgba(2,6,23,0.45)]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          With gratitude
        </p>
        <h3 className="text-3xl md:text-4xl font-semibold text-white">
          Thank you to our collaborators and hosts
        </h3>
        <p className="text-lg text-white/80 leading-relaxed">
          Our work depends on long-term partnerships and shared stewardship.
          Explore our home institutions and the botanical collections that make
          this journey possible.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-10">
        {partners.map((partner) => (
          <a
            key={partner.name}
            href={partner.href}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex flex-col items-center gap-3"
          >
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
          </a>
        ))}
      </div>
    </div>
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
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"
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

    return [
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
      {
        id: "about-sections",
        type: "sections",
        sections,
        video: videos.sections || "/images/videos/about/beereddahlia.mp4",
        poster: posters.sections,
        credit: attributions.sections || null,
      },
      {
        id: "about-collaborators",
        type: "collaborators",
        video: collaboratorsVideo,
        poster: collaboratorsPoster,
        credit: collaboratorsCredit,
      },
    ];
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
                {/* Narrative Header only on first narrative block */}
                {scene.index === 0 && (
                  <div className="space-y-3 max-w-xl mb-10">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">Narrative arc</p>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">
                      How BioLoom Labs moves from forest plots to policy dashboards.
                    </h3>
                  </div>
                )}
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
