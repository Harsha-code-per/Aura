"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthChange } from "@/lib/firebase/auth";

interface AuraUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AuraUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuraUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthChange wraps both Firebase onAuthStateChanged and mock subscriber
    const unsubscribe = onAuthChange((currentUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
