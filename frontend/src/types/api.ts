// API Types for ContextMind Frontend
// These types match the Pydantic models from the FastAPI backend

export interface CategoryInfo {
  category_id: string;
  category_name: string;
  confidence: number;
  source: string;
  keywords: string[];
}

export interface PerformanceMetrics {
  extraction_time: number;
  embedding_time: number;
  search_time_ms: number;
  total_time: number;
}

export interface AnalysisMetadata {
  embedding_dimension: number;
  text_length: number;
}

export interface AnalysisResult {
  url: string;
  success: boolean;
  title: string;
  text_length: number;
  num_images: number;
  top_categories: CategoryInfo[];
  performance: PerformanceMetrics;
  metadata: AnalysisMetadata;
  error_message?: string;
}

export interface BatchAnalysisResponse {
  total_urls: number;
  successful_analyses: number;
  success_rate: number;
  total_time: number;
  results: AnalysisResult[];
}

export interface SystemStatusResponse {
  status: string;
  initialized: boolean;
  categories_loaded: boolean;
  components: {
    embedder: boolean;
    search_engine: boolean;
    content_extractor: boolean;
    matcher: boolean;
  };
  vector_search?: {
    total_embeddings: number;
    collections: number;
  };
  timestamp: string;
}

export interface VectorSearchPerformance {
  average_time_ms: number;
  median_time_ms: number;
  p95_time_ms: number;
  p99_time_ms: number;
  sub_10ms_percent: number;
  queries_per_second: number;
}

export interface PerformanceMetricsResponse {
  vector_search_performance: VectorSearchPerformance;
  system_ready: boolean;
  timestamp: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  source: string;
}

export interface CategoriesResponse {
  data: {
    categories: Category[];
    total_categories: number;
    sources: string[];
  };
  message: string;
  filters_applied: {
    source?: string;
    limit?: number;
  };
}

export interface DemoAnalysisResponse {
  url: string;
  title: string;
  top_categories: {
    name: string;
    confidence: number;
    source: string;
  }[];
  performance: {
    total_time: number;
    search_time_ms: number;
  };
  demo: boolean;
  error?: string;
  success?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface PingResponse {
  message: string;
  timestamp: string;
}

// Request types
export interface URLAnalysisRequest {
  url: string;
  top_k?: number;
}

export interface BatchAnalysisRequest {
  urls: string[];
  top_k?: number;
}

// Error types
export interface APIError {
  detail: string;
  type?: string;
  suggestion?: string;
}

// Chart data types
export interface CategoryChartData {
  name: string;
  value: number;
  confidence: number;
  source: string;
  color: string;
}

export interface PerformanceChartData {
  timestamp: string;
  search_time: number;
  total_time: number;
  success_rate: number;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number[];
  active_connections: number;
  requests_per_minute: number;
}

// UI State types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  systemStatus: SystemStatusResponse | null;
  recentAnalyses: AnalysisResult[];
}

export interface AnalysisState {
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisHistory: AnalysisResult[];
  selectedCategories: string[];
}

export interface DashboardState {
  performanceMetrics: PerformanceMetricsResponse | null;
  systemMetrics: SystemMetrics | null;
  realtimeData: PerformanceChartData[];
  isMonitoring: boolean;
} 