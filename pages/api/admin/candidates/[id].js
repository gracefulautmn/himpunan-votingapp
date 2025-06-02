import { supabase } from '../../../../lib/supabaseClient';
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
      // Fetch a single candidate by ID
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // PostgREST error for "No rows found"
            return res.status(404).json({ message: 'Kandidat tidak ditemukan.' });
          }
          throw error;
        }
        return res.status(200).json(data);
      } catch (error) {
        console.error(`Error fetching candidate ${candidateId}:`, error);
        return res.status(500).json({ message: `Gagal mengambil data kandidat: ${error.message}` });
      }

    case 'PUT':
      // Update an existing candidate
      const { ketua, wakil, kabinet, visi, misi, image_url } = req.body;

      if (!ketua || !wakil) {
        return res.status(400).json({ message: 'Nama Ketua dan Wakil Ketua diperlukan.' });
      }

      try {
        const { data, error } = await supabase
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
        console.error(`Error updating candidate ${candidateId}:`, error);
        return res.status(500).json({ message: `Gagal memperbarui kandidat: ${error.message}` });
      }

    case 'DELETE':
      // Delete a candidate
      // Note: Consider what to do with the image in Supabase Storage.
      // Usually, you'd delete it from storage as well. This requires storage API calls.
      try {
        // First, get the image_url to delete from storage if it exists
        const { data: candidateData, error: fetchError } = await supabase
            .from('candidates')
            .select('image_url')
            .eq('id', candidateId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Allow not found for deletion
            console.warn(`Could not fetch candidate ${candidateId} before delete, proceeding with DB delete.`, fetchError.message);
        }
        
        const { error: deleteDbError } = await supabase
          .from('candidates')
          .delete()
          .eq('id', candidateId);

        if (deleteDbError) {
          if (deleteDbError.code === '23503') { // Foreign key violation
             return res.status(409).json({ message: 'Gagal menghapus kandidat: Kandidat ini memiliki suara terkait. Hapus suara terlebih dahulu.' });
          }
          throw deleteDbError;
        }
        
        // If candidate had an image, attempt to delete it from storage
        if (candidateData && candidateData.image_url) {
            const imagePath = candidateData.image_url.substring(candidateData.image_url.lastIndexOf('/') + 1); // Extract file name
            // Assuming 'gambar' is your bucket name and images are in the root or a known path
            // This path extraction might need to be more robust depending on your URL structure
            const fullPathInBucket = `public/${imagePath}`; // Example path if stored in public folder within bucket
                                                        // Or just imagePath if it's at bucket root.
                                                        // Supabase storage URLs are typically:
                                                        // SUPABASE_URL/storage/v1/object/public/BUCKET_NAME/FILE_PATH
                                                        // So, if image_url is the full public URL, parse it carefully.
                                                        // For simplicity, let's assume image_url stores just the path within the bucket.
                                                        // If image_url is like "path/to/image.jpg" in bucket "gambar"
            const { error: storageError } = await supabase.storage
                .from('gambar') // Your bucket name
                .remove([candidateData.image_url]); // Pass the path as an array

            if (storageError) {
                console.warn(`Kandidat dari DB berhasil dihapus, tetapi gagal menghapus gambar dari storage: ${storageError.message}`);
                // Don't fail the whole request, but log it.
            }
        }

        return res.status(200).json({ message: `Kandidat dengan ID ${candidateId} berhasil dihapus.` });
      } catch (error) {
        console.error(`Error deleting candidate ${candidateId}:`, error);
        return res.status(500).json({ message: `Gagal menghapus kandidat: ${error.message}` });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);