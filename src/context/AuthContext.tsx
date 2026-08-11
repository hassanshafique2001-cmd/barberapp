import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToAuthState,
  getUserProfile,
  updateUserPushToken,
  registerForPushNotificationsAsync,
  type UserProfile,
} from '@barber/shared';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          setProfile(await getUserProfile(nextUser.uid));
        } catch {
          setProfile(null);
        }
        registerForPushNotificationsAsync()
          .then((token) => {
            if (token) return updateUserPushToken(nextUser.uid, token);
          })
          .catch(() => {});
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
