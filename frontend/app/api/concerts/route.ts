import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const concertsRef = adminDb.collection('concerts');
    const snapshot = await concertsRef.orderBy('date', 'asc').get();

    const concerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ data: concerts });
  } catch (error) {
    console.error('Failed to fetch concerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concerts' },
      { status: 500 }
    );
  }
}
