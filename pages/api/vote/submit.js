import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, candidateId } = req.body;

  if (!nim || candidateId === undefined || candidateId === null) {
    return res.status(400).json({ message: 'NIM dan ID Kandidat diperlukan.' });
  }

  const parsedCandidateId = parseInt(candidateId, 10);
  if (isNaN(parsedCandidateId) || parsedCandidateId < 1) {
    return res.status(400).json({ message: 'ID Kandidat tidak valid.' });
  }

  try {
    const { error: rpcError } = await supabaseAdmin.rpc('record_vote', {
      p_user_nim: nim,
      p_candidate_id: parsedCandidateId,
    });

    if (rpcError) {
      if (rpcError.message.includes('already voted') || 
          rpcError.message.includes('duplicate detected')) {
        return res.status(403).json({ 
          message: 'Anda sudah memberikan suara sebelumnya.',
          errorCode: 'ALREADY_VOTED'
        });
      }
      
      if (rpcError.message.includes('not found')) {
        return res.status(404).json({ 
          message: 'Pengguna atau kandidat tidak ditemukan.',
          errorCode: 'NOT_FOUND'
        });
      }
      
      return res.status(500).json({ 
        message: 'Gagal mencatat suara. Silakan coba lagi.',
        errorCode: 'VOTE_FAILED'
      });
    }

    return res.status(200).json({ 
      message: 'Suara Anda berhasil dicatat. Terima kasih atas partisipasi Anda!',
      action: 'auto_logout',
      delay: 10000
    });

  } catch (error) {
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      errorCode: 'SERVER_ERROR'
    });
  }
}
