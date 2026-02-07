/**
 * Tests for User Model
 */

const User = require('../src/models/User');

describe('User Model', () => {
  let userData;

  beforeEach(() => {
    userData = {
      name: 'Test User',
      email: 'test@test.com',
      age: 20,
      gender: 'female',
      genderPreference: 'all',
      womenOnlyMode: false,
      topArtists: ['Artist 1', 'Artist 2'],
      topGenres: ['pop', 'rock'],
      topTracks: ['Track 1', 'Track 2']
    };
  });

  test('should create a user with valid data', () => {
    const user = new User(userData);
    
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.age).toBe(userData.age);
    expect(user.gender).toBe(userData.gender);
    expect(user.id).toBeDefined();
  });

  test('should generate unique ID if not provided', () => {
    const user1 = new User(userData);
    const user2 = new User(userData);
    
    expect(user1.id).not.toBe(user2.id);
  });

  describe('matchesGenderPreferences', () => {
    test('should match when both prefer "all"', () => {
      const user1 = new User({ ...userData, genderPreference: 'all' });
      const user2 = new User({ ...userData, gender: 'male', genderPreference: 'all' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(true);
    });

    test('should match when gender preference is "same" and genders match', () => {
      const user1 = new User({ ...userData, gender: 'female', genderPreference: 'same' });
      const user2 = new User({ ...userData, gender: 'female', genderPreference: 'all' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(true);
    });

    test('should not match when gender preference is "same" and genders differ', () => {
      const user1 = new User({ ...userData, gender: 'female', genderPreference: 'same' });
      const user2 = new User({ ...userData, gender: 'male', genderPreference: 'all' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(false);
    });

    test('should enforce women-only mode', () => {
      const user1 = new User({ ...userData, gender: 'female', womenOnlyMode: true });
      const user2 = new User({ ...userData, gender: 'male' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(false);
    });

    test('should match in women-only mode when both are female', () => {
      const user1 = new User({ ...userData, gender: 'female', womenOnlyMode: true });
      const user2 = new User({ ...userData, gender: 'female' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(true);
    });

    test('should match specific gender preference', () => {
      const user1 = new User({ ...userData, gender: 'female', genderPreference: 'male' });
      const user2 = new User({ ...userData, gender: 'male', genderPreference: 'all' });
      
      expect(user1.matchesGenderPreferences(user2)).toBe(true);
    });
  });

  describe('updateMusicProfile', () => {
    test('should update Spotify profile', () => {
      const user = new User(userData);
      const musicData = {
        spotifyData: {
          id: 'spotify123',
          topArtists: ['New Artist 1', 'New Artist 2'],
          topGenres: ['jazz', 'blues'],
          topTracks: ['New Track 1']
        }
      };
      
      user.updateMusicProfile(musicData);
      
      expect(user.spotifyId).toBe('spotify123');
      expect(user.topArtists).toEqual(['New Artist 1', 'New Artist 2']);
      expect(user.topGenres).toEqual(['jazz', 'blues']);
    });

    test('should update Apple Music profile', () => {
      const user = new User(userData);
      const musicData = {
        appleMusicData: {
          id: 'apple123',
          topArtists: ['Apple Artist 1'],
          topGenres: ['classical']
        }
      };
      
      user.updateMusicProfile(musicData);
      
      expect(user.appleMusicId).toBe('apple123');
      expect(user.topArtists).toContain('Apple Artist 1');
      expect(user.topGenres).toContain('classical');
    });

    test('should merge data from both platforms', () => {
      const user = new User(userData);
      
      user.updateMusicProfile({
        spotifyData: {
          id: 'spotify123',
          topArtists: ['Artist A'],
          topGenres: ['pop']
        }
      });
      
      user.updateMusicProfile({
        appleMusicData: {
          id: 'apple123',
          topArtists: ['Artist B'],
          topGenres: ['rock']
        }
      });
      
      expect(user.spotifyId).toBe('spotify123');
      expect(user.appleMusicId).toBe('apple123');
      expect(user.topArtists.length).toBeGreaterThan(0);
      expect(user.topGenres.length).toBeGreaterThan(0);
    });
  });

  describe('toJSON', () => {
    test('should return JSON representation of user', () => {
      const user = new User(userData);
      const json = user.toJSON();
      
      expect(json.name).toBe(userData.name);
      expect(json.email).toBe(userData.email);
      expect(json.id).toBeDefined();
      expect(json.topArtists).toBeDefined();
      expect(json.createdAt).toBeDefined();
    });
  });
});
