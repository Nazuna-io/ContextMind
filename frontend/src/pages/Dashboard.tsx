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

const Dashboard: React.FC = () => {
  const { systemStatus, performanceMetrics, categories, isLoading, refetchAll } = useDashboardData();

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

  const stats = [
    {
      title: 'Vector Search Speed',
      value: performanceMetrics?.data?.vector_search_performance?.average_time_ms || 0,
      unit: 'ms',
      target: '< 10ms',
      icon: <SpeedIcon />,
      color: '#667eea',
      trend: '+15%',
    },
    {
      title: 'System Performance',
      value: performanceMetrics?.data?.vector_search_performance?.queries_per_second || 0,
      unit: 'QPS',
      target: '500+ QPS',
      icon: <TrendingIcon />,
      color: '#38a169',
      trend: '+23%',
    },
    {
      title: 'Available Categories',
      value: categories?.data?.data?.total_categories || 0,
      unit: 'categories',
      target: '300+ categories',
      icon: <CategoryIcon />,
      color: '#764ba2',
      trend: 'New',
    },
    {
      title: 'Success Rate',
      value: performanceMetrics?.data?.vector_search_performance?.sub_10ms_percent || 0,
      unit: '%',
      target: '99%+ accuracy',
      icon: <AnalyticsIcon />,
      color: '#dd6b20',
      trend: '+5%',
    },
  ];

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
              <RefreshIcon />
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
                    {systemStatus?.data?.initialized ? 'All systems operational' : 'Initializing...'}
                  </Typography>
                </Box>
                
                <Chip
                  label={systemStatus?.data?.status || 'Loading'}
                  color={systemStatus?.data?.initialized ? 'success' : 'warning'}
                  sx={{
                    backgroundColor: systemStatus?.data?.initialized ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
              
              {systemStatus?.data && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      Object.values(systemStatus.data.components).filter(Boolean).length / 
                      Object.keys(systemStatus.data.components).length * 100
                    }
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      },
                    }}
                  />
                </Box>
              )}
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
                          {typeof stat.value === 'number' ? stat.value.toFixed(stat.value < 10 ? 2 : 0) : stat.value}
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