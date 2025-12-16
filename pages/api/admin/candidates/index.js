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
          .from('candidates')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil data kandidat.' });
      }

    case 'POST':
      const { ketua, wakil, kabinet, visi, misi, image_url } = req.body;

      if (!ketua || !wakil) {
        return res.status(400).json({ message: 'Nama Ketua dan Wakil Ketua diperlukan.' });
      }

      try {
        const { data, error } = await supabaseAdmin
          .from('candidates')
          .insert([{ ketua, wakil, kabinet, visi, misi, image_url }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ message: 'Kandidat berhasil ditambahkan.', candidate: data });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal menambahkan kandidat.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
