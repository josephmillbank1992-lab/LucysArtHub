(() => {
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

  async function api(path = '', options = {}) {
    const response = await fetch(`/api/admin-comments${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${password}`,
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
    return data;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
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
      node.querySelector('.artwork-pill').textContent = artworkNames[comment.artwork_id] || comment.artwork_id;
      node.querySelector('.visitor-name').textContent = comment.visitor_name || 'Visitor';
      node.querySelector('.comment-body').textContent = comment.comment || '';
      const time = node.querySelector('.comment-date');
      time.textContent = formatDate(comment.created_at);
      time.dateTime = comment.created_at || '';

      node.querySelector('.delete-comment').addEventListener('click', async event => {
        const button = event.currentTarget;
        if (!window.confirm('Delete this comment from the private panel?')) return;
        button.disabled = true;
        button.textContent = 'Deleting…';
        try {
          await api(`?id=${encodeURIComponent(comment.id)}`, { method: 'DELETE' });
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
      const data = await api();
      showPanel();
      renderComments(data.comments || []);
      return true;
    } catch (error) {
      if (error.status === 401) {
        lock();
        setStatus('That password was not accepted.', 'error');
      } else if (error.status === 503 || error.code === 'CONFIG_REQUIRED') {
        lock();
        setStatus('The panel is built, but the secure data store and admin password still need to be connected in Vercel.', 'setup');
      } else {
        setStatus('The private panel could not load. Please try again.', 'error');
      }
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

  if (password) {
    loadComments();
  } else {
    adminPassword.focus();
  }
})();
