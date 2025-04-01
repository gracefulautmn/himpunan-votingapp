import Image from 'next/image';

function CandidateCard({ candidate, onVote }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
      <div className="p-6">
        {candidate.image_url && (
          <div className="flex justify-center mb-4">
            <Image
              src={candidate.image_url}
              alt={`Foto ${candidate.ketua}`}
              width={200}
              height={200}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-indigo-600 mb-1">{candidate.kabinet}</h3>
          <h3 className="text-xl font-bold text-gray-800 mb-3">{candidate.ketua} - {candidate.wakil}</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Visi:</h4>
            <p className="text-gray-600 text-sm">{candidate.visi}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Misi:</h4>
            <p className="text-gray-600 text-sm">{candidate.misi}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onVote(candidate.id)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Vote
        </button>
      </div>
    </div>
  );
}

export default CandidateCard;