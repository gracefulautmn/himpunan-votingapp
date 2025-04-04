import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '../utils/supabaseClient';
import CandidateCard from '../components/CandidateCard';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { LogOut } from 'lucide-react';
import Head from 'next/head';

function VotePage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProgramName = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.nim) return;
    
        const programCode = user.nim.substring(0, 4);
        
        const { data, error } = await supabase
          .from("allowed_programs")
          .select("program_name")
          .eq("program_code", programCode)
          .single();
    
        if (error) {
          console.error("Gagal mengambil nama program:", error);
          return;
        }
    
        setProgramName(data.program_name);
      };
    
      fetchProgramName();
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      
      // Verify the stored session has auth_time (like in VerificationForm)
      if (!parsedUser || !parsedUser.auth_time) {
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      setUser(parsedUser);
      fetchData();
      checkIfVoted(parsedUser.nim); // Use nim consistent with VerificationForm
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('candidates').select('*');
      if (error) throw error;
      setCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setAlert({ show: true, message: 'Gagal mengambil data kandidat.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const checkIfVoted = async (nim) => {
    try {
      // Get user_id dari tabel users berdasarkan nim
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, already_vote')
        .eq('nim', nim)
        .single();
  
      if (userError) throw userError;
      if (!userData) throw new Error('User tidak ditemukan.');
  
      if (userData.already_vote) {
        setHasVoted(true);
        return;
      }
  
      // Cek apakah ada record di votes untuk user_id ini
      const { data, error } = await supabase
        .from('votes')
        .select('id') // Ambil ID saja agar lebih ringan
        .eq('user_id', userData.id)
        .limit(1); // Ambil hanya satu hasil
  
      if (error) throw error;
  
      if (data && data.length > 0) {
        setHasVoted(true);
      }
    } catch (err) {
      console.error("Error checking vote:", err.message);
      setAlert({ 
        show: true, 
        message: 'Terjadi kesalahan saat memeriksa status voting. Silakan coba lagi.', 
        type: 'error' 
      });
    }
  };

  
  const handleVote = async (candidateId) => {
    try {
      setLoading(true);
      setAlert({ show: false, message: '', type: 'success' });
      
      if (!user || !user.nim) {
        throw new Error('Anda belum login.');
      }
      
      // Get user_id from nim
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, already_vote') // Ambil already_vote juga
        .eq('nim', user.nim)
        .single();
  
      if (userError) throw userError;
      if (!userData) throw new Error('User tidak ditemukan.');

      // Cek apakah user sudah vote
      if (userData.already_vote) {
        throw new Error('Anda sudah memberikan suara dan tidak dapat vote lagi.');
      }
  
      const user_id = userData.id;
      
      // Insert vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{ 
          user_id: user_id, // UUID dari tabel users
          candidate_id: candidateId 
        }]);

      if (voteError) throw voteError;
      
      // Update already_vote = true setelah berhasil vote
      const { error: updateError } = await supabase
        .from('users')
        .update({ already_vote: true })
        .eq('id', user_id);

      if (updateError) throw updateError;
      
      setAlert({ show: true, message: 'Terima kasih telah memberikan suara Anda!', type: 'success' });
      setHasVoted(true);
    
      setTimeout(() => {
        localStorage.removeItem('user');
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error("Error voting:", error);
      setAlert({ show: true, message: error.message || 'Gagal memberikan suara.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>Sistem Voting - Universitas Pertamina</title>
        <meta name="description" content="Sistem voting online Universitas Pertamina" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-300 py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Top logos */}
        <div className="absolute top-4 left-4 flex items-center">
          <Image src="/logo.png" alt="Logo 1" width={60} height={60} className="rounded-md" />
          <div className="border-l border-gray-800 mx-4 h-10"></div>
          <Image src="/logo2.png" alt="Logo 2" width={40} height={60} className="rounded-md" />
        </div>

        {/* Logout button */}
        {/* <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center text-sm text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button> */}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            
          <h2 className="text-xl font-bold text-gray-700">
            Pemilihan Ketua & Wakil Ketua Himpunan {programName && `(${programName})`}
            </h2>
            
            {/* {user && (
              <div className="mt-2 text-sm text-gray-600">
                Logged in as: {user.email}
              </div>
            )} */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} onVote={handleVote} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default VotePage;