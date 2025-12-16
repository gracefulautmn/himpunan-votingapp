import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import CandidateFormModal from '../../components/admin/CandidateFormModal';
import { PlusCircle, Edit3, Trash2, Image as ImageIcon, Users, Info } from 'lucide-react';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !session) {
        setError('Sesi tidak ditemukan atau error. Silakan login kembali.');
        setLoading(false);
        return;
      }
  
      const response = await fetch('/api/admin/candidates', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // 'Content-Type': 'application/json', // Tidak diperlukan untuk GET
        },
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal mengambil data kandidat (status: ${response.status})`);
      }
      const data = await response.json();
      setCandidates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleOpenModal = (candidate = null) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
  };

  const handleSaveCandidate = async () => {
    await fetchCandidates();
    handleCloseModal();
  };

  const handleDeleteCandidate = async (candidateId, candidateImageUrl) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kandidat ini? Tindakan ini tidak dapat diurungkan.')) {
      return;
    }
    setLoading(true); // Atau state loading spesifik untuk delete
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Sesi tidak ditemukan. Silakan login kembali.');
        setLoading(false);
        return;
      }
  
      const response = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // 'Content-Type': 'application/json', // Tidak diperlukan untuk DELETE tanpa body
        },
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal menghapus kandidat (status: ${response.status})`);
      }
  
      const result = await response.json();
      
      setCandidates(prevCandidates => prevCandidates.filter(c => c.id !== candidateId));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredCandidates = candidates.filter(candidate => 
    candidate.ketua?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.wakil?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.kabinet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Manajemen Kandidat - Admin Panel</title>
      </Head>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between">
        <input 
            type="text"
            placeholder="Cari kandidat (nama, kabinet)..."
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Tambah Kandidat Baru
        </button>

      </div>

      {loading && !candidates.length ? (
        <Loading message="Memuat daftar kandidat..." />
      ) : !filteredCandidates.length && !loading ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Info size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                {searchTerm ? 'Tidak ada kandidat yang cocok.' : 'Belum ada kandidat.'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
                {searchTerm ? 'Coba kata kunci lain atau bersihkan pencarian.' : 'Silakan tambahkan kandidat sebelum mulai voting.'}
            </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Foto</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Pasangan Calon</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Kabinet</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.image_url ? (
                      <img 
                        src={candidate.image_url} 
                        alt={`Foto ${candidate.ketua} & ${candidate.wakil}`} 
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-md object-cover shadow-sm"
                        onError={(e) => e.target.src = 'https://placehold.co/64x64/E2E8F0/4A5568?text=N/A'}
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-sm">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{candidate.ketua}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">& {candidate.wakil}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{candidate.kabinet || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleOpenModal(candidate)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700"
                        title="Edit Kandidat"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCandidate(candidate.id, candidate.image_url)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-gray-700"
                        title="Hapus Kandidat"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CandidateFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveCandidate}
          candidate={selectedCandidate}
          supabaseClient={supabase}
        />
      )}
    </>
  );
}

AdminCandidatesPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Manajemen Kandidat">{page}</AdminLayout>;
};
