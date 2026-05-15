# welcomarr — Design Spec

**Date:** 2026-05-15  
**Status:** Approved

## Overview

A single-page web app that acts as a home screen for a personal media setup. It provides one-click navigation to Jellyfin and Overseerr ("Seerr"), and displays the 5 most recently fulfilled Overseerr requests as a poster row with hover-reveal details and direct Jellyfin deep-links.

## Architecture

A single nginx Docker container. No Node.js, no Python runtime.

At container startup, `entrypoint.sh` uses `envsubst` to generate two files from templates:
1. `nginx.conf` — configures the reverse proxy locations with API keys injected as headers
2. `html/config.js` — exposes the service URLs to the browser JS (no API keys)

nginx serves the static files and proxies API calls server-side:

```
Browser → GET /api/overseerr/*  →  nginx  →  Overseerr (adds X-Api-Key header)
Browser → GET /api/jellyfin/*   →  nginx  →  Jellyfin  (adds X-MediaBrowser-Token header)
```

Navigation buttons and Jellyfin "Watch" deep-links use `window.CONFIG.jellyfinUrl` / `window.CONFIG.overseerrUrl` from `config.js` and open in a new tab.

## File Structure

```
welcomarr/
├── Dockerfile
├── entrypoint.sh
├── nginx.conf.template
├── docker-compose.example.yml
└── html/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── config.js.template          # → html/config.js at container startup
    └── assets/
        ├── jellyfin.svg
        └── overseerr.svg
```

## Environment Variables

All four are required. `entrypoint.sh` exits with a clear error if any are missing.

| Variable | Example | Purpose |
|---|---|---|
| `JELLYFIN_URL` | `http://nas:8096` | nginx proxy target, nav button href, Watch deep-links |
| `JELLYFIN_API_KEY` | `abc123...` | nginx `X-MediaBrowser-Token` proxy header (never reaches browser) |
| `OVERSEERR_URL` | `http://nas:5055` | nginx proxy target, nav button href |
| `OVERSEERR_API_KEY` | `xyz789...` | nginx `X-Api-Key` proxy header (never reaches browser) |

## Data Flow — Recent Items

1. `app.js` fetches: `GET /api/overseerr/api/v1/request?filter=available&sort=added&take=5`
2. For each result, extracts:
   - **Title** — `media.title` (movies) or `media.name` (series)
   - **Year** — from `media.releaseDate` or `media.firstAirDate`
   - **Type** — `movie` or `tv`
   - **Poster** — `media.posterPath` → `https://image.tmdb.org/t/p/w185{posterPath}` (TMDB CDN)
   - **Jellyfin link** — `media.jellyfinMediaId` → `{JELLYFIN_URL}/web/index.html#!/details?id={id}`
3. "▶ Watch" link is shown only when `jellyfinMediaId` is present; hidden otherwise (no broken links).
4. If the Overseerr API call fails, the section shows "Could not load recent items" — no broken UI.

## UI Design

**Style:** Dark Cinema — `#0f0f13` page background, `#1c1c24` cards, `#e5e5e5`/`#6b7280` text, purple `#7c3aed` (Jellyfin accent + Watch button), blue `#1d4ed8` (Seerr accent). Plain CSS, no frameworks.

**Layout:** Page content 75% width, centered. Two sections stacked vertically:

### Top — Nav Buttons (2/3 of page height)

Two large side-by-side cards, each containing:
- Bundled SVG logo (80×80px, tinted background circle)
- Service name in bold (15px)
- Subtitle in muted text (11px): "Media server" / "Request media"
- Hover: subtle background lighten + accent border glow

Labels: **Jellyfin** (purple `#7c3aed`) and **Seerr** (blue `#1d4ed8`). Both open in a new tab.

Logos are bundled SVGs in `html/assets/` — no external CDN dependencies.

### Bottom — Recently Available (1/3 of page height)

Section label: "Recently Available" (10px uppercase, muted).

Five poster cards in a horizontal row, equal width, `aspect-ratio: 2/3`. Each card:
- **Default state:** clean poster image only (TMDB CDN), dark placeholder if image missing
- **Hover state:** gradient overlay fades in from the bottom (opacity 0 → 1, 250ms ease), revealing:
  - Title — 26px bold, white
  - Type · Year — 22px, muted grey
  - "▶ Watch" button — 22px, purple `#7c3aed`, only rendered when `jellyfinMediaId` is present
  - "Not on Jellyfin yet" — 20px italic muted, shown instead when no `jellyfinMediaId`
