const ARTWORK_IDS = ['eeveely', 'red-kite-emily', 'chloe-red', 'red'];

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

async function supabaseFetch(config, path, options = {}) {
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...options.headers
    }
  });
}

function parseCount(response) {
  const range = response.headers.get('content-range') || '';
  const total = Number(range.split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}

async function countLikes(config, artworkId) {
  const response = await supabaseFetch(
    config,
    `art_likes?select=id&artwork_id=eq.${encodeURIComponent(artworkId)}&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  );
  if (!response.ok) throw new Error(`Could not count likes (${response.status})`);
  return parseCount(response);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const config = getConfig();
  if (!config) {
    return res.status(503).json({
      error: 'Private data store is not connected yet.',
      code: 'CONFIG_REQUIRED'
    });
  }

  try {
    if (req.method === 'GET') {
      const entries = await Promise.all(
        ARTWORK_IDS.map(async id => [id, await countLikes(config, id)])
      );
      return res.status(200).json({ counts: Object.fromEntries(entries) });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const artworkId = String(body.artworkId || '').trim();

    if (!ARTWORK_IDS.includes(artworkId)) {
      return res.status(400).json({ error: 'Unknown artwork.' });
    }

    if (body.type === 'like') {
      const visitorId = String(body.visitorId || '').trim().slice(0, 120);
      const liked = Boolean(body.liked);
      if (!visitorId) return res.status(400).json({ error: 'Missing visitor identifier.' });

      if (liked) {
        const insert = await supabaseFetch(config, 'art_likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'resolution=ignore-duplicates,return=minimal'
          },
          body: JSON.stringify({ artwork_id: artworkId, visitor_id: visitorId })
        });
        if (!insert.ok) throw new Error(`Could not save like (${insert.status})`);
      } else {
        const remove = await supabaseFetch(
          config,
          `art_likes?artwork_id=eq.${encodeURIComponent(artworkId)}&visitor_id=eq.${encodeURIComponent(visitorId)}`,
          { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
        );
        if (!remove.ok) throw new Error(`Could not remove like (${remove.status})`);
      }

      const count = await countLikes(config, artworkId);
      return res.status(200).json({ ok: true, count });
    }

    if (body.type === 'comment') {
      const name = String(body.name || '').trim().slice(0, 40);
      const comment = String(body.comment || '').trim().slice(0, 500);
      const website = String(body.website || '').trim();

      // Honeypot: silently accept bot submissions without storing them.
      if (website) return res.status(200).json({ ok: true });
      if (!name || name.length < 1) return res.status(400).json({ error: 'Please add your name.' });
      if (!comment || comment.length < 2) return res.status(400).json({ error: 'Please add a comment.' });

      const insert = await supabaseFetch(config, 'art_comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          artwork_id: artworkId,
          visitor_name: name,
          comment
        })
      });

      if (!insert.ok) throw new Error(`Could not save comment (${insert.status})`);
      return res.status(201).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown request type.' });
  } catch (error) {
    console.error('Engagement API error:', error);
    return res.status(500).json({ error: 'Something went wrong saving that. Please try again.' });
  }
};
