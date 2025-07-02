"""
ChromaDB Vector Search Engine for ContextMind
Optimized for sub-10ms search performance across 1000+ ad categories
"""

import chromadb
from chromadb.config import Settings
import numpy as np
import time
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import uuid
from dataclasses import dataclass

from ..models.taxonomy import AdCategory, TaxonomyManager


@dataclass
class SearchResult:
    """Result from vector similarity search"""
    category_id: str
    category_name: str
    description: str
    confidence: float
    source: str
    keywords: List[str]
    distance: float


@dataclass
class SearchMetrics:
    """Performance metrics for search operation"""
    search_time_ms: float
    num_results: int
    index_size: int
    query_embedding_dim: int


class VectorSearchEngine:
    """
    ChromaDB vector search engine optimized for real-time performance
    - Sub-10ms search response time
    - Persistent storage
    - Real ad taxonomy integration
    """
    
    def __init__(self, 
                 persist_directory: str = "./chroma_db",
                 collection_name: str = "ad_categories"):
        
        self.persist_directory = Path(persist_directory)
        self.collection_name = collection_name
        self.collection = None
        self.embedding_dim = 512  # From MultiGPUEmbedder
        
        print(f"🔍 Initializing Vector Search Engine")
        print(f"  • Persist directory: {self.persist_directory}")
        print(f"  • Collection: {collection_name}")
        
        self._initialize_chromadb()
    
    def _initialize_chromadb(self):
        """Initialize ChromaDB with persistence configuration"""
        
        # Ensure persist directory exists
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        # Create ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            count = self.collection.count()
            print(f"✅ Connected to existing collection with {count} embeddings")
            
        except ValueError:
            # Collection doesn't exist, create it
            print("📁 Creating new collection...")
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "ContextMind ad category embeddings", "hnsw:space": "cosine"}
            )
            print("✅ New collection created")
    
    async def load_taxonomy_embeddings(self, 
                                     categories: List[AdCategory], 
                                     embeddings: List[np.ndarray]):
        """
        Load ad taxonomy embeddings into ChromaDB
        
        Args:
            categories: List of AdCategory objects
            embeddings: Corresponding embeddings for each category
        """
        
        if len(categories) != len(embeddings):
            raise ValueError("Number of categories must match number of embeddings")
        
        print(f"💾 Loading {len(categories)} category embeddings into ChromaDB...")
        start_time = time.time()
        
        # Prepare data for batch insertion
        ids = []
        embeddings_list = []
        metadatas = []
        documents = []
        
        for category, embedding in zip(categories, embeddings):
            # Generate unique ID
            category_id = category.id
            ids.append(category_id)
            
            # Add embedding (convert to list for ChromaDB)
            embeddings_list.append(embedding.tolist())
            
            # Add metadata
            metadata = {
                "name": category.name,
                "description": category.description,
                "source": category.source,
                "level": category.level,
                "parent_id": category.parent_id or "",
                "keywords": ",".join(category.keywords)
            }
            metadatas.append(metadata)
            
            # Add document text (for potential text search)
            document = f"{category.name} {category.description} {' '.join(category.keywords)}"
            documents.append(document)
        
        # Batch insert into ChromaDB
        try:
            # Check if we need to reset collection
            current_count = self.collection.count()
            if current_count > 0:
                print(f"⚠️ Collection already has {current_count} items. Clearing...")
                self.client.delete_collection(self.collection_name)
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "ContextMind ad category embeddings"}
                )
            
            # Insert embeddings
            self.collection.add(
                ids=ids,
                embeddings=embeddings_list,
                metadatas=metadatas,
                documents=documents
            )
            
            load_time = time.time() - start_time
            print(f"✅ Loaded {len(categories)} embeddings in {load_time:.2f}s")
            
            # Verify the insertion
            final_count = self.collection.count()
            print(f"📊 Collection now contains {final_count} embeddings")
            
        except Exception as e:
            print(f"❌ Error loading embeddings: {e}")
            raise
    
    async def search(self, 
                    query_embedding: np.ndarray,
                    top_k: int = 10,
                    confidence_threshold: float = 0.0) -> Tuple[List[SearchResult], SearchMetrics]:
        """
        Perform vector similarity search
        
        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            confidence_threshold: Minimum confidence score
            
        Returns:
            Tuple of (search results, performance metrics)
        """
        
        if self.collection is None:
            raise RuntimeError("Vector search engine not initialized")
        
        start_time = time.perf_counter()
        
        # Perform similarity search
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        
        search_time_ms = (time.perf_counter() - start_time) * 1000
        
        # Parse results
        search_results = []
        
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                category_id = results['ids'][0][i]
                metadata = results['metadatas'][0][i]
                distance = results['distances'][0][i]
                
                # Convert distance to confidence 
                # ChromaDB cosine distance ranges from 0 (identical) to 2 (opposite)
                # Convert to similarity: similarity = 1 - (distance / 2)
                confidence = max(0.0, 1.0 - (distance / 2.0))
                
                # Filter by confidence threshold
                if confidence >= confidence_threshold:
                    result = SearchResult(
                        category_id=category_id,
                        category_name=metadata['name'],
                        description=metadata['description'],
                        confidence=confidence,
                        source=metadata['source'],
                        keywords=metadata['keywords'].split(',') if metadata['keywords'] else [],
                        distance=distance
                    )
                    search_results.append(result)
        
        # Create metrics
        metrics = SearchMetrics(
            search_time_ms=search_time_ms,
            num_results=len(search_results),
            index_size=self.collection.count(),
            query_embedding_dim=len(query_embedding)
        )
        
        return search_results, metrics
    
    async def batch_search(self, 
                          query_embeddings: List[np.ndarray],
                          top_k: int = 10) -> List[Tuple[List[SearchResult], SearchMetrics]]:
        """
        Perform batch vector similarity search
        
        Args:
            query_embeddings: List of query embedding vectors
            top_k: Number of results per query
            
        Returns:
            List of (search results, metrics) for each query
        """
        
        print(f"🔍 Performing batch search for {len(query_embeddings)} queries...")
        
        results = []
        total_start = time.time()
        
        for i, embedding in enumerate(query_embeddings):
            search_results, metrics = await self.search(embedding, top_k)
            results.append((search_results, metrics))
            
            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{len(query_embeddings)} queries")
        
        total_time = time.time() - total_start
        avg_time_ms = (total_time * 1000) / len(query_embeddings)
        
        print(f"✅ Batch search completed in {total_time:.2f}s")
        print(f"📊 Average search time: {avg_time_ms:.2f}ms per query")
        
        return results
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get collection statistics"""
        
        if self.collection is None:
            return {"error": "Collection not initialized"}
        
        count = self.collection.count()
        
        # Get sample of embeddings to check dimensions
        if count > 0:
            sample = self.collection.peek(limit=1)
            embedding_dim = len(sample['embeddings'][0]) if sample['embeddings'] else 0
        else:
            embedding_dim = 0
        
        return {
            "collection_name": self.collection_name,
            "total_embeddings": count,
            "embedding_dimension": embedding_dim,
            "persist_directory": str(self.persist_directory),
            "index_ready": count > 0
        }
    
    async def test_performance(self, num_queries: int = 100) -> Dict[str, float]:
        """
        Test search performance with random queries
        
        Args:
            num_queries: Number of test queries to run
            
        Returns:
            Performance statistics
        """
        
        if self.collection.count() == 0:
            raise RuntimeError("No embeddings in collection for performance testing")
        
        print(f"⏱️ Running performance test with {num_queries} queries...")
        
        # Generate random query embeddings
        query_embeddings = []
        for _ in range(num_queries):
            random_embedding = np.random.randn(self.embedding_dim).astype(np.float32)
            # Normalize
            random_embedding = random_embedding / np.linalg.norm(random_embedding)
            query_embeddings.append(random_embedding)
        
        # Measure search performance
        start_time = time.time()
        search_times = []
        
        for embedding in query_embeddings:
            query_start = time.perf_counter()
            _, metrics = await self.search(embedding, top_k=10)
            query_time = (time.perf_counter() - query_start) * 1000  # ms
            search_times.append(query_time)
        
        total_time = time.time() - start_time
        
        # Calculate statistics
        stats = {
            "total_queries": num_queries,
            "total_time_seconds": total_time,
            "average_time_ms": np.mean(search_times),
            "median_time_ms": np.median(search_times),
            "min_time_ms": np.min(search_times),
            "max_time_ms": np.max(search_times),
            "p95_time_ms": np.percentile(search_times, 95),
            "p99_time_ms": np.percentile(search_times, 99),
            "queries_per_second": num_queries / total_time,
            "sub_10ms_percent": (np.array(search_times) < 10.0).mean() * 100
        }
        
        print("📊 PERFORMANCE TEST RESULTS")
        print("=" * 40)
        print(f"Total Queries: {stats['total_queries']}")
        print(f"Average Time: {stats['average_time_ms']:.2f}ms")
        print(f"Median Time: {stats['median_time_ms']:.2f}ms")
        print(f"P95 Time: {stats['p95_time_ms']:.2f}ms")
        print(f"P99 Time: {stats['p99_time_ms']:.2f}ms")
        print(f"Sub-10ms %: {stats['sub_10ms_percent']:.1f}%")
        print(f"QPS: {stats['queries_per_second']:.1f}")
        
        return stats
    
    def cleanup(self):
        """Clean up resources"""
        if self.client:
            # ChromaDB automatically persists, no explicit cleanup needed
            print("🧹 Vector search engine cleaned up")


class ContextualMatcher:
    """
    High-level interface for contextual ad matching
    Combines embedding generation with vector search
    """
    
    def __init__(self, embedder, search_engine: VectorSearchEngine):
        self.embedder = embedder
        self.search_engine = search_engine
        
    async def find_matches(self, content_text: str, top_k: int = 10) -> Tuple[List[SearchResult], SearchMetrics]:
        """
        Find matching ad categories for content
        
        Args:
            content_text: Text content to analyze
            top_k: Number of matches to return
            
        Returns:
            Tuple of (search results, performance metrics)
        """
        
        # Generate embedding for content
        embedding = await self.embedder.embed_text_only(content_text)
        
        # Search for matches
        results, metrics = await self.search_engine.search(embedding, top_k)
        
        return results, metrics
    
    async def find_matches_multimodal(self, content_bundle, top_k: int = 10) -> Tuple[List[SearchResult], SearchMetrics]:
        """
        Find matching ad categories for multimodal content
        
        Args:
            content_bundle: ContentBundle with text and images
            top_k: Number of matches to return
            
        Returns:
            Tuple of (search results, performance metrics)
        """
        
        # Generate multimodal embedding
        embedding_result = await self.embedder.embed_content(content_bundle)
        
        # Search for matches using fused embedding
        results, metrics = await self.search_engine.search(embedding_result.fused_embedding, top_k)
        
        return results, metrics 