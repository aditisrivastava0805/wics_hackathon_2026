import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Concert,
  RoomMember,
  RoomMessage,
  Connection,
  Thread,
  ThreadMessage,
  ChecklistItem,
} from '@/lib/types';

// ============ CONCERTS ============

export async function getConcerts(): Promise<Concert[]> {
  const concertsRef = collection(db, 'concerts');
  const q = query(concertsRef, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Concert[];
}

export async function getConcert(concertId: string): Promise<Concert | null> {
  const docRef = doc(db, 'concerts', concertId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Concert;
  }
  
  return null;
}

// ============ CONCERT ROOM ============

export async function joinConcertRoom(concertId: string, userId: string): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  const memberRef = doc(db, 'concerts', concertId, 'members', userId);
  await setDoc(memberRef, {
    userId,
    joinedAt: serverTimestamp(),
  }, { merge: true });
}

export async function leaveConcertRoom(concertId: string, userId: string): Promise<void> {
  const memberRef = doc(db, 'concerts', concertId, 'members', userId);
  await deleteDoc(memberRef);
}

export async function getRoomMembers(concertId: string): Promise<RoomMember[]> {
  const membersRef = collection(db, 'concerts', concertId, 'members');
  const snapshot = await getDocs(membersRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as RoomMember[];
}

export function subscribeToRoomMembers(
  concertId: string,
  callback: (members: RoomMember[]) => void
): () => void {
  const membersRef = collection(db, 'concerts', concertId, 'members');
  
  return onSnapshot(membersRef, (snapshot) => {
    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomMember[];
    callback(members);
  });
}

export function subscribeToRoomMessages(
  concertId: string,
  callback: (messages: RoomMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'concerts', concertId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomMessage[];
    callback(messages);
  });
}

export async function sendRoomMessage(
  concertId: string,
  userId: string,
  content: string
): Promise<void> {
  const messagesRef = collection(db, 'concerts', concertId, 'messages');
  await addDoc(messagesRef, {
    userId,
    content,
    createdAt: serverTimestamp(),
  });
}

// ============ CONNECTIONS ============

export async function requestConnection(
  concertId: string,
  requesterId: string,
  recipientId: string
): Promise<string> {
  const connectionsRef = collection(db, 'connections');
  const docRef = await addDoc(connectionsRef, {
    concertId,
    requesterId,
    recipientId,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateConnectionStatus(
  connectionId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const connectionRef = doc(db, 'connections', connectionId);
  await updateDoc(connectionRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  // If accepted, create a private thread (only if one doesn't exist yet)
  if (status === 'accepted') {
    const connectionSnap = await getDoc(connectionRef);
    if (connectionSnap.exists()) {
      const connection = connectionSnap.data();
      const existing = await getDocs(
        query(collection(db, 'threads'), where('connectionId', '==', connectionId))
      );
      if (existing.empty) {
        await createThread(
          connection.concertId,
          connectionId,
          connection.requesterId,
          connection.recipientId
        );
      }
    }
  }
}

export async function getUserConnections(userId: string): Promise<Connection[]> {
  const connectionsRef = collection(db, 'connections');
  
  // Get connections where user is requester or recipient
  const asRequester = query(connectionsRef, where('requesterId', '==', userId));
  const asRecipient = query(connectionsRef, where('recipientId', '==', userId));
  
  const [requesterSnap, recipientSnap] = await Promise.all([
    getDocs(asRequester),
    getDocs(asRecipient),
  ]);
  
  const connections: Connection[] = [];
  
  requesterSnap.docs.forEach((doc) => {
    connections.push({ id: doc.id, ...doc.data() } as Connection);
  });
  
  recipientSnap.docs.forEach((doc) => {
    connections.push({ id: doc.id, ...doc.data() } as Connection);
  });
  
  return connections;
}

// ============ THREADS ============

async function createThread(
  concertId: string,
  connectionId: string,
  user1Id: string,
  user2Id: string
): Promise<string> {
  const threadsRef = collection(db, 'threads');
  const docRef = await addDoc(threadsRef, {
    concertId,
    connectionId,
    participants: [user1Id, user2Id],
    goingTogether: {
      [user1Id]: false,
      [user2Id]: false,
    },
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const docRef = doc(db, 'threads', threadId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Thread;
  }
  
  return null;
}

export async function getUserThreads(userId: string): Promise<Thread[]> {
  const threadsRef = collection(db, 'threads');
  const q = query(threadsRef, where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Thread[];
}

export function subscribeToThreadMessages(
  threadId: string,
  callback: (messages: ThreadMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'threads', threadId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ThreadMessage[];
    callback(messages);
  });
}

export async function sendThreadMessage(
  threadId: string,
  senderId: string,
  content: string
): Promise<void> {
  const messagesRef = collection(db, 'threads', threadId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    content,
    createdAt: serverTimestamp(),
  });
}

export async function updateGoingTogether(
  threadId: string,
  userId: string,
  confirmed: boolean
): Promise<void> {
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, {
    [`goingTogether.${userId}`]: confirmed,
  });
}

// ============ CHECKLIST ============

export async function getChecklistItems(threadId: string): Promise<ChecklistItem[]> {
  const checklistRef = collection(db, 'threads', threadId, 'checklist');
  const q = query(checklistRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ChecklistItem[];
}

export async function createChecklistItem(
  threadId: string,
  title: string,
  createdBy: string,
  assignedTo?: string
): Promise<string> {
  const checklistRef = collection(db, 'threads', threadId, 'checklist');
  const docRef = await addDoc(checklistRef, {
    title,
    isCompleted: false,
    assignedTo: assignedTo || null,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChecklistItem(
  threadId: string,
  itemId: string,
  updates: Partial<Pick<ChecklistItem, 'title' | 'isCompleted' | 'assignedTo'>>
): Promise<void> {
  const itemRef = doc(db, 'threads', threadId, 'checklist', itemId);
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChecklistItem(threadId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, 'threads', threadId, 'checklist', itemId);
  await deleteDoc(itemRef);
}
