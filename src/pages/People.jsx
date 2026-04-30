import { useEffect, useRef, useState } from "react";
import { Mail, Globe, Linkedin, Github, X as CloseIcon, Copy, Check, ExternalLink } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { createPortal } from "react-dom";
import { fetchJSONC } from "../utils/jsonc.js";

const PLACEHOLDER = `/images/people/placeholder.svg`;
const SHORT_BIO = 420;

// Nature images for parallax banners (one per section divider)
const PARALLAX_IMAGES = [
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80",
];

// ─── helpers ────────────────────────────────────────────────────────────────

function formatBlurbWithLinks(blurb = "") {
  if (!blurb) return null;
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(blurb)) !== null) {
    const [fullMatch, label, url] = match;
    if (match.index > lastIndex) nodes.push(blurb.slice(lastIndex, match.index));
    nodes.push(
      <a
        key={`blurb-link-${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-200 underline decoration-dotted underline-offset-2 font-medium hover:text-brand-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    );
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < blurb.length) nodes.push(blurb.slice(lastIndex));
  return nodes.length ? nodes : blurb;
}

function normalizeUrl(url = "") {
  const u = url.trim();
  if (!u) return "";
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function buildLinks(person) {
  const result = [];
  if (person.email) result.push({ href: `mailto:${person.email}`, label: person.email, type: "email" });
  if (person.website) result.push({ href: normalizeUrl(person.website), label: "Website", type: "website" });
  if (person.linkedin) result.push({ href: normalizeUrl(person.linkedin), label: "LinkedIn", type: "linkedin" });
  if (person.github) result.push({ href: normalizeUrl(person.github), label: "GitHub", type: "github" });
  if (person.twitter) result.push({ href: normalizeUrl(person.twitter), label: "X", type: "x" });
  (person.links || []).forEach((l) => {
    const low = (l || "").toLowerCase();
    if (low.includes("orcid.org")) result.push({ href: normalizeUrl(l), label: "ORCID", type: "orcid" });
    else if (low.includes("scholar.google")) result.push({ href: normalizeUrl(l), label: "Scholar", type: "scholar" });
    else if (low.includes("researchgate")) result.push({ href: normalizeUrl(l), label: "ResearchGate", type: "researchgate" });
  });
  return result;
}

function LinkIcon({ type, size = "3.5" }) {
  const cls = `h-${size} w-${size} object-contain`;
  if (type === "email") return <Mail className={`h-${size} w-${size}`} />;
  if (type === "linkedin") return <Linkedin className={`h-${size} w-${size}`} />;
  if (type === "github") return <Github className={`h-${size} w-${size}`} />;
  if (type === "orcid") return <img src="/images/socials/orcid.png" className={cls} alt="ORCID" />;
  if (type === "scholar") return <img src="/images/socials/googlescholar.png" className={cls} alt="Scholar" />;
  if (type === "researchgate") return <img src="/images/socials/researchgate.png" className={cls} alt="ResearchGate" />;
  return <Globe className={`h-${size} w-${size}`} />;
}

// Animated icon used by both badge and icon-btn
function AnimatedIcon({ type, hovered, copied, size = "3.5" }) {
  const iconKey = type === "email"
    ? (copied ? "check" : hovered ? "copy" : "default")
    : (hovered ? "external" : "default");

  const iconNode = type === "email"
    ? (copied ? <Check className={`h-${size} w-${size} text-green-400`} />
        : hovered ? <Copy className={`h-${size} w-${size}`} />
        : <LinkIcon type="email" size={size} />)
    : (hovered ? <ExternalLink className={`h-${size} w-${size}`} /> : <LinkIcon type={type} size={size} />);

  return (
    <span className={`relative h-${size} w-${size} flex items-center justify-center overflow-hidden shrink-0`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={iconKey}
          initial={{ x: 8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -8, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {iconNode}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Badge with icon + label (used in PI hero)
function LinkBadge({ link }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick(e) {
    if (link.type !== "email") return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(link.label);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { window.location.href = link.href; }
  }

  const labelText = link.type === "email" && copied ? "Copied!" : link.label;

  return (
    <a
      href={link.href}
      target={link.type === "email" ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={(e) => { e.stopPropagation(); handleClick(e); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition overflow-hidden"
    >
      <AnimatedIcon type={link.type} hovered={hovered} copied={copied} size="3.5" />
      <span className="font-medium truncate max-w-[160px]">{labelText}</span>
    </a>
  );
}

// Icon-only button with portal tooltip (used in cards + modal)
function LinkIconBtn({ link }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState(null);

  function handleMouseEnter() {
    setHovered(true);
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top - 8, left: r.left + r.width / 2 });
    }
  }

  async function handleClick(e) {
    if (link.type !== "email") return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(link.label);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { window.location.href = link.href; }
  }

  const tooltipText = link.type === "email" ? (copied ? "Copied!" : link.label) : link.label;

  return (
    <div ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={() => { setHovered(false); setPos(null); }}>
      <a
        href={link.href}
        target={link.type === "email" ? undefined : "_blank"}
        rel="noopener noreferrer"
        onClick={(e) => { e.stopPropagation(); handleClick(e); }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/60 hover:bg-brand-400/20 hover:text-brand-300 transition overflow-hidden"
      >
        <AnimatedIcon type={link.type} hovered={hovered} copied={copied} size="3.5" />
      </a>
      {pos && hovered && createPortal(
        <div className="fixed z-[200] pointer-events-none" style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}>
          <div className="whitespace-nowrap rounded-lg bg-slate-800 border border-white/15 px-2.5 py-1.5 text-xs text-white/90 shadow-lg mb-1">
            {tooltipText}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── member modal ────────────────────────────────────────────────────────────

function MemberModal({ person, onClose }) {
  const [imgErr, setImgErr] = useState(false);
  const links = buildLinks(person);
  const modalPhoto = person.focusPhoto || person.photo;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl bg-brand-950/98 border border-white/15 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${person.name} profile`}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <div className="flex flex-col md:flex-row gap-0 overflow-hidden flex-1">
            {/* Left: photo + links */}
            <div className="relative md:w-56 shrink-0">
              <img
                src={imgErr || !modalPhoto ? PLACEHOLDER : modalPhoto}
                alt={person.name}
                onError={() => setImgErr(true)}
                className="w-full h-48 md:h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/20 to-transparent md:bg-gradient-to-r" />
              {/* Links over photo at bottom */}
              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-wrap gap-1.5">
                {links.map((link, i) => (
                  <LinkIconBtn key={i} link={link} />
                ))}
              </div>
            </div>

            {/* Right: text */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 p-6 overflow-y-auto">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300 mb-1">
                  {person.role?.split(" at ")[0]}
                </p>
                <h2 className="text-2xl font-bold text-white leading-tight">{person.name}</h2>
                {person.role && (
                  <p className="mt-1 text-sm text-white/50">{person.role}</p>
                )}
              </div>

              <div className="h-px bg-white/8" />

              <p className="text-sm leading-relaxed text-white/65">
                {formatBlurbWithLinks(person.description) || "Lab member at BioLoom Labs."}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}


// ─── PI hero ─────────────────────────────────────────────────────────────────

function PIHero({ person }) {
  const [imgErr, setImgErr] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const links = buildLinks(person);
  const bio = person.description || "";
  const isLong = bio.length > SHORT_BIO;

  return (
    <div ref={ref} className="relative overflow-hidden border-b border-white/5">
      {/* Parallax bg */}
      <motion.div style={{ y }} className="absolute inset-0 scale-[1.6] pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-xs font-semibold uppercase tracking-[0.25em] text-brand-300"
        >
          Principal Investigator
        </motion.p>

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex shrink-0 flex-col items-center gap-5 md:items-start"
          >
            <div className="relative cursor-pointer" onClick={() => setModalOpen(true)}>
              <div className="absolute inset-0 scale-110 rounded-3xl bg-gradient-to-br from-brand-300/20 to-brand-600/10 blur-2xl" />
              <img
                src={imgErr || !person.photo ? PLACEHOLDER : person.photo}
                alt={person.name}
                onError={() => setImgErr(true)}
                className="relative h-60 w-60 rounded-3xl object-cover ring-1 ring-white/15 shadow-2xl shadow-brand-950 md:h-72 md:w-72 hover:ring-brand-400/40 transition"
              />
              <span className="absolute -bottom-3 -right-3 rounded-full bg-brand-400 px-3 py-1 text-xs font-bold text-brand-950 shadow-lg">
                PI
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {links.map((link, i) => <LinkBadge key={i} link={link} />)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              {person.name}
            </h1>
            <p className="mt-2 text-base font-medium text-brand-300/80">{person.role}</p>
            <div className="my-6 h-px bg-gradient-to-r from-brand-400/30 via-brand-400/10 to-transparent" />
            <motion.div
              animate={{ height: expanded ? "auto" : "7.5rem" }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
              style={{ height: "7.5rem" }}
            >
              <p className="max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                {formatBlurbWithLinks(bio)}
              </p>
            </motion.div>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-xs font-semibold text-brand-300 hover:text-brand-200 transition"
              >
                {expanded ? "Show less ↑" : "Read more ↓"}
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {modalOpen && <MemberModal person={person} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ─── member card ─────────────────────────────────────────────────────────────

function MemberCard({ person, index }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const links = buildLinks(person);
  const shortRole = person.role?.split(" at ")[0] ?? person.role ?? "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.45, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ aspectRatio: "3/4", width: "clamp(160px, 20vw, 220px)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setModalOpen(true)}
      >
        {/* Photo */}
        <img
          src={imgErr || !person.photo ? PLACEHOLDER : person.photo}
          alt={person.name}
          onError={() => setImgErr(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Permanent gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Hover darkening */}
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        />

        {/* "Click for bio" hint on hover */}
        <div
          className="absolute top-3 right-3 rounded-full bg-black/50 border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/80 transition-opacity duration-200 backdrop-blur-sm uppercase"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          View Bio
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-300 truncate">
            {shortRole}
          </p>
          <h3 className="text-sm font-semibold leading-tight text-white">{person.name}</h3>

          {/* Description on hover */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: hovered ? "120px" : "0px", opacity: hovered ? 1 : 0 }}
          >
            <p className="mt-1 text-[11px] leading-relaxed text-white/55 line-clamp-4">
              {formatBlurbWithLinks(person.description) || "Lab member at BioLoom Labs."}
            </p>
            {links.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {links.slice(0, 5).map((link, i) => (
                  <LinkIconBtn key={i} link={link} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {modalOpen && <MemberModal person={person} onClose={() => setModalOpen(false)} />}
    </>
  );
}

// ─── team section ─────────────────────────────────────────────────────────────

function TeamSection({ section, sectionIndex, imageUrl }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const num = String(sectionIndex + 1).padStart(2, "0");

  return (
    <div ref={ref} className="relative overflow-hidden border-t border-white/5">
      {/* Parallax bg image */}
      {imageUrl && (
        <motion.div style={{ y }} className="absolute inset-0 scale-[1.6] pointer-events-none">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </motion.div>
      )}
      {/* Dark overlay so content stays readable */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <div className="pointer-events-none absolute right-4 top-4 select-none text-[10rem] font-black leading-none text-white/[0.025]">
          {num}
        </div>

        <div className="mb-10 flex items-center gap-4">
          <span className="w-20 shrink-0 font-mono text-sm font-bold text-brand-300/60">{num}</span>
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-2xl font-bold text-white">{section.title}</h2>
          <div className="h-px flex-1 bg-white/10" />
          <span className="pill w-20 shrink-0 justify-center border-white/10 bg-white/5 text-xs text-white/40">
            {section.members.length} {section.members.length === 1 ? "person" : "people"}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {section.members.map((person, i) => (
            <MemberCard key={person.name} person={person} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── alumni ──────────────────────────────────────────────────────────────────

function Alumni({ members, imageUrl }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <div ref={ref} className="relative overflow-hidden border-t border-white/5">
      {imageUrl && (
        <motion.div style={{ y }} className="absolute inset-0 scale-[1.6] pointer-events-none">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 flex items-center gap-4">
          <span className="w-20 shrink-0 font-mono text-sm font-bold text-brand-300/60">—</span>
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-2xl font-bold text-white">Alumni</h2>
          <div className="h-px flex-1 bg-white/10" />
          <span className="pill w-20 shrink-0 justify-center border-white/10 bg-white/5 text-xs text-white/40">
            {members.length} {members.length === 1 ? "person" : "people"}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {members.map((person, i) => (
            <MemberCard key={person.name} person={person} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function People() {
  const [data, setData] = useState({ sections: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchJSONC("/people.jsonc");
        const previous = Array.isArray(response?.previous) ? response.previous : [];
        let sections = [];
        if (Array.isArray(response?.current_sections)) {
          sections = response.current_sections.map((s, i) => ({
            title: s?.title || `Section ${i + 1}`,
            members: Array.isArray(s?.members) ? s.members : [],
          }));
        }
        setData({ sections, previous });
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/40 text-sm">
        Loading people…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const piSection = data.sections.find((s) =>
    s.title.toLowerCase().includes("principal")
  );
  const pi = piSection?.members[0];
  const otherSections = data.sections.filter(
    (s) => !s.title.toLowerCase().includes("principal")
  );

  return (
    <div className="min-h-screen text-white">
      {pi && <PIHero person={pi} />}

      {otherSections.map((section, i) => (
        <TeamSection
          key={section.title}
          section={section}
          sectionIndex={i}
          imageUrl={PARALLAX_IMAGES[i % PARALLAX_IMAGES.length]}
        />
      ))}

      {data.previous.length > 0 && (
        <Alumni
          members={data.previous}
          imageUrl={PARALLAX_IMAGES[otherSections.length % PARALLAX_IMAGES.length]}
        />
      )}
    </div>
  );
}
