import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(
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

    if (!threadData.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { confirmed } = await request.json();

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'confirmed must be a boolean' },
        { status: 400 }
      );
    }

    await threadRef.update({
      [`goingTogether.${userId}`]: confirmed,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to update going together:', error);
    return NextResponse.json(
      { error: 'Failed to update going together' },
      { status: 500 }
    );
  }
}
