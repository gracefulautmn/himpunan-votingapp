import { useState } from 'react';
import { useRouter } from 'next/router';
import Alert from '../Alert';
import Loading from '../Loading'; // Import komponen Loading
import { UserIcon, LockIcon } from 'lucide-react';

function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({show: false, message: '', type: 'success'});
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setAlert({show: false, message: '', type: 'success'});

    if (username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('isAdmin', 'true');
      setAlert({show: true, message: 'Login berhasil!', type: 'success'});
      router.push('/admin/dashboard');
    } else {
      setAlert({show: true, message: 'Login gagal. Periksa username dan password Anda.', type: 'error'});
    }

    setLoading(false);
  };

  return (
    <div className="mt-2">
      {alert.show && <Alert message={alert.message} type={alert.type} />}
      {loading && <Loading />} {/* Tampilkan komponen Loading saat loading true */}
      
      <div className="space-y-6">
        <div className="relative">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username:
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <UserIcon size={18} />
            </span>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="Masukkan username"
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
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="Masukkan password"
            />
          </div>
        </div>
        
        <div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginForm;