const ALLOWED_FUNCTIONS = new Set([
  'admin_comments',
  'admin_delete_comment',
  'admin_categories',
  'admin_add_category',
  'admin_artworks',
  'admin_update_artwork',
  'admin_add_artwork'
]);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wcpmshpvpiogecjupdcn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const functionName = req.body?.functionName;
  const body = req.body?.body;

  if (!ALLOWED_FUNCTIONS.has(functionName) || !body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Invalid admin request.' });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await upstream.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!upstream.ok) {
      const incorrectPassword =
        upstream.status === 401 ||
        data?.code === '28000' ||
        /incorrect admin password/i.test(data?.message || '');

      return res.status(incorrectPassword ? 401 : upstream.status).json({
        message: incorrectPassword
          ? 'Incorrect admin password.'
          : (data?.message || 'The admin request could not be completed.')
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Lucy admin RPC proxy failed:', error);
    return res.status(502).json({
      message: 'Could not connect to the database. Please try again in a moment.'
    });
  }
};
