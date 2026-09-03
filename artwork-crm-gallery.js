(() => {
  const SUPABASE_URL='https://wcpmshpvpiogecjupdcn.supabase.co';
  const SUPABASE_KEY='sb_publishable_b6bd349iOBoNhDTfaOxAMA_5Z7Yoqlw';
  const coreIds=new Set(['alice-in-wonderland','lucy-as-belle','chloe-red','red','autumn-and-winter','glinda','london-bridge','mummy-and-me','my-fairy-ruby','pikachu-ex','queen-elizabeth','eeveely','red-kite-emily','my-first-picture']);
  const visitorKey='lucy-art-visitor-id';
  let visitorId=localStorage.getItem(visitorKey);
  if(!visitorId){visitorId=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem(visitorKey,visitorId);}
  const sbFetch=(path,options={})=>fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,...options.headers}});
  const slug=(v='')=>v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const style=document.createElement('style');style.textContent='.art-card .art-subject{margin:-2px 0 8px;font-size:.82rem;font-weight:800;opacity:.68}.art-modal #modalCategory{line-height:1.5}';document.head.appendChild(style);

  function ensureFilter(category){
    if(!category)return;const key=slug(category),row=document.querySelector('.filter-row');if(!row||!key||row.querySelector(`[data-filter="${key}"]`))return;
    const b=document.createElement('button');b.className='filter-chip';b.dataset.filter=key;b.type='button';b.textContent=category;
    b.addEventListener('click',()=>{document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(typeof activeCategory!=='undefined')activeCategory=key;if(typeof applyGalleryFilters==='function')applyGalleryFilters();});row.appendChild(b);
  }
  function subjectNode(card,subject){let n=card?.querySelector('.art-subject');if(!n&&card){n=document.createElement('p');n.className='art-subject';card.querySelector('.art-meta')?.insertAdjacentElement('afterend',n);}if(n){n.textContent=subject?`Subject: ${subject}`:'';n.hidden=!subject;}}
  async function refreshLike(id){const r=await sbFetch(`art_likes?select=artwork_id&artwork_id=eq.${encodeURIComponent(id)}`);if(!r.ok)return;const c=(await r.json()).length;document.querySelectorAll(`[data-like-count="${id}"]`).forEach(n=>n.textContent=`${c} ${c===1?'like':'likes'}`);}
  function bindNewCard(id){
    const card=document.querySelector(`.art-card[data-id="${id}"]`);if(!card)return;
    card.querySelector('.art-image-button')?.addEventListener('click',()=>{openArtwork(id);const a=artworks[id];if(modalCategory)modalCategory.textContent=`${a.category}${a.subject?` · Subject: ${a.subject}`:''} · ${a.ageLabel||`Age ${a.age}`}`;const h=document.querySelector('#commentArtwork');if(h)h.value=id;refreshLike(id);});
    card.querySelector('.heart-button')?.addEventListener('click',async e=>{e.stopPropagation();const was=savedHearts.has(id);was?savedHearts.delete(id):savedHearts.add(id);localStorage.setItem('lucy-art-hearts',JSON.stringify([...savedHearts]));refreshHearts();try{const r=!was?await sbFetch('art_likes',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({artwork_id:id,visitor_id:visitorId})}):await sbFetch(`art_likes?artwork_id=eq.${encodeURIComponent(id)}&visitor_id=eq.${encodeURIComponent(visitorId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});if(!r.ok)throw new Error('Could not save like');await refreshLike(id);}catch(err){console.error(err);was?savedHearts.add(id):savedHearts.delete(id);localStorage.setItem('lucy-art-hearts',JSON.stringify([...savedHearts]));refreshHearts();}});
    refreshLike(id);
  }
  function updateCard(row){
    const card=document.querySelector(`.art-card[data-id="${row.id}"]`);if(!card)return;
    card.dataset.category=`${row.tags||''} ${slug(row.category||'')} ${slug(row.subject||'')}`.trim();card.dataset.age=String(Number(row.age));
    const title=card.querySelector('h3');if(title)title.textContent=row.title;
    const cat=card.querySelector('.art-tag-line span:first-child')||card.querySelector('.art-meta > div > span');if(cat)cat.textContent=row.category||'Lucy’s art';
    const age=card.querySelector('.art-age');if(age)age.textContent=row.age_label||`Age ${Number(row.age)}`;
    const desc=[...card.children].find(el=>el.tagName==='P'&&!el.classList.contains('art-subject'));if(desc)desc.textContent=row.description||'';
    const img=card.querySelector('img');if(img&&row.image_data)img.src=row.image_data;
    subjectNode(card,row.subject||'');ensureFilter(row.category||'');
  }
  function sortGalleryByAge(rows){
    const grid=document.querySelector('#artGrid');if(!grid)return;
    const createdAt=new Map(rows.map(row=>[row.id,row.created_at||'']));
    const currentOrder=new Map([...grid.querySelectorAll('.art-card')].map((card,index)=>[card.dataset.id,index]));
    const cards=[...grid.querySelectorAll('.art-card')];
    cards.sort((a,b)=>{
      const ageA=Number(a.dataset.age);const ageB=Number(b.dataset.age);
      const ageDiff=(Number.isFinite(ageB)?ageB:0)-(Number.isFinite(ageA)?ageA:0);
      if(ageDiff!==0)return ageDiff;
      const createdA=createdAt.get(a.dataset.id)||'';const createdB=createdAt.get(b.dataset.id)||'';
      if(createdA&&createdB&&createdA!==createdB)return createdB.localeCompare(createdA);
      return (currentOrder.get(a.dataset.id)??0)-(currentOrder.get(b.dataset.id)??0);
    });
    cards.forEach(card=>grid.appendChild(card));
    if(typeof galleryOrder!=='undefined')galleryOrder.splice(0,galleryOrder.length,...cards.map(card=>card.dataset.id));
  }
  async function load(){
    const r=await sbFetch('artworks?select=id,title,age,age_label,category,subject,tags,description,image_data,created_at&published=eq.true&order=age.desc,created_at.desc');if(!r.ok)throw new Error('Could not load artwork CRM data');
    const rows=await r.json(),grid=document.querySelector('#artGrid');if(!grid)return;
    rows.forEach(row=>{
      const existed=Boolean(artworks[row.id]);
      if(existed){Object.assign(artworks[row.id],{title:row.title,category:row.category||artworks[row.id].category,tags:`${row.tags||''} ${slug(row.category||'')} ${slug(row.subject||'')}`.trim(),age:Number(row.age),ageLabel:row.age_label||'',subject:row.subject||'',description:row.description||artworks[row.id].description});if(row.image_data)artworks[row.id].image=row.image_data;}
      else{artworks[row.id]={title:row.title,category:row.category||'Lucy’s art',tags:`${row.tags||''} ${slug(row.category||'')} ${slug(row.subject||'')}`.trim(),age:Number(row.age),ageLabel:row.age_label||'',subject:row.subject||'',image:row.image_data,alt:`${row.title} artwork by Lucy`,description:row.description||''};galleryOrder.push(row.id);grid.insertAdjacentHTML('beforeend',cardMarkup(row.id));const img=grid.querySelector(`.art-card[data-id="${row.id}"] img`);if(img&&row.image_data)img.src=row.image_data;bindNewCard(row.id);}
      updateCard(row);
    });
    sortGalleryByAge(rows);
    refreshHearts();if(typeof applyGalleryFilters==='function')applyGalleryFilters();
  }

  const commentForm=document.querySelector('#commentForm');
  commentForm?.addEventListener('submit',async event=>{
    const id=document.querySelector('#commentArtwork')?.value||'';if(!id||coreIds.has(id)||!artworks[id])return;
    event.preventDefault();event.stopImmediatePropagation();const fd=new FormData(commentForm),name=String(fd.get('name')||'').trim().slice(0,40),comment=String(fd.get('comment')||'').trim().slice(0,500),website=String(fd.get('website')||'').trim(),status=document.querySelector('#commentStatus'),submit=document.querySelector('#commentSubmit'),text=document.querySelector('#commentText');if(!name||!comment)return;if(website){if(status)status.textContent='Sent! Thank you for leaving Lucy a lovely note. 💛';return;}
    submit.disabled=true;if(status){status.textContent='Sending your note to Dad’s private review panel…';status.className='comment-status';}
    try{const r=await sbFetch('art_comments',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({artwork_id:id,visitor_name:name,comment})});if(!r.ok)throw new Error('Could not send comment');if(status){status.textContent='Sent! Thank you for leaving Lucy a lovely note. 💛';status.className='comment-status success';}if(text)text.value='';}
    catch(err){console.error(err);if(status){status.textContent='That did not send. Please try again in a moment.';status.className='comment-status error';}}finally{submit.disabled=false;}
  },true);

  load().catch(err=>console.error('Artwork CRM loading error:',err));
})();