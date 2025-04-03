import React, { useState, useEffect } from 'react';
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
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useTests } from '../../hooks/useTests';
import { getApiUrl } from '../../config/api';

interface Notification {
  uuid: string;
  title: string;
  message: string;
  created_at: string;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.auth.userData);
  const tests = useSelector((state: RootState) => state.test.tests);
  const { isLoading: isTestsLoading } = useTests();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  if (!userData) return null;

  const availableTests = tests.filter(test => 
    String(test.level_uuid) === userData.current_level
  );

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await fetch(getApiUrl('notifications/'), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const toggleExpand = (uuid: string) => {
    setExpandedIds(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid)
        : [...prev, uuid]
    );
  };

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

      {/* Notifications Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Messages</h2>
          </div>
          {notifications.length > 0 && (
            <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm rounded-full">
              {notifications.length} Messages
            </div>
          )}
        </div>
        <div className="h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center h-full flex flex-col items-center justify-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4 px-1">
              {notifications.map((notification) => {
                const isExpanded = expandedIds.includes(notification.uuid);
                return (
                  <div
                    key={notification.uuid}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200 min-h-[100px]"
                    onClick={() => toggleExpand(notification.uuid)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className={`text-sm text-gray-600 dark:text-gray-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {notification.message}
                        </p>
                        <button className="mt-2 flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              <span className="text-sm">Show Less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              <span className="text-sm">Read More</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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