import { supabase } from '../../../lib/supabaseClient';
import { withAdminAuth } from '../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  if (req.method === 'GET') {
    try {
      // 1. Get votes per candidate
      const { data: votesPerCandidate, error: votesError } = await supabase
        .from('votes')
        .select('candidate_id, candidates(id, ketua, wakil, kabinet)') // Join with candidates table
        .order('candidate_id'); // Order for easier processing if needed

      if (votesError) throw votesError;

      // Process votes to count per candidate
      const candidateVoteCounts = {};
      let totalVotesCasted = 0;

      if (votesPerCandidate) {
        totalVotesCasted = votesPerCandidate.length;
        votesPerCandidate.forEach(vote => {
          const candidateInfo = vote.candidates; // Joined data
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


      // 2. Get total registered users (potential voters based on allowed programs)
      // This requires knowing which users are eligible.
      // For simplicity, let's count all users in the 'users' table.
      // A more accurate count would filter users by allowed_programs.
      const { count: totalRegisteredUsers, error: usersCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true }); // Only count

      if (usersCountError) throw usersCountError;

      // 3. Get total users who have actually voted (already_vote = true)
      // This should match totalVotesCasted if data is consistent
      const { count: usersWhoVoted, error: votedUsersCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('already_vote', true);
      
      if (votedUsersCountError) throw votedUsersCountError;


      // 4. Get all candidates for display, even those with 0 votes
      const { data: allCandidates, error: allCandidatesError } = await supabase
        .from('candidates')
        .select('id, ketua, wakil, kabinet')
        .order('id');

      if (allCandidatesError) throw allCandidatesError;

      // Merge vote counts with all candidates to include those with 0 votes
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
        totalVotesCasted: totalVotesCasted, // This is sum of counts from finalResults
        totalRegisteredUsers: totalRegisteredUsers || 0,
        usersWhoVoted: usersWhoVoted || 0, // Should ideally be same as totalVotesCasted
        turnoutPercentage: totalRegisteredUsers > 0 ? ((usersWhoVoted || 0) / totalRegisteredUsers) * 100 : 0,
      });

    } catch (error) {
      console.error('Error fetching voting statistics:', error);
      return res.status(500).json({ message: 'Gagal mengambil data statistik: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
