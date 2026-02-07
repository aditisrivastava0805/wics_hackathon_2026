/**
 * In-Memory Storage Service
 * Simple storage for demo purposes
 */

const User = require('../models/User');
const Match = require('../models/Match');

class StorageService {
  constructor() {
    this.users = [];
    this.matches = [];
    this.swipeHistory = new Map(); // Map of userId -> Set of swiped user IDs
    this.initializeMockUsers();
  }

  /**
   * Initialize with mock users
   */
  initializeMockUsers() {
    const mockUsers = [
      {
        name: 'Emma',
        email: 'emma@utexas.edu',
        age: 20,
        gender: 'female',
        genderPreference: 'all',
        womenOnlyMode: false,
        topArtists: ['Taylor Swift', 'Ariana Grande', 'Olivia Rodrigo'],
        topGenres: ['pop', 'indie'],
        topTracks: ['Anti-Hero', 'Thank U Next'],
        lookingFor: 'concerts'
      },
      {
        name: 'Sophia',
        email: 'sophia@utexas.edu',
        age: 21,
        gender: 'female',
        genderPreference: 'same',
        womenOnlyMode: true,
        topArtists: ['Billie Eilish', 'Lorde', 'The Weeknd'],
        topGenres: ['alternative', 'indie', 'pop'],
        topTracks: ['Happier Than Ever', 'Green Light'],
        lookingFor: 'friends'
      },
      {
        name: 'Alex',
        email: 'alex@utexas.edu',
        age: 22,
        gender: 'male',
        genderPreference: 'all',
        womenOnlyMode: false,
        topArtists: ['The Weeknd', 'Drake', 'Travis Scott'],
        topGenres: ['hip-hop', 'r&b', 'pop'],
        topTracks: ['Blinding Lights', 'God\'s Plan'],
        lookingFor: 'concerts'
      }
    ];

    this.users = mockUsers.map(data => new User(data));
  }

  // User operations
  getAllUsers() {
    return this.users;
  }

  getUserById(userId) {
    return this.users.find(u => u.id === userId);
  }

  addUser(userData) {
    const user = new User(userData);
    this.users.push(user);
    return user;
  }

  updateUser(userId, updates) {
    const user = this.getUserById(userId);
    if (user) {
      Object.assign(user, updates);
      user.updatedAt = new Date();
    }
    return user;
  }

  // Match operations
  getAllMatches() {
    return this.matches;
  }

  getMatchById(matchId) {
    return this.matches.find(m => m.id === matchId);
  }

  getUserMatches(userId) {
    return this.matches.filter(m => 
      m.user1Id === userId || m.user2Id === userId
    );
  }

  addMatch(matchData) {
    const match = new Match(matchData);
    this.matches.push(match);
    return match;
  }

  updateMatch(matchId, updates) {
    const match = this.getMatchById(matchId);
    if (match) {
      Object.assign(match, updates);
      match.updatedAt = new Date();
    }
    return match;
  }

  // Swipe operations
  recordSwipe(userId, targetUserId, liked) {
    if (!this.swipeHistory.has(userId)) {
      this.swipeHistory.set(userId, new Set());
    }
    this.swipeHistory.get(userId).add(targetUserId);

    // If liked, check for mutual match
    if (liked) {
      const targetSwipes = this.swipeHistory.get(targetUserId);
      if (targetSwipes && targetSwipes.has(userId)) {
        // Mutual match! Check if match already exists
        const existingMatch = this.matches.find(m =>
          (m.user1Id === userId && m.user2Id === targetUserId) ||
          (m.user1Id === targetUserId && m.user2Id === userId)
        );

        if (!existingMatch) {
          return { mutualMatch: true };
        }
      }
    }

    return { mutualMatch: false };
  }

  hasUserSwiped(userId, targetUserId) {
    const swipes = this.swipeHistory.get(userId);
    return swipes ? swipes.has(targetUserId) : false;
  }

  getUnswipedUsers(userId) {
    const user = this.getUserById(userId);
    if (!user) return [];

    return this.users.filter(u => 
      u.id !== userId && !this.hasUserSwiped(userId, u.id)
    );
  }
}

module.exports = StorageService;
