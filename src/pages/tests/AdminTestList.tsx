import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getApiUrl } from '../../config/api';
import { Modal } from '../../components/ui/Modal';
import type { Test, Level } from '../../types';
import type { RootState } from '../../store/store';
import { useTests } from '../../hooks/useTests';

const AdminTestList: React.FC = () => {
  const navigate = useNavigate();
  const tests = useSelector((state: RootState) => state.test.tests);
  const user = useSelector((state: RootState) => state.auth.user);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { isLoading } = useTests();
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    level_id: '',
    title: '',
    section_type: 'add',
    due_date: ''
  });

  useEffect(() => {
    if (user?.user_type === 'ADMIN') {
      fetchLevels();
    }
  }, [user]);

  const fetchLevels = async () => {
    try {
      const response = await fetch(getApiUrl('levels/'), {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setLevels(data);
      // Set first level as default if available
      if (data.length > 0) {
        setUploadData(prev => ({
          ...prev,
          level_id: data[0].uuid
        }));
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.level_id || !uploadData.title) return;

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('level_id', uploadData.level_id);
    formData.append('title', uploadData.title);
    formData.append('section_type', uploadData.section_type);
    if (uploadData.due_date) {
      formData.append('due_date', uploadData.due_date);
    }

    try {
      const response = await fetch(getApiUrl('tests/upload-excel/'), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setIsUploadModalOpen(false);
        // Refresh tests using the hook
        useTests();
        // Reset form
        setUploadData({
          file: null,
          level_id: '',
          title: '',
          section_type: 'add',
          due_date: ''
        });
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading test:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tests</h1>
        {user?.user_type === 'ADMIN' && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Test
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
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

      {user?.user_type === 'ADMIN' && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload New Test"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Test Title
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Level
              </label>
              <select
                value={uploadData.level_id}
                onChange={(e) => setUploadData(prev => ({ ...prev, level_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select Level</option>
                {levels.sort((a, b) => a.number - b.number).map((level) => (
                  <option key={level.uuid} value={level.uuid}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section Type
              </label>
              <select
                value={uploadData.section_type}
                onChange={(e) => setUploadData(prev => ({ ...prev, section_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="add">Addition</option>
                <option value="multiply">Multiplication</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={uploadData.due_date}
                onChange={(e) => setUploadData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Excel File
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 text-gray-400 rounded-lg shadow-lg tracking-wide border border-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Upload className="w-8 h-8" />
                  <span className="mt-2 text-base">
                    {uploadData.file ? uploadData.file.name : 'Select Excel file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                Upload Test
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminTestList; 