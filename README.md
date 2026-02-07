# 🎵 UT Austin Music Dating App

A music-first dating/social app for UT students in Austin to match, discover, and go to concerts together.

## Features

### 🎶 Music Integration
- **Spotify Integration**: Connect your Spotify account to import your music preferences
- **Apple Music Integration**: Connect your Apple Music account to sync your listening history
- Automatic music profile creation based on top artists, genres, and tracks

### 💕 Smart Matching
- **Music-based Algorithm**: Match with people based on shared music taste
- **Gender Preferences**: Filter matches by gender preference
- **Women-Only Mode**: Special mode for women to match only with other women
- **Same-Gender Option**: Option to connect only with people of the same gender
- **Swipe Interface**: Easy-to-use swipe left/right interface

### 🎤 Concert Discovery
- **Austin Concerts**: Browse concerts happening throughout the year in Austin
- **Genre Filtering**: Filter concerts by music genre
- **Personalized Recommendations**: Get concert recommendations based on your music taste
- **Interest Tracking**: Express interest in concerts and find others going

### 👥 Matching Features
- Compatibility scoring (0-100%)
- Shared artists, genres, and concert interests
- Real-time match notifications
- Match history and management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Storage**: In-memory storage (for demo purposes)
- **APIs**: Spotify API, Apple Music API (mock implementations included)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/aditisrivastava0805/wics_hackathon_2026.git
cd wics_hackathon_2026
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up environment variables:
Create a `.env` file with:
```
PORT=3000
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback/spotify
APPLE_MUSIC_TOKEN=your_apple_music_token
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/music-profile` - Update music profile
- `GET /api/users/:id/preferences` - Get user preferences
- `PUT /api/users/:id/preferences` - Update user preferences

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/user/:userId` - Get user matches
- `GET /api/matches/potential/:userId` - Get potential matches
- `POST /api/matches/swipe` - Record a swipe
- `PUT /api/matches/:matchId/status` - Update match status

### Concerts
- `GET /api/concerts` - Get all concerts
- `GET /api/concerts/:id` - Get concert by ID
- `GET /api/concerts/recommended/:userId` - Get recommended concerts
- `POST /api/concerts/:id/interest` - Express interest in concert
- `DELETE /api/concerts/:id/interest` - Remove interest
- `GET /api/concerts/:id/interested-users` - Get interested users
- `POST /api/concerts` - Add new concert

## Project Structure

```
wics_hackathon_2026/
├── src/
│   ├── models/           # Data models (User, Concert, Match)
│   ├── routes/           # API routes
│   ├── utils/            # Utility services
│   │   ├── matchingAlgorithm.js    # Matching algorithm
│   │   ├── spotifyService.js       # Spotify integration
│   │   ├── appleMusicService.js    # Apple Music integration
│   │   ├── concertService.js       # Concert management
│   │   └── storageService.js       # In-memory storage
│   └── server.js         # Main Express server
├── public/
│   ├── index.html        # Frontend HTML
│   ├── styles.css        # Styles
│   └── app.js           # Frontend JavaScript
├── package.json
└── README.md
```

## How It Works

1. **Create Profile**: Users create a profile with basic information
2. **Connect Music**: Link Spotify or Apple Music to import music preferences
3. **Set Preferences**: Choose gender preferences and matching options
4. **Discover**: Swipe through potential matches based on music compatibility
5. **Match**: When both users like each other, it's a match!
6. **Concerts**: Browse and express interest in upcoming concerts
7. **Connect**: Meet up at concerts with your matches

## Matching Algorithm

The matching algorithm considers:
- **Music Taste (70%)**: Artist similarity (40%) + Genre similarity (30%)
- **Concert Interests (30%)**: Shared interest in upcoming concerts
- **Gender Preferences**: Respects all gender preference settings

Compatibility scores range from 0-100%.

## Future Enhancements

- Real database integration (MongoDB/PostgreSQL)
- User authentication and authorization
- Real-time chat functionality
- Push notifications for matches
- Integration with Ticketmaster/Songkick APIs
- Photo uploads
- Advanced filtering options
- Event planning features
- Group concert meetups

## Contributing

This is a hackathon project for WICS Hackathon 2026. Contributions are welcome!

## License

ISC