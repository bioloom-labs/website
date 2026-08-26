// Route titles and descriptions, in one place.
//
// Two things consume this: useSeo, which sets the tags once React has mounted,
// and scripts/prerender.mjs, which bakes the same values into the static HTML
// at build time. Keeping them in a shared module is the point — a title edited
// in only one of the two would show search engines one thing and visitors
// another. Plain JS with no React import, so the build script can read it.

export const SITE_NAME = "BioLoom Labs";
export const ORIGIN = "https://bioloom-labs.com";
export const DEFAULT_TITLE = `${SITE_NAME} — Biodiversity Research Led by Samuel Pironon`;

// `title` is suffixed with the site name ("About — BioLoom Labs"); the home
// page omits it to keep the full branded title.
export const ROUTES = {
  "/": {
    description:
      "BIOLOOM is a biodiversity research group led by Dr. Samuel Pironon, using large-scale data and macroecology to explore how people and nature are connected.",
  },
  "/about": {
    title: "About",
    description:
      "The story, vision, and values behind BIOLOOM — an interdisciplinary biodiversity research group studying how people and nature are woven together.",
  },
  "/research": {
    title: "Research",
    description:
      "Explore BIOLOOM's research on biodiversity and its contributions to people — mapping and predicting the past, present, and future of nature.",
  },
  "/people": {
    title: "People",
    description:
      "Meet the BIOLOOM team — the researchers and students studying how biodiversity and people are connected, led by Dr. Samuel Pironon.",
  },
  "/publications": {
    title: "Publications",
    description:
      "Browse publications from the BIOLOOM biodiversity research group, with in-browser semantic search across the group's work.",
  },
  "/news": {
    title: "News",
    description:
      "Papers, datasets, talks and fieldwork from BIOLOOM Labs — what the lab has been working on, as it happens.",
  },
  "/contact": {
    title: "Contact",
    description:
      "Get in touch with BIOLOOM — a biodiversity and people research group led by Dr. Samuel Pironon.",
  },
};

/** "Samuel Pironon" → "samuel-pironon". Accents are folded so the slug stays ASCII. */
export function slugify(name = "") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The search description for a person's own page, trimmed to a sensible length. */
export function personDescription(person) {
  const bio = (person.description || "").replace(/\s+/g, " ").trim();
  const lead = `${person.name}, ${person.role || "member of BIOLOOM Labs"}.`;
  if (!bio) return lead;
  const room = 300 - lead.length - 1;
  return `${lead} ${bio.length > room ? `${bio.slice(0, room).replace(/\s+\S*$/, "")}…` : bio}`;
}
