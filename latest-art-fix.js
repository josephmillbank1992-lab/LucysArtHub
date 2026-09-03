(() => {
  const dataFiles = {
    'alice-in-wonderland': [
      '/assets-data/alice-in-wonderland-v4-01.b64',
      '/assets-data/alice-in-wonderland-v4-02.b64',
      '/assets-data/alice-in-wonderland-v4-03.b64',
      '/assets-data/alice-in-wonderland-v4-04.b64',
      '/assets-data/alice-in-wonderland-v4-05.b64',
      '/assets-data/alice-in-wonderland-v4-06.b64'
    ],
    'lucy-as-belle': '/assets-data/lucy-as-belle-fix.b64',
    'autumn-and-winter': '/assets-data/autumn-and-winter-v2.b64',
    glinda: '/assets-data/glinda-v2.b64',
    'my-first-picture': '/assets-data/my-first-picture-fix.b64'
  };

  const titleToId = {
    Alice: 'alice-in-wonderland',
    'Lucy as Belle': 'lucy-as-belle',
    'Autumn and Winter': 'autumn-and-winter',
    'Glinda from Wicked': 'glinda',
    'My First Picture': 'my-first-picture'
  };

  const imageUrls = {};

  function base64ToObjectUrl(base64) {
    const clean = base64.replace(/\s+/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
  }

  function syncCards() {
    Object.entries(imageUrls).forEach(([id, src]) => {
      document.querySelectorAll(`.art-card[data-id="${id}"] img`).forEach(img => {
        if (img.src !== src) img.src = src;
      });
    });
  }

  function syncModal() {
    const modal = document.querySelector('#artModal');
    if (!modal?.open) return;
    const title = document.querySelector('#modalTitle')?.textContent?.trim();
    const id = titleToId[title];
    if (!id || !imageUrls[id]) return;

    const image = document.querySelector('#modalImage');
    if (image && image.src !== imageUrls[id]) image.src = imageUrls[id];

    if (id === 'my-first-picture') {
      const category = document.querySelector('#modalCategory');
      if (category) category.textContent = 'First artwork · 4 months old';
    }
  }

  async function loadArtwork(id, source) {
    const paths = Array.isArray(source) ? source : [source];
    const chunks = await Promise.all(paths.map(async path => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${id}`);
      return (await response.text()).replace(/\s+/g, '');
    }));
    const base64 = chunks.join('');
    if (!base64 || base64.length % 4 !== 0) throw new Error(`Invalid artwork data for ${id}`);
    imageUrls[id] = base64ToObjectUrl(base64);
    syncCards();
    syncModal();
  }

  Object.entries(dataFiles).forEach(([id, source]) => {
    loadArtwork(id, source).catch(error => console.error('Could not load latest Lucy artwork:', id, error));
  });

  document.addEventListener('click', () => window.setTimeout(syncModal, 0));
  const observer = new MutationObserver(() => {
    syncCards();
    syncModal();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
})();
