import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./config";

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(credential.user, { displayName });
  return credential;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithGithub() {
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: import("firebase/auth").User | null) => void) {
  return auth.onAuthStateChanged(callback);
}
