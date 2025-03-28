import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Timer, Clock, Calendar, Star, BookOpen, History, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTests } from '../../hooks/useTests';
import { Test, TestsResponse } from '../../types';

type TabType = 'upcoming' | 'in_progress' | 'past';

const StudentTestList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { tests, isLoading } = useTests();

  // Type guard to ensure we have student tests
  const studentTests = tests as TestsResponse;

  // Fun background colors for cards
  const cardColors = [
    'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30',
    'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
    'bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30',
    'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
  ];

  const tabs = [
    {
      id: 'upcoming',
      label: 'Not Attempted',
      icon: <Clock className="w-5 h-5" />,
      count: studentTests?.upcoming_tests?.count || 0,
      results: studentTests?.upcoming_tests?.results || []
    },
    {
      id: 'in_progress',
      label: 'Started',
      icon: <PlayCircle className="w-5 h-5" />,
      count: studentTests?.in_progress_tests?.count || 0,
      results: studentTests?.in_progress_tests?.results || []
    },
    {
      id: 'past',
      label: 'Completed Tests',
      icon: <History className="w-5 h-5" />,
      count: studentTests?.past_tests?.count || 0,
      results: studentTests?.past_tests?.results || []
    }
  ] as const;

  const currentTests = tabs.find(tab => tab.id === activeTab)?.results || [];

  const handleTestClick = (test: any) => {
    if (test.status === 'COMPLETED') {
      navigate(`/student-test/${test.uuid}/result`);
    } else {
      // For upcoming tests, use test.uuid, for others use test.test?.uuid
      const testId = activeTab === 'upcoming' ? test.uuid : test.test?.uuid;
      navigate(`/tests/${testId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-bounce rounded-full h-16 w-16 border-4 border-primary-600 mx-auto flex items-center justify-center">
          <Star className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <p className="mt-4 text-xl font-medium text-primary-600 dark:text-primary-400">Loading your fun tests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex items-center justify-center mb-8">
        <BookOpen className="w-8 h-8 text-primary-600 mr-3 animate-pulse" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Your Fun Learning Tests!
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-center mb-8 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {currentTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentTests.map((test: Test, index: number) => (
            <div
              key={test.uuid}
              onClick={() => handleTestClick(test)}
              className={`${cardColors[index % cardColors.length]} rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 border-2 border-white dark:border-gray-700 cursor-pointer relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-primary-500 text-white text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center">
                  Level {test.test?.level || test.level}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pr-12">
                {test.test?.title || test.title}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center text-primary-700 dark:text-primary-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-medium">{test.test?.duration_minutes || test.duration_minutes} minutes</span>
                </div>

                {/* <div className="flex items-center text-purple-700 dark:text-purple-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Timer className="w-5 h-5 mr-2" />
                  <span className="font-medium">Time Left: {Math.floor((test.remaining_duration || (test.test?.duration_remaining || test.duration_remaining || 0)) / 60)} minutes</span>
                </div> */}
                
                <div className="flex items-center text-amber-700 dark:text-amber-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-medium">Created: {format(new Date((test.test?.created_at || test.created_at) || new Date()), 'MMM d, yyyy')}</span>
                </div>

                {(test.test?.due_date || test.due_date) && (
                  <div className="flex items-center text-rose-700 dark:text-rose-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <Timer className="w-5 h-5 mr-2" />
                    <span className="font-medium">Due: {format(new Date((test.test?.due_date || test.due_date) || new Date()), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 right-2">
                <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-dashed border-primary-300 dark:border-primary-700">
          <div className="animate-bounce mb-6">
            <ClipboardList className="w-16 h-16 text-primary-500 mx-auto" />
          </div>
          <p className="text-xl font-medium text-primary-600 dark:text-primary-400 mb-2">
            No {activeTab.replace('_', ' ')} tests available right now!
          </p>
          <p className="text-sm text-primary-500 dark:text-primary-500">
            {activeTab === 'upcoming' ? 'Come back soon for new exciting challenges! 🌟' : 
             activeTab === 'in_progress' ? 'Start a test to see it here! 🎯' :
             'Complete some tests to see your history! 📚'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTestList; 