import { useEffect } from 'react';
import { useRouter } from 'next/router';

function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Alihkan pengguna ke /login saat halaman dimuat
    router.push('/login');
  }, [router]); // Tambahkan router sebagai dependency

  return (
    <div>
      <h1>Selamat Datang di Sistem Voting!</h1>
      <p>Anda akan dialihkan ke halaman login...</p>
    </div>
  );
}

export default HomePage;