(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const artworkIds = ['chloe-red','red','london-bridge','mummy-and-me','my-fairy-ruby','pikachu-ex','queen-elizabeth','eeveely','red-kite-emily'];
  const titleToId = {
    'Chloe & Red':'chloe-red', Red:'red', 'London Bridge':'london-bridge', 'Mummy and Me':'mummy-and-me',
    'My Fairy Ruby':'my-fairy-ruby', 'Pikachu Ex':'pikachu-ex', 'Queen Elizabeth':'queen-elizabeth',
    Eeveely:'eeveely', 'Red Kite Emily':'red-kite-emily'
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

  function sbFetch(path, options = {}) {
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...options.headers } });
  }
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
