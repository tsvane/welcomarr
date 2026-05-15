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
