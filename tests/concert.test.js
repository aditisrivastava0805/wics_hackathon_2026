/**
 * Tests for Concert Model
 */

const Concert = require('../src/models/Concert');
const User = require('../src/models/User');

describe('Concert Model', () => {
  let concertData;

  beforeEach(() => {
    concertData = {
      name: 'Test Concert',
      artists: ['Artist 1', 'Artist 2'],
      venue: 'Test Venue',
      location: 'Austin, TX',
      date: '2026-03-15',
      time: '8:00 PM',
      genre: ['rock', 'indie'],
      ticketUrl: 'https://example.com',
      price: { min: 30, max: 60 }
    };
  });

  test('should create a concert with valid data', () => {
    const concert = new Concert(concertData);
    
    expect(concert.name).toBe(concertData.name);
    expect(concert.artists).toEqual(concertData.artists);
    expect(concert.venue).toBe(concertData.venue);
    expect(concert.id).toBeDefined();
  });

  test('should generate unique ID if not provided', () => {
    const concert1 = new Concert(concertData);
    const concert2 = new Concert(concertData);
    
    expect(concert1.id).not.toBe(concert2.id);
  });

  describe('addInterestedUser', () => {
    test('should add a user to interested users list', () => {
      const concert = new Concert(concertData);
      const userId = 'user123';
      
      concert.addInterestedUser(userId);
      
      expect(concert.interestedUsers).toContain(userId);
    });

    test('should not add duplicate users', () => {
      const concert = new Concert(concertData);
      const userId = 'user123';
      
      concert.addInterestedUser(userId);
      concert.addInterestedUser(userId);
      
      expect(concert.interestedUsers.filter(id => id === userId).length).toBe(1);
    });
  });

  describe('removeInterestedUser', () => {
    test('should remove a user from interested users list', () => {
      const concert = new Concert(concertData);
      const userId = 'user123';
      
      concert.addInterestedUser(userId);
      concert.removeInterestedUser(userId);
      
      expect(concert.interestedUsers).not.toContain(userId);
    });
  });

  describe('matchesMusicTaste', () => {
    test('should match when user likes concert artists', () => {
      const concert = new Concert(concertData);
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        age: 20,
        gender: 'female',
        topArtists: ['Artist 1', 'Artist 3'],
        topGenres: ['pop']
      });
      
      expect(concert.matchesMusicTaste(user)).toBe(true);
    });

    test('should match when user likes concert genres', () => {
      const concert = new Concert(concertData);
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        age: 20,
        gender: 'female',
        topArtists: ['Different Artist'],
        topGenres: ['rock', 'pop']
      });
      
      expect(concert.matchesMusicTaste(user)).toBe(true);
    });

    test('should not match when no common artists or genres', () => {
      const concert = new Concert(concertData);
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        age: 20,
        gender: 'female',
        topArtists: ['Different Artist'],
        topGenres: ['jazz', 'classical']
      });
      
      expect(concert.matchesMusicTaste(user)).toBe(false);
    });
  });

  describe('toJSON', () => {
    test('should return JSON representation of concert', () => {
      const concert = new Concert(concertData);
      concert.addInterestedUser('user1');
      concert.addInterestedUser('user2');
      
      const json = concert.toJSON();
      
      expect(json.name).toBe(concertData.name);
      expect(json.venue).toBe(concertData.venue);
      expect(json.interestedUsersCount).toBe(2);
      expect(json.id).toBeDefined();
    });
  });
});
