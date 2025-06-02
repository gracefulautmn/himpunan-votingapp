// lib/withAdminAuth.js - Modified to check for any authenticated user

import { supabase } from '../lib/supabaseClient';

export function withAdminAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[withAdminAuth] No valid authorization header found');
        return res.status(401).json({ message: 'Token autentikasi diperlukan.' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      // console.log('[withAdminAuth] Token extracted, length:', token.length); // Debug log

      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error('[withAdminAuth] Invalid JWT format.');
        return res.status(401).json({ message: 'Format token tidak valid.' });
      }

      // Get user info from token. If this succeeds, the user is authenticated.
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error('[withAdminAuth] Token validation failed or no user found:', userError?.message);
        return res.status(401).json({ message: 'Token tidak valid, telah kedaluwarsa, atau pengguna tidak ditemukan.' });
      }

      // Jika kita sampai di sini, pengguna sudah terautentikasi.
      // Pemeriksaan peran admin spesifik dihilangkan sesuai permintaan.
      console.log('[withAdminAuth] User authenticated:', user.email);

      // Attach user info and token to request
      // Tetap menggunakan req.admin dan req.admin_jwt agar API handler yang ada tidak perlu diubah namanya
      req.admin = user; 
      req.admin_jwt = token;
      
      // Try to get refresh token from cookie or header (jika Anda menggunakannya)
      req.admin_refresh_token = req.cookies?.refresh_token || req.headers['x-refresh-token'];
      
      console.log('[withAdminAuth] Authentication successful (user is authenticated):', user.email);
      
      return handler(req, res);
      
    } catch (error) {
      console.error('[withAdminAuth] Unexpected error in authentication HOC:', error);
      return res.status(500).json({ message: 'Kesalahan server dalam validasi autentikasi.' });
    }
  };
}

// Fungsi checkAdminRole tidak lagi diperlukan untuk pemeriksaan 'authenticated' saja.
// async function checkAdminRole(user) {
//   // Implement your admin role checking logic here
//   // ... (logika lama untuk cek admin) ...
// }
