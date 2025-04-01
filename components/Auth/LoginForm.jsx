import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '../../utils/supabaseClient';
import Alert from '../Alert';
import Loading from '../Loading'; 
import { UserIcon, MailIcon } from 'lucide-react';

const schema = z.object({
  nim: z.string()
    .length(9, { message: "NIM harus 9 angka." })
    .regex(/^\d+$/, { message: "NIM harus berupa angka." }),

  email: z.string()
    .email({ message: "Email tidak valid." })
    .refine(email => email.endsWith("@student.universitaspertamina.ac.id"), {
      message: "Email harus menggunakan domain @student.universitaspertamina.ac.id"
    })
}).superRefine((data, ctx) => {
  if (data.email !== `${data.nim}@student.universitaspertamina.ac.id`) {
    ctx.addIssue({
      path: ["email"],
      message: "Email harus sesuai dengan NIM"
    });
  }
});

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });

    try {
      const { nim, email } = data;
      const programCode = nim.substring(0, 4);

      localStorage.setItem('user_email', email);

      const { data: allowedPrograms, error: allowedProgramsError } = await supabase
        .from('allowed_programs')
        .select('program_code')
        .eq('program_code', programCode);

      if (allowedProgramsError) throw allowedProgramsError;

      if (!allowedPrograms || allowedPrograms.length === 0) {
        throw new Error('Program studi Anda tidak diizinkan untuk voting.');
      }

      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) throw error;

      setAlert({ 
        show: true, 
        message: 'Kode verifikasi telah dikirim ke email Anda.', 
        type: 'success' 
      });
      
      // Redirect after showing success message
      setTimeout(() => router.push('/verify'), 1500);
    } catch (error) {
      console.error("Error:", error);
      setAlert({ 
        show: true, 
        message: error.message || 'Terjadi kesalahan saat memproses permintaan.', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 z-10"></div>
      )}
      
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <label htmlFor="nim" className="block text-sm font-medium text-gray-700 mb-1">
            NIM:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <UserIcon size={18} />
            </span>
            <input
              type="text"
              id="nim"
              {...register("nim")}
              disabled={loading}
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 ${loading ? 'bg-gray-100' : ''}`}
              placeholder="Masukkan NIM"
            />
          </div>
          {errors.nim && <p className="mt-1 text-sm text-red-600">{errors.nim.message}</p>}
        </div>

        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <MailIcon size={18} />
            </span>
            <input
              type="email"
              id="email"
              {...register("email")}
              disabled={loading}
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 ${loading ? 'bg-gray-100' : ''}`}
              placeholder="nim@student.universitaspertamina.ac.id"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-colors duration-200 relative"
          >
            {loading ? (
              <>
                <span className="opacity-0">Login</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;