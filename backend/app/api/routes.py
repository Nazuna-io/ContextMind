"""
FastAPI routes for ContextMind Contextual Targeting API
Provides real-time contextual analysis endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Dict, Any
import time
import asyncio
from datetime import datetime

from ..core.pipeline import ContextMindPipeline, AnalysisResult


# Pydantic models for request/response
class URLAnalysisRequest(BaseModel):
    """Single URL analysis request"""
    url: HttpUrl = Field(..., description="URL to analyze for contextual targeting")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of top categories to return")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com/article",
                "top_k": 10
            }
        }


class BatchAnalysisRequest(BaseModel):
    """Batch URL analysis request"""
    urls: List[HttpUrl] = Field(..., min_items=1, max_items=20, description="List of URLs to analyze")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of top categories per URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "urls": [
                    "https://example.com/article1",
                    "https://example.com/article2"
                ],
                "top_k": 5
            }
        }


class CategoryInfo(BaseModel):
    """Ad category information"""
    category_id: str
    category_name: str
    confidence: float
    source: str
    keywords: List[str]


class AnalysisResponse(BaseModel):
    """Single URL analysis response"""
    url: str
    success: bool
    title: str
    text_length: int
    num_images: int
    top_categories: List[CategoryInfo]
    performance: Dict[str, float]
    metadata: Dict[str, Any]
    error_message: Optional[str] = None


class BatchAnalysisResponse(BaseModel):
    """Batch analysis response"""
    total_urls: int
    successful_analyses: int
    success_rate: float
    total_time: float
    results: List[AnalysisResponse]


class SystemStatusResponse(BaseModel):
    """System status response"""
    status: str
    initialized: bool
    categories_loaded: bool
    components: Dict[str, bool]
    vector_search: Optional[Dict[str, Any]] = None
    timestamp: datetime


class PerformanceMetrics(BaseModel):
    """Performance metrics response"""
    vector_search_performance: Dict[str, float]
    system_ready: bool
    timestamp: datetime


# Global pipeline instance
pipeline: Optional[ContextMindPipeline] = None


# Initialize router
router = APIRouter()


@router.on_event("startup")
async def startup_event():
    """Initialize the pipeline on startup"""
    global pipeline
    if pipeline is None:
        pipeline = ContextMindPipeline()
        await pipeline.initialize()


@router.on_event("shutdown")
async def shutdown_event():
    """Cleanup the pipeline on shutdown"""
    global pipeline
    if pipeline:
        await pipeline.cleanup()


@router.get("/", summary="API Health Check")
async def root():
    """Basic health check endpoint"""
    return {
        "message": "ContextMind Contextual Targeting API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health", summary="Detailed Health Check", response_model=SystemStatusResponse)
async def health_check():
    """
    Detailed health check with system status
    """
    global pipeline
    
    if not pipeline:
        return SystemStatusResponse(
            status="initializing",
            initialized=False,
            categories_loaded=False,
            components={},
            timestamp=datetime.now()
        )
    
    try:
        status = await pipeline.get_pipeline_status()
        
        return SystemStatusResponse(
            status="healthy" if status["initialized"] else "initializing",
            initialized=status["initialized"],
            categories_loaded=status["categories_loaded"],
            components=status["components"],
            vector_search=status.get("vector_search"),
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.post("/analyze", summary="Analyze Single URL", response_model=AnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze a single URL for contextual targeting
    
    Returns the top contextual categories with confidence scores
    """
    global pipeline
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        result = await pipeline.analyze_url(str(request.url), top_k=request.top_k)
        
        # Convert to response format
        response_data = result.to_dict()
        
        return AnalysisResponse(
            url=response_data["url"],
            success=response_data["success"],
            title=response_data["title"],
            text_length=response_data["text_length"],
            num_images=response_data["num_images"],
            top_categories=[
                CategoryInfo(
                    category_id=cat["category_id"],
                    category_name=cat["category_name"],
                    confidence=cat["confidence"],
                    source=cat["source"],
                    keywords=cat["keywords"]
                ) for cat in response_data["top_categories"]
            ],
            performance=response_data["performance"],
            metadata=response_data["metadata"],
            error_message=response_data["error_message"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/batch", summary="Analyze Multiple URLs", response_model=BatchAnalysisResponse)
async def analyze_batch(request: BatchAnalysisRequest):
    """
    Analyze multiple URLs in batch for contextual targeting
    
    Processes URLs concurrently for optimal performance
    """
    global pipeline
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        start_time = time.time()
        
        # Convert URLs to strings
        url_strings = [str(url) for url in request.urls]
        
        # Analyze batch
        results = await pipeline.analyze_multiple_urls(url_strings, top_k=request.top_k)
        
        total_time = time.time() - start_time
        successful = sum(1 for r in results if r.success)
        
        # Convert results to response format
        response_results = []
        for result in results:
            result_data = result.to_dict()
            response_results.append(
                AnalysisResponse(
                    url=result_data["url"],
                    success=result_data["success"],
                    title=result_data["title"],
                    text_length=result_data["text_length"],
                    num_images=result_data["num_images"],
                    top_categories=[
                        CategoryInfo(
                            category_id=cat["category_id"],
                            category_name=cat["category_name"],
                            confidence=cat["confidence"],
                            source=cat["source"],
                            keywords=cat["keywords"]
                        ) for cat in result_data["top_categories"]
                    ],
                    performance=result_data["performance"],
                    metadata=result_data["metadata"],
                    error_message=result_data["error_message"]
                )
            )
        
        return BatchAnalysisResponse(
            total_urls=len(request.urls),
            successful_analyses=successful,
            success_rate=successful / len(request.urls),
            total_time=total_time,
            results=response_results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@router.get("/categories", summary="List Available Categories")
async def list_categories(
    source: Optional[str] = Query(None, description="Filter by category source (iab, google, facebook)"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Limit number of categories returned")
):
    """
    List all available ad categories in the system
    """
    global pipeline
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        # Get vector search statistics to confirm categories are loaded
        status = await pipeline.get_pipeline_status()
        
        if not status.get("categories_loaded", False):
            raise HTTPException(status_code=503, detail="Categories not loaded")
        
        # For now, return basic category info
        # In a full implementation, you'd query the taxonomy manager
        vector_stats = status.get("vector_search", {})
        
        return {
            "total_categories": vector_stats.get("total_embeddings", 0),
            "sources": ["iab", "google", "facebook"],
            "message": "Use /analyze endpoint to get contextual categories for your content",
            "filters_applied": {
                "source": source,
                "limit": limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve categories: {str(e)}")


@router.get("/performance", summary="Performance Metrics", response_model=PerformanceMetrics)
async def get_performance_metrics():
    """
    Get current system performance metrics
    """
    global pipeline
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        benchmark = await pipeline.benchmark_performance()
        
        return PerformanceMetrics(
            vector_search_performance=benchmark["vector_search_performance"],
            system_ready=benchmark["system_ready"],
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance metrics failed: {str(e)}")


@router.post("/demo", summary="Quick Demo Analysis")
async def demo_analysis(
    url: HttpUrl = Query(..., description="URL to analyze for demo"),
    background_tasks: BackgroundTasks = None
):
    """
    Quick demo analysis endpoint for testing
    
    Analyzes a URL and returns top 5 categories for demo purposes
    """
    global pipeline
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    try:
        # Quick analysis with top 5 categories
        result = await pipeline.analyze_url(str(url), top_k=5)
        
        if result.success:
            return {
                "url": result.url,
                "title": result.title,
                "top_categories": [
                    {
                        "name": cat.category_name,
                        "confidence": round(cat.confidence, 3),
                        "source": cat.source
                    } for cat in result.top_categories
                ],
                "performance": {
                    "total_time": round(result.total_time, 2),
                    "search_time_ms": round(result.search_time_ms, 2)
                },
                "demo": True
            }
        else:
            return {
                "url": result.url,
                "error": result.error_message,
                "success": False,
                "demo": True
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo analysis failed: {str(e)}")


# Note: Exception handlers are defined in main.py since they need to be on the FastAPI app 