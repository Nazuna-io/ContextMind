import React from 'react';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { Psychology as BrainIcon } from '@mui/icons-material';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading ContextMind...', 
  progress 
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
          }}
        >
          {/* Animated Brain Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BrainIcon
              sx={{
                fontSize: 80,
                mb: 3,
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
              }}
            />
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              ContextMind
            </Typography>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 300,
                mb: 4,
                opacity: 0.9,
                letterSpacing: '0.5px',
              }}
            >
              Real-time Contextual Targeting
            </Typography>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress
                size={60}
                thickness={3}
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  animationDuration: '1.5s',
                }}
                variant={progress !== undefined ? 'determinate' : 'indeterminate'}
                value={progress}
              />
              {progress !== undefined && (
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    color="white"
                    fontWeight={600}
                  >
                    {`${Math.round(progress)}%`}
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>

          {/* Status Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <Typography
              variant="body1"
              sx={{
                opacity: 0.8,
                fontWeight: 400,
                fontSize: '1.1rem',
              }}
            >
              {message}
            </Typography>
          </motion.div>

          {/* Sub-text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 2,
                opacity: 0.6,
                fontSize: '0.9rem',
              }}
            >
              Powered by Multimodal AI • Sub-10ms Vector Search
            </Typography>
          </motion.div>

          {/* Pulse Animation Background */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              zIndex: -1,
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />

          <style>
            {`
              @keyframes pulse {
                0%, 100% {
                  transform: translate(-50%, -50%) scale(0.8);
                  opacity: 0.5;
                }
                50% {
                  transform: translate(-50%, -50%) scale(1.2);
                  opacity: 0.1;
                }
              }
            `}
          </style>
        </Box>
      </Container>
    </Box>
  );
};

export default LoadingScreen; 