'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    // Fetch profile helper
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('*, area:areas(*), company:companies(*)')
        .eq('id', userId)
        .maybeSingle();
      return data as User | null;
    };

    // Use onAuthStateChange as the ONLY source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth] Event:', event, session?.user?.email || 'no user');
        
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Fetch profile
          const profileData = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profileData);
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Also check initial session (for page refresh)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      console.log('[Auth] Initial session:', session?.user?.email || 'none');
      
      if (!isMounted) return;
      
      // If no session, stop loading
      if (!session) {
        setLoading(false);
      }
      // If session exists, onAuthStateChange will handle it
    };
    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('*, area:areas(*), company:companies(*)')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data as User);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
