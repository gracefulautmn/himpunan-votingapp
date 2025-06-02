// pages/admin/stats.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { BarChartBig, Users, CheckSquare, Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const calculatePercentage = (count, total) => {
  if (total === 0) return "0.0";
  return ((count / total) * 100).toFixed(1);
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Sesi tidak valid atau tidak ditemukan. Silakan login kembali sebagai admin.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal mengambil data statistik (status: ${response.status})`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const maxVotes = (stats && stats.votesPerCandidate && stats.votesPerCandidate.length > 0)
    ? stats.votesPerCandidate.reduce((max, candidate) => Math.max(max, candidate.count), 0)
    : 0;

  // AdminLayout tidak lagi diterapkan langsung di return JSX utama
  return (
    <>
      <Head>
        <title>Statistik Voting - Admin Panel</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Statistik Hasil Voting
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Ringkasan perolehan suara dan partisipasi pemilih.
        </p>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      
      {loading ? (
        <Loading message="Memuat data statistik..." />
      ) : !stats ? (
        <Alert message="Data statistik tidak tersedia atau gagal dimuat." type="info" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Suara Masuk"
              value={(stats.totalVotesCasted || 0).toLocaleString()}
              icon={<CheckSquare className="w-7 h-7 text-green-500" />}
              bgColor="bg-green-50 dark:bg-green-900/30"
            />
            <StatCard
              title="Total Pemilih Terdaftar"
              value={(stats.totalRegisteredUsers || 0).toLocaleString()}
              icon={<Users className="w-7 h-7 text-blue-500" />}
              bgColor="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatCard
              title="Partisipasi Pemilih"
              value={`${(stats.turnoutPercentage || 0).toFixed(1)}%`}
              icon={<Percent className="w-7 h-7 text-yellow-500" />}
              bgColor="bg-yellow-50 dark:bg-yellow-900/30"
              change={stats.turnoutPercentage > 50 ? <TrendingUp size={18} className="text-green-500"/> : <TrendingDown size={18} className="text-red-500"/>}
              changeText={`${stats.usersWhoVoted || 0} dari ${stats.totalRegisteredUsers || 0} pemilih`}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Hasil Perolehan Suara per Kandidat
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Total suara yang telah diverifikasi: {(stats.totalVotesCasted || 0).toLocaleString()}
            </p>

            {(stats.votesPerCandidate && stats.votesPerCandidate.length === 0) ? (
              <div className="text-center py-8">
                <BarChartBig size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Belum ada suara yang masuk atau tidak ada kandidat.</p>
              </div>
            ) : (
              <div className="space-y-5">
              {stats.votesPerCandidate && stats.votesPerCandidate.map((candidate, index) => (
                  <div key={candidate.id} className="border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5">
                      <div>
                          <h3 className="text-md sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                              {index + 1}. {candidate.ketua} & {candidate.wakil}
                          </h3>
                          {candidate.kabinet && <p className="text-xs text-gray-500 dark:text-gray-400">{candidate.kabinet}</p>}
                      </div>
                      <div className="mt-1 sm:mt-0 text-left sm:text-right">
                          <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                              {(candidate.count || 0).toLocaleString()} Suara
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                              ({calculatePercentage(candidate.count || 0, stats.totalVotesCasted || 0)}%)
                          </p>
                      </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 sm:h-6 overflow-hidden relative">
                      <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                          style={{ width: `${calculatePercentage(candidate.count || 0, maxVotes > 0 ? maxVotes : (stats.totalVotesCasted || 1))}%` }}
                      >
                      </div>
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 dark:text-gray-200 mix-blend-difference pointer-events-none">
                          {calculatePercentage(candidate.count || 0, stats.totalVotesCasted || 0)}%
                      </span>
                  </div>
                  </div>
              ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// StatCard Component
const StatCard = ({ title, value, icon, bgColor, change, changeText }) => (
  <div className={`p-5 rounded-xl shadow-lg ${bgColor} flex flex-col justify-between`}>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      {icon}
    </div>
    <div>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {change && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                {change}
                <span className="ml-1">{changeText}</span>
            </div>
        )}
    </div>
  </div>
);

// AdminLayout diterapkan di sini oleh _app.js melalui getLayout
AdminStatsPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Statistik Voting">{page}</AdminLayout>;
};
