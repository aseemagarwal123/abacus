import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { ClipboardList, Timer, Award, Clock, Calendar, Star, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useTests } from '../../hooks/useTests';

const TestList: React.FC = () => {
  const navigate = useNavigate();
  const tests = useSelector((state: RootState) => state.test.tests);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const { isLoading } = useTests();

  // Filter tests based on user's current level
  // const availableTests = tests.filter(test => 
  //   String(test.level_uuid) === userData?.current_level
  // );

  const availableTests = tests;

  // Fun background colors for cards
  const cardColors = [
    'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30',
    'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
    'bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30',
    'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
  ];

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

      {availableTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableTests.map((test, index) => (
            <div
              key={test.uuid}
              onClick={() => navigate(`/tests/${test.uuid}`)}
              className={`${cardColors[index % cardColors.length]} rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 border-2 border-white dark:border-gray-700 cursor-pointer relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-primary-500 text-white text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center">
                  Level {test.level}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pr-12">
                {test.title}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center text-primary-700 dark:text-primary-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-medium">{test.duration_minutes} minutes</span>
                </div>
                
                <div className="flex items-center text-purple-700 dark:text-purple-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-medium">Created: {format(new Date(test.created_at), 'MMM d, yyyy')}</span>
                </div>

                {test.due_date && (
                  <div className="flex items-center text-amber-700 dark:text-amber-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <Timer className="w-5 h-5 mr-2" />
                    <span className="font-medium">Due: {format(new Date(test.due_date), 'MMM d, yyyy')}</span>
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
            No tests available right now!
          </p>
          <p className="text-sm text-primary-500 dark:text-primary-500">
            Come back soon for new exciting challenges! 🌟
          </p>
        </div>
      )}
    </div>
  );
};

export default TestList;