import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

const verificationAttempts = new Map();

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

  const now = Date.now();
  const attempts = verificationAttempts.get(nim) || { count: 0, lastAttempt: 0, lockedUntil: 0 };

  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return res.status(429).json({ 
      message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${remainingTime} menit.` 
    });
  }

  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
  }

  attempts.count++;
  attempts.lastAttempt = now;

  if (attempts.count > 5) {
    attempts.lockedUntil = now + (30 * 60 * 1000);
    verificationAttempts.set(nim, attempts);
    
    return res.status(429).json({ 
      message: 'Terlalu banyak percobaan gagal. Akun dikunci selama 30 menit.' 
    });
  }

  verificationAttempts.set(nim, attempts);

  try {
    const randomDelay = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    const { data: verificationResult, error: rpcError } = await supabaseAdmin.rpc('verify_user_otp', {
      user_nim: nim,
      provided_otp: otp,
    });

    if (rpcError) {
      return res.status(500).json({ message: 'Gagal memverifikasi OTP.' });
    }

    if (verificationResult === true) {
      verificationAttempts.delete(nim);
      
      const { data: user, error: fetchUserError } = await supabaseAdmin
        .from('users')
        .select('already_vote, program_code, allowed_programs(program_name)')
        .eq('nim', nim)
        .single();

      if (fetchUserError) {
        return res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
      }
      
      const programName = user?.allowed_programs?.program_name || user?.program_code || null;

      return res.status(200).json({ 
        message: 'Verifikasi OTP berhasil.',
        alreadyVoted: user?.already_vote,
        programName: programName
      });
    } else {
      return res.status(400).json({ 
        message: 'Kode OTP tidak valid atau telah kedaluwarsa.',
        attemptsRemaining: Math.max(0, 5 - attempts.count)
      });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}