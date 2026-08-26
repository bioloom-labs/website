// Build-time prerender: one static HTML file per route.
//
// The app is a client-side SPA, so every path used to serve the same near-empty
// `<div id="root">`. A crawler that doesn't run JavaScript — and most don't,
// while Google renders on a queue rather than at crawl time — saw no title, no
// heading and no text on any page but the home page. This walks the same .jsonc
// files the pages fetch at runtime and writes each route's real title,
// description, structured data and text into its own file.
//
// main.jsx mounts with createRoot, not hydrateRoot, so React discards whatever
// is inside #root and renders over it. The markup here therefore only has to
// match the page's *content*, not its DOM shape — which is why the crawlable
// team listing can use plain <a href> links to each person while the live page
// keeps opening its modals from local state. Nothing about the rendered page
// changes; this is what arrives before React runs.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROUTES,
  SITE_NAME,
  ORIGIN,
  DEFAULT_TITLE,
  slugify,
  personDescription,
} from "../src/utils/seoMeta.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PUBLIC = join(ROOT, "public");

const readJSONC = (name) =>
  JSON.parse(
    readFileSync(join(PUBLIC, name), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/.*$/gm, "$1")
  );

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Blank-line-separated prose to paragraphs; arrays of strings work too. */
const paras = (text) =>
  (Array.isArray(text) ? text : String(text || "").split(/\n{2,}/))
    .map((p) => String(p).trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("\n");

/* ── page content ─────────────────────────────────────────────────────────── */

const home = readJSONC("home.jsonc");
const about = readJSONC("about.jsonc");
const research = readJSONC("research.jsonc");
const people = readJSONC("people.jsonc");
const news = readJSONC("news.jsonc");
const publications = JSON.parse(readFileSync(join(PUBLIC, "scholar-publications.json"), "utf8"));

const members = [
  ...people.current_sections.flatMap((s) => s.members.map((m) => ({ ...m, section: s.title }))),
  ...(people.previous || []).map((m) => ({ ...m, section: "Alumni", alumnus: true })),
];

const personPath = (m) => `/people/${slugify(m.name)}`;

const canonicalPath = (p) => (p === "/" ? "/" : `${p}/`);

const bodies = {
  "/": `
    <h1>${esc(home.hero.title)}</h1>
    <p>${esc(home.hero.lead)}</p>
    ${paras(home.hero.subtitle)}`,

  "/about": `
    <h1>${esc(about.title)}</h1>
    ${paras(about.intro)}
    ${(about.narrative || [])
      .map(
        (n) => `<section>
      <h2>${esc(n.heading)}</h2>
      ${paras(n.who)}
      ${paras(n.vision)}
    </section>`
      )
      .join("\n")}
    ${paras(about.closing)}`,

  "/research": `
    <h1>Research</h1>
    ${research
      .map(
        (r) => `<article>
      <h2>${esc(r.title)}</h2>
      <p>${esc(r.teaser)}</p>
      ${paras(r.body)}
    </article>`
      )
      .join("\n")}`,

  "/people": `
    <h1>People</h1>
    ${[...people.current_sections, { title: "Alumni", members: people.previous || [] }]
      .filter((s) => s.members.length)
      .map(
        (s) => `<section>
      <h2>${esc(s.title)}</h2>
      ${s.members
        .map(
          (m) => `<article>
        <h3><a href="${esc(canonicalPath(personPath(m)))}">${esc(m.name)}</a></h3>
        <p>${esc(m.role)}</p>
        ${paras(m.description)}
      </article>`
        )
        .join("\n")}
    </section>`
      )
      .join("\n")}`,

  "/publications": `
    <h1>Publications</h1>
    <ol>
      ${publications
        .map(
          (p) =>
            `<li><cite>${esc(p.title)}</cite>${p.authors?.length ? ` — ${esc(p.authors.join(", "))}` : ""}${
              p.year ? ` (${esc(p.year)})` : ""
            }${p.journal ? `. ${esc(p.journal)}` : ""}</li>`
        )
        .join("\n")}
    </ol>`,

  "/news": `
    <h1>News</h1>
    ${news
      .map(
        (n) => `<article>
      <h2>${esc(n.title)}</h2>
      ${n.date ? `<time datetime="${esc(n.date)}">${esc(n.date)}</time>` : ""}
      <p>${esc(n.text)}</p>
      ${paras(n.body)}
    </article>`
      )
      .join("\n")}`,

  "/contact": `
    <h1>Contact</h1>
    <p>${esc(ROUTES["/contact"].description)}</p>
    <p>School of Biological and Behavioural Sciences, Queen Mary University of London.</p>`,
};

/* ── structured data ──────────────────────────────────────────────────────── */

const pi = members.find((m) => m.section === "Principal Investigator") || members[0];

const organization = {
  "@context": "https://schema.org",
  "@type": "ResearchOrganization",
  name: SITE_NAME,
  alternateName: "BIOLOOM",
  url: `${ORIGIN}/`,
  logo: `${ORIGIN}/images/logos/bioloom.webp`,
  description: ROUTES["/"].description,
  parentOrganization: { "@type": "CollegeOrUniversity", name: "Queen Mary University of London" },
  founder: { "@type": "Person", name: pi.name, url: `${ORIGIN}${canonicalPath(personPath(pi))}` },
  member: members
    .filter((m) => !m.alumnus)
    .map((m) => ({ "@type": "Person", name: m.name, url: `${ORIGIN}${canonicalPath(personPath(m))}` })),
};

const personSchema = (m) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: m.name,
  url: `${ORIGIN}${canonicalPath(personPath(m))}`,
  jobTitle: m.role,
  description: (m.description || "").replace(/\s+/g, " ").trim() || undefined,
  image: m.photo ? `${ORIGIN}${m.photo}` : undefined,
  email: m.email ? `mailto:${m.email}` : undefined,
  affiliation: { "@type": "Organization", name: SITE_NAME, url: `${ORIGIN}/` },
  worksFor: { "@type": "CollegeOrUniversity", name: "Queen Mary University of London" },
  // The profiles that already rank for this person's name. sameAs is how a
  // search engine ties this page to the entity behind those profiles.
  sameAs: [...(m.links || []), m.website, m.linkedin, m.github].filter(Boolean),
});

/* ── assembly ─────────────────────────────────────────────────────────────── */

// The home route writes back over dist/index.html, which is also the template
// every other route is built from. Running twice without an intervening build
// would otherwise read an already-prerendered page as the template: the empty
// #root it looks for is gone, so the body injection quietly does nothing and
// every page inherits the home page's text. Stripping both injection sites
// makes the read idempotent.
const template = readFileSync(join(DIST, "index.html"), "utf8")
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
  .replace(/<div id="root">[\s\S]*<\/div>/, '<div id="root"></div>');

if (!template.includes('<div id="root"></div>')) {
  throw new Error("dist/index.html has no #root to render into — run `vite build` first.");
}

function render({ path, title, description, body, jsonLd = [] }) {
  // Cloudflare Pages 308s /about to /about/ and serves the file from there, so
  // that trailing-slash form is the URL a crawler actually lands on. Declaring
  // the slashless one canonical would point each page at a URL that redirects
  // straight back to it.
  const url = `${ORIGIN}${canonicalPath(path)}`;
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;

  const head = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(
      /(<meta name="description"\s+content=")[\s\S]*?(" \/>)/,
      `$1${esc(description)}$2`
    )
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(fullTitle)}$2`)
    .replace(
      /(<meta property="og:description"\s+content=")[\s\S]*?(")/,
      `$1${esc(description)}$2`
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(fullTitle)}$2`)
    .replace(
      /(<meta name="twitter:description"\s+content=")[\s\S]*?(")/,
      `$1${esc(description)}$2`
    );

  const scripts = jsonLd
    .map((d) => `    <script type="application/ld+json">${JSON.stringify(d)}</script>`)
    .join("\n");

  const html = head
    .replace("</head>", `${scripts}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root"><main>${body}</main></div>`);

  const out = path === "/" ? join(DIST, "index.html") : join(DIST, path.slice(1), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return path;
}

const pages = [
  ...Object.entries(ROUTES).map(([path, meta]) => ({
    path,
    ...meta,
    body: bodies[path],
    jsonLd: path === "/" ? [organization] : [],
  })),
  ...members.map((m) => ({
    path: personPath(m),
    title: m.name,
    description: personDescription(m),
    jsonLd: [personSchema(m)],
    body: `
      <h1>${esc(m.name)}</h1>
      <p>${esc(m.role)}</p>
      ${paras(m.description)}
      ${
        (m.links || []).length
          ? `<ul>${m.links.map((l) => `<li><a href="${esc(l)}" rel="noopener">${esc(l)}</a></li>`).join("")}</ul>`
          : ""
      }
      <p><a href="/people/">All members of ${esc(SITE_NAME)}</a></p>`,
  })),
];

const written = pages.map(render);

// Deliberately no _redirects rules per route. Cloudflare Pages serves
// /people/samuel-pironon from that directory's index.html by itself, and only
// falls back to the SPA catch-all when no file matches — so the files below are
// reachable as they stand. Writing the routes out explicitly looked like cheap
// insurance until two things in Cloudflare's docs ruled it out: redirects there
// are "always followed, regardless of whether or not an asset matches", and
// Pages separately redirects .html paths to their extension-less form, which a
// `/people -> /people/index.html` rewrite could bounce against. Getting no
// benefit if the catch-all wins is survivable; a redirect loop on live pages is
// not. If a deployed person URL ever returns the home page, the fix is to drop
// the `/*` line from public/_redirects and let Pages' own SPA fallback stand in.
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${written.map((p) => `  <url><loc>${ORIGIN}${canonicalPath(p)}</loc></url>`).join("\n")}
</urlset>
`
);

console.log(`prerendered ${written.length} routes (${members.length} people) + sitemap.xml`);
