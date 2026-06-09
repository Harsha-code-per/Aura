import { vi, describe, test, expect, beforeEach } from "vitest";
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signInWithGithub, 
  signOutUser,
} from "@/lib/firebase/auth";
import { 
  addCarbonEntry, 
  getUserEntries, 
  getDailyTotal, 
  getWeeklyData, 
  addCommunityPost
} from "@/lib/firebase/firestore";
import * as firestoreModule from "firebase/firestore";
import * as authModule from "firebase/auth";

// Mock modular Firebase SDKs
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ name: "mock-auth" })),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: "user-123" } })),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class MockGoogleProvider {},
  GithubAuthProvider: class MockGithubProvider {},
  signOut: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
}));

vi.mock("firebase/firestore", () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
    toMillis() {
      return this.seconds * 1000;
    }
    toDate() {
      return new Date(this.toMillis());
    }
  }

  return {
    getFirestore: vi.fn(() => ({ name: "mock-db" })),
    collection: vi.fn(() => ({ type: "collection-ref" })),
    addDoc: vi.fn(() => Promise.resolve({ id: "mock-doc-id" })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

describe("🔥 Firebase Authentication Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("signInWithEmail calls Firebase SDK correctly", async () => {
    const mockSignIn = vi.mocked(authModule.signInWithEmailAndPassword);
    mockSignIn.mockResolvedValueOnce({} as unknown as authModule.UserCredential);

    await signInWithEmail("test@example.com", "password123");
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), "test@example.com", "password123");
  });

  test("signUpWithEmail registers user and updates profile", async () => {
    const mockCreateUser = vi.mocked(authModule.createUserWithEmailAndPassword);
    const mockUpdateProfile = vi.mocked(authModule.updateProfile);

    mockCreateUser.mockResolvedValueOnce({ user: { uid: "user-123" } } as unknown as authModule.UserCredential);
    mockUpdateProfile.mockResolvedValueOnce(undefined as unknown as void);

    await signUpWithEmail("test@example.com", "password123", "John Doe");
    expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), "test@example.com", "password123");
    expect(mockUpdateProfile).toHaveBeenCalledWith({ uid: "user-123" }, { displayName: "John Doe" });
  });

  test("signInWithGoogle opens popup", async () => {
    const mockPopup = vi.mocked(authModule.signInWithPopup);
    mockPopup.mockResolvedValueOnce({} as unknown as authModule.UserCredential);

    await signInWithGoogle();
    expect(mockPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
  });

  test("signInWithGithub opens popup", async () => {
    const mockPopup = vi.mocked(authModule.signInWithPopup);
    mockPopup.mockResolvedValueOnce({} as unknown as authModule.UserCredential);

    await signInWithGithub();
    expect(mockPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
  });

  test("signOutUser calls Firebase signout", async () => {
    const mockSignOut = vi.mocked(authModule.signOut);
    await signOutUser();
    expect(mockSignOut).toHaveBeenCalledWith(expect.anything());
  });
});

describe("📦 Firebase Firestore Database Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("addCarbonEntry sanitizes and adds document to collection", async () => {
    const mockAddDoc = vi.mocked(firestoreModule.addDoc);
    mockAddDoc.mockResolvedValueOnce({ id: "new-entry-123" } as unknown as firestoreModule.DocumentReference);

    const docId = await addCarbonEntry({
      userId: "user-123",
      rawInput: "Had dal rice",
      activities: [{ name: "Dal Rice", category: "food", co2: 0.5 }],
      totalCO2: 0.5,
      tips: ["Eat more grains"],
      date: "2026-06-09",
    });

    expect(docId).toBe("new-entry-123");
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.objectContaining({ type: "collection-ref" }),
      expect.objectContaining({
        userId: "user-123",
        rawInput: "Had dal rice",
        totalCO2: 0.5,
        date: "2026-06-09",
        createdAt: expect.any(Object),
      })
    );
  });

  test("getUserEntries queries and returns user entries", async () => {
    const mockGetDocs = vi.mocked(firestoreModule.getDocs);
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "entry-1",
          data: () => ({
            userId: "user-123",
            rawInput: "Commuted 10km by metro",
            totalCO2: 0.4,
          }),
        },
      ],
    } as unknown as firestoreModule.QuerySnapshot);

    const entries = await getUserEntries("user-123", 5);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("entry-1");
    expect(entries[0].userId).toBe("user-123");
    expect(mockGetDocs).toHaveBeenCalled();
  });

  test("getDailyTotal sums carbon footprint for target date", async () => {
    const mockGetDocs = vi.mocked(firestoreModule.getDocs);
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ totalCO2: 1.5 }) },
        { data: () => ({ totalCO2: 2.2 }) },
      ],
    } as unknown as firestoreModule.QuerySnapshot);

    const total = await getDailyTotal("user-123", "2026-06-09");
    expect(total).toBe(3.7);
    expect(mockGetDocs).toHaveBeenCalled();
  });

  test("getWeeklyData aggregates rolling daily emissions", async () => {
    const mockGetDocs = vi.mocked(firestoreModule.getDocs);
    mockGetDocs.mockResolvedValueOnce({
      docs: [], // Return empty to verify initialization
    } as unknown as firestoreModule.QuerySnapshot);

    const weeklyData = await getWeeklyData("user-123");
    expect(weeklyData).toHaveLength(7);
    expect(weeklyData[0]).toHaveProperty("date");
    expect(weeklyData[0]).toHaveProperty("total", 0);
  });

  test("addCommunityPost sanitizes and writes post", async () => {
    const mockAddDoc = vi.mocked(firestoreModule.addDoc);
    mockAddDoc.mockResolvedValueOnce({ id: "post-123" } as unknown as firestoreModule.DocumentReference);

    await addCommunityPost({
      userId: "user-123",
      displayName: "John Doe",
      content: "Switched to public transit!",
      co2Saved: 1.2,
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.objectContaining({ type: "collection-ref" }),
      expect.objectContaining({
        userId: "user-123",
        displayName: "John Doe",
        content: "Switched to public transit!",
        co2Saved: 1.2,
      })
    );
  });
});
