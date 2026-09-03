(() => {
  const SUPABASE_URL = 'https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const visitorKey = 'lucy-art-visitor-id';
  let visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) { visitorId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem(visitorKey, visitorId); }

  function sbFetch(path, options = {}) { return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,...options.headers} }); }
  function displayAge(row) { if (row.age_label) return row.age_label; const value=Number(row.age); return `Age ${Number.isInteger(value)?value:value}`; }
  function slug(value='') { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function ensureSubject(card, subject) {
    if (!card) return;
    let node=card.querySelector('.art-subject');
    if (!node) { node=document.createElement('p'); node.className='art-subject'; const meta=card.querySelector('.art-meta'); meta?.insertAdjacentElement('afterend',node); }
    node.textContent = subject ? `Subject: ${subject}` : '';
    node.hidden = !subject;
  }
  function ensureCategoryFilter(category) {
    if (!category) return;
    const filter=slug(category); const row=document.querySelector('.filter-row'); if (!row || !filter || row.querySelector(`[data-filter="${filter}"]`)) return;
    const button=document.createElement('button'); button.className='filter-chip'; button.dataset.filter=filter; button.type='button'; button.textContent=category;
    button.addEventListener('click',()=>{ document.querySelectorAll('.filter-chip').forEach(i=>i.classList.remove('active')); button.classList.add('active'); if (typeof activeCategory!=='undefined') activeCategory=filter; if (typeof applyGalleryFilters==='function') applyGalleryFilters(); });
    row.appendChild(button);
  }
  async function refreshLikeCount(id) {
    const response=await sbFetch(`art_likes?select=artwork_id&artwork_id=eq.${encodeURIComponent(id)}`); if (!response.ok) return;
    const rows=await response.json(),count=rows.length;
    document.querySelectorAll(`[data-like-count="${id}"]`).forEach(node=>{node.textContent=`${count} ${count===1?'like':'likes'}`;});
    const modalTitle=document.querySelector('#modalTitle')?.textContent; if (modalTitle===artworks[id]?.title) { const n=document.querySelector('#modalLikeCount'),w=document.querySelector('#modalLikeWord'); if(n)n.textContent=String(count); if(w)w.textContent=count===1?'like':'likes'; }
  }
  function bindCard(id) {
    const card=document.querySelector(`.art-card[data-id="${id}"]`); if(!card || card.dataset.uploadBound==='true') return; card.dataset.uploadBound='true';
    card.querySelector('.art-image-button')?.addEventListener('click',()=>{ openArtwork(id); const art=artworks[id]; if(modalCategory) modalCategory.textContent=`${art.category}${art.subject?` · Subject: ${art.subject}`:''} · ${art.ageLabel || `Age ${art.age}`}`; const hidden=document.querySelector('#commentArtwork'); if(hidden)hidden.value=id; refreshLikeCount(id); });
    card.querySelector('.heart-button')?.addEventListener('click',async event=>{ event.stopPropagation(); const wasLoved=savedHearts.has(id); wasLoved?savedHearts.delete(id):savedHearts.add(id); localStorage.setItem('lucy-art-hearts',JSON.stringify([...savedHearts])); refreshHearts();
      try { let response; if(!wasLoved) response=await sbFetch('art_likes',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({artwork_id:id,visitor_id:visitorId})}); else response=await sbFetch(`art_likes?artwork_id=eq.${encodeURIComponent(id)}&visitor_id=eq.${encodeURIComponent(visitorId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}); if(!response.ok)throw new Error('Could not save like'); await refreshLikeCount(id); }
      catch(error){ console.error(error); wasLoved?savedHearts.add(id):savedHearts.delete(id); localStorage.setItem('lucy-art-hearts',JSON.stringify([...savedHearts])); refreshHearts(); }
    });
    refreshLikeCount(id);
  }
  function applyRowToCard(row) {
    const art=artworks[row.id]; const card=document.querySelector(`.art-card[data-id="${row.id}"]`); if(!art || !card) return;
    card.dataset.category = `${row.tags || ''} ${slug(row.category || '')} ${slug(row.subject || '')}`.trim(); card.dataset.age=String(Number(row.age));
    const title=card.querySelector('h3'); if(title)title.textContent=row.title;
    const cat=card.querySelector('.art-tag-line span:first-child') || card.querySelector('.art-meta > div > span'); if(cat)cat.textContent=row.category || 'Lucy’s art';
    const age=card.querySelector('.art-age'); if(age)age.textContent=row.age_label || `Age ${Number(row.age)}`;
    const desc=card.querySelector(':scope > p:not(.art-subject)'); if(desc)desc.textContent=row.description || '';
    const img=card.querySelector('img'); if(img && row.image_data) img.src=row.image_data;
    const button=card.querySelector('.art-image-button'); if(button)button.setAttribute('aria-label',`Open ${row.title} artwork`);
    const heart=card.querySelector('.heart-button'); if(heart)heart.setAttribute('aria-label',`Like ${row.title}`);
    ensureSubject(card,row.subject || ''); ensureCategoryFilter(row.category || '');
  }
  function sortGalleryByAge(rows) {
    const grid=document.querySelector('#artGrid');
    if(!grid) return;
    const createdAtById=new Map(rows.map(row=>[row.id, row.created_at || '']));
    const originalIndex=new Map([...grid.querySelectorAll('.art-card')].map((card,index)=>[card.dataset.id,index]));
    const cards=[...grid.querySelectorAll('.art-card')];
    cards.sort((a,b)=>{
      const ageDiff=(Number(b.dataset.age)||0)-(Number(a.dataset.age)||0);
      if(ageDiff!==0) return ageDiff;
      const aCreated=createdAtById.get(a.dataset.id) || '';
      const bCreated=createdAtById.get(b.dataset.id) || '';
      if(aCreated && bCreated && aCreated!==bCreated) return bCreated.localeCompare(aCreated);
      return (originalIndex.get(a.dataset.id)||0)-(originalIndex.get(b.dataset.id)||0);
    });
    cards.forEach(card=>grid.appendChild(card));
    if(typeof galleryOrder!=='undefined') galleryOrder.splice(0,galleryOrder.length,...cards.map(card=>card.dataset.id));
  }
  async function loadArtworkRecords() {
    const response=await sbFetch('artworks?select=id,title,age,age_label,category,subject,tags,description,image_data,created_at,updated_at&published=eq.true');
    if(!response.ok)throw new Error('Could not load artwork records'); const rows=await response.json(); const grid=document.querySelector('#artGrid'); if(!grid)return;
    rows.forEach(row=>{
      const existed=Boolean(artworks[row.id]);
      if(existed) {
        Object.assign(artworks[row.id],{title:row.title,category:row.category||artworks[row.id].category,tags:`${row.tags||''} ${slug(row.category||'')} ${slug(row.subject||'')}`.trim(),age:Number(row.age),ageLabel:row.age_label||'',subject:row.subject||'',description:row.description||artworks[row.id].description});
        if(row.image_data) artworks[row.id].image=row.image_data;
      } else {
        artworks[row.id]={title:row.title,category:row.category||'Lucy’s art',tags:`${row.tags||''} ${slug(row.category||'')} ${slug(row.subject||'')}`.trim(),age:Number(row.age),ageLabel:row.age_label||'',subject:row.subject||'',image:row.image_data,alt:`${row.title} artwork by Lucy`,description:row.description||`${row.title}, made by Lucy ${displayAge(row).toLowerCase()}.`};
        galleryOrder.unshift(row.id); grid.insertAdjacentHTML('afterbegin',cardMarkup(row.id)); const card=grid.querySelector(`.art-card[data-id="${row.id}"]`); const img=card?.querySelector('img'); if(img && row.image_data)img.src=row.image_data;
      }
      applyRowToCard(row); bindCard(row.id);
    });
    sortGalleryByAge(rows);
    refreshHearts(); if(typeof applyGalleryFilters==='function')applyGalleryFilters();
  }

  const commentForm=document.querySelector('#commentForm');
  commentForm?.addEventListener('submit',async event=>{ const artworkId=document.querySelector('#commentArtwork')?.value||''; if(!artworkId || !artworks[artworkId])return; if(!artworks[artworkId].image?.startsWith('data:image/'))return;
    event.preventDefault(); event.stopImmediatePropagation(); const fd=new FormData(commentForm),name=String(fd.get('name')||'').trim().slice(0,40),comment=String(fd.get('comment')||'').trim().slice(0,500),website=String(fd.get('website')||'').trim(),status=document.querySelector('#commentStatus'),submit=document.querySelector('#commentSubmit'),text=document.querySelector('#commentText'); if(!name||!comment)return; if(website){if(status)status.textContent='Sent! Thank you for leaving Lucy a lovely note. 💛';return;}
    submit.disabled=true; if(status){status.textContent='Sending your note to Dad’s private review panel…';status.className='comment-status';}
    try{const response=await sbFetch('art_comments',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({artwork_id:artworkId,visitor_name:name,comment})});if(!response.ok)throw new Error('Could not send comment');if(status){status.textContent='Sent! Thank you for leaving Lucy a lovely note. 💛';status.className='comment-status success';}if(text)text.value='';if(typeof window.confetti==='function'){const rect=submit.getBoundingClientRect();window.confetti(rect.left+rect.width/2,rect.top);}}
    catch(error){console.error(error);if(status){status.textContent='That did not send. Please try again in a moment.';status.className='comment-status error';}}finally{submit.disabled=false;}
  },true);

  loadArtworkRecords().catch(error=>console.error('Artwork CRM loading error:',error));
})();