import { supabase } from './supabaseClient';

export function requireAdmin(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token autentikasi diperlukan.' });
      }

      const token = authHeader.substring(7);

      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        return res.status(401).json({ message: 'Format token tidak valid.' });
      }

      const { data: { user, session: userSession }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return res.status(401).json({ message: 'Token tidak valid, telah kedaluwarsa, atau pengguna tidak ditemukan.' });
      }

      req.user = user;
      req.authToken = token; 
      req.authRefreshToken = userSession?.refresh_token || null;
      
      return handler(req, res);
      
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Kesalahan server dalam validasi autentikasi.' });
      }
    }
  };
}