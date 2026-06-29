import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Per-route document title + meta tags, with no extra dependency.
//
// index.html ships sensible site-wide defaults (description, Open Graph,
// Twitter card) so non-JS social scrapers always get something useful. This
// hook updates those same tags on each route so Google — which renders JS —
// indexes a page-specific title and description instead of the shared one.

const SITE_NAME = "BioLoom Labs";
const ORIGIN = "https://bioloom-labs.com";
const DEFAULT_TITLE = `${SITE_NAME} — Biodiversity & People Research Group`;

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Set the page title and description for the current route.
 * @param {{ title?: string, description?: string }} opts
 *   `title` is suffixed with the site name ("About — BioLoom Labs"); omit it on
 *   the home page to use the full branded default title.
 */
export default function useSeo({ title, description } = {}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const url = `${ORIGIN}${pathname}`;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertCanonical(url);
  }, [title, description, pathname]);
}
