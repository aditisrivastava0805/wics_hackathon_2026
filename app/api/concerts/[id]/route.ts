import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const concertRef = adminDb.collection('concerts').doc(params.id);
    const doc = await concertRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Concert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Failed to fetch concert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concert' },
      { status: 500 }
    );
  }
}
