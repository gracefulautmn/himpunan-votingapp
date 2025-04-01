import VerificationForm from '../components/Auth/VerificationForm';
import Image from 'next/image';

function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-purple-600 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Dua logo di kiri atas */}
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <Image 
          src="/logo.png" 
          alt="Logo 1" 
          width={60} 
          height={60}
          className="rounded-md"
        />
        <Image 
          src="/logo2.png" 
          alt="Logo 2" 
          width={60} 
          height={60}
          className="rounded-md"
        />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <Image 
              src="/logo.png" 
              alt="Universitas Pertamina Logo" 
              width={120} 
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Verifikasi Kode</h1>
          </div>
          <VerificationForm />
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;