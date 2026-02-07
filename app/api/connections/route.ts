import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
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

    const connectionsRef = adminDb.collection('connections');

    // Get connections where user is requester or recipient
    const [asRequester, asRecipient] = await Promise.all([
      connectionsRef.where('requesterId', '==', userId).get(),
      connectionsRef.where('recipientId', '==', userId).get(),
    ]);

    const connections: any[] = [];

    asRequester.docs.forEach((doc) => {
      connections.push({ id: doc.id, ...doc.data() });
    });

    asRecipient.docs.forEach((doc) => {
      connections.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ data: connections });
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const requesterId = decodedToken.uid;

    const { concertId, recipientId } = await request.json();

    if (!concertId || !recipientId) {
      return NextResponse.json(
        { error: 'concertId and recipientId are required' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const connectionsRef = adminDb.collection('connections');
    const existing = await connectionsRef
      .where('concertId', '==', concertId)
      .where('requesterId', '==', requesterId)
      .where('recipientId', '==', recipientId)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 400 }
      );
    }

    const docRef = await connectionsRef.add({
      concertId,
      requesterId,
      recipientId,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      data: { id: docRef.id, success: true },
    });
  } catch (error) {
    console.error('Failed to create connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}
