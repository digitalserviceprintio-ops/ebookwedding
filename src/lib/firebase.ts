import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Guest, GalleryPhoto } from '../types';

// Initialize Firebase App directly with full configuration
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId per Firebase Integration Skill specification
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Verify connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      (error instanceof Error && (
        error.message.includes('the client is offline') ||
        error.message.includes('unavailable') ||
        error.message.includes('backend')
      ))
    ) {
      console.warn('Firebase client operating in offline mode or connecting:', error?.message || error);
    } else {
      console.warn('Firebase test connection check:', error?.message || error);
    }
  }
}

// Error Handling per Firebase Integration Skill Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Clean Guest Payload to guarantee compliance with Firestore and Security Rules (no undefined keys!)
export function cleanGuestForFirestore(guest: Guest, userId: string): Record<string, any> {
  const isMale = guest.gender !== 'wanita';
  const raw: Record<string, any> = {
    id: String(guest.id),
    userId,
    name: (guest.name || 'Tamu Undangan').trim(),
    gender: isMale ? 'pria' : 'wanita',
    origin: (guest.origin || 'Tamu Undangan').trim(),
    category: guest.category || 'Reguler',
    time: guest.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    timestamp: typeof guest.timestamp === 'number' && !isNaN(guest.timestamp) ? guest.timestamp : Date.now(),
    hasEnvelope: Boolean(guest.hasEnvelope),
    hasGift: Boolean(guest.hasGift),
    checkedInBy: guest.checkedInBy || 'Meja Resepsionis A',
    isVerified: typeof guest.isVerified === 'boolean' ? guest.isVerified : true,
    isRsvp: Boolean(guest.isRsvp || guest.checkedInBy?.includes('RSVP')),
    updatedAt: Date.now(),
  };

  if (typeof guest.envelopeNominal === 'number' && !isNaN(guest.envelopeNominal) && guest.envelopeNominal > 0) {
    raw.envelopeNominal = guest.envelopeNominal;
  }
  if (guest.envelopeMethod) {
    raw.envelopeMethod = guest.envelopeMethod;
  }
  if (guest.giftDescription && guest.giftDescription.trim().length > 0) {
    raw.giftDescription = guest.giftDescription.trim();
  }
  if (guest.giftShelf && guest.giftShelf.trim().length > 0) {
    raw.giftShelf = guest.giftShelf.trim();
  }
  if (guest.prayerWish && guest.prayerWish.trim().length > 0) {
    raw.prayerWish = guest.prayerWish.trim();
  }
  if (typeof guest.paxCount === 'number' && !isNaN(guest.paxCount) && guest.paxCount > 0) {
    raw.paxCount = guest.paxCount;
  }
  if (guest.phone && guest.phone.trim().length > 0) {
    raw.phone = guest.phone.trim();
  }
  if (guest.rsvpStatus) {
    raw.rsvpStatus = guest.rsvpStatus;
  }
  if (typeof guest.souvenirTaken === 'boolean') {
    raw.souvenirTaken = guest.souvenirTaken;
  }
  if (typeof guest.souvenirTakenAt === 'number') {
    raw.souvenirTakenAt = guest.souvenirTakenAt;
  }
  if (guest.souvenirItemId) {
    raw.souvenirItemId = guest.souvenirItemId;
  }

  // Filter out any undefined or null keys to avoid Firebase SDK rejection
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Authentication Service Functions
export async function registerWithEmail(
  email: string, 
  pass: string, 
  name: string,
  weddingTitle?: string,
  weddingDate?: string
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  if (name) {
    await updateProfile(user, { displayName: name });
  }

  // Create or set user profile document in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: name || user.email?.split('@')[0] || 'Pengguna Wedding',
      weddingTitle: weddingTitle || 'The Wedding of Kevin & Clarissa',
      weddingDate: weddingDate || '20 September 2026',
      createdAt: Date.now(),
    }, { merge: true });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wedding_active_uid', user.uid);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return user;
}

export async function loginWithEmail(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('wedding_active_uid', userCredential.user.uid);
  }
  return userCredential.user;
}

export async function resetPasswordForEmail(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function loginDemoAccount(label = 'Demo Pengantin') {
  const demoEmail = 'demo.kevinclarissa@wedding.app';
  const demoPassword = 'WeddingDemoPassword2026!';

  let user: User;
  try {
    const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    user = cred.user;
  } catch (err: any) {
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password'
    ) {
      try {
        const createCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        user = createCred.user;
        if (label) {
          await updateProfile(user, { displayName: label });
        }
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          const retryCred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
          user = retryCred.user;
        } else {
          throw createErr;
        }
      }
    } else {
      throw err;
    }
  }

  const userDocRef = doc(db, 'users', user.uid);
  try {
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: demoEmail,
        displayName: label,
        weddingTitle: 'The Wedding of Kevin & Clarissa',
        weddingDate: '20 September 2026',
        createdAt: Date.now(),
      },
      { merge: true }
    );
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wedding_active_uid', user.uid);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Resolver for Target Wedding Organizer UID (used for public RSVP links)
export function getStoredWeddingUid(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('wedding_active_uid') || null;
  }
  return null;
}

// Per-User Guest Data Operations
export function subscribeUserGuests(
  userId: string, 
  callback: (guests: Guest[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/guests`;
  const guestsRef = collection(db, 'users', userId, 'guests');
  const q = query(guestsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q, 
    (snapshot) => {
      const list: Guest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Guest);
      });
      callback(list);
    },
    (err) => {
      console.error('Error fetching guests for user:', userId, err);
      if (onError) onError(err);
      if (err.message?.includes('permission') || (err as any).code === 'permission-denied') {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function saveUserGuest(userId: string, guest: Guest) {
  const path = `users/${userId}/guests/${guest.id}`;
  const guestDocRef = doc(db, 'users', userId, 'guests', guest.id);
  const dataToSave = cleanGuestForFirestore(guest, userId);
  try {
    await setDoc(guestDocRef, dataToSave, { merge: true });
    return dataToSave as Guest;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeUserGuest(userId: string, guestId: string) {
  const path = `users/${userId}/guests/${guestId}`;
  const guestDocRef = doc(db, 'users', userId, 'guests', guestId);
  try {
    await deleteDoc(guestDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Public RSVP Submission Helper: Can be called by unauthenticated guests
export async function submitPublicRSVP(targetUserId: string, guest: Guest) {
  const path = `users/${targetUserId}/guests/${guest.id}`;
  const guestDocRef = doc(db, 'users', targetUserId, 'guests', guest.id);
  const cleanData = cleanGuestForFirestore(
    {
      ...guest,
      isRsvp: true,
      checkedInBy: guest.checkedInBy || 'RSVP Mandiri (Mobile)',
    },
    targetUserId
  );
  try {
    await setDoc(guestDocRef, cleanData, { merge: true });
    return cleanData as Guest;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Per-User Gallery Photos Operations
export function subscribeUserPhotos(
  userId: string, 
  callback: (photos: GalleryPhoto[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/photos`;
  const photosRef = collection(db, 'users', userId, 'photos');
  const q = query(photosRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q, 
    (snapshot) => {
      const list: GalleryPhoto[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as GalleryPhoto);
      });
      callback(list);
    },
    (err) => {
      console.error('Error fetching photos for user:', userId, err);
      if (onError) onError(err);
      if (err.message?.includes('permission') || (err as any).code === 'permission-denied') {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function saveUserPhoto(userId: string, photo: GalleryPhoto) {
  const path = `users/${userId}/photos/${photo.id}`;
  const photoDocRef = doc(db, 'users', userId, 'photos', photo.id);
  const dataToSave = {
    ...photo,
    userId,
    timestamp: photo.timestamp || Date.now(),
  };
  try {
    await setDoc(photoDocRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeUserPhoto(userId: string, photoId: string) {
  const path = `users/${userId}/photos/${photoId}`;
  const photoDocRef = doc(db, 'users', userId, 'photos', photoId);
  try {
    await deleteDoc(photoDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
