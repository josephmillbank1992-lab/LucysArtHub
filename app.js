const artworks = {
  eeveely: {
    title: 'Eeveely',
    category: 'Pokémon inspired',
    image: '/assets/eeveely.webp',
    alt: 'Eeveely artwork by Lucy',
    description: "Lucy's favourite picture. It won 2nd place in a Pokémon drawing competition."
  },
  'red-kite-emily': {
    title: 'Red Kite Emily',
    category: 'Animals',
    image: '/assets/red-kite-emily.webp',
    alt: 'A brown red kite bird in flight, drawn by Lucy',
    description: "A flying red kite with big wings, tiny details and Lucy's own name for the bird."
  },
  'chloe-red': {
    title: 'Chloe & Red',
    category: 'Descendants',
    image: '/assets/chloe-and-red.webp',
    alt: 'A coloured-in picture of Chloe and Red by Lucy',
    description: 'Lucy likes using the movie to help decide which colours and backgrounds belong in the picture.'
  },
  red: {
    title: 'Red',
    category: 'Descendants',
    image: '/assets/red.webp',
    alt: 'A coloured-in picture of Red by Lucy',
    description: "Careful colouring, hearts and lots of small details inspired by one of Lucy's favourite things to watch."
  }
};

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
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.22, audioCtx.currentTime + .16);
  gain.gain.setValueAtTime(.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.09, audioCtx.currentTime + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .28);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + .3);
}

soundToggle?.addEventListener('click', () => {
  soundsOn = !soundsOn;
  soundToggle.setAttribute('aria-pressed', String(soundsOn));
  soundToggle.innerHTML = `<span aria-hidden="true">♫</span> Sounds ${soundsOn ? 'on' : 'off'}`;
  if (soundsOn) playChime(720);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('button, a')) playChime(620 + Math.random() * 140);
});

const savedHearts = new Set(JSON.parse(localStorage.getItem('lucy-art-hearts') || '[]'));
function refreshHearts() {
  document.querySelectorAll('.heart-button').forEach(button => {
    const loved = savedHearts.has(button.dataset.art);
    button.classList.toggle('loved', loved);
    button.textContent = loved ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(loved));
  });
}
refreshHearts();

document.querySelectorAll('.heart-button').forEach(button => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const id = button.dataset.art;
    savedHearts.has(id) ? savedHearts.delete(id) : savedHearts.add(id);
    localStorage.setItem('lucy-art-hearts', JSON.stringify([...savedHearts]));
    refreshHearts();
  });
});

function openArtwork(id) {
  const art = artworks[id];
  if (!art) return;
  modalImage.src = art.image;
  modalImage.alt = art.alt;
  modalTitle.textContent = art.title;
  modalCategory.textContent = art.category;
  modalDescription.textContent = art.description;
  modal.showModal();
}

document.querySelectorAll('.art-card').forEach(card => {
  card.querySelector('.art-image-button').addEventListener('click', () => openArtwork(card.dataset.id));
});

document.querySelector('#modalClose')?.addEventListener('click', () => modal.close());
modal?.addEventListener('click', (event) => {
  const rect = modal.getBoundingClientRect();
  const inDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inDialog) modal.close();
});

function randomArtwork() {
  const visibleCards = [...document.querySelectorAll('.art-card:not(.hidden)')];
  if (!visibleCards.length) return;
  const chosen = visibleCards[Math.floor(Math.random() * visibleCards.length)];
  openArtwork(chosen.dataset.id);
}

document.querySelector('#randomGallery')?.addEventListener('click', randomArtwork);
document.querySelector('#randomHero')?.addEventListener('click', randomArtwork);

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    document.querySelectorAll('.art-card').forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && !card.dataset.category.includes(filter));
    });
  });
});

const swapChoices = ['red-kite-emily', 'eeveely', 'chloe-red', 'red'];
let swapIndex = 0;
const swapFrame = document.querySelector('.swap-frame');
const swapImage = document.querySelector('#swapImage');
const swapLabel = document.querySelector('#swapLabel');
document.querySelector('#swapArt')?.addEventListener('click', () => {
  swapIndex = (swapIndex + 1) % swapChoices.length;
  const art = artworks[swapChoices[swapIndex]];
  swapFrame.classList.add('is-swapping');
  window.setTimeout(() => {
    swapImage.src = art.image;
    swapImage.alt = art.alt;
    swapLabel.textContent = art.title;
    swapFrame.classList.remove('is-swapping');
  }, 210);
});

const runawayZone = document.querySelector('#runawayZone');
const runawayButton = document.querySelector('#runawayButton');
let runawayCount = 0;
function moveRunaway() {
  if (window.matchMedia('(hover: none)').matches) return;
  runawayCount += 1;
  const zone = runawayZone.getBoundingClientRect();
  const button = runawayButton.getBoundingClientRect();
  const maxX = Math.max(10, zone.width - button.width - 20);
  const maxY = Math.max(10, zone.height - button.height - 20);
  runawayButton.style.left = `${10 + Math.random() * maxX}px`;
  runawayButton.style.top = `${10 + Math.random() * maxY}px`;
  runawayButton.style.transform = 'none';
  if (runawayCount > 5) runawayButton.textContent = 'Too slow! ✨';
}
runawayButton?.addEventListener('pointerenter', moveRunaway);
runawayButton?.addEventListener('click', () => {
  runawayButton.textContent = 'You caught me! 🏆';
  confetti(runawayButton.getBoundingClientRect().left + 50, runawayButton.getBoundingClientRect().top);
});

function confetti(x = window.innerWidth / 2, y = 120) {
  const symbols = ['♥', '✦', '●', '★', '♛'];
  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = `${x + (Math.random() - .5) * 240}px`;
    piece.style.top = `${y + (Math.random() - .5) * 50}px`;
    piece.style.color = ['#ff72bf', '#4d8fff', '#ffd95e', '#7c5ce5'][Math.floor(Math.random() * 4)];
    piece.style.animationDelay = `${Math.random() * .18}s`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 1600);
  }
}
document.querySelector('#confettiButton')?.addEventListener('click', (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  confetti(rect.left + rect.width / 2, rect.top);
});

let sparkleThrottle = 0;
document.addEventListener('pointermove', (event) => {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const now = performance.now();
  if (now - sparkleThrottle < 38) return;
  sparkleThrottle = now;
  const sparkle = document.createElement('span');
  sparkle.className = 'sparkle';
  sparkle.textContent = Math.random() > .45 ? '✦' : '♥';
  sparkle.style.left = `${event.clientX + (Math.random() * 10 - 5)}px`;
  sparkle.style.top = `${event.clientY + (Math.random() * 10 - 5)}px`;
  sparkle.style.color = ['#ff72bf', '#4d8fff', '#ffd95e', '#7c5ce5'][Math.floor(Math.random() * 4)];
  document.body.appendChild(sparkle);
  window.setTimeout(() => sparkle.remove(), 760);
});
