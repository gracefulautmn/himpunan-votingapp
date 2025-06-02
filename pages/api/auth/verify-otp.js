import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, otp } = req.body;

  if (!nim || !otp) {
    return res.status(400).json({ message: 'NIM dan OTP diperlukan.' });
  }

  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Format OTP tidak valid. Harus 6 digit angka.' });
  }

  try {
    // Call Supabase function to verify OTP
    const { data: verificationResult, error: rpcError } = await supabase.rpc('verify_user_otp', {
      user_nim: nim,
      provided_otp: otp,
    });

    if (rpcError) {
      console.error('Error from verify_user_otp RPC:', rpcError);
      return res.status(500).json({ message: 'Gagal memverifikasi OTP: ' + rpcError.message });
    }

    if (verificationResult === true) {
      // OTP valid
      // Optionally, you might want to fetch user's program_name here again if needed for the session
      // or rely on what was set during login.
      // For this example, we assume the necessary session data (nim, email, programName) is already managed by AuthContext on client-side.
      // The function `verify_user_otp` already updates `last_login` and clears OTP fields.
      
      // Fetch already_vote status to return to client, ensuring it's up-to-date
      const { data: user, error: fetchUserError } = await supabase
        .from('users')
        .select('already_vote, program_code, allowed_programs(program_name)')
        .eq('nim', nim)
        .single();

      if (fetchUserError) {
        console.error('Error fetching user status after OTP verification:', fetchUserError);
        // Proceed even if this fails, but log it. Client might have stale `already_vote` if this fails.
      }
      
      const programName = user?.allowed_programs?.program_name || user?.program_code || null;

      return res.status(200).json({ 
        message: 'Verifikasi OTP berhasil.',
        alreadyVoted: user?.already_vote, // Send updated status
        programName: programName
      });
    } else {
      // OTP invalid or expired
      return res.status(400).json({ message: 'Kode OTP tidak valid atau telah kedaluwarsa.' });
    }

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
}