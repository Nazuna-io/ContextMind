"""
End-to-End ML Pipeline for ContextMind
Integrates content extraction, embedding generation, and vector search
"""

import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
from pathlib import Path
import numpy as np

from ..services.content_extractor import ContentExtractor, ExtractionResult
from ..ml.embedders import MultiGPUEmbedder, ContentBundle, EmbeddingResult
from ..ml.vector_search import VectorSearchEngine, ContextualMatcher, SearchResult, SearchMetrics
from ..models.taxonomy import TaxonomyManager, AdCategory


@dataclass
class AnalysisResult:
    """Complete analysis result for a URL"""
    url: str
    success: bool
    
    # Content extraction
    title: str
    text_content: str
    num_images: int
    extraction_time: float
    
    # Embedding generation
    embedding_time: float
    embedding_dimension: int
    
    # Vector search
    top_categories: List[SearchResult]
    search_time_ms: float
    
    # Overall performance
    total_time: float
    
    # Error handling
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "url": self.url,
            "success": self.success,
            "title": self.title,
            "text_length": len(self.text_content),
            "num_images": self.num_images,
            "top_categories": [
                {
                    "category_id": cat.category_id,
                    "category_name": cat.category_name,
                    "confidence": cat.confidence,
                    "source": cat.source,
                    "keywords": cat.keywords
                } for cat in self.top_categories
            ],
            "performance": {
                "extraction_time": self.extraction_time,
                "embedding_time": self.embedding_time,
                "search_time_ms": self.search_time_ms,
                "total_time": self.total_time
            },
            "metadata": {
                "embedding_dimension": self.embedding_dimension,
                "text_length": len(self.text_content)
            },
            "error_message": self.error_message
        }


class ContextMindPipeline:
    """
    Complete end-to-end pipeline for contextual targeting
    URL → Content Extraction → Multimodal Embedding → Vector Search → Results
    """
    
    def __init__(self, 
                 device_ids: List[int] = [0, 1, 2, 3],
                 max_concurrent_extractions: int = 5):
        
        self.device_ids = device_ids
        self.max_concurrent_extractions = max_concurrent_extractions
        
        # Core components
        self.embedder: Optional[MultiGPUEmbedder] = None
        self.search_engine: Optional[VectorSearchEngine] = None
        self.content_extractor: Optional[ContentExtractor] = None
        self.matcher: Optional[ContextualMatcher] = None
        self.taxonomy_manager: Optional[TaxonomyManager] = None
        
        # State
        self.initialized = False
        self.categories_loaded = False
        
        print(f"🧠 Initializing ContextMind Pipeline")
        print(f"  • GPU devices: {device_ids}")
        print(f"  • Max concurrent extractions: {max_concurrent_extractions}")
    
    async def initialize(self):
        """Initialize all pipeline components"""
        
        if self.initialized:
            return
        
        print("🚀 Starting pipeline initialization...")
        start_time = time.time()
        
        try:
            # 1. Initialize Multi-GPU Embedder
            print("  1️⃣ Initializing Multi-GPU Embedder...")
            self.embedder = MultiGPUEmbedder(device_ids=self.device_ids)
            
            # 2. Initialize Vector Search Engine
            print("  2️⃣ Initializing Vector Search Engine...")
            self.search_engine = VectorSearchEngine()
            
            # 3. Initialize Content Extractor
            print("  3️⃣ Initializing Content Extractor...")
            self.content_extractor = ContentExtractor(
                max_concurrent=self.max_concurrent_extractions
            )
            await self.content_extractor.__aenter__()
            
            # 4. Create Contextual Matcher
            print("  4️⃣ Creating Contextual Matcher...")
            self.matcher = ContextualMatcher(self.embedder, self.search_engine)

            # 5. Initialize Taxonomy Manager
            print("  5️⃣ Initializing Taxonomy Manager...")
            self.taxonomy_manager = TaxonomyManager()
            
            # 6. Load ad categories if not already loaded
            await self._ensure_categories_loaded()
            
            self.initialized = True
            init_time = time.time() - start_time
            
            print(f"✅ Pipeline initialized in {init_time:.2f}s")
            print(f"📊 Ready for analysis!")
            
        except Exception as e:
            print(f"❌ Pipeline initialization failed: {e}")
            await self.cleanup()
            raise
    
    async def _ensure_categories_loaded(self):
        """Ensure ad categories are loaded in the vector search engine"""
        
        stats = self.search_engine.get_statistics()
        
        if stats.get("total_embeddings", 0) > 0:
            print(f"✅ Vector search already has {stats['total_embeddings']} category embeddings")
            self.categories_loaded = True
            return
        
        print("  📚 Loading ad taxonomy and generating embeddings...")
        
        # Load taxonomy
        categories = await self.taxonomy_manager.load_taxonomy()
        
        if not categories:
            raise RuntimeError("No ad categories found. Please run create_taxonomy.py first")
        
        # Generate embeddings for all categories
        category_dicts = [cat.to_dict() for cat in categories]
        category_embeddings = await self.embedder.embed_categories(category_dicts)
        
        # Load into vector search engine
        await self.search_engine.load_taxonomy_embeddings(categories, category_embeddings)
        
        self.categories_loaded = True
        print(f"✅ Loaded {len(categories)} category embeddings")
    
    async def analyze_url(self, url: str, top_k: int = 10) -> AnalysisResult:
        """
        Complete analysis pipeline for a single URL
        
        Args:
            url: URL to analyze
            top_k: Number of top categories to return
            
        Returns:
            AnalysisResult with complete analysis
        """
        
        if not self.initialized:
            await self.initialize()
        
        overall_start = time.time()
        
        try:
            print(f"🎯 Analyzing URL: {url}")
            
            # 1. Extract content
            extraction_start = time.time()
            extraction_result = await self.content_extractor.extract_content(url)
            extraction_time = time.time() - extraction_start
            
            if not extraction_result.success:
                return AnalysisResult(
                    url=url,
                    success=False,
                    title="",
                    text_content="",
                    num_images=0,
                    extraction_time=extraction_time,
                    embedding_time=0.0,
                    embedding_dimension=0,
                    top_categories=[],
                    search_time_ms=0.0,
                    total_time=time.time() - overall_start,
                    error_message=f"Content extraction failed: {extraction_result.error_message}"
                )
            
            # 2. Convert to content bundle
            content_bundle = self.content_extractor.to_content_bundle(extraction_result)
            
            # 3. Generate multimodal embedding
            embedding_start = time.time()
            embedding_result = await self.embedder.embed_content(content_bundle)
            embedding_time = time.time() - embedding_start
            
            # 4. Perform vector search
            search_results, search_metrics = await self.search_engine.search(
                embedding_result.fused_embedding, 
                top_k=top_k
            )
            
            total_time = time.time() - overall_start
            
            result = AnalysisResult(
                url=url,
                success=True,
                title=extraction_result.title,
                text_content=extraction_result.text,
                num_images=len(extraction_result.images),
                extraction_time=extraction_time,
                embedding_time=embedding_time,
                embedding_dimension=len(embedding_result.fused_embedding),
                top_categories=search_results,
                search_time_ms=search_metrics.search_time_ms,
                total_time=total_time
            )
            
            print(f"✅ Analysis completed in {total_time:.2f}s")
            print(f"  • Extraction: {extraction_time:.2f}s")
            print(f"  • Embedding: {embedding_time:.2f}s") 
            print(f"  • Search: {search_metrics.search_time_ms:.2f}ms")
            print(f"  • Top category: {search_results[0].category_name} ({search_results[0].confidence:.3f})")
            
            return result
            
        except Exception as e:
            total_time = time.time() - overall_start
            error_msg = str(e)
            
            print(f"❌ Analysis failed for {url}: {error_msg}")
            
            return AnalysisResult(
                url=url,
                success=False,
                title="",
                text_content="",
                num_images=0,
                extraction_time=0.0,
                embedding_time=0.0,
                embedding_dimension=0,
                top_categories=[],
                search_time_ms=0.0,
                total_time=total_time,
                error_message=error_msg
            )
    
    async def analyze_multiple_urls(self, urls: List[str], top_k: int = 10) -> List[AnalysisResult]:
        """
        Analyze multiple URLs with optimized batch processing
        
        Args:
            urls: List of URLs to analyze
            top_k: Number of top categories per URL
            
        Returns:
            List of AnalysisResult objects
        """
        
        if not self.initialized:
            await self.initialize()
        
        print(f"📊 Analyzing {len(urls)} URLs...")
        start_time = time.time()
        
        # Process URLs with limited concurrency
        semaphore = asyncio.Semaphore(self.max_concurrent_extractions)
        
        async def analyze_with_semaphore(url):
            async with semaphore:
                return await self.analyze_url(url, top_k)
        
        tasks = [analyze_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                error_result = AnalysisResult(
                    url=urls[i],
                    success=False,
                    title="",
                    text_content="",
                    num_images=0,
                    extraction_time=0.0,
                    embedding_time=0.0,
                    embedding_dimension=0,
                    top_categories=[],
                    search_time_ms=0.0,
                    total_time=0.0,
                    error_message=str(result)
                )
                final_results.append(error_result)
            else:
                final_results.append(result)
        
        total_time = time.time() - start_time
        successful = sum(1 for r in final_results if r.success)
        
        print(f"✅ Batch analysis completed in {total_time:.2f}s")
        print(f"📊 Success rate: {successful}/{len(urls)} ({successful/len(urls)*100:.1f}%)")
        
        return final_results
    
    async def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and statistics"""
        
        status = {
            "initialized": self.initialized,
            "categories_loaded": self.categories_loaded,
            "components": {
                "embedder": self.embedder is not None,
                "search_engine": self.search_engine is not None,
                "content_extractor": self.content_extractor is not None,
                "matcher": self.matcher is not None
            }
        }
        
        if self.search_engine:
            search_stats = self.search_engine.get_statistics()
            status["vector_search"] = search_stats
        
        return status
    
    async def benchmark_performance(self, test_urls: List[str] = None) -> Dict[str, Any]:
        """
        Run performance benchmarks on the pipeline
        
        Args:
            test_urls: Optional list of URLs to test with
            
        Returns:
            Performance benchmark results
        """
        
        if not self.initialized:
            await self.initialize()
        
        # Default test URLs if none provided
        if not test_urls:
            test_urls = [
                "https://example.com",  # Simple page
                "https://httpbin.org/html",  # Test page
            ]
        
        print(f"⏱️ Running performance benchmark with {len(test_urls)} URLs...")
        
        # Run vector search performance test
        search_perf = await self.search_engine.test_performance(num_queries=100)
        
        # Run end-to-end pipeline test if we have real URLs
        pipeline_results = []
        if test_urls and all(url.startswith('http') for url in test_urls):
            try:
                pipeline_results = await self.analyze_multiple_urls(test_urls[:2])  # Test with first 2 URLs
            except:
                pass  # Skip if URLs are not accessible
        
        benchmark = {
            "vector_search_performance": search_perf,
            "pipeline_tests": len(pipeline_results),
            "successful_analyses": sum(1 for r in pipeline_results if r.success),
            "average_total_time": np.mean([r.total_time for r in pipeline_results]) if pipeline_results else 0,
            "system_ready": self.initialized and self.categories_loaded
        }
        
        return benchmark
    
    async def cleanup(self):
        """Clean up all pipeline resources"""
        
        print("🧹 Cleaning up pipeline resources...")
        
        if self.embedder:
            self.embedder.cleanup()
        
        if self.search_engine:
            self.search_engine.cleanup()
        
        if self.content_extractor:
            await self.content_extractor.__aexit__(None, None, None)
        
        self.initialized = False
        self.categories_loaded = False
        
        print("✅ Pipeline cleanup completed") 