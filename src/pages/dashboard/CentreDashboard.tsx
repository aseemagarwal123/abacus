import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { GraduationCap, Award, Clock, BarChart as ChartBar, BookOpen, Users, UserCheck } from 'lucide-react';

interface UserData {
  token: string;
  user_type: string;
  user_data: {
    uuid: string;
    user: {
      uuid: string;
      phone_number: string;
      email: string;
      is_active: boolean;
    };
    centre_name: string;
    area: string;
    is_active: boolean;
    cis: any[];
    student_count: number;
    active_students_count: number;
    created_at: string;
  };
}

const CentreDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const students = useSelector((state: RootState) => 
    state.data.students.filter(s => s.centreId === user?.uuid)
  );
  const activityLogs = useSelector((state: RootState) => 
    state.data.activityLogs.filter(log => log.centreId === user?.uuid)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const activeStudents = students.filter(s => 
    new Date(s.lastActive).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const averageProgress = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)
    : 0;

  const testsThisWeek = activityLogs.filter(log => 
    log.type === 'test' && 
    new Date(log.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('userData');
    console.log('Raw stored data:', storedData);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Parsed user data:', parsedData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Error parsing userData:', error);
      }
    } else {
      console.log('No userData found in localStorage');
    }
    setIsLoading(false);
  }, []);

  // Log when userData changes
  useEffect(() => {
    console.log('userData state updated:', userData);
  }, [userData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Centre Dashboard</h1>
        <button
          onClick={() => navigate('/students/new')}
          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
        >
          Add New Student
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Total Students</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">{userData?.user_data?.student_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Active Students</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-gray-300">{userData?.user_data?.active_students_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {activityLogs.slice(0, 5).map((log) => (
                <li key={log.id} className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                      {log.type === 'test' ? (
                        <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {log.userName} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Top Performing Students</h2>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {students
                .sort((a, b) => b.progress - a.progress)
                .slice(0, 5)
                .map((student) => (
                  <li 
                    key={student.id} 
                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                          <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Level {student.level}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {student.progress}%
                        </span>
                        <div className="mt-1 w-full sm:w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default CentreDashboard;