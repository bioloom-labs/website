// Precompute sentence embeddings for each publication so the Publications page
// can do semantic search in the browser without a server.
//
//   node scripts/embed-publications.mjs
//
// Reads  public/scholar-publications.json
// Writes public/publications-embeddings.json   (commit this artifact)
//
// Re-run whenever the publication list changes (e.g. after the weekly
// fetch_scholar.py update). Publications without a matching embedding simply
// fall back to plain keyword search in the browser.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const IN = path.join(PUBLIC, "scholar-publications.json");
const OUT = path.join(PUBLIC, "publications-embeddings.json");

const MODEL = "Xenova/all-MiniLM-L6-v2";

// Must match normalizeTitle() in src/utils/semanticSearch.js so the browser can
// pair each publication with its vector by title.
function normalizeTitle(t) {
  return (t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const raw = JSON.parse(await fs.readFile(IN, "utf8"));
  const pubs = (Array.isArray(raw) ? raw : []).filter((p) => p?.title);
  console.log(`Loaded ${pubs.length} publications with a title.`);

  console.log(`Loading model ${MODEL} …`);
  const extract = await pipeline("feature-extraction", MODEL);

  const items = [];
  const seen = new Set();
  let dim = 0;

  for (let i = 0; i < pubs.length; i++) {
    const p = pubs[i];
    const key = normalizeTitle(p.title);
    if (!key || seen.has(key)) continue; // skip blanks / exact-duplicate titles
    seen.add(key);

    // Title carries most of the signal; abstract adds context. Cap length so the
    // tokenizer stays within the model's window.
    const text = `${p.title}. ${p.abstract || ""}`.slice(0, 2000);
    const out = await extract(text, { pooling: "mean", normalize: true });
    const vec = Array.from(out.data).map((x) => Math.round(x * 1e5) / 1e5);
    dim = vec.length;

    items.push({ key, title: p.title, vector: vec });
    if ((i + 1) % 10 === 0 || i === pubs.length - 1) {
      process.stdout.write(`  embedded ${i + 1}/${pubs.length}\r`);
    }
  }

  const payload = { model: MODEL, dim, count: items.length, items };
  await fs.writeFile(OUT, JSON.stringify(payload));
  const kb = ((await fs.stat(OUT)).size / 1024).toFixed(0);
  console.log(`\nWrote ${items.length} vectors (dim ${dim}) → ${path.relative(process.cwd(), OUT)} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
