/**
 * Music Dating App - Frontend JavaScript
 */

// API Base URL
const API_BASE = window.location.origin + '/api';

// Current user (simulated - in production, this would come from authentication)
let currentUser = null;
let currentMatchIndex = 0;
let potentialMatches = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
});

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Get users and use the first one as current user (demo purposes)
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      currentUser = data.data[0];
      await loadPotentialMatches();
      await loadMatches();
      await loadConcerts();
      loadProfile();
    }
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.target.dataset.page;
      switchPage(page);
    });
  });

  // Swipe buttons
  document.getElementById('like-btn').addEventListener('click', () => handleSwipe(true));
  document.getElementById('dislike-btn').addEventListener('click', () => handleSwipe(false));

  // Profile buttons
  document.getElementById('connect-spotify').addEventListener('click', connectSpotify);
  document.getElementById('connect-apple-music').addEventListener('click', connectAppleMusic);
  document.getElementById('save-preferences').addEventListener('click', savePreferences);

  // Concert filters
  document.getElementById('genre-filter').addEventListener('change', filterConcerts);
  document.getElementById('show-recommended').addEventListener('click', showRecommendedConcerts);

  // Modal
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

/**
 * Switch between pages
 */
function switchPage(page) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === page) {
      btn.classList.add('active');
    }
  });

  // Update pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  document.getElementById(`${page}-page`).classList.add('active');
}

/**
 * Load potential matches for swiping
 */
async function loadPotentialMatches() {
  try {
    const response = await fetch(`${API_BASE}/matches/potential/${currentUser.id}?limit=20`);
    const data = await response.json();
    
    if (data.success) {
      potentialMatches = data.data;
      currentMatchIndex = 0;
      displayCurrentMatch();
    }
  } catch (error) {
    console.error('Error loading matches:', error);
  }
}

/**
 * Display current match card
 */
function displayCurrentMatch() {
  if (currentMatchIndex >= potentialMatches.length) {
    document.getElementById('current-card').style.display = 'none';
    document.querySelector('.swipe-actions').style.display = 'none';
    document.getElementById('no-more-users').style.display = 'block';
    return;
  }

  const match = potentialMatches[currentMatchIndex];
  const user = match.user;

  if (!user) {
    currentMatchIndex++;
    displayCurrentMatch();
    return;
  }

  // Update card content
  document.querySelector('.user-name').textContent = user.name;
  document.querySelector('.user-info').textContent = `${user.age} • ${user.gender} • ${user.location}`;

  // Display artists
  const artistTags = document.getElementById('artist-tags');
  artistTags.innerHTML = '';
  user.topArtists.slice(0, 5).forEach(artist => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = artist;
    artistTags.appendChild(tag);
  });

  // Display genres
  const genreTags = document.getElementById('genre-tags');
  genreTags.innerHTML = '';
  user.topGenres.slice(0, 5).forEach(genre => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = genre;
    genreTags.appendChild(tag);
  });

  // Display compatibility
  document.querySelector('.compatibility-badge .score').textContent = `${match.compatibilityScore}%`;

  // Display match reasons
  const reasonList = document.getElementById('reason-list');
  reasonList.innerHTML = '';
  match.matchReason.forEach(reason => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonList.appendChild(li);
  });

  document.getElementById('current-card').style.display = 'block';
  document.querySelector('.swipe-actions').style.display = 'flex';
  document.getElementById('no-more-users').style.display = 'none';
}

/**
 * Handle swipe action
 */
async function handleSwipe(liked) {
  if (currentMatchIndex >= potentialMatches.length) return;

  const match = potentialMatches[currentMatchIndex];
  
  try {
    const response = await fetch(`${API_BASE}/matches/swipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        targetUserId: match.user.id,
        liked
      })
    });

    const data = await response.json();

    if (data.success && data.mutualMatch) {
      showMatchModal(match.user, data.data);
      await loadMatches();
    }

    currentMatchIndex++;
    displayCurrentMatch();
  } catch (error) {
    console.error('Error recording swipe:', error);
  }
}

/**
 * Show match modal
 */
function showMatchModal(user, matchData) {
  document.getElementById('match-user-name').textContent = user.name;
  
  const sharedContent = document.getElementById('shared-content');
  sharedContent.innerHTML = '';

  if (matchData.sharedArtists && matchData.sharedArtists.length > 0) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>Artists:</strong> ${matchData.sharedArtists.join(', ')}`;
    sharedContent.appendChild(p);
  }

  if (matchData.sharedGenres && matchData.sharedGenres.length > 0) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>Genres:</strong> ${matchData.sharedGenres.join(', ')}`;
    sharedContent.appendChild(p);
  }

  document.getElementById('match-modal').classList.add('active');
}

/**
 * Close match modal
 */
function closeModal() {
  document.getElementById('match-modal').classList.remove('active');
}

/**
 * Load user matches
 */
async function loadMatches() {
  try {
    const response = await fetch(`${API_BASE}/matches/user/${currentUser.id}`);
    const data = await response.json();

    if (data.success) {
      const matchesList = document.getElementById('matches-list');
      const noMatches = document.getElementById('no-matches');

      if (data.data.length === 0) {
        matchesList.style.display = 'none';
        noMatches.style.display = 'block';
        return;
      }

      matchesList.style.display = 'grid';
      noMatches.style.display = 'none';
      matchesList.innerHTML = '';

      for (const match of data.data) {
        // Get the other user
        const otherUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
        const userResponse = await fetch(`${API_BASE}/users/${otherUserId}`);
        const userData = await userResponse.json();

        if (userData.success) {
          const card = createMatchCard(match, userData.data);
          matchesList.appendChild(card);
        }
      }
    }
  } catch (error) {
    console.error('Error loading matches:', error);
  }
}

/**
 * Create match card element
 */
function createMatchCard(match, user) {
  const card = document.createElement('div');
  card.className = 'match-card';

  const html = `
    <h3>${user.name}</h3>
    <div class="match-score">${match.compatibilityScore}% Match</div>
    <p>${user.age} • ${user.gender}</p>
    <div class="shared-items">
      ${match.sharedArtists.length > 0 ? `
        <h4>Shared Artists:</h4>
        <div class="tags">
          ${match.sharedArtists.slice(0, 3).map(a => `<span class="tag">${a}</span>`).join('')}
        </div>
      ` : ''}
      ${match.sharedGenres.length > 0 ? `
        <h4>Shared Genres:</h4>
        <div class="tags">
          ${match.sharedGenres.slice(0, 3).map(g => `<span class="tag">${g}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  card.innerHTML = html;
  return card;
}

/**
 * Load concerts
 */
async function loadConcerts() {
  try {
    const response = await fetch(`${API_BASE}/concerts`);
    const data = await response.json();

    if (data.success) {
      displayConcerts(data.data);
    }
  } catch (error) {
    console.error('Error loading concerts:', error);
  }
}

/**
 * Display concerts
 */
function displayConcerts(concerts) {
  const concertsList = document.getElementById('concerts-list');
  concertsList.innerHTML = '';

  concerts.forEach(concert => {
    const card = createConcertCard(concert);
    concertsList.appendChild(card);
  });
}

/**
 * Create concert card element
 */
function createConcertCard(concert) {
  const card = document.createElement('div');
  card.className = 'concert-card';

  const date = new Date(concert.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  const html = `
    <div class="concert-header">
      <div class="concert-name">${concert.name}</div>
      <div class="concert-artists">${concert.artists.join(', ')}</div>
    </div>
    <div class="concert-details">
      <div class="concert-detail">📍 ${concert.venue}</div>
      <div class="concert-detail">📅 ${formattedDate}</div>
      <div class="concert-detail">🕐 ${concert.time}</div>
      <div class="concert-detail">💵 $${concert.price.min} - $${concert.price.max}</div>
    </div>
    <div class="concert-genres">
      ${concert.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
    </div>
    <div class="concert-actions">
      <button class="btn-primary" onclick="expressInterest('${concert.id}')">I'm Interested</button>
      <a href="${concert.ticketUrl}" target="_blank" class="btn-secondary">Get Tickets</a>
    </div>
  `;

  card.innerHTML = html;
  return card;
}

/**
 * Express interest in a concert
 */
async function expressInterest(concertId) {
  try {
    const response = await fetch(`${API_BASE}/concerts/${concertId}/interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });

    const data = await response.json();
    if (data.success) {
      alert('Interest recorded! We\'ll match you with others going to this concert.');
    }
  } catch (error) {
    console.error('Error expressing interest:', error);
  }
}

/**
 * Filter concerts by genre
 */
async function filterConcerts() {
  const genre = document.getElementById('genre-filter').value;
  
  try {
    let url = `${API_BASE}/concerts`;
    if (genre) {
      url += `?genre=${genre}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      displayConcerts(data.data);
    }
  } catch (error) {
    console.error('Error filtering concerts:', error);
  }
}

/**
 * Show recommended concerts
 */
async function showRecommendedConcerts() {
  try {
    const response = await fetch(`${API_BASE}/concerts/recommended/${currentUser.id}`);
    const data = await response.json();

    if (data.success) {
      displayConcerts(data.data);
    }
  } catch (error) {
    console.error('Error loading recommended concerts:', error);
  }
}

/**
 * Load user profile
 */
function loadProfile() {
  if (!currentUser) return;

  // Basic info
  const userInfo = document.getElementById('user-info');
  userInfo.innerHTML = `
    <p><strong>Name:</strong> ${currentUser.name}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Age:</strong> ${currentUser.age}</p>
    <p><strong>Gender:</strong> ${currentUser.gender}</p>
  `;

  // Music profile
  const musicProfile = document.getElementById('music-profile');
  musicProfile.innerHTML = `
    <h4>Top Artists:</h4>
    <div class="tags">
      ${currentUser.topArtists.map(a => `<span class="tag">${a}</span>`).join('')}
    </div>
    <h4>Top Genres:</h4>
    <div class="tags">
      ${currentUser.topGenres.map(g => `<span class="tag">${g}</span>`).join('')}
    </div>
  `;

  // Preferences
  document.getElementById('gender-preference').value = currentUser.genderPreference;
  document.getElementById('women-only-mode').checked = currentUser.womenOnlyMode;
  document.getElementById('looking-for').value = currentUser.lookingFor;
}

/**
 * Connect Spotify
 */
async function connectSpotify() {
  alert('Spotify integration: In production, this would redirect to Spotify OAuth. Mock data will be used for demo.');
  
  try {
    const response = await fetch(`${API_BASE}/users/${currentUser.id}/music-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'spotify',
        accessToken: 'mock_token'
      })
    });

    const data = await response.json();
    if (data.success) {
      currentUser = data.data;
      loadProfile();
      alert('Spotify connected successfully!');
    }
  } catch (error) {
    console.error('Error connecting Spotify:', error);
  }
}

/**
 * Connect Apple Music
 */
async function connectAppleMusic() {
  alert('Apple Music integration: In production, this would use MusicKit JS. Mock data will be used for demo.');
  
  try {
    const response = await fetch(`${API_BASE}/users/${currentUser.id}/music-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'appleMusic',
        accessToken: 'mock_token'
      })
    });

    const data = await response.json();
    if (data.success) {
      currentUser = data.data;
      loadProfile();
      alert('Apple Music connected successfully!');
    }
  } catch (error) {
    console.error('Error connecting Apple Music:', error);
  }
}

/**
 * Save user preferences
 */
async function savePreferences() {
  const genderPreference = document.getElementById('gender-preference').value;
  const womenOnlyMode = document.getElementById('women-only-mode').checked;
  const lookingFor = document.getElementById('looking-for').value;

  try {
    const response = await fetch(`${API_BASE}/users/${currentUser.id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genderPreference,
        womenOnlyMode,
        lookingFor
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('Preferences saved successfully!');
      // Reload potential matches with new preferences
      await loadPotentialMatches();
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}
