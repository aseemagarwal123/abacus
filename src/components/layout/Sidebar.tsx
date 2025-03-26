import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { 
  Users, 
  GraduationCap, 
  ClipboardList, 
  Settings,
  LogOut,
  Home,
  Activity,
  BarChart,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const getNavLinks = () => {
    switch (user?.user_type) {
      case 'ADMIN':
        return [
          { to: '/dashboard', icon: Home, label: 'Dashboard' },
          { to: '/centres', icon: Users, label: 'Centres' },
          { to: '/tests', icon: ClipboardList, label: 'Tests' },
          // { to: '/logs', icon: Activity, label: 'Activity Logs' },
          // { to: '/settings', icon: Settings, label: 'Settings' }
        ];
      case 'CENTRE':
        return [
          { to: '/centre-dashboard', icon: BarChart, label: 'Dashboard' },
          { to: '/students', icon: GraduationCap, label: 'Students' },
          // { to: '/tests', icon: ClipboardList, label: 'Tests' },
          // { to: '/settings', icon: Settings, label: 'Settings' }
        ];
      case 'STUDENT':
        return [
          { to: '/student-dashboard', icon: Home, label: 'Dashboard' },
          { to: '/tests', icon: ClipboardList, label: 'My Tests' },
          // { to: '/progress', icon: Activity, label: 'Progress' },
          // { to: '/settings', icon: Settings, label: 'Settings' }
        ];
      default:
        return [];
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-[60] lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:fixed top-0 left-0 z-[70] h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Close button - mobile only */}
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Abacus Platform
            </h1>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Abacus Platform
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {getNavLinks().map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 mt-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`
                }
              >
                <link.icon className="w-5 h-5 mr-2" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;