// pages/admin/results.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCircle, LogOut, Users, BarChart2, ArrowLeft, DownloadCloud } from 'lucide-react';

function AdminResults() {
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
      // Pertama, ambil semua kandidat
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, ketua, wakil');
  
      if (candidatesError) throw candidatesError;
  
      // Kemudian hitung votes untuk setiap kandidat
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
  
      // Hitung total votes
      const total = resultsWithVotes.reduce((sum, item) => sum + item.votes, 0);
      
      // Format data untuk chart
      const formattedResults = resultsWithVotes.map(item => ({
        name: `${item.ketua} - ${item.wakil}`,
        votes: item.votes,
        ketua: item.ketua,
        wakil: item.wakil,
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

  const handleExportResults = () => {
    // Create CSV content
    const headers = ['No', 'Kandidat', 'Jumlah Suara', 'Persentase'];
    const rows = results.map((result, index) => [
      index + 1,
      `${result.ketua} - ${result.wakil}`,
      result.votes,
      `${result.percentage}%`
    ]);
    
    // Add total row
    rows.push(['', 'Total', totalVotes, '100%']);
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hasil-voting-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    router.push('/admin/login');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-blue-600">{`Jumlah Suara: ${payload[0].value}`}</p>
          <p className="text-green-600">{`Persentase: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Hasil Voting | Admin</title>
        <meta name="description" content="Hasil Voting dalam Sistem Pemilihan" />
      </Head>

      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-blue-800 text-white">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-center">Admin Panel</h2>
            <div className="flex justify-center mt-4">
              <UserCircle size={64} />
            </div>
            <p className="mt-2 text-center">Selamat datang, Admin!</p>
          </div>
          
          <nav className="mt-8">
            <Link href="/admin/dashboard" className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors">
              <div className="flex items-center space-x-2">
                <BarChart2 size={20} />
                <span>Dashboard</span>
              </div>
            </Link>
            <Link href="/admin/candidates" className="flex items-center px-4 py-3 hover:bg-blue-700 transition-colors">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <span>Kelola Kandidat</span>
              </div>
            </Link>
            <Link href="/admin/programs" className="flex items-center px-4 py-3 bg-blue-900">
                          <div className="flex items-center space-x-2">
                            <Users size={20} />
                            <span>Kelola Program Studi</span>
                          </div>
                        </Link>
            <Link href="/admin/results" className="flex items-center px-4 py-3 bg-blue-900">
              <div className="flex items-center space-x-2">
                <BarChart2 size={20} />
                <span>Hasil Voting</span>
              </div>
            </Link>
          </nav>
          
          <div className="absolute bottom-4 w-64 px-4">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Hasil Voting</h1>
              <div className="flex space-x-4">
                {/* <button
                  onClick={handleExportResults}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                >
                  <DownloadCloud size={16} className="mr-2" />
                  Export CSV
                </button> */}
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  <span>Kembali ke Dashboard</span>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Belum ada data voting yang tersedia.</p>
              </div>
            ) : (
              <div>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h2 className="text-lg font-semibold text-blue-800 mb-2">Total Suara: {totalVotes}</h2>
                  <p className="text-gray-600">Data diperbarui secara real-time</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {results.map((result, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <h3 className="font-bold text-lg">{result.ketua} - {result.wakil}</h3>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-blue-600 h-4 rounded-full" 
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 font-medium">{result.percentage}%</span>
                      </div>
                      <p className="mt-2 text-gray-600">Jumlah Suara: {result.votes}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results}
                      margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ angle: -45, textAnchor: 'end', fontSize: 12 }}
                        height={60}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="votes" name="Jumlah Suara" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Detail Hasil Voting</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left border-b">No.</th>
                          <th className="py-3 px-4 text-left border-b">Pasangan Kandidat</th>
                          <th className="py-3 px-4 text-center border-b">Jumlah Suara</th>
                          <th className="py-3 px-4 text-center border-b">Persentase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">{index + 1}</td>
                            <td className="py-3 px-4 font-medium border-b">{result.name}</td>
                            <td className="py-3 px-4 text-center border-b">{result.votes}</td>
                            <td className="py-3 px-4 text-center border-b">{result.percentage}%</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="py-3 px-4" colSpan="2">Total</td>
                          <td className="py-3 px-4 text-center">{totalVotes}</td>
                          <td className="py-3 px-4 text-center">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminResults;