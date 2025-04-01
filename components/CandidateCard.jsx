import Image from 'next/image';

function CandidateCard({ candidate, onVote }) {
  return (
    <div>
      <h3>{candidate.kabinet}</h3>
      <h3>{candidate.ketua} - {candidate.wakil}</h3>
      <p>Visi: {candidate.visi}</p>
      <p>Misi: {candidate.misi}</p>
      {candidate.image_url && (
        <Image
          src={candidate.image_url}
          alt={`Foto ${candidate.ketua}`}
          width={200}
          height={200}
        />
      )}
      <button onClick={() => onVote(candidate.id)}>Vote</button>
    </div>
  );
}

export default CandidateCard;