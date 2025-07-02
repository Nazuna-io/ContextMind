import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { Helmet } from 'react-helmet-async';

// Layout components
import Layout from './components/Layout/Layout';

// Page components (lazy loaded for performance)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Analyzer = React.lazy(() => import('./pages/Analyzer'));
const Performance = React.lazy(() => import('./pages/Performance'));
const Categories = React.lazy(() => import('./pages/Categories'));
const BatchAnalysis = React.lazy(() => import('./pages/BatchAnalysis'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <Container
    maxWidth="sm"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
    }}
  >
    <CircularProgress
      size={48}
      sx={{
        color: 'primary.main',
        mb: 2,
      }}
    />
    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      Loading page...
    </Box>
  </Container>
);

const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>ContextMind - Real-time Contextual Targeting</title>
        <meta 
          name="description" 
          content="Open-source contextual ad targeting using multimodal AI for the post-cookie era. Achieve sub-10ms vector search performance with comprehensive analytics." 
        />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#667eea" />
        <link rel="canonical" href="https://contextmind.ai" />
      </Helmet>

      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Main Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Analysis Tools */}
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/batch" element={<BatchAnalysis />} />
              
              {/* Monitoring & Insights */}
              <Route path="/performance" element={<Performance />} />
              <Route path="/categories" element={<Categories />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Box>
    </>
  );
};

export default App; 