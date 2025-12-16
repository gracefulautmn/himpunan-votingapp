import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voterSession, setVoterSession] = useState({
    nim: null,
    email: null,
    isOtpVerified: false,
    programName: null,
    alreadyVoted: null,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        if (adminEmails.includes(currentUser.email) || currentUser.user_metadata?.role === 'admin' || currentUser.app_metadata?.roles?.includes('admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
          if (adminEmails.includes(currentUser.email) || currentUser.user_metadata?.role === 'admin' || currentUser.app_metadata?.roles?.includes('admin')) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setIsAdmin(false);
          setVoterSession({ nim: null, email: null, isOtpVerified: false, programName: null, alreadyVoted: null });
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loginVoter = (nim, email, programName, hasVoted) => {
    setVoterSession({ nim, email, isOtpVerified: false, programName, alreadyVoted: hasVoted });
  };

  const verifyVoterOtp = () => {
    setVoterSession(prev => ({ ...prev, isOtpVerified: true }));
  };

  const voterHasVoted = () => {
    setVoterSession(prev => ({ ...prev, alreadyVoted: true, isOtpVerified: false }));
  }

  const logoutVoter = () => {
    setVoterSession({ nim: null, email: null, isOtpVerified: false, programName: null, alreadyVoted: null });
    router.push('/login');
  };
  
  const adminLogin = async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
  };

  const adminLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setVoterSession({ nim: null, email: null, isOtpVerified: false, programName: null, alreadyVoted: null });
    setLoading(false);
    router.push('/login');
  };

  const value = {
    voterSession,
    loginVoter,
    verifyVoterOtp,
    logoutVoter,
    voterHasVoted,
    user,
    isAdmin,
    adminLogin,
    adminLogout,
    loadingAuth: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
