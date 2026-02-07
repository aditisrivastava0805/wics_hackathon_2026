/**
 * Main Server File
 * Express API server for the music dating app
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Services
const StorageService = require('./utils/storageService');
const ConcertService = require('./utils/concertService');
const SpotifyService = require('./utils/spotifyService');
const AppleMusicService = require('./utils/appleMusicService');

// Routes
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const concertRoutes = require('./routes/concerts');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const storage = new StorageService();
const concertService = new ConcertService();
const spotifyService = new SpotifyService({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});
const appleMusicService = new AppleMusicService({
  developerToken: process.env.APPLE_MUSIC_TOKEN
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/users', userRoutes(storage, spotifyService, appleMusicService));
app.use('/api/matches', matchRoutes(storage));
app.use('/api/concerts', concertRoutes(storage, concertService));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Music Dating App API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Music Dating App API',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'POST /api/users': 'Create a new user',
        'PUT /api/users/:id': 'Update user',
        'POST /api/users/:id/music-profile': 'Update music profile',
        'GET /api/users/:id/preferences': 'Get user preferences',
        'PUT /api/users/:id/preferences': 'Update user preferences'
      },
      matches: {
        'GET /api/matches': 'Get all matches',
        'GET /api/matches/user/:userId': 'Get user matches',
        'GET /api/matches/potential/:userId': 'Get potential matches',
        'POST /api/matches/swipe': 'Record a swipe',
        'PUT /api/matches/:matchId/status': 'Update match status'
      },
      concerts: {
        'GET /api/concerts': 'Get all concerts',
        'GET /api/concerts/:id': 'Get concert by ID',
        'GET /api/concerts/recommended/:userId': 'Get recommended concerts',
        'POST /api/concerts/:id/interest': 'Express interest in concert',
        'DELETE /api/concerts/:id/interest': 'Remove interest',
        'GET /api/concerts/:id/interested-users': 'Get interested users',
        'POST /api/concerts': 'Add new concert'
      }
    }
  });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎵 Music Dating App API server running on port ${PORT}`);
    console.log(`📍 API documentation: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
