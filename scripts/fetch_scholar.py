#!/usr/bin/env python3
"""
Fetch publications from Google Scholar for all authors in
public/scholar_authors.jsonc and write to public/scholar-publications.json.

Install dependency:
    pip install scholarly

Run from the project root:
    python scripts/fetch_scholar.py

Google Scholar rate-limits aggressively. If you get blocked, wait a few
minutes and try again, or use a proxy (see scholarly docs for proxy setup).
"""

import json
import random
import re
import sys
import time
from pathlib import Path

try:
    from scholarly import scholarly
except ImportError:
    sys.exit("scholarly not installed. Run: pip install scholarly")

ROOT = Path(__file__).parent.parent
AUTHORS_FILE = ROOT / "public" / "scholar_authors.jsonc"
OUTPUT_FILE = ROOT / "public" / "scholar-publications.json"


def strip_comments(text):
    """Remove // line comments and /* block comments */ from JSONC."""
    text = re.sub(r"//.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return text


def fetch_pubs_for_author(scholar_id, name, previous, max_pubs=None):
    """Returns (pubs, attempted, failed). Only papers that are new, or were saved
    without authors, are looked up individually; the rest reuse their saved entry
    with the citation count from the profile. This keeps the number of requests
    to Scholar low, which makes it less likely to block us."""
    print(f"\nFetching: {name} ({scholar_id})")

    author = scholarly.search_author_id(scholar_id)
    if author is None:
        raise RuntimeError(f"Author not found or Scholar returned empty result for {scholar_id}")
    author = scholarly.fill(author, sections=["publications"])

    publications = author.get("publications", [])
    if max_pubs:
        publications = publications[:max_pubs]

    pubs = []
    attempted = 0
    failed = 0
    print(f"  {len(publications)} papers on profile")

    for pub in publications:
        bib = pub.get("bib", {})
        title = bib.get("title", "Untitled")

        old = previous.get(title.lower().strip())
        if old and old.get("authors"):
            pubs.append({**old, "citations": pub.get("num_citations", old.get("citations", 0))})
            continue

        print(f"  Looking up: {title[:70]}")
        attempted += 1
        time.sleep(random.uniform(5, 15))  # irregular, human-ish pacing

        # Fill individual pub to get authors, abstract + URL. If this fails the
        # paper is saved without authors (hidden on the page) and retried next run.
        url = ""
        try:
            filled = scholarly.fill(pub)
            bib = filled.get("bib", bib)
            url = filled.get("pub_url", "") or ""
        except Exception as e:
            print(f"    (could not fill: {e})")
            failed += 1

        # Parse authors — scholarly uses " and " as separator
        authors_raw = bib.get("author", "")
        authors = (
            [a.strip() for a in authors_raw.split(" and ")]
            if authors_raw
            else []
        )

        year_raw = bib.get("pub_year") or bib.get("year")
        year = int(year_raw) if year_raw else None

        pubs.append({
            "title": title,
            "authors": authors,
            "year": year,
            "journal": (
                bib.get("journal")
                or bib.get("booktitle")
                or bib.get("publisher")
                or ""
            ),
            "abstract": bib.get("abstract", ""),
            "url": url,
            "citations": pub.get("num_citations", 0),
            # Track which lab author this came from
            "_fetched_for": name,
            "_scholar_id": scholar_id,
        })

    return pubs, attempted, failed


def main():
    if not AUTHORS_FILE.exists():
        sys.exit(f"Authors file not found: {AUTHORS_FILE}")

    raw = AUTHORS_FILE.read_text(encoding="utf-8")
    authors = json.loads(strip_comments(raw))

    if not authors:
        sys.exit("No authors found in scholar_authors.jsonc")

    previous = {}
    if OUTPUT_FILE.exists():
        for p in json.loads(OUTPUT_FILE.read_text(encoding="utf-8")):
            previous[p["title"].lower().strip()] = p

    all_pubs = []
    seen_titles = set()  # deduplicate by lowercase title
    total_attempted = 0
    total_failed = 0
    errors = []

    for entry in authors:
        scholar_id = entry.get("scholar_id", "").strip()
        name = entry.get("name", scholar_id)
        max_pubs = entry.get("max_pubs", None)

        if not scholar_id:
            print(f"Skipping entry with no scholar_id: {entry}")
            continue

        try:
            pubs, attempted, failed = fetch_pubs_for_author(scholar_id, name, previous, max_pubs)
            total_attempted += attempted
            total_failed += failed
            added = 0
            for p in pubs:
                key = p["title"].lower().strip()
                if key not in seen_titles:
                    seen_titles.add(key)
                    all_pubs.append(p)
                    added += 1
            print(f"  -> added {added} unique pubs ({len(pubs) - added} duplicates skipped)")
        except Exception as e:
            print(f"ERROR fetching {name}: {e}", file=sys.stderr)
            errors.append(name)

    # Scholar blocks requests from CI runners now and then. Exit with an error
    # (so the GitHub Action fails and emails) rather than overwrite good data
    # with a partial list or papers missing their authors.
    if errors or not all_pubs:
        sys.exit(
            f"\nCould not fetch {', '.join(errors) or 'any publications'} "
            "(Scholar is probably blocking requests) — keeping existing file unchanged."
        )
    if total_failed > total_attempted / 2:
        sys.exit(
            f"\n{total_failed} of {total_attempted} paper lookups failed "
            "(Scholar is probably blocking requests) — keeping existing file unchanged."
        )
    print(f"\nLooked up {total_attempted} new papers ({total_failed} failed).")

    # Sort newest first, then by citation count
    all_pubs.sort(
        key=lambda p: (p["year"] or 0, p["citations"]),
        reverse=True,
    )

    OUTPUT_FILE.write_text(
        json.dumps(all_pubs, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nDone. Wrote {len(all_pubs)} publications to {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
