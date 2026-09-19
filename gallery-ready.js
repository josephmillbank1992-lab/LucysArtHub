(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const grid = document.querySelector('#artGrid');
  if (!grid) return;

  const sbFetch = path => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function sortCards(rows) {
    const createdAt = new Map(rows.map(row => [row.id, row.created_at || '']));
    const cards = [...grid.querySelectorAll('.art-card')];
    cards.sort((a, b) => {
      const ageDiff = (Number(b.dataset.age) || 0) - (Number(a.dataset.age) || 0);
      if (ageDiff !== 0) return ageDiff;
      const aCreated = createdAt.get(a.dataset.id) || '';
      const bCreated = createdAt.get(b.dataset.id) || '';
      return bCreated.localeCompare(aCreated);
    });
    cards.forEach(card => grid.appendChild(card));
    if (typeof galleryOrder !== 'undefined') {
      galleryOrder.splice(0, galleryOrder.length, ...cards.map(card => card.dataset.id));
    }
  }

  async function waitForCrmRows(rows) {
    const expectedIds = rows.map(row => row.id);
    const deadline = Date.now() + 3500;
    while (Date.now() < deadline) {
      const ready = expectedIds.every(id => grid.querySelector(`.art-card[data-id="${CSS.escape(id)}"]`));
      if (ready) return true;
      await sleep(50);
    }
    return false;
  }

  async function revealWhenReady() {
    try {
      const response = await sbFetch('artworks?select=id,age,created_at&published=eq.true&order=age.desc,created_at.desc');
      if (!response.ok) throw new Error('Could not verify gallery data');
      const rows = await response.json();
      await waitForCrmRows(rows);
      sortCards(rows);
    } catch (error) {
      console.error('Gallery readiness check failed:', error);
    } finally {
      requestAnimationFrame(() => grid.classList.add('gallery-is-ready'));
    }
  }

  revealWhenReady();
})();