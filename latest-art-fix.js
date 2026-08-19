(() => {
  const latestArt = {
    'alice-in-wonderland': '/assets/alice-in-wonderland.webp',
    'lucy-as-belle': '/assets/lucy-as-belle.webp',
    'autumn-and-winter': '/assets/autumn-and-winter.webp',
    glinda: '/assets/glinda.webp',
    'my-first-picture': '/assets/my-first-picture.webp'
  };

  function syncCards() {
    Object.entries(latestArt).forEach(([id, src]) => {
      const img = document.querySelector(`.art-card[data-id="${id}"] img`);
      if (img && img.src !== new URL(src, window.location.href).href) img.src = src;
    });
  }

  function syncModal() {
    const modal = document.querySelector('#artModal');
    const title = document.querySelector('#modalTitle')?.textContent?.trim();
    if (!modal?.open || !title) return;
    const titleToId = {
      Alice: 'alice-in-wonderland',
      'Lucy as Belle': 'lucy-as-belle',
      'Autumn and Winter': 'autumn-and-winter',
      'Glinda from Wicked': 'glinda',
      'My First Picture': 'my-first-picture'
    };
    const id = titleToId[title];
    if (!id) return;
    const image = document.querySelector('#modalImage');
    if (image) image.src = latestArt[id];
    if (id === 'my-first-picture') {
      const category = document.querySelector('#modalCategory');
      if (category) category.textContent = 'First artwork · 4 months old';
    }
  }

  syncCards();
  document.addEventListener('click', () => window.setTimeout(() => {
    syncCards();
    syncModal();
  }, 0));

  const observer = new MutationObserver(() => {
    syncCards();
    syncModal();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
})();
