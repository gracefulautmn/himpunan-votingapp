import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { LogOut, UserCircle, Shield } from 'lucide-react'; // Example icons

export default function Layout({ children }) {
  const { user, isAdmin, adminLogout, logoutVoter, voterSession } = useAuth();
  const { settings, loadingSettings } = useAppSettings();
  
  const commonHeader = !loadingSettings && (
    <div className="absolute top-4 left-4 flex items-center z-20">
      <Image 
        src={settings.header_logo1_url || '/logo.png'} 
        alt="Logo 1" 
        width={60} 
        height={60} 
        className="rounded-md" 
        onError={(e) => e.target.src = 'https://placehold.co/60x60/CCCCCC/333333?text=Logo1'}
      />
      <div className="border-l border-gray-800 dark:border-gray-300 mx-4 h-10"></div>
      <Image 
        src={settings.header_logo2_url || '/logo2.png'} 
        alt="Logo 2" 
        width={40} 
        height={60} 
        className="rounded-md"
        onError={(e) => e.target.src = 'https://placehold.co/40x60/CCCCCC/333333?text=Logo2'}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-300 dark:from-gray-900 dark:to-blue-900 text-gray-800 dark:text-gray-200">
      <header className="relative p-4">
        {/* Common logos for non-admin pages or general layout */}
        {/* For admin pages, AdminLayout might have its own header */}
        {/* This header is simplified; adjust based on whether it's an admin page or voter page */}
        {/* {commonHeader} */}
        
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-3">
          {isAdmin && user && (
            <>
              <Link href="/admin" passHref className="text-sm font-medium hover:text-indigo-500 flex items-center">
                <Shield size={18} className="mr-1" /> Admin Dashboard
              </Link>
              <button 
                onClick={adminLogout}
                className="text-sm font-medium hover:text-red-500 flex items-center"
                title="Logout Admin"
              >
                <LogOut size={18} className="mr-1" /> Logout
              </button>
            </>
          )}
        
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="text-center p-4 text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} Sistem Voting Online - Universitas Pertamina. All rights reserved.
      </footer>
    </div>
  );
}
