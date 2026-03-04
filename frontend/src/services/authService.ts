import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { createLoginLog, fetchClientIP, updateLogoutForUser } from './loginLogService';

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Get user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  
  if (!userDoc.exists()) {
    throw new Error(
      'User profile not found. This account exists in Firebase Auth but has no profile in Firestore. ' +
      'Add a document in Firestore: collection "users", document ID: ' + firebaseUser.uid + ' ' +
      '(See ADD_USER_PROFILE.md in the project for steps.)'
    );
  }
  
  const userData = userDoc.data() as User;
  
  // Update last login
  await setDoc(
    doc(db, 'users', firebaseUser.uid),
    { lastLogin: serverTimestamp() },
    { merge: true }
  );
  
  // Create login log (fire-and-forget, non-blocking)
  (async () => {
    try {
      const ip = await fetchClientIP();
      await createLoginLog(
        firebaseUser.uid,
        userData.displayName || userData.email || 'Unknown',
        userData.role,
        ip
      );
    } catch (e) {
      console.error('Login log creation failed:', e);
    }
  })();
  
  return userData;
};

export const logout = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      await updateLogoutForUser(currentUser.uid);
    } catch (e) {
      console.error('Logout log update failed:', e);
    }
  }
  await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      
      if (!firebaseUser) {
        resolve(null);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          resolve(userDoc.data() as User);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        resolve(null);
      }
    });
  });
};

export const createUser = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'store_manager'
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  await updateProfile(firebaseUser, { displayName });
  
  const userData: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName,
    role,
    isActive: true,
    createdAt: serverTimestamp()
  };
  
  await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  
  return userData;
};
