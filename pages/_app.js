import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { AppSettingsProvider } from '../context/AppSettingsContext';
import Head from 'next/head';
import Layout from '../components/Layout'; // Assuming a general Layout component

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {/* Default title, can be overridden by pages */}
          <title>Sistem Voting Online</title> 
        </Head>
        {/* Apply layout based on route or component needs */}
        {Component.getLayout ? (
          Component.getLayout(<Component {...pageProps} />)
        ) : (
          <Layout> {/* Default Layout */}
            <Component {...pageProps} />
          </Layout>
        )}
      </AppSettingsProvider>
    </AuthProvider>
  );
}

export default MyApp;