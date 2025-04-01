import React, { useState, useEffect } from 'react';
import { Bell, Star, Sparkles, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface Notification {
  uuid: string;
  title: string;
  message: string;
  created_at: string;
}

const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
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
      setError('Oops! Something went wrong while loading your messages.');
    } finally {
      setIsLoading(false);
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

  const getRandomColor = () => {
    const colors = [
      'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800',
      'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
      'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800',
      'bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
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
        <Sparkles className="w-6 h-6 text-yellow-400 animate-spin-slow" />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 animate-bounce-slow">
          <p className="text-red-600 dark:text-red-400 text-center text-lg">
            {error}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <MessageCircle className="w-6 h-6 text-primary-600 animate-bounce" />
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
              <Star className="w-10 h-10 text-yellow-400 animate-bounce" />
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-300">
              <Bell className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Messages Yet!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            When you get new messages, they'll appear here with fun colors! ✨
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const isExpanded = expandedIds.includes(notification.uuid);
            return (
              <div
                key={notification.uuid}
                className={`rounded-2xl shadow-lg border-2 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer ${getRandomColor()}`}
                onClick={() => toggleExpand(notification.uuid)}
              >
                <div className="p-6">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                          <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <div className="relative pl-12">
                      <p className={`text-gray-700 dark:text-gray-300 text-base transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;