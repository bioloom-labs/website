import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* A single strand drawn under a page's headline, ending in a small curl like
   the ones on the news timeline. Draws on load by default; pass `start` to
   hold it until something else has finished (the Research page waits for the
   handwriting video). Skipped when the visitor prefers reduced motion. One
   per page: the gradient id is fixed. */

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mql.matches);
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return reduced;
}

const EASE = [0.215, 0.61, 0.355, 1];

export default function ThreadRule({
  start = true,
  delay = 0.55,
  className = "mt-4 h-8 w-full max-w-2xl md:mt-5 md:h-10",
  strokeWidth = 2,
}) {
  const reduced = useReducedMotion();
  return (
    <svg
      viewBox="0 0 640 48"
      className={className}
      preserveAspectRatio="xMinYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="thread-rule" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M2 26 C 70 10, 130 40, 200 24 S 330 8, 400 24 c 14 -10, 32 -2, 24 10 c -8 12, -28 6, -20 -8 c 8 -14, 34 -12, 62 -4 S 560 34, 638 16"
        stroke="url(#thread-rule)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={reduced || start ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{
          pathLength: { duration: 1.5, delay, ease: EASE },
          opacity: { duration: 0.2, delay },
        }}
      />
    </svg>
  );
}
