import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { supabase } from '../../lib/supabaseClient';
import { PlusCircle, Edit3, Trash2, ListChecks, Info, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const programSchema = z.object({
  program_code: z.string().min(1, "Kode Program tidak boleh kosong.").max(10, "Kode Program maksimal 10 karakter.").regex(/^[a-zA-Z0-9]+$/, "Kode Program hanya boleh berisi huruf dan angka."),
  program_name: z.string().min(1, "Nama Program tidak boleh kosong."),
});

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors: formValidationErrors } } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues: { // Add defaultValues here for initial form state
        program_code: '',
        program_name: '',
    }
  });

  const fetchPrograms = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !session) {
        setPageError('Sesi tidak ditemukan atau error. Silakan login kembali.');
        setLoading(false);
        return;
      }
  
      const response = await fetch('/api/admin/programs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Gagal mengambil data program studi (status: ${response.status})`);
      }
      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleOpenModal = (program = null) => {
    setSelectedProgram(program);
    setFormError(null);
    if (program) {
      reset({ program_code: program.program_code, program_name: program.program_name });
    } else {
      reset({ program_code: '', program_name: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProgram(null);
    reset({ program_code: '', program_name: '' });
    setFormError(null);
  };

  const onSubmitProgramForm = async (formData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
      }

      const url = selectedProgram 
        ? `/api/admin/programs/${selectedProgram.program_code}` 
        : '/api/admin/programs';
      const method = selectedProgram ? 'PUT' : 'POST';

      const payload = selectedProgram ? { program_name: formData.program_name } : formData;

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Gagal ${selectedProgram ? 'memperbarui' : 'menambahkan'} program studi.`);
      }
      
      alert(result.message);
      await fetchPrograms();
      handleCloseModal();

    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProgram = async (programCode) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus program studi dengan kode '${programCode}'? Ini mungkin berdampak pada data pengguna yang terkait.`)) {
      return;
    }
    setPageError(null); // Clear previous page errors before new action
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`/api/admin/programs/${programCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus program studi.');
      }
      alert(result.message);
      await fetchPrograms();
    } catch (err) {
      setPageError(err.message);
    }
  };

  return (
    <>
      <Head>
        <title>Program Studi - Admin Panel</title>
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {/* Program Studi Terdaftar */}
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Tambah Program Studi
        </button>
      </div>

      {pageError && <Alert message={pageError} type="error" onClose={() => setPageError(null)} />}
      
      {loading ? (
        <Loading message="Memuat daftar program studi..." />
      ) : !programs.length ? (
         <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Info size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Belum ada program studi.</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Silakan tambahkan program studi baru untuk memulai.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Kode Program</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nama Program Studi</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {programs.map((program) => (
                <tr key={program.program_code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{program.program_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100">{program.program_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleOpenModal(program)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700"
                        title="Edit Program Studi"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.program_code)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-gray-700"
                        title="Hapus Program Studi"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
            // onClick={handleCloseModal} // Removed onClick here to prevent closing when clicking overlay if desired
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {selectedProgram ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6">
              {formError && (
                <div className="mb-4">
                  <Alert message={formError} type="error" onClose={() => setFormError(null)} />
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmitProgramForm)} className="space-y-5" id="programForm">
                <div>
                  <label htmlFor="program_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kode Program
                  </label>
                  <input 
                    type="text" 
                    id="program_code" 
                    {...register("program_code")} 
                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:opacity-60"
                    placeholder="Contoh: CS101"
                    disabled={!!selectedProgram || isSubmitting}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {formValidationErrors.program_code && (
                    <p className="mt-1 text-xs text-red-500">{formValidationErrors.program_code.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="program_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Program Studi
                  </label>
                  <input 
                    type="text" 
                    id="program_name" 
                    {...register("program_name")} 
                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
                    placeholder="Contoh: Ilmu Komputer"
                    disabled={isSubmitting}
                  />
                  {formValidationErrors.program_name && (
                    <p className="mt-1 text-xs text-red-500">{formValidationErrors.program_name.message}</p>
                  )}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                disabled={isSubmitting} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button 
                type="submit" // Changed to submit
                form="programForm" // Associate with the form
                disabled={isSubmitting} 
                className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ListChecks size={18} className="mr-2" />
                    {selectedProgram ? 'Simpan Perubahan' : 'Tambah Program'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

AdminProgramsPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Manajemen Program Studi">{page}</AdminLayout>;
};
