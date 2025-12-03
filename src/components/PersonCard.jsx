import {
  Mail,
  Globe,
  Linkedin,
  Github,
  X as CloseIcon,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// --- Helpers ---------------------------------------------------------------

function XLogoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 1227"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M714.163 519.284L1160.89 0H1056.7L666.754 450.887L361.82 0H0L466.076 681.821L0 1226.37H104.19L515.941 752.678L838.18 1226.37H1200L714.137 519.284H714.163ZM571.152 689.908L521.28 618.782L142.107 80.126H310.005L609.627 508.444L659.498 579.57L1068.04 1146.24H900.142L571.152 689.934V689.908Z" />
    </svg>
  );
}

function BlueskyLogoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.4 8.5c6.2 0 11.9 4.9 15.6 10 3.7-5.1 9.4-10 15.6-10 6.3 0 11 6.8 5.4 14.6l-.6.8L41.4 34.9c-1.9 2.2-3 5-3.2 7.9-.3 4.2-3.7 7.6-7.8 7.6s-7.5-3.4-7.8-7.6c-.2-2.9-1.3-5.7-3.2-7.9L11.6 23.9l-.6-.8C5.4 15.3 10.1 8.5 16.4 8.5z" />
    </svg>
  );
}

function GoogleScholarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 20 32 8l28 12-28 12L4 20zm12 11.4V44c0 9.4 7.6 15.5 16 15.5S48 53.4 48 44V31.4l-16 7-16-7z" />
    </svg>
  );
}

function OrcidIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M32.1 4C17 4 4.9 16.1 4.9 31.2 4.9 46.3 17 58.4 32.1 58.4s27.2-12.1 27.2-27.2C59.3 16.1 47.2 4 32.1 4zm-5.4 13.8c1.3 0 2.3 1 2.3 2.3v23.1c0 1.3-1 2.3-2.3 2.3-1.3 0-2.3-1-2.3-2.3V20.1c0-1.3 1-2.3 2.3-2.3zm13.3 0c6.4 0 10.3 4.6 10.3 11.5 0 7.7-4.4 12-10.5 12h-6.3V17.8zm-3.8 6.5v14h3.4c3.5 0 5.6-2.5 5.6-7 0-4.4-2.2-7-5.6-7z" />
    </svg>
  );
}

function normalizeUrl(url = "") {
  const u = url.trim();
  if (!u) return "";
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function getFaviconFromUrl(url = "") {
  try {
    const safe = normalizeUrl(url);
    const u = new URL(safe);
    return `${u.origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function FaviconIcon({ href, label = "", fallback: FallbackIcon = null }) {
  const [errored, setErrored] = useState(false);
  const iconSrc = getFaviconFromUrl(href);
  if (!iconSrc || errored) {
    return FallbackIcon ? (
      <FallbackIcon className="h-4 w-4" aria-hidden="true" />
    ) : null;
  }
  return (
    <img
      src={iconSrc}
      alt={label ? `${label} icon` : "Link icon"}
      className="h-4 w-4 object-contain"
      onError={() => setErrored(true)}
    />
  );
}

const PLACEHOLDER_AVATAR = `${import.meta.env.BASE_URL}images/people/placeholder.svg`;

function PlaceholderAvatar() {
  return (
    <img
      src={PLACEHOLDER_AVATAR}
      alt="Anonymous profile"
      className="avatar bg-white/10 p-2"
      loading="lazy"
    />
  );
}

function formatBlurbWithLinks(blurb = "") {
  if (!blurb) return null;
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(blurb)) !== null) {
    const [fullMatch, label, url] = match;
    if (match.index > lastIndex) {
      nodes.push(blurb.slice(lastIndex, match.index));
    }
    nodes.push(
      <a
        key={`blurb-link-${key++}`}
        href={normalizeUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-200 underline decoration-dotted underline-offset-2 font-medium"
        onClick={(event) => event.stopPropagation()}
      >
        {label}
      </a>
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < blurb.length) {
    nodes.push(blurb.slice(lastIndex));
  }

  return nodes.length ? nodes : blurb;
}

// --- Component -------------------------------------------------------------

export default function PersonCard({
  name = "",
  role = "",
  blurb = "",
  photo = "",
  email = "",
  website = "",
  twitter = "",
  linkedin = "",
  github = "",
  links = [],
  appearOrder = 0,
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [photoErrored, setPhotoErrored] = useState(false);

  const formattedBlurb = useMemo(() => formatBlurbWithLinks(blurb), [blurb]);

  // Auto-detect extra links (ORCID, Scholar, etc.) with labels
  const auto = links
    .map((l) => {
      const raw = (l || "").trim();
      const url = raw.toLowerCase();
      if (!url) return null;
      if (url.includes("twitter.com") || url.includes("x.com"))
        return { icon: "x", href: raw, label: "X" };
      if (url.includes("bsky.app") || url.includes("bluesky"))
        return { icon: "bluesky", href: raw, label: "Bluesky" };
      if (url.includes("linkedin.com"))
        return { icon: "linkedin", href: raw, label: "LinkedIn" };
      if (url.includes("github.com"))
        return { icon: "github", href: raw, label: "GitHub" };
      if (url.includes("orcid.org"))
        return { icon: "orcid", href: raw, label: "ORCID" };
      if (url.includes("scholar.google."))
        return { icon: "google-scholar", href: raw, label: "Google Scholar" };
      if (url.includes("researchgate.net"))
        return { icon: "researchgate", href: raw, label: "ResearchGate" };
      if (url.startsWith("mailto:"))
        return { icon: "mail", href: raw, label: "Email" };
      if (url.startsWith("http"))
        return { icon: "globe", href: raw, label: "Website" };
      return { icon: "globe", href: raw, label: "Website" };
    })
    .filter(Boolean);

  // Normalize shorthand handles
  const websiteUrl = website ? normalizeUrl(website) : "";
  const twitterUrl =
    twitter && !/^https?:\/\//i.test(twitter) && !/^mailto:/i.test(twitter)
      ? normalizeUrl(
        twitter.startsWith("@")
          ? `https://x.com/${twitter.slice(1)}`
          : twitter.includes("x.com") || twitter.includes("twitter.com")
            ? twitter
            : `https://x.com/${twitter}`
      )
      : normalizeUrl(twitter);
  const linkedinUrl = linkedin ? normalizeUrl(linkedin) : "";
  const githubUrl = github ? normalizeUrl(github) : "";

  const hasContact =
    !!(
      email ||
      websiteUrl ||
      twitterUrl ||
      linkedinUrl ||
      githubUrl ||
      auto.length
    );

  // Build a unified list of links for the modal (with labels)
  const modalLinks = [
    email && {
      key: "email",
      href: `mailto:${email}`,
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
    },
    websiteUrl && {
      key: "website",
      href: websiteUrl,
      label: "Website",
      icon: <Globe className="h-4 w-4" />,
    },
    twitterUrl && {
      key: "x",
      href: twitterUrl,
      label: "X",
      icon: <XLogoIcon className="h-4 w-4" />,
    },
    linkedinUrl && {
      key: "linkedin",
      href: linkedinUrl,
      label: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
    },
    githubUrl && {
      key: "github",
      href: githubUrl,
      label: "GitHub",
      icon: <Github className="h-4 w-4" />,
    },
    ...auto.map((item, idx) => {
      let iconNode = null;
      if (item.icon === "x") {
        iconNode = <XLogoIcon className="h-4 w-4" />;
      } else if (item.icon === "bluesky") {
        iconNode = (
          <img
            src="/images/socials/bluesky.svg"
            alt="Bluesky icon"
            className="h-4 w-4 object-contain"
          />
        );
      } else if (item.icon === "linkedin") {
        iconNode = <Linkedin className="h-4 w-4" />;
      } else if (item.icon === "github") {
        iconNode = <Github className="h-4 w-4" />;
      } else if (item.icon === "orcid") {
        iconNode = (
          <img
            src="/images/socials/orcid.png"
            alt="ORCID icon"
            className="h-4 w-4 object-contain"
          />
        );
      } else if (item.icon === "google-scholar") {
        iconNode = (
          <img
            src="/images/socials/googlescholar.png"
            alt="Google Scholar icon"
            className="h-4 w-4 object-contain"
          />
        );
      } else if (item.icon === "researchgate") {
        iconNode = (
          <img
            src="/images/socials/researchgate.png"
            alt="ResearchGate icon"
            className="h-4 w-4 object-contain"
          />
        );
      } else if (item.icon === "mail") {
        iconNode = <Mail className="h-4 w-4" />;
      } else {
        iconNode = (
          <FaviconIcon
            href={item.href}
            label="External link"
            fallback={Globe}
          />
        );
      }
      return {
        key: `auto-${idx}`,
        href: item.href,
        label: item.label || "Link",
        icon: iconNode,
      };
    }),
  ].filter(Boolean);

  // Staggered fade-in
  useEffect(() => {
    if (hasAppeared) return;
    const delay = appearOrder * 20;
    const timer = setTimeout(() => setHasAppeared(true), delay);
    return () => clearTimeout(timer);
  }, [appearOrder, hasAppeared]);

  useEffect(() => {
    if (hasAppeared) return;
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      setHasAppeared(true);
      return;
    }
    const raf = window.requestAnimationFrame(() => setHasAppeared(true));
    return () => window.cancelAnimationFrame(raf);
  }, [hasAppeared]);

  useEffect(() => {
    setPhotoErrored(false);
  }, [photo]);

  const cardClass = [
    "relative",
    "rounded-3xl",
    "border",
    "border-white/10",
    "bg-white/5",
    "backdrop-blur-xl",
    "transform-gpu",
    "transition-all duration-200",
    "cursor-pointer group",
    "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40",
    hasAppeared ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
  ].join(" ");

  function handleCardClick() {
    setOpen(true);
  }

  function handleOverlayClose() {
    setOpen(false);
  }

  return (
    <>
      {/* --- Compact grid card --- */}
      <article
        className={cardClass}
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={open}
      >
        <div className="px-7 pt-6 pb-4 flex items-start gap-6">
          {photo && !photoErrored ? (
            <img
              src={photo}
              alt={`${name} profile photo`}
              className="avatar"
              loading="lazy"
              onError={() => setPhotoErrored(true)}
            />
          ) : (
            <PlaceholderAvatar />
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white leading-tight">
                  {name}
                </div>
                {role && (
                  <div className="text-sm text-white/70 mt-1 leading-snug">
                    {role}
                  </div>
                )}
              </div>
              <ChevronDown
                className="h-5 w-5 text-white/60 transition-transform duration-200 group-hover:translate-y-0.5 shrink-0"
                aria-hidden="true"
              />
            </div>

            {/* Compact social icons row (front preview) */}
            {hasContact && (
              <div
                className="flex flex-wrap gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                    title="Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}

                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                    title="Website"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}

                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                    title="X"
                  >
                    <XLogoIcon className="h-3.5 w-3.5" />
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}

                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                    title="GitHub"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                )}

                {auto.map((item, idx) => {
                  let iconNode = null;
                  if (item.icon === "x") {
                    iconNode = <XLogoIcon className="h-3.5 w-3.5" />;
                  } else if (item.icon === "bluesky") {
                    iconNode = (
                      <img
                        src="/images/socials/bluesky.svg"
                        alt="Bluesky icon"
                        className="h-3.5 w-3.5 object-contain"
                      />
                    );
                  } else if (item.icon === "linkedin") {
                    iconNode = <Linkedin className="h-3.5 w-3.5" />;
                  } else if (item.icon === "github") {
                    iconNode = <Github className="h-3.5 w-3.5" />;
                  } else if (item.icon === "orcid") {
                    iconNode = (
                      <img
                        src="/images/socials/orcid.png"
                        alt="ORCID icon"
                        className="h-3.5 w-3.5 object-contain"
                      />
                    );
                  } else if (item.icon === "google-scholar") {
                    iconNode = (
                      <img
                        src="/images/socials/googlescholar.png"
                        alt="Google Scholar icon"
                        className="h-3.5 w-3.5 object-contain"
                      />
                    );
                  } else if (item.icon === "researchgate") {
                    iconNode = (
                      <img
                        src="/images/socials/researchgate.png"
                        alt="ResearchGate icon"
                        className="h-3.5 w-3.5 object-contain"
                      />
                    );
                  } else if (item.icon === "mail") {
                    iconNode = <Mail className="h-3.5 w-3.5" />;
                  } else {
                    iconNode = (
                      <FaviconIcon
                        href={item.href}
                        label="External link"
                        fallback={Globe}
                      />
                    );
                  }

                  return (
                    <a
                      key={`auto-compact-${idx}`}
                      href={normalizeUrl(item.href)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10"
                      title={item.label || "Link"}
                    >
                      {iconNode}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hover “drop-down” hint – hangs just below the card */}
        <div
          className={[
            "pointer-events-none absolute left-7 right-7 -bottom-3",
            "transition-all duration-200 ease-out transform-gpu",
            hovered && !open
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1",
          ].join(" ")}
        >
          <div className="rounded-2xl border border-dashed border-white/25 bg-slate-950/90 px-3 py-1.5 text-[11px] font-medium text-white/80 tracking-wide backdrop-blur">
            Click to find out more!
          </div>
        </div>
      </article>

      {/* --- Pop-out “modal” at ~60% screen, 3:2 aspect --- */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-[min(60vw,64rem)] aspect-[3/2] max-h-[80vh] rounded-3xl bg-slate-950/95 border border-white/15 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`${name} profile`}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={handleOverlayClose}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition"
                aria-label="Close profile"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 px-7 pt-8 pb-6 overflow-hidden">
                {/* Left column: avatar + vertical social list (fixed width) */}
                <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-5 w-[11rem] shrink-0">
                  <div className="flex flex-col items-start md:items-center gap-3 md:gap-4 w-full">
                    {photo && !photoErrored ? (
                      <img
                        src={photo}
                        alt={`${name} profile photo`}
                        className="avatar md:h-36 md:w-36"
                        loading="lazy"
                      />
                    ) : (
                      <PlaceholderAvatar />
                    )}

                    {/* Name/role on small screens */}
                    <div className="block md:hidden text-left w-full">
                      <h2 className="text-xl font-semibold text-white leading-tight">
                        {name}
                      </h2>
                      {role && (
                        <p className="mt-1 text-sm text-white/70 leading-snug">
                          {role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vertical list of social links with icons & names */}
                  {hasContact && modalLinks.length > 0 && (
                    <div
                      className="w-full md:mt-2 overflow-y-auto pr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-2 w-full">
                        {modalLinks.map((link) => (
                          <a
                            key={link.key}
                            href={normalizeUrl(link.href)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 w-full justify-start rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition"
                          >
                            {link.icon}
                            <span className="font-medium tracking-wide">
                              {link.label}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column: name, role, bio */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
                  <div className="hidden md:block">
                    <h2 className="text-2xl font-semibold text-white leading-tight">
                      {name}
                    </h2>
                    {role && (
                      <p className="mt-2 text-sm text-white/70 leading-snug">
                        {role}
                      </p>
                    )}
                  </div>

                  {formattedBlurb && (
                    <div className="flex-1 min-h-[120px] overflow-y-auto pr-1 text-sm text-white/80 leading-relaxed">
                      {formattedBlurb}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
