import '../styles/global.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {

  const router = useRouter();

  useEffect(() => {
      // Check if admin is logged in on client-side navigation
      const handleRouteChange = (url) => {
        if (url.startsWith('/admin') && url !== '/admin/login') {
          const isAdmin = localStorage.getItem('isAdmin') === 'true';
          if (!isAdmin) {
            router.push('/admin/login');
          }
        }
      };

      router.events.on('routeChangeStart', handleRouteChange);

      // Cleanup: Remove the event listener when the component unmounts
      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;