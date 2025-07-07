const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  staffId?: string;
  role: 'staff' | 'admin' | 'commissioner';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface Ward {
  _id: string;
  corporateName: string;
  wardName: string;
  mohallas: string[];
}

export interface Property {
  _id: string;
  propertyId: string;
  ward: Ward;
  mohalla: string;
  ownerName: string;
  fatherName?: string;
  address: string;
  houseNo?: string;
  mobileNo?: string;
  propertyType?: string;
  deliveryStatus: 'Pending' | 'Delivered' | 'Not Found';
}

export interface Delivery {
  _id: string;
  property: Property;
  staff: User;
  deliveryDate: string;
  dataSource: 'owner' | 'family' | 'tenant' | 'not_found';
  receiverName?: string;
  receiverMobile?: string;
  photoUrl: string;
  location: {
    type: 'Point';
    coordinates: number[];
  };
  remarks?: string;
  correctionStatus: 'None' | 'Pending' | 'Approved' | 'Rejected';
}

// API Service
class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async register(userData: any): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    return data.user;
  }

  // Ward endpoints
  async getWards(): Promise<Ward[]> {
    const response = await fetch(`${API_BASE_URL}/wards`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wards');
    }

    return response.json();
  }

  // Property endpoints
  async getProperties(params?: {
    search?: string;
    ward?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ properties: Property[]; pagination: any }> {
    const url = new URL(`${API_BASE_URL}/properties`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    return response.json();
  }

  async getPropertyById(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }

    return response.json();
  }

  // Delivery endpoints
  async getDeliveries(params?: {
    staff?: string;
    property?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ deliveries: Delivery[]; pagination: any }> {
    const url = new URL(`${API_BASE_URL}/deliveries`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deliveries');
    }

    return response.json();
  }

  async getStaffHistory(params?: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ deliveries: Delivery[]; pagination: any }> {
    const url = new URL(`${API_BASE_URL}/deliveries/staff-history`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    console.log('Calling staff history API:', url.toString())
    console.log('Auth headers:', this.getAuthHeaders())

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    console.log('Staff history response status:', response.status)
    console.log('Staff history response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Staff history error response:', errorText)
      throw new Error('Failed to fetch staff history');
    }

    const result = await response.json()
    console.log('Staff history result:', result)
    return result
  }

  async createDelivery(deliveryData: any): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(deliveryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create delivery');
    }

    return response.json();
  }

  async uploadDeliveryPhoto(photo: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await fetch(`${API_BASE_URL}/deliveries/upload-photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload photo');
    }

    return response.json();
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch delivery');
    }

    return response.json();
  }

  // Upload endpoints
  async uploadProperties(file: File): Promise<{
    message: string;
    summary: {
      total: number;
      success: number;
      failed: number;
      duplicate: number;
      status: 'Success' | 'Partial' | 'Failed';
    };
    errors?: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/properties/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getUploadHistory(): Promise<{
    uploads: Array<{
      _id: string;
      filename: string;
      uploadedBy: string;
      total: number;
      success: number;
      failed: number;
      duplicate: number;
      timestamp: string;
      status: 'Success' | 'Partial' | 'Failed';
      errors?: string[];
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/properties/upload/history`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch upload history');
    }

    return response.json();
  }

  async deleteUploadRecord(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/properties/upload/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete upload record');
    }

    return response.json();
  }
}

export const apiService = new ApiService();

// Helper function to get full photo URL
export const getPhotoUrl = (photoUrl: string): string => {
  if (!photoUrl) return '/placeholder.svg';
  
  // If it's already a full URL, return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // If it's a relative URL, prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  return `${backendUrl}${photoUrl}`;
}; 