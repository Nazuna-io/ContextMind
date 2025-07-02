#!/usr/bin/env python3
"""
ContextMind API Server Startup Script
Production and development server configurations
"""

import argparse
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.main import run_server


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
    
    args = parser.parse_args()
    
    # Development mode configuration
    if args.dev:
        print("🔧 Starting in DEVELOPMENT mode")
        run_server(
            host="127.0.0.1",  # Local only for dev
            port=args.port,
            reload=True,
            workers=1
        )
        
    # Production mode configuration
    elif args.prod:
        print("🚀 Starting in PRODUCTION mode")
        
        # Use environment variables for production settings
        host = os.getenv("CONTEXTMIND_HOST", args.host)
        port = int(os.getenv("CONTEXTMIND_PORT", args.port))
        workers = int(os.getenv("CONTEXTMIND_WORKERS", 4))  # More workers for production
        
        run_server(
            host=host,
            port=port,
            reload=False,
            workers=workers
        )
        
    # Custom configuration
    else:
        print("⚙️  Starting with custom configuration")
        run_server(
            host=args.host,
            port=args.port,
            reload=args.reload,
            workers=args.workers
        )


if __name__ == "__main__":
    main() 