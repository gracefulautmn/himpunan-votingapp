import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Loading from '../components/Loading'; // Opsional, untuk tampilan saat redirect

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke halaman login
    router.replace('/login');
  }, [router]);

  // Tampilkan pesan loading atau null selagi redirect
  return (
    <>
      <Head>
        <title>Mengarahkan...</title>
        {/* Anda bisa menambahkan meta tag lain jika diperlukan */}
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-300 dark:from-gray-900 dark:to-blue-900">
        <Loading message="Mengarahkan ke halaman login..." />
      </div>
    </>
  );
}