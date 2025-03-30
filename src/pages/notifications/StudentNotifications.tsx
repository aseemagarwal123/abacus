import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Sparkles, PartyPopper, Star, Gift, Trophy, Rocket, ChevronDown, ChevronUp } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface Notification {
  uuid: string;
  title: string;
  message: string;
  created_at: string;
  type?: 'achievement' | 'reminder' | 'announcement' | 'reward';
  centres: Array<{
    uuid: string;
    centre_name: string;
  }>;
}

// Add interface for notification with expanded state
interface NotificationWithState extends Notification {
  isExpanded?: boolean;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    uuid: '1',
    title: 'Holiday Notice! 🎉',
    message: 'Our center will be closed for Diwali celebrations from October 21st to October 23rd. Happy Diwali to all our students and families!',
    created_at: new Date().toISOString(),
    type: 'announcement',
    centres: [{ uuid: '1', centre_name: 'Main Centre' }]
  },
  {
    uuid: '2',
    title: 'Math Competition Coming Soon! 🏆',
    message: 'Get ready for our annual Math Olympiad! Registration starts next week. Practice your problem-solving skills to win exciting prizes.',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    type: 'reminder',
    centres: [{ uuid: '1', centre_name: 'Main Centre' }]
  },
  {
    uuid: '3',
    title: 'New Learning Resources Added 📚',
    message: 'We\'ve added new practice worksheets in your student portal for Math and Science subjects. Check them out to improve your skills!',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    type: 'announcement',
    centres: [{ uuid: '1', centre_name: 'Main Centre' }]
  },
  {
    uuid: '4',
    title: 'Parent-Teacher Meeting 👨‍👩‍👧‍👦',
    message: 'Mark your calendars! Parent-Teacher meetings will be held on November 15th. Time slots will be shared soon.',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    type: 'reminder',
    centres: [{ uuid: '1', centre_name: 'Main Centre' }]
  },
  {
    uuid: '5',
    title: 'Weekend Extra Classes 📝',
    message: 'Starting this Saturday, we\'re offering extra doubt-clearing sessions every weekend from 10 AM to 12 PM. All students are welcome!',
    created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    type: 'announcement',
    centres: [{ uuid: '1', centre_name: 'Main Centre' }]
  }
];

const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationWithState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // For demo purposes, immediately set sample notifications with expanded state
      setNotifications(SAMPLE_NOTIFICATIONS.map(notification => ({
        ...notification,
        isExpanded: false
      })));
      setIsLoading(false);
      return;

      // Comment out actual API call for now
      /*
      const response = await fetch(getApiUrl('notifications/'), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.map((n: Notification) => ({ ...n, isExpanded: false })));
      */
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Oops! Something went wrong while loading your notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotification = (uuid: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.uuid === uuid 
          ? { ...notification, isExpanded: !notification.isExpanded }
          : notification
      )
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'reminder':
        return <Bell className="w-6 h-6 text-blue-500" />;
      case 'announcement':
        return <Rocket className="w-6 h-6 text-purple-500" />;
      case 'reward':
        return <Gift className="w-6 h-6 text-pink-500" />;
      default:
        return <Star className="w-6 h-6 text-primary-500" />;
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'achievement':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
      case 'reminder':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800';
      case 'announcement':
        return 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800';
      case 'reward':
        return 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-800';
      default:
        return 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 p-3 rounded-full animate-pulse">
          <Bell className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
          My Messages
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 animate-bounce-slow">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-400 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error}
              </p>
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Bell className="w-6 h-6 text-primary-600 animate-bounce" />
            </div>
          </div>
          <p className="text-primary-600 dark:text-primary-400 text-lg animate-pulse">
            Loading your messages...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-white to-primary-50 dark:from-gray-800 dark:to-primary-900/10 rounded-2xl shadow-sm border-2 border-primary-100 dark:border-primary-800/50">
          <div className="relative">
            <div className="absolute -top-4 -right-4">
              <PartyPopper className="w-10 h-10 text-yellow-400 animate-bounce" />
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-300">
              <Bell className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            No New Messages Yet!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            When your teachers send you important messages, they will appear here with fun animations! Stay tuned for updates!
          </p>
          <div className="flex items-center justify-center space-x-2 text-primary-600 dark:text-primary-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-lg font-medium">Check back later!</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {notifications.map((notification) => (
            <div
              key={notification.uuid}
              onClick={() => toggleNotification(notification.uuid)}
              className={`rounded-2xl shadow-sm border-2 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer sm:cursor-default ${getNotificationColor(notification.type)}`}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                    </div>
                    <div className="relative">
                      <p 
                        className={`text-gray-700 dark:text-gray-300 text-base pl-12 transition-all duration-300 ${
                          !notification.isExpanded ? 'sm:line-clamp-none line-clamp-2' : ''
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="sm:hidden mt-2 pl-12 flex items-center text-primary-600 dark:text-primary-400">
                        {notification.isExpanded ? (
                          <div className="flex items-center">
                            <ChevronUp className="w-4 h-4 mr-1" />
                            <span className="text-sm">Show Less</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <ChevronDown className="w-4 h-4 mr-1" />
                            <span className="text-sm">Read More</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pl-12 sm:pl-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;