import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Calendar, Users, ClipboardList, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface Student {
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
  level_completion_date: null;
  is_active: boolean;
  level_name: string;
  tests_taken: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, studentName, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Delete Student
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <span className="font-medium">{studentName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Student</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentsList: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId: string | null;
    studentName: string;
  }>({
    isOpen: false,
    studentId: null,
    studentName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    try {
      const response = await fetch(getApiUrl('students/'), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleStudentStatus = async (studentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isToggling === studentId) return;
    
    setIsToggling(studentId);
    try {
      const response = await fetch(getApiUrl(`students/${studentId}/toggle_active/`), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to toggle student status');
      
      setStudents(students.map(student => 
        student.uuid === studentId 
          ? { ...student, user: { ...student.user, is_active: !student.user.is_active } }
          : student
      ));
    } catch (error) {
      console.error('Failed to toggle student status:', error);
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      studentId: student.uuid,
      studentName: student.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.studentId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`students/${deleteModal.studentId}/`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete student');
      
      await fetchStudents();
      setDeleteModal({ isOpen: false, studentId: null, studentName: '' });
    } catch (error) {
      console.error('Failed to delete student:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Students
          </h1>
          <button
            onClick={() => navigate('/students/new')}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            Add New Student
          </button>
        </div>

        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.uuid}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors duration-200"
              onClick={() => navigate(`/students/${student.uuid}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {student.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => toggleStudentStatus(student.uuid, e)}
                    disabled={isToggling === student.uuid}
                    className={`px-2 sm:px-3 py-1 ${
                      student.user.is_active 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    } text-xs sm:text-sm rounded-full transition-colors duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50`}
                  >
                    {isToggling === student.uuid ? (
                      <span className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        <span>Updating...</span>
                      </span>
                    ) : (
                      student.user.is_active ? 'Active' : 'Inactive'
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, student)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                    aria-label={`Delete ${student.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Level: {student.level_name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{student.tests_taken} Tests Taken</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Started {new Date(student.level_start_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {students.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No students found</p>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        studentName={deleteModal.studentName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, studentId: null, studentName: '' })}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default StudentsList;