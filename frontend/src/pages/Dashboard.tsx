import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDashboardData } from '../hooks/useAPI';

// Import API types
import { 
  SystemStatusResponse, 
  PerformanceMetricsResponse, 
  CategoriesResponse,
  VectorSearchPerformance,
  Category
} from '../types/api';

// Extended types for our UI
interface SystemStatusData extends Omit<SystemStatusResponse, 'components'> {
  components: {
    database: boolean;
    api: boolean;
    cache: boolean;
    worker: boolean;
    [key: string]: boolean; // Allow for additional components
  };
  timestamp: string;
  version?: string;
  vector_search?: {
    total_embeddings: number;
    collections: number;
  };
}

interface PerformanceData extends Omit<VectorSearchPerformance, 'total_queries' | 'last_updated'> {
  total_queries: number;
  last_updated: string;
  // Add any additional properties needed by the UI
  [key: string]: any;
}

interface CategoriesData {
  categories: Array<Category | string>; // Handle both Category objects and strings
  total_categories: number;
  sources: string[];
}

const Dashboard: React.FC = () => {
  const { systemStatus, performanceMetrics, categories, health, isLoading, hasError, refetchAll } = useDashboardData();

  // Handle refresh button click
  const handleRefresh = () => {
    refetchAll();
  };

  // Safely access system status with defaults
  const systemStatusResponse = systemStatus?.data;
  const systemStatusData: SystemStatusData = {
    status: systemStatusResponse?.status || 'unknown',
    initialized: systemStatusResponse?.initialized || false,
    categories_loaded: systemStatusResponse?.categories_loaded || false,
    components: {
      database: systemStatusResponse?.components?.content_extractor || false,
      api: systemStatusResponse?.components?.embedder || false,
      cache: systemStatusResponse?.components?.search_engine || false,
      worker: systemStatusResponse?.components?.matcher || false,
    },
    timestamp: systemStatusResponse?.timestamp || new Date().toISOString(),
    vector_search: systemStatusResponse?.vector_search || {
      total_embeddings: 0,
      collections: 0
    }
  };

  const components = systemStatusData.components;
  
  // Extract performance data with defaults
  const performanceMetricsData = performanceMetrics?.data;
  const vectorSearchPerf = performanceMetricsData?.vector_search_performance;
  const performanceData: PerformanceData = {
    average_time_ms: vectorSearchPerf?.average_time_ms || 0,
    median_time_ms: vectorSearchPerf?.median_time_ms || 0,
    p95_time_ms: vectorSearchPerf?.p95_time_ms || 0,
    p99_time_ms: vectorSearchPerf?.p99_time_ms || 0,
    sub_10ms_percent: vectorSearchPerf?.sub_10ms_percent || 0,
    queries_per_second: vectorSearchPerf?.queries_per_second || 0,
    total_queries: vectorSearchPerf?.total_queries || 0,
    last_updated: performanceMetricsData?.timestamp || new Date().toISOString()
  };

  // Extract categories data with defaults
  const categoriesResponse = categories?.data?.data;
  const categoriesData: CategoriesData = {
    categories: Array.isArray(categoriesResponse?.categories) 
      ? categoriesResponse.categories 
      : [],
    total_categories: categoriesResponse?.total_categories || 0,
    sources: Array.isArray(categoriesResponse?.sources)
      ? categoriesResponse.sources
      : []
  };
  
  // Show loading state if any data is still loading
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>Loading Dashboard...</Typography>
        <LinearProgress sx={{ width: '200px' }} />
      </Box>
    );
  }

  // Handle error state if any query failed
  if (hasError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading dashboard data
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mr: 2 }}
          aria-label="Refresh dashboard data"
        >
          Refresh
        </Button>
      </Box>
    );
  }

  // Debug: log data for development
  if (process.env.NODE_ENV === 'development') {
    console.log('System status:', systemStatusData);
    console.log('Performance data:', performanceData);
    console.log('Categories data:', categoriesData);
  }

  // Define stats with safe data access
  const stats = [
    {
      title: 'Avg Search Time',
      value: performanceData.average_time_ms,
      unit: 'ms',
      target: '< 10ms',
      icon: <SpeedIcon />,
      color: '#667eea',
      trend: '-5%',
    },
    {
      title: 'Queries/Second',
      value: performanceData.queries_per_second,
      unit: 'QPS',
      target: '> 500',
      icon: <TrendingIcon />,
      color: '#f5576c',
      trend: '+12%',
    },
    {
      title: 'Available Categories',
      value: categoriesData.total_categories || 0,
      unit: 'categories',
      target: '300+ categories',
      icon: <CategoryIcon />,
      color: '#764ba2',
      trend: 'New',
    },
    {
      title: 'Success Rate',
      value: performanceData.sub_10ms_percent,
      unit: '%',
      target: '99%+ accuracy',
      icon: <AnalyticsIcon />,
      color: '#dd6b20',
      trend: '+5%',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🧠 ContextMind Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time contextual targeting performance overview
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton
              onClick={refetchAll}
              disabled={isLoading}
              sx={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.2)' },
              }}
            >
              <RefreshIcon fontSize="small" aria-hidden="true" />
            </IconButton>
            
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4693 100%)',
                },
              }}
            >
              Quick Analysis
            </Button>
          </Box>
        </Box>

        {/* System Status */}
        <motion.div variants={itemVariants}>
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    System Status
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {systemStatusData.initialized ? 'All systems operational' : 'Initializing...'}
                  </Typography>
                </Box>
                
                <Chip
                  label={systemStatusData.status}
                  color={systemStatusData.initialized ? 'success' : 'warning'}
                  sx={{
                    backgroundColor: systemStatusData.initialized ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={
                    (Object.values(components).filter(Boolean).length / 
                    Math.max(Object.keys(components).length, 1)) * 100
                  }
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Stats */}
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <motion.div variants={itemVariants}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: `${stat.color}20`,
                          color: stat.color,
                          mr: 2,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color={stat.color}>
                          {typeof stat.value === 'number' && !isNaN(stat.value)
                            ? stat.value.toFixed(stat.value < 10 ? 2 : 0)
                            : '-'}
                          <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                            {stat.unit}
                          </Typography>
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={stat.trend}
                        size="small"
                        color={stat.trend.includes('+') ? 'success' : 'primary'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      {stat.title}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary">
                      Target: {stat.target}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🚀 Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => window.location.href = '/analyzer'}
                    sx={{
                      py: 1.5,
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                      },
                    }}
                  >
                    URL Analyzer
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SpeedIcon />}
                    onClick={() => window.location.href = '/performance'}
                    sx={{
                      py: 1.5,
                      borderColor: 'secondary.main',
                      color: 'secondary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(118, 75, 162, 0.05)',
                      },
                    }}
                  >
                    Performance
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CategoryIcon />}
                    onClick={() => window.location.href = '/categories'}
                    sx={{
                      py: 1.5,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        backgroundColor: 'rgba(56, 161, 105, 0.05)',
                      },
                    }}
                  >
                    Categories
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingIcon />}
                    onClick={() => window.location.href = '/batch'}
                    sx={{
                      py: 1.5,
                      borderColor: 'warning.main',
                      color: 'warning.main',
                      '&:hover': {
                        backgroundColor: 'rgba(221, 107, 32, 0.05)',
                      },
                    }}
                  >
                    Batch Analysis
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Dashboard; 