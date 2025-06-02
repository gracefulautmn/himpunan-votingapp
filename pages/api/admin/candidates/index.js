import { supabase } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth'; // Helper to protect routes

async function handler(req, res) {
  if (!req.admin) { // Check if admin authentication was successful from withAdminAuth
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  switch (req.method) {
    case 'GET':
      // Fetch all candidates
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        return res.status(500).json({ message: 'Gagal mengambil data kandidat: ' + error.message });
      }

    case 'POST':
      // Create a new candidate
      // Image URL will be provided from client after upload to Supabase Storage
      const { ketua, wakil, kabinet, visi, misi, image_url } = req.body;

      if (!ketua || !wakil) {
        return res.status(400).json({ message: 'Nama Ketua dan Wakil Ketua diperlukan.' });
      }

      try {
        const { data, error } = await supabase
          .from('candidates')
          .insert([{ ketua, wakil, kabinet, visi, misi, image_url }])
          .select()
          .single(); // Assuming you want the created record back

        if (error) throw error;
        return res.status(201).json({ message: 'Kandidat berhasil ditambahkan.', candidate: data });
      } catch (error) {
        console.error('Error creating candidate:', error);
        return res.status(500).json({ message: 'Gagal menambahkan kandidat: ' + error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Wrap the handler with the authentication HOC
export default withAdminAuth(handler);
