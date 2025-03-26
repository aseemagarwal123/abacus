import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface Level {
  uuid: string;
  name: string;
  description?: string;
}

interface CreateStudentPayload {
  name: string;
  email: string;
  phone_number: string;
  dob: string;
  gender: string;
  current_level: string;
  level_start_date: string;
  password?: string;
}

interface StudentResponse {
  uuid: string;
  user: {
    uuid: string;
    phone_number: string;
    email: string;
    is_active: boolean;
    generated_password: string;
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

const StudentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // If id exists, we're in edit mode
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateStudentPayload>({
    name: '',
    email: '',
    phone_number: '',
    dob: '',
    gender: 'M',
    current_level: '4b026fd9-6df6-42db-a8b9-2f65a6186df9', // Hardcoded level UUID
    level_start_date: new Date().toISOString().split('T')[0],
  });

  // Fetch levels when component mounts
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
        
        // Set the first level as default if available
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            current_level: data[0].uuid
          }));
        }
      } catch (error) {
        console.error('Error fetching levels:', error);
        setError('Failed to load levels');
      }
    };

    fetchLevels();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchStudentDetails = async () => {
        try {
          const response = await fetch(getApiUrl(`students/${id}/`), {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) throw new Error('Failed to fetch student');
          
          const data = await response.json();
          setFormData({
            name: data.name,
            email: data.user.email,
            phone_number: data.user.phone_number,
            dob: data.dob.split('T')[0], // Format date for input
            gender: data.gender,
            current_level: data.current_level,
            level_start_date: data.level_start_date,
          });
        } catch (error) {
          console.error('Failed to fetch student:', error);
        }
      };

      fetchStudentDetails();
    }
  }, [id, isEditMode]);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditMode 
        ? getApiUrl(`students/${id}/`)
        : getApiUrl('students/');

      const method = isEditMode ? 'PATCH' : 'POST';

      // Create different payloads for create and update
      const payload = isEditMode ? {
        // Update payload - no user object and no level-related fields
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender
      } : {
        // Create payload - includes user object and level-related fields
        name: formData.name,
        user: {
          phone_number: formData.phone_number,
          email: formData.email,
          password: formData.password
        },
        dob: formData.dob,
        gender: formData.gender,
        current_level: formData.current_level,
        level_start_date: formData.level_start_date
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save student');

      if (!isEditMode) {
        // If creating a new student, get the response to show the generated password
        const data: StudentResponse = await response.json();
        setGeneratedPassword(data.user.generated_password);
        setShowPasswordModal(true);
      } else {
        navigate(-1);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Student Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({
                  ...formData,
                  phone_number: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({
                  ...formData,
                  email: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            {/* Only show level field in create mode */}
            {!isEditMode && (
              <>
                <div>
                  <label htmlFor="current_level" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Current Level
                  </label>
                  <select
                    id="current_level"
                    name="current_level"
                    value={formData.current_level}
                    onChange={(e) => setFormData({ ...formData, current_level: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    {levels.map((level) => (
                      <option key={level.uuid} value={level.uuid}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="level_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level Start Date
                  </label>
                  <input
                    type="date"
                    id="level_start_date"
                    value={formData.level_start_date}
                    onChange={(e) => setFormData({ ...formData, level_start_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 sm:space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                isEditMode ? 'Update Student' : 'Create Student'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Student Account Created
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please save this password securely. It will not be shown again.
            </p>
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-4">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white">
                {generatedPassword}
              </code>
              <button
                onClick={handleCopyPassword}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                aria-label="Copy password"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  navigate(-1);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentForm;