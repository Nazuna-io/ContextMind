"""
Content Extraction Pipeline for ContextMind
Robust web scraping with Playwright, parallel processing, and image downloading
"""

import asyncio
from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
import aiohttp
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse
from PIL import Image
import io
import cv2
import numpy as np

from ..ml.embedders import ContentBundle


@dataclass
class ExtractionResult:
    """Result from content extraction"""
    url: str
    title: str
    text: str
    images: List[Image.Image]
    image_urls: List[str]
    metadata: Dict[str, Any]
    extraction_time: float
    success: bool
    error_message: Optional[str] = None


class ContentExtractor:
    """
    Robust content extraction using Playwright
    - Parallel processing across 16 CPU cores
    - Image downloading and processing pipeline
    - Layout analysis and metadata extraction
    - Error handling for failed extractions
    """
    
    def __init__(self, 
                 max_concurrent: int = 16,
                 timeout: int = 30000,
                 max_images: int = 10):
        
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self.max_images = max_images
        self.browser = None
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        print(f"🌐 Initializing Content Extractor")
        print(f"  • Max concurrent: {max_concurrent}")
        print(f"  • Timeout: {timeout}ms")
        print(f"  • Max images: {max_images}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._cleanup_browser()
    
    async def _initialize_browser(self):
        """Initialize Playwright browser"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',  # We'll handle images separately
            ]
        )
        print("✅ Browser initialized")
    
    async def _cleanup_browser(self):
        """Clean up browser resources"""
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        print("🧹 Browser cleaned up")
    
    async def extract_content(self, url: str) -> ExtractionResult:
        """
        Extract content from a single URL
        
        Args:
            url: URL to extract content from
            
        Returns:
            ExtractionResult with extracted content
        """
        
        async with self.semaphore:
            return await self._extract_single_url(url)
    
    async def _extract_single_url(self, url: str) -> ExtractionResult:
        """Extract content from a single URL with error handling"""
        
        start_time = time.time()
        
        try:
            print(f"🔄 Extracting content from: {url}")
            
            # Create new page for this extraction
            page = await self.browser.new_page()
            
            try:
                # Configure page
                await page.set_viewport_size({"width": 1920, "height": 1080})
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                # Navigate to page
                response = await page.goto(url, timeout=self.timeout, wait_until='domcontentloaded')
                
                if not response or response.status >= 400:
                    raise Exception(f"HTTP {response.status if response else 'No response'}")
                
                # Wait for content to load
                try:
                    await page.wait_for_load_state('networkidle', timeout=10000)
                except:
                    # Continue if networkidle timeout, content might still be available
                    pass
                
                # Extract text content
                text_content = await self._extract_text(page)
                
                # Extract title
                title = await self._extract_title(page)
                
                # Extract image URLs
                image_urls = await self._extract_image_urls(page, url)
                
                # Extract metadata
                metadata = await self._extract_metadata(page)
                
                extraction_time = time.time() - start_time
                
                # Download and process images
                images = await self._download_images(image_urls[:self.max_images])
                
                result = ExtractionResult(
                    url=url,
                    title=title,
                    text=text_content,
                    images=images,
                    image_urls=image_urls[:self.max_images],
                    metadata=metadata,
                    extraction_time=extraction_time,
                    success=True
                )
                
                print(f"✅ Extracted content in {extraction_time:.2f}s")
                print(f"  • Text: {len(text_content)} chars")
                print(f"  • Images: {len(images)} downloaded")
                
                return result
                
            finally:
                await page.close()
                
        except Exception as e:
            extraction_time = time.time() - start_time
            error_msg = str(e)
            
            print(f"❌ Extraction failed for {url}: {error_msg}")
            
            return ExtractionResult(
                url=url,
                title="",
                text="",
                images=[],
                image_urls=[],
                metadata={},
                extraction_time=extraction_time,
                success=False,
                error_message=error_msg
            )
    
    async def _extract_text(self, page: Page) -> str:
        """Extract clean text content from page"""
        
        # Remove unwanted elements
        await page.evaluate("""
            () => {
                // Remove scripts, styles, ads, navigation
                const selectors = [
                    'script', 'style', 'nav', 'header', 'footer',
                    '.ad', '.advertisement', '.sidebar', '.menu',
                    '[class*="ad-"]', '[id*="ad-"]', '[class*="sidebar"]',
                    '.social-media', '.comments', '.related-articles'
                ];
                
                selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => el.remove());
                });
            }
        """)
        
        # Extract main content
        content_selectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '.post-content',
            '.article-content',
            'body'
        ]
        
        text_content = ""
        
        for selector in content_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    if len(text) > len(text_content):
                        text_content = text
                    break
            except:
                continue
        
        # Clean up text
        text_content = self._clean_text(text_content)
        
        return text_content
    
    async def _extract_title(self, page: Page) -> str:
        """Extract page title"""
        try:
            title = await page.title()
            return title.strip() if title else ""
        except:
            return ""
    
    async def _extract_image_urls(self, page: Page, base_url: str) -> List[str]:
        """Extract image URLs from page"""
        
        try:
            # Get all img tags with src
            img_elements = await page.query_selector_all('img[src]')
            
            image_urls = []
            for img in img_elements:
                try:
                    src = await img.get_attribute('src')
                    if src:
                        # Convert relative URLs to absolute
                        absolute_url = urljoin(base_url, src)
                        
                        # Filter out small images, icons, etc.
                        if self._is_valid_image_url(absolute_url):
                            image_urls.append(absolute_url)
                except:
                    continue
            
            # Also check for picture elements and data-src attributes
            picture_elements = await page.query_selector_all('picture img, img[data-src]')
            for img in picture_elements:
                try:
                    src = await img.get_attribute('data-src') or await img.get_attribute('src')
                    if src:
                        absolute_url = urljoin(base_url, src)
                        if self._is_valid_image_url(absolute_url):
                            image_urls.append(absolute_url)
                except:
                    continue
            
            # Remove duplicates while preserving order
            unique_urls = []
            seen = set()
            for url in image_urls:
                if url not in seen:
                    unique_urls.append(url)
                    seen.add(url)
            
            return unique_urls[:self.max_images * 2]  # Get extra URLs in case some fail
            
        except Exception as e:
            print(f"⚠️ Error extracting image URLs: {e}")
            return []
    
    async def _extract_metadata(self, page: Page) -> Dict[str, Any]:
        """Extract page metadata"""
        
        metadata = {}
        
        try:
            # Extract meta tags
            meta_tags = await page.query_selector_all('meta')
            
            for meta in meta_tags:
                try:
                    name = await meta.get_attribute('name')
                    property_attr = await meta.get_attribute('property')
                    content = await meta.get_attribute('content')
                    
                    if content:
                        if name:
                            metadata[f"meta_{name}"] = content
                        elif property_attr:
                            metadata[f"meta_{property_attr}"] = content
                except:
                    continue
            
            # Extract language
            try:
                lang = await page.get_attribute('html', 'lang')
                if lang:
                    metadata['language'] = lang
            except:
                pass
            
            # Extract page structure info
            try:
                h1_count = len(await page.query_selector_all('h1'))
                h2_count = len(await page.query_selector_all('h2'))
                p_count = len(await page.query_selector_all('p'))
                img_count = len(await page.query_selector_all('img'))
                
                metadata['structure'] = {
                    'h1_count': h1_count,
                    'h2_count': h2_count,
                    'paragraph_count': p_count,
                    'image_count': img_count
                }
            except:
                pass
            
        except Exception as e:
            print(f"⚠️ Error extracting metadata: {e}")
        
        return metadata
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL points to a valid image"""
        
        # Skip data URLs, SVGs, and small images
        if url.startswith('data:') or '.svg' in url.lower():
            return False
        
        # Skip common icon/small image patterns
        skip_patterns = [
            'icon', 'favicon', 'logo', 'avatar', 'thumb',
            'pixel', '1x1', 'spacer', 'clear'
        ]
        
        url_lower = url.lower()
        for pattern in skip_patterns:
            if pattern in url_lower:
                return False
        
        # Check for image file extensions
        image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        has_image_ext = any(ext in url_lower for ext in image_extensions)
        
        return has_image_ext or 'image' in url_lower
    
    async def _download_images(self, image_urls: List[str]) -> List[Image.Image]:
        """Download and process images"""
        
        if not image_urls:
            return []
        
        print(f"⬇️ Downloading {len(image_urls)} images...")
        
        images = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            tasks = [self._download_single_image(session, url) for url in image_urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Image.Image):
                    images.append(result)
        
        print(f"✅ Downloaded {len(images)} images successfully")
        return images
    
    async def _download_single_image(self, session: aiohttp.ClientSession, url: str) -> Optional[Image.Image]:
        """Download and process a single image"""
        
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    
                    # Convert to PIL Image
                    image = Image.open(io.BytesIO(content))
                    
                    # Convert to RGB if needed
                    if image.mode not in ['RGB', 'RGBA']:
                        image = image.convert('RGB')
                    
                    # Skip very small images
                    if image.width < 100 or image.height < 100:
                        return None
                    
                    # Resize if too large (for memory efficiency)
                    max_size = 1024
                    if image.width > max_size or image.height > max_size:
                        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    
                    return image
                    
        except Exception as e:
            print(f"⚠️ Failed to download image {url}: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text content"""
        
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common boilerplate
        patterns_to_remove = [
            r'Cookie policy.*',
            r'Privacy policy.*',
            r'Accept cookies.*',
            r'Subscribe to.*newsletter.*',
            r'Sign up.*',
            r'Follow us.*',
        ]
        
        for pattern in patterns_to_remove:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    async def extract_multiple(self, urls: List[str]) -> List[ExtractionResult]:
        """
        Extract content from multiple URLs in parallel
        
        Args:
            urls: List of URLs to extract content from
            
        Returns:
            List of ExtractionResult objects
        """
        
        print(f"🌐 Extracting content from {len(urls)} URLs...")
        start_time = time.time()
        
        # Process URLs in parallel with semaphore limiting
        tasks = [self.extract_content(url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        successful = sum(1 for r in results if r.success)
        
        print(f"✅ Extraction completed in {total_time:.2f}s")
        print(f"📊 Success rate: {successful}/{len(urls)} ({successful/len(urls)*100:.1f}%)")
        
        return results
    
    def to_content_bundle(self, result: ExtractionResult) -> ContentBundle:
        """Convert ExtractionResult to ContentBundle for ML pipeline"""
        
        return ContentBundle(
            url=result.url,
            text=f"{result.title} {result.text}",
            images=result.images,
            image_urls=result.image_urls,
            metadata=result.metadata
        ) 