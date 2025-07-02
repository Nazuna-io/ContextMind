import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from '../Dashboard';
import { useDashboardData } from '../../hooks/useAPI';

// Mock the useDashboardData hook
const mockUseDashboardData = jest.fn();

jest.mock('../../hooks/useAPI', () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
  },
});

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
};

// Define mock data that matches the expected API response structure
const createMockData = () => ({
  mockSystemStatus: {
    initialized: true,
    status: 'operational',
    categories_loaded: true,
    timestamp: new Date().toISOString(),
    components: {
      content_extractor: true,
      embedder: true,
      search_engine: true,
      matcher: true,
    },
    vector_search: {
      total_embeddings: 1000,
      collections: 5,
    }
  },
  
  mockPerformanceMetrics: {
    vector_search_performance: {
      average_time_ms: 5.2,
      median_time_ms: 4.8,
      p95_time_ms: 8.1,
      p99_time_ms: 10.5,
      queries_per_second: 192.3,
      sub_10ms_percent: 98.7,
      total_queries: 1000,
    },
    timestamp: new Date().toISOString(),
  },
  
  mockCategories: {
    data: {
      categories: [
        { id: 1, name: 'Technology', count: 150 },
        { id: 2, name: 'Science', count: 120 },
      ],
      total_categories: 2,
      sources: ['default'],
    }
  },
  
  mockHealth: {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }
});

// Helper function to mock the dashboard data
const mockDashboardData = (overrides = {}) => {
  const {
    mockSystemStatus,
    mockPerformanceMetrics,
    mockCategories,
    mockHealth
  } = createMockData();

  const defaultData = {
    systemStatus: {
      data: mockSystemStatus,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    performanceMetrics: {
      data: mockPerformanceMetrics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    categories: {
      data: mockCategories,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    health: {
      data: mockHealth,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    isLoading: false,
    hasError: false,
    refetchAll: jest.fn(),
  };

  mockUseDashboardData.mockReturnValue({
    ...defaultData,
    ...overrides,
  });
  
  return {
    mockSystemStatus,
    mockPerformanceMetrics,
    mockCategories,
    mockHealth,
    defaultData
  };
};

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Set up default mock data
    mockDashboardData();
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  it('renders the dashboard with all components', async () => {
    renderDashboard();
    
    // Check if the main title is rendered
    expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
    
    // Check if system status is displayed
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
    
    // Check if performance metrics are displayed
    expect(screen.getByText('5.20')).toBeInTheDocument();
    expect(screen.getByText('192.30')).toBeInTheDocument();
    expect(screen.getByText('98.70 %')).toBeInTheDocument();
    
    // Check if quick actions are displayed
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('URL Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Batch Analysis')).toBeInTheDocument();
  });
  
  it('handles loading state correctly', async () => {
    const mockData = createMockData();
    mockDashboardData({
      systemStatus: { 
        data: mockData.mockSystemStatus, 
        isLoading: true, 
        error: null, 
        refetch: jest.fn() 
      },
      performanceMetrics: { 
        data: mockData.mockPerformanceMetrics, 
        isLoading: true, 
        error: null, 
        refetch: jest.fn() 
      },
      categories: { 
        data: mockData.mockCategories, 
        isLoading: true, 
        error: null, 
        refetch: jest.fn() 
      },
      health: { 
        data: mockData.mockHealth, 
        isLoading: true, 
        error: null, 
        refetch: jest.fn() 
      },
      isLoading: true,
      hasError: false,
      refetchAll: jest.fn(),
    });
    
    renderDashboard();
    
    // Check for loading indicators
    const loadingIndicators = screen.getAllByRole('progressbar');
    expect(loadingIndicators.length).toBeGreaterThan(0);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to load data';
    const mockRefetch = jest.fn();
    
    mockDashboardData({
      systemStatus: { 
        error: new Error(errorMessage),
        refetch: mockRefetch,
      },
      hasError: true,
    });
    
    renderDashboard();
    
    // Check if error state is handled
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    
    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
  
  it('handles missing or malformed API data gracefully', async () => {
    mockDashboardData({
      systemStatus: { data: null },
      performanceMetrics: { data: null },
      categories: { data: null },
      health: { data: null },
    });
    
    renderDashboard();
    
    // The component should render without throwing errors
    expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
    
    // Check for fallback values or empty states
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });
  
  it('refreshes data when refresh button is clicked', async () => {
    const mockRefetchAll = jest.fn();
    mockDashboardData({
      refetchAll: mockRefetchAll,
    });
    
    renderDashboard();
    
    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh dashboard data/i });
    await userEvent.click(refreshButton);
    
    // Verify refetchAll was called
    expect(mockRefetchAll).toHaveBeenCalledTimes(1);
  });
  
  it('navigates to correct routes when quick action buttons are clicked', async () => {
    // Mock window.location.href
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
    
    renderDashboard();
    
    // Test URL Analyzer button
    const analyzerButton = screen.getByText('URL Analyzer');
    await userEvent.click(analyzerButton);
    expect(window.location.href).toContain('/analyzer');
    
    // Reset mock
    window.location.href = '';
    
    // Test Performance button
    const performanceButton = screen.getByText('Performance');
    await userEvent.click(performanceButton);
    expect(window.location.href).toContain('/performance');
    
    // Reset mock
    window.location.href = '';
    
    // Test Categories button
    const categoriesButton = screen.getByText('Categories');
    await userEvent.click(categoriesButton);
    expect(window.location.href).toContain('/categories');
    
    // Reset mock
    window.location.href = '';
    
    // Test Batch Analysis button
    const batchButton = screen.getByText('Batch Analysis');
    await userEvent.click(batchButton);
    expect(window.location.href).toContain('/batch');
  });

  test('renders loading state', () => {
    mockDashboardData({
      isLoading: true,
    });

    renderDashboard();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
  });

  test('handles malformed data gracefully', () => {
    // Mock window.location.href for this test
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
    
    mockDashboardData({
      systemStatus: { 
        data: { invalid: 'data' }, 
        isLoading: false, 
        error: null,
        refetch: jest.fn() 
      },
      performanceMetrics: { 
        data: { invalid: 'data' }, 
        isLoading: false, 
        error: null,
        refetch: jest.fn() 
      },
      categories: { 
        data: { invalid: 'data' }, 
        isLoading: false, 
        error: null,
        refetch: jest.fn() 
      },
      health: { 
        data: { invalid: 'data' }, 
        isLoading: false, 
        error: null,
        refetch: jest.fn() 
      },
      isLoading: false,
      hasError: false,
      refetchAll: jest.fn(),
    });

    renderDashboard();
    
    // Component should render without crashing
    expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
    
    // Restore window.location
    Object.defineProperty(window, 'location', {
  });
  
  renderDashboard();
  
  // Check if error state is handled
  expect(screen.getByText(/error/i)).toBeInTheDocument();
  
  // Test retry functionality
  const retryButton = screen.getByRole('button', { name: /retry/i });
  await userEvent.click(retryButton);
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it('handles missing or malformed API data gracefully', () => {
  mockDashboardData({
    systemStatus: { 
      data: null, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    performanceMetrics: { 
      data: null, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    categories: { 
      data: null, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    health: { 
      data: null, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    isLoading: false,
    hasError: false,
    refetchAll: jest.fn(),
  });
  
  renderDashboard();
  
  // The component should render without throwing errors
  expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
  
  // Check for fallback values or empty states
  const loadingElements = screen.getAllByText(/loading|initializing/i);
  expect(loadingElements.length).toBeGreaterThan(0);
});

it('refreshes data when refresh button is clicked', async () => {
  const mockRefetchAll = jest.fn();
  const mockData = createMockData();
  
  mockDashboardData({
    systemStatus: { 
      data: mockData.mockSystemStatus, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    performanceMetrics: { 
      data: mockData.mockPerformanceMetrics, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    categories: { 
      data: mockData.mockCategories, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    health: { 
      data: mockData.mockHealth, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    },
    isLoading: false,
    hasError: false,
    refetchAll: mockRefetchAll,
  });
  
  renderDashboard();
  
  // Find and click the refresh button (using the icon button's aria-label)
  const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
  await userEvent.click(refreshButtons[0]);
  
  // Verify refetchAll was called
  expect(mockRefetchAll).toHaveBeenCalledTimes(1);
});

it('navigates to correct routes when quick action buttons are clicked', async () => {
  // Mock window.location.href
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, href: '' },
    writable: true,
  });
  
  renderDashboard();
  
  // Test URL Analyzer button
  const analyzerButton = screen.getByText('URL Analyzer');
  await userEvent.click(analyzerButton);
  expect(window.location.href).toContain('/analyzer');
  
  // Reset mock
  window.location.href = '';
  
  // Test Performance button
  const performanceButton = screen.getByText('Performance');
  await userEvent.click(performanceButton);
  expect(window.location.href).toContain('/performance');
  
  // Reset mock
  window.location.href = '';
  
  // Test Categories button
  const categoriesButton = screen.getByText('Categories');
  await userEvent.click(categoriesButton);
  expect(window.location.href).toContain('/categories');
  
  // Reset mock
  window.location.href = '';
  
  // Test Batch Analysis button
  const batchButton = screen.getByText('Batch Analysis');
  await userEvent.click(batchButton);
  expect(window.location.href).toContain('/batch');
});

test('renders loading state', () => {
  mockDashboardData({
    isLoading: true,
  });

  renderDashboard();
  
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
});

test('handles malformed data gracefully', () => {
  // Mock window.location.href for this test
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, href: '' },
    writable: true,
  });
  
  mockDashboardData({
    systemStatus: { 
      data: { invalid: 'data' }, 
      isLoading: false, 
      error: null,
      refetch: jest.fn() 
    },
    performanceMetrics: { 
      data: { invalid: 'data' }, 
      isLoading: false, 
      error: null,
      refetch: jest.fn() 
    },
    categories: { 
      data: { invalid: 'data' }, 
      isLoading: false, 
      error: null,
      refetch: jest.fn() 
    },
    health: { 
      data: { invalid: 'data' }, 
      isLoading: false, 
      error: null,
      refetch: jest.fn() 
    },
    isLoading: false,
    hasError: false,
    refetchAll: jest.fn(),
  });

  renderDashboard();
  
  // Component should render without crashing
  expect(screen.getByText('🧠 ContextMind Dashboard')).toBeInTheDocument();
  
  // Restore window.location
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

test('calls refetchAll when retry button is clicked', async () => {
  const mockRefetchAll = jest.fn();
  mockDashboardData({
    systemStatus: { 
      data: {
        initialized: true,
        status: 'error',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        components: {
          database: false,
          api: false,
          cache: false,
          worker: false,
        },
      },
      isLoading: false,
      error: new Error('API Error'),
      refetch: mockRefetchAll
    },
    hasError: true,
  });

  renderDashboard();
  
  // Find and click the refresh button in error state
  const refreshButton = screen.getByRole('button', { name: /refresh dashboard data/i });
  await userEvent.click(refreshButton);
  
  expect(mockRefetchAll).toHaveBeenCalledTimes(1); // Should be called once for refetchAll
});

test('calls refetchAll when refresh button is clicked', async () => {
  // Mock the refetchAll function
  const refetchAllMock = jest.fn();
  (useDashboardData as jest.Mock).mockReturnValue({
    systemStatus: { data: mockSystemStatus, isLoading: false, error: null, refetch: jest.fn() },
    performanceMetrics: { data: mockPerformanceMetrics, isLoading: false, error: null, refetch: jest.fn() },
    categories: { data: mockCategories, isLoading: false, error: null, refetch: jest.fn() },
    health: { data: mockHealth, isLoading: false, error: null, refetch: jest.fn() },
    isLoading: false,
    hasError: false,
    refetchAll: refetchAllMock,
  });

  renderDashboard();
  
  // Find and click the refresh button (using the icon button's aria-label)
  const refreshButton = screen.getByRole('button', { name: /refresh/i });
  await userEvent.click(refreshButton);
  
  // Verify refetchAll was called
  expect(refetchAllMock).toHaveBeenCalledTimes(1);
});
