import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Calendar, Star, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useTests } from '../../hooks/useTests';
import { Test } from '../../types';

const AdminTestList: React.FC = () => {
  const navigate = useNavigate();
  const { tests, isLoading } = useTests();

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  const testList = tests as Test[];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tests</h1>
        <button
          onClick={() => navigate('/tests/new')}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testList?.map((test: Test) => (
          <div
            key={test.uuid}
            onClick={() => navigate(`/tests/${test.uuid}`)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {test.title}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5 mr-2" />
                <span>{test.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Created: {format(new Date(test.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium">Level {test.level}</span>
              </div>
              {test.due_date && (
                <div className="text-amber-600 dark:text-amber-400">
                  Due: {format(new Date(test.due_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!testList || testList.length === 0) && (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-dashed border-primary-300 dark:border-primary-700">
          <div className="animate-bounce mb-6">
            <ClipboardList className="w-16 h-16 text-primary-500 mx-auto" />
          </div>
          <p className="text-xl font-medium text-primary-600 dark:text-primary-400 mb-2">
            No tests available
          </p>
          <p className="text-sm text-primary-500 dark:text-primary-500">
            Create a new test to get started! 📝
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminTestList; 