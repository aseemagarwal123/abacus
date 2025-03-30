import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { getApiUrl } from '../../config/api';
import { Bell } from 'lucide-react';

interface Centre {
  uuid: string;
  centre_name: string;
  is_active: boolean;
}

interface PostNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PostNotificationModal: React.FC<PostNotificationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [centres, setCentres] = useState<Centre[]>([]);
  const [selectedCentres, setSelectedCentres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCentres, setIsLoadingCentres] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        setIsLoadingCentres(true);
        setError(null);
        const response = await fetch(getApiUrl('centres/'), {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch centres');
        const data = await response.json();
        setCentres(data);
      } catch (error) {
        console.error('Error fetching centres:', error);
        setError('Failed to load centres');
      } finally {
        setIsLoadingCentres(false);
      }
    };

    if (isOpen) {
      fetchCentres();
    }
  }, [isOpen]);

  const handleSelectAll = () => {
    const activeCentreIds = centres
      .filter(centre => centre.is_active)
      .map(centre => centre.uuid);
    setSelectedCentres(activeCentreIds);
  };

  const handleDeselectAll = () => {
    setSelectedCentres([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || selectedCentres.length === 0) {
      setError('Please fill in all fields and select at least one centre');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('notifications/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          message,
          centre_ids: selectedCentres
        })
      });

      if (!response.ok) throw new Error('Failed to post notification');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Notification">
      <div className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notification Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-200"
                placeholder="Enter notification title"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-200"
                placeholder="Enter notification message"
                required
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Centres
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isLoadingCentres}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 px-2 py-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    Select All Active
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    disabled={isLoadingCentres}
                    className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-2 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                {isLoadingCentres ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                ) : (
                  centres.map((centre) => (
                    <div key={centre.uuid} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={centre.uuid}
                        checked={selectedCentres.includes(centre.uuid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCentres([...selectedCentres, centre.uuid]);
                          } else {
                            setSelectedCentres(selectedCentres.filter(id => id !== centre.uuid));
                          }
                        }}
                        disabled={!centre.is_active}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label
                        htmlFor={centre.uuid}
                        className={`ml-2 text-sm ${
                          centre.is_active
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {centre.centre_name}
                        {!centre.is_active && ' (Inactive)'}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingCentres}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-opacity-20 border-t-white"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Post Notification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PostNotificationModal; 