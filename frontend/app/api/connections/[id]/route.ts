import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    const { status } = await request.json();

    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const connectionRef = adminDb.collection('connections').doc(params.id);
    const connection = await connectionRef.get();

    if (!connection.exists) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const connectionData = connection.data()!;

    // Only recipient can accept/decline
    if (connectionData.recipientId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this connection' },
        { status: 403 }
      );
    }

    await connectionRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // If accepted, create a private thread
    if (status === 'accepted') {
      const threadsRef = adminDb.collection('threads');
      await threadsRef.add({
        concertId: connectionData.concertId,
        connectionId: params.id,
        participants: [connectionData.requesterId, connectionData.recipientId],
        goingTogether: {
          [connectionData.requesterId]: false,
          [connectionData.recipientId]: false,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to update connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}
