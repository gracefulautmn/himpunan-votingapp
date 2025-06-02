function Loading({ message = "Memproses...", subMessage = "Harap tunggu sebentar" }) {
    return (
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col items-center space-y-4 transform transition-all duration-300 max-w-xs w-full mx-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            {/* Background circle */}
            <div className="absolute w-full h-full rounded-full border-4 border-solid border-gray-100 dark:border-gray-700"></div>
            {/* Animated spinner */}
            <div 
              className="absolute w-full h-full rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"
              style={{ animationDuration: '0.8s' }}
            ></div>
            {/* Optional center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" 
                fill="none" 
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {/* Using a different icon that might look better for loading, like a simple spinner or dots */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{message}</p>
            {subMessage && <p className="text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>}
          </div>
        </div>
      </div>
    );
  }
  
  export default Loading;