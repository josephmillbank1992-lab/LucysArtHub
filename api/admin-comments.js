const crypto = require('crypto');

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!url || !key || !adminPassword) return null;
  return { url: url.replace(/\/$/, ''), key, adminPassword };
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function authorised(req, password) {
  const header = String(req.headers.authorization || '');
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return supplied && safeEqual(supplied, password);
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const config = getConfig();
  if (!config) {
    return res.status(503).json({ error: 'Admin data store is not configured.', code: 'CONFIG_REQUIRED' });
  }

  if (!authorised(req, config.adminPassword)) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  try {
    if (req.method === 'GET') {
      const response = await supabaseFetch(
        config,
        'art_comments?select=id,artwork_id,visitor_name,comment,created_at&order=created_at.desc&limit=250'
      );
      if (!response.ok) throw new Error(`Could not load comments (${response.status})`);
      const comments = await response.json();
      return res.status(200).json({ comments });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || '').trim();
      if (!id || !/^[0-9a-f-]{20,50}$/i.test(id)) {
        return res.status(400).json({ error: 'Invalid comment id.' });
      }

      const response = await supabaseFetch(config, `art_comments?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });
      if (!response.ok) throw new Error(`Could not delete comment (${response.status})`);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Admin comments API error:', error);
    return res.status(500).json({ error: 'Could not load the private comments panel.' });
  }
};
