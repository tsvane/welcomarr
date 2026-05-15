# welcomarr Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page Docker-based home screen for Jellyfin and Seerr that shows the 5 most recently fulfilled media requests as hover-reveal poster cards.

**Architecture:** Static HTML/CSS/JS served by nginx in a Docker container. `entrypoint.sh` uses `envsubst` at startup to stamp env vars into `nginx.conf` (proxy targets + API keys) and `config.js` (public URLs only). nginx proxies `/api/jellyfin/*` and `/api/overseerr/*` server-side so API keys never reach the browser.

**Tech Stack:** nginx:alpine, gettext (envsubst), plain HTML/CSS/JS (no frameworks), Docker

---

## File Map

| File | Responsibility |
|---|---|
| `html/index.html` | Page structure — nav buttons, poster row skeleton |
| `html/style.css` | All styles — dark cinema theme, hover overlay, layout |
| `html/app.js` | Fetch Overseerr API, render poster cards, wire nav button hrefs |
| `html/config.js.template` | Stamped to `config.js` at startup — exposes `JELLYFIN_URL` and `OVERSEERR_URL` |
| `html/assets/jellyfin.svg` | Bundled Jellyfin logo |
| `html/assets/overseerr.svg` | Bundled Overseerr logo |
| `nginx.conf.template` | nginx server block with proxy_pass locations |
| `entrypoint.sh` | Validates env vars, runs envsubst, execs nginx |
| `Dockerfile` | Builds the image from nginx:alpine |
| `docker-compose.example.yml` | Ready-to-copy compose snippet |

---

### Task 1: Initialize project

**Files:**
- Create: `.gitignore`
- Create: `html/assets/` directory

- [ ] **Step 1: Initialize git repo and directories**

```powershell
git init
New-Item -ItemType Directory -Force html/assets
```

- [ ] **Step 2: Write .gitignore**

Create `.gitignore`:
```
.superpowers/
html/config.js
```

- [ ] **Step 3: Commit**

```powershell
git add .gitignore
git commit -m "chore: initialize project"
```

---

### Task 2: Download SVG logos

**Files:**
- Create: `html/assets/jellyfin.svg`
- Create: `html/assets/overseerr.svg`

- [ ] **Step 1: Download Jellyfin logo**

```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/icon-transparent.svg" `
  -OutFile "html/assets/jellyfin.svg"
```

- [ ] **Step 2: Verify Jellyfin SVG is non-empty**

```powershell
(Get-Item html/assets/jellyfin.svg).Length
```
Expected: a number greater than 0. If the file is empty or the URL returned a 404, find the current icon SVG in https://github.com/jellyfin/jellyfin-ux under `branding/SVG/`.

- [ ] **Step 3: Download Overseerr logo**

```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/sct/overseerr/develop/public/os_icon_no_text.svg" `
  -OutFile "html/assets/overseerr.svg"
```

- [ ] **Step 4: Verify Overseerr SVG is non-empty**

```powershell
(Get-Item html/assets/overseerr.svg).Length
```
Expected: a number greater than 0. If the URL fails, check https://github.com/sct/overseerr under `public/` for the current icon SVG filename.

- [ ] **Step 5: Commit**

```powershell
git add html/assets/
git commit -m "feat: bundle Jellyfin and Overseerr logo assets"
```

---

### Task 3: Write index.html

**Files:**
- Create: `html/index.html`

- [ ] **Step 1: Write index.html**

Create `html/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>welcomarr</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="page-wrap">
    <header class="page-title">
      <h1>welcomarr</h1>
      <p>Your media hub</p>
    </header>

    <section class="nav-buttons">
      <a class="nav-btn" id="jellyfin-btn" target="_blank" rel="noopener">
        <div class="nav-btn-logo purple">
          <img src="assets/jellyfin.svg" alt="" width="52" height="52">
        </div>
        <div>
          <div class="nav-btn-label">Jellyfin</div>
          <div class="nav-btn-sub">Media server</div>
        </div>
      </a>
      <a class="nav-btn blue" id="seerr-btn" target="_blank" rel="noopener">
        <div class="nav-btn-logo blue">
          <img src="assets/overseerr.svg" alt="" width="52" height="52">
        </div>
        <div>
          <div class="nav-btn-label">Seerr</div>
          <div class="nav-btn-sub">Request media</div>
        </div>
      </a>
    </section>

    <section class="recent-section">
      <div class="recent-label">Recently Available</div>
      <div class="poster-row" id="poster-row"></div>
    </section>
  </div>
  <script src="config.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```powershell
git add html/index.html
git commit -m "feat: add HTML structure"
```

---

### Task 4: Write style.css

**Files:**
- Create: `html/style.css`

- [ ] **Step 1: Write style.css**

Create `html/style.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0f0f13;
  color: #e5e5e5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
}

.page-wrap {
  width: 75%;
  max-width: 1200px;
}

.page-title {
  text-align: center;
  margin-bottom: 28px;
}
.page-title h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: .02em;
}
.page-title p {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.nav-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}
.nav-btn {
  flex: 1;
  background: #1c1c24;
  border: 1px solid #2d2d3a;
  border-radius: 14px;
  padding: 32px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  transition: border-color .2s, background .2s;
}
.nav-btn:hover         { background: #22222e; border-color: #7c3aed55; }
.nav-btn.blue:hover    { border-color: #1d4ed855; }

.nav-btn-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-btn-logo.purple { background: #7c3aed22; }
.nav-btn-logo.blue   { background: #1d4ed822; }
.nav-btn-logo img    { width: 52px; height: 52px; }

.nav-btn-label { font-size: 16px; font-weight: 600; color: #e5e5e5; }
.nav-btn-sub   { font-size: 12px; color: #6b7280; margin-top: 3px; }

.recent-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: #6b7280;
  margin-bottom: 12px;
}

.poster-row { display: flex; gap: 12px; }

.poster-card {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 2 / 3;
  background: #1c1c24;
}
.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.poster-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, #2d2d3a, #1a1a22);
}
.poster-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.65) 60%, transparent 100%);
  padding: 20px 12px 12px;
  opacity: 0;
  transition: opacity .25s ease;
}
.poster-card:hover .poster-overlay { opacity: 1; }

.poster-title   { font-size: 26px; font-weight: 700; color: #f0f0f0; line-height: 1.2; margin-bottom: 5px; }
.poster-meta    { font-size: 22px; color: #9ca3af; margin-bottom: 12px; }
.poster-watch {
  display: inline-block;
  background: #7c3aed;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  padding: 7px 16px;
  border-radius: 6px;
  text-decoration: none;
}
.poster-watch:hover { background: #6d28d9; }
.poster-pending { font-size: 20px; color: #4b5563; font-style: italic; }
.error-msg      { font-size: 14px; color: #6b7280; padding: 16px 0; }
```

- [ ] **Step 2: Open html/index.html in a browser and verify the static shell**

Open `html/index.html` via a `file://` URL. Verify:
- Dark `#0f0f13` background, content centered at ~75% width
- Two large nav cards visible with logos (Jellyfin purple-tinted, Seerr blue-tinted)
- "Recently Available" label below with an empty row (no JS running yet)
- No console errors

- [ ] **Step 3: Commit**

```powershell
git add html/style.css
git commit -m "feat: add dark cinema stylesheet"
```

---

### Task 5: Write config.js.template

**Files:**
- Create: `html/config.js.template`
- Create: `html/config.js` (git-ignored, for local dev only)

- [ ] **Step 1: Write config.js.template**

Create `html/config.js.template`:
```js
window.CONFIG = {
  jellyfinUrl: "${JELLYFIN_URL}",
  overseerrUrl: "${OVERSEERR_URL}"
};
```

- [ ] **Step 2: Write a local config.js for browser development**

Create `html/config.js` (this file is git-ignored):
```js
window.CONFIG = {
  jellyfinUrl: "http://localhost:8096",
  overseerrUrl: "http://localhost:5055"
};
```

- [ ] **Step 3: Commit**

```powershell
git add html/config.js.template
git commit -m "feat: add config.js template"
```

---

### Task 6: Write app.js

**Files:**
- Create: `html/app.js`

- [ ] **Step 1: Write app.js**

Create `html/app.js`:
```js
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPosters(container, items) {
  if (items.length === 0) {
    container.innerHTML = '<p class="error-msg">No recent items found.</p>';
    return;
  }
  container.innerHTML = items.map(item => {
    const imgHtml = item.posterPath
      ? `<img class="poster-img" src="https://image.tmdb.org/t/p/w342${item.posterPath}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="poster-placeholder"></div>`;

    const actionHtml = item.jellyfinMediaId
      ? `<a class="poster-watch" href="${escapeHtml(window.CONFIG.jellyfinUrl)}/web/index.html#!/details?id=${escapeHtml(item.jellyfinMediaId)}" target="_blank" rel="noopener">▶ Watch</a>`
      : `<span class="poster-pending">Not on Jellyfin yet</span>`;

    return `
      <div class="poster-card">
        ${imgHtml}
        <div class="poster-overlay">
          <div class="poster-title">${escapeHtml(item.title)}</div>
          <div class="poster-meta">${escapeHtml(item.type)} · ${escapeHtml(item.year)}</div>
          ${actionHtml}
        </div>
      </div>`;
  }).join('');
}

async function fetchDetail(type, tmdbId) {
  const path = type === 'movie'
    ? `/api/overseerr/api/v1/movie/${tmdbId}`
    : `/api/overseerr/api/v1/tv/${tmdbId}`;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadRecentItems() {
  const container = document.getElementById('poster-row');

  document.getElementById('jellyfin-btn').href = window.CONFIG.jellyfinUrl;
  document.getElementById('seerr-btn').href = window.CONFIG.overseerrUrl;

  try {
    const res = await fetch('/api/overseerr/api/v1/request?filter=available&sort=added&take=5');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = await Promise.all((data.results || []).map(async req => {
      try {
        const detail = await fetchDetail(req.type, req.media.tmdbId);
        return {
          title: detail.title || detail.name || 'Unknown',
          year: (detail.releaseDate || detail.firstAirDate || '').slice(0, 4),
          type: req.type === 'movie' ? 'Movie' : 'Series',
          posterPath: detail.posterPath || null,
          jellyfinMediaId: req.media.jellyfinMediaId || null
        };
      } catch {
        return null;
      }
    }));

    renderPosters(container, items.filter(Boolean));
  } catch {
    container.innerHTML = '<p class="error-msg">Could not load recent items.</p>';
  }
}

loadRecentItems();
```

- [ ] **Step 2: Verify no syntax errors in browser**

Open `html/index.html` in a browser. Open the dev console (F12). Verify:
- No syntax errors or uncaught exceptions
- "Could not load recent items." is displayed (expected — no proxy is running locally)
- `window.CONFIG` is defined in the console: type `window.CONFIG` and confirm it returns the localhost URLs from `config.js`

- [ ] **Step 3: Commit**

```powershell
git add html/app.js
git commit -m "feat: fetch Overseerr requests and render poster cards"
```

---

### Task 7: Write nginx.conf.template

**Files:**
- Create: `nginx.conf.template`

- [ ] **Step 1: Write nginx.conf.template**

Create `nginx.conf.template`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/jellyfin/ {
        proxy_pass ${JELLYFIN_URL}/;
        proxy_set_header X-MediaBrowser-Token ${JELLYFIN_API_KEY};
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/overseerr/ {
        proxy_pass ${OVERSEERR_URL}/;
        proxy_set_header X-Api-Key ${OVERSEERR_API_KEY};
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

The `proxy_pass` trailing `/` strips the location prefix: `/api/overseerr/api/v1/request` → `{OVERSEERR_URL}/api/v1/request`. `entrypoint.sh` calls `envsubst` with only the four named variables, so nginx's own `$http_host` and `$remote_addr` are left untouched.

- [ ] **Step 2: Commit**

```powershell
git add nginx.conf.template
git commit -m "feat: add nginx reverse proxy config template"
```

---

### Task 8: Write entrypoint.sh

**Files:**
- Create: `entrypoint.sh`

- [ ] **Step 1: Write entrypoint.sh**

Create `entrypoint.sh`:
```sh
#!/bin/sh
set -e

for var in JELLYFIN_URL JELLYFIN_API_KEY OVERSEERR_URL OVERSEERR_API_KEY; do
  eval "val=\${$var}"
  if [ -z "$val" ]; then
    echo "ERROR: Required environment variable $var is not set." >&2
    exit 1
  fi
done

envsubst '${JELLYFIN_URL} ${JELLYFIN_API_KEY} ${OVERSEERR_URL} ${OVERSEERR_API_KEY}' \
  < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

envsubst '${JELLYFIN_URL} ${OVERSEERR_URL}' \
  < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
```

- [ ] **Step 2: Commit**

```powershell
git add entrypoint.sh
git commit -m "feat: add container entrypoint with env var validation"
```

---

### Task 9: Write Dockerfile and verify the build

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Write Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM nginx:alpine

RUN apk add --no-cache gettext

COPY html/ /usr/share/nginx/html/
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
```

- [ ] **Step 2: Build the image**

```powershell
docker build -t welcomarr .
```
Expected: build completes with no errors.

- [ ] **Step 3: Verify missing env var exits with a clear error**

```powershell
docker run --rm welcomarr
```
Expected output:
```
ERROR: Required environment variable JELLYFIN_URL is not set.
```

- [ ] **Step 4: Commit**

```powershell
git add Dockerfile
git commit -m "feat: add Dockerfile"
```

---

### Task 10: Write docker-compose.example.yml and run end-to-end test

**Files:**
- Create: `docker-compose.example.yml`

- [ ] **Step 1: Write docker-compose.example.yml**

Create `docker-compose.example.yml`:
```yaml
services:
  welcomarr:
    build: .
    ports:
      - "8080:80"
    environment:
      JELLYFIN_URL: http://your-jellyfin:8096
      JELLYFIN_API_KEY: your-jellyfin-api-key
      OVERSEERR_URL: http://your-overseerr:5055
      OVERSEERR_API_KEY: your-overseerr-api-key
    restart: unless-stopped
```

- [ ] **Step 2: Run the container with real credentials**

Replace values with your actual URLs and keys:
```powershell
docker run --rm -p 8080:80 `
  -e JELLYFIN_URL=http://your-jellyfin:8096 `
  -e JELLYFIN_API_KEY=your-key `
  -e OVERSEERR_URL=http://your-overseerr:5055 `
  -e OVERSEERR_API_KEY=your-key `
  welcomarr
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8080`. Check each of the following:
- Dark background, content at ~75% width, "welcomarr" title centered
- Jellyfin button (purple tint) shows real logo and opens Jellyfin in a new tab when clicked
- Seerr button (blue tint) shows real logo and opens Overseerr in a new tab when clicked
- "Recently Available" section loads 5 poster cards with real TMDB poster images
- Hovering a poster reveals title (large), type · year, and "▶ Watch" button
- Clicking "▶ Watch" opens the correct Jellyfin detail page in a new tab
- A card with no `jellyfinMediaId` shows "Not on Jellyfin yet" on hover instead of a Watch button
- Browser dev console shows no errors

- [ ] **Step 4: Commit**

```powershell
git add docker-compose.example.yml
git commit -m "feat: add docker-compose example"
```
