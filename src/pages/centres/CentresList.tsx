import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Calendar, ChevronDown, Trash2 } from 'lucide-react';
import { toggleCentreActive, deleteCentre } from '../../services/api';
import { getApiUrl } from '../../config/api';

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
  cis: any[];
  student_count: number;
  created_at: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  centreName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, centreName, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Delete Centre
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <span className="font-medium">{centreName}</span>? This action cannot be undone.
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
                <span>Delete Centre</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CentresList: React.FC = () => {
  const navigate = useNavigate();
  const [centres, setCentres] = React.useState<Centre[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isToggling, setIsToggling] = React.useState<string | null>(null);
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    centreId: string | null;
    centreName: string;
  }>({
    isOpen: false,
    centreId: null,
    centreName: ''
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const fetchCentres = async () => {
    try {
      const response = await fetch(getApiUrl('centres/'), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCentres(data);
    } catch (error) {
      console.error('Failed to fetch centres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCentres();
  }, []);

  const handleToggleActive = async (e: React.MouseEvent, centreId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking the toggle button
    try {
      setIsToggling(centreId);
      await toggleCentreActive(centreId);
      // Refresh the centres list
      await fetchCentres();
    } catch (error) {
      console.error('Failed to toggle centre status:', error);
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, centre: Centre) => {
    e.stopPropagation(); // Prevent navigation
    setDeleteModal({
      isOpen: true,
      centreId: centre.uuid,
      centreName: centre.centre_name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.centreId) return;
    
    try {
      setIsDeleting(true);
      await deleteCentre(deleteModal.centreId);
      await fetchCentres();
      setDeleteModal({ isOpen: false, centreId: null, centreName: '' });
    } catch (error) {
      console.error('Failed to delete centre:', error);
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
            Centres
          </h1>
          <button
            onClick={() => navigate('/centres/new')}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            Add New Centre
          </button>
        </div>

        <div className="space-y-3">
          {centres.map((centre) => (
            <div
              key={centre.uuid}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors duration-200"
              onClick={() => navigate(`/centres/${centre.uuid}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {centre.centre_name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {centre.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <button
                    onClick={(e) => handleToggleActive(e, centre.uuid)}
                    disabled={isToggling === centre.uuid}
                    className={`px-2 sm:px-3 py-1 ${
                      centre.is_active 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    } text-xs sm:text-sm rounded-full transition-colors duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50`}
                  >
                    {isToggling === centre.uuid ? (
                      <span className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        <span>Updating...</span>
                      </span>
                    ) : (
                      centre.is_active ? 'Active' : 'Inactive'
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, centre)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                    aria-label="Delete centre"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
          ))}
        </div>

        {centres.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 dark:text-gray-400">No centres found</p>
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        centreName={deleteModal.centreName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, centreId: null, centreName: '' })}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default CentresList;