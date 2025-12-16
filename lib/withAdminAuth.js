import { supabase, supabaseAdmin } from '../lib/supabaseClient';

export function withAdminAuth(handler) {
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

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return res.status(401).json({ message: 'Token tidak valid, telah kedaluwarsa, atau pengguna tidak ditemukan.' });
      }

      const isAdmin = await verifyAdminRole(user);
      
      if (!isAdmin) {
        return res.status(403).json({ 
          message: 'Akses ditolak. Hanya administrator yang dapat mengakses resource ini.' 
        });
      }

      req.admin = user; 
      req.admin_jwt = token;
      req.admin_refresh_token = req.cookies?.refresh_token || req.headers['x-refresh-token'];
      
      return handler(req, res);
      
    } catch (error) {
      return res.status(500).json({ message: 'Kesalahan server dalam validasi autentikasi.' });
    }
  };
}

async function verifyAdminRole(user) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('email, is_active')
      .eq('email', user.email.toLowerCase())
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      const adminEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
      const adminList = adminEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      if (adminList.length > 0) {
        return adminList.includes(user.email.toLowerCase());
      }
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
