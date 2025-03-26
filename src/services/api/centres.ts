import apiClient from './client';

interface CreateCentrePayload {
  user: {
    phone_number: string;
    email: string;
  };
  centre_name: string;
  franchisee_name: string;
  area: string;
}

interface Centre {
  id: string;
  centre_name: string;
  franchisee_name: string;
  area: string;
  user: {
    phone_number: string;
    email: string;
  };
}

interface CentreResponse {
  // Add any necessary properties for the response
}

export const centresApi = {
  create: async (data: CreateCentrePayload): Promise<CentreResponse> => {
    const response = await apiClient.post<CentreResponse>('/centres/', data);
    return response.data;
  },
  
  // Add other centre-related API calls here
}; 