import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../utils/supabaseClient';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import Loading from '../../components/Loading';

function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [newProgramCode, setNewProgramCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
    } else {
      fetchPrograms();
    }
  }, [router]);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('allowed_programs').select('*');
    if (error) {
      console.error("Error fetching programs:", error);
      setAlert({ show: true, message: 'Gagal mengambil daftar program studi.', type: 'error' });
    } else {
      setPrograms(data);
    }
    setLoading(false);
  };

  const handleAddProgram = async () => {
    if (!newProgramCode) {
      setAlert({ show: true, message: 'Kode program studi tidak boleh kosong.', type: 'error' });
      return;
    }

    if (newProgramCode.length !== 4 || !/^\d+$/.test(newProgramCode)) {
      setAlert({ show: true, message: 'Kode program studi harus 4 digit angka.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('allowed_programs')
        .insert([{ program_code: newProgramCode }]);

      if (error) throw error;
      
      setAlert({ show: true, message: 'Program studi berhasil ditambahkan!', type: 'success' });
      fetchPrograms();
      setNewProgramCode('');
    } catch (error) {
      console.error("Error adding program:", error);
      setAlert({ show: true, message: 'Gagal menambahkan program studi.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (programCode) => {
    if (!confirm('Apakah Anda yakin ingin menghapus program studi ini?')) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('allowed_programs')
        .delete()
        .eq('program_code', programCode);

      if (error) throw error;
      
      setAlert({ show: true, message: 'Program studi berhasil dihapus!', type: 'success' });
      fetchPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      setAlert({ show: true, message: 'Gagal menghapus program studi.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <AdminLayout title="Kelola Program Studi" activeMenu="programs">
      <Head>
        <title>Kelola Program Studi | Admin</title>
        <meta name="description" content="Kelola Program Studi yang Diizinkan dalam Sistem Voting" />
      </Head>

      <div className="bg-white rounded-lg shadow-md p-6">
        {alert.show && (
          <div className={`mb-4 p-4 rounded-md ${alert.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            <p>{alert.message}</p>
            <button 
              className="float-right font-bold"
              onClick={() => setAlert({ ...alert, show: false })}
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Kelola Program Studi yang Diizinkan</h1>
          <Link 
            href="/admin/dashboard" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>

        {/* Form Tambah Program Studi */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tambah Program Studi Baru</h2>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="programCode">
                Kode Program Studi (4 digit angka)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="programCode"
                type="text"
                placeholder="Contoh: 1234"
                value={newProgramCode}
                onChange={(e) => setNewProgramCode(e.target.value)}
                maxLength={4}
              />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              onClick={handleAddProgram}
              disabled={submitting}
            >
              {submitting ? (
                <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              Tambah Program
            </button>
          </div>
        </div>

        {/* Daftar Program Studi */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Daftar Program Studi yang Diizinkan</h2>
          {programs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Belum ada program studi yang ditambahkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">No.</th>
                    <th className="py-3 px-4 text-left">Kode Program Studi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {programs.map((program, index) => (
                    <tr key={program.program_code} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{program.program_code}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteProgram(program.program_code)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full"
                          disabled={submitting}
                          title="Hapus Program Studi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminPrograms;