/**
 * Matching Algorithm
 * Matches users based on music preferences and gender preferences
 */

const User = require('../models/User');
const Match = require('../models/Match');

class MatchingAlgorithm {
  /**
   * Calculate compatibility score between two users
   * @param {User} user1 
   * @param {User} user2 
   * @returns {Object} { score: number, reasons: string[], sharedData: Object }
   */
  static calculateCompatibility(user1, user2) {
    let score = 0;
    const reasons = [];
    const sharedData = {
      sharedArtists: [],
      sharedGenres: [],
      sharedConcerts: []
    };

    // Check gender preferences first
    if (!user1.matchesGenderPreferences(user2)) {
      return { score: 0, reasons: ['Gender preferences do not match'], sharedData };
    }

    // Calculate artist similarity (40% weight)
    const artistSimilarity = this.calculateArraySimilarity(
      user1.topArtists,
      user2.topArtists
    );
    score += artistSimilarity * 40;
    
    if (artistSimilarity > 0) {
      sharedData.sharedArtists = this.getSharedItems(user1.topArtists, user2.topArtists);
      if (sharedData.sharedArtists.length > 0) {
        reasons.push(`You both love: ${sharedData.sharedArtists.slice(0, 3).join(', ')}`);
      }
    }

    // Calculate genre similarity (30% weight)
    const genreSimilarity = this.calculateArraySimilarity(
      user1.topGenres,
      user2.topGenres
    );
    score += genreSimilarity * 30;
    
    if (genreSimilarity > 0) {
      sharedData.sharedGenres = this.getSharedItems(user1.topGenres, user2.topGenres);
      if (sharedData.sharedGenres.length > 0) {
        reasons.push(`Shared music taste: ${sharedData.sharedGenres.slice(0, 3).join(', ')}`);
      }
    }

    // Calculate concert interest similarity (30% weight)
    const concertSimilarity = this.calculateArraySimilarity(
      user1.interestedConcerts,
      user2.interestedConcerts
    );
    score += concertSimilarity * 30;
    
    if (concertSimilarity > 0) {
      sharedData.sharedConcerts = this.getSharedItems(
        user1.interestedConcerts,
        user2.interestedConcerts
      );
      if (sharedData.sharedConcerts.length > 0) {
        reasons.push(`${sharedData.sharedConcerts.length} concert(s) in common`);
      }
    }

    // Add bonus for same-gender preference when both prefer same gender
    if (user1.genderPreference === 'same' && user2.genderPreference === 'same' && 
        user1.gender === user2.gender) {
      reasons.push('Both looking for same-gender connections');
    }

    // Add bonus for women-only mode
    if (user1.womenOnlyMode && user2.womenOnlyMode) {
      reasons.push('Women-only match');
    }

    return {
      score: Math.round(score),
      reasons,
      sharedData
    };
  }

  /**
   * Calculate similarity between two arrays using Jaccard index
   * @param {Array} arr1 
   * @param {Array} arr2 
   * @returns {number} Similarity score between 0 and 1
   */
  static calculateArraySimilarity(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return 0;
    }

    const set1 = new Set(arr1.map(item => 
      typeof item === 'string' ? item.toLowerCase() : item
    ));
    const set2 = new Set(arr2.map(item => 
      typeof item === 'string' ? item.toLowerCase() : item
    ));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Get shared items between two arrays
   * @param {Array} arr1 
   * @param {Array} arr2 
   * @returns {Array} Shared items
   */
  static getSharedItems(arr1, arr2) {
    if (!arr1 || !arr2) return [];
    
    const set2 = new Set(arr2.map(item => 
      typeof item === 'string' ? item.toLowerCase() : item
    ));

    return arr1.filter(item => {
      const normalizedItem = typeof item === 'string' ? item.toLowerCase() : item;
      return set2.has(normalizedItem);
    });
  }

  /**
   * Find potential matches for a user
   * @param {User} user 
   * @param {Array<User>} allUsers 
   * @param {number} limit 
   * @returns {Array<Match>} Potential matches sorted by compatibility
   */
  static findMatches(user, allUsers, limit = 10) {
    const potentialMatches = [];

    for (const otherUser of allUsers) {
      // Skip self
      if (otherUser.id === user.id) continue;

      // Calculate compatibility
      const compatibility = this.calculateCompatibility(user, otherUser);

      // Only include matches with score > 0
      if (compatibility.score > 0) {
        const match = new Match({
          user1Id: user.id,
          user2Id: otherUser.id,
          compatibilityScore: compatibility.score,
          matchReason: compatibility.reasons,
          sharedArtists: compatibility.sharedData.sharedArtists,
          sharedGenres: compatibility.sharedData.sharedGenres,
          sharedConcerts: compatibility.sharedData.sharedConcerts
        });

        potentialMatches.push(match);
      }
    }

    // Sort by compatibility score (descending)
    potentialMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Return top matches
    return potentialMatches.slice(0, limit);
  }

  /**
   * Filter users by gender preferences
   * @param {User} user 
   * @param {Array<User>} allUsers 
   * @returns {Array<User>} Filtered users
   */
  static filterByGenderPreferences(user, allUsers) {
    return allUsers.filter(otherUser => {
      if (otherUser.id === user.id) return false;
      return user.matchesGenderPreferences(otherUser);
    });
  }
}

module.exports = MatchingAlgorithm;
