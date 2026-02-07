import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if concert exists
    const concertRef = adminDb.collection('concerts').doc(params.id);
    const concert = await concertRef.get();

    if (!concert.exists) {
      return NextResponse.json(
        { error: 'Concert not found' },
        { status: 404 }
      );
    }

    // Add user to concert room members
    const memberRef = concertRef.collection('members').doc(userId);
    await memberRef.set({
      userId,
      joinedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to join concert room:', error);
    return NextResponse.json(
      { error: 'Failed to join concert room' },
      { status: 500 }
    );
  }
}
