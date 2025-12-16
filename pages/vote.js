// pages/vote.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, Info, XCircle } from 'lucide-react'; // Removed LogOut as it's no longer used

import Alert from '../components/Alert';
import Loading from '../components/Loading';
import CandidateCard from '../components/CandidateCard';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';

export default function VotePage() {
  const router = useRouter();
  const { voterSession, loadingAuth, logoutVoter, voterHasVoted } = useAuth();
  const { settings, loadingSettings } = useAppSettings();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingVote, setLoadingVote] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [showThankYou, setShowThankYou] = useState(false);
  const [timeLeftRedirect, setTimeLeftRedirect] = useState(5);


  useEffect(() => {
    if (!loadingAuth) {
        if (!voterSession.nim || !voterSession.isOtpVerified) {
            router.push('/login');
        } else if (voterSession.alreadyVoted === true) {
            setShowThankYou(true);
            setLoadingPage(false);
        } else {
            fetchCandidates();
        }
    }
  }, [voterSession, loadingAuth, router]);
  
  useEffect(() => {
    if (showThankYou && timeLeftRedirect > 0) {
      const timer = setTimeout(() => {
        setTimeLeftRedirect(timeLeftRedirect - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showThankYou && timeLeftRedirect <= 0) {
      logoutVoter();
    }
}, [showThankYou, timeLeftRedirect, logoutVoter]);


  const fetchCandidates = async () => {
    setLoadingPage(true);
    setAlert({ show: false, message: '', type: '' });
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*');

      if (error) {
        setAlert({ show: true, message: 'Gagal memuat daftar kandidat.', type: 'error' });
      } else {
        setCandidates(data || []);
      }
    } catch (error) {
      setAlert({ show: true, message: 'Terjadi kesalahan saat memuat kandidat.', type: 'error' });
    } finally {
      setLoadingPage(false);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    if (showThankYou || loadingVote) return;
    
    if (selectedCandidateId === candidateId) {
      handleVoteConfirm(candidateId);
    } else {
      setSelectedCandidateId(candidateId);
      setAlert({ show: false, message: '', type: '' });
    }
  };

  const handleVoteConfirm = async (candidateIdToVote) => {
    if (!candidateIdToVote) {
        setAlert({ show: true, message: 'Pilih salah satu kandidat terlebih dahulu.', type: 'info' });
        return;
    }
    setLoadingVote(true);
    setAlert({ show: false, message: '', type: '' });

    try {
      const response = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: voterSession.nim, candidateId: candidateIdToVote }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAlert({ show: true, message: data.message || 'Gagal mengirimkan suara.', type: 'error' });
        if (response.status === 403) { 
            voterHasVoted(); 
            setShowThankYou(true);
            setTimeLeftRedirect(5);
        }
      } else {
        setAlert({ show: true, message: data.message || 'Suara berhasil dicatat!', type: 'success' });
        
        setTimeout(() => {
            voterHasVoted(); 
            setShowThankYou(true);
            setSelectedCandidateId(null);

            if (data.action === 'auto_logout' && data.delay) {
                setTimeLeftRedirect(Math.floor(data.delay / 1000));
            } else {
                setTimeLeftRedirect(5);
            }
        }, 2000);
      }
    } catch (error) {
      setAlert({ show: true, message: 'Terjadi kesalahan. Silakan coba lagi.', type: 'error' });
    } finally {
      setLoadingVote(false);
    }
};

  if (loadingAuth || loadingSettings || (loadingPage && !showThankYou)) {
    return <Loading message="Memuat halaman pemilihan..." />;
  }

  const programNameDisplay = voterSession.programName ? `(${voterSession.programName})` : '';

  return (
    <>
      <Head>
        { <title>Pilih Kandidat - Violie</title> /*{settings.election_title || "Sistem Voting Online"} */}
        <meta name="description" content={`Halaman pemilihan untuk ${settings.election_title || "Sistem Voting Online Universitas Pertamina"}`} />
      </Head>

      {/* Top logos - removed rounded-md */}
      <div className="absolute top-4 left-4 flex items-center z-10">
        <Image 
            src={settings.header_logo1_url || '/logo.png'} 
            alt="Logo Universitas" 
            width={50} height={50} className="object-contain" // removed rounded-md
            onError={(e) => e.target.src = 'https://placehold.co/50x50/CCCCCC/333333?text=Logo1'}
        />
        <div className="border-l border-gray-700 dark:border-gray-400 mx-3 h-8"></div>
        <Image 
            src={settings.header_logo2_url || '/logo2.png'} 
            alt="Logo Himpunan/Acara" 
            width={35} height={50} className="object-contain" // removed rounded-md
            onError={(e) => e.target.src = 'https://placehold.co/35x50/CCCCCC/333333?text=Logo2'}
        />
      </div>
      {/* Logout button removed from here */}


      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 mt-12 sm:mt-16">
           <Image 
            src={settings.login_page_logo_url || '/hmik.jpeg'} 
            alt="Logo Utama Acara" 
            width={80} 
            height={80}
            className="mx-auto mb-3 rounded-lg object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/80x80/CCCCCC/333333?text=EventLogo'}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {settings.election_title || "Pemilihan Ketua & Wakil Ketua Himpunan"}
          </h1>
          {programNameDisplay && (
            <h2 className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-300 mt-1">
              {programNameDisplay}
            </h2>
          )}
          {!showThankYou && candidates.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Silakan pilih salah satu pasangan calon di bawah ini. Klik sekali untuk memilih, klik lagi untuk konfirmasi suara Anda.
            </p>
          )}
        </div>

        {alert.show && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />}

        {showThankYou ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-6 sm:p-10 text-center transform transition-all duration-500 ease-out">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Terima Kasih!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-base sm:text-lg">
              Anda telah berhasil memberikan suara. Partisipasi Anda sangat berarti.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Anda akan dialihkan ke halaman login dalam {timeLeftRedirect} detik...
            </p>
            <button
                onClick={logoutVoter}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md shadow transition-colors text-sm"
            >
                Kembali ke Login Sekarang
            </button>
          </div>
        ) : candidates.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 ${loadingVote ? 'opacity-70 pointer-events-none' : ''}`}>
            {candidates.map((candidate) => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                onVote={handleSelectCandidate} 
                isLoading={loadingVote && selectedCandidateId === candidate.id}
                isSelected={selectedCandidateId === candidate.id}
                hasVotedForThis={false}
              />
            ))}
          </div>
        ) : (
          !loadingPage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden p-8 text-center">
              <Info className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Belum Ada Kandidat</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Saat ini belum ada daftar kandidat yang tersedia. Silakan cek kembali nanti atau hubungi panitia.
              </p>
            </div>
          )
        )}
      </div>
      {loadingVote && <Loading message="Mengirimkan suara Anda..." />}
    </>
  );
}
