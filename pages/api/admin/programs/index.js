import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabaseAdmin
          .from('allowed_programs')
          .select('*')
          .order('program_name', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil data program studi.' });
      }

    case 'POST':
      const { program_code, program_name } = req.body;

      if (!program_code || !program_name) {
        return res.status(400).json({ message: 'Kode Program dan Nama Program diperlukan.' });
      }
      if (program_code.length > 10) {
        return res.status(400).json({ message: 'Kode Program terlalu panjang (maks 10 karakter).' });
      }

      try {
        const { data, error } = await supabaseAdmin
          .from('allowed_programs')
          .insert([{ program_code: program_code.toUpperCase(), program_name }])
          .select()
          .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ message: `Program studi dengan kode '${program_code.toUpperCase()}' sudah ada.` });
            }
            throw error;
        }
        return res.status(201).json({ message: 'Program studi berhasil ditambahkan.', program: data });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal menambahkan program studi.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);