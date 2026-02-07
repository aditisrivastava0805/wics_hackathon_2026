/**
 * User Routes
 * API endpoints for user management
 */

const express = require('express');
const router = express.Router();

module.exports = (storage, spotifyService, appleMusicService) => {
  /**
   * GET /api/users
   * Get all users
   */
  router.get('/', (req, res) => {
    const users = storage.getAllUsers().map(u => u.toJSON());
    res.json({ success: true, data: users });
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  router.get('/:id', (req, res) => {
    const user = storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user.toJSON() });
  });

  /**
   * POST /api/users
   * Create a new user
   */
  router.post('/', (req, res) => {
    try {
      const user = storage.addUser(req.body);
      res.status(201).json({ success: true, data: user.toJSON() });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/users/:id
   * Update user
   */
  router.put('/:id', (req, res) => {
    const user = storage.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user.toJSON() });
  });

  /**
   * POST /api/users/:id/music-profile
   * Update user's music profile from Spotify/Apple Music
   */
  router.post('/:id/music-profile', async (req, res) => {
    try {
      const user = storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const { platform, accessToken } = req.body;

      let musicData = {};
      if (platform === 'spotify') {
        const spotifyData = await spotifyService.getUserMusicProfile(accessToken);
        musicData = { spotifyData };
      } else if (platform === 'appleMusic') {
        const appleMusicData = await appleMusicService.getUserMusicProfile(accessToken);
        musicData = { appleMusicData };
      }

      user.updateMusicProfile(musicData);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/users/:id/preferences
   * Get user's gender preferences
   */
  router.get('/:id/preferences', (req, res) => {
    const user = storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        genderPreference: user.genderPreference,
        womenOnlyMode: user.womenOnlyMode,
        lookingFor: user.lookingFor
      }
    });
  });

  /**
   * PUT /api/users/:id/preferences
   * Update user's preferences
   */
  router.put('/:id/preferences', (req, res) => {
    const user = storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { genderPreference, womenOnlyMode, lookingFor } = req.body;

    if (genderPreference !== undefined) {
      user.genderPreference = genderPreference;
    }
    if (womenOnlyMode !== undefined) {
      user.womenOnlyMode = womenOnlyMode;
    }
    if (lookingFor !== undefined) {
      user.lookingFor = lookingFor;
    }

    user.updatedAt = new Date();

    res.json({
      success: true,
      data: {
        genderPreference: user.genderPreference,
        womenOnlyMode: user.womenOnlyMode,
        lookingFor: user.lookingFor
      }
    });
  });

  return router;
};
