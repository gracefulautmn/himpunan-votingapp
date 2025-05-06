import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../utils/supabaseClient';
import Link from 'next/link';
import { Plus, Trash2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/Layout/AdminLayout';
import Loading from '../../components/Loading';

function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    kabinet: '',
    ketua: '',
    wakil: '',
    visi: '',
    misi: '',
    image_url: '',
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [previewImage, setPreviewImage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      router.push('/admin/login');
    } else {
      fetchCandidates();
    }
  }, [router]);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('candidates').select('*');
    if (error) {
      console.error("Error fetching candidates:", error);
      setAlert({ show: true, message: 'Gagal mengambil data kandidat.', type: 'error' });
    } else {
      setCandidates(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setNewCandidate({ ...newCandidate, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setAlert({ show: true, message: 'File yang diunggah bukan gambar.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setSubmitting(true);
      const { data, error } = await supabase.storage
        .from('candidate-images')
        .upload(`${Date.now()}-${file.name}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/candidate-images/${data.path}`;
      setNewCandidate({ ...newCandidate, image_url: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      setAlert({ show: true, message: 'Gagal mengupload gambar: ' + error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.ketua || !newCandidate.kabinet || !newCandidate.wakil || 
        !newCandidate.visi || !newCandidate.misi || !newCandidate.image_url) {
      setAlert({ show: true, message: 'Semua kolom harus diisi.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('candidates').insert([newCandidate]);
      if (error) throw error;
      
      setAlert({ show: true, message: 'Kandidat berhasil ditambahkan!', type: 'success' });
      fetchCandidates();
      setNewCandidate({ kabinet: '', ketua: '', wakil: '', visi: '', misi: '', image_url: '' });
      setPreviewImage(null);
    } catch (error) {
      console.error('Error adding candidate:', error);
      setAlert({ show: true, message: 'Gagal menambahkan kandidat: ' + error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kandidat ini?')) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) throw error;
      
      setAlert({ show: true, message: 'Kandidat berhasil dihapus!', type: 'success' });
      fetchCandidates();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      setAlert({ show: true, message: 'Gagal menghapus kandidat: ' + error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <AdminLayout title="Kelola Kandidat" activeMenu="candidates">
      <Head>
        <title>Kelola Kandidat | Admin</title>
        <meta name="description" content="Kelola Kandidat dalam Sistem Voting" />
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
          <h1 className="text-2xl text-opacity-100 text-black font-bold">Kelola Kandidat</h1>
          <Link 
            href="/admin/dashboard" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div> 

        {/* Form Tambah Kandidat */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl text-opacity-100 text-black font-semibold mb-4">Tambah Kandidat Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="kabinet">
                Nama Kabinet
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="kabinet"
                type="text"
                name="kabinet"
                placeholder="Nama Kabinet"
                value={newCandidate.kabinet}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ketua">
                Nama Ketua
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="ketua"
                type="text"
                name="ketua"
                placeholder="Nama Ketua"
                value={newCandidate.ketua}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="wakil">
                Nama Wakil
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="wakil"
                type="text"
                name="wakil"
                placeholder="Nama Wakil"
                value={newCandidate.wakil}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="visi">
              Visi
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="visi"
              name="visi"
              rows="4"
              placeholder="Visi"
              value={newCandidate.visi}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="misi">
              Misi
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="misi"
              name="misi"
              rows="4"
              placeholder="Misi"
              value={newCandidate.misi}
              onChange={handleInputChange}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
              Foto Kandidat
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center justify-center opacity-100 bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 cursor-pointer">
                <ImageIcon size={16} className="mr-2 text-black opacity-100" />
                <span className="text-sm text-black text-opacity-100 ">Pilih Gambar</span>
                <input 
                  className="hidden" 
                  id="image" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </label>
              {previewImage && (
                <div className="relative w-20 h-20">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            onClick={handleAddCandidate}
            disabled={submitting}
          >
            {submitting ? (
              <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus size={16} className="mr-2" />
            )}
            Tambah Kandidat
          </button>
        </div>

        {/* Daftar Kandidat */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-black text-opacity-100">Daftar Kandidat</h2>
          {candidates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 opacity-100">Belum ada kandidat yang ditambahkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-black text-opacity-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">No.</th>
                    <th className="py-3 px-4 text-left">Foto</th>
                    <th className="py-3 px-4 text-left">Kabinet</th>
                    <th className="py-3 px-4 text-left">Ketua-Wakil</th>
                    <th className="py-3 px-4 text-left">Visi</th>
                    <th className="py-3 px-4 text-left">Misi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((candidate, index) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        {candidate.image_url ? (
                          <img
                            src={candidate.image_url}
                            alt={`${candidate.ketua} - ${candidate.wakil}`}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{candidate.kabinet}</td>
                      <td className="py-3 px-4">{candidate.ketua}-{candidate.wakil}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{candidate.visi}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{candidate.misi}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full"
                          disabled={submitting}
                          title="Hapus Kandidat"
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

export default AdminCandidates;