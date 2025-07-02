import React from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';

const Performance: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        ⚡ Performance Metrics
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Performance page - Coming soon! This will show real-time performance analytics and vector search metrics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Performance; 