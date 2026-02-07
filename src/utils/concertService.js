/**
 * Concert Service
 * Manages concert data and integrates with concert APIs
 */

const Concert = require('../models/Concert');

class ConcertService {
  constructor() {
    this.concerts = [];
    this.initializeMockData();
  }

  /**
   * Initialize with mock concert data for Austin
   */
  initializeMockData() {
    const mockConcerts = [
      {
        name: 'ACL Live Presents: Indie Night',
        artists: ['The War on Drugs', 'Japanese Breakfast'],
        venue: 'Moody Theater',
        location: 'Austin, TX',
        date: '2026-03-15',
        time: '8:00 PM',
        genre: ['indie', 'alternative', 'rock'],
        ticketUrl: 'https://acl-live.com/tickets',
        price: { min: 45, max: 85 },
        description: 'An unforgettable indie rock experience'
      },
      {
        name: 'Country Music Festival',
        artists: ['Luke Combs', 'Kacey Musgraves', 'Chris Stapleton'],
        venue: 'Stubb\'s BBQ',
        location: 'Austin, TX',
        date: '2026-04-20',
        time: '7:00 PM',
        genre: ['country', 'folk'],
        ticketUrl: 'https://stubbsaustin.com/tickets',
        price: { min: 55, max: 120 },
        description: 'Best of country music in Austin'
      },
      {
        name: 'Electronic Dance Night',
        artists: ['Disclosure', 'ODESZA', 'Flume'],
        venue: 'Emo\'s Austin',
        location: 'Austin, TX',
        date: '2026-05-10',
        time: '9:00 PM',
        genre: ['electronic', 'edm', 'dance'],
        ticketUrl: 'https://emosaustin.com/tickets',
        price: { min: 40, max: 75 },
        description: 'Dance the night away'
      },
      {
        name: 'Hip-Hop Showcase',
        artists: ['Kendrick Lamar', 'Tyler, The Creator'],
        venue: 'The Paramount Theatre',
        location: 'Austin, TX',
        date: '2026-06-05',
        time: '8:30 PM',
        genre: ['hip-hop', 'rap'],
        ticketUrl: 'https://austintheatre.org/tickets',
        price: { min: 65, max: 150 },
        description: 'Hip-hop legends live'
      },
      {
        name: 'Pop Explosion',
        artists: ['Ariana Grande', 'Dua Lipa', 'The Weeknd'],
        venue: 'Circuit of The Americas',
        location: 'Austin, TX',
        date: '2026-07-12',
        time: '7:30 PM',
        genre: ['pop'],
        ticketUrl: 'https://circuitoftheamericas.com/tickets',
        price: { min: 85, max: 250 },
        description: 'The biggest pop stars'
      },
      {
        name: 'Jazz Night at the Continental',
        artists: ['Robert Glasper', 'Esperanza Spalding'],
        venue: 'Continental Club',
        location: 'Austin, TX',
        date: '2026-08-08',
        time: '9:00 PM',
        genre: ['jazz', 'blues'],
        ticketUrl: 'https://continentalclub.com/tickets',
        price: { min: 30, max: 60 },
        description: 'Smooth jazz evening'
      }
    ];

    this.concerts = mockConcerts.map(data => new Concert(data));
  }

  /**
   * Get all concerts
   * @returns {Array<Concert>} All concerts
   */
  getAllConcerts() {
    return this.concerts.map(c => c.toJSON());
  }

  /**
   * Get concerts by date range
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Array<Concert>} Filtered concerts
   */
  getConcertsByDateRange(startDate, endDate) {
    return this.concerts
      .filter(concert => {
        const concertDate = new Date(concert.date);
        return concertDate >= startDate && concertDate <= endDate;
      })
      .map(c => c.toJSON());
  }

  /**
   * Get concerts by genre
   * @param {string} genre 
   * @returns {Array<Concert>} Filtered concerts
   */
  getConcertsByGenre(genre) {
    return this.concerts
      .filter(concert => 
        concert.genre.some(g => 
          g.toLowerCase().includes(genre.toLowerCase())
        )
      )
      .map(c => c.toJSON());
  }

  /**
   * Get concerts matching user's music taste
   * @param {User} user 
   * @returns {Array<Concert>} Recommended concerts
   */
  getRecommendedConcerts(user) {
    return this.concerts
      .filter(concert => concert.matchesMusicTaste(user))
      .map(c => c.toJSON())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get concert by ID
   * @param {string} concertId 
   * @returns {Concert|null} Concert or null
   */
  getConcertById(concertId) {
    const concert = this.concerts.find(c => c.id === concertId);
    return concert ? concert.toJSON() : null;
  }

  /**
   * Add user interest to a concert
   * @param {string} concertId 
   * @param {string} userId 
   */
  addUserInterest(concertId, userId) {
    const concert = this.concerts.find(c => c.id === concertId);
    if (concert) {
      concert.addInterestedUser(userId);
    }
  }

  /**
   * Remove user interest from a concert
   * @param {string} concertId 
   * @param {string} userId 
   */
  removeUserInterest(concertId, userId) {
    const concert = this.concerts.find(c => c.id === concertId);
    if (concert) {
      concert.removeInterestedUser(userId);
    }
  }

  /**
   * Get users interested in a concert
   * @param {string} concertId 
   * @returns {Array<string>} User IDs
   */
  getInterestedUsers(concertId) {
    const concert = this.concerts.find(c => c.id === concertId);
    return concert ? concert.interestedUsers : [];
  }

  /**
   * Add a new concert
   * @param {Object} concertData 
   * @returns {Concert} New concert
   */
  addConcert(concertData) {
    const concert = new Concert(concertData);
    this.concerts.push(concert);
    return concert.toJSON();
  }
}

module.exports = ConcertService;
