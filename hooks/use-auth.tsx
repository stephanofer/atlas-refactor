'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
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
  
  const initializedRef = useRef(false);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (initializedRef.current) {
      console.log('[Auth] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;
    
    console.log('[Auth] Starting initialization...');

    // Simple async function to initialize
    const init = async () => {
      try {
        // 1. Get current session
        console.log('[Auth] Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          setLoading(false);
          return;
        }

        console.log('[Auth] Session:', session ? session.user.email : 'none');

        if (!session?.user) {
          console.log('[Auth] No session, done loading');
          setLoading(false);
          return;
        }

        // 2. Set user immediately
        setUser(session.user);

        // 3. Fetch profile
        console.log('[Auth] Fetching profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*, area:areas(*), company:companies(*)')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('[Auth] Profile error:', profileError);
        } else {
          console.log('[Auth] Profile loaded:', profileData?.full_name);
          setProfile(profileData as User);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        console.log('[Auth] Done loading');
        setLoading(false);
      }
    };

    init();

    // Listen for future auth changes (login/logout after init)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth changed:', event);
        
        // Only handle actual changes, not the initial event
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('users')
            .select('*, area:areas(*), company:companies(*)')
            .eq('id', session.user.id)
            .single();
          if (data) setProfile(data as User);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('*, area:areas(*), company:companies(*)')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data as User);
  };

  console.log('[Auth] Render - loading:', loading, 'profile:', profile?.full_name || 'null');

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
