import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Calendar, Clock, Award, Edit, ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface StudentResponse {
  uuid: string;
  user: {
    uuid: string;
    phone_number: string;
    email: string;
    is_active: boolean;
  };
  name: string;
  dob: string;
  gender: string;
  current_level: string;
  level_start_date: string;
  level_completion_date: string | null;
  is_active: boolean;
  level_name: string;
  tests_taken: number;
}

interface Level {
  uuid: string;
  name: string;
}

interface ChangeLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (levelId: string) => void;
  levels: Level[];
  currentLevel: string;
  isLoading: boolean;
}

interface LevelHistory {
  uuid: string;
  student: string;
  new_level: string;
  start_date: string;
  completion_date: string | null;
  created_at: string;
  student_name: string;
  new_level_name: string;
  changed_by_name: string;
}

const ChangeLevelModal: React.FC<ChangeLevelModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  levels, 
  currentLevel,
  isLoading 
}) => {
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Change Level
        </h3>
        <div className="space-y-4">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading}
          >
            {levels.map((level) => (
              <option key={level.uuid} value={level.uuid}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedLevel)}
            disabled={isLoading || selectedLevel === currentLevel}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <span>Change Level</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isChangingLevel, setIsChangingLevel] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelHistory, setLevelHistory] = useState<LevelHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await fetch(getApiUrl('levels/'), {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch levels');
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error('Failed to fetch levels:', error);
      }
    };

    fetchLevels();
  }, []);

  useEffect(() => {
    const fetchLevelHistory = async () => {
      if (!id) return;
      setIsLoadingHistory(true);
      try {
        const response = await fetch(getApiUrl(`students/${id}/level_history/`), {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch level history');
        const data = await response.json();
        setLevelHistory(data);
      } catch (error) {
        console.error('Failed to fetch level history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchLevelHistory();
  }, [id]);

  const handleLevelChange = async (newLevelId: string) => {
    if (!student) return;
    
    setIsChangingLevel(true);
    try {
      const response = await fetch(getApiUrl('student-level-history/'), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student: student.uuid,
          new_level: newLevelId
        })
      });

      if (!response.ok) throw new Error('Failed to update level');

      // Refresh student details to get updated level
      const studentResponse = await fetch(getApiUrl(`students/${student.uuid}/`), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });

      if (!studentResponse.ok) throw new Error('Failed to fetch updated student details');

      const updatedStudent = await studentResponse.json();
      setStudent(updatedStudent);
      setShowLevelModal(false);
    } catch (error) {
      console.error('Failed to change level:', error);
    } finally {
      setIsChangingLevel(false);
    }
  };

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await fetch(getApiUrl(`students/${id}/`), {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }

        const data = await response.json();
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">
          {error || 'Student not found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Student Details
            </h1>
          </div>
          <button
            onClick={() => navigate(`/students/${id}/edit`)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Student
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {student.name}
                </h2>
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  Level: {student.level_name}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{student.user.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{student.user.phone_number}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Level Start: {new Date(student.level_start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  DOB: {new Date(student.dob).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
                Progress Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Level</span>
                    <button
                      onClick={() => setShowLevelModal(true)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
                      aria-label="Change level"
                    >
                      <Award className="w-5 h-5 text-primary-600" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                      {student.level_name}
                    </p>
                    <button
                      onClick={() => setShowLevelModal(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-1"
                    >
                      <span>Change</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tests Taken</span>
                    <CheckCircle2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    {student.tests_taken}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <div className={`px-2 py-1 rounded-full text-sm ${
                      student.user.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {student.user.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-500" />
                Level History
              </h3>
            </div>
            
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : levelHistory.length > 0 ? (
              <div className="space-y-4">
                {levelHistory.map((history, index) => (
                  <div 
                    key={history.uuid}
                    className={`relative flex items-center ${
                      index !== levelHistory.length - 1 ? 'pb-8' : ''
                    }`}
                  >
                    {index !== levelHistory.length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 h-full -ml-px bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-base font-medium text-gray-900 dark:text-white">
                          {history.new_level_name}
                        </div>
                        <div className="mt-1 sm:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          Started: {new Date(history.start_date).toLocaleDateString()}
                        </div>
                      </div>
                      {history.completion_date && (
                        <div className="mt-1 flex items-center text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Completed: {new Date(history.completion_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  No level history available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangeLevelModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        onConfirm={handleLevelChange}
        levels={levels}
        currentLevel={student.current_level}
        isLoading={isChangingLevel}
      />
    </>
  );
};

export default StudentDetails;