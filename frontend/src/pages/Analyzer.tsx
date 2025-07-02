import React from 'react';
import { Typography, Card, CardContent, Box } from '@mui/material';

const Analyzer: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🔍 URL Analyzer
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            URL Analyzer page - Coming soon! This will provide real-time analysis of web content.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analyzer; 