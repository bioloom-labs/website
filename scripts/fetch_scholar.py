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


def fetch_pubs_for_author(scholar_id, name, max_pubs=None):
    print(f"\nFetching: {name} ({scholar_id})")

    author = scholarly.search_author_id(scholar_id)
    author = scholarly.fill(author, sections=["publications"])

    publications = author.get("publications", [])
    if max_pubs:
        publications = publications[:max_pubs]

    pubs = []
    total = len(publications)

    for i, pub in enumerate(publications, 1):
        bib = pub.get("bib", {})
        title = bib.get("title", "Untitled")
        print(f"  [{i}/{total}] {title[:70]}")

        # Fill individual pub to get abstract + URL
        url = ""
        try:
            filled = scholarly.fill(pub)
            bib = filled.get("bib", bib)
            url = filled.get("pub_url", "") or ""
        except Exception as e:
            print(f"    (could not fill: {e})")

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

        time.sleep(0.8)  # be polite to Scholar

    return pubs


def main():
    if not AUTHORS_FILE.exists():
        sys.exit(f"Authors file not found: {AUTHORS_FILE}")

    raw = AUTHORS_FILE.read_text(encoding="utf-8")
    authors = json.loads(strip_comments(raw))

    if not authors:
        sys.exit("No authors found in scholar_authors.jsonc")

    all_pubs = []
    seen_titles = set()  # deduplicate by lowercase title

    for entry in authors:
        scholar_id = entry.get("scholar_id", "").strip()
        name = entry.get("name", scholar_id)
        max_pubs = entry.get("max_pubs", None)

        if not scholar_id:
            print(f"Skipping entry with no scholar_id: {entry}")
            continue

        try:
            pubs = fetch_pubs_for_author(scholar_id, name, max_pubs)
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
