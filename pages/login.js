import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail } from 'lucide-react'; // Using lucide-react

import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';


const loginSchema = z.object({
  nim: z.string().min(1, { message: 'NIM tidak boleh kosong' }),
  email: z.string().email({ message: 'Format email tidak valid' })
    // Optional: Add specific domain validation if login_method is 'campus_email_format'
    // .refine(val => val.endsWith('@student.universitaspertamina.ac.id'), {
    //   message: 'Gunakan email mahasiswa Universitas Pertamina (@student.universitaspertamina.ac.id)',
    // }),
});


export default function LoginPage() {
  const router = useRouter();
  const { loginVoter, loadingAuth, voterSession, isAdmin, user: adminUser } = useAuth(); // Use renamed loadingAuth
  const { settings, loadingSettings } = useAppSettings();
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (voterSession.nim && !voterSession.isOtpVerified && voterSession.alreadyVoted === false) {
      router.push('/verify');
    } else if (voterSession.nim && voterSession.isOtpVerified) {
      router.push('/vote');
    } else if (voterSession.alreadyVoted === true) {
      
    }
    if (isAdmin && adminUser) {
      router.push('/admin');
    }
  }, [voterSession, isAdmin, adminUser, router]);


  const onSubmit = async (formData) => {
    setLoading(true);
    setAlert({ show: false, message: '', type: '' });

    if (!loadingSettings && settings.login_method === 'campus_email_format') {
      if (!formData.email.endsWith('@student.universitaspertamina.ac.id')) {
        setAlert({ show: true, message: 'Gunakan email mahasiswa Universitas Pertamina (@student.universitaspertamina.ac.id)', type: 'error' });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        setAlert({ show: true, message: data.message || 'Login gagal.', type: 'error' });
      } else {
        loginVoter(data.nim, data.email, data.programName, data.alreadyVoted);
        router.push('/verify');
      }
    } catch (error) {
      setAlert({ show: true, message: 'Terjadi kesalahan. Silakan coba lagi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth || loadingSettings) {
    return <Loading message="Memuat halaman login..." />;
  }
  
  // If already logged in as admin, redirect (handled by useEffect, but can be an explicit check too)
  if (isAdmin && adminUser) {
     return <Loading message="Mengalihkan ke dashboard admin..." />;
  }
  // If voter session active and OTP verified, redirect (handled by useEffect)
  if (voterSession.isOtpVerified && voterSession.nim) {
    return <Loading message="Mengalihkan ke halaman vote..." />;
  }
  if (voterSession.nim && !voterSession.isOtpVerified && voterSession.alreadyVoted === false) {
    return <Loading message="Mengalihkan ke halaman verifikasi..." />;
  }


  return (
    <>
      <Head>
        {<title>Login - Violie</title> /* {settings.election_title || "Sistem Voting Online"} */}
        <meta name="description" content={`Login untuk ${settings.election_title || "Sistem Voting Online Universitas Pertamina"}`} />
      </Head>
      
      {/* Dua logo di kiri atas */}
      <div className="absolute top-4 left-4 flex items-center z-10">
        <Image 
            src={settings.header_logo1_url || '/logo.png'} 
            alt="Logo Universitas" 
            width={60} height={60} className=" object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/60x60/CCCCCC/333333?text=Logo1'}
        />
        <div className="border-l border-gray-700 dark:border-gray-400 mx-4 h-10"></div>
        <Image 
            src={settings.header_logo2_url || '/logo2.png'} 
            alt="Logo Himpunan/Acara" 
            width={40} height={60} className=" object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/40x60/CCCCCC/333333?text=Logo2'}
        />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-6 sm:p-8 transform transition-all duration-500 ease-out">
        <div className="text-center">
          <Image 
            src={settings.login_page_logo_url || '/hmik.jpeg'} 
            alt="Logo Utama Acara" 
            width={100} 
            height={100}
            className="mx-auto mb-4 rounded-lg object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/100x100/CCCCCC/333333?text=EventLogo'}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            {settings.election_title || "Sistem Voting Online"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          </p>
        </div>
        
        {alert.show && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="nim" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NIM
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                id="nim"
                {...register("nim")}
                className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Masukkan NIM Anda"
              />
            </div>
            {errors.nim && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nim.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={settings.login_method === 'campus_email_format' ? "nim@student.universitaspertamina.ac.id" : "Masukkan Email Terdaftar"}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200 relative"
            >
              {loading ? (
                <>
                  <span className="opacity-0">Login</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        </p>
      </div>
      {loading && <Loading message="Memproses login..." />}
    </>
  );
}