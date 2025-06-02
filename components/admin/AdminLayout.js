// components/admin/AdminLayout.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SideNav from './SideNav';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading'; // General loading component

export default function AdminLayout({ children, pageTitle = "Admin Dashboard" }) {
  const { isAdmin, user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth) {
      if (!user || !isAdmin) {
        router.push('/admin/login'); // Redirect to admin login if not authenticated as admin
      }
    }
  }, [user, isAdmin, loadingAuth, router]);

  if (loadingAuth) {
    return <Loading message="Memverifikasi sesi admin..." />;
  }

  // This check is crucial to prevent rendering admin layout for non-admins before redirect effect kicks in
  if (!user || !isAdmin) {
    // While redirecting, show loading or null to avoid flashing content
    return <Loading message="Mengalihkan ke halaman login admin..." />; 
  }

  return (
    <>
      <Head>
        <title>{pageTitle} - Admin Panel</title>
        <meta name="robots" content="noindex, nofollow" /> {/* Prevent indexing of admin pages */}
      </Head>
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
        <SideNav />
        <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
          {/* Optional: Add a header bar here if needed */}
          {/* <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{pageTitle}</h1>
          </div> */}
          {children}
        </main>
      </div>
    </>
  );
}
