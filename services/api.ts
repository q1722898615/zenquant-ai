
import { ApiResponse } from '../types';

// 开发环境地址，生产环境应通过环境变量获取
export const API_BASE_URL = 'https://ai.sndkf.top';

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP Error: ${response.statusText}`);
    }

    const res: ApiResponse<T> = await response.json();

    if (res.code !== 200) {
      throw new ApiError(res.code, res.message || 'Unknown API Error');
    }

    return res.data;
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
};
