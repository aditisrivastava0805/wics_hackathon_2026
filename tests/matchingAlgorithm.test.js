/**
 * Tests for the Matching Algorithm
 */

const User = require('../src/models/User');
const MatchingAlgorithm = require('../src/utils/matchingAlgorithm');

describe('MatchingAlgorithm', () => {
  let user1, user2, user3;

  beforeEach(() => {
    user1 = new User({
      name: 'Alice',
      email: 'alice@test.com',
      age: 20,
      gender: 'female',
      genderPreference: 'all',
      womenOnlyMode: false,
      topArtists: ['Taylor Swift', 'Ariana Grande', 'Ed Sheeran'],
      topGenres: ['pop', 'indie'],
      topTracks: ['Anti-Hero', 'Thank U Next']
    });

    user2 = new User({
      name: 'Bob',
      email: 'bob@test.com',
      age: 22,
      gender: 'male',
      genderPreference: 'all',
      womenOnlyMode: false,
      topArtists: ['Taylor Swift', 'The Weeknd', 'Ed Sheeran'],
      topGenres: ['pop', 'r&b'],
      topTracks: ['Anti-Hero', 'Blinding Lights'],
      interestedConcerts: ['concert1']
    });

    user3 = new User({
      name: 'Carol',
      email: 'carol@test.com',
      age: 21,
      gender: 'female',
      genderPreference: 'same',
      womenOnlyMode: true,
      topArtists: ['Billie Eilish', 'Lorde'],
      topGenres: ['alternative', 'indie'],
      topTracks: ['Happier Than Ever']
    });
  });

  describe('calculateCompatibility', () => {
    test('should calculate compatibility based on music taste', () => {
      const result = MatchingAlgorithm.calculateCompatibility(user1, user2);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toBeDefined();
      expect(result.sharedData).toBeDefined();
      expect(result.sharedData.sharedArtists).toContain('Taylor Swift');
      expect(result.sharedData.sharedArtists).toContain('Ed Sheeran');
    });

    test('should return 0 compatibility for incompatible gender preferences', () => {
      const result = MatchingAlgorithm.calculateCompatibility(user2, user3);
      
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('Gender preferences do not match');
    });

    test('should match users with same gender preference', () => {
      const user4 = new User({
        name: 'Diana',
        email: 'diana@test.com',
        age: 20,
        gender: 'female',
        genderPreference: 'same',
        womenOnlyMode: false,
        topArtists: ['Lorde', 'Billie Eilish'],  // Matching with user3
        topGenres: ['indie', 'alternative']  // Matching with user3
      });

      const result = MatchingAlgorithm.calculateCompatibility(user3, user4);
      
      expect(result.score).toBeGreaterThan(0);
    });

    test('should handle women-only mode correctly', () => {
      user1.womenOnlyMode = true;
      const result = MatchingAlgorithm.calculateCompatibility(user1, user2);
      
      expect(result.score).toBe(0);
    });
  });

  describe('calculateArraySimilarity', () => {
    test('should calculate Jaccard similarity correctly', () => {
      const arr1 = ['a', 'b', 'c'];
      const arr2 = ['b', 'c', 'd'];
      const similarity = MatchingAlgorithm.calculateArraySimilarity(arr1, arr2);
      
      // Intersection: {b, c} = 2, Union: {a, b, c, d} = 4
      // Jaccard: 2/4 = 0.5
      expect(similarity).toBe(0.5);
    });

    test('should return 0 for no overlap', () => {
      const arr1 = ['a', 'b'];
      const arr2 = ['c', 'd'];
      const similarity = MatchingAlgorithm.calculateArraySimilarity(arr1, arr2);
      
      expect(similarity).toBe(0);
    });

    test('should return 1 for identical arrays', () => {
      const arr1 = ['a', 'b', 'c'];
      const arr2 = ['a', 'b', 'c'];
      const similarity = MatchingAlgorithm.calculateArraySimilarity(arr1, arr2);
      
      expect(similarity).toBe(1);
    });
  });

  describe('findMatches', () => {
    test('should find and rank matches', () => {
      const allUsers = [user1, user2, user3];
      const matches = MatchingAlgorithm.findMatches(user1, allUsers, 10);
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      
      // Should find at least user2 as a match
      const hasUser2Match = matches.some(m => m.user2Id === user2.id);
      expect(hasUser2Match).toBe(true);
    });

    test('should respect match limit', () => {
      const allUsers = [user1, user2];
      const matches = MatchingAlgorithm.findMatches(user1, allUsers, 1);
      
      expect(matches.length).toBeLessThanOrEqual(1);
    });

    test('should exclude self from matches', () => {
      const allUsers = [user1, user2];
      const matches = MatchingAlgorithm.findMatches(user1, allUsers);
      
      const hasSelfMatch = matches.some(m => m.user2Id === user1.id);
      expect(hasSelfMatch).toBe(false);
    });
  });

  describe('filterByGenderPreferences', () => {
    test('should filter users by gender preferences', () => {
      const allUsers = [user1, user2, user3];
      const filtered = MatchingAlgorithm.filterByGenderPreferences(user3, allUsers);
      
      // user3 has womenOnlyMode, so should only match with females
      filtered.forEach(u => {
        expect(u.gender).toBe('female');
      });
    });

    test('should include all genders when preference is "all"', () => {
      const allUsers = [user1, user2, user3];
      const filtered = MatchingAlgorithm.filterByGenderPreferences(user1, allUsers);
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
