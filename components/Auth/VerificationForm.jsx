import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import Alert from '../Alert';
import { MailIcon, KeyIcon } from 'lucide-react';

function VerificationForm() {
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    // Ambil email dan nim dari localStorage
    const savedEmail = localStorage.getItem('user_email');
    const savedNim = localStorage.getItem('user_nim');
    
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.push('/login');
    }
    
    if (savedNim) {
      setNim(savedNim);
    }
  }, [router]);

  const handleInputChange = (index, value) => {
    // Pastikan hanya angka yang dimasukkan
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus ke input berikutnya jika ada input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace untuk menghapus dan kembali ke input sebelumnya
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Validasi: hanya angka dan panjang maksimal 6
    if (!/^\d+$/.test(pastedData) || pastedData.length > 6) return;
    
    const newOtp = Array(6).fill('');
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus pada kotak terakhir yang terisi
    if (pastedData.length < 6) {
      document.getElementById(`otp-${pastedData.length}`).focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });
    
    try {
      const otpValue = otp.join('');
      
      if (otpValue.length !== 6) {
        throw new Error('Masukkan 6 digit kode OTP');
      }

      // Verifikasi OTP dari database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User tidak ditemukan');

      // Verifikasi OTP
      if (userData.otp !== otpValue) {
        throw new Error('Kode OTP tidak valid');
      }

      // Verifikasi waktu kedaluwarsa OTP
      const otpExpiry = new Date(userData.otp_expires_at);
      if (otpExpiry < new Date()) {
        throw new Error('Kode OTP sudah kedaluwarsa');
      }

      // Clear OTP setelah digunakan
      await supabase
        .from('users')
        .update({ 
          otp: null,
          otp_expires_at: null,
          last_login: new Date()
        })
        .eq('email', email);

      // Tandai user sebagai terautentikasi
      const session = {
        user_id: userData.id,
        email: userData.email,
        nim: userData.nim,
        auth_time: new Date().toISOString()
      };
      
      // Simpan sesi di localStorage
      localStorage.setItem('user', JSON.stringify(session));


      setAlert({ 
        show: true, 
        message: 'Verifikasi berhasil! Mengarahkan ke halaman voting...', 
        type: 'success' 
      });
      
      // Redirect ke halaman voting
      setTimeout(() => router.push('/vote'), 1500);
    } catch (error) {
      console.error("Error:", error);
      setAlert({ 
        show: true, 
        message: error.message || 'Terjadi kesalahan saat verifikasi OTP.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });
    
    try {
      // Buat OTP baru
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Update OTP di database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          otp: newOtp,
          otp_expires_at: expiresAt
        })
        .eq('email', email);
      
      if (updateError) throw updateError;
      
      // Kirim OTP baru via email
      const response = await fetch('/api/sendOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp: newOtp,
          nim
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengirim OTP');
      }

      setAlert({ 
        show: true, 
        message: 'Kode OTP baru telah dikirim ke email Anda.', 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error:", error);
      setAlert({ 
        show: true, 
        message: error.message || 'Terjadi kesalahan saat mengirim ulang OTP.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-2 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
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
              className="flex-1 min-w-0 text-black block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 bg-gray-100 placeholder:text-gray-500 placeholder-opacity-100"
            />
          </div>
        </div>
        
        <div className="relative">
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Kode Verifikasi (6 digit):
          </label>
          <div className="flex justify-center space-x-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              disabled={loading}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />            
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Kode verifikasi telah dikirim ke email Anda. Harap periksa kotak masuk atau folder spam.
          </p>
        </div>
        
        <div>
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200 relative"
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
        
        <div className="text-center mt-4">
          <button
            onClick={resendOtp}
            disabled={loading}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Kirim Ulang Kode Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationForm;