PRD: Encore
1. Problem Statement
UT Austin students want to attend concerts in Austin but often hesitate because they do not want to go alone, are concerned about safety, or struggle to find people with compatible budgets and concert preferences.
Encore is a concert-first social platform that helps students connect one-on-one with compatible people for a specific concert, turning individual music taste into real-world, low-pressure, and potentially long-lasting connections.
Encore prioritizes intent and coordination over endless browsing.

2. Target User
UT Austin student (verified via UT email)


Enjoys live music and concerts


Budget-conscious


Safety-aware and preference-driven


Encore supports social and dating-adjacent use, but is experience-first, not relationship-first.

3. Success Metric
A user successfully connects and coordinates with at least one compatible person for a specific concert.

4. Core User Flow (MVP)
4.1 Onboarding
Users complete a lightweight onboarding flow:
Authenticate using UT email


Connect Spotify or Apple Music


Select:


Budget range (e.g., under $40, $40–80, flexible)


Gender matching preference (any gender or same gender only)


Concert vibes (e.g., mosh pit, chill balcony, indie listening)



4.2 Concert Discovery
Users browse a list of upcoming concerts in Austin. Goes in order of their listening preferences then all other events.
Each concert card displays:
Artist


Venue


Date


Estimated ticket price range


Users swipe or tap to join a Concert Room for a specific event.

4.3 Concert Room
A Concert Room contains only users interested in the same concert.
Within the room:
Users are displayed as profile cards (no swiping inside the room)


Each profile card shows:


Shared artists / music overlap


Concert vibe compatibility


Budget alignment


Available actions:
Send messages to the concert room chat (public, group-level)


Request a one-on-one connection with a specific user


Leave the concert room at any time


Safety principle:
 Encore encourages experience-first, room-level interaction before enabling private chats.

5. One-on-One Connection
5.1 Connection Request
A user may request to connect with another user from a concert room.
When both users mutually accept:
A concert-scoped private thread is unlocked


Private chat is enabled and tied exclusively to this concert


If two users decide to go together, they must both press a “Going Together” button. When both users have confirmed, have celebratory confetti
Private chats do not exist outside the context of a specific event.

6. Coordination Layer (One-on-One Focus)
Encore assists coordination within private threads, without enforcing group creation.
6.1 Structured Coordination Tools: Checklist
Inside each private concert thread, Encore provides optional coordination helpers:
Meeting spot


Venue entrance


Nearby landmark


Custom location


Arrival time selection


Pre-concert plan


Pre-game


Food before


Meet inside only


Allowed items list (based on venue policies)


Bus and public transit route options to and from the venue


Nearby food options open around the venue


These tools are designed to reduce logistical friction without forcing interaction patterns.

6.2 Coordination Prompts
Encore nudges users at key moments:
48 hours before the event: reminder to purchase tickets


Day of the event: confirm meeting spot and arrival time


Shortly before the event: “On the way?” check-in


Prompts are lightweight and optional.

7. Matching Logic (MVP)
Matching is one-on-one and concert-specific.
Compatibility is calculated using:
Music taste overlap (artists and genres)


Concert vibe compatibility


Budget alignment


Gender preference filters


Users with higher compatibility scores are surfaced more prominently within the concert room.
No advanced machine learning is required for MVP.

8. Data & Discovery Sources
Encore uses external data to populate concerts and contextual information.
SerpAPI usage: https://serpapi.com/
Google Events → upcoming Austin concerts
Artist search → genre and popularity signals
Venue listings → location and pricing hints
News and search trends → identify trending artists
Bus routes to the concert destination → Google Maps
APIs to add: Google Maps, Google Events, Google Trends
This data supports discovery and coordination, not social ranking.

9. Non-Goals (MVP Scope Control)
Encore does not include:
Explicit group matching or group creation


Ticket purchasing


Long-term social feeds


Large-scale moderation systems


Advanced ML-driven recommendations



10. Product Principles
Concert-first, not profile-first


One-on-one matching with public room context


Safety through intent and structure


Coordination over endless messaging


Temporary, event-based connections
