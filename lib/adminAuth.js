import { supabase } from './supabaseClient';

export function requireAdmin(handler) { // Diubah dari requireAuthenticated menjadi requireAdmin
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[requireAdmin] No valid authorization header found');
        return res.status(401).json({ message: 'Token autentikasi diperlukan.' });
      }

      const token = authHeader.substring(7); // Ini adalah access_token

      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('[requireAdmin] Invalid JWT format.');
        return res.status(401).json({ message: 'Format token tidak valid.' });
      }

      const { data: { user, session: userSession }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error('[requireAdmin] Token validation failed or no user found:', userError?.message);
        return res.status(401).json({ message: 'Token tidak valid, telah kedaluwarsa, atau pengguna tidak ditemukan.' });
      }

      // Pemeriksaan peran admin spesifik dihilangkan sesuai permintaan sebelumnya
      // Jika Anda ingin kembali memeriksa peran admin, tambahkan logika di sini.
      // Untuk saat ini, jika getUser berhasil, kita anggap pengguna terautentikasi dan boleh lanjut.
      console.log('[requireAdmin] User authenticated:', user.email);

      req.user = user; // Menggunakan req.user agar konsisten dengan nama fungsi
      req.authToken = token; 
      req.authRefreshToken = userSession?.refresh_token || null;
      
      console.log('[requireAdmin] Authentication successful for:', user.email);
      
      return handler(req, res);
      
    } catch (error) {
      console.error('[requireAdmin] Unexpected error in authentication HOC:', error);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Kesalahan server dalam validasi autentikasi.' });
      }
    }
  };
}