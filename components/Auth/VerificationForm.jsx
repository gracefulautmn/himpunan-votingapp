import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import Alert from '../Alert';
import { MailIcon, KeyIcon } from 'lucide-react';

function VerificationForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleVerify = async () => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;

      setAlert({ 
        show: true, 
        message: 'Verifikasi berhasil! Mengarahkan ke halaman voting...', 
        type: 'success' 
      });
      
      // Redirect after showing success message
      setTimeout(() => router.push('/vote'), 1500);
    } catch (error) {
      console.error("Error verifying token:", error);
      setAlert({ 
        show: true, 
        message: 'Kode verifikasi tidak valid.', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 z-10"></div>
      )}
      
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
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 ${loading ? 'bg-gray-100' : ''}`}
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-colors duration-200 relative"
          >
            {loading ? (
              <>
                <span className="opacity-0">Verifikasi</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
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