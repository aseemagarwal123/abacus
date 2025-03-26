import React from 'react';
import { Users, Activity } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const AdminDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Total Centres</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">{user?.user_data.total_centers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Active Students</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">{user?.user_data.active_users || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((item) => (
              <li key={item} className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New centre registered
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;