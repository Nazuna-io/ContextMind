#!/usr/bin/env python3
"""
Simple test script to verify server startup
"""

import sys
import logging
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('test-server')

def test_imports():
    """Test basic imports"""
    logger.info("🔍 Testing basic imports...")
    
    try:
        import fastapi
        logger.info("✅ FastAPI imported")
    except ImportError as e:
        logger.error(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import uvicorn
        logger.info("✅ Uvicorn imported")
    except ImportError as e:
        logger.error(f"❌ Uvicorn import failed: {e}")
        return False
    
    try:
        from app.main import app
        logger.info("✅ ContextMind app imported")
    except ImportError as e:
        logger.error(f"❌ ContextMind app import failed: {e}")
        return False
    
    return True

def test_basic_server():
    """Test if server can start on a different port"""
    logger.info("🚀 Testing basic server startup...")
    
    try:
        import uvicorn
        from app.main import app
        
        # Test server on port 8001 to avoid conflicts
        logger.info("🔧 Starting test server on port 8001...")
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
        
    except Exception as e:
        logger.error(f"❌ Server test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    logger.info("🧠 ContextMind Server Test")
    logger.info("=" * 40)
    
    if not test_imports():
        logger.error("❌ Import tests failed!")
        sys.exit(1)
    
    logger.info("✅ All imports successful!")
    logger.info("🚀 Starting basic server test...")
    
    test_basic_server() 