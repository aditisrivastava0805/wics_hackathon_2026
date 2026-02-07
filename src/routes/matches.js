/**
 * Match Routes
 * API endpoints for matching functionality
 */

const express = require('express');
const router = express.Router();
const MatchingAlgorithm = require('../utils/matchingAlgorithm');

module.exports = (storage) => {
  /**
   * GET /api/matches
   * Get all matches
   */
  router.get('/', (req, res) => {
    const matches = storage.getAllMatches().map(m => m.toJSON());
    res.json({ success: true, data: matches });
  });

  /**
   * GET /api/matches/user/:userId
   * Get matches for a specific user
   */
  router.get('/user/:userId', (req, res) => {
    const matches = storage.getUserMatches(req.params.userId);
    res.json({ success: true, data: matches.map(m => m.toJSON()) });
  });

  /**
   * GET /api/matches/potential/:userId
   * Get potential matches for a user
   */
  router.get('/potential/:userId', (req, res) => {
    const user = storage.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const unswipedUsers = storage.getUnswipedUsers(req.params.userId);
    
    // Filter by gender preferences first
    const eligibleUsers = MatchingAlgorithm.filterByGenderPreferences(user, unswipedUsers);
    
    // Find matches
    const potentialMatches = MatchingAlgorithm.findMatches(user, eligibleUsers, limit);

    // Attach user data to matches
    const matchesWithUsers = potentialMatches.map(match => {
      const matchedUser = storage.getUserById(match.user2Id);
      return {
        ...match.toJSON(),
        user: matchedUser ? matchedUser.toJSON() : null
      };
    });

    res.json({ success: true, data: matchesWithUsers });
  });

  /**
   * POST /api/matches/swipe
   * Record a swipe (like or dislike)
   */
  router.post('/swipe', (req, res) => {
    const { userId, targetUserId, liked } = req.body;

    const user = storage.getUserById(userId);
    const targetUser = storage.getUserById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Record the swipe
    const result = storage.recordSwipe(userId, targetUserId, liked);

    // If it's a mutual match and they liked each other, create a match
    if (result.mutualMatch && liked) {
      const compatibility = MatchingAlgorithm.calculateCompatibility(user, targetUser);
      const match = storage.addMatch({
        user1Id: userId,
        user2Id: targetUserId,
        compatibilityScore: compatibility.score,
        matchReason: compatibility.reasons,
        sharedArtists: compatibility.sharedData.sharedArtists,
        sharedGenres: compatibility.sharedData.sharedGenres,
        sharedConcerts: compatibility.sharedData.sharedConcerts,
        status: 'accepted'
      });

      res.json({
        success: true,
        mutualMatch: true,
        data: match.toJSON()
      });
    } else {
      res.json({
        success: true,
        mutualMatch: false,
        data: { liked }
      });
    }
  });

  /**
   * PUT /api/matches/:matchId/status
   * Update match status
   */
  router.put('/:matchId/status', (req, res) => {
    const { status } = req.body;
    const match = storage.getMatchById(req.params.matchId);

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    if (status === 'accepted') {
      match.accept();
    } else if (status === 'rejected') {
      match.reject();
    }

    res.json({ success: true, data: match.toJSON() });
  });

  return router;
};
