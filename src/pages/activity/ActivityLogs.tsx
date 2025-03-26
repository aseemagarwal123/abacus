import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Activity, User, Clock, Award, GraduationCap, CheckCircle2 } from 'lucide-react';

const ActivityLogs: React.FC = () => {
  const logs = useSelector((state: RootState) => state.data.activityLogs);
  const [selectedType, setSelectedType] = useState<'all' | 'test' | 'level'>('all');
  const [selectedCentre, setSelectedCentre] = useState<string>('all');

  const centres = useSelector((state: RootState) => state.data.centres);

  const filteredLogs = logs.filter(log => {
    if (selectedType !== 'all' && log.type !== selectedType) return false;
    if (selectedCentre !== 'all' && log.centreId !== selectedCentre) return false;
    return true;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'test':
        return <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
      case 'level':
        return <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
      default:
        return <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        
        <div className="flex space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'test' | 'level')}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Activities</option>
            <option value="test">Tests</option>
            <option value="level">Level Changes</option>
          </select>

          <select
            value={selectedCentre}
            onChange={(e) => setSelectedCentre(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Centres</option>
            {centres.map(centre => (
              <option key={centre.id} value={centre.id}>{centre.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-start">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                {getLogIcon(log.type)}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {log.action}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {log.details}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="w-4 h-4 mr-1" />
                    {log.userName}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {log.centreName}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {log.userType}
                  </div>
                </div>
                
                {/* Additional metadata based on log type */}
                {log.type === 'test' && log.metadata.score !== undefined && (
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      Score: {log.metadata.score}%
                    </span>
                  </div>
                )}
                {log.type === 'level' && log.metadata.achievement && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs">
                      Achievement: {log.metadata.achievement}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogs;