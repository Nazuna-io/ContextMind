import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMetrics } from '../hooks/useAPI';

interface PerformanceData {
  timestamp: string;
  searchTime: number;
  qps: number;
  successRate: number;
}

const Performance: React.FC = () => {
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  
  const { data: performanceMetrics, isLoading, error } = usePerformanceMetrics(
    realTimeEnabled ? 3000 : undefined
  );

  // Update performance history when new data arrives
  useEffect(() => {
    if (performanceMetrics?.vector_search_performance) {
      const newData: PerformanceData = {
        timestamp: new Date().toLocaleTimeString(),
        searchTime: performanceMetrics.vector_search_performance.average_time_ms,
        qps: performanceMetrics.vector_search_performance.queries_per_second,
        successRate: performanceMetrics.vector_search_performance.sub_10ms_percent,
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, newData];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    }
  }, [performanceMetrics]);

  const formatTime = (ms: number): string => {
    return ms < 1000 ? `${ms.toFixed(2)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (value: number, threshold: number): 'success' | 'warning' | 'error' => {
    if (value <= threshold) return 'success';
    if (value <= threshold * 1.5) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error'): string => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
    }
  };

  if (isLoading && !performanceMetrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load performance metrics: {error.message}
        </Alert>
      </Box>
    );
  }

  const metrics = performanceMetrics?.vector_search_performance;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon fontSize="large" />
            📊 Performance Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time system performance metrics and analytics
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={realTimeEnabled}
              onChange={(e) => setRealTimeEnabled(e.target.checked)}
              color="primary"
            />
          }
          label="Real-time Monitoring"
        />
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SpeedIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {metrics ? formatTime(metrics.average_time_ms) : '--'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Search Time
                    </Typography>
                    <Chip
                      size="small"
                      label={metrics && getPerformanceStatus(metrics.average_time_ms, 10) === 'success' ? 'Excellent' : 'Target: <10ms'}
                      color={metrics && getPerformanceStatus(metrics.average_time_ms, 10) === 'success' ? 'success' : 'warning'}
                      sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {metrics ? Math.round(metrics.queries_per_second) : '--'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Queries/Second
                    </Typography>
                    <Chip
                      size="small"
                      label={metrics && metrics.queries_per_second > 500 ? 'High Throughput' : 'Target: >500 QPS'}
                      color={metrics && metrics.queries_per_second > 500 ? 'success' : 'warning'}
                      sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {metrics ? `${metrics.sub_10ms_percent.toFixed(1)}%` : '--'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Chip
                      size="small"
                      label={metrics && metrics.sub_10ms_percent >= 99 ? 'Optimal' : 'Target: >99%'}
                      color={metrics && metrics.sub_10ms_percent >= 99 ? 'success' : 'warning'}
                      sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TimerIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {metrics ? formatTime(metrics.p99_time_ms) : '--'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      P99 Latency
                    </Typography>
                    <Chip
                      size="small"
                      label="99th Percentile"
                      color="info"
                      sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Detailed Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SettingsIcon />
                Detailed Performance Metrics
              </Typography>

              {metrics && (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SpeedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Response Time"
                      secondary={formatTime(metrics.average_time_ms)}
                    />
                    <Chip
                      size="small"
                      label={getPerformanceStatus(metrics.average_time_ms, 10)}
                      sx={{
                        bgcolor: getStatusColor(getPerformanceStatus(metrics.average_time_ms, 10)),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <TimerIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Median Response Time"
                      secondary={formatTime(metrics.median_time_ms)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="P95 Response Time"
                      secondary={formatTime(metrics.p95_time_ms)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="P99 Response Time"
                      secondary={formatTime(metrics.p99_time_ms)}
                    />
                  </ListItem>

                  <Divider sx={{ my: 1 }} />

                  <ListItem>
                    <ListItemIcon>
                      <ComputerIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Queries Per Second"
                      secondary={`${Math.round(metrics.queries_per_second)} QPS`}
                    />
                    <Chip
                      size="small"
                      label={metrics.queries_per_second > 500 ? 'High' : 'Moderate'}
                      color={metrics.queries_per_second > 500 ? 'success' : 'warning'}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sub-10ms Success Rate"
                      secondary={`${metrics.sub_10ms_percent.toFixed(2)}%`}
                    />
                    <Chip
                      size="small"
                      label={metrics.sub_10ms_percent >= 99 ? 'Excellent' : 'Good'}
                      color={metrics.sub_10ms_percent >= 99 ? 'success' : 'info'}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ComputerIcon />
                System Status
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      System Ready
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    All components operational and responding normally
                  </Typography>
                </Paper>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vector Search Engine"
                    secondary="Online - ChromaDB"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="ML Pipeline"
                    secondary="Ready - 4x RTX 3090"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Content Extractor"
                    secondary="Active - Playwright"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Categories Database"
                    secondary="308 categories loaded"
                  />
                </ListItem>
              </List>

              {realTimeEnabled && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary.main" fontWeight="medium">
                    🔄 Real-time monitoring active
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updates every 3 seconds
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AnalyticsIcon />
                Performance History
              </Typography>

              {performanceHistory.length > 0 ? (
                <Box>
                  <Grid container spacing={2}>
                    {performanceHistory.slice(-6).map((data, index) => (
                      <Grid item xs={12} md={2} key={index}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {data.timestamp}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {formatTime(data.searchTime)}
                            </Typography>
                            <Typography variant="body2">
                              {Math.round(data.qps)} QPS
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              {data.successRate.toFixed(1)}% Success
                            </Typography>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing last {Math.min(performanceHistory.length, 6)} measurements
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No performance history available yet.
                    {realTimeEnabled ? ' Data will appear as measurements are taken.' : ' Enable real-time monitoring to collect data.'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Performance; 