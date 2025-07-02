import React from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';

const BatchAnalysis: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📊 Batch Analysis
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Batch Analysis page - Coming soon! This will allow processing multiple URLs simultaneously.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BatchAnalysis; 