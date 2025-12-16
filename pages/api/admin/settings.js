import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';
import { withAdminAuth } from '../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabaseAdmin
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ message: 'Pengaturan aplikasi tidak ditemukan. Harap inisialisasi terlebih dahulu.' });
          }
          throw error;
        }
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil pengaturan aplikasi.' });
      }

    case 'POST':
      const {
        login_page_logo_url,
        header_logo1_url,
        header_logo2_url,
        login_method,
        election_title,
      } = req.body;

      if (!login_method || !election_title) {
        return res.status(400).json({ message: 'Metode login dan Judul Pemilihan diperlukan.' });
      }
      if (!['campus_email_format', 'database_email_list'].includes(login_method)) {
        return res.status(400).json({ message: 'Metode login tidak valid.' });
      }

      try {
        const updates = {
          login_page_logo_url: login_page_logo_url || null,
          header_logo1_url: header_logo1_url || null,
          header_logo2_url: header_logo2_url || null,
          login_method,
          election_title,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from('app_settings')
          .update(updates)
          .eq('id', 1)
          .select()
          .single();

        if (error) {
            if (error.code === 'PGRST116') {
                 return res.status(404).json({ message: 'Pengaturan aplikasi tidak ditemukan untuk diperbarui.' });
            }
            throw error;
        }
        return res.status(200).json({ message: 'Pengaturan aplikasi berhasil diperbarui.', settings: data });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal memperbarui pengaturan aplikasi.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
