import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Supabase auth user
  const [voterProfile, setVoterProfile] = useState(null); // Data dari tabel 'users'
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchVoterProfile(session.user);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchVoterProfile(session.user);
        } else {
          setVoterProfile(null);
        }
        setLoading(false);
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setVoterProfile(null);
          // Redirect to login if not on public pages after sign out
          if (!['/login', '/verify'].includes(router.pathname)) {
             // router.push('/login'); // Or handle as needed
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchVoterProfile = async (authUser) => {
    if (!authUser) return;
    try {
      // Assuming NIM is stored in user_metadata or you have a mapping.
      // For this example, let's assume email is the link for fetching from 'users' table initially.
      // Or, if you create users in your 'users' table with an ID linked to auth.uid(), use that.
      // This part needs careful design based on how you link Supabase Auth users to your 'users' table.
      // For now, let's assume we query by email if voterProfile is not set by NIM directly.
      // A common pattern: your 'users' table's PK (NIM) might incorporate auth.uid() or have a separate auth_user_id column.
      
      // This is a placeholder. You need to define how an authenticated Supabase user
      // maps to a record in your public.users table.
      // If login is NIM/Email based and doesn't create a Supabase Auth user initially,
      // this context might be more about session management post-OTP verification.

      // If your flow is:
      // 1. Enter NIM/Email (not Supabase Auth login)
      // 2. Verify OTP
      // 3. Store session (e.g., in localStorage or a cookie) with NIM
      // Then this AuthContext would manage that custom session.

      // Given the Supabase RLS and functions, it's more likely you'll have
      // a Supabase Auth user created/signed-in after OTP for secure calls.
      // Let's assume for now that after OTP, you might sign in the user with Supabase Auth
      // using a custom token or by linking their NIM to an auth user.

      // For simplicity, if the user is a Supabase authenticated user (e.g., admin)
      // their profile might be different.
      // This context is more geared towards the VOTER flow.
      // Admin auth might be handled slightly differently or use the same Supabase user object.

      // console.log("Fetching voter profile for user:", authUser);
      // This is a placeholder for fetching detailed voter profile from your 'users' table
      // after a user is considered "logged in" (e.g., post-OTP for voters, or Supabase login for admin)
    } catch (error) {
      console.error('Error fetching voter profile:', error);
    }
  };


  // This context might be more about managing the *voter's session state* (NIM, email, OTP status)
  // rather than a full Supabase Auth user object if voters don't do a full Supabase Auth sign-in.
  // Let's adjust to a simpler session model for voters for now.
  const [voterSession, setVoterSession] = useState({
    nim: null,
    email: null,
    isOtpVerified: false,
    programName: null, // To display on vote page
    alreadyVoted: null, // from users table
  });
  const [isAdmin, setIsAdmin] = useState(false);


  // Effect to check Supabase auth state for admin users
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        if (currentUser) {
          // Check if the logged-in Supabase user is an admin
          // This could be based on email, a custom claim, or a role in your database
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
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const loginVoter = (nim, email, programName, hasVoted) => {
    setVoterSession({ nim, email, isOtpVerified: false, programName, alreadyVoted: hasVoted });
  };

  const verifyVoterOtp = () => {
    setVoterSession(prev => ({ ...prev, isOtpVerified: true }));
  };

  const voterHasVoted = () => {
    setVoterSession(prev => ({ ...prev, alreadyVoted: true, isOtpVerified: false })); // Reset OTP state
  }

  const logoutVoter = () => {
    setVoterSession({ nim: null, email: null, isOtpVerified: false, programName: null, alreadyVoted: null });
    router.push('/login');
  };
  
  // Supabase auth functions for admin
  const adminLogin = async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
    // onAuthStateChange will handle setting user and isAdmin
  };

  const adminLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setVoterSession({ nim: null, email: null, isOtpVerified: false, programName: null, alreadyVoted: null }); // Clear voter session too
    setLoading(false);
    router.push('/login'); // Or admin login page
  };


  const value = {
    // Voter session
    voterSession,
    loginVoter,
    verifyVoterOtp,
    logoutVoter,
    voterHasVoted,
    // Supabase auth (primarily for admin)
    user, // Supabase auth user object
    isAdmin,
    adminLogin,
    adminLogout,
    // General
    loadingAuth: loading, // Renamed to avoid conflict if there's other loading state
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
