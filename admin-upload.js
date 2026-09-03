(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const form = document.querySelector('#artworkUploadForm');
  const imageInput = document.querySelector('#artworkPhoto');
  const titleInput = document.querySelector('#artworkTitle');
  const ageInput = document.querySelector('#artworkAge');
  const categoryInput = document.querySelector('#artworkCategory');
  const subjectInput = document.querySelector('#artworkSubject');
  const descriptionInput = document.querySelector('#artworkDescription');
  const preview = document.querySelector('#artworkPreview');
  const status = document.querySelector('#artworkUploadStatus');
  const submit = document.querySelector('#artworkUploadSubmit');
  if (!form || !imageInput || !titleInput || !ageInput || !categoryInput || !subjectInput) return;
  let selectedFile = null;

  function setStatus(message, type = '') { status.textContent = message; status.className = `upload-status${type ? ` ${type}` : ''}`; }
  function slugify(value) { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lucy-artwork'; }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = () => reject(new Error('Could not read that image.'));
      reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error('That image could not be opened.'));
        image.onload = () => { const maxSide = 1600; const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight)); const width = Math.max(1, Math.round(image.naturalWidth * scale)); const height = Math.max(1, Math.round(image.naturalHeight * scale)); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d', { alpha: false }); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); ctx.drawImage(image, 0, 0, width, height); resolve(canvas.toDataURL('image/webp', .82)); };
        image.src = reader.result; };
      reader.readAsDataURL(file);
    });
  }
  async function rpc(functionName, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status === 400 || response.status === 401 ? 'Your admin password was not accepted.' : (data?.message || data?.hint || 'The artwork could not be published.'));
    return data;
  }
  imageInput.addEventListener('change', () => {
    selectedFile = imageInput.files?.[0] || null;
    if (!selectedFile) { preview.hidden = true; preview.removeAttribute('src'); return; }
    const url = URL.createObjectURL(selectedFile); preview.src = url; preview.hidden = false; preview.onload = () => URL.revokeObjectURL(url);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const password = sessionStorage.getItem('lucy-art-admin-password') || '';
    const title = titleInput.value.trim(); const age = Number(ageInput.value); const category = categoryInput.value.trim(); const subject = subjectInput.value.trim();
    if (!password) return setStatus('Unlock the admin panel first.', 'error');
    if (!selectedFile || !title || !Number.isFinite(age) || !category || !subject) return setStatus('Add a photo, name, age, category and subject.', 'error');
    submit.disabled = true; setStatus('Preparing the picture…');
    try {
      const imageData = await compressImage(selectedFile); if (imageData.length > 2700000) throw new Error('That photo is still too large after compression. Try a smaller image.');
      const id = `${slugify(title)}-${Date.now().toString(36)}`; const ageLabel = age < 1 ? `${Math.max(1, Math.round(age * 12))} months old` : '';
      const description = descriptionInput.value.trim() || (ageLabel ? `Made by Lucy at ${ageLabel}.` : `Made by Lucy at age ${age}.`);
      const tags = `${category} ${subject} uploaded drawing art`.toLowerCase();
      setStatus('Publishing to Lucy’s gallery…');
      await rpc('admin_add_artwork', { admin_password: password, artwork_id: id, artwork_title: title, artwork_age: age, artwork_age_label: ageLabel, artwork_category: category, artwork_subject: subject, artwork_tags: tags, artwork_description: description, artwork_image_data: imageData });
      setStatus('Published! It will now appear in Lucy’s gallery. ✨', 'success'); form.reset(); selectedFile = null; preview.hidden = true; preview.removeAttribute('src'); window.dispatchEvent(new Event('lucy-admin-reload'));
    } catch (error) { console.error(error); setStatus(error.message || 'The artwork could not be published.', 'error'); }
    finally { submit.disabled = false; }
  });
})();