import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, email } = req.body;

  if (!nim || !email) {
    return res.status(400).json({ message: 'NIM dan Email diperlukan untuk mengirim ulang OTP.' });
  }

  try {
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('nim, email, already_vote, program_code')
      .eq('nim', nim)
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'NIM atau Email tidak ditemukan.' });
    }

    if (user.already_vote) {
      return res.status(403).json({ message: 'Anda sudah memberikan suara. Tidak dapat mengirim ulang OTP.' });
    }
    
    const { data: otpData, error: otpError } = await supabaseAdmin.rpc('generate_and_store_otp', {
      user_nim: nim,
      user_email: email,
    });

    if (otpError) {
      if (otpError.message.includes('has already voted')) {
          return res.status(403).json({ message: 'Anda sudah memberikan suara.' });
      }
      if (otpError.message.includes('tidak diizinkan untuk vote')) {
          return res.status(403).json({ message: otpError.message });
      }
      return res.status(500).json({ message: 'Gagal menghasilkan OTP baru.' });
    }

    const newOtp = otpData;

    const { data: appSettings, error: settingsError } = await supabase
        .from('app_settings')
        .select('election_title, login_page_logo_url')
        .eq('id', 1)
        .single();

    const sendOtpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: user.email, 
            otp: newOtp, 
            nim: user.nim,
            electionTitle: appSettings?.election_title || "Pemilihan Himpunan",
            loginPageLogoUrl: appSettings?.login_page_logo_url
        }),
    });

    if (!sendOtpResponse.ok) {
        const sendOtpErrorData = await sendOtpResponse.json();
        return res.status(500).json({ message: `OTP baru dihasilkan tetapi gagal mengirim email: ${sendOtpErrorData.message}.` });
    }

    return res.status(200).json({ message: 'OTP baru telah dikirim ke email Anda.' });

  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}