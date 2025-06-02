// pages/admin/index.js
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Users, ListChecks, Settings as SettingsIcon } from 'lucide-react'; // Renamed Settings to SettingsIcon to avoid conflict if any

// Placeholder for statistics data
const placeholderStats = [
  { name: 'Total Pemilih Terdaftar', value: '1,250', icon: Users, color: 'text-blue-500' },
  { name: 'Suara Masuk', value: '870', icon: BarChart, color: 'text-green-500' },
  { name: 'Kandidat Terdaftar', value: '3', icon: ListChecks, color: 'text-purple-500' },
  { name: 'Program Studi Aktif', value: '5', icon: SettingsIcon, color: 'text-yellow-500' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth(); // Get admin user info if needed

  // AdminLayout tidak lagi diterapkan di sini
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Selamat Datang, {user?.email ? user.email.split('@')[0] : 'Admin'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Berikut adalah ringkasan sistem voting online Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {placeholderStats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 bg-opacity-10 rounded-lg ${stat.color.replace('text-', 'bg-')}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for recent activity or quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Aktivitas Terbaru</h2>
          <ul className="space-y-3">
            <li className="text-sm text-gray-600 dark:text-gray-400"> <span className="font-medium text-indigo-500">Kandidat Baru:</span> Paslon Alpha ditambahkan.</li>
            <li className="text-sm text-gray-600 dark:text-gray-400"> <span className="font-medium text-green-500">Voting:</span> 50 suara baru masuk dalam 1 jam terakhir.</li>
            <li className="text-sm text-gray-600 dark:text-gray-400"> <span className="font-medium text-yellow-500">Pengaturan:</span> Logo aplikasi diperbarui.</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md transition-colors">Tambah Kandidat Baru</button>
            <button className="w-full text-left px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors">Lihat Hasil Voting Live</button>
            <button className="w-full text-left px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-md transition-colors">Export Data Pemilih</button>
          </div>
        </div>
      </div>
    </>
  );
}

// AdminLayout diterapkan di sini oleh _app.js melalui getLayout
AdminDashboardPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Dashboard">{page}</AdminLayout>;
};
