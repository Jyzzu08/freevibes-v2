const showcaseCatalog = [
  {
    title: 'Jazz at the park',
    artist: 'Manwithmetalpig',
    album: 'Wikimedia Commons session',
    mood: 'Jazz duo',
    duration: '3:26',
    license: 'CC0 1.0',
    audio: './assets/audio/jazz-at-the-park.ogg',
  },
];

const grid = document.getElementById('catalog-grid');
const searchInput = document.getElementById('catalog-search');
const player = document.getElementById('showcase-player');
const playerTitle = document.getElementById('player-title');
const playerMeta = document.getElementById('player-meta');

function selectTrack(track) {
  player.src = track.audio;
  playerTitle.textContent = track.title;
  playerMeta.textContent = `${track.artist} | ${track.album} | ${track.mood}`;
  player.load();
  void player.play().catch(() => {});
}

function renderCatalog(items) {
  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = `
      <article class="track-card">
        <span class="mood">No match</span>
        <h3>No tracks match that search yet</h3>
        <p class="track-meta">Try terms like jazz, park, commons or CC0.</p>
      </article>
    `;
    return;
  }

  for (const track of items) {
    const card = document.createElement('article');
    card.className = 'track-card';
    card.innerHTML = `
      <span class="mood">${track.mood}</span>
      <div>
        <h3>${track.title}</h3>
        <p class="track-meta">${track.artist} | ${track.album}</p>
      </div>
      <p>
        Full-length jazz track for the public GitHub Pages showcase. Use the Docker demo to try
        auth, playlists, library and admin over the real API.
      </p>
      <p class="track-meta">Duration ${track.duration} | License ${track.license}</p>
    `;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Play full track';
    button.addEventListener('click', () => selectTrack(track));
    card.appendChild(button);

    grid.appendChild(card);
  }
}

searchInput.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  const filtered = showcaseCatalog.filter((track) =>
    [track.title, track.artist, track.album, track.mood, track.license]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
  renderCatalog(filtered);
});

renderCatalog(showcaseCatalog);
