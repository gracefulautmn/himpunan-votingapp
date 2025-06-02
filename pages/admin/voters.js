// pages/admin/voters.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { Users, Search, Filter, ChevronLeft, ChevronRight, Info, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

export default function AdminVotersPage() {
  const router = useRouter();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const itemsPerPage = 15;

  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availablePrograms, setAvailablePrograms] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVoters = useCallback(async (page = 1, search = '', program = '', status = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Sesi tidak valid atau tidak ditemukan. Silakan login kembali.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search,
        program,
        status,
      }).toString();

      const response = await fetch(`/api/admin/voters?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal mengambil data pemilih (status: ${response.status})`);
      }
      const data = await response.json();
      setVoters(data.voters);
      setTotalVoters(data.totalVoters);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Error fetching voters:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  const fetchAvailablePrograms = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn('Sesi tidak valid saat mengambil program studi.');
        return;
      }
      const response = await fetch('/api/admin/programs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Gagal mengambil daftar program studi');
      const data = await response.json();
      setAvailablePrograms(data || []);
    } catch (err) {
      console.error("Error fetching available programs:", err);
    }
  }, []);

  useEffect(() => {
    fetchAvailablePrograms();
  }, [fetchAvailablePrograms]);

  const debouncedFetchVoters = useCallback(debounce(fetchVoters, 500), [fetchVoters]);

  useEffect(() => {
    if (router.isReady) {
        setCurrentPage(parseInt(router.query.page, 10) || 1);
        setSearchTerm(router.query.search || '');
        setProgramFilter(router.query.program || '');
        setStatusFilter(router.query.status || '');
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;

    const query = {};
    if (currentPage > 1) query.page = currentPage.toString();
    if (searchTerm) query.search = searchTerm;
    if (programFilter) query.program = programFilter;
    if (statusFilter) query.status = statusFilter;

    if (JSON.stringify(query) !== JSON.stringify(router.query)) {
        router.push({
            pathname: router.pathname,
            query: query
        }, undefined, { shallow: true });
    }

    debouncedFetchVoters(currentPage, searchTerm, programFilter, statusFilter);

  }, [currentPage, searchTerm, programFilter, statusFilter, router.isReady, debouncedFetchVoters, router]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleProgramFilterChange = (e) => {
    setProgramFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const openDeleteModal = (voter) => {
    setDeletingUser(voter);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingUser(null);
    setShowDeleteModal(false);
    setError(null); // Clear error when closing modal
  };

  const confirmDeleteUserVoteData = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Sesi tidak valid. Silakan login kembali untuk menghapus data.');
        setIsDeleting(false);
        return;
      }
      
      const response = await fetch(`/api/admin/users/${deletingUser.nim}/delete-vote-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data vote pengguna.');
      }
      
      alert(result.message || 'Data vote pengguna berhasil dihapus.');
      fetchVoters(currentPage, searchTerm, programFilter, statusFilter);
      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting user vote data:", err);
      // Set error to be displayed in the modal or page alert
      setError(err.message); 
      // alert(`Error: ${err.message}`); // Alert can be redundant if error state is used
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // AdminLayout tidak lagi diterapkan langsung di return JSX utama
  return (
    <>
      <Head>
        <title>Data Pemilih - Admin Panel</title>
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Daftar Pemilih Terdaftar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Lihat dan kelola data mahasiswa yang terdaftar dalam sistem voting.
          </p>
        </div>
      </div>

      {error && !showDeleteModal && <Alert message={error} type="error" onClose={() => setError(null)} />} {/* Show page-level error only if modal is not open or error is not from modal */}
      
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow">
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cari (NIM/Email)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              id="search"
              placeholder="Ketik untuk mencari..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div>
          <label htmlFor="programFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Program Studi</label>
          <select
            id="programFilter"
            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
            value={programFilter}
            onChange={handleProgramFilterChange}
          >
            <option value="">Semua Program</option>
            {availablePrograms.map(prog => (
              <option key={prog.program_code} value={prog.program_code}>{prog.program_name} ({prog.program_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Status Vote</label>
          <select
            id="statusFilter"
            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">Semua Status</option>
            <option value="voted">Sudah Memilih</option>
            <option value="not_voted">Belum Memilih</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading message="Memuat data pemilih..." />
      ) : !voters.length ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Info size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                Tidak ada data pemilih yang cocok.
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
                Coba ubah filter pencarian Anda atau periksa kembali nanti.
            </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">NIM</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Program Studi</th>
                  <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status Vote</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Login Terakhir</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tgl Registrasi</th>
                  <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {voters.map((voter) => (
                  <tr key={voter.nim} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{voter.nim}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={voter.email}>{voter.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{voter.allowed_programs?.program_name || voter.program_code}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-center text-xs">
                      {voter.already_vote ? (
                        <span className="px-2.5 py-1 inline-flex font-semibold rounded-full bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200">
                          Sudah Memilih
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex font-semibold rounded-full bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200">
                          Belum Memilih
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(voter.last_login)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(voter.created_at)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-center text-sm">
                       {voter.already_vote && (
                         <button
                           onClick={() => openDeleteModal(voter)}
                           className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-md hover:bg-red-100 dark:hover:bg-gray-700"
                           title="Hapus Data Vote Pengguna Ini"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2 sm:mb-0">
                Menampilkan <span className="font-semibold">{voters.length}</span> dari <span className="font-semibold">{totalVoters}</span> pemilih.
                Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span>.
              </p>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft size={16} className="mr-1" /> Sebelumnya
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Berikutnya <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4" onClick={closeDeleteModal}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modalenter"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Konfirmasi Hapus Data Vote</h2>
                    <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Anda akan menghapus data voting untuk pengguna:
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">NIM: {deletingUser.nim}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Email: {deletingUser.email}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Tindakan ini akan menghapus entri vote pengguna dari tabel <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">votes</code> dan menghapus pengguna dari tabel <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">users</code> (karena <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">already_vote</code> adalah true).
                        Pengguna ini akan dapat melakukan vote kembali.
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Tindakan ini tidak dapat diurungkan. Lanjutkan?
                    </p>
                    {error && showDeleteModal && <Alert message={error} type="error" onClose={() => setError(null)} />} {/* Show error inside modal */}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
                    <button type="button" onClick={closeDeleteModal} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                        Batal
                    </button>
                    <button type="button" onClick={confirmDeleteUserVoteData} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                        {isDeleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Trash2 size={16} className="mr-1.5" />}
                        Ya, Hapus Data Vote
                    </button>
                </div>
                 <style jsx>{`
                    .animate-modalenter {
                    animation: modalenter 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
                    }
                    @keyframes modalenter {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>
            </div>
        </div>
      )}
    </>
  );
}

// AdminLayout diterapkan di sini oleh _app.js melalui getLayout
AdminVotersPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Data Pemilih">{page}</AdminLayout>;
};
