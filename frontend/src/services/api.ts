import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  AnalysisResult,
  BatchAnalysisResponse,
  SystemStatusResponse,
  PerformanceMetricsResponse,
  CategoriesResponse,
  DemoAnalysisResponse,
  HealthResponse,
  PingResponse,
  URLAnalysisRequest,
  BatchAnalysisRequest,
  APIError,
} from '../types/api';

// Configure axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<APIError>) => {
    console.error('❌ API Response Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`Server Error ${status}:`, data);
      
      // Enhance error message
      const enhancedError = new Error(
        data?.detail || `Server error: ${status}`
      );
      (enhancedError as any).status = status;
      (enhancedError as any).suggestion = data?.suggestion;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
      return Promise.reject(new Error('Network error: Unable to reach server'));
    } else {
      // Request setup error
      console.error('Request Setup Error:', error.message);
      return Promise.reject(new Error(`Request error: ${error.message}`));
    }
  }
);

/**
 * ContextMind API Service
 * Provides methods to interact with the FastAPI backend
 */
export class ContextMindAPI {
  
  // Health & Status endpoints
  static async ping(): Promise<PingResponse> {
    const response = await api.get<PingResponse>('/ping');
    return response.data;
  }

  static async getHealth(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  }

  static async getSystemStatus(): Promise<SystemStatusResponse> {
    const response = await api.get<SystemStatusResponse>('/api/v1/health');
    return response.data;
  }

  static async getPerformanceMetrics(): Promise<PerformanceMetricsResponse> {
    const response = await api.get<PerformanceMetricsResponse>('/api/v1/performance');
    return response.data;
  }

  // Analysis endpoints
  static async analyzeURL(request: URLAnalysisRequest): Promise<AnalysisResult> {
    const response = await api.post<AnalysisResult>('/api/v1/analyze', request);
    return response.data;
  }

  static async analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const response = await api.post<BatchAnalysisResponse>('/api/v1/analyze/batch', request);
    return response.data;
  }

  static async getDemoAnalysis(url: string): Promise<DemoAnalysisResponse> {
    const response = await api.post<DemoAnalysisResponse>(`/api/v1/demo?url=${encodeURIComponent(url)}`);
    return response.data;
  }

  // Categories endpoint
  static async getCategories(source?: string, limit?: number): Promise<CategoriesResponse> {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get<CategoriesResponse>(`/api/v1/categories?${params}`);
    return response.data;
  }

  // WebSocket-like polling for real-time updates
  static async startPerformanceMonitoring(
    callback: (metrics: PerformanceMetricsResponse) => void,
    interval: number = 5000 // 5 seconds
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        callback(metrics);
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Utility methods
  static async testConnection(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch {
      return false;
    }
  }

  static async waitForSystemReady(
    maxWaitTime: number = 60000, // 60 seconds
    checkInterval: number = 2000  // 2 seconds
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getSystemStatus();
        if (status.initialized && status.categories_loaded) {
          return true;
        }
      } catch {
        // Ignore errors during startup
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    return false;
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export convenience methods
export const {
  ping,
  getHealth,
  getSystemStatus,
  getPerformanceMetrics,
  analyzeURL,
  analyzeBatch,
  getDemoAnalysis,
  getCategories,
  startPerformanceMonitoring,
  testConnection,
  waitForSystemReady,
  isValidURL,
} = ContextMindAPI;

// Export default
export default ContextMindAPI; 