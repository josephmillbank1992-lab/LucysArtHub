(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const visitorKey = 'lucy-art-visitor-id';
  let visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(visitorKey, visitorId);
  }

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

  function displayAge(row) {
    if (row.age_label) return row.age_label;
    const value = Number(row.age);
    return Number.isInteger(value) ? `Age ${value}` : `Age ${value}`;
  }

  async function refreshLikeCount(id) {
    const response = await sbFetch(`art_likes?select=artwork_id&artwork_id=eq.${encodeURIComponent(id)}`);
    if (!response.ok) return;
    const rows = await response.json();
    const count = rows.length;
    document.querySelectorAll(`[data-like-count="${id}"]`).forEach(node => {
      node.textContent = `${count} ${count === 1 ? 'like' : 'likes'}`;
    });
    const modalTitle = document.querySelector('#modalTitle')?.textContent;
    if (modalTitle === artworks[id]?.title) {
      const modalLikeCount = document.querySelector('#modalLikeCount');
      const modalLikeWord = document.querySelector('#modalLikeWord');
      if (modalLikeCount) modalLikeCount.textContent = String(count);
      if (modalLikeWord) modalLikeWord.textContent = count === 1 ? 'like' : 'likes';
    }
  }

  function bindUploadedCard(id) {
    const card = document.querySelector(`.art-card[data-id="${id}"]`);
    if (!card || card.dataset.uploadBound === 'true') return;
    card.dataset.uploadBound = 'true';

    const imageButton = card.querySelector('.art-image-button');
    imageButton?.addEventListener('click', () => {
      openArtwork(id);
      const art = artworks[id];
      if (modalCategory) modalCategory.textContent = `${art.category} · ${art.ageLabel || `Age ${art.age}`}`;
      const hidden = document.querySelector('#commentArtwork');
      if (hidden) hidden.value = id;
      refreshLikeCount(id);
    });

    const heart = card.querySelector('.heart-button');
    heart?.addEventListener('click', async event => {
      event.stopPropagation();
      const wasLoved = savedHearts.has(id);
      wasLoved ? savedHearts.delete(id) : savedHearts.add(id);
      localStorage.setItem('lucy-art-hearts', JSON.stringify([...savedHearts]));
      refreshHearts();

      try {
        let response;
        if (!wasLoved) {
          response = await sbFetch('art_likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
            body: JSON.stringify({ artwork_id: id, visitor_id: visitorId })
          });
        } else {
          response = await sbFetch(`art_likes?artwork_id=eq.${encodeURIComponent(id)}&visitor_id=eq.${encodeURIComponent(visitorId)}`, {
            method: 'DELETE',
            headers: { Prefer: 'return=minimal' }
          });
        }
        if (!response.ok) throw new Error('Could not save like');
        await refreshLikeCount(id);
      } catch (error) {
        console.error(error);
        wasLoved ? savedHearts.add(id) : savedHearts.delete(id);
        localStorage.setItem('lucy-art-hearts', JSON.stringify([...savedHearts]));
        refreshHearts();
      }
    });

    refreshLikeCount(id);
  }

  async function loadUploadedArtworks() {
    const response = await sbFetch('artworks?select=id,title,age,age_label,category,tags,description,image_data,created_at&published=eq.true&order=created_at.desc');
    if (!response.ok) throw new Error('Could not load uploaded artwork');
    const rows = await response.json();
    const grid = document.querySelector('#artGrid');
    if (!grid || !rows.length) return;

    rows.forEach(row => {
      if (artworks[row.id]) return;
      artworks[row.id] = {
        title: row.title,
        category: row.category || 'New artwork',
        tags: row.tags || 'uploaded drawing art',
        age: Number(row.age),
        ageLabel: row.age_label || '',
        image: row.image_data,
        alt: `${row.title} artwork by Lucy`,
        description: row.description || `${row.title}, made by Lucy ${displayAge(row).toLowerCase()}.`
      };
      galleryOrder.unshift(row.id);
      grid.insertAdjacentHTML('afterbegin', cardMarkup(row.id));
      const card = grid.querySelector(`.art-card[data-id="${row.id}"]`);
      const img = card?.querySelector('img');
      if (img) img.src = row.image_data;
      const age = card?.querySelector('.art-age');
      if (age) age.textContent = row.age_label || `Age ${Number(row.age)}`;
      bindUploadedCard(row.id);
    });

    refreshHearts();
    if (typeof applyGalleryFilters === 'function') applyGalleryFilters();
  }

  const commentForm = document.querySelector('#commentForm');
  commentForm?.addEventListener('submit', async event => {
    const artworkId = document.querySelector('#commentArtwork')?.value || '';
    if (!artworkId || !artworks[artworkId] || !artworks[artworkId].image?.startsWith('data:image/')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(commentForm);
    const name = String(formData.get('name') || '').trim().slice(0, 40);
    const comment = String(formData.get('comment') || '').trim().slice(0, 500);
    const website = String(formData.get('website') || '').trim();
    const status = document.querySelector('#commentStatus');
    const submit = document.querySelector('#commentSubmit');
    const text = document.querySelector('#commentText');
    if (!name || !comment) return;
    if (website) {
      if (status) status.textContent = 'Sent! Thank you for leaving Lucy a lovely note. 💛';
      return;
    }

    submit.disabled = true;
    if (status) {
      status.textContent = 'Sending your note to Dad’s private review panel…';
      status.className = 'comment-status';
    }
    try {
      const response = await sbFetch('art_comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ artwork_id: artworkId, visitor_name: name, comment })
      });
      if (!response.ok) throw new Error('Could not send comment');
      if (status) {
        status.textContent = 'Sent! Thank you for leaving Lucy a lovely note. 💛';
        status.className = 'comment-status success';
      }
      if (text) text.value = '';
      if (typeof window.confetti === 'function') {
        const rect = submit.getBoundingClientRect();
        window.confetti(rect.left + rect.width / 2, rect.top);
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = 'That did not send. Please try again in a moment.';
        status.className = 'comment-status error';
      }
    } finally {
      submit.disabled = false;
    }
  }, true);

  loadUploadedArtworks().catch(error => console.error('Uploaded artwork loading error:', error));
})();