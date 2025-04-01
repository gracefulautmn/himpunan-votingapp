// pages/admin/dashboard.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCircle, LogOut, Users, BarChart2, FileText, Download } from 'lucide-react';
import Loading from '../../components/Loading';
import AdminLayout from '../../components/Layout/AdminLayout';

function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
    } else {
      fetchResults();
      const subscription = subscribeToVotes();
      return () => {
        subscription();
      };
    }
  }, [router]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // First, get all candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, ketua, wakil, kabinet');
  
      if (candidatesError) throw candidatesError;
  
      // Then calculate votes for each candidate
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
  
      // Calculate total votes
      const total = resultsWithVotes.reduce((sum, item) => sum + item.votes, 0);
      
      // Format data for chart
      const formattedResults = resultsWithVotes.map(item => ({
        name: `${item.ketua} - ${item.wakil}`,
        votes: item.votes,
        kabinet: item.kabinet,
        percentage: total ? ((item.votes / total) * 100).toFixed(1) : 0
      }));
  
      setResults(formattedResults);
      setTotalVotes(total);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToVotes = () => {
    const subscription = supabase
      .channel('public:votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, (payload) => {
        console.log('Change received!', payload);
        fetchResults();
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription);
    };
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

        {results.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">No voting data available yet.</p>
            <p className="text-slate-400">Results will appear here as votes come in.</p>
          </div>
        ) : (
          <div>
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
                <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 transition-all hover:shadow-md">
                  <div className="mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      index === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {index === 0 ? 'Leading' : `Rank ${index + 1}`}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{result.kabinet}</h3>
                  <p className="text-slate-600 mb-3">{result.name}</p>
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-slate-200 rounded-full h-4 mr-2">
                      <div 
                        className={`h-4 rounded-full ${
                          index === 0 ? 'bg-emerald-500' : 'bg-blue-500'
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
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{result.kabinet}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{result.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{result.votes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            index === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {result.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800" colSpan="3">Total</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 text-center">{totalVotes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 text-center">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;