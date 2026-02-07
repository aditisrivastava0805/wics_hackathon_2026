import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const threadRef = adminDb.collection('threads').doc(params.id);
    const thread = await threadRef.get();

    if (!thread.exists) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    const threadData = thread.data()!;

    // Check if user is a participant
    if (!threadData.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Not authorized to view this thread' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: { id: thread.id, ...threadData },
    });
  } catch (error) {
    console.error('Failed to fetch thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
