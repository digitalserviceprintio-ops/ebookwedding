import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
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
import firebaseConfigData from '../../firebase-applet-config.json';
import { Guest, GalleryPhoto } from '../types';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if specified
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Verify connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline check:', error.message);
    }
  }
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
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: name || user.email?.split('@')[0] || 'Pengguna Wedding',
    weddingTitle: weddingTitle || 'The Wedding of Kevin & Clarissa',
    weddingDate: weddingDate || '20 September 2026',
    createdAt: Date.now(),
  }, { merge: true });

  return user;
}

export async function loginWithEmail(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
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

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Per-User Guest Data Operations
export function subscribeUserGuests(
  userId: string, 
  callback: (guests: Guest[]) => void,
  onError?: (err: Error) => void
) {
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
    }
  );
}

export async function saveUserGuest(userId: string, guest: Guest) {
  const guestDocRef = doc(db, 'users', userId, 'guests', guest.id);
  const dataToSave = {
    ...guest,
    userId,
  };
  await setDoc(guestDocRef, dataToSave, { merge: true });
}

export async function removeUserGuest(userId: string, guestId: string) {
  const guestDocRef = doc(db, 'users', userId, 'guests', guestId);
  await deleteDoc(guestDocRef);
}

// Per-User Gallery Photos Operations
export function subscribeUserPhotos(
  userId: string, 
  callback: (photos: GalleryPhoto[]) => void,
  onError?: (err: Error) => void
) {
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
    }
  );
}

export async function saveUserPhoto(userId: string, photo: GalleryPhoto) {
  const photoDocRef = doc(db, 'users', userId, 'photos', photo.id);
  const dataToSave = {
    ...photo,
    userId,
    timestamp: photo.timestamp || Date.now(),
  };
  await setDoc(photoDocRef, dataToSave, { merge: true });
}

export async function removeUserPhoto(userId: string, photoId: string) {
  const photoDocRef = doc(db, 'users', userId, 'photos', photoId);
  await deleteDoc(photoDocRef);
}
