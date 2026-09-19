(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';

  function sbFetch(path, options = {}) {
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...options.headers
      }
    });
  }

  function currentArtworkIds() {
    return [...new Set(
      [...document.querySelectorAll('.heart-button[data-art], [data-like-count]')]
        .map(node => node.dataset.art || node.dataset.likeCount)
        .filter(Boolean)
    )];
  }

  function savedLikedArtworkIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem('lucy-art-hearts') || '[]'));
    } catch {
      return new Set();
    }
  }

  function visitorId() {
    return localStorage.getItem('lucy-art-visitor-id') || '';
  }

  async function backfillSavedLikes() {
    const id = visitorId();
    if (!id) return;

    const available = new Set(currentArtworkIds());
    const liked = [...savedLikedArtworkIds()].filter(artworkId => available.has(artworkId));

    await Promise.all(liked.map(async artworkId => {
      const response = await sbFetch('art_likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify({ artwork_id: artworkId, visitor_id: id })
      });
      if (!response.ok) throw new Error(`Could not repair saved like for ${artworkId}`);
    }));
  }

  async function refreshAllCounts() {
    const response = await sbFetch('art_likes?select=artwork_id');
    if (!response.ok) throw new Error('Could not refresh like totals');
    const rows = await response.json();
    const totals = new Map();

    rows.forEach(row => {
      totals.set(row.artwork_id, (totals.get(row.artwork_id) || 0) + 1);
    });

    currentArtworkIds().forEach(artworkId => {
      const count = totals.get(artworkId) || 0;
      document.querySelectorAll(`[data-like-count="${artworkId}"]`).forEach(node => {
        node.textContent = `${count} ${count === 1 ? 'like' : 'likes'}`;
      });
    });

    const currentModalId = document.querySelector('#commentArtwork')?.value;
    if (currentModalId) {
      const count = totals.get(currentModalId) || 0;
      const modalCount = document.querySelector('#modalLikeCount');
      const modalWord = document.querySelector('#modalLikeWord');
      if (modalCount) modalCount.textContent = String(count);
      if (modalWord) modalWord.textContent = count === 1 ? 'like' : 'likes';
    }
  }

  async function syncLikes() {
    try {
      await backfillSavedLikes();
      await refreshAllCounts();
    } catch (error) {
      console.error('Lucy artwork like sync failed:', error);
    }
  }

  syncLikes();

  document.addEventListener('click', event => {
    if (!event.target.closest('.heart-button[data-art]')) return;
    window.setTimeout(refreshAllCounts, 500);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshAllCounts().catch(() => {});
  });
})();
