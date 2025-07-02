#!/usr/bin/env python3
"""
Test script for the complete ContextMind pipeline
Tests end-to-end URL analysis functionality
"""

import asyncio
import json
import time
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.core.pipeline import ContextMindPipeline, AnalysisResult


async def test_single_url():
    """Test analyzing a single URL"""
    
    print("🧪 Testing single URL analysis...")
    
    pipeline = ContextMindPipeline()
    
    try:
        # Test with a simple, reliable URL
        test_url = "https://httpbin.org/html"
        
        result = await pipeline.analyze_url(test_url, top_k=5)
        
        print(f"\n📊 Analysis Results:")
        print(f"  • URL: {result.url}")
        print(f"  • Success: {result.success}")
        print(f"  • Title: {result.title}")
        print(f"  • Text Length: {len(result.text_content)}")
        print(f"  • Images: {result.num_images}")
        print(f"  • Total Time: {result.total_time:.2f}s")
        
        if result.success:
            print(f"\n🎯 Top 5 Categories:")
            for i, cat in enumerate(result.top_categories, 1):
                print(f"  {i}. {cat.category_name} ({cat.confidence:.3f}) - {cat.source}")
        
        if result.error_message:
            print(f"❌ Error: {result.error_message}")
        
        return result
        
    finally:
        await pipeline.cleanup()


async def test_multiple_urls():
    """Test analyzing multiple URLs"""
    
    print("\n🧪 Testing multiple URL analysis...")
    
    pipeline = ContextMindPipeline()
    
    try:
        # Test URLs that should be accessible
        test_urls = [
            "https://httpbin.org/html",
            "https://example.com",
            "https://httpbin.org/robots.txt"
        ]
        
        results = await pipeline.analyze_multiple_urls(test_urls, top_k=3)
        
        print(f"\n📊 Batch Analysis Results:")
        successful = sum(1 for r in results if r.success)
        print(f"  • Total URLs: {len(test_urls)}")
        print(f"  • Successful: {successful}")
        print(f"  • Success Rate: {successful/len(test_urls)*100:.1f}%")
        
        for i, result in enumerate(results, 1):
            print(f"\n  {i}. {result.url}")
            print(f"     Success: {result.success}")
            if result.success:
                print(f"     Title: {result.title[:50]}...")
                print(f"     Time: {result.total_time:.2f}s")
                if result.top_categories:
                    print(f"     Top Category: {result.top_categories[0].category_name}")
            else:
                print(f"     Error: {result.error_message}")
        
        return results
        
    finally:
        await pipeline.cleanup()


async def test_pipeline_status():
    """Test pipeline status and statistics"""
    
    print("\n🧪 Testing pipeline status...")
    
    pipeline = ContextMindPipeline()
    
    try:
        # Check status before initialization
        status_before = await pipeline.get_pipeline_status()
        print(f"📊 Status before initialization:")
        print(f"  • Initialized: {status_before['initialized']}")
        print(f"  • Categories loaded: {status_before['categories_loaded']}")
        
        # Initialize pipeline
        await pipeline.initialize()
        
        # Check status after initialization
        status_after = await pipeline.get_pipeline_status()
        print(f"\n📊 Status after initialization:")
        print(f"  • Initialized: {status_after['initialized']}")
        print(f"  • Categories loaded: {status_after['categories_loaded']}")
        
        if 'vector_search' in status_after:
            vs_stats = status_after['vector_search']
            print(f"  • Vector search embeddings: {vs_stats.get('total_embeddings', 0)}")
            print(f"  • Collections: {vs_stats.get('collections', 0)}")
        
        return status_after
        
    finally:
        await pipeline.cleanup()


async def test_performance_benchmark():
    """Test pipeline performance benchmarks"""
    
    print("\n🧪 Testing performance benchmarks...")
    
    pipeline = ContextMindPipeline()
    
    try:
        # Run benchmark
        benchmark = await pipeline.benchmark_performance()
        
        print(f"📊 Performance Benchmark Results:")
        
        if 'vector_search_performance' in benchmark:
            vs_perf = benchmark['vector_search_performance']
            print(f"  • Vector Search:")
            print(f"    - Average time: {vs_perf.get('average_time_ms', 0):.2f}ms")
            print(f"    - Queries per second: {vs_perf.get('queries_per_second', 0):.1f}")
            print(f"    - Sub-10ms queries: {vs_perf.get('sub_10ms_percentage', 0):.1f}%")
        
        print(f"  • System ready: {benchmark.get('system_ready', False)}")
        
        return benchmark
        
    finally:
        await pipeline.cleanup()


async def test_error_handling():
    """Test pipeline error handling with invalid URLs"""
    
    print("\n🧪 Testing error handling...")
    
    pipeline = ContextMindPipeline()
    
    try:
        # Test with invalid URLs
        invalid_urls = [
            "not-a-url",
            "https://this-domain-does-not-exist-12345.com",
            "https://httpbin.org/status/404"
        ]
        
        results = await pipeline.analyze_multiple_urls(invalid_urls, top_k=3)
        
        print(f"📊 Error Handling Results:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result.url}")
            print(f"     Success: {result.success}")
            if not result.success:
                print(f"     Error: {result.error_message}")
        
        return results
        
    finally:
        await pipeline.cleanup()


async def save_results(results, filename: str):
    """Save test results to JSON file"""
    
    results_data = []
    for result in results:
        if hasattr(result, 'to_dict'):
            results_data.append(result.to_dict())
        else:
            results_data.append(str(result))
    
    output_file = Path(__file__).parent / filename
    
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": time.time(),
            "results": results_data
        }, f, indent=2)
    
    print(f"💾 Results saved to: {output_file}")


async def main():
    """Run all pipeline tests"""
    
    print("🚀 ContextMind Pipeline Tests")
    print("=" * 50)
    
    all_results = []
    
    try:
        # Test 1: Single URL
        result1 = await test_single_url()
        all_results.append(result1)
        
        # Test 2: Multiple URLs
        results2 = await test_multiple_urls()
        all_results.extend(results2)
        
        # Test 3: Pipeline Status
        status = await test_pipeline_status()
        
        # Test 4: Performance Benchmark
        benchmark = await test_performance_benchmark()
        
        # Test 5: Error Handling
        error_results = await test_error_handling()
        all_results.extend(error_results)
        
        # Save results
        await save_results(all_results, "pipeline_test_results.json")
        
        print("\n" + "=" * 50)
        print("✅ All pipeline tests completed successfully!")
        
        # Summary
        total_tests = len(all_results)
        successful_tests = sum(1 for r in all_results if r.success)
        
        print(f"📊 Test Summary:")
        print(f"  • Total tests: {total_tests}")
        print(f"  • Successful: {successful_tests}")
        print(f"  • Success rate: {successful_tests/total_tests*100:.1f}%")
        
    except Exception as e:
        print(f"\n❌ Pipeline tests failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 