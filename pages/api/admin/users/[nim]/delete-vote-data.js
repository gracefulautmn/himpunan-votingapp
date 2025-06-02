// pages/api/admin/users/[nim]/delete-vote-data.js
import { requireAdmin } from '../../../../../lib/adminAuth';
import { supabase } from '../../../../../lib/supabaseClient';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { nim } = req.query;

  try {
    // Reset vote status for user
    const { data, error } = await supabase
      .from('users')
      .update({ already_vote: false })
      .eq('nim', nim)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ 
        message: `User dengan NIM ${nim} tidak ditemukan` 
      });
    }

    // Optional: Also delete from votes table if exists
    try {
      await supabase
        .from('votes')
        .delete()
        .eq('user_nim', nim);
    } catch (voteError) {
      console.log('No votes table or vote data to delete:', voteError);
    }

    res.status(200).json({ 
      message: `Data vote untuk NIM ${nim} berhasil dihapus`
    });
  } catch (error) {
    console.error('Delete vote data error:', error);
    res.status(500).json({ 
      message: error.message || 'Gagal menghapus data vote' 
    });
  }
}

export default requireAdmin(handler);
