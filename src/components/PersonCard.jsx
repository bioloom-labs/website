// PersonCard.jsx
import { Mail, Globe, Linkedin, Github, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// --- Helpers ---------------------------------------------------------------

function XLogoIcon(props) {
  // Official X (Twitter) logo. Inherits currentColor, so it matches your theme.
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

function normalizeUrl(url = "") {
  const u = url.trim();
  if (!u) return "";
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function SocialLink({ href, title, label, children }) {
  const safe = normalizeUrl(href);
  if (!safe) return null;
  const text = label || title;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="social inline-flex items-center gap-2 text-sm"
      title={title}
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {text && (
        <span className="text-xs font-medium text-white/80">{text}</span>
      )}
    </a>
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
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState("auto");
  const innerRef = useRef(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [photoErrored, setPhotoErrored] = useState(false);

  const formattedBlurb = useMemo(() => formatBlurbWithLinks(blurb), [blurb]);

  // Auto-detect any extra links and assign an icon type
  const auto = links
    .map((l) => {
      const raw = (l || "").trim();
      const url = raw.toLowerCase();
      if (!url) return null;
      if (url.includes("twitter.com") || url.includes("x.com"))
        return { icon: "x", href: raw };
      if (url.includes("bsky.app") || url.includes("bluesky"))
        return { icon: "bluesky", href: raw };
      if (url.includes("linkedin.com")) return { icon: "linkedin", href: raw };
      if (url.includes("github.com")) return { icon: "github", href: raw };
      if (url.includes("orcid.org")) return { icon: "orcid", href: raw };
      if (url.includes("scholar.google."))
        return { icon: "google-scholar", href: raw };
      if (url.includes("researchgate.net"))
        return { icon: "researchgate", href: raw };
      if (url.startsWith("mailto:")) return { icon: "mail", href: raw };
      if (url.startsWith("http")) return { icon: "globe", href: raw };
      return { icon: "globe", href: raw };
    })
    .filter(Boolean);

  // Allow shorthand inputs (e.g. twitter handle) by normalizing them
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

  const isInteractive = Boolean(blurb);

  // Hover detection (same pattern as Publications)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handle = (ev) => setHoverEnabled(ev.matches);
    setHoverEnabled(mq.matches);

    if (mq.addEventListener) mq.addEventListener("change", handle);
    else if (mq.addListener) mq.addListener(handle);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else if (mq.removeListener) mq.removeListener(handle);
    };
  }, []);

  // Height measurement – copied logic from PubItem
  useLayoutEffect(() => {
    if (!innerRef.current || !isInteractive) {
      setHeight("auto");
      return;
    }

    if (expanded) {
      const fullHeight = innerRef.current.scrollHeight;
      setHeight(fullHeight + "px");
    } else {
      const headerEl = innerRef.current.firstChild; // wrapper with header + preview + connect
      const collapsedHeight = headerEl
        ? headerEl.scrollHeight
        : innerRef.current.scrollHeight;
      setHeight(collapsedHeight + "px");
    }
  }, [expanded, isInteractive, hasContact, formattedBlurb]);

  // Staggered fade-in / slide-up
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

  function handleClick() {
    if (!isInteractive) return;
    setExpanded((v) => !v);
  }

  function handleMouseEnter() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(true);
  }

  function handleMouseLeave() {
    if (!hoverEnabled || !isInteractive) return;
    setExpanded(false);
  }

  const cardClass = [
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/5",
    "backdrop-blur",
    "overflow-hidden",
    "transform-gpu",
    isInteractive ? "cursor-pointer" : "cursor-default",
    expanded
      ? "scale-[1.015] shadow-xl shadow-brand-900/40 border-brand-300/60"
      : "scale-100",
    hasAppeared ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
  ].join(" ");

  return (
    <article
      className={cardClass}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        height: isInteractive ? height : "auto",
        transition:
          "height 220ms ease, transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
      }}
      aria-expanded={isInteractive ? expanded : undefined}
    >
      <div ref={innerRef}>
        {/* STATIC BLOCK: avatar + name + role + preview + connect */}
        <div>
          <div className="px-6 py-5 flex items-start gap-4">
            {photo && !photoErrored ? (
              <img
                src={photo}
                alt={`${name} profile photo`}
                className="avatar"
                loading="lazy"
                onClick={(e) => e.stopPropagation()}
                onError={() => setPhotoErrored(true)}
              />
            ) : (
              <PlaceholderAvatar />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{name}</div>
                  {role && (
                    <div className="text-sm text-white/70 mt-0.5">{role}</div>
                  )}
                </div>
                {isInteractive && (
                  <ChevronDown
                    className={[
                      "h-5 w-5 text-white/60 transition-transform duration-200 shrink-0",
                      expanded ? "rotate-180" : "rotate-0",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>

          {formattedBlurb && (
            <div className="px-6 pb-4">
              <p
                className={[
                  "text-sm text-white/80 leading-relaxed",
                  expanded ? "" : "line-clamp-2",
                ].join(" ")}
              >
                {formattedBlurb}
              </p>
            </div>
          )}

          {hasContact && (
            <div
              className="px-6 pb-6 pt-4 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="social-row">
                {email && (
                  <SocialLink
                    href={`mailto:${email}`}
                    title="Email"
                    label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </SocialLink>
                )}

                {websiteUrl && (
                  <SocialLink
                    href={websiteUrl}
                    title="Website"
                    label="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </SocialLink>
                )}

                {twitterUrl && (
                  <SocialLink href={twitterUrl} title="X" label="X">
                    <XLogoIcon className="h-4 w-4" />
                  </SocialLink>
                )}

                {linkedinUrl && (
                  <SocialLink
                    href={linkedinUrl}
                    title="LinkedIn"
                    label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </SocialLink>
                )}

                {githubUrl && (
                  <SocialLink href={githubUrl} title="GitHub" label="GitHub">
                    <Github className="h-4 w-4" />
                  </SocialLink>
                )}

                {auto.map((item, idx) => {
                  const key = `auto-${idx}-${item.href}`;
                  let icon = null;
                  let label = "Link";

                  if (item.icon === "x") {
                    icon = <XLogoIcon className="h-4 w-4" />;
                    label = "X";
                  } else if (item.icon === "bluesky") {
                    icon = (
                      <img
                        src="/images/socials/bluesky.svg"
                        alt="Bluesky icon"
                        className="h-4 w-4 object-contain"
                      />
                    );
                    label = "Bluesky";
                  } else if (item.icon === "linkedin") {
                    icon = <Linkedin className="h-4 w-4" />;
                    label = "LinkedIn";
                  } else if (item.icon === "github") {
                    icon = <Github className="h-4 w-4" />;
                    label = "GitHub";
                  } else if (item.icon === "orcid") {
                    icon = (
                      <img
                        src="/images/socials/orcid.png"
                        alt="ORCID icon"
                        className="h-4 w-4 object-contain"
                      />
                    );
                    label = "ORCID";
                  } else if (item.icon === "google-scholar") {
                    icon = (
                      <img
                        src="/images/socials/googlescholar.png"
                        alt="Google Scholar icon"
                        className="h-4 w-4 object-contain"
                      />
                    );
                    label = "Google Scholar";
                  } else if (item.icon === "researchgate") {
                    icon = (
                      <img
                        src="/images/socials/researchgate.png"
                        alt="ResearchGate icon"
                        className="h-4 w-4 object-contain"
                      />
                    );
                    label = "ResearchGate";
                  } else if (item.icon === "mail") {
                    icon = <Mail className="h-4 w-4" />;
                    label = "Email";
                  } else {
                    icon = (
                      <FaviconIcon
                        href={item.href}
                        label="External link"
                        fallback={Globe}
                      />
                    );
                    label = "Website";
                  }

                  return (
                    <SocialLink
                      key={key}
                      href={item.href}
                      title={label}
                      label={label}
                    >
                      {icon}
                    </SocialLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* No separate expanding block – the blurb itself un-clamps when expanded */}
      </div>
    </article>
  );
}
