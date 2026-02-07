/**
 * User Model
 * Represents a user in the music dating app
 */

class User {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
    this.gender = data.gender; // 'male', 'female', 'other'
    this.genderPreference = data.genderPreference || 'all'; // 'all', 'same', 'male', 'female'
    this.womenOnlyMode = data.womenOnlyMode || false; // For women-only matching
    this.location = data.location || 'Austin, TX';
    
    // Music preferences
    this.spotifyId = data.spotifyId || null;
    this.appleMusicId = data.appleMusicId || null;
    this.topArtists = data.topArtists || [];
    this.topGenres = data.topGenres || [];
    this.topTracks = data.topTracks || [];
    this.musicTaste = data.musicTaste || {}; // Detailed music profile
    
    // Matching preferences
    this.lookingFor = data.lookingFor || 'concerts'; // 'concerts', 'dating', 'friends'
    this.interestedConcerts = data.interestedConcerts || [];
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if this user matches gender preferences with another user
   */
  matchesGenderPreferences(otherUser) {
    // Check if women-only mode is enabled
    if (this.womenOnlyMode) {
      return this.gender === 'female' && otherUser.gender === 'female';
    }

    // Check gender preferences
    if (this.genderPreference === 'same') {
      return this.gender === otherUser.gender;
    }

    if (this.genderPreference !== 'all' && otherUser.gender !== this.genderPreference) {
      return false;
    }

    // Check other user's preferences
    if (otherUser.genderPreference === 'same') {
      return this.gender === otherUser.gender;
    }

    if (otherUser.genderPreference !== 'all' && this.gender !== otherUser.genderPreference) {
      return false;
    }

    return true;
  }

  /**
   * Update user's music profile from Spotify/Apple Music
   */
  updateMusicProfile(musicData) {
    if (musicData.spotifyData) {
      this.spotifyId = musicData.spotifyData.id;
      this.topArtists = musicData.spotifyData.topArtists || this.topArtists;
      this.topTracks = musicData.spotifyData.topTracks || this.topTracks;
      this.topGenres = musicData.spotifyData.topGenres || this.topGenres;
    }

    if (musicData.appleMusicData) {
      this.appleMusicId = musicData.appleMusicData.id;
      // Merge Apple Music data
      this.topArtists = [...new Set([...this.topArtists, ...(musicData.appleMusicData.topArtists || [])])];
      this.topGenres = [...new Set([...this.topGenres, ...(musicData.appleMusicData.topGenres || [])])];
    }

    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
      gender: this.gender,
      genderPreference: this.genderPreference,
      womenOnlyMode: this.womenOnlyMode,
      location: this.location,
      spotifyId: this.spotifyId,
      appleMusicId: this.appleMusicId,
      topArtists: this.topArtists,
      topGenres: this.topGenres,
      topTracks: this.topTracks,
      lookingFor: this.lookingFor,
      interestedConcerts: this.interestedConcerts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;
