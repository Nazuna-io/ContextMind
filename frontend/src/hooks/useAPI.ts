import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  AnalysisResult,
  BatchAnalysisResponse,
  URLAnalysisRequest,
  BatchAnalysisRequest,
} from '../types/api';
import ContextMindAPI from '../services/api';

// Query keys for consistent caching
export const QUERY_KEYS = {
  SYSTEM_STATUS: 'systemStatus',
  PERFORMANCE_METRICS: 'performanceMetrics',
  CATEGORIES: 'categories',
  HEALTH: 'health',
  ANALYSIS: 'analysis',
} as const;

// System Status Hook
export const useSystemStatus = (refetchInterval?: number) => {
  return useQuery(
    QUERY_KEYS.SYSTEM_STATUS,
    ContextMindAPI.getSystemStatus,
    {
      refetchInterval: refetchInterval || 10000, // 10 seconds default
      retry: 3,
      staleTime: 5000,
      onError: (error: Error) => {
        console.error('System status error:', error);
        toast.error('Failed to fetch system status');
      },
    }
  );
};

// Performance Metrics Hook
export const usePerformanceMetrics = (refetchInterval?: number) => {
  return useQuery(
    QUERY_KEYS.PERFORMANCE_METRICS,
    ContextMindAPI.getPerformanceMetrics,
    {
      refetchInterval: refetchInterval || 5000, // 5 seconds default
      retry: 2,
      staleTime: 2000,
      onError: (error: Error) => {
        console.error('Performance metrics error:', error);
      },
    }
  );
};

// Categories Hook
export const useCategories = (source?: string, limit?: number) => {
  return useQuery(
    [QUERY_KEYS.CATEGORIES, source, limit],
    () => ContextMindAPI.getCategories(source, limit),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      onError: (error: Error) => {
        console.error('Categories error:', error);
        toast.error('Failed to fetch categories');
      },
    }
  );
};

// Health Check Hook
export const useHealth = (enabled: boolean = true) => {
  return useQuery(
    QUERY_KEYS.HEALTH,
    ContextMindAPI.getHealth,
    {
      enabled,
      refetchInterval: 30000, // 30 seconds
      retry: 1,
      onError: (error: Error) => {
        console.error('Health check error:', error);
      },
    }
  );
};

// URL Analysis Mutation Hook
export const useAnalyzeURL = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (request: URLAnalysisRequest) => ContextMindAPI.analyzeURL(request),
    {
      onSuccess: (data: AnalysisResult) => {
        toast.success(`Analysis completed for ${data.url}`);
        
        // Invalidate related queries
        queryClient.invalidateQueries(QUERY_KEYS.PERFORMANCE_METRICS);
        
        // Update analysis cache
        queryClient.setQueryData([QUERY_KEYS.ANALYSIS, data.url], data);
      },
      onError: (error: Error) => {
        console.error('URL analysis error:', error);
        toast.error(`Analysis failed: ${error.message}`);
      },
    }
  );
};

// Batch Analysis Mutation Hook
export const useBatchAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (request: BatchAnalysisRequest) => ContextMindAPI.analyzeBatch(request),
    {
      onSuccess: (data: BatchAnalysisResponse) => {
        toast.success(`Batch analysis completed: ${data.successful_analyses}/${data.total_urls} successful`);
        
        // Invalidate performance metrics
        queryClient.invalidateQueries(QUERY_KEYS.PERFORMANCE_METRICS);
        
        // Cache individual results
        data.results.forEach(result => {
          queryClient.setQueryData([QUERY_KEYS.ANALYSIS, result.url], result);
        });
      },
      onError: (error: Error) => {
        console.error('Batch analysis error:', error);
        toast.error(`Batch analysis failed: ${error.message}`);
      },
    }
  );
};

// Demo Analysis Hook
export const useDemoAnalysis = () => {
  return useMutation(
    (url: string) => ContextMindAPI.getDemoAnalysis(url),
    {
      onSuccess: () => {
        toast.success('Demo analysis completed');
      },
      onError: (error: Error) => {
        console.error('Demo analysis error:', error);
        toast.error(`Demo failed: ${error.message}`);
      },
    }
  );
};

// Connection Test Hook
export const useConnectionTest = () => {
  return useQuery(
    'connectionTest',
    ContextMindAPI.testConnection,
    {
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  );
};

// Real-time Performance Monitoring Hook
export const usePerformanceMonitoring = (enabled: boolean = false) => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['performanceMonitoring', enabled],
    queryFn: async () => {
      if (!enabled) return null;
      
      const cleanup = await ContextMindAPI.startPerformanceMonitoring(
        (metrics) => {
          queryClient.setQueryData(QUERY_KEYS.PERFORMANCE_METRICS, metrics);
        },
        3000 // 3 seconds interval
      );
      
      return cleanup;
    },
    enabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Use useEffect for cleanup instead of invalid onUnmount
  React.useEffect(() => {
    return () => {
      if (data && typeof data === 'function') {
        data(); // Call cleanup function on component unmount
      }
    };
  }, [data]);

  return { data };
};

// System Ready Check Hook
export const useSystemReady = () => {
  return useQuery(
    'systemReady',
    () => ContextMindAPI.waitForSystemReady(),
    {
      retry: false,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 0,
      onSuccess: (isReady) => {
        if (isReady) {
          toast.success('🧠 ContextMind system is ready!');
        } else {
          toast.error('System startup timeout');
        }
      },
    }
  );
};

// Combined Dashboard Data Hook
export const useDashboardData = () => {
  const systemStatus = useSystemStatus(15000); // 15 seconds
  const performanceMetrics = usePerformanceMetrics(5000); // 5 seconds
  const categories = useCategories();
  const health = useHealth();

  return {
    systemStatus,
    performanceMetrics,
    categories,
    health,
    isLoading: systemStatus.isLoading || performanceMetrics.isLoading || categories.isLoading,
    hasError: systemStatus.error || performanceMetrics.error || categories.error || health.error,
    refetchAll: () => {
      systemStatus.refetch();
      performanceMetrics.refetch();
      categories.refetch();
      health.refetch();
    },
  };
}; 