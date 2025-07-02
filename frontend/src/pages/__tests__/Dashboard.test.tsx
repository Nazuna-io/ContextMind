import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import '@testing-library/jest-dom';

// Mock the API client
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

// Mock the useAPI hook
jest.mock('../../hooks/useAPI', () => ({
  useDashboardData: jest.fn(),
}));

// Get the mock function
const mockUseDashboardData = require('../../hooks/useAPI').useDashboardData;

describe('Dashboard Component', () => {
  const mockRefetch = jest.fn();
  
  const mockData = {
    systemStatus: {
      data: {
        initialized: true,
        status: 'operational',
        components: {
          database: true,
          api: true,
          cache: true,
          worker: true,
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    },
    performanceMetrics: {
      data: {
        vector_search_performance: {
          average_time_ms: 1.47,
          queries_per_second: 679,
          sub_10ms_percent: 100,
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    },
    categories: {
      data: {
        data: {
          categories: [
            { id: 1, name: 'Technology' },
            { id: 2, name: 'Sports' },
          ],
          total_categories: 2,
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    },
    health: {
      data: { status: 'healthy' },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    },
    isLoading: false,
    hasError: false,
    refetchAll: mockRefetch,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Set default mock implementation
    mockUseDashboardData.mockReturnValue(mockData);
  });

  test('renders loading state', () => {
    mockUseDashboardData.mockReturnValue({
      ...mockData,
      isLoading: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
  });

  test('renders error state', () => {
    mockUseDashboardData.mockReturnValue({
      ...mockData,
      systemStatus: { ...mockData.systemStatus, error: new Error('API Error') },
      hasError: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('renders dashboard with data', async () => {
    render(<Dashboard />);
    
    // Check if main elements are rendered
    expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time contextual targeting performance overview')).toBeInTheDocument();
    
    // Check if main sections are rendered
    expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time contextual targeting performance overview')).toBeInTheDocument();
    
    // Check if key UI elements are present (using more flexible matching)
    expect(screen.getByText(/Avg Search Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Queries\/Second/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
  });

  test('handles undefined data gracefully', () => {
    mockUseDashboardData.mockReturnValue({
      systemStatus: { data: undefined, isLoading: false, error: null, refetch: mockRefetch },
      performanceMetrics: { data: undefined, isLoading: false, error: null, refetch: mockRefetch },
      categories: { data: undefined, isLoading: false, error: null, refetch: mockRefetch },
      health: { data: undefined, isLoading: false, error: null, refetch: mockRefetch },
      isLoading: false,
      hasError: false,
      refetchAll: mockRefetch,
    });

    // This test passes if the component doesn't throw an error
    expect(() => render(<Dashboard />)).not.toThrow();
  });

  test('handles malformed categories data', () => {
    mockUseDashboardData.mockReturnValue({
      ...mockData,
      categories: {
        data: {
          // Malformed data - missing 'data' property
          somethingElse: {}
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      },
    });

    // This test passes if the component doesn't throw an error
    expect(() => render(<Dashboard />)).not.toThrow();
  });

  test('calls refetchAll when retry button is clicked', async () => {
    mockUseDashboardData.mockReturnValue({
      ...mockData,
      systemStatus: { ...mockData.systemStatus, error: new Error('API Error') },
      hasError: true,
    });

    render(<Dashboard />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1); // Should be called once for refetchAll
    });
  });
});
