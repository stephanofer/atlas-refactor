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

// Global flag to prevent double init in strict mode
let isInitializing = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prevent concurrent initializations
    if (isInitializing) {
      console.log('[Auth] Already initializing, waiting...');
      return;
    }
    isInitializing = true;
    
    const supabase = createClient();
    let isMounted = true;
    
    console.log('[Auth] Initializing...');

    const initialize = async () => {
      try {
        // Get session first (faster, uses cached data)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] Session:', session?.user?.email || 'none');

        if (!isMounted) return;

        if (!session?.user) {
          setLoading(false);
          isInitializing = false;
          return;
        }

        setUser(session.user);

        // Fetch profile
        const { data: profileData, error } = await supabase
          .from('users')
          .select('*, area:areas(*), company:companies(*)')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('[Auth] Profile:', profileData?.full_name || 'error:', error?.message);

        if (isMounted && profileData) {
          setProfile(profileData as User);
        }
      } catch (err) {
        console.error('[Auth] Error:', err);
      } finally {
        if (isMounted) {
          console.log('[Auth] Done');
          setLoading(false);
          isInitializing = false;
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth] Event:', event);
        
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('users')
            .select('*, area:areas(*), company:companies(*)')
            .eq('id', session.user.id)
            .maybeSingle();
          if (data && isMounted) setProfile(data as User);
        }
      }
    );

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
