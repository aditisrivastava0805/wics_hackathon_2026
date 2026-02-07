/**
 * Match Model
 * Represents a match between two users
 */

class Match {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.user1Id = data.user1Id;
    this.user2Id = data.user2Id;
    this.compatibilityScore = data.compatibilityScore || 0;
    this.matchReason = data.matchReason || []; // Array of reasons for the match
    this.status = data.status || 'pending'; // 'pending', 'accepted', 'rejected'
    this.sharedConcerts = data.sharedConcerts || [];
    this.sharedArtists = data.sharedArtists || [];
    this.sharedGenres = data.sharedGenres || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return `match_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Accept the match
   */
  accept() {
    this.status = 'accepted';
    this.updatedAt = new Date();
  }

  /**
   * Reject the match
   */
  reject() {
    this.status = 'rejected';
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      user1Id: this.user1Id,
      user2Id: this.user2Id,
      compatibilityScore: this.compatibilityScore,
      matchReason: this.matchReason,
      status: this.status,
      sharedConcerts: this.sharedConcerts,
      sharedArtists: this.sharedArtists,
      sharedGenres: this.sharedGenres,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Match;
