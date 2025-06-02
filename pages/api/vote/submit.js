// pages/api/vote/submit.js
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, candidateId } = req.body;

  if (!nim || candidateId === undefined || candidateId === null) {
    return res.status(400).json({ message: 'NIM dan ID Kandidat diperlukan.' });
  }

  try {
    const { data: user, error: fetchUserError } = await supabase
      .from('users')
      .select('already_vote, otp, otp_expires_at')
      .eq('nim', nim)
      .single();

    if (fetchUserError && fetchUserError.code !== 'PGRST116') {
        console.error('Database error fetching user before voting:', fetchUserError);
        return res.status(500).json({ message: 'Gagal memeriksa data pengguna: ' + fetchUserError.message });
    }
    
    if (!user) {
      console.warn(`User with nim '${nim}' not found before voting.`);
      return res.status(404).json({ message: 'Pengguna tidak ditemukan atau belum terverifikasi.' });
    }

    if (user.already_vote) {
      return res.status(403).json({ message: 'Anda sudah memberikan suara sebelumnya.' });
    }

    if (user.otp !== null || user.otp_expires_at !== null) {
       console.warn(`Attempt to vote for user '${nim}' whose OTP is not cleared.`);
       return res.status(403).json({ message: 'Sesi verifikasi OTP belum selesai. Silakan login dan verifikasi OTP kembali.' });
    }

    const { error: rpcError } = await supabase.rpc('record_vote', {
      p_user_nim: nim,
      p_candidate_id: parseInt(candidateId, 10),
    });

    if (rpcError) {
      console.error('Error from record_vote RPC:', rpcError);
      if (rpcError.message.includes('already voted')) {
        return res.status(403).json({ message: 'Gagal mencatat suara: Anda sudah memberikan suara.' });
      }
      if (rpcError.message.includes('not found')) {
        return res.status(404).json({ message: `Gagal mencatat suara: ${rpcError.message}` });
      }
      return res.status(500).json({ message: 'Gagal mencatat suara: ' + rpcError.message });
    }

    return res.status(200).json({ 
      message: 'Suara Anda berhasil dicatat. Terima kasih atas partisipasi Anda!',
      action: 'auto_logout',
      delay: 10000 // Diubah menjadi 10000 milidetik (10 detik)
    });

  } catch (error) {
    console.error('Submit Vote API error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
}
