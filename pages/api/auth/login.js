import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim: rawNim, email: rawEmail } = req.body;

  const nim = rawNim ? String(rawNim).trim() : null;
  const email = rawEmail ? String(rawEmail).trim().toLowerCase() : null;

  if (!nim || !email) {
    return res.status(400).json({ message: 'NIM dan Email diperlukan.' });
  }

  if (nim.length < 4) {
    return res.status(400).json({ message: 'NIM tidak valid untuk menentukan program studi (minimal 4 digit).' });
  }

  const emailParts = email.split('@');
  if (emailParts.length < 2) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  try {
    const { data: appSettings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('login_method')
      .eq('id', 1)
      .single();

    if (settingsError) {
      return res.status(500).json({ message: 'Gagal mengambil pengaturan login.' });
    }

    const loginMethod = appSettings?.login_method || 'campus_email_format';
    let userToProcess = null;
    let programNameForResponse = null;
    let programCodeForUser = null;

    if (loginMethod === 'database_email_list') {
      const { data: existingUserByEmail, error: fetchEmailError } = await supabaseAdmin
        .from('users')
        .select('nim, email, program_code, already_vote, allowed_programs(program_name)')
        .eq('email', email)
        .single();

      if (fetchEmailError) {
        if (fetchEmailError.code === 'PGRST116') {
          return res.status(404).json({ message: 'Email tidak terdaftar dalam database. Silakan hubungi admin untuk mendaftar.' });
        }
        return res.status(500).json({ message: 'Gagal memeriksa data pengguna.' });
      }

      if (existingUserByEmail.nim !== nim) {
        return res.status(400).json({ message: 'NIM yang Anda masukkan tidak cocok dengan email yang terdaftar.' });
      }

      userToProcess = existingUserByEmail;
      programCodeForUser = existingUserByEmail.program_code;
      programNameForResponse = existingUserByEmail.allowed_programs?.program_name || existingUserByEmail.program_code;
    } else {
      const nimFromEmail = emailParts[0];

      if (nimFromEmail !== nim) {
        return res.status(400).json({ message: 'NIM yang Anda masukkan harus sama dengan bagian awal email Anda.' });
      }

      const { data: existingUserByNim, error: fetchNimError } = await supabaseAdmin
        .from('users')
        .select('nim, email, program_code, already_vote, allowed_programs(program_name)')
        .eq('nim', nim)
        .single();

      if (fetchNimError && fetchNimError.code !== 'PGRST116') {
        return res.status(500).json({ message: 'Gagal memeriksa data pengguna.' });
      }

      if (existingUserByNim) {
        if (existingUserByNim.email.toLowerCase() !== email) {
          return res.status(400).json({ message: `Email (${email}) yang Anda masukkan tidak cocok dengan NIM (${nim}) yang sudah terdaftar.` });
        }
        userToProcess = existingUserByNim;
        programCodeForUser = existingUserByNim.program_code;
        programNameForResponse = existingUserByNim.allowed_programs?.program_name || existingUserByNim.program_code;
      } else {
        const derivedProgramCode = nim.substring(0, 4);

        const { data: programData, error: programCheckError } = await supabase
          .from('allowed_programs')
          .select('program_code, program_name')
          .eq('program_code', derivedProgramCode)
          .single();

        if (programCheckError || !programData) {
          return res.status(403).json({ message: `Program studi (${derivedProgramCode}) yang berasal dari NIM Anda tidak terdaftar atau tidak diizinkan untuk memilih.` });
        }

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            nim: nim,
            email: email,
            program_code: derivedProgramCode,
          })
          .select('nim, email, program_code, already_vote')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            if (insertError.message.includes('users_email_key')) {
              return res.status(409).json({ message: 'Email sudah digunakan oleh NIM lain.' });
            } else if (insertError.message.includes('users_pkey')) {
              return res.status(409).json({ message: 'NIM ini sudah terdaftar.' });
            }
            return res.status(409).json({ message: 'Gagal mendaftarkan pengguna: NIM atau Email mungkin sudah ada dengan data berbeda.' });
          }
          return res.status(500).json({ message: 'Gagal mendaftarkan pengguna baru.' });
        }
        userToProcess = newUser;
        programCodeForUser = derivedProgramCode;
        programNameForResponse = programData.program_name;
      }
    }

    if (!userToProcess) {
      return res.status(500).json({ message: 'Terjadi kesalahan internal saat memproses data pengguna.' });
    }

    if (userToProcess.already_vote) {
      return res.status(403).json({ message: 'Anda sudah memberikan suara. Tidak dapat login untuk vote lagi.' });
    }

    const { data: otpData, error: otpError } = await supabaseAdmin.rpc('generate_and_store_otp', {
      user_nim: userToProcess.nim,
      user_email: userToProcess.email,
    });

    if (otpError) {
      if (otpError.message.includes('has already voted')) {
        return res.status(403).json({ message: 'Anda sudah memberikan suara.' });
      }
      if (otpError.message.includes('tidak diizinkan untuk vote')) {
        return res.status(403).json({ message: otpError.message });
      }
      if (otpError.message.includes('not found')) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan oleh sistem OTP.' });
      }
      return res.status(500).json({ message: 'Gagal menghasilkan OTP.' });
    }

    const newOtp = otpData;

    const { data: appSettingsForEmail, error: settingsErrorForEmail } = await supabase
      .from('app_settings')
      .select('election_title, login_page_logo_url')
      .eq('id', 1)
      .single();

    const sendOtpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userToProcess.email,
        otp: newOtp,
        nim: userToProcess.nim,
        electionTitle: appSettingsForEmail?.election_title || "Pemilihan Himpunan",
        loginPageLogoUrl: appSettingsForEmail?.login_page_logo_url
      }),
    });

    if (!sendOtpResponse.ok) {
      const sendOtpErrorData = await sendOtpResponse.json();
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
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}