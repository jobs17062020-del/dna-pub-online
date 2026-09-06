import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { get, getDatabase, onValue, ref, serverTimestamp, set, type Unsubscribe } from "firebase/database";

export type CloudEntry = {
  id: string;
  last5: string;
  legacy?: boolean;
  image?: string;
  imageHash?: string;
  createdAt: string;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const cloudEnabled = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = cloudEnabled ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const database = firebaseApp ? getDatabase(firebaseApp) : null;
const workspaceId = import.meta.env.VITE_FIREBASE_WORKSPACE_ID || "dna-pub-default";

const entriesPath = () => `workspaces/${workspaceId}/entries`;

export const watchCloudAuth = (callback: (user: User | null) => void): Unsubscribe | (() => void) => {
  if (!auth) { callback(null); return () => undefined; }
  return onAuthStateChanged(auth, callback);
};

export const signInCloud = (email: string, password: string) => {
  if (!auth) throw new Error("Firebase ยังไม่ได้ตั้งค่า");
  return signInWithEmailAndPassword(auth, email, password);
};

export const createCloudAccount = (email: string, password: string) => {
  if (!auth) throw new Error("Firebase ยังไม่ได้ตั้งค่า");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOutCloud = () => auth ? signOut(auth) : Promise.resolve();

export const watchCloudEntries = (user: User | null, callback: (entries: CloudEntry[]) => void): Unsubscribe | (() => void) => {
  if (!database || !user) { callback([]); return () => undefined; }
  return onValue(ref(database, entriesPath()), (snapshot) => {
    const value = snapshot.val();
    const entries = Array.isArray(value) ? value : value?.entries;
    callback(Array.isArray(entries) ? entries.filter(Boolean) as CloudEntry[] : []);
  });
};

export const loadCloudEntries = async (user: User) => {
  if (!database) throw new Error("Firebase ยังไม่ได้ตั้งค่า");
  const snapshot = await get(ref(database, entriesPath()));
  const value = snapshot.val();
  const entries = Array.isArray(value) ? value : value?.entries;
  return Array.isArray(entries) ? entries.filter(Boolean) as CloudEntry[] : [];
};

export const saveCloudEntries = async (user: User, entries: CloudEntry[]) => {
  if (!database) throw new Error("Firebase ยังไม่ได้ตั้งค่า");
  await set(ref(database, entriesPath()), {
    entries,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  });
};

export { cloudEnabled as isFirebaseConfigured };
