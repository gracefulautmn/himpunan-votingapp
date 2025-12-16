import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, LogIn, Mail, Key } from 'lucide-react';

import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';

const adminLoginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin, isAdmin, user, loadingAuth } = useAuth();
  const { settings, loadingSettings } = useAppSettings();

  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, message: '', type: '' });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adminLoginSchema),
  });

  useEffect(() => {
    if (!loadingAuth && isAdmin && user) {
      router.push('/admin'); // Redirect to admin dashboard if already logged in
    }
  }, [isAdmin, user, loadingAuth, router]);

  const onSubmit = async (formData) => {
    setLoading(true);
    setAlertMessage({ show: false, message: '', type: '' });
    try {
      await adminLogin(formData.email, formData.password);
      router.push('/admin');
    } catch (error) {
      setAlertMessage({ show: true, message: error.message || 'Login admin gagal. Periksa email dan password Anda.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth || loadingSettings) {
    return <Loading message="Memuat halaman login admin..." />;
  }
  // If already logged in as admin, redirect handled by useEffect. 
  // Can add explicit loading screen here too if preferred.
  if (isAdmin && user) {
    return <Loading message="Mengalihkan ke dashboard admin..." />;
  }


  return (
    <>
      <Head>
        <title>Admin Login - {settings.election_title || "Sistem Voting Online"}</title>
        <meta name="description" content={`Admin login untuk ${settings.election_title || "Sistem Voting Online"}`} />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-6 left-6 flex items-center opacity-80">
          <Image
            src={settings.header_logo1_url || '/logo.png'}
            alt="Logo Universitas"
            width={50} height={50} className="rounded-md object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/50x50/FFFFFF/333333?text=L1'}
          />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-8 space-y-8">
          <div className="text-center">
            <Image src="/hmik.jpeg" alt="Logo HMI MK" width={80} height={80} className="mx-auto rounded-md object-contain" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Admin
            </h2>
          </div>

          {alertMessage.show && <Alert message={alertMessage.message} type={alertMessage.type} onClose={() => setAlertMessage({ show: false })} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="flex items-center">
                    <LogIn size={18} className="mr-2" /> Sign In
                  </div>
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} {settings.election_title || "Sistem Voting Online"}
          </p>
        </div>
      </div>
      {loading && <Loading message="Logging in..." />}
    </>
  );
}

AdminLoginPage.getLayout = function getLayout(page) {
  return <>{page}</>; // Return page as is, without the main Layout wrapper
};
