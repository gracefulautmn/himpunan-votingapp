import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  const { id } = req.query;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) {
    return res.status(400).json({ message: 'ID kandidat tidak valid.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabaseAdmin
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ message: 'Kandidat tidak ditemukan.' });
          }
          throw error;
        }
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil data kandidat.' });
      }

    case 'PUT':
      const { ketua, wakil, kabinet, visi, misi, image_url } = req.body;

      if (!ketua || !wakil) {
        return res.status(400).json({ message: 'Nama Ketua dan Wakil Ketua diperlukan.' });
      }

      try {
        const { data, error } = await supabaseAdmin
          .from('candidates')
          .update({ ketua, wakil, kabinet, visi, misi, image_url, updated_at: new Date().toISOString() })
          .eq('id', candidateId)
          .select()
          .single();

        if (error) {
           if (error.code === 'PGRST116') {
            return res.status(404).json({ message: 'Kandidat tidak ditemukan untuk diperbarui.' });
          }
          throw error;
        }
        return res.status(200).json({ message: 'Kandidat berhasil diperbarui.', candidate: data });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal memperbarui kandidat.' });
      }

    case 'DELETE':
      try {
        const { data: candidateData, error: fetchError } = await supabaseAdmin
            .from('candidates')
            .select('image_url')
            .eq('id', candidateId)
            .single();
        
        const { error: deleteDbError } = await supabaseAdmin
          .from('candidates')
          .delete()
          .eq('id', candidateId);

        if (deleteDbError) {
          if (deleteDbError.code === '23503') {
             return res.status(409).json({ message: 'Gagal menghapus kandidat: Kandidat ini memiliki suara terkait. Hapus suara terlebih dahulu.' });
          }
          throw deleteDbError;
        }
        
        if (candidateData && candidateData.image_url) {
            const { error: storageError } = await supabase.storage
                .from('gambar')
                .remove([candidateData.image_url]);
        }

        return res.status(200).json({ message: `Kandidat dengan ID ${candidateId} berhasil dihapus.` });
      } catch (error) {
        return res.status(500).json({ message: 'Gagal menghapus kandidat.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);