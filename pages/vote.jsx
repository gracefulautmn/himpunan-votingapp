import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '../utils/supabaseClient';
import CandidateCard from '../components/CandidateCard';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { LogOut } from 'lucide-react';

function VotePage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login'); // Redirect to login if not authenticated
      } else {
        setUser(session.user);
        fetchData();
        checkIfVoted();
      }
    };

    checkSession();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('candidates').select('*');
    if (error) {
      console.error("Error fetching candidates:", error);
      setAlert({ show: true, message: 'Gagal mengambil data kandidat.', type: 'error' });
    } else {
      setCandidates(data);
    }
    setLoading(false);
  };

  const checkIfVoted = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error checking if voted:", error);
        setAlert({ show: true, message: 'Gagal memeriksa status voting Anda.', type: 'error' });
      } else if (data && data.length > 0) {
        setHasVoted(true);
      }
    }
  };

  const handleVote = async (candidateId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAlert({ show: true, message: 'Anda belum login.', type: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('votes')
      .insert([{ user_id: user.id, candidate_id: candidateId }]);

    if (error) {
      console.error("Error voting:", error);
      setAlert({ show: true, message: 'Gagal memberikan suara Anda.', type: 'error' });
      setLoading(false);
    } else {
      setAlert({ show: true, message: 'Terima kasih telah memberikan suara Anda!', type: 'success' });
      setHasVoted(true);
      
      // Show success message briefly and then logout
      setTimeout(async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/login');
      }, 2000); // Wait 2 seconds before logout
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-300 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top logos */}
      <div className="absolute top-4 left-4 flex items-center">
        <Image src="/logo.png" alt="Logo 1" width={60} height={60} className="rounded-md" />
        <div className="border-l border-gray-800 mx-4 h-10"></div>
        <Image src="/logo2.png" alt="Logo 2" width={40} height={60} className="rounded-md" />
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 flex items-center text-sm text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <LogOut size={18} className="mr-2" />
        Logout
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Image 
            src="/hmik.jpeg" 
            alt="HMIK Logo" 
            width={100} 
            height={100}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">HMIK</h1>
          <h2 className="text-xl font-medium text-gray-700">Pemilihan Ketua & Wakil Ketua</h2>
          
          {user && (
            <div className="mt-2 text-sm text-gray-600">
              Logged in as: {user.email}
            </div>
          )}
        </div>

        {alert.show && <Alert message={alert.message} type={alert.type} />}

        {hasVoted ? (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih!</h2>
            <p className="text-gray-600">Anda sudah memberikan suara. Terima kasih atas partisipasi Anda dalam pemilihan HMIK.</p>
            <p className="text-gray-500 text-sm mt-4">Anda akan dialihkan dalam beberapa saat...</p>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Kandidat</h2>
              <p className="text-gray-600 text-sm">Berikan suara Anda untuk kandidat pilihan. Setelah memilih, Anda tidak dapat mengubah pilihan.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} onVote={handleVote} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VotePage;