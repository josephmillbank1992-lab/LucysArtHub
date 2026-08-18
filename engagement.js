(() => {
  const artworkIds = ['eeveely', 'red-kite-emily', 'chloe-red', 'red'];
  const titleToId = {
    Eeveely: 'eeveely',
    'Red Kite Emily': 'red-kite-emily',
    'Chloe & Red': 'chloe-red',
    Red: 'red'
  };

  const counts = Object.fromEntries(artworkIds.map(id => [id, 0]));
  const modal = document.querySelector('#artModal');
  const modalTitle = document.querySelector('#modalTitle');
  const modalLikeCount = document.querySelector('#modalLikeCount');
  const modalLikeWord = document.querySelector('#modalLikeWord');
  const commentForm = document.querySelector('#commentForm');
  const commentArtwork = document.querySelector('#commentArtwork');
  const commentName = document.querySelector('#commentName');
  const commentText = document.querySelector('#commentText');
  const commentStatus = document.querySelector('#commentStatus');
  const commentSubmit = document.querySelector('#commentSubmit');
  let currentArtworkId = 'eeveely';
  let apiReady = true;

  function getVisitorId() {
    const key = 'lucy-art-visitor-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      localStorage.setItem(key, id);
    }
    return id;
  }

  const visitorId = getVisitorId();

  function setCount(id, value) {
    counts[id] = Math.max(0, Number(value) || 0);
    document.querySelectorAll(`[data-like-count="${id}"]`).forEach(node => {
      node.textContent = `${counts[id]} ${counts[id] === 1 ? 'like' : 'likes'}`;
    });
    if (currentArtworkId === id) updateModalCount();
  }

  function updateModalCount() {
    const value = counts[currentArtworkId] || 0;
    if (modalLikeCount) modalLikeCount.textContent = String(value);
    if (modalLikeWord) modalLikeWord.textContent = value === 1 ? 'like' : 'likes';
    if (commentArtwork) commentArtwork.value = currentArtworkId;
  }

  function localFallbackCounts() {
    artworkIds.forEach(id => {
      const loved = document.querySelector(`.heart-button[data-art="${id}"]`)?.classList.contains('loved');
      setCount(id, loved ? 1 : 0);
    });
  }

  async function loadCounts() {
    try {
      const response = await fetch('/api/engagement', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 503) apiReady = false;
        throw new Error(data.error || 'Could not load likes');
      }
      artworkIds.forEach(id => setCount(id, data.counts?.[id] || 0));
    } catch (error) {
      console.info('Using preview like counts until the private data store is connected.', error);
      localFallbackCounts();
    }
  }

  document.querySelectorAll('.heart-button').forEach(button => {
    button.addEventListener('click', async () => {
      const artworkId = button.dataset.art;
      const liked = button.classList.contains('loved');

      if (!apiReady) {
        setCount(artworkId, liked ? 1 : 0);
        return;
      }

      const previous = counts[artworkId] || 0;
      setCount(artworkId, Math.max(0, previous + (liked ? 1 : -1)));

      try {
        const response = await fetch('/api/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ type: 'like', artworkId, visitorId, liked })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 503) apiReady = false;
          throw new Error(data.error || 'Could not save like');
        }
        setCount(artworkId, data.count);
      } catch (error) {
        console.info('Like saved on this device for preview only.', error);
        setCount(artworkId, liked ? Math.max(1, previous) : Math.max(0, previous - 1));
      }
    });
  });

  function selectArtwork(id) {
    if (!artworkIds.includes(id)) return;
    currentArtworkId = id;
    updateModalCount();
    if (commentStatus) {
      commentStatus.textContent = '';
      commentStatus.className = 'comment-status';
    }
  }

  document.querySelectorAll('.art-card .art-image-button').forEach(button => {
    button.addEventListener('click', () => {
      selectArtwork(button.closest('.art-card')?.dataset.id);
    });
  });

  document.querySelectorAll('#randomHero, #randomGallery').forEach(button => {
    button.addEventListener('click', () => {
      window.setTimeout(() => selectArtwork(titleToId[modalTitle?.textContent] || currentArtworkId), 0);
    });
  });

  document.addEventListener('click', () => {
    window.setTimeout(() => {
      if (modal?.open && modalTitle?.textContent) {
        selectArtwork(titleToId[modalTitle.textContent] || currentArtworkId);
      }
    }, 0);
  });

  commentForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(commentForm);
    const name = String(formData.get('name') || '').trim();
    const comment = String(formData.get('comment') || '').trim();
    const website = String(formData.get('website') || '').trim();

    if (!name || !comment) return;

    commentSubmit.disabled = true;
    commentStatus.textContent = 'Sending your note to Dad’s private review panel…';
    commentStatus.className = 'comment-status';

    try {
      const response = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: 'comment', artworkId: currentArtworkId, name, comment, website })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 503) {
          apiReady = false;
          commentStatus.textContent = 'The private comment box is ready, but Dad still needs to connect its secure data store.';
          commentStatus.className = 'comment-status setup';
          return;
        }
        throw new Error(data.error || 'Could not send comment');
      }

      commentStatus.textContent = 'Sent! Thank you for leaving Lucy a lovely note. 💛';
      commentStatus.className = 'comment-status success';
      commentText.value = '';
      if (typeof window.confetti === 'function') {
        const rect = commentSubmit.getBoundingClientRect();
        window.confetti(rect.left + rect.width / 2, rect.top);
      }
    } catch (error) {
      console.error(error);
      commentStatus.textContent = 'That did not send. Please try again in a moment.';
      commentStatus.className = 'comment-status error';
    } finally {
      commentSubmit.disabled = false;
    }
  });

  const mobileMagicButton = document.querySelector('#mobileMagicButton');
  const mobileMagicResult = document.querySelector('#mobileMagicResult');
  const spells = [
    { text: 'Pink sparkle spell! Your next picture gets extra shine. ✨', bg: 'linear-gradient(135deg,#fff0fa,#ffd9ef)' },
    { text: 'Blue castle spell! A tiny unicorn is guarding the gallery. 🦄', bg: 'linear-gradient(135deg,#eef6ff,#d9eaff)' },
    { text: 'Golden heart spell! Every picture gets a happy cheer. 💛', bg: 'linear-gradient(135deg,#fffbea,#fff1a8)' },
    { text: 'Princess paint spell! Your colours have been magically boosted. 👑', bg: 'linear-gradient(135deg,#f8f2ff,#ffe7f5)' },
    { text: 'Confetti spell! The castle thinks this artwork deserves a party. 🎉', bg: 'linear-gradient(135deg,#fff4d6,#edf5ff)' }
  ];
  let lastSpell = -1;

  mobileMagicButton?.addEventListener('click', () => {
    let next = Math.floor(Math.random() * spells.length);
    if (spells.length > 1 && next === lastSpell) next = (next + 1) % spells.length;
    lastSpell = next;
    const spell = spells[next];
    mobileMagicResult.classList.add('is-casting');
    window.setTimeout(() => {
      mobileMagicResult.textContent = spell.text;
      mobileMagicResult.style.background = spell.bg;
      mobileMagicResult.classList.remove('is-casting');
    }, 130);

    if (typeof window.confetti === 'function') {
      const rect = mobileMagicButton.getBoundingClientRect();
      window.confetti(rect.left + rect.width / 2, rect.top);
    }
  });

  if (commentName) {
    const rememberedName = localStorage.getItem('lucy-art-comment-name');
    if (rememberedName) commentName.value = rememberedName;
    commentName.addEventListener('change', () => {
      localStorage.setItem('lucy-art-comment-name', commentName.value.trim().slice(0, 40));
    });
  }

  updateModalCount();
  loadCounts();
})();
