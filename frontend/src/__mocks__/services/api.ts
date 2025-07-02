// Mock implementation of the API service for testing
const mockSystemStatus = {
  initialized: true,
  status: 'operational',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  components: {
    database: true,
    api: true,
    cache: true,
    worker: true,
  },
};

const mockPerformanceMetrics = {
  vector_search_performance: {
    average_time_ms: 1.47,
    queries_per_second: 679,
    sub_10ms_percent: 100,
    total_queries: 15000,
    last_updated: new Date().toISOString(),
  },
  system_metrics: {
    cpu_usage: 45.2,
    memory_usage: 1024 * 1024 * 256, // 256MB
    gpu_usage: 35.5,
    active_connections: 42,
  },
};

const mockCategories = {
  data: {
    categories: [
      { id: 1, name: 'Technology', count: 1250 },
      { id: 2, name: 'Sports', count: 980 },
      { id: 3, name: 'Entertainment', count: 1560 },
    ],
    total_categories: 3,
    page: 1,
    page_size: 10,
    total_pages: 1,
  },
};

const mockHealth = {
  status: 'healthy',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  uptime: 3600, // 1 hour in seconds
  database: {
    status: 'connected',
    version: '5.0.0',
  },
  cache: {
    status: 'connected',
    provider: 'redis',
  },
};

const ContextMindAPI = {
  // Health & Status endpoints
  ping: jest.fn().mockResolvedValue({ status: 'ok', timestamp: new Date().toISOString() }),
  getHealth: jest.fn().mockResolvedValue(mockHealth),
  getSystemStatus: jest.fn().mockResolvedValue(mockSystemStatus),
  getPerformanceMetrics: jest.fn().mockResolvedValue(mockPerformanceMetrics),
  
  // Categories endpoint
  getCategories: jest.fn().mockResolvedValue(mockCategories),
  
  // Mock implementation for performance monitoring
  startPerformanceMonitoring: jest.fn((callback, interval = 5000) => {
    // Call immediately with current metrics
    callback(mockPerformanceMetrics);
    
    // Set up interval for updates
    const intervalId = setInterval(() => {
      // Update metrics slightly
      const updatedMetrics = {
        ...mockPerformanceMetrics,
        vector_search_performance: {
          ...mockPerformanceMetrics.vector_search_performance,
          average_time_ms: (Math.random() * 0.5 + 1.2).toFixed(2),
          queries_per_second: Math.floor(Math.random() * 200 + 600),
        },
      };
      callback(updatedMetrics);
    }, interval);
    
    // Return cleanup function
    return Promise.resolve(() => clearInterval(intervalId));
  }),
};

export default ContextMindAPI;
