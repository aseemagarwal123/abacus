import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { centresApi } from '../../services/api/centres';
import { toast } from 'sonner';

interface CentreResponse {
  uuid: string;
  user: {
    uuid: string;
    phone_number: string;
    email: string;
    is_active: boolean;
    generated_password: string;
  };
  centre_name: string;
  franchisee_name: string;
  area: string;
  is_active: boolean;
  cis: any[];
}

const CentreForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    user: {
      phone_number: '',
      email: '',
    },
    centre_name: '',
    franchisee_name: '',
    area: '',
  });

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      
      // The response is directly the CentreResponse type, not nested in .data
      const centreData = await centresApi.create(formData);
      
      // Show success message first
      toast.success('Centre created successfully');
      
      // Store the generated password and show the modal
      //@ts-ignore
      setGeneratedPassword(centreData.user.generated_password);
      setShowPasswordModal(true);

      // Auto-hide the password after 5 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        navigate('/centres');
      }, 5000);

    } catch (err: any) {
      // More specific error handling
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message
        || err.response?.data?.error
        || 'Failed to create centre';
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Log for debugging
      console.error('Error details:', {
        error: err,
        responseData: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate('/centres')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Add New Centre
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Centre Information */}
              <div>
                <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Centre Information
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="centre_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Centre Name
                    </label>
                    <input
                      type="text"
                      id="centre_name"
                      value={formData.centre_name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        centre_name: e.target.value,
                        franchisee_name: e.target.value // Set franchisee_name same as centre_name
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Area
                    </label>
                    <input
                      type="text"
                      id="area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone_number"
                      value={formData.user.phone_number}
                      onChange={(e) => setFormData({
                        ...formData,
                        user: { ...formData.user, phone_number: e.target.value }
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
                      value={formData.user.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        user: { ...formData.user, email: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/centres')}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200"
              >
                {isLoading ? 'Creating...' : 'Create Centre'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              Centre Created Successfully
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please save the generated password. It will be hidden in 5 seconds.
            </p>
            
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              <code className="flex-1 text-primary-600 dark:text-primary-400 font-mono text-sm sm:text-base">
                {generatedPassword}
              </code>
              <button
                onClick={handleCopyPassword}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                title="Copy password"
                aria-label="Copy password"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CentreForm;