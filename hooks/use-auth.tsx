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
  
  // Use ref to prevent multiple initializations
  const initializedRef = useRef(false);
  const supabaseRef = useRef(createClient());
  
  const supabase = supabaseRef.current;

  // Initialize auth - runs only once
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializedRef.current) {
      console.log('[Auth] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;
    
    console.log('[Auth] Starting initialization...');
    let mounted = true;

    const fetchProfile = async (userId: string): Promise<User | null> => {
      console.log('[Auth] Fetching profile for user:', userId);
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
          console.error('[Auth] Error fetching profile:', error);
          return null;
        }
        
        console.log('[Auth] Profile fetched successfully');
        return data as User;
      } catch (error) {
        console.error('[Auth] Error in fetchProfile:', error);
        return null;
      }
    };

    const initializeAuth = async () => {
      console.log('[Auth] Getting current user...');
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('[Auth] Error getting user:', error);
        }
        
        if (!mounted) {
          console.log('[Auth] Component unmounted during init');
          return;
        }
        
        console.log('[Auth] Current user:', authUser ? authUser.email : 'none');
        
        if (authUser) {
          setUser(authUser);
          const profileData = await fetchProfile(authUser.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('[Auth] Initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    console.log('[Auth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (!mounted) {
          console.log('[Auth] Component unmounted, ignoring auth change');
          return;
        }
        
        const currentUser = session?.user ?? null;
        console.log('[Auth] New user:', currentUser ? currentUser.email : 'none');
        
        setUser(currentUser);
        
        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('[Auth] Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - runs only once

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] SignOut error:', error);
        throw error;
      }
      setUser(null);
      setProfile(null);
      console.log('[Auth] Sign out successful');
    } catch (error) {
      console.error('[Auth] Error in signOut:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('[Auth] Refreshing profile...');
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          area:areas(*),
          company:companies(*)
        `)
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setProfile(data as User);
        console.log('[Auth] Profile refreshed');
      }
    }
  };

  console.log('[Auth] Render - loading:', loading, 'user:', user?.email, 'profile:', profile?.full_name);

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
