// pages/admin/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';
import { BarChartBig, Users, CheckSquare, Percent, BarChart, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Helper function to calculate percentage
const calculatePercentage = (count, total) => {
  if (total === 0) return "0.0";
  return ((count / total) * 100).toFixed(1);
};

// --- Reusable StatCard Component ---
const StatCard = ({ title, value, icon, bgColor }) => (
  <div className={`p-5 rounded-xl shadow-lg ${bgColor}`}>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      {icon}
    </div>
    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
  </div>
);

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak valid. Silakan login kembali.');

      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal mengambil data (status: ${response.status})`);
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

  return (
    <>
      <Head>
        <title>Dashboard - Admin Panel</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Selamat Datang, {user?.email ? user.email.split('@')[0] : 'Admin'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Berikut adalah ringkasan sistem voting online Anda secara real-time.
        </p>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      
      {loading ? (
        <Loading message="Memuat data statistik..." />
      ) : !stats ? (
        <Alert message="Data statistik tidak tersedia atau gagal dimuat." type="info" />
      ) : (
        <>
          {/* --- Stats Cards --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Suara Masuk"
              value={(stats.totalVotesCasted || 0).toLocaleString()}
              icon={<CheckSquare className="w-7 h-7 text-green-500" />}
              bgColor="bg-green-50 dark:bg-green-900/30"
            />
            <StatCard
              title="Pemilih Terdaftar"
              value={(stats.totalRegisteredUsers || 0).toLocaleString()}
              icon={<Users className="w-7 h-7 text-blue-500" />}
              bgColor="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatCard
              title="Partisipasi"
              value={`${(stats.turnoutPercentage || 0).toFixed(1)}%`}
              icon={<Percent className="w-7 h-7 text-yellow-500" />}
              bgColor="bg-yellow-50 dark:bg-yellow-900/30"
            />
             <StatCard
              title="Kandidat"
              value={(stats.votesPerCandidate?.length || 0).toLocaleString()}
              icon={<Users className="w-7 h-7 text-indigo-500" />}
              bgColor="bg-indigo-50 dark:bg-indigo-900/30"
            />
          </div>

          {/* --- Main Content Grid --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side: Vote Results */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Hasil Perolehan Suara per Kandidat
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Total suara yang telah diverifikasi: {(stats.totalVotesCasted || 0).toLocaleString()}
              </p>

              {!stats.votesPerCandidate || stats.votesPerCandidate.length === 0 ? (
                <div className="text-center py-10">
                  <BarChartBig size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Belum ada suara yang masuk.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {stats.votesPerCandidate.map((candidate, index) => (
                    <div key={candidate.id}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5">
                        <h3 className="text-md sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                          {index + 1}. {candidate.ketua} & {candidate.wakil}
                        </h3>
                        <div className="mt-1 sm:mt-0 text-left sm:text-right">
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {(candidate.count || 0).toLocaleString()} Suara
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center"
                          // CORRECTED: Percentage is based on total votes, not max votes.
                          style={{ width: `${calculatePercentage(candidate.count || 0, stats.totalVotesCasted || 0)}%` }}
                        >
                           <span className="text-xs font-bold text-white px-2">
                             {calculatePercentage(candidate.count || 0, stats.totalVotesCasted || 0)}%
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Aksi Cepat</h2>
              <div className="space-y-3">
                <Link href="/admin/candidates/new" passHref>
                   <button className="w-full text-left px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md transition-colors">Tambah Kandidat Baru</button>
                </Link>
                <Link href="/admin/vote-chart" passHref>
                   <button className="w-full text-left px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors flex items-center">
                     <BarChart className="w-4 h-4 mr-2"/> Lihat Grafik Vertikal
                   </button>
                </Link>
                 <button className="w-full text-left px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-md transition-colors flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2"/> Export Data Pemilih
                 </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Apply AdminLayout via _app.js
AdminDashboardPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Dashboard">{page}</AdminLayout>;
};