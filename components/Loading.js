function Loading({ message = "Memproses..." }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer spinning ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white/50 animate-spin"
            style={{ animationDuration: '0.8s' }}
          ></div>
          {/* Inner spinning ring (reverse) */}
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-white border-l-white/50 animate-spin"
            style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}
          ></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        {/* Message */}
        {message && (
          <p className="text-white text-sm font-medium drop-shadow-lg">{message}</p>
        )}
      </div>
    </div>
  );
}

export default Loading;