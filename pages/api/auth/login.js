import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim: rawNim, email: rawEmail } = req.body;

  // Validasi dan normalisasi input
  const nim = rawNim ? String(rawNim).trim() : null;
  const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null; // Email selalu lowercase

  if (!nim || !email) {
    return res.status(400).json({ message: 'NIM dan Email diperlukan.' });
  }

  if (nim.length < 4) { // Membutuhkan minimal 4 digit untuk mengambil program_code
    return res.status(400).json({ message: 'NIM tidak valid untuk menentukan program studi (minimal 4 digit).' });
  }

  // --- VALIDASI BARU: Pastikan NIM dari input sama dengan bagian NIM di email ---
  const emailParts = email.split('@');
  if (emailParts.length < 2) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }
  const nimFromEmail = emailParts[0]; // Ambil bagian sebelum '@'

  if (nimFromEmail !== nim) {
    return res.status(400).json({ message: 'NIM yang Anda masukkan harus sama dengan bagian awal email Anda.' });
  }
  // --- AKHIR VALIDASI BARU ---

  try {
    let userToProcess = null;
    let programNameForResponse = null;
    let programCodeForUser = null;

    // Langkah 1: Cek apakah NIM sudah ada
    const { data: existingUserByNim, error: fetchNimError } = await supabase
      .from('users')
      .select('nim, email, program_code, already_vote, allowed_programs(program_name)')
      .eq('nim', nim)
      .single();

    if (fetchNimError && fetchNimError.code !== 'PGRST116') { // PGRST116: baris tidak ditemukan
      console.error('Database error fetching user by NIM:', fetchNimError);
      return res.status(500).json({ message: 'Gagal memeriksa data pengguna: ' + fetchNimError.message });
    }

    if (existingUserByNim) { // Jika NIM ditemukan
      if (existingUserByNim.email.toLowerCase() !== email) {
        return res.status(400).json({ message: `Email (${email}) yang Anda masukkan tidak cocok dengan NIM (${nim}) yang sudah terdaftar.` });
      }
      // NIM dan Email cocok, pengguna sudah ada
      userToProcess = existingUserByNim;
      programCodeForUser = existingUserByNim.program_code;
      programNameForResponse = existingUserByNim.allowed_programs?.program_name || existingUserByNim.program_code;
    } else {
      // Jika NIM tidak ditemukan, ini adalah upaya pendaftaran pengguna baru
      const derivedProgramCode = nim.substring(0, 4);

      // Langkah 2: Validasi derivedProgramCode dengan tabel allowed_programs
      const { data: programData, error: programCheckError } = await supabase
        .from('allowed_programs')
        .select('program_code, program_name')
        .eq('program_code', derivedProgramCode)
        .single();

      if (programCheckError || !programData) {
        console.warn(`Program code validation failed for ${derivedProgramCode}:`, programCheckError);
        return res.status(403).json({ message: `Program studi (${derivedProgramCode}) yang berasal dari NIM Anda tidak terdaftar atau tidak diizinkan untuk memilih.` });
      }

      // Langkah 3: Daftarkan pengguna baru
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nim: nim,
          email: email,
          program_code: derivedProgramCode,
        })
        .select('nim, email, program_code, already_vote')
        .single();

      if (insertError) {
        console.error('Error inserting new user:', insertError);
        if (insertError.code === '23505') { // Pelanggaran unique constraint
          if (insertError.message.includes('users_email_key')) {
            return res.status(409).json({ message: 'Email sudah digunakan oleh NIM lain.' });
          } else if (insertError.message.includes('users_pkey')) {
            return res.status(409).json({ message: 'NIM ini sudah terdaftar (kesalahan sistem, hubungi admin).' });
          }
          return res.status(409).json({ message: 'Gagal mendaftarkan pengguna: NIM atau Email mungkin sudah ada dengan data berbeda.' });
        }
        return res.status(500).json({ message: 'Gagal mendaftarkan pengguna baru: ' + insertError.message });
      }
      userToProcess = newUser;
      programCodeForUser = derivedProgramCode;
      programNameForResponse = programData.program_name;
      console.log('Pengguna baru berhasil didaftarkan:', userToProcess.nim);
    }

    if (!userToProcess) {
      console.error('Fatal: userToProcess is null after existence check or insert attempt.');
      return res.status(500).json({ message: 'Terjadi kesalahan internal saat memproses data pengguna.' });
    }

    // Langkah 4: Cek apakah pengguna sudah pernah vote
    if (userToProcess.already_vote) {
      return res.status(403).json({ message: 'Anda sudah memberikan suara. Tidak dapat login untuk vote lagi.' });
    }

    // Langkah 5: Panggil fungsi RPC untuk generate dan simpan OTP
    const { data: otpData, error: otpError } = await supabase.rpc('generate_and_store_otp', {
      user_nim: userToProcess.nim,
      user_email: userToProcess.email,
    });

    if (otpError) {
      console.error('Error from generate_and_store_otp RPC:', otpError);
      if (otpError.message.includes('has already voted')) {
        return res.status(403).json({ message: 'Anda sudah memberikan suara (dicek oleh sistem).' });
      }
      if (otpError.message.includes('tidak diizinkan untuk vote')) {
        return res.status(403).json({ message: otpError.message });
      }
      if (otpError.message.includes('not found')) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan oleh sistem OTP (kemungkinan masalah sinkronisasi, coba lagi).' });
      }
      return res.status(500).json({ message: 'Gagal menghasilkan OTP: ' + otpError.message });
    }

    const newOtp = otpData;

    // Langkah 6: Ambil pengaturan aplikasi untuk template email
    const { data: appSettings, error: settingsError } = await supabase
      .from('app_settings')
      .select('election_title, login_page_logo_url')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.warn("Could not fetch app settings for email template:", settingsError.message);
    }

    // Langkah 7: Kirim OTP via email
    const sendOtpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userToProcess.email,
        otp: newOtp,
        nim: userToProcess.nim,
        electionTitle: appSettings?.election_title || "Pemilihan Himpunan",
        loginPageLogoUrl: appSettings?.login_page_logo_url
      }),
    });

    if (!sendOtpResponse.ok) {
      const sendOtpErrorData = await sendOtpResponse.json();
      console.error('Failed to send OTP email via API:', sendOtpErrorData.message);
      return res.status(500).json({ message: `OTP dihasilkan tetapi gagal mengirim email: ${sendOtpErrorData.message}. Coba kirim ulang OTP.` });
    }

    return res.status(200).json({
      message: 'OTP telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam.',
      nim: userToProcess.nim,
      email: userToProcess.email,
      programName: programNameForResponse,
      alreadyVoted: userToProcess.already_vote
    });

  } catch (error) {
    console.error('Login API general error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
}