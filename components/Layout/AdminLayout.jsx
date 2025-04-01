import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserCircle, LogOut, Users, BarChart2, FileText } from 'lucide-react';

export default function AdminLayout({ children, title, activeMenu }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('isAdmin');
    
    // Tambahkan delay kecil untuk simulasi proses logout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-blue-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-white-600 to-blue-200 text-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-blue-200">Admin Panel</h2>
          <div className="flex justify-center mt-4">
            <UserCircle size={64} className="text-blue-200" />
          </div>
        </div>
        
        <nav className="mt-6 px-2">
          <Link 
            href="/admin/dashboard" 
            className={`flex items-center px-4 py-3 rounded-lg mx-2 transition-all ${
              activeMenu === 'dashboard' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-blue-500 hover:bg-blue-500 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart2 size={20} className="flex-shrink-0" />
              <span className="font-medium">Dashboard</span>
            </div>
          </Link>
          <Link 
            href="/admin/candidates" 
            className={`flex items-center px-4 py-3 rounded-lg mx-2 transition-all ${
              activeMenu === 'candidates' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-blue-500 hover:bg-blue-500 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users size={20} className="flex-shrink-0" />
              <span className="font-medium">Kelola Kandidat</span>
            </div>
          </Link>
          <Link 
            href="/admin/programs" 
            className={`flex items-center px-4 py-3 rounded-lg mx-2 transition-all ${
              activeMenu === 'programs' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-blue-500 hover:bg-blue-500 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText size={20} className="flex-shrink-0" />
              <span className="font-medium">Kelola Program Studi</span>
            </div>
          </Link>
        </nav>
        
        <div className="absolute bottom-6 w-64 px-4">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-center w-full px-4 py-3 bg-red-600 text-white rounded-lg shadow transition-all ${
              isLoggingOut ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-800'
            }`}
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <span className="font-medium">Logging out...</span>
              </>
            ) : (
              <>
                <LogOut size={18} className="mr-2" />
                <span className="font-medium">Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
}