import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, ListChecks, Settings, BarChart3, LogOut, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext'; // For app title/logo in nav

const NavItem = ({ href, icon: Icon, children }) => {
  const router = useRouter();
  const isActive = router.pathname === href || (href !== '/admin' && router.pathname.startsWith(href));

  return (
    <Link href={href} legacyBehavior>
      <a
        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
        {children}
      </a>
    </Link>
  );
};

export default function SideNav() {
  const { adminLogout, user } = useAuth();
  const { settings } = useAppSettings(); // Get app settings for logo/title

  const navItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/candidates', icon: Users, label: 'Manajemen Kandidat' },
    { href: '/admin/programs', icon: ListChecks, label: 'Program Studi' },
    { href: '/admin/voters', icon: FileText, label: 'Data Pemilih' }, // Changed from users to voters
    { href: '/admin/stats', icon: BarChart3, label: 'Statistik Voting' },
    { href: '/admin/settings', icon: Settings, label: 'Pengaturan Aplikasi' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
         <img 
            src={settings.login_page_logo_url || '/hmik.jpeg'} 
            alt="App Logo" 
            className="h-8 w-auto mr-2 rounded object-contain"
            onError={(e) => e.target.src = 'https://placehold.co/32x32/333333/FFFFFF?text=L'}
        />
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
          {settings.election_title ? settings.election_title.split(' ')[0] : 'Admin'} Panel
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.label} href={item.href} icon={item.icon}>
            {item.label}
          </NavItem>
        ))}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {user && (
          <div className="mb-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as:</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={user.email}>{user.email}</p>
          </div>
        )}
        <button
          onClick={adminLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white transition-colors duration-150"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout Admin
        </button>
      </div>
    </div>
  );
}