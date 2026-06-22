// Client-side semantic search for the Publications page.
//
// Pairs precomputed publication embeddings (public/publications-embeddings.json,
// produced by scripts/embed-publications.mjs) with a small sentence-embedding
// model loaded lazily in the browser. The query is embedded in-browser and
// ranked against the publications by cosine similarity. No server, no API key.
//
// The model (~25 MB, quantized) is only fetched the first time someone actually
// searches, and is then cached by the browser. Until it loads, the Publications
// page falls back to plain keyword matching.

const MODEL = "Xenova/all-MiniLM-L6-v2";

let embeddingsPromise = null; // { dim, model, byTitle: Map<key, Float32Array> }
let extractorPromise = null; // transformers.js feature-extraction pipeline

// Must match normalizeTitle() in scripts/embed-publications.mjs.
export function normalizeTitle(t) {
  return (t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function loadEmbeddings() {
  if (!embeddingsPromise) {
    embeddingsPromise = fetch("/publications-embeddings.json")
      .then((r) => {
        if (!r.ok) throw new Error("embeddings not found");
        return r.json();
      })
      .then((data) => {
        const byTitle = new Map();
        for (const it of data.items || []) {
          byTitle.set(it.key, Float32Array.from(it.vector));
        }
        return { dim: data.dim, model: data.model, byTitle };
      });
  }
  return embeddingsPromise;
}

async function getExtractor() {
  if (!extractorPromise) {
    // Dynamic import keeps transformers.js out of the main bundle — it loads as
    // its own chunk only when semantic search is first used.
    extractorPromise = import("@huggingface/transformers").then(({ pipeline, env }) => {
      env.allowLocalModels = false; // always fetch the model from the HF CDN
      return pipeline("feature-extraction", MODEL, { dtype: "q8" });
    });
  }
  return extractorPromise;
}

export async function embedQuery(text) {
  const extract = await getExtractor();
  const out = await extract(text, { pooling: "mean", normalize: true });
  return Float32Array.from(out.data);
}

// Cosine similarity; both vectors are L2-normalized, so this is just the dot.
function cosine(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

// Returns Map<normalizedTitle, score in [-1, 1]> for the given query.
export async function semanticScores(query) {
  const [{ byTitle }, qv] = await Promise.all([loadEmbeddings(), embedQuery(query)]);
  const scores = new Map();
  for (const [key, vec] of byTitle) scores.set(key, cosine(qv, vec));
  return scores;
}

// Warm the embeddings + model ahead of the first query (e.g. on input focus),
// so results feel instant once the user types. Errors are swallowed; the page
// falls back to keyword search.
export function warmSemanticSearch() {
  loadEmbeddings().catch(() => {});
  getExtractor().catch(() => {});
}
