import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Loading from '../components/Loading';

function HomePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Add a small delay for better UX (let user see the message briefly)
    const timer = setTimeout(() => {
      router.push('/login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Sistem Voting - Universitas Pertamina</title>
        <meta name="description" content="Sistem voting online Universitas Pertamina" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 text-center">
        {isRedirecting ? (
          <>
            <div className="max-w-md mx-auto space-y-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Selamat Datang di Sistem Voting
              </h1>
              <p className="text-lg text-gray-600">
                Anda akan dialihkan ke halaman login...
              </p>
            </div>
            <div className="mt-8">
              <Loading />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

export default HomePage;