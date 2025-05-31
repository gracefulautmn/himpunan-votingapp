// pages/admin/dashboard.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCircle, LogOut, Users, BarChart2, FileText, Download, Trash2, AlertTriangle } from 'lucide-react'; // Added Trash2, AlertTriangle
import Loading from '../../components/Loading';
import AdminLayout from '../../components/Layout/AdminLayout';

function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [voterList, setVoterList] = useState([]);
  const [voterListLoading, setVoterListLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
    } else {
      fetchInitialData();
      const subscription = subscribeToChanges();
      return () => {
        subscription.unsubscribeAll();
      };
    }
  }, [router]);

  const fetchInitialData = async () => {
    setLoading(true); // For overall page load
    setVoterListLoading(true); // For voter list section
    await Promise.all([fetchResults(), fetchVoterDetails()]);
    setLoading(false);
  };

  const fetchResults = async () => {
    // setLoading(true); // Handled by fetchInitialData or called separately
    try {
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, ketua, wakil, kabinet');

      if (candidatesError) throw candidatesError;

      const resultsWithVotes = await Promise.all(
        candidates.map(async (candidate) => {
          const { count, error: votesError } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id);

          if (votesError) throw votesError;

          return {
            ...candidate,
            votes: count || 0
          };
        })
      );

      const sortedResultsWithVotes = resultsWithVotes.sort((a, b) => b.votes - a.votes);
      const total = sortedResultsWithVotes.reduce((sum, item) => sum + item.votes, 0);
      const formattedResults = sortedResultsWithVotes.map(item => ({
        name: `${item.ketua} - ${item.wakil}`,
        votes: item.votes,
        kabinet: item.kabinet,
        percentage: total ? ((item.votes / total) * 100).toFixed(1) : 0,
        candidateId: item.id
      }));

      setResults(formattedResults);
      setTotalVotes(total);
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]); // Clear on error
      setTotalVotes(0);
    } finally {
      // setLoading(false); // Handled by fetchInitialData
    }
  };

  const fetchVoterDetails = async () => {
    setVoterListLoading(true);
    try {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('user_id, candidate_id, created_at');

      if (votesError) throw votesError;

      if (!votes || votes.length === 0) {
        setVoterList([]);
        setVoterListLoading(false);
        return;
      }

      const userIds = [...new Set(votes.map(v => v.user_id))].filter(id => id != null);
      const candidateIds = [...new Set(votes.map(v => v.candidate_id))].filter(id => id != null);

      let usersData = [];
      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('users')
          .select('id, nim, email') // nim and email must exist in your 'users' table
          .in('id', userIds);
        if (error) throw error;
        usersData = data;
      }
      
      let candidatesData = [];
      if (candidateIds.length > 0) {
        const { data, error } = await supabase
          .from('candidates')
          .select('id, ketua, wakil')
          .in('id', candidateIds);
        if (error) throw error;
        candidatesData = data;
      }

      const usersMap = new Map(usersData.map(u => [u.id, u]));
      const candidatesMap = new Map(candidatesData.map(c => [c.id, c]));

      const detailedVoterList = votes.map(vote => {
        const user = usersMap.get(vote.user_id);
        const candidate = candidatesMap.get(vote.candidate_id);
        return {
          nim: user ? user.nim : 'N/A',
          email: user ? user.email : 'N/A',
          votedFor: candidate ? `${candidate.ketua} - ${candidate.wakil}` : 'Unknown Candidate',
          votedAt: vote.created_at ? new Date(vote.created_at).toLocaleString() : 'N/A',
        };
      }).sort((a,b) => new Date(b.votedAt) - new Date(a.votedAt));

      setVoterList(detailedVoterList);
    } catch (error) {
      console.error("Error fetching voter details:", error);
      setVoterList([]); // Clear list on error
    } finally {
      setVoterListLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const votesChannel = supabase
      .channel('public-votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, (payload) => {
        console.log('Votes table change received!', payload);
        fetchResults();
        fetchVoterDetails();
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to votes changes!');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Subscription error:', err, status);
        }
      });
    
    // If users can be deleted/modified outside of this flow and affect the lists
    const usersChannel = supabase
      .channel('public-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('Users table change received!', payload);
        fetchVoterDetails(); // Re-fetch voter list if user details change
      })
      .subscribe();

    return {
        unsubscribeAll: () => {
            supabase.removeChannel(votesChannel);
            supabase.removeChannel(usersChannel);
        }
    };
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmationText !== 'hapus-semua-data') {
      alert("Teks konfirmasi tidak cocok.");
      return;
    }
    setIsDeleting(true);
  
    try {
      console.log("=== DEBUGGING: Starting deletion process ===");
  
      // --- STAGE 1: Delete votes ---
      console.log("=== STAGE 1: Deleting votes ===");
      const { error: votesDeleteError } = await supabase
        .from('votes')
        .delete()
        .gte('id', 1); // Delete all rows where id >= 1 (for integer id)
  
      if (votesDeleteError) {
        console.error("Error deleting votes:", votesDeleteError);
        throw new Error(`Gagal menghapus votes: ${votesDeleteError.message}.`);
      }
      console.log("All votes successfully deleted.");
      console.log("=== STAGE 1 COMPLETED ===");
  
      // --- STAGE 2: Delete users ---
      console.log("=== STAGE 2: Deleting users ===");
      const { error: usersDeleteError } = await supabase
        .from('users')
        .delete()
        .neq('email', ''); // Delete all rows where email is not empty (works with text fields)
  
      if (usersDeleteError) {
        console.error("Error deleting users:", usersDeleteError);
        throw new Error(`Gagal menghapus users: ${usersDeleteError.message}.`);
      }
      console.log("All users successfully deleted.");
      console.log("=== STAGE 2 COMPLETED ===");
  
      alert("Semua data suara dan pengguna berhasil dihapus!");
      setResults([]);
      setTotalVotes(0);
      setVoterList([]);
      fetchInitialData(); // Refresh the UI
      setIsDeleteModalOpen(false);
      setDeleteConfirmationText('');
    } catch (error) {
      console.error("=== DELETION PROCESS FAILED ===");
      console.error("Full error details:", error);
      alert(`GAGAL: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded shadow-md">
          <p className="font-bold text-slate-800">{payload[0].payload.name}</p>
          <p className="text-slate-600">Kabinet: {payload[0].payload.kabinet}</p>
          <p className="text-blue-600 font-medium">{`Jumlah Suara: ${payload[0].value}`}</p>
          <p className="text-emerald-600 font-medium">{`Persentase: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex items-start mb-4">
          <AlertTriangle size={28} className="text-red-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Konfirmasi Penghapusan</h2>
            <p className="text-sm text-slate-500">Tindakan ini bersifat permanen.</p>
          </div>
        </div>
        <p className="text-slate-600 mb-3">
          Anda akan menghapus <strong>semua data suara</strong> dan <strong>semua data pengguna</strong>. Tindakan ini tidak dapat diurungkan.
        </p>
        <p className="text-slate-600 mb-4">
          Untuk melanjutkan, ketik "<strong>hapus-semua-data</strong>" pada kolom di bawah ini:
        </p>
        <input
          type="text"
          value={deleteConfirmationText}
          onChange={(e) => setDeleteConfirmationText(e.target.value)}
          className="border border-slate-300 p-2 rounded w-full mb-6 focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400"
          placeholder="hapus-semua-data"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteConfirmationText('');
            }}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            Batal
          </button>
          <button
            onClick={handleDeleteAllData}
            disabled={deleteConfirmationText !== 'hapus-semua-data' || isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
          >
            {isDeleting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <Trash2 size={18} className="mr-2" /> Hapus Semua
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <Loading />;

  return (
    <AdminLayout title="Dashboard" activeMenu="dashboard">
      <div className="p-6 bg-white rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Monitor voting results in real-time</p>
          </div>
        </div>

        {results.length === 0 && totalVotes === 0 ? ( // Check totalVotes too in case candidates exist but no votes
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">No voting data available yet.</p>
            <p className="text-slate-400">Results will appear here as votes come in.</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-5 rounded-lg mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-blue-800 mb-1">Total Votes: {totalVotes}</h2>
                  <p className="text-slate-600">Data updates in real-time</p>
                </div>
                <div className="mt-4 md:mt-0 bg-white px-4 py-3 rounded-md shadow-sm">
                  <p className="text-slate-700 font-medium">Last update: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {results.map((result, index) => (
                <div key={index} className={`bg-white border border-slate-200 rounded-lg shadow-sm p-5 transition-all hover:shadow-md ${index === 0 && result.votes > 0 ? 'ring-2 ring-emerald-500' : ''}`}>
                  <div className="mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      index === 0 && result.votes > 0 && results.every(r => result.votes >= r.votes) ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {index === 0 && result.votes > 0 && results.every(r => result.votes >= r.votes) ? 'Leading' : `Rank ${index + 1}`}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{result.kabinet}</h3>
                  <p className="text-slate-600 mb-3">{result.name}</p>
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-slate-200 rounded-full h-4 mr-2">
                      <div
                        className={`h-4 rounded-full ${
                          index === 0 && result.votes > 0 && results.every(r => result.votes >= r.votes) ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-slate-700 whitespace-nowrap">{result.percentage}%</span>
                  </div>
                  <p className="mt-2 text-slate-600">Votes: <span className="font-semibold">{result.votes}</span></p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-8 h-96">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Vote Distribution</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={results}
                  margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ angle: -45, textAnchor: 'end', fontSize: 12, fill: '#64748b' }}
                    height={60}
                    stroke="#cbd5e1"
                  />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="votes" name="Votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Detailed Results</h2>
              <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cabinet</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Candidate Pair</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Votes</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {results.map((result, index) => (
                      <tr key={index} className={`hover:bg-slate-50 transition-colors ${index === 0 && result.votes > 0 && results.every(r => result.votes >= r.votes) ? 'bg-emerald-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{result.kabinet}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{result.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{result.votes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            index === 0 && result.votes > 0 && results.every(r => result.votes >= r.votes) ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {result.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {results.length > 0 && (
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800" colSpan={3}>Total</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 text-center">{totalVotes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 text-center">{totalVotes > 0 ? '100%' : '0%'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Voter List Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Voter Turnout Details</h2>
          {voterListLoading ? (
            <div className="text-center py-8"><Loading /></div>
          ) : voterList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Users size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 text-lg">No voters have cast their votes yet or no voter data found.</p>
              { totalVotes > 0 && <p className="text-slate-400 text-sm mt-1">Note: Votes have been recorded, but individual voter details might not be available.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NIM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Voted For</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time of Vote</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {voterList.map((voter, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{voter.nim}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{voter.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{voter.votedFor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{voter.votedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete All Data Section - Placed outside the main white card for emphasis */}
      <div className="mt-8 p-6 bg-red-50 border-t-4 border-red-600 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-red-700 mb-1 flex items-center">
              <AlertTriangle size={22} className="mr-2 text-red-600" />
              Zona Berbahaya: Kelola Data
            </h3>
            <p className="text-red-600 text-sm max-w-xl">
              Tindakan ini akan menghapus permanen <strong>semua data suara</strong> dan <strong>semua data pengguna</strong> dari database.
              Harap pastikan Anda memahami konsekuensinya sebelum melanjutkan.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="mt-4 md:mt-0 shrink-0 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 flex items-center transition-all duration-150 ease-in-out"
          >
            <Trash2 size={18} className="mr-2" />
            Hapus Semua Data Voting
          </button>
        </div>
      </div>

      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </AdminLayout>
  );
}

export default AdminDashboard;