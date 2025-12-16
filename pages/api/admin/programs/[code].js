import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  const { code } = req.query;
  const programCode = code.toUpperCase(); // Ensure consistency

  if (!programCode) {
    return res.status(400).json({ message: 'Kode program diperlukan.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabaseAdmin
          .from('allowed_programs')
          .select('*')
          .eq('program_code', programCode)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ message: 'Program studi tidak ditemukan.' });
          }
          throw error;
        }
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil data program studi.' });
      }

    case 'PUT':
      const { program_name } = req.body; // Only program_name can be updated, code is PK

      if (!program_name) {
        return res.status(400).json({ message: 'Nama Program diperlukan.' });
      }

      try {
        const { data, error } = await supabaseAdmin
          .from('allowed_programs')
          .update({ program_name, updated_at: new Date().toISOString() })
          .eq('program_code', programCode)
          .select()
          .single();

        if (error) {
           if (error.code === 'PGRST116') {
            return res.status(404).json({ message: 'Program studi tidak ditemukan untuk diperbarui.' });
          }
          throw error;
        }
        return res.status(200).json({ message: 'Program studi berhasil diperbarui.', program: data });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal memperbarui program studi.' });
      }

    case 'DELETE':
      try {
        const { error } = await supabaseAdmin
          .from('allowed_programs')
          .delete()
          .eq('program_code', programCode);

        if (error) {
          if (error.code === '23503') {
             return res.status(409).json({ message: 'Gagal menghapus program studi: Masih ada pengguna yang terdaftar pada program studi ini.' });
          }
          throw error;
        }
        return res.status(200).json({ message: `Program studi dengan kode '${programCode}' berhasil dihapus.` });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal menghapus program studi.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']); // GET might be optional here
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
