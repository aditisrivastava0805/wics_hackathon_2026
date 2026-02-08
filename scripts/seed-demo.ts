/**
 * Demo Seed Script for Encore
 * 
 * Creates mock users, room members, messages, connections, threads, and checklist items
 * for demo purposes.
 * 
 * Run with: npm run seed:demo
 * Clear with: npm run seed:demo -- --clear
 * 
 * IMPORTANT: This creates Firebase Auth users, so you need admin credentials.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables (repo root or frontend)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'frontend/.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

// ============ MOCK DATA ============

// Demo user (the one you'll log in as)
const DEMO_USER = {
  email: 'demo@utexas.edu',
  password: 'demo123456',
  displayName: 'Demo User',
  profile: {
    bio: 'Love finding concert buddies! 🎸',
    avatarUrl: null,
    spotifyConnected: false,
    musicPreferences: {
      genres: ['Indie', 'Rock', 'Pop'],
      artists: ['Phoebe Bridgers', 'Arctic Monkeys', 'Taylor Swift'],
    },
    budgetRange: 'flexible',
    genderPref: 'any',
    concertVibes: ['chillBalcony', 'indieListening'],
  },
};

// Mock users (will be created with random UIDs)
const MOCK_USERS = [
  {
    email: 'alex.chen@utexas.edu',
    password: 'test123456',
    displayName: 'Alex Chen',
    profile: {
      bio: 'Indie music enthusiast. Always down for Stubb\'s shows!',
      avatarUrl: null,
      spotifyConnected: true,
      musicPreferences: {
        genres: ['Indie', 'Folk', 'Alternative'],
        artists: ['Phoebe Bridgers', 'Big Thief', 'Bon Iver'],
      },
      budgetRange: '40to80',
      genderPref: 'any',
      concertVibes: ['indieListening', 'chillBalcony'],
    },
  },
  {
    email: 'jordan.smith@utexas.edu',
    password: 'test123456',
    displayName: 'Jordan Smith',
    profile: {
      bio: 'Pop and R&B lover. Let\'s go to SZA together! 💜',
      avatarUrl: null,
      spotifyConnected: true,
      musicPreferences: {
        genres: ['Pop', 'R&B', 'Hip-Hop'],
        artists: ['SZA', 'Taylor Swift', 'Kendrick Lamar'],
      },
      budgetRange: 'flexible',
      genderPref: 'same',
      concertVibes: ['chillBalcony'],
    },
  },
  {
    email: 'sam.rivera@utexas.edu',
    password: 'test123456',
    displayName: 'Sam Rivera',
    profile: {
      bio: 'Rock is life. Mosh pit regular. 🤘',
      avatarUrl: null,
      spotifyConnected: false,
      musicPreferences: {
        genres: ['Rock', 'Alternative', 'Punk'],
        artists: ['Foo Fighters', 'Green Day', 'Arctic Monkeys'],
      },
      budgetRange: 'under40',
      genderPref: 'any',
      concertVibes: ['moshPit'],
    },
  },
  {
    email: 'taylor.kim@utexas.edu',
    password: 'test123456',
    displayName: 'Taylor Kim',
    profile: {
      bio: 'Music theory nerd. Love analyzing live performances.',
      avatarUrl: null,
      spotifyConnected: true,
      musicPreferences: {
        genres: ['Jazz', 'Indie', 'Classical'],
        artists: ['Kamasi Washington', 'John Mayer', 'Jacob Collier'],
      },
      budgetRange: '40to80',
      genderPref: 'any',
      concertVibes: ['indieListening', 'chillBalcony'],
    },
  },
  {
    email: 'morgan.lee@utexas.edu',
    password: 'test123456',
    displayName: 'Morgan Lee',
    profile: {
      bio: 'EDM and electronic vibes only 🎧',
      avatarUrl: null,
      spotifyConnected: true,
      musicPreferences: {
        genres: ['Electronic', 'House', 'Techno'],
        artists: ['ODESZA', 'Porter Robinson', 'Flume'],
      },
      budgetRange: 'flexible',
      genderPref: 'any',
      concertVibes: ['moshPit'],
    },
  },
];

// Room chat messages templates
const ROOM_MESSAGES = [
  { userIndex: 0, content: "Hey everyone! So excited for this show! 🎉" },
  { userIndex: 1, content: "Same! Anyone from West Campus?" },
  { userIndex: 2, content: "I'm coming from North Campus, happy to split an Uber!" },
  { userIndex: 0, content: "What time are y'all planning to get there?" },
  { userIndex: 3, content: "I heard doors open at 7, maybe get there around 7:30?" },
  { userIndex: 1, content: "Sounds good to me!" },
  { userIndex: 2, content: "Anyone want to grab food before? There's good tacos nearby" },
  { userIndex: 0, content: "I'm down for tacos! 🌮" },
];

// Private thread messages templates
const THREAD_MESSAGES = [
  { fromDemo: true, content: "Hey! Saw you're going to the show too!" },
  { fromDemo: false, content: "Yes! So excited! Have you seen them live before?" },
  { fromDemo: true, content: "Nope, first time! Heard their live shows are amazing though" },
  { fromDemo: false, content: "They really are! You'll love it" },
  { fromDemo: true, content: "Want to meet up before the show?" },
  { fromDemo: false, content: "Definitely! We could grab dinner first?" },
  { fromDemo: true, content: "Perfect, let's do it! 🙌" },
];

// Checklist items templates
const CHECKLIST_ITEMS = [
  { title: "Book Uber to venue", completed: true },
  { title: "Meet at Torchy's at 6pm", completed: false },
  { title: "Bring portable charger", completed: false },
  { title: "Download setlist playlist", completed: true },
];

// ============ HELPER FUNCTIONS ============

interface CreatedUser {
  uid: string;
  email: string;
  displayName: string;
}

async function createOrGetUser(email: string, password: string, displayName: string): Promise<CreatedUser> {
  try {
    // Try to get existing user
    const existingUser = await auth.getUserByEmail(email);
    console.log(`  ℹ User exists: ${email} (${existingUser.uid})`);
    return { uid: existingUser.uid, email, displayName };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Create new user
      const newUser = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true, // Auto-verify for demo
      });
      console.log(`  ✓ Created user: ${email} (${newUser.uid})`);
      return { uid: newUser.uid, email, displayName };
    }
    throw error;
  }
}

async function createUserProfile(uid: string, email: string, profile: any, displayName: string) {
  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();
  
  if (existing.exists) {
    console.log(`  ℹ Profile exists: ${email}`);
  } else {
    await userRef.set({
      email,
      displayName,
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ Created profile: ${email}`);
  }

  // Mirror to users/{email} so Flask backend (rooms/people, rooms/chat) finds profiles by email
  const byEmailRef = db.collection('users').doc(email);
  await byEmailRef.set({
    name: displayName,
    email,
    music_preferences: profile?.musicPreferences ?? { genres: [], artists: [] },
    profile_image: profile?.avatarUrl ?? '',
    is_verified: false,
  }, { merge: true });
}

// ============ SEEDING FUNCTIONS ============

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

/**
 * Fetch concert ids from Flask backend (GET /api/events) and ensure Firestore has
 * concert docs with those ids so seed data (members, messages) is attached to
 * the same concerts the app list shows.
 */
async function ensureBackendConcertsInFirestore(): Promise<string[]> {
  console.log('\n🎫 Syncing concerts from backend...');
  try {
    const res = await fetch(`${BACKEND_URL}/api/events?music_only=true&max=20`);
    const text = await res.text();
    let data: { data?: Array<{ id: string; name?: string; venue?: string }> } = { data: [] };
    if (text && text.trim()) {
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        console.log('  ⚠ Backend returned non-JSON');
        return [];
      }
    }
    const events = data.data ?? [];
    if (events.length === 0) {
      console.log('  ⚠ No events from backend (run backend + SerpAPI or frontend seed first)');
      return [];
    }
    for (const ev of events) {
      if (!ev?.id) continue;
      await db.collection('concerts').doc(ev.id).set(
        { name: ev.name ?? '', venue: ev.venue ?? '' },
        { merge: true }
      );
    }
    const ids = events.map((e) => e.id).filter(Boolean);
    console.log(`  ✓ Synced ${ids.length} concert ids from backend`);
    return ids;
  } catch (err: any) {
    console.log(`  ⚠ Could not reach backend (${err?.message ?? err}); using Firestore concerts only`);
    return [];
  }
}

async function seedUsers(): Promise<Map<string, CreatedUser>> {
  console.log('\n👥 Seeding users...');
  
  const users = new Map<string, CreatedUser>();
  
  // Create demo user
  const demoUser = await createOrGetUser(DEMO_USER.email, DEMO_USER.password, DEMO_USER.displayName);
  await createUserProfile(demoUser.uid, DEMO_USER.email, DEMO_USER.profile, DEMO_USER.displayName);
  users.set('demo', demoUser);
  
  // Create mock users
  for (let i = 0; i < MOCK_USERS.length; i++) {
    const mockUser = MOCK_USERS[i];
    const user = await createOrGetUser(mockUser.email, mockUser.password, mockUser.displayName);
    await createUserProfile(user.uid, mockUser.email, mockUser.profile, mockUser.displayName);
    users.set(`mock${i}`, user);
  }
  
  console.log(`\n✅ Seeded ${users.size} users`);
  return users;
}

async function seedRoomMembers(users: Map<string, CreatedUser>, preferredConcertIds?: string[]): Promise<string[]> {
  console.log('\n🚪 Seeding room members...');
  
  const allUsers = Array.from(users.values());
  let concertIds: string[] = [];

  if (preferredConcertIds && preferredConcertIds.length > 0) {
    concertIds = preferredConcertIds.slice(0, 5);
    console.log(`  Using ${concertIds.length} concert(s) from backend`);
  } else {
    const concertsSnapshot = await db.collection('concerts').get();
    if (concertsSnapshot.empty) {
      console.log('  ⚠ No concerts found. Start backend (npm run dev in backend) or run npm run seed in frontend first.');
      return [];
    }
    concertIds = concertsSnapshot.docs.slice(0, 3).map((d) => d.id);
  }

  for (const concertId of concertIds) {
    const concertRef = db.collection('concerts').doc(concertId);
    const concertDoc = await concertRef.get();
    const concertData = concertDoc.exists ? concertDoc.data() : {};
    const label = concertData?.name || concertData?.artist || concertId;
    
    console.log(`\n  Concert: ${label}`);
    
    // Add all users to this room (members subcollection + attendees for backend)
    for (const user of allUsers) {
      const memberRef = db.collection('concerts').doc(concertId).collection('members').doc(user.uid);
      const existing = await memberRef.get();
      
      if (!existing.exists) {
        await memberRef.set({
          userId: user.uid,
          joinedAt: Timestamp.now(),
        });
        console.log(`    ✓ Added ${user.displayName}`);
      } else {
        console.log(`    ℹ ${user.displayName} already in room`);
      }
    }

    // Set concert.attendees = list of emails so Flask GET /api/rooms/people returns seed users
    const attendeeEmails = allUsers.map((u) => u.email);
    await db.collection('concerts').doc(concertId).set({ attendees: attendeeEmails }, { merge: true });
  }
  
  console.log(`\n✅ Populated ${concertIds.length} concert rooms`);
  return concertIds;
}

async function seedRoomMessages(users: Map<string, CreatedUser>, concertIds: string[]) {
  console.log('\n💬 Seeding room messages...');
  
  if (concertIds.length === 0) {
    console.log('  ⚠ No concert rooms to populate');
    return;
  }
  
  const mockUsers = Array.from(users.entries()).filter(([key]) => key.startsWith('mock'));
  const demoUser = users.get('demo')!;
  const allChatUsers = [demoUser, ...mockUsers.map(([, user]) => user)];
  
  // Add messages to first concert room
  const concertId = concertIds[0];
  const messagesRef = db.collection('concerts').doc(concertId).collection('messages');
  
  // Check if messages already exist
  const existingMessages = await messagesRef.limit(1).get();
  if (!existingMessages.empty) {
    console.log('  ℹ Messages already exist, skipping');
    return;
  }
  
  // Add messages in backend format (user_email, user_name, avatar, content, timestamp) so GET /api/rooms/chat returns them
  const baseTime = Date.now() - (ROOM_MESSAGES.length * 60000); // Start from X minutes ago
  
  for (let i = 0; i < ROOM_MESSAGES.length; i++) {
    const msg = ROOM_MESSAGES[i];
    const user = allChatUsers[msg.userIndex % allChatUsers.length];
    
    await messagesRef.add({
      user_email: user.email,
      user_name: user.displayName,
      avatar: '',
      content: msg.content,
      timestamp: Timestamp.fromMillis(baseTime + (i * 60000)), // 1 minute apart; backend orders by 'timestamp'
    });
    console.log(`  ✓ ${user.displayName}: "${msg.content.substring(0, 30)}..."`);
  }
  
  console.log(`\n✅ Added ${ROOM_MESSAGES.length} room messages`);
}

async function seedConnections(users: Map<string, CreatedUser>, concertIds: string[]): Promise<string[]> {
  console.log('\n🤝 Seeding connections...');
  
  if (concertIds.length === 0) {
    console.log('  ⚠ No concerts for connections');
    return [];
  }
  
  const demoUser = users.get('demo')!;
  const mockUsers = Array.from(users.entries())
    .filter(([key]) => key.startsWith('mock'))
    .map(([, user]) => user);
  
  const connectionIds: string[] = [];
  const connectionsRef = db.collection('connections');
  
  // Check for existing connections
  const existingConnections = await connectionsRef
    .where('requesterId', '==', demoUser.uid)
    .get();
  
  if (!existingConnections.empty) {
    console.log('  ℹ Connections already exist, skipping');
    return existingConnections.docs.map(d => d.id);
  }
  
  // Create 2 incoming requests (others → demo)
  for (let i = 0; i < 2 && i < mockUsers.length; i++) {
    const docRef = await connectionsRef.add({
      concertId: concertIds[0],
      requesterId: mockUsers[i].uid,
      recipientId: demoUser.uid,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ Incoming: ${mockUsers[i].displayName} → Demo (pending)`);
    connectionIds.push(docRef.id);
  }
  
  // Create 2 sent requests (demo → others)
  for (let i = 2; i < 4 && i < mockUsers.length; i++) {
    const docRef = await connectionsRef.add({
      concertId: concertIds[0],
      requesterId: demoUser.uid,
      recipientId: mockUsers[i].uid,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ Sent: Demo → ${mockUsers[i].displayName} (pending)`);
    connectionIds.push(docRef.id);
  }
  
  // Create 2 accepted connections (with threads)
  const acceptedConnections: { connectionId: string; otherUser: CreatedUser }[] = [];
  
  for (let i = 4; i < 6 && i < mockUsers.length; i++) {
    const docRef = await connectionsRef.add({
      concertId: concertIds[0],
      requesterId: demoUser.uid,
      recipientId: mockUsers[i].uid,
      status: 'accepted',
      createdAt: Timestamp.fromMillis(Date.now() - 86400000), // 1 day ago
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ Accepted: Demo ↔ ${mockUsers[i].displayName}`);
    connectionIds.push(docRef.id);
    acceptedConnections.push({ connectionId: docRef.id, otherUser: mockUsers[i] });
  }
  
  // If we don't have enough mock users for accepted, use the first ones
  if (acceptedConnections.length < 2 && mockUsers.length >= 2) {
    // Just use first mock user for accepted connection
    const docRef = await connectionsRef.add({
      concertId: concertIds[0],
      requesterId: demoUser.uid,
      recipientId: mockUsers[0].uid,
      status: 'accepted',
      createdAt: Timestamp.fromMillis(Date.now() - 86400000),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✓ Accepted: Demo ↔ ${mockUsers[0].displayName}`);
    connectionIds.push(docRef.id);
    acceptedConnections.push({ connectionId: docRef.id, otherUser: mockUsers[0] });
  }
  
  console.log(`\n✅ Created ${connectionIds.length} connections`);
  
  // Create threads for accepted connections
  await seedThreads(demoUser, acceptedConnections, concertIds[0]);
  
  return connectionIds;
}

async function seedThreads(
  demoUser: CreatedUser, 
  acceptedConnections: { connectionId: string; otherUser: CreatedUser }[],
  concertId: string
) {
  console.log('\n📱 Seeding threads...');
  
  const threadsRef = db.collection('threads');
  
  for (let i = 0; i < acceptedConnections.length; i++) {
    const { connectionId, otherUser } = acceptedConnections[i];
    
    // Check if thread exists
    const existingThread = await threadsRef.where('connectionId', '==', connectionId).get();
    if (!existingThread.empty) {
      console.log(`  ℹ Thread exists for connection ${connectionId}`);
      continue;
    }
    
    // Create thread
    const isGoingTogether = i === 0; // First thread has mutual going together
    
    const threadRef = await threadsRef.add({
      concertId,
      connectionId,
      participants: [demoUser.uid, otherUser.uid],
      goingTogether: {
        [demoUser.uid]: isGoingTogether,
        [otherUser.uid]: isGoingTogether,
      },
      createdAt: Timestamp.now(),
    });
    
    console.log(`  ✓ Thread with ${otherUser.displayName}${isGoingTogether ? ' (Going Together! 🎉)' : ''}`);
    
    // Add messages to thread
    const messagesRef = threadRef.collection('messages');
    const baseTime = Date.now() - (THREAD_MESSAGES.length * 3600000); // Hours ago
    
    for (let j = 0; j < THREAD_MESSAGES.length; j++) {
      const msg = THREAD_MESSAGES[j];
      await messagesRef.add({
        senderId: msg.fromDemo ? demoUser.uid : otherUser.uid,
        content: msg.content,
        createdAt: Timestamp.fromMillis(baseTime + (j * 3600000)),
      });
    }
    console.log(`    ✓ Added ${THREAD_MESSAGES.length} messages`);
    
    // Add checklist items to first thread
    if (i === 0) {
      const checklistRef = threadRef.collection('checklist');
      for (const item of CHECKLIST_ITEMS) {
        await checklistRef.add({
          title: item.title,
          isCompleted: item.completed,
          assignedTo: null,
          createdBy: demoUser.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      console.log(`    ✓ Added ${CHECKLIST_ITEMS.length} checklist items`);
    }
  }
  
  console.log(`\n✅ Created threads with messages and checklists`);
}

async function clearDemoData() {
  console.log('\n🗑️  Clearing demo data...');
  
  // Get demo user
  try {
    const demoUser = await auth.getUserByEmail(DEMO_USER.email);
    
    // Delete connections involving demo user
    const connectionsAsRequester = await db.collection('connections')
      .where('requesterId', '==', demoUser.uid).get();
    const connectionsAsRecipient = await db.collection('connections')
      .where('recipientId', '==', demoUser.uid).get();
    
    const connectionIds = [
      ...connectionsAsRequester.docs.map(d => d.id),
      ...connectionsAsRecipient.docs.map(d => d.id),
    ];
    
    // Delete threads for these connections
    for (const connectionId of connectionIds) {
      const threads = await db.collection('threads')
        .where('connectionId', '==', connectionId).get();
      
      for (const threadDoc of threads.docs) {
        // Delete thread messages
        const messages = await threadDoc.ref.collection('messages').get();
        for (const msg of messages.docs) {
          await msg.ref.delete();
        }
        // Delete checklist items
        const checklist = await threadDoc.ref.collection('checklist').get();
        for (const item of checklist.docs) {
          await item.ref.delete();
        }
        await threadDoc.ref.delete();
      }
    }
    console.log(`  ✓ Deleted ${connectionIds.length} connections and their threads`);
    
    // Delete connections
    for (const doc of [...connectionsAsRequester.docs, ...connectionsAsRecipient.docs]) {
      await doc.ref.delete();
    }
    
    // Delete room messages involving demo user
    const concerts = await db.collection('concerts').get();
    for (const concert of concerts.docs) {
      const messages = await concert.ref.collection('messages')
        .where('userId', '==', demoUser.uid).get();
      for (const msg of messages.docs) {
        await msg.ref.delete();
      }
      
      // Remove demo from room members
      const memberRef = concert.ref.collection('members').doc(demoUser.uid);
      const member = await memberRef.get();
      if (member.exists) {
        await memberRef.delete();
      }
    }
    console.log('  ✓ Cleared room memberships and messages');
    
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
    console.log('  ℹ Demo user not found, nothing to clear');
  }
  
  // Delete mock users and their data
  for (const mockUser of MOCK_USERS) {
    try {
      const user = await auth.getUserByEmail(mockUser.email);
      
      // Delete user profile
      await db.collection('users').doc(user.uid).delete();
      
      // Delete from all room members
      const concerts = await db.collection('concerts').get();
      for (const concert of concerts.docs) {
        const memberRef = concert.ref.collection('members').doc(user.uid);
        const member = await memberRef.get();
        if (member.exists) {
          await memberRef.delete();
        }
      }
      
      // Delete auth user
      await auth.deleteUser(user.uid);
      console.log(`  ✓ Deleted ${mockUser.email}`);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.log(`  ⚠ Error deleting ${mockUser.email}: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ Demo data cleared');
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  
  console.log('\n🎸 Encore Demo Seed Script\n');
  console.log('═'.repeat(50));
  
  if (shouldClear) {
    await clearDemoData();
    console.log('\n');
    process.exit(0);
  }
  
  // Seed all demo data (prefer backend concert ids so app list and seed data match)
  const users = await seedUsers();
  const backendConcertIds = await ensureBackendConcertsInFirestore();
  const concertIds = await seedRoomMembers(users, backendConcertIds.length > 0 ? backendConcertIds : undefined);
  await seedRoomMessages(users, concertIds);
  await seedConnections(users, concertIds);
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n🎉 Demo data seeded successfully!\n');
  console.log('📋 Demo Account:');
  console.log(`   Email:    ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);
  console.log('\n💡 You can now log in with the demo account to see:');
  console.log('   • Concert rooms with members');
  console.log('   • Room chat messages');
  console.log('   • Incoming connection requests');
  console.log('   • Sent connection requests');
  console.log('   • Accepted connections with threads');
  console.log('   • Private messages and checklists');
  console.log('\nRun: npm run dev\n');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Seed failed:', error);
  process.exit(1);
});
