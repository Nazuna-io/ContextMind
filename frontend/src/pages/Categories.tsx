import React from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';

const Categories: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📂 Ad Categories
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Categories page - Coming soon! This will display all 308 available ad categories with filtering and search.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Categories; 