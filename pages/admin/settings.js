import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';
import { Settings, Save, Image as ImageIcon, UploadCloud, Trash2, Info } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabaseClient';
import { useAppSettings } from '../../context/AppSettingsContext';

const settingsSchema = z.object({
  election_title: z.string().min(1, "Judul pemilihan tidak boleh kosong."),
  login_method: z.enum(['campus_email_format', 'database_email_list'], {
    errorMap: () => ({ message: "Pilih metode login yang valid." })
  }),
  login_page_logo_url: z.string().url("URL logo tidak valid.").optional().or(z.literal('')),
  header_logo1_url: z.string().url("URL logo tidak valid.").optional().or(z.literal('')),
  header_logo2_url: z.string().url("URL logo tidak valid.").optional().or(z.literal('')),
});

const ImageUploadField = ({ name, label, currentImageUrl, setValue, supabaseClient, setFormAlert, control }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(currentImageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setImagePreview(currentImageUrl || null);
    }, [currentImageUrl]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Max 2MB for logos
                setFormAlert({ show: true, message: 'Ukuran gambar maksimal 2MB.', type: 'error' });
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
                setFormAlert({ show: true, message: 'Format gambar tidak valid (JPG, PNG, WEBP, SVG).', type: 'error' });
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
            setFormAlert({ show: false });
        }
    };

    const triggerImageUploadAndSetUrl = async () => {
        if (!imageFile) {
            if (!imagePreview && currentImageUrl) {
                 setValue(name, '', { shouldValidate: true, shouldDirty: true });
            }
            return currentImageUrl;
        }
        
        setIsUploading(true);
        setFormAlert({ show: false });
        const fileName = `app_logos/${name}_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        
        try {
            if (currentImageUrl && currentImageUrl !== imagePreview) {
                try {
                    const urlObject = new URL(currentImageUrl);
                    const pathParts = urlObject.pathname.split('/');
                    const bucketNameIndex = pathParts.indexOf('gambar');
                    if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathParts.length) {
                        const oldImagePath = pathParts.slice(bucketNameIndex + 1).join('/');
                        if(oldImagePath.startsWith('app_logos/')) {
                            await supabaseClient.storage.from('gambar').remove([oldImagePath]);
                        }
                    }
                } catch (e) {
                    console.warn("Could not parse or delete old image URL:", currentImageUrl, e);
                }
            }

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('gambar')
                .upload(fileName, imageFile, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage.from('gambar').getPublicUrl(uploadData.path);
            setValue(name, publicUrlData.publicUrl, { shouldValidate: true, shouldDirty: true });
            setImageFile(null);
            return publicUrlData.publicUrl;
        } catch (err) {
            console.error(`Error uploading ${name}:`, err);
            setFormAlert({ show: true, message: `Gagal mengunggah ${label}: ${err.message}`, type: 'error' });
            return currentImageUrl;
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (imageFile) {
            triggerImageUploadAndSetUrl();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageFile]);
    
    const handleRemoveImage = () => {
        setValue(name, '', { shouldValidate: true, shouldDirty: true });
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFormAlert({ show: false });
    };

    return (
        <div className="space-y-2 p-3 border dark:border-gray-700 rounded-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="flex flex-col items-center space-y-3">
                <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden group bg-gray-50 dark:bg-gray-700/50">
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} alt={`Preview ${label}`} className="object-contain max-h-full max-w-full rounded"/>
                            <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none hover:bg-red-600" title="Hapus Gambar">
                                <Trash2 size={14}/>
                            </button>
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <ImageIcon size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pilih atau seret gambar</p>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}/>
                </div>
                {isUploading && <p className="text-xs text-indigo-500 dark:text-indigo-400 animate-pulse">Mengunggah...</p>}
                <Controller
                    name={name}
                    control={control}
                    render={({ field }) => <input type="hidden" {...field} />}
                />
            </div>
        </div>
    );
};


export default function AdminSettingsPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [formAlert, setFormAlert] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateSettings: updateContextSettings } = useAppSettings();

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        election_title: '',
        login_method: 'campus_email_format',
        login_page_logo_url: '',
        header_logo1_url: '',
        header_logo2_url: '',
    }
  });

  const fetchSettings = async () => {
    setLoadingData(true);
    setPageError(null);
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setPageError('Sesi tidak valid. Silakan login kembali.');
          setLoadingData(false);
          return;
        }

        const response = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (!response.ok) {
            const errData = await response.json();
            if (response.status === 404) {
                setPageError("Pengaturan aplikasi belum diinisialisasi. Simpan pengaturan default untuk memulai.");
            } else {
                throw new Error(errData.message || `Gagal mengambil pengaturan (status: ${response.status})`);
            }
        } else {
            const data = await response.json();
            reset(data);
        }
    } catch (err) {
        console.error("Error fetching settings:", err);
        setPageError(err.message);
    } finally {
        setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmitSettings = async (formData) => {
    setIsSubmitting(true);
    setFormAlert({ show: false, message: '', type: '' });
    
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setFormAlert({ show: true, message: 'Sesi tidak valid. Silakan login kembali untuk menyimpan.', type: 'error' });
          setIsSubmitting(false);
          return;
        }

        const response = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menyimpan pengaturan.');
        }
        
        setFormAlert({ show: true, message: result.message, type: 'success' });
        reset(result.settings); 
        updateContextSettings(result.settings);
        
    } catch (err) {
        console.error("Save settings error:", err);
        setFormAlert({ show: true, message: err.message, type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const watchedLoginPageLogoUrl = watch('login_page_logo_url');
  const watchedHeaderLogo1Url = watch('header_logo1_url');
  const watchedHeaderLogo2Url = watch('header_logo2_url');

  // AdminLayout tidak lagi diterapkan langsung di return JSX utama
  if (loadingData) {
    // Saat loading, kita juga ingin AdminLayout diterapkan jika sudah terautentikasi
    // Namun, karena fetchSettings bergantung pada sesi, kita tampilkan Loading global dulu
    // Atau, jika ingin layout tetap ada saat loading, AdminLayout perlu menangani state loading internal
    // Untuk saat ini, halaman settings akan di-render oleh _app.js dengan getLayout
    // jadi return Loading di sini akan berada di dalam AdminLayout jika getLayout sudah dipanggil
    return <Loading message="Memuat pengaturan..." />;
  }

  return (
    <>
      <Head>
        <title>Pengaturan Aplikasi - Admin Panel</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Pengaturan Umum Aplikasi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Konfigurasi tampilan, judul, dan metode login untuk sistem voting.
        </p>
      </div>

      {pageError && !loadingData && <Alert message={pageError} type="info" onClose={() => setPageError(null)} />}
      
      <form onSubmit={handleSubmit(onSubmitSettings)} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 space-y-6">
        {formAlert.show && <Alert message={formAlert.message} type={formAlert.type} onClose={() => setFormAlert({ show: false })} />}

        <div>
          <label htmlFor="election_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Pemilihan</label>
          <input 
            type="text" 
            id="election_title" 
            {...register("election_title")}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Contoh: Pemilihan Ketua HMIK 2025"
          />
          {errors.election_title && <p className="mt-1 text-xs text-red-500">{errors.election_title.message}</p>}
        </div>

        <div>
          <label htmlFor="login_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metode Login Pemilih</label>
          <select 
            id="login_method" 
            {...register("login_method")}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="campus_email_format">Validasi Format Email Kampus (@student.universitaspertamina.ac.id)</option>
            <option value="database_email_list">Berdasarkan Daftar Email di Database Pengguna</option>
          </select>
          {errors.login_method && <p className="mt-1 text-xs text-red-500">{errors.login_method.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <ImageUploadField 
                name="login_page_logo_url"
                label="Logo Halaman Login (Tengah)"
                currentImageUrl={watchedLoginPageLogoUrl}
                setValue={setValue}
                supabaseClient={supabase}
                setFormAlert={setFormAlert}
                control={control}
            />
            <ImageUploadField 
                name="header_logo1_url"
                label="Logo Header Kiri 1"
                currentImageUrl={watchedHeaderLogo1Url}
                setValue={setValue}
                supabaseClient={supabase}
                setFormAlert={setFormAlert}
                control={control}
            />
            <ImageUploadField 
                name="header_logo2_url"
                label="Logo Header Kiri 2"
                currentImageUrl={watchedHeaderLogo2Url}
                setValue={setValue}
                supabaseClient={supabase}
                setFormAlert={setFormAlert}
                control={control}
            />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Unggah gambar baru akan otomatis memicu penyimpanan URL dan menggantikan gambar lama (jika ada) di storage. Kosongkan untuk menghapus logo.
        </p>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save size={18} className="mr-2" />
            )}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </>
  );
}

// AdminLayout diterapkan di sini oleh _app.js melalui getLayout
AdminSettingsPage.getLayout = function getLayout(page) {
  return <AdminLayout pageTitle="Pengaturan Aplikasi">{page}</AdminLayout>;
};
