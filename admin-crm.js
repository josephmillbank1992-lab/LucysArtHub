(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const staticImages = {
    'alice-in-wonderland':'/assets/alice-in-wonderland.webp','lucy-as-belle':'/assets/lucy-as-belle.webp','chloe-red':'/assets/chloe-and-red.webp',red:'/assets/red.webp','autumn-and-winter':'/assets/autumn-and-winter.webp',glinda:'/assets/glinda.webp','london-bridge':'/assets/london-bridge.webp','mummy-and-me':'/assets/mummy-and-me.webp','my-fairy-ruby':'/assets/my-fairy-ruby.webp','pikachu-ex':'/assets/pikachu-ex.webp','queen-elizabeth':'/assets/queen-elizabeth.webp',eeveely:'/assets/eeveely.webp','red-kite-emily':'/assets/red-kite-emily.webp','my-first-picture':'/assets/my-first-picture.webp'
  };
  const categoryList = document.querySelector('#categoryList');
  const categoryForm = document.querySelector('#categoryForm');
  const newCategoryName = document.querySelector('#newCategoryName');
  const categoryStatus = document.querySelector('#categoryStatus');
  const uploadCategory = document.querySelector('#artworkCategory');
  const editSelect = document.querySelector('#editArtworkSelect');
  const editForm = document.querySelector('#editArtworkForm');
  const editTitle = document.querySelector('#editArtworkTitle');
  const editAge = document.querySelector('#editArtworkAge');
  const editAgeLabel = document.querySelector('#editArtworkAgeLabel');
  const editCategory = document.querySelector('#editArtworkCategory');
  const editSubject = document.querySelector('#editArtworkSubject');
  const editTags = document.querySelector('#editArtworkTags');
  const editDescription = document.querySelector('#editArtworkDescription');
  const editPhoto = document.querySelector('#editArtworkPhoto');
  const editPreview = document.querySelector('#editArtworkPreview');
  const editIdLabel = document.querySelector('#editArtworkIdLabel');
  const editSubmit = document.querySelector('#editArtworkSubmit');
  const editStatus = document.querySelector('#editArtworkStatus');
  let categories = [];
  let records = [];

  const password = () => sessionStorage.getItem('lucy-art-admin-password') || '';
  async function rpc(name, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method:'POST', headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status===400 || response.status===401 ? 'Your admin password was not accepted.' : (data?.message || 'Request failed.'));
    return data;
  }
  function setStatus(node, message, type='') { if (!node) return; node.textContent=message; node.className=`upload-status${type?` ${type}`:''}`; }
  function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function fillCategorySelect(select, selected='') {
    if (!select) return;
    const first = select === uploadCategory ? '<option value="">Choose a category…</option>' : '';
    select.innerHTML = first + categories.map(c => `<option value="${escapeHtml(c)}"${c===selected?' selected':''}>${escapeHtml(c)}</option>`).join('');
  }
  async function loadCategories() {
    const rows = await rpc('admin_categories',{admin_password:password()});
    categories = (rows || []).map(r=>r.name);
    categoryList.innerHTML = categories.map(c=>`<span class="category-pill">${escapeHtml(c)}</span>`).join('');
    fillCategorySelect(uploadCategory, uploadCategory?.value || '');
    fillCategorySelect(editCategory, editCategory?.value || '');
    window.dispatchEvent(new CustomEvent('lucy-admin-categories',{detail:{categories}}));
  }
  async function loadArtworks(selectedId='') {
    records = await rpc('admin_artworks',{admin_password:password()});
    editSelect.innerHTML = '<option value="">Choose artwork…</option>' + records.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.title)} · ${escapeHtml(r.category || '')}</option>`).join('');
    if (selectedId && records.some(r=>r.id===selectedId)) { editSelect.value=selectedId; showRecord(selectedId); }
    window.LucyAdminCRM = { ...(window.LucyAdminCRM || {}), records, categories, reload: reloadAll };
  }
  function showRecord(id) {
    const r = records.find(item=>item.id===id);
    if (!r) { editForm.hidden=true; return; }
    editForm.hidden=false; editTitle.value=r.title||''; editAge.value=r.age??''; editAgeLabel.value=r.age_label||'';
    fillCategorySelect(editCategory,r.category||''); editSubject.value=r.subject||''; editTags.value=r.tags||''; editDescription.value=r.description||'';
    editPhoto.value=''; editPreview.src=r.image_data || staticImages[r.id] || ''; editPreview.hidden=!editPreview.src; editIdLabel.textContent=`ID: ${r.id}`; setStatus(editStatus,'');
  }
  function compressImage(file) {
    return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onerror=()=>reject(new Error('Could not read that image.')); reader.onload=()=>{ const image=new Image(); image.onerror=()=>reject(new Error('That image could not be opened.')); image.onload=()=>{ const max=1600,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(image.naturalHeight*scale)); const ctx=canvas.getContext('2d',{alpha:false}); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL('image/webp',.82)); }; image.src=reader.result; }; reader.readAsDataURL(file); });
  }
  async function reloadAll(selectedId='') { await Promise.all([loadCategories(),loadArtworks(selectedId)]); }

  categoryForm?.addEventListener('submit', async e => {
    e.preventDefault(); const name=newCategoryName.value.trim(); if (!name) return;
    setStatus(categoryStatus,'Adding category…');
    try { await rpc('admin_add_category',{admin_password:password(),category_name:name}); newCategoryName.value=''; await loadCategories(); setStatus(categoryStatus,'Category added.','success'); }
    catch(err){ setStatus(categoryStatus,err.message,'error'); }
  });
  editSelect?.addEventListener('change',()=>showRecord(editSelect.value));
  editPhoto?.addEventListener('change',()=>{ const file=editPhoto.files?.[0]; if (!file) return; const url=URL.createObjectURL(file); editPreview.src=url; editPreview.hidden=false; editPreview.onload=()=>URL.revokeObjectURL(url); });
  editForm?.addEventListener('submit', async e => {
    e.preventDefault(); const id=editSelect.value; if (!id) return;
    editSubmit.disabled=true; setStatus(editStatus,'Saving changes…');
    try {
      let imageData=null; const file=editPhoto.files?.[0]; if (file) { imageData=await compressImage(file); if (imageData.length>2700000) throw new Error('That image is still too large after compression.'); }
      await rpc('admin_update_artwork',{admin_password:password(),artwork_id:id,artwork_title:editTitle.value.trim(),artwork_age:Number(editAge.value),artwork_age_label:editAgeLabel.value.trim(),artwork_category:editCategory.value,artwork_subject:editSubject.value.trim(),artwork_tags:editTags.value.trim(),artwork_description:editDescription.value.trim(),artwork_image_data:imageData});
      await reloadAll(id); setStatus(editStatus,'Saved. The public gallery will use these details now. ✨','success');
    } catch(err){ console.error(err); setStatus(editStatus,err.message || 'Could not save artwork.','error'); }
    finally { editSubmit.disabled=false; }
  });

  async function start() {
    if (!password()) return;
    try { await reloadAll(); } catch(err) { console.error('CRM load failed',err); }
  }
  const observer = new MutationObserver(()=>{ if (document.querySelector('#commentsPanel') && !document.querySelector('#commentsPanel').hidden && password()) { observer.disconnect(); start(); } });
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('lucy-admin-reload',()=>reloadAll().catch(console.error));
  if (!document.querySelector('#commentsPanel')?.hidden && password()) start();
})();