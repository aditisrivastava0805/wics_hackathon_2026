/**
 * Concert Model
 * Represents a concert happening in Austin
 */

class Concert {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.artists = data.artists || [];
    this.venue = data.venue;
    this.location = data.location || 'Austin, TX';
    this.date = data.date;
    this.time = data.time;
    this.genre = data.genre || [];
    this.ticketUrl = data.ticketUrl;
    this.price = data.price || { min: 0, max: 0 };
    this.description = data.description || '';
    this.imageUrl = data.imageUrl || '';
    this.interestedUsers = data.interestedUsers || [];
    this.createdAt = data.createdAt || new Date();
  }

  generateId() {
    return `concert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Add a user to the interested users list
   */
  addInterestedUser(userId) {
    if (!this.interestedUsers.includes(userId)) {
      this.interestedUsers.push(userId);
    }
  }

  /**
   * Remove a user from the interested users list
   */
  removeInterestedUser(userId) {
    this.interestedUsers = this.interestedUsers.filter(id => id !== userId);
  }

  /**
   * Check if concert matches user's music taste
   */
  matchesMusicTaste(user) {
    // Check if any concert artists match user's top artists
    const artistMatch = this.artists.some(artist => 
      user.topArtists.some(userArtist => 
        userArtist.toLowerCase().includes(artist.toLowerCase()) ||
        artist.toLowerCase().includes(userArtist.toLowerCase())
      )
    );

    if (artistMatch) return true;

    // Check if concert genre matches user's top genres
    const genreMatch = this.genre.some(concertGenre =>
      user.topGenres.some(userGenre =>
        userGenre.toLowerCase().includes(concertGenre.toLowerCase()) ||
        concertGenre.toLowerCase().includes(userGenre.toLowerCase())
      )
    );

    return genreMatch;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      artists: this.artists,
      venue: this.venue,
      location: this.location,
      date: this.date,
      time: this.time,
      genre: this.genre,
      ticketUrl: this.ticketUrl,
      price: this.price,
      description: this.description,
      imageUrl: this.imageUrl,
      interestedUsersCount: this.interestedUsers.length,
      createdAt: this.createdAt
    };
  }
}

module.exports = Concert;
