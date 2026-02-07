/**
 * Concert Routes
 * API endpoints for concert management
 */

const express = require('express');
const router = express.Router();

module.exports = (storage, concertService) => {
  /**
   * GET /api/concerts
   * Get all concerts
   */
  router.get('/', (req, res) => {
    const { genre, startDate, endDate } = req.query;

    let concerts;
    if (genre) {
      concerts = concertService.getConcertsByGenre(genre);
    } else if (startDate && endDate) {
      concerts = concertService.getConcertsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      concerts = concertService.getAllConcerts();
    }

    res.json({ success: true, data: concerts });
  });

  /**
   * GET /api/concerts/:id
   * Get concert by ID
   */
  router.get('/:id', (req, res) => {
    const concert = concertService.getConcertById(req.params.id);
    if (!concert) {
      return res.status(404).json({ success: false, error: 'Concert not found' });
    }
    res.json({ success: true, data: concert });
  });

  /**
   * GET /api/concerts/recommended/:userId
   * Get recommended concerts for a user based on music taste
   */
  router.get('/recommended/:userId', (req, res) => {
    const user = storage.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const concerts = concertService.getRecommendedConcerts(user);
    res.json({ success: true, data: concerts });
  });

  /**
   * POST /api/concerts/:id/interest
   * Express interest in a concert
   */
  router.post('/:id/interest', (req, res) => {
    const { userId } = req.body;
    const user = storage.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const concert = concertService.getConcertById(req.params.id);
    if (!concert) {
      return res.status(404).json({ success: false, error: 'Concert not found' });
    }

    concertService.addUserInterest(req.params.id, userId);

    // Add concert to user's interested concerts
    if (!user.interestedConcerts.includes(req.params.id)) {
      user.interestedConcerts.push(req.params.id);
      user.updatedAt = new Date();
    }

    res.json({ success: true, message: 'Interest recorded' });
  });

  /**
   * DELETE /api/concerts/:id/interest
   * Remove interest in a concert
   */
  router.delete('/:id/interest', (req, res) => {
    const { userId } = req.body;
    const user = storage.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    concertService.removeUserInterest(req.params.id, userId);

    // Remove concert from user's interested concerts
    user.interestedConcerts = user.interestedConcerts.filter(id => id !== req.params.id);
    user.updatedAt = new Date();

    res.json({ success: true, message: 'Interest removed' });
  });

  /**
   * GET /api/concerts/:id/interested-users
   * Get users interested in a concert
   */
  router.get('/:id/interested-users', (req, res) => {
    const interestedUserIds = concertService.getInterestedUsers(req.params.id);
    const users = interestedUserIds
      .map(id => storage.getUserById(id))
      .filter(user => user !== undefined)
      .map(user => user.toJSON());

    res.json({ success: true, data: users });
  });

  /**
   * POST /api/concerts
   * Add a new concert (admin functionality)
   */
  router.post('/', (req, res) => {
    try {
      const concert = concertService.addConcert(req.body);
      res.status(201).json({ success: true, data: concert });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
};
