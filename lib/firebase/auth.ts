import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { UserProfile } from '@/lib/types';

const UT_EMAIL_DOMAIN = '@utexas.edu';

export function isValidUTEmail(email: string): boolean {
  return email.toLowerCase().endsWith(UT_EMAIL_DOMAIN);
}

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  if (!isValidUTEmail(email)) {
    throw new Error('Only @utexas.edu emails are allowed');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile document
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName,
    avatarUrl: null,
    bio: null,
    spotifyConnected: false,
    musicPreferences: { genres: [], artists: [] },
    budgetRange: 'flexible',
    genderPref: 'any',
    concertVibes: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  
  return null;
}
