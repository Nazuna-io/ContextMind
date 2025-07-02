"""
ContextMind FastAPI Application
Real-time contextual targeting system using multimodal AI
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import uvicorn
from datetime import datetime
import logging
import sys
from pathlib import Path

from .api.routes import router as api_router


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("contextmind.log")
    ]
)

logger = logging.getLogger("contextmind")


# Create FastAPI app with comprehensive metadata
app = FastAPI(
    title="ContextMind API",
    description="""
    # ContextMind Contextual Targeting API
    
    🧠 **Real-time contextual ad targeting using multimodal AI**
    
    ContextMind analyzes web content using state-of-the-art multimodal embeddings to provide 
    blazing-fast contextual ad targeting without cookies or tracking pixels.
    
    ## Features
    
    * **⚡ Sub-10ms Vector Search** - Lightning-fast similarity search across 10,000+ ad categories
    * **🎯 Multimodal Analysis** - Text + Image + Layout understanding using CLIP & Transformers  
    * **🚀 Real-time Processing** - Complete analysis in under 10 seconds
    * **📊 Production-Ready** - Built for scale with multi-GPU acceleration
    * **🔒 Privacy-First** - No tracking pixels, cookies, or persistent user data
    
    ## Core Endpoints
    
    * `POST /analyze` - Analyze single URL for contextual targeting
    * `POST /analyze/batch` - Batch analyze multiple URLs 
    * `GET /performance` - Get system performance metrics
    * `GET /health` - System status and diagnostics
    
    ## Technology Stack
    
    * **ML Models**: CLIP ViT-Large, Sentence Transformers
    * **Vector Search**: ChromaDB with cosine similarity
    * **Content Extraction**: Playwright-based web scraping
    * **GPU Acceleration**: Multi-GPU pipeline (4x RTX 3090)
    
    Open-source contextual advertising platform - Showcasing enterprise-grade ML infrastructure.
    """,
    version="1.0.0",
    contact={
        "name": "ContextMind Team",
        "email": "team@contextmind.ai",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    terms_of_service="https://contextmind.ai/terms",
    openapi_tags=[
        {
            "name": "analysis",
            "description": "Content analysis and contextual targeting operations"
        },
        {
            "name": "system", 
            "description": "System health, status, and performance monitoring"
        },
        {
            "name": "demo",
            "description": "Demo and testing endpoints"
        }
    ]
)


# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Custom middleware for request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"🔍 {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response
    logger.info(f"✅ {request.method} {request.url} - {response.status_code} ({process_time:.3f}s)")
    
    return response


# Include API router
app.include_router(api_router, prefix="/api/v1", tags=["api"])


# Root endpoint
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    """
    Landing page with API documentation
    """
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>ContextMind API</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 { color: #2d3748; margin-bottom: 0.5rem; }
            .subtitle { color: #718096; font-size: 1.2rem; margin-bottom: 2rem; }
            .feature { 
                background: #f7fafc; 
                padding: 1rem; 
                margin: 1rem 0; 
                border-radius: 5px;
                border-left: 4px solid #667eea;
            }
            .links { margin-top: 2rem; }
            .links a {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 0.7rem 1.5rem;
                text-decoration: none;
                border-radius: 5px;
                margin: 0.5rem;
                transition: background 0.3s;
            }
            .links a:hover { background: #5a67d8; }
            .status { 
                background: #c6f6d5; 
                color: #22543d; 
                padding: 0.5rem 1rem; 
                border-radius: 20px; 
                display: inline-block;
                margin-bottom: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status">🟢 System Operational</div>
            <h1>🧠 ContextMind API</h1>
            <p class="subtitle">Real-time contextual targeting using multimodal AI</p>
            
            <div class="feature">
                <h3>⚡ Blazing Fast</h3>
                <p>Sub-10ms vector search across 10,000+ ad categories with multi-GPU acceleration</p>
            </div>
            
            <div class="feature">
                <h3>🎯 Multimodal AI</h3>
                <p>Analyzes text, images, and layout using CLIP and Sentence Transformers</p>
            </div>
            
            <div class="feature">
                <h3>🔒 Privacy-First</h3>
                <p>No cookies, tracking pixels, or persistent user data - just content analysis</p>
            </div>
            
            <div class="feature">
                <h3>📊 Production-Ready</h3>
                <p>Built for scale with comprehensive monitoring and error handling</p>
            </div>
            
            <div class="links">
                <a href="/docs">📚 Interactive API Docs</a>
                <a href="/redoc">📖 ReDoc Documentation</a>
                <a href="/api/v1/health">💓 System Health</a>
                <a href="/api/v1/performance">⚡ Performance Metrics</a>
            </div>
            
            <hr style="margin: 2rem 0;">
            
            <h3>🚀 Quick Start</h3>
            <pre style="background: #f7fafc; padding: 1rem; border-radius: 5px; overflow-x: auto;">
<strong>Analyze a URL:</strong>
curl -X POST "http://localhost:8000/api/v1/analyze" \\
     -H "Content-Type: application/json" \\
     -d '{"url": "https://example.com", "top_k": 5}'

<strong>Quick Demo:</strong>
curl "http://localhost:8000/api/v1/demo?url=https://example.com"
            </pre>
            
            <p style="margin-top: 2rem; text-align: center; color: #718096;">
                Open-source <strong>Contextual AI Platform</strong> | 
                <a href="https://github.com/contextmind/api" style="color: #667eea;">View Source</a>
            </p>
        </div>
    </body>
    </html>
    """)


# Health check endpoints (also available without /api/v1 prefix)
@app.get("/health", tags=["system"])
async def health():
    """Quick health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/ping", tags=["system"])
async def ping():
    """Simple ping endpoint"""
    return {"message": "pong", "timestamp": datetime.now().isoformat()}


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "global_exception",
            "suggestion": "Check /health endpoint for system status"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("🚀 ContextMind API starting up...")
    logger.info(f"🕐 Startup time: {datetime.now().isoformat()}")
    
    try:
        logger.info("🔧 Initializing ML pipeline...")
        # Import and initialize components
        from .core.pipeline import ContextMindPipeline
        
        # Create global pipeline instance
        app.state.pipeline = None  # Will be lazy-loaded
        logger.info("✅ ML pipeline ready for lazy initialization")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        logger.error("💡 Pipeline will be initialized on first request")
        app.state.pipeline = None
    
    logger.info("✅ ContextMind API startup complete!")


# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("🛑 ContextMind API shutting down...")
    logger.info(f"🕐 Shutdown time: {datetime.now().isoformat()}")
    
    try:
        # Cleanup pipeline if it exists
        if hasattr(app.state, 'pipeline') and app.state.pipeline is not None:
            logger.info("🧹 Cleaning up ML pipeline...")
            # Add any specific cleanup here if needed
            app.state.pipeline = None
            logger.info("✅ ML pipeline cleanup complete")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")
    
    logger.info("✅ ContextMind API shutdown complete!")


# CLI runner
def run_server(
    host: str = "0.0.0.0",
    port: int = 8000,
    reload: bool = False,
    workers: int = 1
):
    """Run the FastAPI server"""
    
    logger.info(f"🌟 Starting ContextMind API server")
    logger.info(f"🔗 Host: {host}:{port}")
    logger.info(f"🔄 Reload: {reload}")
    logger.info(f"👥 Workers: {workers}")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers if not reload else 1,  # Reload doesn't work with multiple workers
        log_level="info",
        access_log=True
    )


if __name__ == "__main__":
    # For development
    run_server(reload=True, workers=1) 