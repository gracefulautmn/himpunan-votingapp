function Loading() {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full absolute border-4 border-solid border-gray-200"></div>
            <div className="w-16 h-16 rounded-full animate-spin absolute border-4 border-solid border-indigo-500 border-t-transparent"></div>
          </div>
          <div className="mt-6 text-center text-base font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }
  
  export default Loading;