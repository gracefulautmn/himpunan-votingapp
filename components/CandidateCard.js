import Image from 'next/image';
import { Check, Vote } from 'lucide-react'; // Example icons

function CandidateCard({ candidate, onVote, isLoading,isSelected, hasVotedForThis }) {
  if (!candidate) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 text-center text-gray-500 dark:text-gray-400">
            Kandidat tidak tersedia.
        </div>
    );
  }
  
  const defaultImageUrl = `https://placehold.co/600x800/E2E8F0/4A5568?text=${candidate.ketua?.[0]}${candidate.wakil?.[0]}`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isSelected ? 'ring-4 ring-indigo-500 dark:ring-indigo-400' : 'ring-1 ring-transparent'}`}>
      {/* Image container */}
      {candidate.image_url ? (
        <div className="relative w-full" style={{ paddingTop: '100%' /* 1:1 Aspect Ratio */ }}>
          <Image
            src={candidate.image_url}
            alt={`Foto ${candidate.ketua} dan ${candidate.wakil}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizes
            priority={false} // Set to true for above-the-fold images only
            className="object-cover"
            onError={(e) => { e.target.srcset = defaultImageUrl; e.target.src = defaultImageUrl; }}
          />
          {/* Gradient overlay for transition from image to text */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
        </div>
      ) : (
        <div className="relative w-full pt-[100%] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Image
                src={defaultImageUrl}
                alt={`Placeholder ${candidate.ketua} dan ${candidate.wakil}`}
                fill
                className="object-contain"
            />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
        </div>
      )}
      
      <div className="p-5 sm:p-6">
        {/* Kabinet */}
        {candidate.kabinet && (
            <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">{candidate.kabinet}</h3>
            </div>
        )}
        
        {/* Ketua - Wakil */}
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            {candidate.ketua}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Calon Ketua</p>
          <div className="my-1 text-xl font-semibold text-gray-500 dark:text-gray-400">&</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            {candidate.wakil}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Calon Wakil Ketua</p>
        </div>
        
        {/* Visi & Misi */}
        {(candidate.visi || candidate.misi) && (
            <div className="space-y-4 mb-6 text-sm">
            {candidate.visi && (
                <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Visi:</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{candidate.visi}</p>
                </div>
            )}
            {candidate.misi && (
                <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Misi:</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{candidate.misi}</p>
                </div>
            )}
            </div>
        )}
        
        {/* Vote Button */}
        <button 
          onClick={() => onVote(candidate.id)}
          disabled={isLoading || hasVotedForThis} // Disable if loading or already voted for this one
          className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
            ${isLoading || hasVotedForThis 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400'
            }
            ${isSelected && !hasVotedForThis ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:ring-green-500' : ''}
          `}
        >
          {isLoading && isSelected ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : hasVotedForThis ? (
            <Check size={20} className="mr-2" />
          ) : (
            <Vote size={20} className="mr-2" />
          )}
          {hasVotedForThis ? 'Terpilih' : isSelected ? 'Konfirmasi Pilihan Ini?' : 'Pilih Kandidat Ini'}
        </button>
      </div>
    </div>
  );
}

export default CandidateCard;
