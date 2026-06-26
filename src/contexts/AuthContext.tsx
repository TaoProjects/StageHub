import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasProfile: boolean | null;
  signUp: (email: string, password: string, consentAccepted: boolean) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkMusicianProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('musicians')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking musician profile:', error);
        return false;
      }

      return data !== null;
    } catch (err) {
      console.error('Error checking musician profile:', err);
      return false;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profileExists = await checkMusicianProfile(session.user.id);
        setHasProfile(profileExists);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const profileExists = await checkMusicianProfile(session.user.id);
        setHasProfile(profileExists);
      } else {
        setHasProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      const profileExists = await checkMusicianProfile(session.user.id);
      setHasProfile(profileExists);
    }
  };

  const signUp = async (email: string, password: string, consentAccepted: boolean) => {
    if (!consentAccepted) {
      return { error: new Error('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          consent_accepted_at: new Date().toISOString(),
          consent_version: '1.0',
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setHasProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        hasProfile,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
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
