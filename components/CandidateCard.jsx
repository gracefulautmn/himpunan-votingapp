import Image from 'next/image';

function CandidateCard({ candidate, onVote }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
      {/* Image container with fixed aspect ratio */}
      {candidate.image_url && (
        <div className="relative w-full pt-[133.33%]"> {/* 3:4 aspect ratio (75% width:100% height) */}
          <Image
            src={candidate.image_url}
            alt={`Foto ${candidate.ketua}`}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            priority
            className="object-cover"
          />
          {/* Gradient overlay for transition from image to text */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
        </div>
      )}
      
      <div className="p-6 pt-4">
        {/* Kabinet */}
        <div className="text-center mb-2">
          <h3 className="text-lg font-bold text-indigo-600">{candidate.kabinet}</h3>
        </div>
        
        {/* Ketua - Wakil */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{candidate.ketua} - {candidate.wakil}</h3>
        </div>
        
        {/* Visi & Misi */}
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Visi:</h4>
            <p className="text-gray-600 text-sm">{candidate.visi}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Misi:</h4>
            <p className="text-gray-600 text-sm">{candidate.misi}</p>
          </div>
        </div>
        
        {/* Vote Button */}
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