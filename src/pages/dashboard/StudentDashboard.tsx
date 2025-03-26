import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  ClipboardList,
  ChevronRight,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useTests } from '../../hooks/useTests';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.auth.userData);
  const tests = useSelector((state: RootState) => state.test.tests);
  const { isLoading } = useTests();

  if (!userData) return null;

  const availableTests = tests.filter(test => 
    String(test.level_uuid) === userData.current_level
  );

  const stats = [
    {
      label: 'Current Level',
      value: userData.level_name,
      icon: <GraduationCap className="w-8 h-8 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Tests Taken',
      value: userData.tests_taken,
      icon: <ClipboardList className="w-8 h-8 text-green-500" />,
      color: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Level Start Date',
      value: format(new Date(userData.level_start_date), 'MMM d, yyyy'),
      icon: <Calendar className="w-8 h-8 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-full">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userData.name}!</h1>
            <p className="text-primary-100">Here's your learning progress overview</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${stat.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Tips</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 mr-3">
              <ChevronRight className="w-5 h-5" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Complete tests regularly to track your progress</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 mr-3">
              <ChevronRight className="w-5 h-5" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Practice consistently to improve your skills</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500 mr-3">
              <ChevronRight className="w-5 h-5" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Reach out to your teacher if you need help</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentDashboard;