'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  const [initialized, setInitialized] = useState(false);
  
  // Memoize the supabase client
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          area:areas(*),
          company:companies(*)
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as User;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    }
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
        }
        
        if (!mounted) return;
        
        if (authUser) {
          setUser(authUser);
          const profileData = await fetchProfile(authUser.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
        
        // Only update loading if already initialized (for subsequent auth changes)
        if (initialized) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, initialized]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
        throw error;
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  }, [supabase]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }), [user, profile, loading, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
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
