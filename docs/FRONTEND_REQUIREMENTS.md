# Frontend Requirements: Encore

## Core UI Behaviors

- **Auth guard**: Redirect unauthenticated users to `/login`
- **UT restriction**: If signed-in email not `@utexas.edu`, show blocked screen + sign out button
- **Concert discovery**: List concerts sorted by preference score (MVP heuristic)
- **Concert room**: Show member cards + public room chat (realtime)
- **Connection request**: Request/accept within concert room
- **Thread**: Private messages (realtime) + Going Together mutual confirm + coordination checklist UI

## Firebase Rules Assumption

Assume Firestore rules enforce:
- Only `@utexas.edu` users can read/write
- Only room members can access room messages
- Only thread participants can access thread + messages

## MVP UI Quality Bar

Functional > pretty. Minimal Tailwind. Clear loading + error states.

## Non-Goals

- No group matching
- No ticket purchase
- No moderation tooling
- No fancy animations except confetti on mutual "Going Together"

---

# Step-by-Step Frontend Implementation Plan

## Phase 1: Auth Foundation

### Step 1.1: Auth Context & Guards
- [ ] Verify `AuthProvider` wraps the app in root `layout.tsx`
- [ ] Implement `useAuth` hook with `user`, `userProfile`, `loading` states
- [ ] Create `AuthGuard` component that:
  - Shows loading spinner while checking auth
  - Redirects to `/login` if not authenticated
  - Passes through if authenticated

### Step 1.2: UT Email Restriction
- [ ] Create `UTEmailGuard` component that:
  - Checks if `user.email` ends with `@utexas.edu`
  - If not, renders a "blocked" screen with explanation + sign out button
  - Wrap all `(main)` routes with this guard

### Step 1.3: Auth Pages Polish
- [ ] `/login` - Email/password form, error handling, redirect to `/concerts` on success
- [ ] `/signup` - Email/password + display name, validate `@utexas.edu` client-side before submit
- [ ] `/onboarding` - Multi-step preferences (genres, artists, budget, vibes, gender pref)

**Checkpoint**: User can sign up, log in, complete onboarding, and non-UT emails are blocked.

---

## Phase 2: Concert Discovery

### Step 2.1: Concerts List Page
- [ ] Fetch concerts from Firestore (`/concerts` collection)
- [ ] Sort by preference score using `lib/matching.ts` logic
- [ ] Display as card grid with: image, name, artist, venue, date, price range, genre tag
- [ ] Loading state: skeleton cards or spinner
- [ ] Empty state: "No concerts found" message

### Step 2.2: Concert Card Component
- [ ] `ConcertCard` component with consistent styling
- [ ] Click navigates to `/concerts/[id]`
- [ ] Optional: Show match score badge if user has preferences

**Checkpoint**: User sees concert list sorted by their preferences.

---

## Phase 3: Concert Room

### Step 3.1: Room Header & Join Flow
- [ ] Fetch concert details by ID
- [ ] Show concert info (name, artist, venue, date)
- [ ] "Join Room" button if user hasn't joined
- [ ] On join: write to `/concerts/{id}/members/{userId}`

### Step 3.2: Member Cards
- [ ] Fetch room members from `/concerts/{id}/members`
- [ ] For each member, fetch their user profile
- [ ] Display as cards: avatar, name, music preferences overlap, budget alignment
- [ ] Sort by compatibility score with current user
- [ ] "Request Connection" button on each card (except self)

### Step 3.3: Room Chat (Realtime)
- [ ] Subscribe to `/concerts/{id}/messages` with `onSnapshot`
- [ ] Display messages in chronological order
- [ ] Show sender name/avatar, message content, timestamp
- [ ] Input field + send button at bottom
- [ ] Auto-scroll to newest message
- [ ] Loading state while subscribing

### Step 3.4: Connection Request from Room
- [ ] "Request Connection" button creates doc in `/connections`
- [ ] Show "Pending" state if request already sent
- [ ] Show "Connected" state if already accepted (link to thread)

**Checkpoint**: User can join room, see members, chat publicly, request connections.

---

## Phase 4: Connections Management

### Step 4.1: Connections Page
- [ ] Fetch connections where user is `requesterId` OR `recipientId`
- [ ] Group into sections:
  - **Incoming requests** (pending, user is recipient) - Accept/Decline buttons
  - **Sent requests** (pending, user is requester) - "Waiting" badge
  - **Accepted connections** - Link to thread
- [ ] Enrich with user profile + concert info

### Step 4.2: Accept/Decline Flow
- [ ] Accept: Update connection status to `accepted`, Firestore trigger creates thread
- [ ] Decline: Update connection status to `declined`
- [ ] Optimistic UI update

**Checkpoint**: User can see and manage all connection requests.

---

## Phase 5: Private Threads

### Step 5.1: Threads List Page
- [ ] Fetch threads where user is in `participants` array
- [ ] Show other user's name/avatar, concert name
- [ ] Show "Going Together!" badge if both confirmed
- [ ] Click navigates to `/threads/[id]`

### Step 5.2: Thread Detail Page
- [ ] Fetch thread details (participants, goingTogether status, concert)
- [ ] Layout: Header + Chat + Checklist sidebar

### Step 5.3: Private Chat (Realtime)
- [ ] Subscribe to `/threads/{id}/messages` with `onSnapshot`
- [ ] Same chat UI as room chat but styled differently (1:1 feel)
- [ ] Input + send at bottom

### Step 5.4: Going Together Feature
- [ ] "Going Together?" toggle button in thread header
- [ ] On click: Update `goingTogether[userId]` to true
- [ ] Display states:
  - Neither confirmed: neutral button
  - User confirmed, waiting: "Waiting for them..."
  - Both confirmed: "Going Together!" + trigger confetti
- [ ] Use `canvas-confetti` library for celebration

### Step 5.5: Coordination Checklist
- [ ] Fetch checklist items from `/threads/{id}/checklist`
- [ ] Display as list with checkbox + title
- [ ] Add item: input + button
- [ ] Toggle complete: update `isCompleted`
- [ ] Delete item: remove from Firestore
- [ ] Optional: show who created each item

**Checkpoint**: Full private thread experience with chat, going-together, and checklist.

---

## Phase 6: Polish & Error Handling

### Step 6.1: Loading States
- [ ] Consistent loading spinner component
- [ ] Skeleton loaders for lists (concerts, members, messages)
- [ ] Disable buttons while actions in progress

### Step 6.2: Error States
- [ ] Toast or inline error messages for failed actions
- [ ] "Something went wrong" fallback UI
- [ ] Retry buttons where appropriate

### Step 6.3: Empty States
- [ ] "No concerts yet" - concerts page
- [ ] "No one here yet" - empty room
- [ ] "No connections yet" - connections page
- [ ] "No messages yet" - empty chat

### Step 6.4: Responsive Design
- [ ] Mobile-first layout
- [ ] Bottom nav works on mobile
- [ ] Chat input doesn't get hidden by keyboard (test on mobile)

**Checkpoint**: App handles all edge cases gracefully.

---

## Phase 7: Profile & Settings

### Step 7.1: Profile Page
- [x] Display current user info (name, email, avatar)
- [x] Edit form for: display name, bio, music preferences, budget, vibes
- [x] Save button with loading state
- [x] Success feedback on save (toast notifications)
- [x] Emoji avatar picker
- [x] Genre selection with multi-select chips
- [x] Artist management (add/remove)
- [x] Vibe selection with visual cards
- [x] Gender preference selection
- [x] Account information display

### Step 7.2: Sign Out
- [x] Sign out button in header/nav
- [x] Clears auth state, redirects to `/login`

### Step 7.3: View Other User Profiles
- [x] Profile modal for viewing other users
- [x] Clickable member cards in concert rooms
- [x] Clickable user info in thread detail page
- [x] Full profile display with preferences

**Checkpoint**: User can manage their profile, view other profiles, and sign out.

---

## Implementation Order Summary

| Order | Phase | Estimated Complexity |
|-------|-------|---------------------|
| 1 | Auth Foundation | Low |
| 2 | Concert Discovery | Low |
| 3 | Concert Room | Medium |
| 4 | Connections Management | Medium |
| 5 | Private Threads | High |
| 6 | Polish & Error Handling | Low |
| 7 | Profile & Settings | Low |

---

## Files to Create/Modify

### New Components
- `components/auth/AuthGuard.tsx`
- `components/auth/UTEmailGuard.tsx`
- `components/concerts/ConcertCard.tsx`
- `components/room/MemberCard.tsx`
- `components/room/RoomChat.tsx`
- `components/connections/ConnectionCard.tsx`
- `components/thread/PrivateChat.tsx`
- `components/thread/GoingTogetherButton.tsx`
- `components/thread/Checklist.tsx`
- `components/ui/Spinner.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/ErrorState.tsx`

### Page Updates
- `app/(main)/layout.tsx` - Add guards
- `app/(main)/concerts/page.tsx` - Sorting, loading, empty states
- `app/(main)/concerts/[id]/page.tsx` - Full room experience
- `app/(main)/connections/page.tsx` - Grouped sections
- `app/(main)/threads/page.tsx` - Thread list
- `app/(main)/threads/[id]/page.tsx` - Full thread experience
- `app/(main)/profile/page.tsx` - Edit form

### Hooks to Add
- `hooks/use-room-members.ts`
- `hooks/use-connections.ts`
- `hooks/use-thread.ts`
- `hooks/use-checklist.ts`
