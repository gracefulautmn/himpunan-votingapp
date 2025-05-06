import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '../../utils/supabaseClient';
import Alert from '../Alert';
import Loading from '../Loading';
import { UserIcon, MailIcon } from 'lucide-react';

// Skema validasi sama seperti sebelumnya
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
  
      // Simpan email di localStorage untuk digunakan nanti
      localStorage.setItem('user_email', email);
  
      // Cek apakah program studi diizinkan
      const { data: allowedPrograms, error: allowedProgramsError } = await supabase
        .from('allowed_programs')
        .select('program_code')
        .eq('program_code', programCode);
  
      if (allowedProgramsError) throw allowedProgramsError;
      if (!allowedPrograms || allowedPrograms.length === 0) {
        throw new Error('Program studi Anda tidak diizinkan untuk voting.');
      }
  
      // Cek apakah user sudah terdaftar dan apakah sudah voting
      const { data: users, error: userError } = await supabase
  .from('users')
  .select('id, already_vote')
  .eq('email', email);
  
if (userError) throw userError;

const existingUser = users && users.length > 0 ? users[0] : null;

// Then modify the check for already voted:
if (existingUser && existingUser.already_vote) {
    setAlert({ 
      show: true, 
      message: 'Anda sudah melakukan voting. Tidak dapat login lagi.', 
      type: 'error' 
    });
    setLoading(false);
    return;  // Stop execution
  }
  
      // Jika user sudah voting, hentikan proses login
      
  
      // Buat OTP 6 digit
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP berlaku 15 menit
  
      if (!existingUser) {
        // Jika user belum terdaftar, tambahkan ke database
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            { 
              email: email,
              nim: nim,
              program_code: programCode,
              otp: otp,
              otp_expires_at: expiresAt,
              already_vote: false
            }
          ]);
        
        if (insertError) throw insertError;
      } else {
        // Update OTP untuk user yang sudah ada
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            otp: otp,
            otp_expires_at: expiresAt
          })
          .eq('email', email);
        
        if (updateError) throw updateError;
      }
  
      // Kirim OTP menggunakan API route yang akan menggunakan Nodemailer
      const response = await fetch('/api/sendOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp,
          nim
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengirim OTP');
      }
  
      setAlert({ 
        show: true, 
        message: 'Kode verifikasi telah dikirim ke email Anda.', 
        type: 'success' 
      });
  
      // Simpan NIM di localStorage untuk proses verifikasi
      localStorage.setItem('user_nim', nim);
  
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
    <div className="mt-2">
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <label htmlFor="nim" className="block text-sm font-medium text-gray-700 mb-1">
            NIM:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-500 bg-gray-50 text-gray-500">
              <UserIcon size={18} />
            </span>
            <input
              type="text"
              id="nim"
              {...register("nim")}
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200 relative"
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