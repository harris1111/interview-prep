import apiClient from './api-client';

// Types
export interface Career {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  careerId: string;
  career?: Career;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  content: string;
  expectedAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  topicId: string;
  topic?: Topic;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioRound {
  id?: string;
  roundNumber: number;
  name: string;
  topics: string[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  careerId: string;
  career?: Career;
  rounds: ScenarioRound[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface Settings {
  id: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTemperature: number;
  systemPrompt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalCareers: number;
  totalTopics: number;
  totalScenarios: number;
  avgScore: number;
  recentSessions: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Career APIs
export const careerApi = {
  async getAll(): Promise<Career[]> {
    const response = await apiClient.get('/admin/careers');
    return response.data;
  },

  async create(data: Partial<Career>): Promise<Career> {
    const response = await apiClient.post('/admin/careers', data);
    return response.data;
  },

  async update(id: string, data: Partial<Career>): Promise<Career> {
    const response = await apiClient.put(`/admin/careers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/careers/${id}`);
  },
};

// Topic APIs
export const topicApi = {
  async getAll(careerId?: string): Promise<Topic[]> {
    const params = careerId ? { careerId } : {};
    const response = await apiClient.get('/admin/topics', { params });
    return response.data;
  },

  async create(data: Partial<Topic>): Promise<Topic> {
    const response = await apiClient.post('/admin/topics', data);
    return response.data;
  },

  async update(id: string, data: Partial<Topic>): Promise<Topic> {
    const response = await apiClient.put(`/admin/topics/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/topics/${id}`);
  },
};

// Question APIs
export const questionApi = {
  async getAll(params?: {
    topicId?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Question>> {
    const response = await apiClient.get('/admin/questions', { params });
    return response.data;
  },

  async create(data: Partial<Question>): Promise<Question> {
    const response = await apiClient.post('/admin/questions', data);
    return response.data;
  },

  async update(id: string, data: Partial<Question>): Promise<Question> {
    const response = await apiClient.put(`/admin/questions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/questions/${id}`);
  },
};

// Scenario APIs
export const scenarioApi = {
  async getAll(careerId?: string): Promise<Scenario[]> {
    const params = careerId ? { careerId } : {};
    const response = await apiClient.get('/admin/scenarios', { params });
    return response.data;
  },

  async getOne(id: string): Promise<Scenario> {
    const response = await apiClient.get(`/admin/scenarios/${id}`);
    return response.data;
  },

  async create(data: Partial<Scenario>): Promise<Scenario> {
    const response = await apiClient.post('/admin/scenarios', data);
    return response.data;
  },

  async update(id: string, data: Partial<Scenario>): Promise<Scenario> {
    const response = await apiClient.put(`/admin/scenarios/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/scenarios/${id}`);
  },
};

// User APIs
export const userApi = {
  async getAll(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async updateRole(id: string, role: string): Promise<User> {
    const response = await apiClient.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },
};

// Settings APIs
export const settingsApi = {
  async get(): Promise<Settings> {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  async update(data: Partial<Settings>): Promise<Settings> {
    const response = await apiClient.put('/admin/settings', data);
    return response.data;
  },

  async testLlm(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/admin/settings/test-llm');
    return response.data;
  },
};

// Dashboard APIs
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },
};
