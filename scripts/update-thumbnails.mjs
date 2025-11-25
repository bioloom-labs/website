// call using node scripts/update-thumbnails.mjs

// scripts/update-thumbnails.mjs
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const OPENALEX_MAILTO = "your-email@example.com";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // set in env
const UNSPLASH_QUERY = "plants biodiversity"; // vibe of your lab
const MAX_WORKS_DEFAULT = 50;

// Paths
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const AUTHORS_PATH = path.join(PUBLIC_DIR, "openalex-authors.jsonc");
const THUMBS_DIR = path.join(PUBLIC_DIR, "thumbs");

// Where we remember which Unsplash images we've already used
const USED_UNSPLASH_PATH = path.join(THUMBS_DIR, "_unsplash-used.json");

// --- HELPERS ---

function stripJsoncComments(str) {
    return str
        .replace(/\/\/.*$/gm, "") // // comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // /* ... */
}

function normalizeDoi(raw) {
    if (!raw) return "";
    let s = String(raw).trim();
    s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    s = s.replace(/^doi:/i, "");
    return s.toLowerCase();
}

function doiToThumbFileName(normalizedDoi) {
    if (!normalizedDoi) return "";
    const safe = normalizedDoi.replace(/[^a-z0-9]+/gi, "_");
    return `${safe}.jpg`;
}

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch {
        // ignore
    }
}

async function loadAuthors() {
    const raw = await fs.readFile(AUTHORS_PATH, "utf8");
    const clean = stripJsoncComments(raw);
    return JSON.parse(clean);
}

async function fetchWorksForAuthor(authorId, maxWorks = MAX_WORKS_DEFAULT) {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set(
        "filter",
        `authorships.author.id:${encodeURIComponent(authorId)}`
    );
    url.searchParams.set("sort", "publication_year:desc");
    url.searchParams.set("per-page", String(maxWorks));
    if (OPENALEX_MAILTO) {
        url.searchParams.set("mailto", OPENALEX_MAILTO);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`OpenAlex request failed for ${authorId}: ${res.status}`);
    }
    const data = await res.json();
    return data.results || [];
}

// --- NEW: track used Unsplash image IDs locally ---

async function loadUsedUnsplashIds() {
    try {
        const raw = await fs.readFile(USED_UNSPLASH_PATH, "utf8");
        const arr = JSON.parse(raw);
        return new Set(arr);
    } catch {
        // file does not exist or invalid, start fresh
        return new Set();
    }
}

async function saveUsedUnsplashIds(set) {
    const arr = Array.from(set);
    await fs.writeFile(USED_UNSPLASH_PATH, JSON.stringify(arr, null, 2), "utf8");
}

/**
 * Pick an Unsplash image that hasn't been used before (by Unsplash photo id).
 * Returns { url, id }.
 */
async function pickUnsplashImage(usedIds) {
    if (!UNSPLASH_ACCESS_KEY) {
        throw new Error("UNSPLASH_ACCESS_KEY env var not set");
    }

    const url = new URL("https://api.unsplash.com/photos/random");
    url.searchParams.set("query", UNSPLASH_QUERY);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");
    url.searchParams.set("client_id", UNSPLASH_ACCESS_KEY);

    // Try a few times in case Unsplash keeps giving the same image
    const MAX_TRIES = 10;

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const res = await fetch(url.toString());
        if (!res.ok) {
            throw new Error(`Unsplash error: ${res.status}`);
        }
        const data = await res.json();
        const photoId = data.id;
        const imageUrl = data.urls?.regular || data.urls?.full || data.urls?.small;

        if (!photoId || !imageUrl) {
            console.warn("Unsplash response missing id or urls, trying again...");
            continue;
        }

        if (usedIds.has(photoId)) {
            console.log(
                `Unsplash image ${photoId} already used, retrying (${attempt}/${MAX_TRIES})`
            );
            continue;
        }

        // New image!
        usedIds.add(photoId);
        return { url: imageUrl, id: photoId };
    }

    throw new Error("Could not get a new Unsplash image after several attempts");
}

async function downloadImage(url, destPath) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to download image: ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
}

async function main() {
    await ensureDir(THUMBS_DIR);

    const authors = await loadAuthors();
    const authorIds = authors.map((a) => a.id);

    const allWorks = [];
    for (const authorId of authorIds) {
        const maxWorks =
            authors.find((a) => a.id === authorId)?.max_works || MAX_WORKS_DEFAULT;
        console.log(`Fetching works for ${authorId} (max ${maxWorks})`);
        const works = await fetchWorksForAuthor(authorId, maxWorks);
        allWorks.push(...works);
    }

    // Collect unique DOIs
    const doiSet = new Set();
    for (const w of allWorks) {
        if (!w?.doi) continue;
        const doiNorm = normalizeDoi(w.doi);
        if (doiNorm) doiSet.add(doiNorm);
    }

    console.log(`Found ${doiSet.size} DOIs`);

    // Load used Unsplash ids so we don't reuse images
    const usedUnsplashIds = await loadUsedUnsplashIds();

    for (const doiNorm of doiSet) {
        const fileName = doiToThumbFileName(doiNorm);
        const filePath = path.join(THUMBS_DIR, fileName);

        let exists = true;
        try {
            await fs.access(filePath);
        } catch {
            exists = false;
        }

        if (exists) {
            console.log(`✔ Thumbnail exists for ${doiNorm}`);
            continue;
        }

        console.log(`➜ Creating thumbnail for ${doiNorm}`);
        try {
            const { url: imageUrl, id: photoId } = await pickUnsplashImage(
                usedUnsplashIds
            );
            console.log(`   Using Unsplash photo id: ${photoId}`);
            await downloadImage(imageUrl, filePath);
            console.log(`   Saved: ${fileName}`);
        } catch (e) {
            console.error(`   Failed for ${doiNorm}:`, e.message);
        }
    }

    // Save the updated set of used Unsplash ids
    await saveUsedUnsplashIds(usedUnsplashIds);

    console.log("Done.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
