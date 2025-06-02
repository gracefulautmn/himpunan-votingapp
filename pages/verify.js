import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Mail, KeyRound } from 'lucide-react'; // Icons

import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';

const OTP_LENGTH = 6;

export default function VerifyPage() {
  const router = useRouter();
  const { voterSession, verifyVoterOtp, logoutVoter, loadingAuth } = useAuth();
  const { settings, loadingSettings } = useAppSettings();

  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Redirect if no NIM/email in session (e.g., direct access) or already verified
    if (!voterSession.nim || !voterSession.email) {
      router.push('/login');
    } else if (voterSession.isOtpVerified) {
      router.push('/vote');
    } else if (voterSession.alreadyVoted === true) {
      // If somehow they land here but already voted, show message and redirect
      setAlert({ show: true, message: 'Anda sudah memberikan suara sebelumnya.', type: 'info'});
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [voterSession, router]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last digit if multiple are pasted
    setOtp(newOtp);

    // Move to next input if a digit is entered
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
    if (pastedData.length === OTP_LENGTH) {
      setOtp(pastedData.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    } else if (pastedData.length > 0) {
        const newOtp = [...otp];
        for(let i=0; i < OTP_LENGTH; i++){
            if(pastedData[i]){
                newOtp[i] = pastedData[i];
                if(i < OTP_LENGTH -1) inputRefs.current[i+1]?.focus();
                else inputRefs.current[i]?.focus();
            } else {
                break;
            }
        }
        setOtp(newOtp);
    }
  };

  const handleSubmitVerification = async () => {
    setLoading(true);
    setAlert({ show: false, message: '', type: '' });
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== OTP_LENGTH) {
      setAlert({ show: true, message: `Kode OTP harus ${OTP_LENGTH} digit.`, type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: voterSession.nim, otp: enteredOtp }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAlert({ show: true, message: data.message || 'Verifikasi OTP gagal.', type: 'error' });
      } else {
        setAlert({ show: true, message: 'Verifikasi berhasil! Mengarahkan ke halaman vote...', type: 'success' });
        verifyVoterOtp(); // Update AuthContext state
        // The AuthContext useEffect or this timeout will redirect
        setTimeout(() => router.push('/vote'), 1500);
      }
    } catch (error) {
      console.error("OTP Verification error:", error);
      setAlert({ show: true, message: 'Terjadi kesalahan. Silakan coba lagi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setAlert({ show: false, message: '', type: '' });
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: voterSession.nim, email: voterSession.email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAlert({ show: true, message: data.message || 'Gagal mengirim ulang OTP.', type: 'error' });
      } else {
        setAlert({ show: true, message: 'OTP baru telah dikirim ke email Anda.', type: 'success' });
        setResendCooldown(60); // 60 seconds cooldown
        setOtp(new Array(OTP_LENGTH).fill("")); // Clear OTP fields
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setAlert({ show: true, message: 'Terjadi kesalahan saat mengirim ulang OTP.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingAuth || loadingSettings || !voterSession.email) { // Added !voterSession.email for initial load
    return <Loading message="Memuat halaman verifikasi..." />;
  }

  return (
    <>
      <Head>
        { <title>Verifikasi OTP - Violie </title> /*{settings.election_title || "Sistem Voting Online"} (di Violie)*/} 
        <meta name="description" content={`Verifikasi OTP untuk ${settings.election_title || "Sistem Voting Online Universitas Pertamina"}`} />
      </Head>

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

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="text-center">
          <Image 
            src={settings.login_page_logo_url || '/hmik.jpeg'} 
            alt="Logo Utama Acara" 
            width={100} 
            height={100}
            className="mx-auto mb-4 rounded-lg object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/100x100/CCCCCC/333333?text=EventLogo'}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Verifikasi Kode OTP</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Masukkan {OTP_LENGTH} digit kode OTP yang telah dikirim ke email Anda.
          </p>
        </div>

        {alert.show && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />}

        <div className="space-y-6">
          <div>
            <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Terdaftar:
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email-display"
                value={voterSession.email || ''}
                disabled
                className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="otp-0" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              Kode Verifikasi ({OTP_LENGTH} digit):
            </label>
            <div className="flex justify-center space-x-2 sm:space-x-3 mb-4" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={el => inputRefs.current[index] = el}
                  type="text" // Using text to allow better control with backspace and paste
                  inputMode="numeric" // Hint for mobile numeric keyboard
                  maxLength="1"
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Periksa kotak masuk atau folder spam di email Anda.
            </p>
          </div>

          <div>
            <button
              onClick={handleSubmitVerification}
              disabled={loading || otp.join('').length !== OTP_LENGTH}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200 relative"
            >
              {loading && otp.join('').length === OTP_LENGTH ? (
                <>
                  <span className="opacity-0">Verifikasi</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                'Verifikasi Kode'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={handleResendOtp}
              disabled={loading || resendCooldown > 0}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Kode OTP'}
            </button>
          </div>
           <div className="text-center mt-2">
            <button
              onClick={() => { logoutVoter(); router.push('/login');}}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-medium"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
      {loading && otp.join('').length !== OTP_LENGTH && <Loading message="Memproses..." />}
    </>
  );
}
