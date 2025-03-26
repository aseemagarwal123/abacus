import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
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
  level_completion_date: string | null;
  is_active: boolean;
  level_name: string;
  tests_taken: number;
}

interface Centre {
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
  cis: Array<{ uuid: string; name: string; }>;
  student_count: number;
  created_at: string;
}

const CentreDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [centreResponse, studentsResponse] = await Promise.all([
          fetch(getApiUrl(`centres/${id}/`), {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          }),
          fetch(getApiUrl(`centres/${id}/students/`), {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          })
        ]);

        const centreData = await centreResponse.json();
        const studentsData = await studentsResponse.json();

        setCentre(centreData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Failed to fetch centre details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading || !centre) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Updated with Add Student button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate('/centres')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Centre Details
          </h1>
        </div>
        {/* <button
          onClick={() => navigate(`/students/new?centreId=${centre.uuid}`)}
          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
        >
          Add Student
        </button> */}
      </div>

      {/* Centre Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {centre.centre_name}
              </h2>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  {centre.user.email}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Phone className="w-4 h-4 mr-2" />
                  {centre.user.phone_number}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  {centre.area}
                </div>
              </div>
            </div>
          </div>
          <span className={`px-2 sm:px-3 py-1 ${
            centre.is_active 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          } text-xs sm:text-sm rounded-full`}>
            {centre.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Users className="w-5 h-5" />
            <span>{centre.student_count} Students</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-5 h-5" />
            <span>Joined {formatDate(centre.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Students
          </h2>
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
                <span className={`px-2 sm:px-3 py-1 ${
                  student.user.is_active 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                } text-xs sm:text-sm rounded-full`}>
                  {student.user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <GraduationCap className="w-5 h-5" />
                  <span>Level: {student.level_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClipboardList className="w-5 h-5" />
                  <span>{student.tests_taken} Tests Taken</span>
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
    </div>
  );
};

export default CentreDetails;