import { AnalysisResult, BatchAnalysisResponse, SystemStatusResponse, PerformanceMetricsResponse, CategoriesResponse, DemoAnalysisResponse, HealthResponse, URLAnalysisRequest, BatchAnalysisRequest } from '../../types/api';

declare const ContextMindAPI: {
  // Health & Status endpoints
  ping(): Promise<{ status: string; timestamp: string }>;
  getHealth(): Promise<HealthResponse>;
  getSystemStatus(): Promise<SystemStatusResponse>;
  getPerformanceMetrics(): Promise<PerformanceMetricsResponse>;
  
  // Analysis endpoints
  analyzeURL(request: URLAnalysisRequest): Promise<AnalysisResult>;
  analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse>;
  getDemoAnalysis(url: string): Promise<DemoAnalysisResponse>;
  
  // Categories endpoint
  getCategories(source?: string, limit?: number): Promise<CategoriesResponse>;
  
  // Utility methods
  testConnection(): Promise<boolean>;
  isValidURL(url: string): boolean;
  startPerformanceMonitoring(callback: (metrics: PerformanceMetricsResponse) => void, interval?: number): Promise<() => void>;
  waitForSystemReady(maxWaitTime?: number, checkInterval?: number): Promise<boolean>;
  getRoot(): Promise<any>;
};

export default ContextMindAPI;
