/**
 * Seed script for Encore
 * 
 * Run with: npm run seed
 * 
 * Make sure you have set up your Firebase Admin credentials in .env.local
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

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

// Mock concert data for Austin venues
const mockConcerts = [
  {
    name: 'Midnight Sun Tour',
    artist: 'Taylor Swift',
    venue: 'Moody Center',
    date: Timestamp.fromDate(new Date('2026-03-15T20:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    genre: 'Pop',
    priceRange: '$150-400',
  },
  {
    name: 'Good Kid, m.A.A.d City Anniversary',
    artist: 'Kendrick Lamar',
    venue: 'Austin360 Amphitheater',
    date: Timestamp.fromDate(new Date('2026-03-22T19:30:00')),
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    genre: 'Hip-Hop',
    priceRange: '$80-200',
  },
  {
    name: 'Indie Night',
    artist: 'Phoebe Bridgers',
    venue: 'Stubb\'s BBQ',
    date: Timestamp.fromDate(new Date('2026-03-28T21:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    genre: 'Indie',
    priceRange: '$45-75',
  },
  {
    name: 'Country Nights',
    artist: 'Morgan Wallen',
    venue: 'Moody Center',
    date: Timestamp.fromDate(new Date('2026-04-05T19:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    genre: 'Country',
    priceRange: '$60-150',
  },
  {
    name: 'Electronic Dreams',
    artist: 'ODESZA',
    venue: 'Austin360 Amphitheater',
    date: Timestamp.fromDate(new Date('2026-04-12T20:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    genre: 'Electronic',
    priceRange: '$50-120',
  },
  {
    name: 'Rock Revival',
    artist: 'Foo Fighters',
    venue: 'Circuit of the Americas',
    date: Timestamp.fromDate(new Date('2026-04-18T19:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800',
    genre: 'Rock',
    priceRange: '$75-200',
  },
  {
    name: 'R&B Vibes',
    artist: 'SZA',
    venue: 'Moody Center',
    date: Timestamp.fromDate(new Date('2026-04-25T20:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    genre: 'R&B',
    priceRange: '$70-180',
  },
  {
    name: 'Latin Heat',
    artist: 'Bad Bunny',
    venue: 'Moody Center',
    date: Timestamp.fromDate(new Date('2026-05-02T21:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    genre: 'Latin',
    priceRange: '$100-300',
  },
  {
    name: 'Jazz Under the Stars',
    artist: 'Kamasi Washington',
    venue: 'The Long Center',
    date: Timestamp.fromDate(new Date('2026-05-10T19:30:00')),
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    genre: 'Jazz',
    priceRange: '$35-80',
  },
  {
    name: 'Acoustic Sessions',
    artist: 'John Mayer',
    venue: 'ACL Live at The Moody Theater',
    date: Timestamp.fromDate(new Date('2026-05-17T20:00:00')),
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    genre: 'Pop',
    priceRange: '$90-250',
  },
];

async function seedConcerts() {
  console.log('🎵 Seeding concerts...');

  const concertsRef = db.collection('concerts');

  for (const concert of mockConcerts) {
    const docRef = await concertsRef.add({
      ...concert,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ Added: ${concert.name} by ${concert.artist} (${docRef.id})`);
  }

  console.log(`\n✅ Seeded ${mockConcerts.length} concerts!\n`);
}

async function clearConcerts() {
  console.log('🗑️  Clearing existing concerts...');

  const concertsRef = db.collection('concerts');
  const snapshot = await concertsRef.get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`  ✓ Cleared ${snapshot.size} concerts\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  console.log('\n🚀 Encore Seed Script\n');

  if (shouldClear) {
    await clearConcerts();
  }

  await seedConcerts();

  console.log('Done! You can now run the app with: npm run dev\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
