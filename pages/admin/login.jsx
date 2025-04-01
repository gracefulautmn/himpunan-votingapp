import AdminLoginForm from '../../components/Auth/AdminLoginForm';
import Image from 'next/image';

function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-300 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Dua logo di kiri atas */}
      <div className="absolute top-4 left-4 flex items-center">
              <Image src="/logo.png" alt="Logo 1" width={60} height={60} className="rounded-md" />
              <div className="border-l border-gray-800 mx-4 h-10"></div> {/* Garis vertikal */}
              <Image src="/logo2.png" alt="Logo 2" width={40} height={60} className="rounded-md" />
            </div>
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <Image 
              src="/hmik.jpeg" 
              alt="Universitas Pertamina Logo" 
              width={120} 
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin</h1>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;