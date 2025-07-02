import React, { useState, useMemo } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Computer as ComputerIcon,
  SportsEsports as GamesIcon,
  LocalHospital as HealthIcon,
  School as EducationIcon,
  Home as HomeIcon,
  Restaurant as FoodIcon,
  DirectionsCar as AutoIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../hooks/useAPI';
import { Category } from '../types/api';

const Categories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { data: categoriesData, isLoading, error } = useCategories();

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    if (!categoriesData?.data?.categories) return [];

    let filtered = categoriesData.data.categories;

    // Filter by source
    if (selectedSource !== 'all') {
             filtered = filtered.filter((cat: Category) => cat.source === selectedSource);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
             filtered = filtered.filter((cat: Category) => 
         cat.category_name.toLowerCase().includes(search) ||
         cat.category_id.toLowerCase().includes(search)
       );
    }

    return filtered;
  }, [categoriesData, selectedSource, searchTerm]);

  // Group categories by high-level category
  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    
         filteredCategories.forEach((category: Category) => {
      // Simple categorization based on category name keywords
      let group = 'Other';
      const name = category.category_name.toLowerCase();
      
      if (name.includes('technology') || name.includes('software') || name.includes('computer') || name.includes('internet')) {
        group = 'Technology';
      } else if (name.includes('business') || name.includes('finance') || name.includes('bank') || name.includes('investment')) {
        group = 'Business & Finance';
      } else if (name.includes('health') || name.includes('medical') || name.includes('fitness') || name.includes('wellness')) {
        group = 'Health & Medicine';
      } else if (name.includes('entertainment') || name.includes('games') || name.includes('sports') || name.includes('music')) {
        group = 'Entertainment & Sports';
      } else if (name.includes('travel') || name.includes('automotive') || name.includes('vehicle') || name.includes('transportation')) {
        group = 'Travel & Automotive';
      } else if (name.includes('education') || name.includes('school') || name.includes('learning') || name.includes('career')) {
        group = 'Education & Career';
      } else if (name.includes('food') || name.includes('restaurant') || name.includes('cooking') || name.includes('dining')) {
        group = 'Food & Dining';
      } else if (name.includes('shopping') || name.includes('retail') || name.includes('fashion') || name.includes('style')) {
        group = 'Shopping & Retail';
      } else if (name.includes('home') || name.includes('garden') || name.includes('real estate') || name.includes('property')) {
        group = 'Home & Garden';
      }
      
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(category);
    });

    return groups;
  }, [filteredCategories]);

  const getGroupIcon = (groupName: string) => {
    switch (groupName) {
      case 'Technology': return <ComputerIcon />;
      case 'Business & Finance': return <BusinessIcon />;
      case 'Health & Medicine': return <HealthIcon />;
      case 'Entertainment & Sports': return <GamesIcon />;
      case 'Education & Career': return <EducationIcon />;
      case 'Food & Dining': return <FoodIcon />;
      case 'Home & Garden': return <HomeIcon />;
      case 'Travel & Automotive': return <AutoIcon />;
      default: return <CategoryIcon />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'iab': return '#2196f3';
      case 'google_ads': return '#4caf50';
      case 'facebook': return '#f44336';
      default: return '#757575';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'iab': return 'IAB';
      case 'google_ads': return 'Google Ads';
      case 'facebook': return 'Facebook';
      default: return source.toUpperCase();
    }
  };

  if (isLoading) {
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
          Failed to load categories: {error.message}
        </Alert>
      </Box>
    );
  }

     const sources = Array.from(new Set(categoriesData?.data?.categories?.map((cat: Category) => cat.source) || []));

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CategoryIcon fontSize="large" />
        📂 Advertising Categories
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Browse and explore all {categoriesData?.data?.categories?.length || 0} advertising categories from IAB, Google Ads, and Facebook
      </Typography>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={selectedSource}
                  label="Source"
                  onChange={(e) => setSelectedSource(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1 }} />}
                >
                                     <MenuItem value="all">All Sources</MenuItem>
                   {sources.map((source: string) => (
                     <MenuItem key={source} value={source}>
                       {getSourceLabel(source)}
                     </MenuItem>
                   ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {filteredCategories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories Found
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Category Groups */}
      <AnimatePresence>
        {Object.entries(groupedCategories).map(([groupName, categories], groupIndex) => (
          <motion.div
            key={groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          >
            <Accordion
              expanded={expandedCategory === groupName}
              onChange={() => setExpandedCategory(expandedCategory === groupName ? null : groupName)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGroupIcon(groupName)}
                    <Typography variant="h6" fontWeight="bold">
                      {groupName}
                    </Typography>
                  </Box>
                  <Badge badgeContent={categories.length} color="primary" sx={{ ml: 'auto', mr: 2 }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {categories.map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={category.category_id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card 
                          sx={{ 
                            height: '100%',
                            '&:hover': { 
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                              <Chip
                                label={getSourceLabel(category.source)}
                                size="small"
                                sx={{
                                  bgcolor: getSourceColor(category.source),
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold" 
                              gutterBottom
                              sx={{ 
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {category.category_name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                fontFamily: 'monospace',
                                bgcolor: 'rgba(0,0,0,0.05)',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'block',
                                mt: 1
                              }}
                            >
                              {category.category_id}
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or filters
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {categoriesData?.data?.categories && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 Category Statistics
            </Typography>
            <Grid container spacing={2}>
                             {sources.map((source: string) => {
                 const count = categoriesData.data.categories.filter((cat: Category) => cat.source === source).length;
                return (
                  <Grid item key={source}>
                    <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getSourceLabel(source)}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
              <Grid item>
                <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {Object.keys(groupedCategories).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category Groups
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Categories; 