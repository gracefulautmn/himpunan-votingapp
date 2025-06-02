import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, otp, nim, electionTitle, loginPageLogoUrl } = req.body; // Added electionTitle

    if (!email || !otp || !nim) {
      return res.status(400).json({ message: 'Email, OTP, dan NIM diperlukan' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, 
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Optional: Add timeout and retry logic for production
      // tls: {
      //   rejectUnauthorized: process.env.NODE_ENV === 'production' // Enforce valid cert in prod
      // }
    });

    // Verify transporter connection (optional, good for debugging)
    // await transporter.verify(); 

    const mailOptions = {
      from: `"Sistem Voting Online" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`, // Use a specific EMAIL_FROM if different from user
      to: email,
      subject: `Kode Verifikasi untuk ${electionTitle || 'Pemilihan Himpunan'}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; color: #333;">
          ${loginPageLogoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${loginPageLogoUrl.startsWith('http') ? loginPageLogoUrl : process.env.NEXT_PUBLIC_BASE_URL + loginPageLogoUrl}" alt="Logo" style="max-width: 100px; max-height: 100px; border-radius: 5px;"/></div>` : ''}
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 25px; font-weight: 500;">Kode Verifikasi Login</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hai Mahasiswa dengan NIM <strong>${nim}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Kode verifikasi Anda untuk login ke sistem ${electionTitle || 'Pemilihan Himpunan'} adalah:</p>
          <div style="background-color: #ffffff; border: 1px dashed #3498db; padding: 20px; border-radius: 5px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 25px 0; color: #3498db;">
            ${otp}
          </div>
          <p style="font-size: 16px; line-height: 1.6;">Kode ini berlaku selama 10 menit. Mohon untuk tidak memberikan kode ini kepada siapapun.</p>
          <p style="font-size: 16px; line-height: 1.6;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888; text-align: center; line-height: 1.5;">
            Email ini dikirim secara otomatis oleh Sistem Voting Online Universitas Pertamina.<br>
            Mohon untuk tidak membalas email ini.
          </p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'OTP berhasil dikirim ke email Anda.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Provide a more generic error message to the client for security
    let errorMessage = 'Gagal mengirim OTP. Silakan coba lagi nanti.';
    if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Tidak dapat terhubung ke server email. Periksa konfigurasi.';
    } else if (error.responseCode === 535) {
        errorMessage = 'Autentikasi email gagal. Periksa kredensial email.';
    }
    // In development, you might want to return more details:
    // if (process.env.NODE_ENV !== 'production') {
    //   errorMessage = `Gagal mengirim OTP: ${error.message}`;
    // }
    return res.status(500).json({ message: errorMessage, error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
  }
}
