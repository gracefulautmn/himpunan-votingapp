import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, BarChart2, Zap } from 'lucide-react';

// --- Helper Functions ---
const calculateVotePercentage = (count, total) => {
  if (total === 0) return "0.0";
  return ((count / total) * 100).toFixed(1);
};

const calculateBarHeightPercentage = (count, max) => {
  if (max === 0) return 0;
  return (count / max) * 100;
};

export default function StandaloneVoteChartPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  // State untuk menunjukkan koneksi realtime aktif
  const [isLive, setIsLive] = useState(false);

  // Fungsi fetch data tetap sama
  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Akses ditolak. Anda harus login sebagai admin.');
      
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal mengambil data statistik');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.message);
    }
  };

  // Menggabungkan fetch awal dan langganan realtime
  useEffect(() => {
    fetchStats(); // Fetch data awal

    // Buat koneksi Realtime ke tabel 'votes'
    const channel = supabase
      .channel('realtime-votes-chart')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('Perubahan terdeteksi! Mengambil data baru...', payload);
          fetchStats();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Berhasil terhubung ke channel Realtime!');
          setIsLive(true);
        } else {
          setIsLive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalVotes = stats?.totalVotesCasted ?? 0;
  const maxVotes = stats?.votesPerCandidate?.length > 0
    ? Math.max(...stats.votesPerCandidate.map(c => c.count))
    : 0;

  return (
    // UPDATED: Menggunakan position:fixed untuk "memaksa" layout fullscreen
    // dan keluar dari container default di _app.js
    <div className="bg-gray-100 dark:bg-gray-900 fixed inset-0 z-50 flex flex-col p-4 sm:p-6 lg:p-8 box-border">
      <Head>
        <title>Live: Grafik Hasil Voting</title>
      </Head>

      <main className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col flex-grow">
        <header className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                Grafik Hasil Voting
              </h1>
              <span 
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                  isLive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                <Zap size={14} className={isLive ? 'animate-pulse' : ''}/>
                {isLive ? 'LIVE' : 'Connecting...'}
              </span>
            </div>
            <Link href="/admin" passHref>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 shadow-md">
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Kembali ke Dashboard</span>
              </button>
            </Link>
          </div>
           <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Total Suara Masuk: <span className="font-bold text-gray-800 dark:text-gray-200">{totalVotes.toLocaleString()}</span>
           </p>
        </header>

        <div className="p-4 sm:p-6 flex-grow flex flex-col justify-center items-center">
          {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
          
          {!stats && !error && (
             <div className="text-center text-gray-500">
                <p>Memuat data awal...</p>
             </div>
          )}

          {stats && !error && (
            stats.votesPerCandidate.length > 0 ? (
              <div className="w-full h-full flex justify-around items-end gap-2 sm:gap-4 md:gap-6 pt-4">
              {stats.votesPerCandidate.map((candidate) => (
                  <div key={candidate.id} className="flex flex-col items-center h-full w-full justify-end group">
                    <div 
                        className="w-full sm:w-4/5 md:w-3/5 bg-gradient-to-t from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 hover:opacity-90 rounded-t-lg transition-all duration-500 ease-out flex flex-col justify-end"
                        style={{ height: `${calculateBarHeightPercentage(candidate.count, maxVotes)}%` }}
                        title={`${candidate.count.toLocaleString()} suara (${calculateVotePercentage(candidate.count, totalVotes)}%)`}
                    >
                         <span className="block text-center text-gray-700 dark:text-gray-200 font-bold text-sm sm:text-base -mt-6 group-hover:scale-110 transition-transform">{candidate.count}</span>
                    </div>
                    <div className="text-center mt-3 w-full pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 truncate" title={`${candidate.ketua} & ${candidate.wakil}`}>
                          {candidate.ketua} & {candidate.wakil}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {calculateVotePercentage(candidate.count, totalVotes)}%
                        </p>
                    </div>
                  </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                 <BarChart2 size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                 <p className="text-lg text-gray-600 dark:text-gray-400">Belum ada suara yang dapat ditampilkan.</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

StandaloneVoteChartPage.getLayout = function getLayout(page) {
  return page;
};
