import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logSecurityEvent } from '../lib/securityLogger';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // CEK CACHE DULU - langsung tampilkan dari localStorage
    const cachedUser = localStorage.getItem('fb-user');
    if (cachedUser) {
      try {
        const cached = JSON.parse(cachedUser);
        if (cached.user && cached.expires > Date.now()) {
          setUser(cached.user);
          if (cached.profile) setProfile(cached.profile);
          setLoading(false);
        }
      } catch (e) { }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        // Map to simpler user object format if needed, or just use firebaseUser
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
        };
        setUser(userData);
        localStorage.setItem('fb-user', JSON.stringify({
          user: userData,
          expires: Date.now() + 3600000
        }));
        await fetchProfile(firebaseUser.uid, firebaseUser.email);
      } else {
        localStorage.removeItem('fb-user');
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function fetchProfile(userId, email) {
    try {
      // Cek cache profile
      const cachedProfile = localStorage.getItem(`profile-${userId}`);
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }

      // Fetch fresh data di background
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Add ID to profile data to match Supabase response behavior
        let profileData = { id: userId, ...data };

        if (email === 'nickxmn6@gmail.com') {
          profileData.role = 'dev';
          if (data.role !== 'dev') updateDoc(docRef, { role: 'dev' });
        }

        setProfile(profileData);
        localStorage.setItem(`profile-${userId}`, JSON.stringify(profileData));
      } else {
        // Create new profile if it doesn't exist
        const newProfile = {
          username: email?.split('@')[0] || 'User',
          email: email || null,
          role: email === 'nickxmn6@gmail.com' ? 'dev' : 'user',
          status: 'active'
        };
        await setDoc(docRef, newProfile);

        const profileData = { id: userId, ...newProfile };
        setProfile(profileData);
        localStorage.setItem(`profile-${userId}`, JSON.stringify(profileData));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function signUp(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create profile in Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        username: username || email.split('@')[0],
        email: email,
        role: email === 'nickxmn6@gmail.com' ? 'dev' : 'user',
        status: 'active'
      });

      logSecurityEvent('SIGN_UP', user.uid, email, { username });
      return { data: { user }, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      logSecurityEvent('SIGN_UP_FAILED', null, email, { error: error.message });
      return { data: null, error };
    }
  }

  async function signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        id: user.uid,
        email: user.email,
      };

      localStorage.setItem('fb-user', JSON.stringify({
        user: userData,
        expires: Date.now() + 3600000
      }));
      await fetchProfile(user.uid, user.email);

      logSecurityEvent('SIGN_IN', user.uid, user.email);
      return { data: { user: userData }, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      logSecurityEvent('SIGN_IN_FAILED', null, email, { error: error.message });
      return { data: null, error };
    }
  }

  async function signOut() {
    try {
      const userId = user?.id;
      const userEmail = user?.email;
      setUser(null);
      setProfile(null);
      localStorage.removeItem('fb-user');
      if (userId) localStorage.removeItem(`profile-${userId}`);

      await firebaseSignOut(auth);
      if (userId) logSecurityEvent('SIGN_OUT', userId, userEmail);
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  }

  async function updateProfile(updates) {
    try {
      const docRef = doc(db, 'profiles', user.id);
      await updateDoc(docRef, updates);

      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorage.setItem(`profile-${user.id}`, JSON.stringify(updatedProfile));

      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}