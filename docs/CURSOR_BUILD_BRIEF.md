# Cursor Build Brief: Encore (UT Concert Matching)

## Goal
Set up a working MVP codebase that implements the Encore PRD:
- UT email authentication
- Concert discovery list (from mocked data first)
- Concert Rooms with user cards + room chat
- 1:1 connection requests + private concert-scoped thread
- "Going Together" mutual confirmation with confetti
- Coordination checklist inside private thread
- Matching score to sort room cards (simple heuristic)

## Tech decisions (use these unless impossible)
- Frontend: Next.js (App Router) + TypeScript
- UI: minimal, functional (no perfection)
- Backend: Firebase (Auth + Firestore)
- Real-time chat: use the chosen backend’s realtime (Supabase Realtime or Firestore listeners)
- External data: mock first, add SerpAPI later behind a server route

## Non-goals
No group matching, no ticket purchasing, no complex moderation.

## Deliverables
1) Repo scaffold + running locally
2) Database schema / collections
3) API routes / server actions for:
   - concerts list
   - join concert room
   - send room message
   - request connection
   - accept connection
   - send private message
   - update “Going Together”
   - update checklist items
4) Seed script (or mock JSON) for concerts

## Constraints
- All private threads are tied to a specific concert_id
- Users must be verified UT email (ending in @utexas.edu)
- Concert discovery sorts by listening preferences first (mock a “preference score” initially)

## Step-by-step approach (MANDATORY)
Do NOT generate the full app at once.
Proceed in steps:
Step 1: Propose architecture + schema + routes + folder structure
Step 2: Create scaffold and core pages
Step 3: Implement auth + user profile
Step 4: Implement concerts + room join
Step 5: Implement room chat
Step 6: Implement connection requests + private thread
Step 7: Implement coordination checklist + going together
Step 8: Add SerpAPI integration 

At each step, output:
- files created/changed
- how to run locally
- any env vars needed