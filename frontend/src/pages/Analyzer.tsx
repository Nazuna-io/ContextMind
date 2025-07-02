import React, { useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Grid,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  Language as LanguageIcon,
  Speed as SpeedIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyzeURL } from '../hooks/useAPI';
import { AnalysisResult } from '../types/api';

const Analyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  const analyzeURLMutation = useAnalyzeURL();

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setUrl(newUrl);
    setIsValidUrl(newUrl === '' || validateUrl(newUrl));
  };

  const handleAnalyze = async () => {
    if (!url || !isValidUrl) return;
    
    try {
      const result = await analyzeURLMutation.mutateAsync({ url, top_k: 10 });
      setCurrentAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && url && isValidUrl && !analyzeURLMutation.isLoading) {
      handleAnalyze();
    }
  };

  const formatTime = (ms: number): string => {
    return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4caf50'; // Green
    if (confidence >= 0.6) return '#ff9800'; // Orange  
    if (confidence >= 0.4) return '#f44336'; // Red
    return '#757575'; // Grey
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon fontSize="large" />
        🔍 URL Analyzer
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Analyze any website to discover its advertising categories using multimodal AI
      </Typography>

      {/* URL Input Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Website URL"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
                onKeyPress={handleKeyPress}
                error={!isValidUrl}
                helperText={!isValidUrl ? 'Please enter a valid URL' : 'Enter any website URL to analyze'}
                InputProps={{
                  startAdornment: <LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                                 disabled={analyzeURLMutation.isLoading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleAnalyze}
                                 disabled={!url || !isValidUrl || analyzeURLMutation.isLoading}
                 startIcon={analyzeURLMutation.isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%)',
                  }
                }}
              >
                                 {analyzeURLMutation.isLoading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </Grid>
          </Grid>

          {/* Loading Progress */}
          <AnimatePresence>
            {analyzeURLMutation.isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="indeterminate" 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      background: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      }
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Extracting content and analyzing with multimodal AI...
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {analyzeURLMutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => analyzeURLMutation.reset()}>
                  Dismiss
                </Button>
              }
            >
              <strong>Analysis Failed:</strong> {analyzeURLMutation.error?.message || 'An error occurred during analysis'}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {currentAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={3}>
              {/* Analysis Overview */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CheckCircleIcon color="success" fontSize="large" />
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Analysis Complete
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentAnalysis.title || currentAnalysis.url}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            {currentAnalysis.top_categories.length}
                          </Typography>
                          <Typography variant="body2">Categories Found</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(103, 58, 183, 0.1)' }}>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            {currentAnalysis.text_length.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">Characters</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                          <Typography variant="h6" color="warning.main" fontWeight="bold">
                            {currentAnalysis.num_images}
                          </Typography>
                          <Typography variant="body2">Images</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
                          <Typography variant="h6" color="error.main" fontWeight="bold">
                            {formatTime(currentAnalysis.performance.total_time * 1000)}
                          </Typography>
                          <Typography variant="body2">Total Time</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Categories */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CategoryIcon />
                      Top Advertising Categories
                    </Typography>
                    
                    <List>
                      {currentAnalysis.top_categories.slice(0, 8).map((category, index) => (
                        <motion.div
                          key={category.category_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ListItem>
                            <ListItemIcon>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: `linear-gradient(45deg, ${getConfidenceColor(category.confidence)}, ${getConfidenceColor(category.confidence)}99)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              >
                                #{index + 1}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {category.category_name}
                                  </Typography>
                                  <Chip 
                                    label={category.source} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Confidence: {(category.confidence * 100).toFixed(1)}%
                                    </Typography>
                                    <Chip 
                                      label={getConfidenceLabel(category.confidence)}
                                      size="small"
                                      sx={{ 
                                        height: 18, 
                                        fontSize: '0.65rem',
                                        bgcolor: getConfidenceColor(category.confidence),
                                        color: 'white'
                                      }}
                                    />
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={category.confidence * 100}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'rgba(0,0,0,0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: getConfidenceColor(category.confidence),
                                        borderRadius: 3,
                                      }
                                    }}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < currentAnalysis.top_categories.slice(0, 8).length - 1 && <Divider />}
                        </motion.div>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SpeedIcon />
                      Performance
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Content Extraction"
                          secondary={formatTime(currentAnalysis.performance.extraction_time * 1000)}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <SpeedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Embedding Generation"
                          secondary={formatTime(currentAnalysis.performance.embedding_time * 1000)}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <SearchIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Vector Search"
                          secondary={formatTime(currentAnalysis.performance.search_time_ms)}
                        />
                      </ListItem>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight="bold">
                              Total Analysis Time
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                              {formatTime(currentAnalysis.performance.total_time * 1000)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>

             {/* Example URLs */}
       {!currentAnalysis && !analyzeURLMutation.isLoading && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🌟 Try These Example URLs
            </Typography>
            <Grid container spacing={1}>
              {[
                'https://techcrunch.com',
                'https://cnn.com',
                'https://github.com',
                'https://netflix.com',
                'https://airbnb.com',
                'https://tesla.com'
              ].map((exampleUrl) => (
                <Grid item key={exampleUrl}>
                  <Chip
                    label={exampleUrl}
                    variant="outlined"
                    clickable
                    onClick={() => setUrl(exampleUrl)}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'primary.light', 
                        color: 'white' 
                      } 
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Analyzer; 