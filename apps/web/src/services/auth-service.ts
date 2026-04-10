import apiClient from './api-client';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: { name?: string }): Promise<User> {
    const response = await apiClient.patch('/auth/me', data);
    return response.data;
  },
};
