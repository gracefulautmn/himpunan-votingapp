import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import CandidateCard from '../components/CandidateCard';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

function VotePage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [alert, setAlert] = useState({show: false, message: '', type: 'success'})
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
         router.push('/login'); // Redirect to login if not authenticated
      } else {
        fetchData();
        checkIfVoted();
      }
    }

    checkSession();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('candidates').select('*');
    if (error) {
      console.error("Error fetching candidates:", error);
      setAlert({show: true, message: 'Gagal mengambil data kandidat.', type: 'error'})
    } else {
      setCandidates(data);
    }
    setLoading(false);
  };

  const checkIfVoted = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error checking if voted:", error);
        setAlert({show: true, message: 'Gagal memeriksa status voting Anda.', type: 'error'})
      } else if (data && data.length > 0) {
        setHasVoted(true);
      }
    }
  };

  const handleVote = async (candidateId) => {
    const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAlert({show: true, message: 'Anda belum login.', type: 'error'})
        return;
      }

    const { error } = await supabase
      .from('votes')
      .insert([{ user_id: user.id, candidate_id: candidateId }]);

    if (error) {
      console.error("Error voting:", error);
      setAlert({show: true, message: 'Gagal memberikan suara Anda.', type: 'error'})
    } else {
      setAlert({show: true, message: 'Terima kasih telah memberikan suara Anda!', type: 'success'})
      setHasVoted(true);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (hasVoted) {
    return <p>Anda sudah memberikan suara.</p>;
  }

  return (
    <div>
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      <h1>Pilih Kandidat</h1>
      {candidates.map((candidate) => (
        <CandidateCard key={candidate.id} candidate={candidate} onVote={handleVote} />
      ))}
    </div>
  );
}

export default VotePage;