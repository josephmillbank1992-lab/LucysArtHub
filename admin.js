(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const loginCard = document.querySelector('#loginCard');
  const commentsPanel = document.querySelector('#commentsPanel');
  const loginForm = document.querySelector('#loginForm');
  const adminPassword = document.querySelector('#adminPassword');
  const loginStatus = document.querySelector('#loginStatus');
  const commentList = document.querySelector('#commentList');
  const commentSummary = document.querySelector('#commentSummary');
  const refreshComments = document.querySelector('#refreshComments');
  const lockPanel = document.querySelector('#lockPanel');
  const template = document.querySelector('#commentTemplate');
  const artworkNames = {
    eeveely: 'Eeveely',
    'red-kite-emily': 'Red Kite Emily',
    'chloe-red': 'Chloe & Red',
    red: 'Red'
  };
  const artworkImages = {
    eeveely: '/assets/eeveely.webp',
    'red-kite-emily': '/assets/red-kite-emily.webp',
    'chloe-red': '/assets/chloe-and-red.webp',
    red: '/assets/red.webp'
  };

  let password = sessionStorage.getItem('lucy-art-admin-password') || '';

  function setStatus(message, type = '') {
    loginStatus.textContent = message;
    loginStatus.className = `status${type ? ` ${type}` : ''}`;
  }

  function lock() {
    password = '';
    sessionStorage.removeItem('lucy-art-admin-password');
    commentsPanel.hidden = true;
    loginCard.hidden = false;
    adminPassword.value = '';
    setStatus('');
    adminPassword.focus();
  }

  function showPanel() {
    loginCard.hidden = true;
    commentsPanel.hidden = false;
  }

  async function rpc(functionName, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(response.status === 400 || response.status === 401 ? 'Incorrect admin password.' : 'Request failed.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function renderComments(comments) {
    commentList.innerHTML = '';
    commentSummary.textContent = `${comments.length} ${comments.length === 1 ? 'private comment' : 'private comments'} received`;

    if (!comments.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No comments yet. When someone leaves Lucy a note, it will appear here for you only.';
      commentList.appendChild(empty);
      return;
    }

    comments.forEach(comment => {
      const node = template.content.cloneNode(true);
      const card = node.querySelector('.comment-card');
      const artworkName = artworkNames[comment.artwork_id] || comment.artwork_id || 'Artwork';
      const artworkImage = artworkImages[comment.artwork_id];
      const image = node.querySelector('.comment-artwork-image');

      node.querySelector('.artwork-pill').textContent = artworkName;
      node.querySelector('.comment-artwork-name').textContent = artworkName;
      node.querySelector('.visitor-name').textContent = comment.visitor_name || 'Visitor';
      node.querySelector('.comment-body').textContent = comment.comment || '';

      if (artworkImage) {
        image.src = artworkImage;
        image.alt = `${artworkName}, the artwork this comment was left on`;
      } else {
        image.closest('.comment-artwork-preview')?.remove();
      }

      const time = node.querySelector('.comment-date');
      time.textContent = formatDate(comment.created_at);
      time.dateTime = comment.created_at || '';

      node.querySelector('.delete-comment').addEventListener('click', async event => {
        const button = event.currentTarget;
        if (!window.confirm('Delete this comment from the private panel?')) return;
        button.disabled = true;
        button.textContent = 'Deleting…';
        try {
          await rpc('admin_delete_comment', { admin_password: password, comment_id: comment.id });
          card.remove();
          await loadComments();
        } catch (error) {
          button.disabled = false;
          button.textContent = 'Delete comment';
          window.alert(error.message || 'Could not delete that comment.');
        }
      });

      commentList.appendChild(node);
    });
  }

  async function loadComments() {
    commentSummary.textContent = 'Loading comments…';
    try {
      const comments = await rpc('admin_comments', { admin_password: password });
      showPanel();
      renderComments(Array.isArray(comments) ? comments : []);
      return true;
    } catch (error) {
      lock();
      setStatus(error.message || 'The private panel could not load.', 'error');
      return false;
    }
  }

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    password = adminPassword.value;
    if (!password) return;
    setStatus('Checking password…');
    const success = await loadComments();
    if (success) sessionStorage.setItem('lucy-art-admin-password', password);
  });

  refreshComments?.addEventListener('click', loadComments);
  lockPanel?.addEventListener('click', lock);

  if (password) loadComments();
  else adminPassword.focus();
})();
