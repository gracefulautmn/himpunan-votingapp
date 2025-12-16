import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration is incomplete');
    }

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    });
  }
  return transporter;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, otp, nim, electionTitle, loginPageLogoUrl } = req.body;

    if (!email || !otp || !nim) {
      return res.status(400).json({ message: 'Email, OTP, dan NIM diperlukan' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Format OTP tidak valid' });
    }

    const sanitizedNim = nim.replace(/[<>]/g, '');
    const sanitizedTitle = (electionTitle || 'Pemilihan Himpunan').replace(/[<>]/g, '');
    
    const transport = getTransporter(); 

    const escapeHtml = (text) => {
      return text.replace(/[&<>"']/g, (char) => {
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escapeMap[char];
      });
    };

    const safeNim = escapeHtml(sanitizedNim);
    const safeTitle = escapeHtml(sanitizedTitle);
    const safeOtp = escapeHtml(otp);
    
    let safeLogo = '';
    if (loginPageLogoUrl) {
      try {
        const url = new URL(loginPageLogoUrl, process.env.NEXT_PUBLIC_BASE_URL);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          safeLogo = url.toString();
        }
      } catch (e) {
        safeLogo = '';
      }
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistem Voting Online'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Kode Verifikasi untuk ${safeTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kode Verifikasi OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
            ${safeLogo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${safeLogo}" alt="Logo" style="max-width: 100px; max-height: 100px; border-radius: 5px;"/></div>` : ''}
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 25px;">Kode Verifikasi Login</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Hai Mahasiswa dengan NIM <strong>${safeNim}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Kode verifikasi Anda untuk login ke sistem ${safeTitle} adalah:</p>
            <div style="background-color: #f8f9fa; border: 2px solid #3498db; padding: 20px; border-radius: 5px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 25px 0; color: #3498db;">
              ${safeOtp}
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Kode ini berlaku selama <strong>10 menit</strong>. Mohon untuk tidak memberikan kode ini kepada siapapun.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dan segera hubungi administrator.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #888; text-align: center; line-height: 1.5;">
              Email ini dikirim secara otomatis oleh Sistem Voting Online.<br>
              Mohon untuk tidak membalas email ini.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Kode verifikasi Anda adalah: ${safeOtp}\n\nKode ini berlaku selama 10 menit.`
    };
    
    await transport.sendMail(mailOptions);

    return res.status(200).json({ message: 'OTP berhasil dikirim ke email Anda.' });
    
  } catch (error) {
    let errorMessage = 'Gagal mengirim OTP. Silakan coba lagi nanti.';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Layanan email sedang tidak tersedia. Silakan hubungi administrator.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Konfigurasi email bermasalah. Silakan hubungi administrator.';
    } else if (error.responseCode === 550) {
      errorMessage = 'Alamat email tidak valid atau tidak dapat menerima pesan.';
    }
    
    return res.status(500).json({ message: errorMessage });
  }
}
