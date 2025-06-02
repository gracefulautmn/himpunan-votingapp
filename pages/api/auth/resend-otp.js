import { supabase } from '../../../lib/supabaseClient';
// We'll reuse the sendOtp API logic or Nodemailer directly.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, email } = req.body;

  if (!nim || !email) {
    return res.status(400).json({ message: 'NIM dan Email diperlukan untuk mengirim ulang OTP.' });
  }

  try {
    // 1. Fetch user to ensure they exist and haven't voted
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('nim, email, already_vote, program_code')
      .eq('nim', nim)
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user for resend OTP:', fetchError);
      return res.status(500).json({ message: 'Gagal mengambil data pengguna: ' + fetchError.message });
    }

    if (!user) {
      return res.status(404).json({ message: 'NIM atau Email tidak ditemukan.' });
    }

    if (user.already_vote) {
      return res.status(403).json({ message: 'Anda sudah memberikan suara. Tidak dapat mengirim ulang OTP.' });
    }
    
    // 2. Call Supabase function to generate and store a NEW OTP
    const { data: otpData, error: otpError } = await supabase.rpc('generate_and_store_otp', {
      user_nim: nim,
      user_email: email, // Pass email to the function as it expects it
    });

    if (otpError) {
      console.error('Error from generate_and_store_otp RPC (resend):', otpError);
      if (otpError.message.includes('has already voted')) {
          return res.status(403).json({ message: 'Anda sudah memberikan suara.' });
      }
      if (otpError.message.includes('tidak diizinkan untuk vote')) {
          return res.status(403).json({ message: otpError.message });
      }
      return res.status(500).json({ message: 'Gagal menghasilkan OTP baru: ' + otpError.message });
    }

    const newOtp = otpData;

    // 3. Fetch app settings for email template
    const { data: appSettings, error: settingsError } = await supabase
        .from('app_settings')
        .select('election_title, login_page_logo_url')
        .eq('id', 1)
        .single();

    if(settingsError){
        console.warn("Could not fetch app settings for resend OTP email template:", settingsError.message);
    }

    // 4. Send the new OTP via email (calling the sendOtp API route or using Nodemailer logic)
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
        console.error('Failed to resend OTP email via API:', sendOtpErrorData.message);
        return res.status(500).json({ message: `OTP baru dihasilkan tetapi gagal mengirim email: ${sendOtpErrorData.message}.` });
    }

    return res.status(200).json({ message: 'OTP baru telah dikirim ke email Anda.' });

  } catch (error) {
    console.error('Resend OTP API error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
}