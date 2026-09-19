(() => {
  const extraArtworks = {
    'alice-in-wonderland': {
      title: 'Alice',
      category: 'Little Friends',
      tags: 'little-friends little friends alice wonderland colouring',
      age: 7,
      image: '/assets/alice-in-wonderland.webp',
      alt: 'Alice in Wonderland artwork by Lucy',
      description: 'Alice and her little white rabbit friend, coloured with bright blues, purples and lots of tiny storybook details.'
    },
    'lucy-as-belle': {
      title: 'Lucy as Belle',
      category: 'Princesses',
      tags: 'princesses colouring belle',
      age: 7,
      image: '/assets/lucy-as-belle.webp',
      alt: 'Lucy as Belle artwork by Lucy',
      description: 'Lucy imagined herself as Belle, complete with the blue dress, big bow and a very important little teacup.'
    },
    'autumn-and-winter': {
      title: 'Autumn and Winter',
      category: 'Seasons',
      tags: 'seasons drawing autumn winter',
      age: 6,
      image: '/assets/autumn-and-winter.webp',
      alt: 'Autumn and Winter artwork by Lucy',
      description: 'Two seasons side by side, with Lucy imagining how the same little world changes from autumn rain to winter snow.'
    },
    glinda: {
      title: 'Glinda from Wicked',
      category: 'Characters',
      tags: 'characters wicked glinda drawing',
      age: 6,
      image: '/assets/glinda.webp',
      alt: 'Glinda from Wicked artwork by Lucy',
      description: 'Lucy’s drawing of Glinda, with a sparkling crown, pink dress and plenty of character.'
    },
    'my-first-picture': {
      title: 'My First Picture',
      category: 'First artwork',
      tags: 'first artwork painting baby',
      age: 0,
      ageLabel: '4 months old',
      image: '/assets/my-first-picture.webp',
      alt: 'Lucy’s first artwork, painted at four months old',
      description: 'Lucy’s very first artwork, made at just four months old — proof she has loved making art from right at the beginning.'
    }
  };

  if (typeof artworks !== 'undefined' && !artworks['alice-in-wonderland']) {
    Object.assign(artworks, extraArtworks);

    const orderedIds = [
      'alice-in-wonderland', 'lucy-as-belle', 'chloe-red', 'red',
      'autumn-and-winter', 'glinda', 'london-bridge', 'mummy-and-me',
      'my-fairy-ruby', 'pikachu-ex', 'queen-elizabeth', 'eeveely',
      'red-kite-emily', 'my-first-picture'
    ];
    if (typeof galleryOrder !== 'undefined') galleryOrder.splice(0, galleryOrder.length, ...orderedIds);

    const grid = document.querySelector('#artGrid');
    if (grid && typeof cardMarkup === 'function') {
      const firstCard = grid.firstElementChild;
      if (firstCard) firstCard.insertAdjacentHTML('beforebegin', cardMarkup('alice-in-wonderland') + cardMarkup('lucy-as-belle'));
      const londonCard = grid.querySelector('[data-id="london-bridge"]');
      if (londonCard) londonCard.insertAdjacentHTML('beforebegin', cardMarkup('autumn-and-winter') + cardMarkup('glinda'));
      grid.insertAdjacentHTML('beforeend', cardMarkup('my-first-picture'));

      const firstAge = grid.querySelector('[data-id="my-first-picture"] .art-age');
      if (firstAge) firstAge.textContent = '4 months old';

      ['alice-in-wonderland', 'lucy-as-belle', 'autumn-and-winter', 'glinda', 'my-first-picture'].forEach(id => {
        const card = grid.querySelector(`[data-id="${id}"]`);
        card?.querySelector('.art-image-button')?.addEventListener('click', () => {
          if (typeof openArtwork === 'function') openArtwork(id);
          if (id === 'my-first-picture' && typeof modalCategory !== 'undefined' && modalCategory) modalCategory.textContent = 'First artwork · 4 months old';
        });
        card?.querySelector('.heart-button')?.addEventListener('click', event => {
          event.stopPropagation();
          const artId = event.currentTarget.dataset.art;
          if (typeof savedHearts !== 'undefined') {
            savedHearts.has(artId) ? savedHearts.delete(artId) : savedHearts.add(artId);
            localStorage.setItem('lucy-art-hearts', JSON.stringify([...savedHearts]));
            if (typeof refreshHearts === 'function') refreshHearts();
          }
        });
      });
      if (typeof refreshHearts === 'function') refreshHearts();
    }

    const filterRow = document.querySelector('.filter-row');
    if (filterRow && !filterRow.querySelector('[data-filter="little-friends"]')) {
      const button = document.createElement('button');
      button.className = 'filter-chip';
      button.dataset.filter = 'little-friends';
      button.type = 'button';
      button.textContent = 'Little Friends';
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        if (typeof activeCategory !== 'undefined') activeCategory = 'little-friends';
        if (typeof applyGalleryFilters === 'function') applyGalleryFilters();
      });
      filterRow.appendChild(button);
    }

    const ageFromControl = document.querySelector('#ageFrom');
    const ageToControl = document.querySelector('#ageTo');
    const resetAge = document.querySelector('#resetAgeFilter');
    if (ageFromControl && ageToControl) {
      ageFromControl.min = '0';
      ageToControl.min = '0';
      ageFromControl.value = '0';
      const tickStrip = document.querySelector('.age-tick-strip');
      if (tickStrip) tickStrip.innerHTML = '<span>4m</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>';
      const prettyAgeRange = () => {
        const min = Number(ageFromControl.value), max = Number(ageToControl.value);
        const fromValue = document.querySelector('#ageFromValue'), toValue = document.querySelector('#ageToValue'), label = document.querySelector('#ageRangeLabel');
        if (fromValue) fromValue.textContent = min === 0 ? '4 months' : String(min);
        if (toValue) toValue.textContent = max === 0 ? '4 months' : String(max);
        if (label) {
          if (min === max) label.textContent = min === 0 ? '4 months old' : `Age ${min}`;
          else if (min === 0) label.textContent = `4 months to age ${max}`;
          else label.textContent = `Age ${min} to ${max}`;
        }
      };
      ageFromControl.addEventListener('input', prettyAgeRange);
      ageToControl.addEventListener('input', prettyAgeRange);
      resetAge?.addEventListener('click', () => {
        ageFromControl.value = '0'; ageToControl.value = '7';
        if (typeof applyGalleryFilters === 'function') applyGalleryFilters();
        prettyAgeRange();
      });
      if (typeof applyGalleryFilters === 'function') applyGalleryFilters();
      prettyAgeRange();
    }
  }

  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const artworkIds = ['alice-in-wonderland','lucy-as-belle','chloe-red','red','autumn-and-winter','glinda','london-bridge','mummy-and-me','my-fairy-ruby','pikachu-ex','queen-elizabeth','eeveely','red-kite-emily','my-first-picture'];
  const titleToId = {
    Alice:'alice-in-wonderland', 'Lucy as Belle':'lucy-as-belle', 'Chloe & Red':'chloe-red', Red:'red',
    'Autumn and Winter':'autumn-and-winter', 'Glinda from Wicked':'glinda', 'London Bridge':'london-bridge', 'Mummy and Me':'mummy-and-me',
    'My Fairy Ruby':'my-fairy-ruby', 'Pikachu Ex':'pikachu-ex', 'Queen Elizabeth':'queen-elizabeth', Eeveely:'eeveely',
    'Red Kite Emily':'red-kite-emily', 'My First Picture':'my-first-picture'
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

  function sbFetch(path, options = {}) { return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...options.headers } }); }
  function getVisitorId() {
    const key = 'lucy-art-visitor-id'; let id = localStorage.getItem(key);
    if (!id) { id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem(key, id); }
    return id;
  }
  const visitorId = getVisitorId();
  function setCount(id, value) {
    counts[id] = Math.max(0, Number(value) || 0);
    document.querySelectorAll(`[data-like-count="${id}"]`).forEach(node => { node.textContent = `${counts[id]} ${counts[id] === 1 ? 'like' : 'likes'}`; });
    if (currentArtworkId === id) updateModalCount();
  }
  function updateModalCount() {
    const value = counts[currentArtworkId] || 0;
    if (modalLikeCount) modalLikeCount.textContent = String(value);
    if (modalLikeWord) modalLikeWord.textContent = value === 1 ? 'like' : 'likes';
    if (commentArtwork) commentArtwork.value = currentArtworkId;
  }
  async function loadCounts() {
    try {
      const response = await sbFetch('art_likes?select=artwork_id');
      if (!response.ok) throw new Error('Could not load likes');
      const rows = await response.json();
      artworkIds.forEach(id => setCount(id, rows.filter(row => row.artwork_id === id).length));
    } catch (error) { console.error('Could not load public like totals.', error); }
  }

  document.querySelectorAll('.heart-button').forEach(button => {
    button.addEventListener('click', async () => {
      const artworkId = button.dataset.art; const liked = button.classList.contains('loved'); const previous = counts[artworkId] || 0;
      setCount(artworkId, Math.max(0, previous + (liked ? 1 : -1)));
      try {
        let response;
        if (liked) response = await sbFetch('art_likes', { method:'POST', headers:{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'}, body:JSON.stringify({artwork_id:artworkId,visitor_id:visitorId}) });
        else response = await sbFetch(`art_likes?artwork_id=eq.${encodeURIComponent(artworkId)}&visitor_id=eq.${encodeURIComponent(visitorId)}`, { method:'DELETE', headers:{Prefer:'return=minimal'} });
        if (!response.ok) throw new Error('Could not save like');
        await loadCounts();
      } catch (error) { console.error(error); setCount(artworkId, previous); }
    });
  });

  function selectArtwork(id) {
    if (!artworkIds.includes(id)) return;
    currentArtworkId = id; updateModalCount();
    if (commentStatus) { commentStatus.textContent = ''; commentStatus.className = 'comment-status'; }
  }
  document.querySelectorAll('.art-card .art-image-button').forEach(button => button.addEventListener('click', () => selectArtwork(button.closest('.art-card')?.dataset.id)));
  document.querySelectorAll('#randomHero, #randomGallery').forEach(button => button.addEventListener('click', () => window.setTimeout(() => selectArtwork(titleToId[modalTitle?.textContent] || currentArtworkId), 0)));
  document.addEventListener('click', () => window.setTimeout(() => { if (modal?.open && modalTitle?.textContent) selectArtwork(titleToId[modalTitle.textContent] || currentArtworkId); }, 0));

  commentForm?.addEventListener('submit', async event => {
    event.preventDefault(); const formData = new FormData(commentForm);
    const name = String(formData.get('name') || '').trim().slice(0,40); const comment = String(formData.get('comment') || '').trim().slice(0,500); const website = String(formData.get('website') || '').trim();
    if (!name || !comment) return;
    if (website) { commentStatus.textContent = 'Sent! Thank you for leaving Lucy a lovely note. 💛'; return; }
    commentSubmit.disabled = true; commentStatus.textContent = 'Sending your note to Dad’s private review panel…'; commentStatus.className = 'comment-status';
    try {
      const response = await sbFetch('art_comments', { method:'POST', headers:{'Content-Type':'application/json',Prefer:'return=minimal'}, body:JSON.stringify({artwork_id:currentArtworkId,visitor_name:name,comment}) });
      if (!response.ok) throw new Error('Could not send comment');
      commentStatus.textContent = 'Sent! Thank you for leaving Lucy a lovely note. 💛'; commentStatus.className = 'comment-status success'; commentText.value = '';
      if (typeof window.confetti === 'function') { const rect = commentSubmit.getBoundingClientRect(); window.confetti(rect.left + rect.width / 2, rect.top); }
    } catch (error) { console.error(error); commentStatus.textContent = 'That did not send. Please try again in a moment.'; commentStatus.className = 'comment-status error'; }
    finally { commentSubmit.disabled = false; }
  });

  const mobileMagicButton = document.querySelector('#mobileMagicButton'); const mobileMagicResult = document.querySelector('#mobileMagicResult');
  const spells = [
    {text:'Pink sparkle spell! Your next picture gets extra shine. ✨',bg:'linear-gradient(135deg,#fff0fa,#ffd9ef)'},
    {text:'Blue castle spell! A tiny unicorn is guarding the gallery. 🦄',bg:'linear-gradient(135deg,#eef6ff,#d9eaff)'},
    {text:'Golden heart spell! Every picture gets a happy cheer. 💛',bg:'linear-gradient(135deg,#fffbea,#fff1a8)'},
    {text:'Princess paint spell! Your colours have been magically boosted. 👑',bg:'linear-gradient(135deg,#f8f2ff,#ffe7f5)'},
    {text:'Confetti spell! The castle thinks this artwork deserves a party. 🎉',bg:'linear-gradient(135deg,#fff4d6,#edf5ff)'}
  ];
  let lastSpell = -1;
  mobileMagicButton?.addEventListener('click', () => {
    let next = Math.floor(Math.random()*spells.length); if (spells.length > 1 && next === lastSpell) next = (next+1)%spells.length; lastSpell = next; const spell = spells[next];
    mobileMagicResult.classList.add('is-casting'); window.setTimeout(() => { mobileMagicResult.textContent = spell.text; mobileMagicResult.style.background = spell.bg; mobileMagicResult.classList.remove('is-casting'); },130);
    if (typeof window.confetti === 'function') { const rect = mobileMagicButton.getBoundingClientRect(); window.confetti(rect.left+rect.width/2,rect.top); }
  });
  if (commentName) {
    const rememberedName = localStorage.getItem('lucy-art-comment-name'); if (rememberedName) commentName.value = rememberedName;
    commentName.addEventListener('change', () => localStorage.setItem('lucy-art-comment-name', commentName.value.trim().slice(0,40)));
  }
  updateModalCount(); loadCounts();
})();
