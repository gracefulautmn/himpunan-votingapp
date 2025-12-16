import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';
import { withAdminAuth } from '../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  if (req.method === 'GET') {
    try {
      const { data: votesPerCandidate, error: votesError } = await supabaseAdmin
        .from('votes')
        .select('candidate_id, candidates(id, ketua, wakil, kabinet)')
        .order('candidate_id');

      if (votesError) throw votesError;

      const candidateVoteCounts = {};
      let totalVotesCasted = 0;

      if (votesPerCandidate) {
        totalVotesCasted = votesPerCandidate.length;
        votesPerCandidate.forEach(vote => {
          const candidateInfo = vote.candidates;
          if (candidateInfo) {
            const candidateKey = `${candidateInfo.ketua} & ${candidateInfo.wakil}` + (candidateInfo.kabinet ? ` (${candidateInfo.kabinet})` : '');
            if (!candidateVoteCounts[candidateInfo.id]) {
              candidateVoteCounts[candidateInfo.id] = {
                id: candidateInfo.id,
                name: candidateKey,
                ketua: candidateInfo.ketua,
                wakil: candidateInfo.wakil,
                kabinet: candidateInfo.kabinet,
                count: 0,
              };
            }
            candidateVoteCounts[candidateInfo.id].count += 1;
          }
        });
      }
      
      const results = Object.values(candidateVoteCounts).sort((a, b) => b.count - a.count);

      const { count: totalRegisteredUsers, error: usersCountError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersCountError) throw usersCountError;

      const { count: usersWhoVoted, error: votedUsersCountError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('already_vote', true);
      
      if (votedUsersCountError) throw votedUsersCountError;

      const { data: allCandidates, error: allCandidatesError } = await supabaseAdmin
        .from('candidates')
        .select('id, ketua, wakil, kabinet')
        .order('id');

      if (allCandidatesError) throw allCandidatesError;

      const finalResults = allCandidates.map(candidate => {
        const foundVoteData = results.find(r => r.id === candidate.id);
        const candidateKey = `${candidate.ketua} & ${candidate.wakil}` + (candidate.kabinet ? ` (${candidate.kabinet})` : '');
        return {
          id: candidate.id,
          name: candidateKey,
          ketua: candidate.ketua,
          wakil: candidate.wakil,
          kabinet: candidate.kabinet,
          count: foundVoteData ? foundVoteData.count : 0,
        };
      }).sort((a, b) => b.count - a.count);

      return res.status(200).json({
        votesPerCandidate: finalResults,
        totalVotesCasted: totalVotesCasted,
        totalRegisteredUsers: totalRegisteredUsers || 0,
        usersWhoVoted: usersWhoVoted || 0,
        turnoutPercentage: totalRegisteredUsers > 0 ? ((usersWhoVoted || 0) / totalRegisteredUsers) * 100 : 0,
      });

    } catch (error) {
      return res.status(500).json({ message: 'Gagal mengambil data statistik.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
