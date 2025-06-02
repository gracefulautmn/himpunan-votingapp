import { supabase } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  switch (req.method) {
    case 'GET':
      // Fetch all allowed programs
      try {
        const { data, error } = await supabase
          .from('allowed_programs')
          .select('*')
          .order('program_name', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching allowed programs:', error);
        return res.status(500).json({ message: 'Gagal mengambil data program studi: ' + error.message });
      }

    case 'POST':
      // Create a new allowed program
      const { program_code, program_name } = req.body;

      if (!program_code || !program_name) {
        return res.status(400).json({ message: 'Kode Program dan Nama Program diperlukan.' });
      }
      if (program_code.length > 10) { // Example length limit, adjust as per your schema
        return res.status(400).json({ message: 'Kode Program terlalu panjang (maks 10 karakter).' });
      }


      try {
        const { data, error } = await supabase
          .from('allowed_programs')
          .insert([{ program_code: program_code.toUpperCase(), program_name }])
          .select()
          .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(409).json({ message: `Program studi dengan kode '${program_code.toUpperCase()}' sudah ada.` });
            }
            throw error;
        }
        return res.status(201).json({ message: 'Program studi berhasil ditambahkan.', program: data });
      } catch (error) {
        console.error('Error creating allowed program:', error);
        return res.status(500).json({ message: 'Gagal menambahkan program studi: ' + error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);