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

    const { nim, email } = data;
    const programCode = nim.substring(0, 4);

    localStorage.setItem('user_email', email);

    const { data: allowedPrograms, error: allowedProgramsError } = await supabase
      .from('allowed_programs')
      .select('program_code')
      .eq('program_code', programCode);

    if (allowedProgramsError) {
      console.error("Error fetching allowed programs:", allowedProgramsError);
      setAlert({ show: true, message: 'Terjadi kesalahan saat memeriksa program studi.', type: 'error' });
      setLoading(false);
      return;
    }

    if (!allowedPrograms || allowedPrograms.length === 0) {
      setAlert({ show: true, message: 'Program studi Anda tidak diizinkan untuk voting.', type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      console.error("Error sending verification code:", error);
      setAlert({ show: true, message: 'Gagal mengirim kode verifikasi. Periksa email Anda.', type: 'error' });
    } else {
      setAlert({ show: true, message: 'Kode verifikasi telah dikirim ke email Anda.', type: 'success' });
      router.push('/verify');
    }

    setLoading(false);
  };

  return (
    <div className="mt-2">
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      {loading && <Loading />} {/* Tampilkan komponen Loading saat loading true */}
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
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
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
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="nim@student.universitaspertamina.ac.id"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;