const assetDataFiles = {
  eeveely: '/assets-data/eeveely.b64',
  'red-kite-emily': '/assets-data/red-kite-emily.b64',
  'chloe-red': '/assets-data/chloe-and-red.b64',
  red: '/assets-data/red.b64',
  'london-bridge': '/assets-data/london-bridge.b64',
  'mummy-and-me': '/assets-data/mummy-and-me.b64',
  'my-fairy-ruby': '/assets-data/my-fairy-ruby.b64',
  'pikachu-ex': '/assets-data/pikachu-ex.b64',
  'queen-elizabeth': '/assets-data/queen-elizabeth.b64'
};
const assetUrls = {};

const artworks = {
  'chloe-red': { title: 'Chloe & Red', category: 'Descendants', tags: 'descendants colouring', age: 7, image: '/assets/chloe-and-red.webp', alt: 'A coloured-in picture of Chloe and Red by Lucy', description: 'Lucy likes using the movie to help decide which colours and backgrounds belong in the picture.' },
  red: { title: 'Red', category: 'Descendants', tags: 'descendants colouring', age: 7, image: '/assets/red.webp', alt: 'A coloured-in picture of Red by Lucy', description: "Careful colouring, hearts and lots of small details inspired by one of Lucy's favourite things to watch." },
  'london-bridge': { title: 'London Bridge', category: 'Places', tags: 'places drawing', age: 6, image: '/assets/london-bridge.webp', alt: 'A pencil drawing of London Bridge by Lucy', description: 'A pencil drawing of London Bridge, filling the page with towers, sky and lots of little details.' },
  'mummy-and-me': { title: 'Mummy and Me', category: 'Colouring', tags: 'colouring people', age: 6, image: '/assets/mummy-and-me.webp', alt: 'A coloured-in picture titled Mummy and Me by Lucy', description: 'A bright picture of two girls together, with hearts, stars and lots of careful colouring.' },
  'my-fairy-ruby': { title: 'My Fairy Ruby', category: 'Fantasy', tags: 'fantasy drawing', age: 6, image: '/assets/my-fairy-ruby.webp', alt: 'My Fairy Ruby artwork by Lucy', description: "Lucy's fairy Ruby, surrounded by the things that make her little fairy world special." },
  'pikachu-ex': { title: 'Pikachu Ex', category: 'Pokémon inspired', tags: 'pokemon colouring', age: 6, image: '/assets/pikachu-ex.webp', alt: 'Pikachu Ex artwork by Lucy', description: "Lucy's colourful Pikachu-inspired character with bright ears and a lightning-bolt tail." },
  'queen-elizabeth': { title: 'Queen Elizabeth', category: 'Portraits', tags: 'portraits drawing people', age: 6, image: '/assets/queen-elizabeth.webp', alt: 'A pencil portrait titled Queen Elizabeth by Lucy', description: 'A pencil portrait with curls, patterned clothing and lots of hand-drawn detail.' },
  eeveely: { title: 'Eeveely', category: 'Pokémon inspired', tags: 'pokemon colouring', age: 6, image: '/assets/eeveely.webp', alt: 'Eeveely artwork by Lucy', description: "Lucy's favourite picture. It won 2nd place in a Pokémon drawing competition.", award: '2nd place 🏆' },
  'red-kite-emily': { title: 'Red Kite Emily', category: 'Animals', tags: 'animals drawing', age: 6, image: '/assets/red-kite-emily.webp', alt: 'A brown red kite bird in flight, drawn by Lucy', description: "A flying red kite with big wings, tiny details and Lucy's own name for the bird." }
};
const galleryOrder = ['chloe-red', 'red', 'london-bridge', 'mummy-and-me', 'my-fairy-ruby', 'pikachu-ex', 'queen-elizabeth', 'eeveely', 'red-kite-emily'];

function cardMarkup(id) {
  const art = artworks[id];
  return `<article class="art-card" data-category="${art.tags}" data-id="${id}" data-age="${art.age}">
    <button class="art-image-button" type="button" aria-label="Open ${art.title} artwork">
      ${art.award ? `<span class="award-chip">${art.award}</span>` : ''}
      <img src="${art.image}" alt="${art.alt}" loading="lazy" />
    </button>
    <div class="art-meta">
      <div><div class="art-tag-line"><span>${art.category}</span><span class="art-age">Age ${art.age}</span></div><h3>${art.title}</h3></div>
      <div class="like-control"><button class="heart-button" type="button" data-art="${id}" aria-label="Like ${art.title}">♡</button><span class="like-count" data-like-count="${id}">0 likes</span></div>
    </div>
    <p>${art.description}</p>
  </article>`;
}

function buildGallery() {
  const grid = document.querySelector('#artGrid');
  if (!grid) return;
  grid.innerHTML = galleryOrder.map(cardMarkup).join('');

  const filterRow = document.querySelector('.filter-row');
  if (filterRow) {
    const extras = [
      ['places', 'Places'], ['fantasy', 'Fantasy'], ['portraits', 'Portraits']
    ];
    extras.forEach(([filter, label]) => {
      if (filterRow.querySelector(`[data-filter="${filter}"]`)) return;
      const button = document.createElement('button');
      button.className = 'filter-chip';
      button.dataset.filter = filter;
      button.type = 'button';
      button.textContent = label;
      filterRow.appendChild(button);
    });
  }

  const heading = document.querySelector('.gallery-section .section-heading');
  if (heading && !document.querySelector('#ageFilter')) {
    const panel = document.createElement('div');
    panel.className = 'age-filter';
    panel.id = 'ageFilter';
    panel.innerHTML = `<div class="age-filter-topline"><div><span class="age-filter-kicker">Lucy's age when she made it</span><strong id="ageRangeLabel">Age 2 to 7</strong></div><button class="age-reset" id="resetAgeFilter" type="button">Show every age</button></div>
      <div class="age-range-controls">
        <label><span>From <strong id="ageFromValue">2</strong></span><input id="ageFrom" type="range" min="2" max="7" value="2" step="1" aria-label="Minimum age" /></label>
        <label><span>To <strong id="ageToValue">7</strong></span><input id="ageTo" type="range" min="2" max="7" value="7" step="1" aria-label="Maximum age" /></label>
      </div>
      <div class="age-tick-strip" aria-hidden="true"><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span></div>`;
    heading.insertAdjacentElement('afterend', panel);
    grid.insertAdjacentHTML('beforebegin', '<p class="gallery-empty hidden" id="galleryEmpty">No pictures in that age range yet. Try widening the range ✨</p>');
  }

  const featured = document.querySelector('.featured-caption > div:first-child');
  if (featured && !featured.querySelector('.featured-age')) featured.insertAdjacentHTML('beforeend', '<span class="featured-age">Made at age 6</span>');
}

buildGallery();

async function loadArtworkAssets() {
  await Promise.all(Object.entries(assetDataFiles).map(async ([id, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${id}`);
    const base64 = (await response.text()).trim();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    assetUrls[id] = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
  }));
  document.querySelectorAll('.art-card img').forEach(img => {
    const id = img.closest('.art-card')?.dataset.id;
    if (id && assetUrls[id]) img.src = assetUrls[id];
  });
  const featured = document.querySelector('.featured-frame img');
  if (featured && assetUrls.eeveely) featured.src = assetUrls.eeveely;
  const swapImage = document.querySelector('#swapImage');
  if (swapImage && assetUrls['red-kite-emily']) swapImage.src = assetUrls['red-kite-emily'];
}
loadArtworkAssets().catch(error => console.error('Artwork loading error:', error));

const modal = document.querySelector('#artModal');
const modalImage = document.querySelector('#modalImage');
const modalTitle = document.querySelector('#modalTitle');
const modalCategory = document.querySelector('#modalCategory');
const modalDescription = document.querySelector('#modalDescription');
const soundToggle = document.querySelector('.sound-toggle');
let soundsOn = false;
let audioCtx;

function playChime(freq = 660) {
  if (!soundsOn) return;
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  const startChime = () => {
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(freq * 1.22, audioCtx.currentTime + .16);
    gain.gain.setValueAtTime(.0001, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.09, audioCtx.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .28);
    osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + .3);
  };
  if (audioCtx.state === 'suspended') audioCtx.resume().then(startChime).catch(() => {}); else startChime();
}
soundToggle?.addEventListener('click', () => { const on = !soundsOn; if (!on) playChime(520); soundsOn = on; soundToggle.setAttribute('aria-pressed', String(on)); soundToggle.innerHTML = `<span aria-hidden="true">♫</span> Sounds ${on ? 'on' : 'off'}`; if (on) playChime(720); });
document.addEventListener('click', event => { const control = event.target.closest('button, a'); if (control && control !== soundToggle) playChime(620 + Math.random() * 140); }, true);

const savedHearts = new Set(JSON.parse(localStorage.getItem('lucy-art-hearts') || '[]'));
function refreshHearts() { document.querySelectorAll('.heart-button').forEach(button => { const loved = savedHearts.has(button.dataset.art); button.classList.toggle('loved', loved); button.textContent = loved ? '♥' : '♡'; button.setAttribute('aria-pressed', String(loved)); }); }
refreshHearts();
document.querySelectorAll('.heart-button').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); const id = button.dataset.art; savedHearts.has(id) ? savedHearts.delete(id) : savedHearts.add(id); localStorage.setItem('lucy-art-hearts', JSON.stringify([...savedHearts])); refreshHearts(); }));

function openArtwork(id) { const art = artworks[id]; if (!art) return; modalImage.src = assetUrls[id] || art.image; modalImage.alt = art.alt; modalTitle.textContent = art.title; modalCategory.textContent = `${art.category} · Age ${art.age}`; modalDescription.textContent = art.description; modal.showModal(); }
document.querySelectorAll('.art-card .art-image-button').forEach(button => button.addEventListener('click', () => openArtwork(button.closest('.art-card').dataset.id)));
document.querySelector('#modalClose')?.addEventListener('click', () => modal.close());
modal?.addEventListener('click', event => { const rect = modal.getBoundingClientRect(); if (!(event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom)) modal.close(); });

function randomArtwork() { const visibleCards = [...document.querySelectorAll('.art-card:not(.hidden)')]; if (visibleCards.length) openArtwork(visibleCards[Math.floor(Math.random() * visibleCards.length)].dataset.id); }
document.querySelector('#randomGallery')?.addEventListener('click', randomArtwork); document.querySelector('#randomHero')?.addEventListener('click', randomArtwork);

let activeCategory = 'all';
const ageFrom = document.querySelector('#ageFrom'); const ageTo = document.querySelector('#ageTo');
function applyGalleryFilters() {
  const min = Number(ageFrom?.value || 2); const max = Number(ageTo?.value || 7); let visible = 0;
  document.querySelectorAll('.art-card').forEach(card => { const age = Number(card.dataset.age); const categoryMatch = activeCategory === 'all' || card.dataset.category.includes(activeCategory); const ageMatch = age >= min && age <= max; const show = categoryMatch && ageMatch; card.classList.toggle('hidden', !show); if (show) visible += 1; });
  document.querySelector('#galleryEmpty')?.classList.toggle('hidden', visible > 0);
  const label = document.querySelector('#ageRangeLabel'); if (label) label.textContent = min === max ? `Age ${min}` : `Age ${min} to ${max}`;
  const fromValue = document.querySelector('#ageFromValue'); const toValue = document.querySelector('#ageToValue'); if (fromValue) fromValue.textContent = min; if (toValue) toValue.textContent = max;
}
document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => { document.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active')); chip.classList.add('active'); activeCategory = chip.dataset.filter; applyGalleryFilters(); }));
ageFrom?.addEventListener('input', () => { if (Number(ageFrom.value) > Number(ageTo.value)) ageTo.value = ageFrom.value; applyGalleryFilters(); });
ageTo?.addEventListener('input', () => { if (Number(ageTo.value) < Number(ageFrom.value)) ageFrom.value = ageTo.value; applyGalleryFilters(); });
document.querySelector('#resetAgeFilter')?.addEventListener('click', () => { ageFrom.value = '2'; ageTo.value = '7'; applyGalleryFilters(); });
applyGalleryFilters();

const swapChoices = galleryOrder;
let swapIndex = galleryOrder.indexOf('red-kite-emily');
const swapFrame = document.querySelector('.swap-frame'); const swapImage = document.querySelector('#swapImage'); const swapLabel = document.querySelector('#swapLabel');
document.querySelector('#swapArt')?.addEventListener('click', () => { swapIndex = (swapIndex + 1) % swapChoices.length; const id = swapChoices[swapIndex]; const art = artworks[id]; swapFrame.classList.add('is-swapping'); window.setTimeout(() => { swapImage.src = assetUrls[id] || art.image; swapImage.alt = art.alt; swapLabel.textContent = `${art.title} · Age ${art.age}`; swapFrame.classList.remove('is-swapping'); }, 210); });

const runawayZone = document.querySelector('#runawayZone'); const runawayButton = document.querySelector('#runawayButton'); let runawayCount = 0;
function moveRunaway() { if (window.matchMedia('(hover: none)').matches) return; runawayCount += 1; const zone = runawayZone.getBoundingClientRect(); const button = runawayButton.getBoundingClientRect(); const maxX = Math.max(10, zone.width - button.width - 20); const maxY = Math.max(10, zone.height - button.height - 20); runawayButton.style.left = `${10 + Math.random() * maxX}px`; runawayButton.style.top = `${10 + Math.random() * maxY}px`; runawayButton.style.transform = 'none'; if (runawayCount > 5) runawayButton.textContent = 'Too slow! ✨'; }
runawayButton?.addEventListener('pointerenter', moveRunaway); runawayButton?.addEventListener('click', () => { runawayButton.textContent = 'You caught me! 🏆'; confetti(runawayButton.getBoundingClientRect().left + 50, runawayButton.getBoundingClientRect().top); });

function confetti(x = window.innerWidth / 2, y = 120) { const symbols = ['♥', '✦', '●', '★', '♛']; for (let i = 0; i < 28; i += 1) { const piece = document.createElement('span'); piece.className = 'confetti-piece'; piece.textContent = symbols[Math.floor(Math.random() * symbols.length)]; piece.style.left = `${x + (Math.random() - .5) * 240}px`; piece.style.top = `${y + (Math.random() - .5) * 50}px`; piece.style.color = ['#ff72bf', '#4d8fff', '#ffd95e', '#7c5ce5'][Math.floor(Math.random() * 4)]; piece.style.animationDelay = `${Math.random() * .18}s`; document.body.appendChild(piece); window.setTimeout(() => piece.remove(), 1600); } }
window.confetti = confetti;
document.querySelector('#confettiButton')?.addEventListener('click', event => { const rect = event.currentTarget.getBoundingClientRect(); confetti(rect.left + rect.width / 2, rect.top); });

let sparkleThrottle = 0;
document.addEventListener('pointermove', event => { if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return; const now = performance.now(); if (now - sparkleThrottle < 38) return; sparkleThrottle = now; const sparkle = document.createElement('span'); sparkle.className = 'sparkle'; sparkle.textContent = Math.random() > .45 ? '✦' : '♥'; sparkle.style.left = `${event.clientX + (Math.random() * 10 - 5)}px`; sparkle.style.top = `${event.clientY + (Math.random() * 10 - 5)}px`; sparkle.style.color = ['#ff72bf', '#4d8fff', '#ffd95e', '#7c5ce5'][Math.floor(Math.random() * 4)]; document.body.appendChild(sparkle); window.setTimeout(() => sparkle.remove(), 760); });
