function Loading() {
    return (
      <div 
        className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center space-y-4 transform transition-all duration-300">
          <div className="relative w-20 h-20">
            {/* Background circle */}
            <div className="absolute w-full h-full rounded-full border-4 border-solid border-gray-100"></div>
            {/* Animated spinner */}
            <div 
              className="absolute w-full h-full rounded-full border-4 border-solid border-indigo-600 border-t-transparent animate-spin"
              style={{ animationDuration: '0.8s' }}
            ></div>
            {/* Optional center icon - remove if not needed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-indigo-600 animate-pulse" 
                fill="none" 
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15l8-8m0 0l-8-8m8 8H4" 
                />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium text-gray-800">Memproses...</p>
            <p className="text-sm text-gray-500">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }
  
  export default Loading;