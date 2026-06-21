#!/usr/bin/env python3
"""
Fetch Hormuz history snapshots from the Cloudflare Worker KV endpoint and
archive them as monthly JSON files under data/history/.

Downsamples to one entry per UTC hour so monthly files stay small
(~700 KB/endpoint/month at most).  Files are served by GitHub Pages, so
the frontend can load them directly for historical charts later.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

PROXY_URL = os.environ.get(
    'HORMUZ_PROXY_URL',
    'https://hormuz-live-proxy.tallen5431.workers.dev'
).rstrip('/')

DATA_DIR = Path('data/history')

# (worker_route, output_dirname, extra_query_string)
ENDPOINTS = [
    ('risk',       'risk',          ''),
    ('crisis',     'crisis',        ''),
    ('traffic',    'traffic',       ''),
    ('prices',     'prices',        ''),
    ('bypass',     'bypass',        ''),
    ('dependency', 'dependency-US', '&country=US'),
]


def fetch_history(route, extra=''):
    url = f"{PROXY_URL}/history/{route}?limit=500{extra}"
    try:
        req = urllib.request.Request(url, headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read()).get('entries', [])
    except Exception as exc:
        print(f"  Warning: could not fetch history/{route}: {exc}", file=sys.stderr)
        return []


def downsample_hourly(entries):
    """Keep the earliest snapshot within each UTC hour."""
    seen = {}
    for e in sorted(entries, key=lambda x: x['timestamp']):
        hour_key = e['timestamp'][:13]   # 'YYYY-MM-DDTHH'
        seen.setdefault(hour_key, e)
    return sorted(seen.values(), key=lambda x: x['timestamp'], reverse=True)


def archive(route, dirname, extra):
    month   = datetime.now(timezone.utc).strftime('%Y-%m')
    outfile = DATA_DIR / dirname / f"{month}.json"
    outfile.parent.mkdir(parents=True, exist_ok=True)

    new_entries = fetch_history(route, extra)

    # Load existing monthly file and merge
    existing = {}
    if outfile.exists():
        try:
            existing = {e['timestamp']: e for e in json.loads(outfile.read_text()).get('entries', [])}
        except Exception:
            pass

    merged = {**existing, **{e['timestamp']: e for e in new_entries}}
    final  = downsample_hourly(merged.values())

    outfile.write_text(json.dumps({
        'route':   route,
        'updated': datetime.now(timezone.utc).isoformat(),
        'count':   len(final),
        'entries': final,
    }))
    added = len(merged) - len(existing)
    print(f"  {dirname:20s} {len(final):4d} hourly snapshots  (+{max(0, added)} new)  → {outfile}")


def main():
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    print(f"Archiving Hormuz history — {now}")
    for route, dirname, extra in ENDPOINTS:
        archive(route, dirname, extra)
    print("Done.")


if __name__ == '__main__':
    main()
