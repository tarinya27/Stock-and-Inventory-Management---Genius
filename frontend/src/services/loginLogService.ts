import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  loginTime: any;
  logoutTime?: any;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: any;
  updatedAt?: any;
}

/** Fetch client IP (optional, non-blocking) */
export const fetchClientIP = async (): Promise<string | undefined> => {
  try {
    const res = await Promise.race([
      fetch('https://api.ipify.org?format=json'),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    const data = await (res as Response).json();
    return data?.ip;
  } catch {
    return undefined;
  }
};

/** Get device info from navigator */
export const getDeviceInfo = (): string => {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
};

/** Create a new login log on successful login */
export const createLoginLog = async (
  userId: string,
  userName: string,
  role: string,
  ipAddress?: string
): Promise<string> => {
  const now = Timestamp.now();
  const deviceInfo = getDeviceInfo();
  const docRef = await addDoc(collection(db, 'login_logs'), {
    userId,
    userName,
    role,
    loginTime: now,
    logoutTime: null,
    ipAddress: ipAddress || null,
    deviceInfo: deviceInfo || null,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

/** Update the latest login log with logout time (for current user) */
export const updateLogoutForUser = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'login_logs'),
    where('userId', '==', userId),
    orderBy('loginTime', 'desc'),
    limit(10)
  );
  const snapshot = await getDocs(q);
  const openLog = snapshot.docs.find((d) => {
    const data = d.data();
    return data.logoutTime == null || data.logoutTime === undefined;
  });
  if (openLog) {
    await updateDoc(doc(db, 'login_logs', openLog.id), {
      logoutTime: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }
};

/** Get the most recent login record (for "Last Logged In User" widget) */
export const getLatestLoginLog = async (): Promise<LoginLog | null> => {
  const q = query(
    collection(db, 'login_logs'),
    orderBy('loginTime', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    userName: data.userName || 'Unknown',
    role: data.role || 'Unknown',
    loginTime: data.loginTime,
    logoutTime: data.logoutTime,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

/** Get login history with optional date filter (Admin only) */
export const getLoginHistory = async (
  startDate?: Date,
  endDate?: Date
): Promise<LoginLog[]> => {
  let q = query(
    collection(db, 'login_logs'),
    orderBy('loginTime', 'desc'),
    limit(500)
  );
  if (startDate && endDate) {
    q = query(
      collection(db, 'login_logs'),
      where('loginTime', '>=', Timestamp.fromDate(startDate)),
      where('loginTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('loginTime', 'desc'),
      limit(500)
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      userName: data.userName || 'Unknown',
      role: data.role || 'Unknown',
      loginTime: data.loginTime,
      logoutTime: data.logoutTime,
      ipAddress: data.ipAddress,
      deviceInfo: data.deviceInfo,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  });
};
