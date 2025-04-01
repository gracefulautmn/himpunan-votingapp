import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import Alert from '../Alert';
import Loading from '../Loading';
import { MailIcon, KeyIcon } from 'lucide-react';

function VerificationForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  // Ambil email dari localStorage saat komponen dimuat
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.push('/login'); // Redirect ke login jika tidak ada email
    }
  }, [router]);

  const handleVerify = async () => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });

    const { error } = await supabase.auth.verifyOtp({
      email,  // Gunakan email yang disimpan
      token,
      type: 'email'
    });

    if (error) {
      console.error("Error verifying token:", error);
      setAlert({ show: true, message: 'Kode verifikasi tidak valid.', type: 'error' });
    } else {
      setAlert({ show: true, message: 'Verifikasi berhasil!', type: 'success' });
      router.push('/vote');
    }

    setLoading(false);
  };

  return (
    <div className="mt-2">
      {loading && <Loading />} {/* Menggunakan komponen Loading yang terpisah */}
      
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      
      <div className="space-y-6">
        <div className="relative">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <MailIcon size={18} />
            </span>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 bg-gray-100"
            />
          </div>
        </div>
        
        <div className="relative">
          <label
            htmlFor="token"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Kode Verifikasi:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <KeyIcon size={18} />
            </span>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="Masukkan kode verifikasi"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Kode verifikasi telah dikirim ke email Anda. Harap periksa kotak masuk atau folder spam.
          </p>
        </div>
        
        <div>
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifikasi...
              </>
            ) : (
              'Verifikasi'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationForm;