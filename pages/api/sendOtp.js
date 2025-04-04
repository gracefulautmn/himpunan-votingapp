// pages/api/sendOtp.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, otp, nim } = req.body;

    if (!email || !otp || !nim) {
      return res.status(400).json({ message: 'Email, OTP, dan NIM diperlukan' });
    }

    // Konfigurasi transporter Nodemailer
    // Catatan: Sebaiknya simpan kredensial email di environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // misalnya: 'smtp.gmail.com'
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Template email
    const mailOptions = {
      from: `"Violie - Voting Online" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Kode Verifikasi untuk Pemilihan Ketua dan Wakil Himpunan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3949ab; text-align: center;">Kode Verifikasi Login</h2>
          <p>Hai Mahasiswa dengan NIM ${nim},</p>
          <p>Kode verifikasi untuk login ke sistem Pemilihan Ketua dan Wakil Himpunan adalah:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #757575; text-align: center;">
            Ini adalah email otomatis dari sistem Violie. Mohon untuk tidak membalas email ini.
          </p>
        </div>
      `,
    };
    
    // Kirim email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'OTP berhasil dikirim' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: 'Gagal mengirim OTP' });
  }
}