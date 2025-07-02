#!/usr/bin/env python3
"""
API Test Script for ContextMind
Tests all FastAPI endpoints with real requests
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))


class ContextMindAPITester:
    """Test client for ContextMind API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_ping(self) -> Dict[str, Any]:
        """Test basic ping endpoint"""
        print("🔍 Testing ping endpoint...")
        
        try:
            async with self.session.get(f"{self.base_url}/ping") as response:
                data = await response.json()
                print(f"✅ Ping successful: {data['message']}")
                return {"success": True, "data": data}
        except Exception as e:
            print(f"❌ Ping failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_health(self) -> Dict[str, Any]:
        """Test health check endpoint"""
        print("\n🩺 Testing health check...")
        
        try:
            async with self.session.get(f"{self.base_url}/api/v1/health") as response:
                data = await response.json()
                print(f"✅ Health check successful")
                print(f"  • Status: {data['status']}")
                print(f"  • Initialized: {data['initialized']}")
                print(f"  • Categories loaded: {data['categories_loaded']}")
                return {"success": True, "data": data}
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_single_analysis(self) -> Dict[str, Any]:
        """Test single URL analysis"""
        print("\n🎯 Testing single URL analysis...")
        
        test_data = {
            "url": "https://httpbin.org/html",
            "top_k": 5
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/api/v1/analyze",
                json=test_data
            ) as response:
                data = await response.json()
                total_time = time.time() - start_time
                
                if response.status == 200 and data["success"]:
                    print(f"✅ Analysis successful in {total_time:.2f}s")
                    print(f"  • URL: {data['url']}")
                    print(f"  • Title: {data['title'][:50]}...")
                    print(f"  • Text length: {data['text_length']}")
                    print(f"  • Top categories:")
                    for i, cat in enumerate(data['top_categories'][:3], 1):
                        print(f"    {i}. {cat['category_name']} ({cat['confidence']:.3f})")
                    print(f"  • Performance:")
                    perf = data['performance']
                    print(f"    - Total: {perf['total_time']:.2f}s")
                    print(f"    - Search: {perf['search_time_ms']:.2f}ms")
                    return {"success": True, "data": data, "total_time": total_time}
                else:
                    print(f"❌ Analysis failed: {data.get('error_message', 'Unknown error')}")
                    return {"success": False, "error": data.get('error_message', 'Unknown error')}
                    
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_batch_analysis(self) -> Dict[str, Any]:
        """Test batch URL analysis"""
        print("\n📊 Testing batch URL analysis...")
        
        test_data = {
            "urls": [
                "https://httpbin.org/html",
                "https://example.com"
            ],
            "top_k": 3
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/api/v1/analyze/batch",
                json=test_data
            ) as response:
                data = await response.json()
                total_time = time.time() - start_time
                
                if response.status == 200:
                    print(f"✅ Batch analysis successful in {total_time:.2f}s")
                    print(f"  • Total URLs: {data['total_urls']}")
                    print(f"  • Successful: {data['successful_analyses']}")
                    print(f"  • Success rate: {data['success_rate']*100:.1f}%")
                    print(f"  • Results:")
                    for i, result in enumerate(data['results'], 1):
                        print(f"    {i}. {result['url']}")
                        print(f"       Success: {result['success']}")
                        if result['success'] and result['top_categories']:
                            print(f"       Top: {result['top_categories'][0]['category_name']}")
                    return {"success": True, "data": data, "total_time": total_time}
                else:
                    print(f"❌ Batch analysis failed: {response.status}")
                    return {"success": False, "error": f"HTTP {response.status}"}
                    
        except Exception as e:
            print(f"❌ Batch analysis failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_demo_endpoint(self) -> Dict[str, Any]:
        """Test quick demo endpoint"""
        print("\n🚀 Testing demo endpoint...")
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/v1/demo?url=https://example.com"
            ) as response:
                data = await response.json()
                
                if response.status == 200 and data.get("demo"):
                    print(f"✅ Demo successful")
                    print(f"  • URL: {data['url']}")
                    print(f"  • Title: {data['title']}")
                    print(f"  • Top categories:")
                    for i, cat in enumerate(data['top_categories'], 1):
                        print(f"    {i}. {cat['name']} ({cat['confidence']:.3f})")
                    return {"success": True, "data": data}
                else:
                    print(f"❌ Demo failed: {data.get('error', 'Unknown error')}")
                    return {"success": False, "error": data.get('error', 'Unknown error')}
                    
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_categories_endpoint(self) -> Dict[str, Any]:
        """Test categories listing endpoint"""
        print("\n📚 Testing categories endpoint...")
        
        try:
            async with self.session.get(f"{self.base_url}/api/v1/categories") as response:
                data = await response.json()
                
                if response.status == 200:
                    print(f"✅ Categories endpoint successful")
                    print(f"  • Total categories: {data['total_categories']}")
                    print(f"  • Sources: {', '.join(data['sources'])}")
                    return {"success": True, "data": data}
                else:
                    print(f"❌ Categories failed: {response.status}")
                    return {"success": False, "error": f"HTTP {response.status}"}
                    
        except Exception as e:
            print(f"❌ Categories failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_performance_endpoint(self) -> Dict[str, Any]:
        """Test performance metrics endpoint"""
        print("\n⚡ Testing performance endpoint...")
        
        try:
            async with self.session.get(f"{self.base_url}/api/v1/performance") as response:
                data = await response.json()
                
                if response.status == 200:
                    print(f"✅ Performance metrics successful")
                    vs_perf = data['vector_search_performance']
                    print(f"  • Average search time: {vs_perf['average_time_ms']:.2f}ms")
                    print(f"  • Queries per second: {vs_perf['queries_per_second']:.1f}")
                    print(f"  • Sub-10ms queries: {vs_perf['sub_10ms_percentage']:.1f}%")
                    print(f"  • System ready: {data['system_ready']}")
                    return {"success": True, "data": data}
                else:
                    print(f"❌ Performance failed: {response.status}")
                    return {"success": False, "error": f"HTTP {response.status}"}
                    
        except Exception as e:
            print(f"❌ Performance failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_root_page(self) -> Dict[str, Any]:
        """Test root landing page"""
        print("\n🏠 Testing root page...")
        
        try:
            async with self.session.get(f"{self.base_url}/") as response:
                text = await response.text()
                
                if response.status == 200 and "ContextMind API" in text:
                    print(f"✅ Root page successful")
                    print(f"  • HTML length: {len(text)} chars")
                    return {"success": True, "html_length": len(text)}
                else:
                    print(f"❌ Root page failed: {response.status}")
                    return {"success": False, "error": f"HTTP {response.status}"}
                    
        except Exception as e:
            print(f"❌ Root page failed: {e}")
            return {"success": False, "error": str(e)}


async def run_all_tests():
    """Run comprehensive API tests"""
    
    print("🧪 ContextMind API Tests")
    print("=" * 50)
    
    async with ContextMindAPITester() as tester:
        
        # Store all results
        results = []
        
        # Test basic connectivity
        ping_result = await tester.test_ping()
        results.append(("ping", ping_result))
        
        if not ping_result["success"]:
            print("\n❌ Server not responding. Make sure it's running on localhost:8000")
            return
        
        # Test all endpoints
        test_functions = [
            ("health", tester.test_health),
            ("root_page", tester.test_root_page),
            ("categories", tester.test_categories_endpoint),
            ("performance", tester.test_performance_endpoint),
            ("demo", tester.test_demo_endpoint),
            ("single_analysis", tester.test_single_analysis),
            ("batch_analysis", tester.test_batch_analysis),
        ]
        
        for test_name, test_func in test_functions:
            try:
                result = await test_func()
                results.append((test_name, result))
                # Small delay between tests
                await asyncio.sleep(1)
            except Exception as e:
                print(f"❌ Test {test_name} failed with exception: {e}")
                results.append((test_name, {"success": False, "error": str(e)}))
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Results Summary")
        print("-" * 50)
        
        total_tests = len(results)
        successful_tests = sum(1 for _, result in results if result["success"])
        
        for test_name, result in results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print("-" * 50)
        print(f"Total tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Success rate: {successful_tests/total_tests*100:.1f}%")
        
        if successful_tests == total_tests:
            print("\n🎉 All API tests passed! The ContextMind API is fully operational.")
        else:
            print(f"\n⚠️  {total_tests - successful_tests} tests failed. Check the logs above.")
        
        return results


def main():
    """Main function to run API tests"""
    
    print("🚀 Starting ContextMind API Tests")
    print("Make sure the server is running: python run_server.py --dev")
    print()
    
    try:
        results = asyncio.run(run_all_tests())
        
        # Save results to file
        output_file = Path(__file__).parent / "api_test_results.json"
        with open(output_file, 'w') as f:
            json.dump({
                "timestamp": time.time(),
                "results": {name: result for name, result in results}
            }, f, indent=2)
        
        print(f"\n💾 Results saved to: {output_file}")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Tests failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 