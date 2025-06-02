import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Alert from '../Alert';
import { X, UploadCloud, CheckCircle, Trash2 } from 'lucide-react';

const candidateSchema = z.object({
  ketua: z.string().min(1, "Nama Ketua tidak boleh kosong."),
  wakil: z.string().min(1, "Nama Wakil Ketua tidak boleh kosong."),
  kabinet: z.string().optional(),
  visi: z.string().optional(),
  misi: z.string().optional(),
  image_url: z.string().optional(),
});

export default function CandidateFormModal({ isOpen, onClose, onSave, candidate, supabaseClient }) {
  const [loading, setLoading] = useState(false);
  const [formAlert, setFormAlert] = useState({ show: false, message: '', type: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(candidateSchema),
    defaultValues: candidate || { ketua: '', wakil: '', kabinet: '', visi: '', misi: '', image_url: '' },
  });

  useEffect(() => {
    if (candidate) {
      reset(candidate);
      if (candidate.image_url) {
        setImagePreview(candidate.image_url);
      } else {
        setImagePreview(null);
      }
    } else {
      reset({ ketua: '', wakil: '', kabinet: '', visi: '', misi: '', image_url: '' });
      setImagePreview(null);
    }
    setImageFile(null);
    setFormAlert({ show: false, message: '', type: '' });
  }, [candidate, reset, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormAlert({ show: true, message: 'Ukuran gambar maksimal 5MB.', type: 'error' });
        setImageFile(null);
        setImagePreview(candidate?.image_url || null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setFormAlert({ show: true, message: 'Format gambar tidak valid (hanya JPG, PNG, GIF, WEBP).', type: 'error' });
        setImageFile(null);
        setImagePreview(candidate?.image_url || null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormAlert({show: false});
    }
  };
  
  const handleRemoveImage = async (isExistingImage = false) => {
    if (isExistingImage && candidate?.image_url) {
        setValue('image_url', '');
    }
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setFormAlert({show: false});
  };

  const onSubmitForm = async (formData) => {
    setLoading(true);
    setFormAlert({ show: false, message: '', type: '' });
    let finalImageUrl = candidate?.image_url || '';
  
    if (imageFile) {
      setIsUploading(true);
      const fileName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('gambar')
        .upload(`public/${fileName}`, imageFile, {
          cacheControl: '3600',
          upsert: true,
        });
      setIsUploading(false);
  
      if (uploadError) {
        setFormAlert({ show: true, message: `Gagal mengunggah gambar: ${uploadError.message}`, type: 'error' });
        setLoading(false);
        return;
      }
      
      const { data: publicUrlData } = supabaseClient.storage
        .from('gambar')
        .getPublicUrl(uploadData.path);
      
      finalImageUrl = publicUrlData.publicUrl;
  
      if (candidate?.image_url && candidate.image_url !== finalImageUrl) {
        const oldImagePath = candidate.image_url.substring(candidate.image_url.indexOf('/public/') + 1);
        if (oldImagePath) {
            await supabaseClient.storage.from('gambar').remove([oldImagePath]);
        }
      }
    } else if (!imagePreview && candidate?.image_url) {
      const oldImagePath = candidate.image_url.substring(candidate.image_url.indexOf('/public/') + 1);
      if (oldImagePath) {
        await supabaseClient.storage.from('gambar').remove([oldImagePath]);
      }
      finalImageUrl = '';
    }
  
    const payload = { ...formData, image_url: finalImageUrl };
  
    try {
      // Dapatkan sesi Supabase untuk mendapatkan token
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
      }
  
      const url = candidate ? `/api/admin/candidates/${candidate.id}` : '/api/admin/candidates';
      const method = candidate ? 'PUT' : 'POST';
  
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // Tambahkan token autentikasi
        },
        body: JSON.stringify(payload),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || `Gagal ${candidate ? 'memperbarui' : 'menambahkan'} kandidat.`);
      }
      
      setFormAlert({ show: true, message: result.message, type: 'success' });
      
      // Tunggu sebentar sebelum menutup modal agar user bisa melihat pesan sukses
      setTimeout(() => {
        onSave(result.candidate);
      }, 1500);
      
    } catch (err) {
      console.error("Form submission error:", err);
      setFormAlert({ show: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formFieldClass = "block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <>
      <style jsx>{`
        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }
        .modal-content {
          animation: slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      <div 
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4" 
        onClick={onClose}
      >
        <div 
          className="modal-content bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {candidate ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-grow overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
              {formAlert.show && (
                <Alert 
                  message={formAlert.message} 
                  type={formAlert.type} 
                  onClose={() => setFormAlert({ show: false })} 
                />
              )}

              <div>
                <label htmlFor="ketua" className={labelClass}>Nama Ketua</label>
                <input 
                  type="text" 
                  id="ketua" 
                  {...register("ketua")} 
                  className={formFieldClass} 
                  placeholder="Contoh: John Doe"
                />
                {errors.ketua && <p className="mt-1 text-xs text-red-500">{errors.ketua.message}</p>}
              </div>

              <div>
                <label htmlFor="wakil" className={labelClass}>Nama Wakil Ketua</label>
                <input 
                  type="text" 
                  id="wakil" 
                  {...register("wakil")} 
                  className={formFieldClass} 
                  placeholder="Contoh: Jane Smith"
                />
                {errors.wakil && <p className="mt-1 text-xs text-red-500">{errors.wakil.message}</p>}
              </div>

              <div>
                <label htmlFor="kabinet" className={labelClass}>Nama Kabinet (Opsional)</label>
                <input 
                  type="text" 
                  id="kabinet" 
                  {...register("kabinet")} 
                  className={formFieldClass} 
                  placeholder="Contoh: Kabinet Sinergi"
                />
              </div>
              
              <div>
                <label className={labelClass}>Foto Pasangan Calon (Opsional)</label>
                <div className="mt-1 flex flex-col items-center space-y-3">
                    <div className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden group">
                        {imagePreview ? (
                            <>
                                <img 
                                  src={imagePreview} 
                                  alt="Preview Foto Kandidat" 
                                  className="object-contain max-h-full max-w-full"
                                />
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveImage(!!candidate?.image_url && imagePreview === candidate.image_url)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none hover:bg-red-600"
                                    title="Hapus Gambar"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <UploadCloud size={36} className="mx-auto text-gray-400 dark:text-gray-500 mb-1" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Seret & lepas gambar, atau klik untuk memilih.</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Max 5MB (JPG, PNG, GIF, WEBP)</p>
                            </div>
                        )}
                         <input
                            type="file"
                            id="imageFile"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                    </div>
                    {isUploading && <p className="text-xs text-indigo-500 dark:text-indigo-400">Mengunggah gambar...</p>}
                </div>
                <input type="hidden" {...register("image_url")} />
              </div>

              <div>
                <label htmlFor="visi" className={labelClass}>Visi (Opsional)</label>
                <textarea 
                  id="visi" 
                  {...register("visi")} 
                  rows="3" 
                  className={formFieldClass} 
                  placeholder="Tuliskan visi pasangan calon..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="misi" className={labelClass}>Misi (Opsional)</label>
                <textarea 
                  id="misi" 
                  {...register("misi")} 
                  rows="5" 
                  className={formFieldClass} 
                  placeholder="Tuliskan misi pasangan calon (pisahkan per poin jika perlu)..."
                ></textarea>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmitForm)}
              disabled={loading || isUploading}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle size={18} className="mr-2" />
              )}
              {candidate ? 'Simpan Perubahan' : 'Tambah Kandidat'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}