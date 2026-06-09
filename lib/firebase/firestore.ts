import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

// --- Interfaces ---

export interface CarbonEntry {
  id?: string;
  userId: string;
  date: string; // ISO date string e.g. '2026-06-09'
  activities: {
    name: string;
    category: string;
    detail?: string;
    co2: number;
  }[];
  totalCO2: number;
  rawInput: string;
  tips?: string[];
  createdAt?: Timestamp;
}

export interface CommunityPost {
  id?: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  content: string;
  co2Saved?: number;
  createdAt?: Timestamp;
}

// --- Helpers ---

// Sanitize object properties to prevent Firestore "Unsupported field value: undefined" errors
function sanitizeData(obj: any): any {
  const sanitized: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === "object" && !Array.isArray(obj[key]) && !(obj[key] instanceof Timestamp)) {
        sanitized[key] = sanitizeData(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  });
  return sanitized;
}

// --- Carbon Entries CRUD ---

export async function addCarbonEntry(
  entry: Omit<CarbonEntry, "createdAt" | "date"> & { date?: string }
) {
  const dateStr = entry.date || new Date().toISOString().split("T")[0];
  const sanitized = sanitizeData({
    ...entry,
    date: dateStr,
    createdAt: Timestamp.now(),
  });

  return addDoc(collection(db, "carbonEntries"), sanitized).then((docRef) => docRef.id);
}

export async function getUserEntries(userId: string, limitCount = 10) {
  const q = query(
    collection(db, "carbonEntries"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    fbLimit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (CarbonEntry & { id: string })[];
}

export async function getDailyTotal(userId: string, date: Date | string) {
  const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date;
  const q = query(
    collection(db, "carbonEntries"),
    where("userId", "==", userId),
    where("date", "==", dateStr)
  );
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.docs.forEach((doc) => {
    total += (doc.data() as CarbonEntry).totalCO2;
  });
  return total;
}

export async function getWeeklyData(userId: string) {
  const now = new Date();
  const days: { date: string; total: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const dateStrings: string[] = [];
  
  // Set up past 7 days bucket
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dateStrings.push(dateStr);
    
    const dayLabel = dayNames[d.getDay()];
    days.push({
      date: dayLabel,
      total: 0,
    });
  }

  const q = query(
    collection(db, "carbonEntries"),
    where("userId", "==", userId),
    where("date", ">=", dateStrings[0]),
    where("date", "<=", dateStrings[6])
  );

  const snapshot = await getDocs(q);
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as CarbonEntry;
    const idx = dateStrings.indexOf(data.date);
    if (idx !== -1) {
      days[idx].total += data.totalCO2;
    }
  });

  return days;
}

// --- Community Posts CRUD ---

export async function addCommunityPost(
  post: Omit<CommunityPost, "createdAt">
) {
  const sanitized = sanitizeData({
    ...post,
    createdAt: Timestamp.now(),
  });

  return addDoc(collection(db, "communityPosts"), sanitized).then((docRef) => docRef.id);
}

export function getCommunityFeed(
  callback: (posts: (CommunityPost & { id: string })[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "communityPosts"),
    orderBy("createdAt", "desc"),
    fbLimit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (CommunityPost & { id: string })[];
    callback(posts);
  });
}
