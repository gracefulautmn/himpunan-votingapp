// components/Auth/AdminLoginForm.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Alert from '../Alert';
import { UserIcon, LockIcon } from 'lucide-react';

function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });

    try {
      // Simulate network delay for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        setAlert({ show: true, message: 'Login berhasil! Mengarahkan ke dashboard...', type: 'success' });
        setTimeout(() => router.push('/admin/dashboard'), 1500);
      } else {
        throw new Error('Login gagal. Periksa username dan password Anda.');
      }
    } catch (error) {
      setAlert({ show: true, message: error.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex text-black items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <UserIcon size={18} />
            </span>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 placeholder:text-gray-500 placeholder-opacity-100"
              placeholder="Masukkan username"
              required
            />
          </div>
        </div>
        
        <div className="relative">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <LockIcon size={18} />
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 block w-full px-3 py-2 text-black rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 placeholder:text-gray-500 placeholder-opacity-100"
              placeholder="Masukkan password"
              required
            />
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-200 relative"
          >
            {loading ? (
              <>
                <span className="opacity-0">Login</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminLoginForm;