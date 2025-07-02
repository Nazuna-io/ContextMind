#!/usr/bin/env python3
"""
ContextMind API Server Startup Script
Production and development server configurations with enhanced logging and debugging
"""

import argparse
import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

# Setup enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('contextmind_startup.log')
    ]
)

logger = logging.getLogger('ContextMind-Startup')

def check_dependencies():
    """Check if all required dependencies are available"""
    logger.info("🔍 Checking dependencies...")
    
    required_packages = [
        'fastapi', 'uvicorn', 'torch', 'transformers', 
        'chromadb', 'playwright', 'requests', 'numpy'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"✅ {package} - OK")
        except ImportError:
            missing_packages.append(package)
            logger.error(f"❌ {package} - MISSING")
    
    if missing_packages:
        logger.error(f"Missing packages: {missing_packages}")
        logger.error("Please install dependencies: pip install -r requirements.txt")
        return False
    
    logger.info("✅ All dependencies available")
    return True

def check_gpu():
    """Check GPU availability"""
    logger.info("🖥️  Checking GPU availability...")
    
    try:
        import torch
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            logger.info(f"✅ Found {gpu_count} GPU(s)")
            for i in range(gpu_count):
                gpu_name = torch.cuda.get_device_name(i)
                logger.info(f"   GPU {i}: {gpu_name}")
        else:
            logger.warning("⚠️  No CUDA GPUs available - running on CPU")
    except Exception as e:
        logger.error(f"❌ Error checking GPU: {e}")

def check_port(host, port):
    """Check if port is available"""
    import socket
    
    logger.info(f"🔌 Checking if port {port} is available on {host}...")
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex((host, port))
            if result == 0:
                logger.error(f"❌ Port {port} is already in use!")
                return False
            else:
                logger.info(f"✅ Port {port} is available")
                return True
    except Exception as e:
        logger.error(f"❌ Error checking port: {e}")
        return False

def check_virtual_env():
    """Check if running in virtual environment"""
    logger.info("📦 Checking virtual environment...")
    
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        logger.info("✅ Running in virtual environment")
        logger.info(f"   Python path: {sys.prefix}")
    else:
        logger.warning("⚠️  Not running in virtual environment")
        logger.warning("   Consider using: source venv/bin/activate")

def main():
    parser = argparse.ArgumentParser(description="ContextMind API Server")
    
    parser.add_argument(
        "--host", 
        default="0.0.0.0", 
        help="Host to bind the server to (default: 0.0.0.0)"
    )
    
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="Port to bind the server to (default: 8000)"
    )
    
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    
    parser.add_argument(
        "--workers", 
        type=int, 
        default=1, 
        help="Number of worker processes (default: 1)"
    )
    
    parser.add_argument(
        "--dev", 
        action="store_true", 
        help="Run in development mode (reload enabled, single worker)"
    )
    
    parser.add_argument(
        "--prod", 
        action="store_true", 
        help="Run in production mode (optimized settings)"
    )
    
    parser.add_argument(
        "--skip-checks", 
        action="store_true", 
        help="Skip pre-startup checks (not recommended)"
    )
    
    parser.add_argument(
        "--verbose", 
        action="store_true", 
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("🔍 Verbose logging enabled")
    
    # Print startup banner
    logger.info("="*60)
    logger.info("🧠 ContextMind API Server Starting...")
    logger.info(f"⏰ Startup time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"📁 Working directory: {os.getcwd()}")
    logger.info("="*60)
    
    # Pre-startup checks
    if not args.skip_checks:
        logger.info("🚀 Running pre-startup checks...")
        
        check_virtual_env()
        
        if not check_dependencies():
            logger.error("❌ Dependency check failed!")
            sys.exit(1)
        
        check_gpu()
        
        # Determine host for port check
        host_to_check = "127.0.0.1" if args.dev else args.host
        if not check_port(host_to_check, args.port):
            logger.error("❌ Port check failed!")
            sys.exit(1)
        
        logger.info("✅ All pre-startup checks passed!")
    else:
        logger.warning("⚠️  Skipping pre-startup checks")
    
    # Import the server after checks
    try:
        logger.info("📦 Importing ContextMind application...")
        from app.main import run_server
        logger.info("✅ Application imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import application: {e}")
        logger.error("💡 Make sure you're in the backend directory and dependencies are installed")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error importing application: {e}")
        sys.exit(1)
    
    # Development mode configuration
    if args.dev:
        logger.info("🔧 Starting in DEVELOPMENT mode")
        logger.info(f"   Host: 127.0.0.1 (localhost only)")
        logger.info(f"   Port: {args.port}")
        logger.info(f"   Auto-reload: Enabled")
        logger.info(f"   Workers: 1")
        
        try:
            run_server(
                host="127.0.0.1",  # Local only for dev
                port=args.port,
                reload=True,
                workers=1
            )
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Server error: {e}")
            raise
        
    # Production mode configuration
    elif args.prod:
        logger.info("🚀 Starting in PRODUCTION mode")
        
        # Use environment variables for production settings
        host = os.getenv("CONTEXTMIND_HOST", args.host)
        port = int(os.getenv("CONTEXTMIND_PORT", args.port))
        workers = int(os.getenv("CONTEXTMIND_WORKERS", 4))  # More workers for production
        
        logger.info(f"   Host: {host}")
        logger.info(f"   Port: {port}")
        logger.info(f"   Auto-reload: Disabled")
        logger.info(f"   Workers: {workers}")
        
        try:
            run_server(
                host=host,
                port=port,
                reload=False,
                workers=workers
            )
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Server error: {e}")
            raise
        
    # Custom configuration
    else:
        logger.info("⚙️  Starting with custom configuration")
        logger.info(f"   Host: {args.host}")
        logger.info(f"   Port: {args.port}")
        logger.info(f"   Auto-reload: {args.reload}")
        logger.info(f"   Workers: {args.workers}")
        
        try:
            run_server(
                host=args.host,
                port=args.port,
                reload=args.reload,
                workers=args.workers
            )
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Server error: {e}")
            raise


if __name__ == "__main__":
    main() 