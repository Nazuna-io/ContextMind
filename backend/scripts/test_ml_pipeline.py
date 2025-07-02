#!/usr/bin/env python3
"""
Test ML Pipeline for ContextMind
Verify multi-GPU embedding generation and vector search performance
"""

import asyncio
import sys
import time
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.taxonomy import TaxonomyManager, AdCategory
from app.ml.embedders import MultiGPUEmbedder
from app.ml.vector_search import VectorSearchEngine, ContextualMatcher


async def test_ml_pipeline():
    """Test the complete ML pipeline"""
    
    print("🚀 TESTING CONTEXTMIND ML PIPELINE")
    print("=" * 50)
    
    try:
        # 1. Load taxonomy
        print("\n1️⃣ Loading Ad Taxonomy...")
        taxonomy_manager = TaxonomyManager()
        categories = await taxonomy_manager.load_taxonomy()
        
        if not categories:
            print("❌ No taxonomy found. Please run create_taxonomy.py first")
            return False
        
        print(f"✅ Loaded {len(categories)} categories")
        
        # 2. Initialize Multi-GPU Embedder
        print("\n2️⃣ Initializing Multi-GPU Embedder...")
        embedder = MultiGPUEmbedder()
        
        # 3. Generate category embeddings (subset for testing)
        print("\n3️⃣ Generating Category Embeddings...")
        test_categories = categories[:50]  # Test with first 50 categories
        category_dicts = [cat.to_dict() for cat in test_categories]
        
        start_time = time.time()
        category_embeddings = await embedder.embed_categories(category_dicts)
        embedding_time = time.time() - start_time
        
        print(f"✅ Generated {len(category_embeddings)} embeddings in {embedding_time:.2f}s")
        print(f"📊 Embedding dimension: {category_embeddings[0].shape}")
        
        # 4. Initialize Vector Search Engine
        print("\n4️⃣ Initializing Vector Search Engine...")
        search_engine = VectorSearchEngine()
        
        # 5. Load embeddings into ChromaDB
        print("\n5️⃣ Loading Embeddings into ChromaDB...")
        await search_engine.load_taxonomy_embeddings(test_categories, category_embeddings)
        
        # 6. Test search performance
        print("\n6️⃣ Testing Search Performance...")
        perf_stats = await search_engine.test_performance(num_queries=50)
        
        # 7. Test contextual matching
        print("\n7️⃣ Testing Contextual Matching...")
        matcher = ContextualMatcher(embedder, search_engine)
        
        test_queries = [
            "electric vehicle tesla sustainable transportation",
            "cooking recipes healthy food nutrition",
            "software development programming technology",
            "fitness exercise workout health",
            "investment banking financial services"
        ]
        
        for i, query in enumerate(test_queries):
            print(f"\n  Query {i+1}: '{query[:30]}...'")
            results, metrics = await matcher.find_matches(query, top_k=5)
            
            print(f"    Search time: {metrics.search_time_ms:.2f}ms")
            print(f"    Top matches:")
            for j, result in enumerate(results[:3]):
                print(f"      {j+1}. {result.category_name} ({result.confidence:.3f})")
        
        # 8. Performance Summary
        print("\n📊 PIPELINE PERFORMANCE SUMMARY")
        print("=" * 50)
        print(f"Categories processed: {len(test_categories)}")
        print(f"Embedding generation: {embedding_time:.2f}s")
        print(f"Average search time: {perf_stats['average_time_ms']:.2f}ms")
        print(f"Sub-10ms searches: {perf_stats['sub_10ms_percent']:.1f}%")
        print(f"Queries per second: {perf_stats['queries_per_second']:.1f}")
        
        # Check performance targets
        targets_met = {
            "sub_10ms_target": perf_stats['sub_10ms_percent'] > 80,
            "embedding_speed": embedding_time < 60,  # Should be under 1 minute for 50 categories
            "search_accuracy": len(results) > 0  # At least some results found
        }
        
        print(f"\n🎯 PERFORMANCE TARGETS")
        print("=" * 30)
        for target, met in targets_met.items():
            status = "✅" if met else "❌"
            print(f"{status} {target}: {'PASS' if met else 'FAIL'}")
        
        all_targets_met = all(targets_met.values())
        
        # 9. Cleanup
        print("\n9️⃣ Cleaning up...")
        embedder.cleanup()
        search_engine.cleanup()
        
        print(f"\n{'✅ ML Pipeline test PASSED' if all_targets_met else '❌ ML Pipeline test FAILED'}")
        return all_targets_met
        
    except Exception as e:
        print(f"❌ Error in ML pipeline test: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_simple_embedding():
    """Test basic embedding functionality without full pipeline"""
    
    print("\n🧪 SIMPLE EMBEDDING TEST")
    print("=" * 30)
    
    try:
        # Test with a single GPU if multi-GPU fails
        embedder = MultiGPUEmbedder(device_ids=[0])  # Use only GPU 0
        
        # Test simple text embedding
        test_text = "This is a test of the embedding system"
        embedding = await embedder.embed_text_only(test_text)
        
        print(f"✅ Generated embedding with shape: {embedding.shape}")
        print(f"✅ Embedding dimension: {len(embedding)}")
        print(f"✅ Embedding type: {type(embedding)}")
        
        embedder.cleanup()
        return True
        
    except Exception as e:
        print(f"❌ Simple embedding test failed: {e}")
        return False


if __name__ == "__main__":
    print("🔬 Starting ContextMind ML Pipeline Tests...")
    
    # Try full pipeline test first
    success = asyncio.run(test_ml_pipeline())
    
    if not success:
        print("\n⚠️ Full pipeline test failed. Trying simple embedding test...")
        success = asyncio.run(test_simple_embedding())
    
    sys.exit(0 if success else 1) 