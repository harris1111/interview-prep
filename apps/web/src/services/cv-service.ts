import apiClient from './api-client';

export interface CvUpload {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  rawText: string | null;
  createdAt: string;
  analysis?: CvAnalysis;
}

export interface CvAnalysis {
  id: string;
  cvUploadId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  structuredData: any;
  gapReport: any;
  targetCareerId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export const cvService = {
  async upload(file: File, careerId?: string): Promise<CvUpload> {
    const formData = new FormData();
    formData.append('file', file);

    const url = careerId ? `/cv/upload?careerId=${careerId}` : '/cv/upload';
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getMyCvs(): Promise<CvUpload[]> {
    const response = await apiClient.get('/cv/my');
    return response.data;
  },

  async getCv(id: string): Promise<CvUpload> {
    const response = await apiClient.get(`/cv/${id}`);
    return response.data;
  },

  async reanalyze(id: string, careerId?: string): Promise<CvAnalysis> {
    const url = careerId
      ? `/cv/${id}/reanalyze?careerId=${careerId}`
      : `/cv/${id}/reanalyze`;
    const response = await apiClient.post(url);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cv/${id}`);
  },
};
