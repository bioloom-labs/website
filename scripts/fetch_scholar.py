#!/usr/bin/env python3
"""
Fetch the lab's publications and write public/scholar-publications.json.

Google Scholar decides which papers are listed: each lab member's profile in
public/scholar_authors.jsonc. The profile gives the title, year, venue and
citation count. Scholar's per-paper pages now sit behind a JavaScript check
that scripts can't pass, so for new papers the authors, link and abstract come
from OpenAlex (matched by title), with the abstract taken from Crossref where
the publisher deposited one. A paper OpenAlex doesn't have is still listed,
crediting the lab member, and is looked up again on later runs.
Hand edits (hide / fix / add) come from public/edit-publications.jsonc.

Install dependency:
    pip install scholarly "bibtexparser<2"

Run from the project root:
    python scripts/fetch_scholar.py

Google Scholar rate-limits aggressively and blocks most requests from GitHub's
servers, so this normally runs from a laptop (see the launchd job).
"""

import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from scholarly import scholarly
except ImportError:
    sys.exit("scholarly not installed. Run: pip install scholarly")

ROOT = Path(__file__).parent.parent
AUTHORS_FILE = ROOT / "public" / "scholar_authors.jsonc"
EDITS_FILE = ROOT / "public" / "edit-publications.jsonc"
OUTPUT_FILE = ROOT / "public" / "scholar-publications.json"

USER_AGENT = "publications-fetch/1.0"
PROFILE_ONLY = "scholar-profile"  # _details value for papers OpenAlex didn't have

# Headings of structured abstracts, which OpenAlex runs into the text
# ("Aim The centre–periphery…"); these get a colon ("Aim: The…").
SECTION_HEADINGS = r"Aims?|Location|Taxon|Time period|Major taxa studied|Methods?|Results?|" \
                   r"Main conclusions|Conclusions?|Significance|Background|Premise|Summary"


def read_jsonc(path):
    """JSON with // and /* */ comments and trailing commas."""
    text = path.read_text(encoding="utf-8")
    strings_or_comments = r'("(?:\\.|[^"\\])*")|//[^\n]*|/\*[\s\S]*?\*/'
    text = re.sub(strings_or_comments, lambda m: m.group(1) or "", text)
    text = re.sub(r'("(?:\\.|[^"\\])*")|,(\s*[\]}])', lambda m: m.group(1) or m.group(2), text)
    return json.loads(text)


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code == 404 or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(5 * (attempt + 1))


def key(title):
    return re.sub(r"[^a-z0-9]+", " ", (title or "").lower()).strip()


def bare_doi(doi):
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", (doi or "").strip(), flags=re.I).lower()


def tidy(text):
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^(abstract|summary)\b[\s:.\-]*", "", text, flags=re.I)
    text = re.sub(r"([(\[])\s+", r"\1", text)          # "( CPH" -> "(CPH"
    text = re.sub(r"\s+([)\],.;:%])", r"\1", text)      # "CPH )" -> "CPH)"
    return text


def openalex_abstract(inverted_index):
    if not inverted_index:
        return ""
    words = sorted((pos, word) for word, positions in inverted_index.items() for pos in positions)
    text = tidy(" ".join(word for _, word in words))
    return re.sub(rf"(^|[.!?] )({SECTION_HEADINGS}) (?=[A-Z])", r"\1\2: ", text)


def crossref_abstract(doi):
    """The publisher's abstract (JATS XML) as plain text, keeping section
    headings as "Heading: text". Empty if Crossref has none."""
    try:
        raw = get_json("https://api.crossref.org/works/" + urllib.parse.quote(doi))["message"].get("abstract") or ""
    except Exception:
        return ""
    raw = re.sub(r"<jats:title>\s*(abstract|summary)\s*</jats:title>", " ", raw, flags=re.I)
    raw = re.sub(r"<jats:title>(.*?)</jats:title>", lambda m: f" {m.group(1).strip().rstrip(':')}: ", raw, flags=re.S)
    raw = re.sub(r"</?jats:(p|sec)\b[^>]*>", " ", raw)  # block tags separate words
    raw = re.sub(r"<[^>]+>", "", raw)                    # inline tags (italic etc.) don't
    return tidy(html.unescape(raw))


def openalex_journal(work):
    """The journal, or for a preprint its server. Institutional repositories
    (HAL, university archives…) are not shown as a venue."""
    locations = [work.get("primary_location")] + (work.get("locations") or [])
    sources = [(loc or {}).get("source") or {} for loc in locations]
    for s in sources:
        if s.get("display_name") and s.get("type") != "repository":
            return s["display_name"].split("/")[-1].strip()  # "X/X of the Y Society" -> "X of the Y Society"
    if work.get("type") == "preprint":
        for s in sources:
            if s.get("display_name"):
                return re.sub(r"\s*\([^)]*\)$", "", s["display_name"])  # "bioRxiv (Cold Spring…)" -> "bioRxiv"
    return ""


def scholar_venue(citation):
    """'Biological Reviews 92 (4), 1877-1909, 2017' -> 'Biological Reviews'."""
    return re.match(r"(.*?)(?:,?\s+\d.*)?$", citation or "").group(1).strip(" ,")


def find_in_openalex(title, year, lab_name):
    """The OpenAlex work for a Scholar title, or None. The match needs nearly
    the same title, a year within one, and the lab member among the authors."""
    query = urllib.parse.urlencode({
        "search": title[:250],
        "per-page": 5,
        "select": "doi,title,publication_year,type,authorships,primary_location,"
                  "locations,abstract_inverted_index",
    })
    try:
        results = get_json(f"https://api.openalex.org/works?{query}")["results"]
    except Exception as e:
        print(f"    (OpenAlex lookup failed: {e})")
        return None
    words = set(key(title).split())
    surname = key(lab_name).split()[-1]
    for w in results:
        cand = set(key(w.get("title")).split())
        if not cand or len(words & cand) / len(words | cand) < 0.85:
            continue
        if year and w.get("publication_year") and abs(w["publication_year"] - year) > 1:
            continue
        names = " ".join(key((a["author"].get("display_name") or "") + " " + (a.get("raw_author_name") or ""))
                         for a in w["authorships"])
        if surname in names.split():
            return w
    return None


def details_for(pub, name, scholar_id):
    """Authors, venue, link and abstract for a paper not yet saved."""
    bib = pub.get("bib", {})
    title = bib.get("title", "Untitled")
    year = int(bib["pub_year"]) if bib.get("pub_year") else None
    entry = {
        "title": title,
        "authors": [name],
        "year": year,
        "journal": scholar_venue(bib.get("citation")),
        "abstract": "",
        "url": "https://scholar.google.com/citations?view_op=view_citation&citation_for_view="
               + pub.get("author_pub_id", ""),
        "citations": pub.get("num_citations", 0),
        "_details": PROFILE_ONLY,
        "_fetched_for": name,
        "_scholar_id": scholar_id,
    }
    w = find_in_openalex(title, year, name)
    time.sleep(0.2)
    if not w:
        print("    not in OpenAlex; listed with the details from Scholar")
        return entry
    doi = bare_doi(w.get("doi"))
    authors = [a["author"].get("display_name") or a.get("raw_author_name") or "" for a in w["authorships"]]
    entry.update({
        "authors": [a for a in authors if a] or [name],
        "journal": openalex_journal(w) or entry["journal"],
        "abstract": (crossref_abstract(doi) if doi else "") or openalex_abstract(w.get("abstract_inverted_index")),
        "url": w.get("doi") or (w.get("primary_location") or {}).get("landing_page_url") or entry["url"],
        "_details": "openalex",
    })
    print(f"    matched in OpenAlex{' (' + doi + ')' if doi else ''}")
    return entry


def fetch_pubs_for_author(scholar_id, name, previous, max_pubs=None):
    """Saved papers keep their details (with the profile's citation count); new
    ones, and ones OpenAlex didn't have last time, are looked up."""
    print(f"\nFetching: {name} ({scholar_id})")

    author = scholarly.search_author_id(scholar_id)
    if author is None:
        raise RuntimeError(f"Author not found or Scholar returned empty result for {scholar_id}")
    author = scholarly.fill(author, sections=["publications"])

    publications = author.get("publications", [])
    if max_pubs:
        publications = publications[:max_pubs]
    print(f"  {len(publications)} papers on profile")

    pubs = []
    for pub in publications:
        title = pub.get("bib", {}).get("title", "Untitled")
        old = previous.get(key(title))
        if old and old.get("authors") and old.get("_details") != PROFILE_ONLY:
            pubs.append({**old, "citations": pub.get("num_citations", old.get("citations", 0))})
            continue
        print(f"  Looking up: {title[:70]}")
        pubs.append(details_for(pub, name, scholar_id))
    return pubs


def apply_edits(pubs, edits):
    def matches(pub, ref):
        ref = ref.strip()
        if ref.lower().startswith(("10.", "http", "doi:")):
            return bare_doi(ref) == bare_doi(pub.get("url"))
        return key(ref) == key(pub["title"])

    hide = edits.get("hide", [])
    pubs = [p for p in pubs if not any(matches(p, ref) for ref in hide)]
    for ref, fields in edits.get("fix", {}).items():
        for p in pubs:
            if matches(p, ref):
                p.update(fields)
    for p in edits.get("add", []):
        pubs.append({"authors": [], "journal": "", "abstract": "", "url": "", "citations": 0, **p})
    return pubs


def main():
    if not AUTHORS_FILE.exists():
        sys.exit(f"Authors file not found: {AUTHORS_FILE}")
    authors = read_jsonc(AUTHORS_FILE)
    if not authors:
        sys.exit("No authors found in scholar_authors.jsonc")
    edits = read_jsonc(EDITS_FILE) if EDITS_FILE.exists() else {}

    previous = {}
    if OUTPUT_FILE.exists():
        for p in json.loads(OUTPUT_FILE.read_text(encoding="utf-8")):
            previous[key(p["title"])] = p

    all_pubs = []
    seen_titles = set()  # deduplicate by title
    errors = []

    for entry in authors:
        scholar_id = entry.get("scholar_id", "").strip()
        name = entry.get("name", scholar_id)
        max_pubs = entry.get("max_pubs", None)

        if not scholar_id:
            print(f"Skipping entry with no scholar_id: {entry}")
            continue

        try:
            pubs = fetch_pubs_for_author(scholar_id, name, previous, max_pubs)
            added = 0
            for p in pubs:
                k = key(p["title"])
                if k not in seen_titles:
                    seen_titles.add(k)
                    all_pubs.append(p)
                    added += 1
            print(f"  -> added {added} unique pubs ({len(pubs) - added} duplicates skipped)")
        except Exception as e:
            print(f"ERROR fetching {name}: {e}", file=sys.stderr)
            errors.append(name)

    # Scholar blocks requests now and then. Exit with an error rather than
    # overwrite good data with a partial list.
    if errors or not all_pubs:
        sys.exit(
            f"\nCould not fetch {', '.join(errors) or 'any publications'} "
            "(Scholar is probably blocking requests) — keeping existing file unchanged."
        )

    all_pubs = apply_edits(all_pubs, edits)

    # Sort newest first, then by citation count
    all_pubs.sort(
        key=lambda p: (p.get("year") or 0, p.get("citations") or 0),
        reverse=True,
    )

    OUTPUT_FILE.write_text(
        json.dumps(all_pubs, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nDone. Wrote {len(all_pubs)} publications to {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
