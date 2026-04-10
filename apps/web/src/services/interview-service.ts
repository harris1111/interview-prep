import apiClient from './api-client';

export interface InterviewSession {
  id: string;
  userId: string;
  scenarioId: string;
  cvAnalysisId: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  overallScore: number | null;
  readinessLevel: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendations: string[] | null;
  createdAt: string;
  updatedAt: string;
  scenario?: {
    id: string;
    name: string;
    description: string;
    career: { id: string; name: string };
  };
  rounds?: InterviewRound[];
}

export interface InterviewRound {
  id: string;
  sessionId: string;
  roundNumber: number;
  roundName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  observations: string | null;
  recommendations: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewMessage {
  id: string;
  sessionId: string;
  roundNumber: number;
  role: 'SYSTEM' | 'USER' | 'ASSISTANT';
  content: string;
  answerScore: number | null;
  feedback: string | null;
  createdAt: string;
}

export interface Scenario {
  id: string;
  careerId: string;
  name: string;
  description: string;
  systemPrompt: string;
  rounds: {
    roundNumber: number;
    roundName: string;
    topicIds: string[];
  }[];
  career?: { id: string; name: string };
}

export const interviewService = {
  async startInterview(
    scenarioId: string,
    cvAnalysisId?: string,
  ): Promise<InterviewSession> {
    const response = await apiClient.post('/interview/start', {
      scenarioId,
      cvAnalysisId: cvAnalysisId || undefined,
    });
    return response.data;
  },

  async getMySessions(): Promise<InterviewSession[]> {
    const response = await apiClient.get('/interview/sessions');
    return response.data;
  },

  async getSession(id: string): Promise<InterviewSession> {
    const response = await apiClient.get(`/interview/${id}`);
    return response.data;
  },

  async abandonSession(id: string): Promise<void> {
    await apiClient.post(`/interview/${id}/abandon`);
  },

  async sendMessageAndStream(
    sessionId: string,
    roundNumber: number,
    content: string,
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const token = localStorage.getItem('accessToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    
    const response = await fetch(
      `${baseURL}/interview/${sessionId}/rounds/${roundNumber}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.body!.getReader();
  },

  async getMessages(sessionId: string, roundNumber: number): Promise<InterviewMessage[]> {
    const response = await apiClient.get(
      `/interview/${sessionId}/rounds/${roundNumber}/messages`,
    );
    return response.data;
  },

  async completeRound(sessionId: string, roundNumber: number): Promise<InterviewRound> {
    const response = await apiClient.post(
      `/interview/${sessionId}/rounds/${roundNumber}/complete`,
    );
    return response.data;
  },

  async completeInterview(sessionId: string): Promise<InterviewSession> {
    const response = await apiClient.post(`/interview/${sessionId}/complete`);
    return response.data;
  },

  async getScenarios(): Promise<Scenario[]> {
    const response = await apiClient.get('/admin/scenarios');
    return response.data;
  },
};
