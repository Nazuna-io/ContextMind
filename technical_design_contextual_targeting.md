---

## **6. Real Ad Taxonomy Integration**

### **6.1 IAB Categories Data Structure**
```python
# backend/app/ml/taxonomy.py
import asyncio
import aiohttp
import json
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class AdCategory:
    id: str
    name: str
    description: str
    parent_id: Optional[str]
    level: int
    source: str
    keywords: List[str]

class TaxonomyManager:
    """Manage real advertising taxonomy data"""
    
    def __init__(self):
        self.categories = {}
        self.sources = {
            "iab": "https://iabtechlab.com/wp-content/uploads/2021/03/IAB_Content_Taxonomy_2.2_Final.json",
            "google": "https://developers.google.com/google-ads/api/data/codes-formats#expandable-17",
            "facebook": "https://developers.facebook.com/docs/marketing-api/audiences/reference/advanced-targeting#interests"
        }
    
    async def load_all_taxonomies(self):
        """Load all advertising taxonomies"""
        
        # Load IAB Content Taxonomy 2.2
        iab_categories = await self._load_iab_taxonomy()
        
        # Load Google Ads categories
        google_categories = await self._load_google_taxonomy()
        
        # Load Facebook/Meta ad categories
        facebook_categories = await self._load_facebook_taxonomy()
        
        # Merge all taxonomies
        all_categories = []
        all_categories.extend(iab_categories)
        all_categories.extend(google_categories)
        all_categories.extend(facebook_categories)
        
        return all_categories
    
    async def _load_iab_taxonomy(self) -> List[AdCategory]:
        """Load IAB Content Taxonomy 2.2"""
        
        # IAB Taxonomy structure (Tier 1 -> Tier 2 -> Tier 3)
        iab_data = {
            "1": {"name": "Arts & Entertainment", "children": {
                "1-1": "Books & Literature",
                "1-2": "Celebrity Fan/Gossip", 
                "1-3": "Fine Art",
                "1-4": "Humor",
                "1-5": "Movies",
                "1-6": "Music",
                "1-7": "Television"
            }},
            "2": {"name": "Automotive", "children": {
                "2-1": "Auto Parts",
                "2-2": "Auto Repair", 
                "2-3": "Buying/Selling Cars",
                "2-4": "Car Culture",
                "2-5": "Certified Pre-Owned",
                "2-6": "Convertible",
                "2-7": "Coupe",
                "2-8": "Crossover",
                "2-9": "Diesel",
                "2-10": "Electric Vehicle",
                "2-11": "Hatchback",
                "2-12": "Hybrid",
                "2-13": "Luxury",
                "2-14": "Minivan",
                "2-15": "Motorcycles",
                "2-16": "Off-Road Vehicles",
                "2-17": "Performance Vehicles",
                "2-18": "Pickup",
                "2-19": "Road-Side Assistance",
                "2-20": "Sedan",
                "2-21": "Trucks & Accessories",
                "2-22": "Vintage Cars",
                "2-23": "Wagon"
            }},
            "3": {"name": "Business", "children": {
                "3-1": "Advertising",
                "3-2": "Agriculture", 
                "3-3": "Biotech/Biomedical",
                "3-4": "Business Software",
                "3-5": "Construction",
                "3-6": "Forestry",
                "3-7": "Government",
                "3-8": "Green Solutions",
                "3-9": "Human Resources",
                "3-10": "Logistics",
                "3-11": "Marketing",
                "3-12": "Metals"
            }},
            "4": {"name": "Careers", "children": {
                "4-1": "Career Planning",
                "4-2": "College", 
                "4-3": "Financial Aid",
                "4-4": "Job Fairs",
                "4-5": "Job Search",
                "4-6": "Resume Writing",
                "4-7": "Nursing",
                "4-8": "Scholarships",
                "4-9": "Telecommuting",
                "4-10": "U.S. Military",
                "4-11": "Career Advice"
            }},
            "5": {"name": "Education", "children": {
                "5-1": "7-12 Education",
                "5-2": "Adult Education", 
                "5-3": "Art History",
                "5-4": "College Administration",
                "5-5": "College Life",
                "5-6": "Curriculum",
                "5-7": "Distance Learning",
                "5-8": "English as a 2nd Language",
                "5-9": "Language Learning",
                "5-10": "Graduate School",
                "5-11": "Homeschooling",
                "5-12": "Homework/Study Tips",
                "5-13": "K-6 Educators",
                "5-14": "Private School",
                "5-15": "Special Education",
                "5-16": "Studying Business"
            }},
            "6": {"name": "Family & Parenting", "children": {
                "6-1": "Adoption",
                "6-2": "Babies & Toddlers", 
                "6-3": "Daycare/Pre School",
                "6-4": "Family Internet",
                "6-5": "Parenting - K-6 Kids",
                "6-6": "Parenting teens",
                "6-7": "Pregnancy",
                "6-8": "Special Needs Kids",
                "6-9": "Eldercare"
            }},
            "7": {"name": "Health & Fitness", "children": {
                "7-1": "Exercise",
                "7-2": "A.D.D.", 
                "7-3": "AIDS/HIV",
                "7-4": "Allergies",
                "7-5": "Alternative Medicine",
                "7-6": "Arthritis",
                "7-7": "Asthma",
                "7-8": "Autism/PDD",
                "7-9": "Bipolar Disorder",
                "7-10": "Brain Tumor",
                "7-11": "Cancer",
                "7-12": "Cholesterol",
                "7-13": "Chronic Fatigue Syndrome",
                "7-14": "Chronic Pain",
                "7-15": "Cold & Flu",
                "7-16": "Deafness",
                "7-17": "Dental Care",
                "7-18": "Depression",
                "7-19": "Dermatology",
                "7-20": "Diabetes",
                "7-21": "Epilepsy",
                "7-22": "GERD/Acid Reflux",
                "7-23": "Headaches/Migraines",
                "7-24": "Heart Disease",
                "7-25": "Herbs for Health",
                "7-26": "Holistic Healing",
                "7-27": "IBS/Crohn's Disease",
                "7-28": "Incest/Abuse Support",
                "7-29": "Incontinence",
                "7-30": "Infertility",
                "7-31": "Men's Health",
                "7-32": "Nutrition",
                "7-33": "Orthopedics",
                "7-34": "Panic/Anxiety Disorders",
                "7-35": "Pediatrics",
                "7-36": "Physical Therapy",
                "7-37": "Psychology/Psychiatry",
                "7-38": "Senior Health",
                "7-39": "Sexuality",
                "7-40": "Sleep Disorders",
                "7-41": "Smoking Cessation",
                "7-42": "Substance Abuse",
                "7-43": "Thyroid Disease",
                "7-44": "Weight Loss",
                "7-45": "Women's Health"
            }}
        }
        
        categories = []
        
        for tier1_id, tier1_data in iab_data.items():
            # Add tier 1 category
            categories.append(AdCategory(
                id=f"iab_{tier1_id}",
                name=tier1_data["name"],
                description=f"IAB Tier 1 category: {tier1_data['name']}",
                parent_id=None,
                level=1,
                source="iab",
                keywords=self._generate_keywords(tier1_data["name"])
            ))
            
            # Add tier 2 categories
            for tier2_id, tier2_name in tier1_data["children"].items():
                categories.append(AdCategory(
                    id=f"iab_{tier2_id}",
                    name=tier2_name,
                    description=f"IAB Tier 2 category: {tier2_name} under {tier1_data['name']}",
                    parent_id=f"iab_{tier1_id}",
                    level=2,
                    source="iab",
                    keywords=self._generate_keywords(tier2_name)
                ))
        
        return categories
    
    async def _load_google_taxonomy(self) -> List[AdCategory]:
        """Load Google Ads categories"""
        
        google_categories = {
            "Autos & Vehicles": [
                "Auto Parts & Accessories", "Auto Repair", "Car Dealers", 
                "Motorcycles", "Motor Vehicles"
            ],
            "Beauty & Fitness": [
                "Beauty Salons & Services", "Fitness", "Hair Care", 
                "Hair Salons", "Skin Care", "Spas", "Weight Loss"
            ],
            "Business & Industrial": [
                "Advertising & Marketing", "Aerospace & Defense", "Agriculture & Forestry",
                "Automation & Control Systems", "Business Services", "Chemicals & Allied Products",
                "Construction & Maintenance", "Energy & Utilities", "Finance",
                "Food Production & Services", "Industrial Machinery & Equipment",
                "Manufacturing", "Metals & Mining", "Printing & Publishing",
                "Retail Trade", "Textiles & Apparel", "Transportation & Logistics"
            ],
            "Computers & Electronics": [
                "Computer Hardware", "Computer Software", "Consumer Electronics",
                "Internet & Telecom", "Media & Video Equipment", "Video Games"
            ],
            "Finance": [
                "Accounting & Auditing", "Banking", "Credit & Lending",
                "Financial Planning", "Insurance", "Investing", "Tax Services"
            ],
            "Food & Drink": [
                "Beverages", "Cooking & Recipes", "Food & Grocery Retailers",
                "Restaurants", "Tobacco Products"
            ],
            "Health": [
                "Health Conditions", "Health Services", "Medical Devices & Equipment",
                "Medical Facilities & Services", "Mental Health", "Nursing & Assisted Living",
                "Nutrition & Fitness", "Pharmacy", "Public Health & Safety"
            ],
            "Hobbies & Leisure": [
                "Arts & Entertainment", "Celebrations & Events", "Clubs & Organizations",
                "Dating", "Games", "Hobbies & Creative Arts", "Lottery & Gambling",
                "Outdoors", "Pets & Animals", "Photography", "Radio",
                "Special Occasions", "Sports", "Television", "Toys & Games"
            ],
            "Home & Garden": [
                "Bath & Shower", "Bed & Bath", "Decor", "Flowers", "Furniture",
                "Gardening", "Hardware", "Home & Garden", "Home Appliances",
                "Home Improvement", "Kitchen & Dining", "Lawn & Garden",
                "Lighting", "Outdoor Living", "Plumbing", "Swimming Pools & Spas"
            ]
        }
        
        categories = []
        category_id = 1000  # Start Google IDs at 1000
        
        for parent_name, children in google_categories.items():
            # Add parent category
            categories.append(AdCategory(
                id=f"google_{category_id}",
                name=parent_name,
                description=f"Google Ads category: {parent_name}",
                parent_id=None,
                level=1,
                source="google",
                keywords=self._generate_keywords(parent_name)
            ))
            parent_id = f"google_{category_id}"
            category_id += 1
            
            # Add child categories
            for child_name in children:
                categories.append(AdCategory(
                    id=f"google_{category_id}",
                    name=child_name,
                    description=f"Google Ads subcategory: {child_name} under {parent_name}",
                    parent_id=parent_id,
                    level=2,
                    source="google",
                    keywords=self._generate_keywords(child_name)
                ))
                category_id += 1
        
        return categories
    
    async def _load_facebook_taxonomy(self) -> List[AdCategory]:
        """Load Facebook/Meta advertising categories"""
        
        facebook_interests = {
            "Business and industry": [
                "Advertising", "Agriculture", "Aviation", "Banking", "Business news",
                "Construction", "Design", "Entrepreneurship", "Finance", "Government",
                "Insurance", "Leadership", "Management", "Marketing", "Nonprofit",
                "Real estate", "Retail", "Sales", "Small business"
            ],
            "Entertainment": [
                "Books", "Comics", "Concerts", "Dance", "Movies", "Music", "Opera",
                "Photography", "Television", "Theater", "Visual arts"
            ],
            "Family and relationships": [
                "Dating", "Family", "Fatherhood", "Friendship", "Marriage", "Motherhood",
                "Parenting", "Weddings"
            ],
            "Fitness and wellness": [
                "Bodybuilding", "Exercise", "Meditation", "Mental health", "Nutrition",
                "Physical fitness", "Running", "Weight training", "Wellness", "Yoga"
            ],
            "Food and drink": [
                "Alcoholic beverages", "Baking", "Barbecue", "Beer", "Coffee",
                "Cooking", "Cuisine", "Food", "Organic food", "Restaurants",
                "Tea", "Vegetarianism", "Wine"
            ],
            "Hobbies and activities": [
                "Arts and crafts", "Board games", "Collecting", "Dancing", "Drawing",
                "Fishing", "Gardening", "Hunting", "Knitting", "Magic", "Model building",
                "Painting", "Pets", "Photography", "Puzzles", "Reading", "Singing",
                "Video games", "Writing"
            ],
            "Shopping and fashion": [
                "Beauty", "Clothing", "Cosmetics", "Fashion", "Fashion accessories",
                "Jewelry", "Luxury goods", "Shopping", "Shoes"
            ],
            "Sports and outdoors": [
                "American football", "Baseball", "Basketball", "Cycling", "Golf",
                "Hiking", "Hockey", "Martial arts", "Olympics", "Outdoor recreation",
                "Soccer", "Swimming", "Tennis", "Volleyball", "Winter sports"
            ],
            "Technology": [
                "Artificial intelligence", "Computer hardware", "Computer software",
                "Consumer electronics", "Internet", "Mobile phones", "Social media",
                "Video games", "Web design", "Web development"
            ],
            "Travel": [
                "Adventure travel", "Air travel", "Beach", "Business travel", "Camping",
                "Cruises", "Ecotourism", "Hotels", "Luxury travel", "National parks",
                "Road trips", "Travel planning", "Vacation rentals"
            ]
        }
        
        categories = []
        category_id = 2000  # Start Facebook IDs at 2000
        
        for parent_name, children in facebook_interests.items():
            # Add parent category
            categories.append(AdCategory(
                id=f"facebook_{category_id}",
                name=parent_name,
                description=f"Facebook/Meta interest category: {parent_name}",
                parent_id=None,
                level=1,
                source="facebook",
                keywords=self._generate_keywords(parent_name)
            ))
            parent_id = f"facebook_{category_id}"
            category_id += 1
            
            # Add child categories
            for child_name in children:
                categories.append(AdCategory(
                    id=f"facebook_{category_id}",
                    name=child_name,
                    description=f"Facebook/Meta interest: {child_name} under {parent_name}",
                    parent_id=parent_id,
                    level=2,
                    source="facebook",
                    keywords=self._generate_keywords(child_name)
                ))
                category_id += 1
        
        return categories
    
    def _generate_keywords(self, category_name: str) -> List[str]:
        """Generate relevant keywords for a category"""
        
        # Simple keyword generation based on category name
        keywords = []
        words = category_name.lower().replace('&', 'and').split()
        
        # Add the words themselves
        keywords.extend(words)
        
        # Add variations and synonyms
        keyword_map = {
            'auto': ['car', 'vehicle', 'automotive'],
            'business': ['company', 'corporate', 'enterprise'],
            'tech': ['technology', 'digital', 'software'],
            'health': ['medical', 'wellness', 'healthcare'],
            'food': ['restaurant', 'dining', 'cuisine'],
            'travel': ['vacation', 'trip', 'tourism'],
            'fashion': ['style', 'clothing', 'apparel'],
            'home': ['house', 'household', 'domestic'],
            'finance': ['money', 'financial', 'banking'],
            'education': ['learning', 'school', 'academic']
        }
        
        for word in words:
            if word in keyword_map:
                keywords.extend(keyword_map[word])
        
        return list(set(keywords))  # Remove duplicates
    
    async def save_taxonomy_to_files(self):
        """Save taxonomy data to JSON files for ChromaDB loading"""
        
        categories = await self.load_all_taxonomies()
        
        # Group by source
        by_source = {}
        for category in categories:
            if category.source not in by_source:
                by_source[category.source] = []
            
            by_source[category.source].append({
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "parent": category.parent_id,
                "level": category.level,
                "source": category.source,
                "keywords": category.keywords
            })
        
        # Save to separate files
        import os
        os.makedirs("./data", exist_ok=True)
        
        for source, source_categories in by_source.items():
            filename = f"./data/{source}_categories.json"
            with open(filename, 'w') as f:
                json.dump({
                    "source": source,
                    "count": len(source_categories),
                    "categories": source_categories
                }, f, indent=2)
            
            print(f"Saved {len(source_categories)} {source} categories to {filename}")

# Usage example
async def setup_taxonomy():
    """Setup script to create taxonomy files"""
    manager = TaxonomyManager()
    await manager.save_taxonomy_to_files()

if __name__ == "__main__":
    asyncio.run(setup_taxonomy())
```

---

## **7. Deployment & Infrastructure**

### **7.1 Docker Configuration**
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: contextual_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory 10gb --maxmemory-policy allkeys-lru
    restart: unless-stopped

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: contextual_backend
    ports:
      - "8000:8000"
    environment:
      - CUDA_VISIBLE_DEVICES=0,1,2,3
      - REDIS_URL=redis://redis:6379
      - CHROMADB_PATH=/app/data/chroma_db
    volumes:
      - ./data:/app/data
      - /tmp/.X11-unix:/tmp/.X11-unix:rw
    depends_on:
      - redis
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 4
              capabilities: [gpu]
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: contextual_frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
      - REACT_APP_WS_URL=ws://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: contextual_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  redis_data:
```

### **7.2 Backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM nvidia/cuda:12.4-devel-ubuntu22.04

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential \
    curl \
    wget \
    git \
    ffmpeg \
    libnss3 \
    libnspr4 \
    libxss1 \
    libasound2 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN python3.11 -m pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN python3.11 -m playwright install chromium
RUN python3.11 -m playwright install-deps

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data/chroma_db

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run application
CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **7.3 Frontend Dockerfile**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

---

## **8. Testing Strategy**

### **8.1 Backend Testing (pytest)**
```python
# backend/tests/test_embeddings.py
import pytest
import torch
import numpy as np
from unittest.mock import Mock, patch

from app.ml.embeddings import EmbeddingManager, MultiGPUEmbedder

@pytest.fixture
def embedding_manager():
    """Create embedding manager for testing"""
    return EmbeddingManager(device_ids=[0], batch_size=2)

@pytest.mark.asyncio
async def test_embedding_generation(embedding_manager):
    """Test basic embedding generation"""
    
    # Mock the model loading
    with patch.object(embedding_manager, 'model') as mock_model:
        mock_model.return_value = torch.randn(512)
        
        # Test embedding generation
        result = await embedding_manager.generate_embeddings(
            text_content="Test content about cars and technology",
            images=[np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)]
        )
        
        assert result.fused_embedding.shape == (512,)
        assert result.metadata["num_images"] == 1
        assert result.metadata["processing_time"] > 0

@pytest.mark.asyncio
async def test_multimodal_fusion():
    """Test multimodal embedding fusion"""
    
    embedder = MultiGPUEmbedder([0])
    
    with patch.object(embedder.text_model, 'encode') as mock_text, \
         patch.object(embedder.clip_model, 'get_image_features') as mock_image:
        
        mock_text.return_value = torch.randn(384)
        mock_image.return_value = torch.randn(1, 512)
        
        result = embedder("test text", [np.random.randint(0, 255, (224, 224, 3))])
        
        assert result.shape == (512,)

# backend/tests/test_content_extraction.py
import pytest
from unittest.mock import AsyncMock, patch

from app.ml.content_extractor import ContentExtractor

@pytest.mark.asyncio
async def test_content_extraction():
    """Test webpage content extraction"""
    
    extractor = ContentExtractor()
    
    # Mock Playwright page
    mock_page = AsyncMock()
    mock_page.evaluate.side_effect = [
        "Sample webpage text content",  # Text extraction
        ["https://example.com/image1.jpg"],  # Image URLs
        {"viewport": {"width": 1920, "height": 1080}},  # Layout info
        {"title": "Test Page", "url": "https://example.com"}  # Metadata
    ]
    
    with patch.object(extractor, '_init_browser'), \
         patch.object(extractor, '_cleanup_browser'), \
         patch('app.ml.content_extractor.async_playwright') as mock_playwright:
        
        # Mock browser context
        mock_context = AsyncMock()
        mock_context.new_page.return_value = mock_page
        mock_page.goto = AsyncMock()
        
        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        extractor.browser = mock_browser
        
        # Test content extraction
        result = await extractor.extract_content("https://example.com")
        
        assert result.text == "Sample webpage text content"
        assert result.metadata["title"] == "Test Page"
        assert result.analysis["text_stats"]["word_count"] > 0

# backend/tests/test_vector_search.py
import pytest
import numpy as np
from unittest.mock import AsyncMock, patch

from app.ml.vector_search import VectorSearchEngine

@pytest.mark.asyncio
async def test_vector_search():
    """Test ChromaDB vector search"""
    
    engine = VectorSearchEngine()
    
    # Mock ChromaDB collection
    mock_collection = AsyncMock()
    mock_collection.query.return_value = {
        "ids": [["cat1", "cat2"]],
        "metadatas": [[
            {"category_name": "Automotive", "taxonomy_source": "iab"},
            {"category_name": "Technology", "taxonomy_source": "google"}
        ]],
        "documents": [["Car and vehicle content", "Tech and software content"]],
        "distances": [[0.1, 0.3]]
    }
    
    engine.collection = mock_collection
    
    # Test search
    embedding = np.random.randn(512)
    results = await engine.search_similar(embedding, top_k=5)
    
    assert len(results) == 2
    assert results[0].category_name == "Automotive"
    assert results[0].confidence > results[1].confidence

# Integration test
@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_pipeline():
    """Test complete analysis pipeline"""
    
    from app.api.routes.analyze import analyze_content
    from app.models.requests import AnalysisRequest
    
    request = AnalysisRequest(
        url="https://example.com",
        include_images=True,
        top_k=5
    )
    
    # This would require actual models loaded
    # Skip in CI, run manually for integration testing
    if pytest.skip_integration:
        pytest.skip("Integration test requires full model setup")
    
    result = await analyze_content(request, None)
    
    assert result.matches
    assert result.processing_time > 0
    assert len(result.matches) <= 5
```

### **8.2 Frontend Testing (Jest + React Testing Library)**
```javascript
// frontend/src/components/__tests__/URLInput.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import URLInput from '../analysis/URLInput';

const renderWithChakra = (component) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('URLInput Component', () => {
  test('renders URL input field', () => {
    const mockOnAnalyze = jest.fn();
    renderWithChakra(<URLInput onAnalyze={mockOnAnalyze} />);
    
    expect(screen.getByPlaceholderText(/https:\/\/example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Analyze/)).toBeInTheDocument();
  });

  test('validates URL input', async () => {
    const mockOnAnalyze = jest.fn();
    renderWithChakra(<URLInput onAnalyze={mockOnAnalyze} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const button = screen.getByText(/Analyze/);
    
    // Test invalid URL
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    expect(button).toBeDisabled();
    
    // Test valid URL
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    expect(button).not.toBeDisabled();
    
    // Test analyze function call
    fireEvent.click(button);
    expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  test('shows advanced options when toggled', () => {
    const mockOnAnalyze = jest.fn();
    renderWithChakra(<URLInput onAnalyze={mockOnAnalyze} />);
    
    const advancedToggle = screen.getByRole('switch');
    fireEvent.click(advancedToggle);
    
    expect(screen.getByText(/Include Images/)).toBeInTheDocument();
    expect(screen.getByText(/Results Count/)).toBeInTheDocument();
  });
});

// frontend/src/hooks/__tests__/useAnalysis.test.js
import { renderHook, act } from '@testing-library/react';
import { useAnalysis } from '../useAnalysis';

// Mock fetch
global.fetch = jest.fn();

describe('useAnalysis Hook', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('handles successful analysis', async () => {
    const mockResponse = {
      url: 'https://example.com',
      matches: [
        { category_name: 'Technology', confidence: 0.95 }
      ],
      processing_time: 2.5
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      const response = await result.current.analyzeURL('https://example.com');
      expect(response).toEqual(mockResponse);
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/analyze',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      })
    );
  });

  test('handles analysis errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      try {
        await result.current.analyzeURL('https://example.com');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });
});
```

---

## **9. Performance Monitoring & Analytics**

### **9.1 Real-Time Performance Tracking**
```python
# backend/app/utils/performance.py
import time
import psutil
import GPUtil
import asyncio
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager
import logging

@dataclass
class PerformanceMetrics:
    timestamp: float
    cpu_usage: float
    memory_usage: float
    gpu_usage: List[float]
    gpu_memory: List[float]
    processing_time: Optional[float] = None
    throughput: Optional[float] = None
    cache_hit_rate: Optional[float] = None

class PerformanceMonitor:
    """Real-time performance monitoring for the ML pipeline"""
    
    def __init__(self):
        self.metrics_history = []
        self.logger = logging.getLogger(__name__)
        self.start_time = time.time()
        
    @asynccontextmanager
    async def track_operation(self, operation_name: str):
        """Context manager to track operation performance"""
        start_time = time.time()
        start_metrics = self._collect_system_metrics()
        
        self.logger.info(f"Starting operation: {operation_name}")
        
        try:
            yield
        finally:
            end_time = time.time()
            end_metrics = self._collect_system_metrics()
            processing_time = end_time - start_time
            
            # Log performance
            self.logger.info(
                f"Completed {operation_name} in {processing_time:.2f}s "
                f"(CPU: {end_metrics.cpu_usage:.1f}%, "
                f"GPU: {max(end_metrics.gpu_usage):.1f}%)"
            )
            
            # Store metrics
            end_metrics.processing_time = processing_time
            self.metrics_history.append(end_metrics)
            
            # Keep only last 1000 metrics
            if len(self.metrics_history) > 1000:
                self.metrics_history = self.metrics_history[-1000:]
    
    def _collect_system_metrics(self) -> PerformanceMetrics:
        """Collect current system performance metrics"""
        
        # CPU and Memory
        cpu_usage = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        
        # GPU metrics
        gpu_usage = []
        gpu_memory = []
        
        try:
            gpus = GPUtil.getGPUs()
            for gpu in gpus:
                gpu_usage.append(gpu.load * 100)
                gpu_memory.append(gpu.memoryUtil * 100)
        except Exception as e:
            self.logger.warning(f"Could not collect GPU metrics: {e}")
            gpu_usage = [0.0] * 4  # Assume 4 GPUs
            gpu_memory = [0.0] * 4
        
        return PerformanceMetrics(
            timestamp=time.time(),
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            gpu_usage=gpu_usage,
            gpu_memory=gpu_memory
        )
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        metrics = self._collect_system_metrics()
        return asdict(metrics)
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary over recent operations"""
        
        if not self.metrics_history:
            return {"error": "No metrics available"}
        
        recent_metrics = self.metrics_history[-100:]  # Last 100 operations
        
        # Calculate averages
        avg_cpu = sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics)
        avg_memory = sum(m.memory_usage for m in recent_metrics) / len(recent_metrics)
        
        # GPU averages
        avg_gpu_usage = []
        avg_gpu_memory = []
        
        for gpu_idx in range(len(recent_metrics[0].gpu_usage)):
            avg_gpu_usage.append(
                sum(m.gpu_usage[gpu_idx] for m in recent_metrics) / len(recent_metrics)
            )
            avg_gpu_memory.append(
                sum(m.gpu_memory[gpu_idx] for m in recent_metrics) / len(recent_metrics)
            )
        
        # Processing time stats
        processing_times = [m.processing_time for m in recent_metrics if m.processing_time]
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        return {
            "uptime_seconds": time.time() - self.start_time,
            "operations_tracked": len(self.metrics_history),
            "averages": {
                "cpu_usage": avg_cpu,
                "memory_usage": avg_memory,
                "gpu_usage": avg_gpu_usage,
                "gpu_memory": avg_gpu_memory,
                "processing_time": avg_processing_time
            },
            "current": self.get_current_metrics()
        }

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

# Decorator for automatic performance tracking
def track_performance(operation_name: str = None):
    """Decorator to automatically track function performance"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            name = operation_name or f"{func.__module__}.{func.__name__}"
            async with performance_monitor.track_operation(name):
                return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage example
@track_performance("content_extraction")
async def extract_content_with_tracking(url: str):
    # Function implementation
    pass
```

### **9.2 Real-Time WebSocket Updates**
```python
# backend/app/api/websockets/realtime.py
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import logging

from app.utils.performance import performance_monitor

class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.logger = logging.getLogger(__name__)
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Connect a new WebSocket client"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.logger.info(f"Client {client_id} connected")
        
        # Send initial performance data
        await self.send_performance_update(client_id)
    
    def disconnect(self, client_id: str):
        """Disconnect a WebSocket client"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                self.logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                self.logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def send_performance_update(self, client_id: str = None):
        """Send performance metrics update"""
        metrics = performance_monitor.get_performance_summary()
        message = {
            "type": "performance_update",
            "data": metrics,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        if client_id:
            await self.send_personal_message(message, client_id)
        else:
            await self.broadcast(message)
    
    async def send_progress_update(self, client_id: str, progress: Dict):
        """Send analysis progress update"""
        message = {
            "type": "progress_update",
            "data": progress,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.send_personal_message(message, client_id)

# Global connection manager
manager = ConnectionManager()

async def handle_connection(websocket: WebSocket, client_id: str):
    """Handle WebSocket connection lifecycle"""
    
    await manager.connect(websocket, client_id)
    
    try:
        # Start performance monitoring task
        performance_task = asyncio.create_task(
            periodic_performance_updates(client_id)
        )
        
        # Listen for messages from client
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await handle_client_message(client_id, message)
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"type": "error", "message": "Invalid JSON"},
                    client_id
                )
    
    except WebSocketDisconnect:
        pass
    finally:
        # Cleanup
        performance_task.cancel()
        manager.disconnect(client_id)

async def handle_client_message(client_id: str, message: Dict):
    """Handle incoming messages from WebSocket clients"""
    
    message_type = message.get("type")
    
    if message_type == "ping":
        await manager.send_personal_message(
            {"type": "pong", "timestamp": asyncio.get_event_loop().time()},
            client_id
        )
    
    elif message_type == "request_performance":
        await manager.send_performance_update(client_id)
    
    elif message_type == "subscribe_performance":
        # Client wants to subscribe to performance updates
        # This is handled by the periodic task
        pass

async def periodic_performance_updates(client_id: str):
    """Send periodic performance updates to client"""
    
    while True:
        try:
            await asyncio.sleep(5)  # Update every 5 seconds
            await manager.send_performance_update(client_id)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"Error in performance updates for {client_id}: {e}")
            break
```

---

## **10. 7-Day Implementation Timeline**

### **Day 1: Foundation & Environment Setup**
```bash
# Project initialization
mkdir contextual-targeting && cd contextual-targeting
mkdir backend frontend data nginx

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn torch torchvision chromadb sentence-transformers transformers playwright redis pytest

# Frontend setup
cd ../frontend
npx create-react-app . --template typescript
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion plotly.js react-plotly.js

# Data directory setup
cd ../data
mkdir chroma_db taxonomy models

# Git initialization
cd ..
git init
echo "venv/" > .gitignore
echo "node_modules/" >> .gitignore
echo "data/chroma_db/" >> .gitignore
```

**Tasks:**
- [ ] Complete project structure setup
- [ ] Install all dependencies and verify GPU access
- [ ] Set up ChromaDB and test basic operations
- [ ] Create ad taxonomy data files (IAB + Google + Facebook)
- [ ] Basic FastAPI app with health check endpoint
- [ ] Basic React app with Chakra UI setup

### **Day 2: Core ML Pipeline - Embeddings**
```python
# Priority tasks for Day 2
TASKS = [
    "Implement MultiGPUEmbedder class with CLIP integration",
    "Set up sentence transformers for text embeddings", 
    "Create embedding fusion mechanism",
    "Test multi-GPU performance with dummy data",
    "Implement embedding caching with Redis",
    "Write unit tests for embedding generation"
]
```

**Technical Focus:**
- Multi-GPU CLIP model setup and testing
- Sentence transformer integration
- Embedding dimension matching and fusion
- Performance benchmarking on 4x RTX 3090
- Memory optimization for 512GB RAM utilization

### **Day 3: Content Extraction & Vector Search**
```python
# Priority tasks for Day 3
TASKS = [
    "Implement Playwright-based content extraction",
    "Add parallel image downloading and processing",
    "Set up ChromaDB with real ad taxonomy data",
    "Implement vector similarity search",
    "Test end-to-end: URL → embeddings → search results",
    "Add performance monitoring and logging"
]
```

**Technical Focus:**
- Robust web scraping with error handling
- Multimodal content processing pipeline
- ChromaDB collection setup with taxonomy data
- Vector search optimization for sub-10ms response
- Integration testing with real websites

### **Day 4: API Development & WebSocket**
```python
# Priority tasks for Day 4
TASKS = [
    "Build FastAPI routes for content analysis",
    "Implement WebSocket for real-time updates",
    "Add request/response models with validation",
    "Set up Redis caching for analysis results",
    "Implement performance tracking and monitoring",
    "Add comprehensive error handling"
]
```

**Technical Focus:**
- RESTful API design with proper status codes
- Real-time communication for progress updates
- Caching strategy for performance optimization
- Input validation and sanitization
- API documentation with FastAPI auto-docs

### **Day 5: React Frontend - Dazzling UI**
```javascript
// Priority tasks for Day 5
const TASKS = [
    "Build URL input component with validation",
    "Create real-time processing status display",
    "Implement results dashboard with visualizations",
    "Add WebSocket integration for live updates",
    "Design glassmorphism UI with animations",
    "Create demo scenarios selector"
];
```

**Technical Focus:**
- Modern React components with TypeScript
- Chakra UI + Framer Motion animations
- Real-time WebSocket integration
- Interactive data visualizations
- Responsive design for multiple screen sizes

### **Day 6: Integration & Visualization**
```python
# Priority tasks for Day 6
TASKS = [
    "Complete end-to-end testing of full pipeline",
    "Add advanced visualizations (embedding plots, heatmaps)",
    "Implement demo scenarios with curated URLs",
    "Performance optimization and benchmarking",
    "Add export functionality (JSON, reports)",
    "Bug fixes and edge case handling"
]
```

**Technical Focus:**
- Integration testing across all components
- Performance optimization for demo scenarios
- Advanced data visualization components
- Export and sharing functionality
- Cross-browser compatibility testing

### **Day 7: Demo Polish & Deployment**
```bash
# Priority tasks for Day 7
DEPLOYMENT_TASKS = [
    "Docker containerization with multi-GPU support",
    "nginx reverse proxy configuration",
    "Performance benchmarking and optimization",
    "Demo script creation and practice",
    "Documentation completion",
    "Final testing and bug fixes"
]
```

**Technical Focus:**
- Production-ready deployment setup
- Performance optimization for demo hardware
- Comprehensive documentation
- Demo presentation preparation
- Final polish and testing

---

## **11. Success Metrics & KPIs**

### **11.1 Technical Performance Metrics**
```python
SUCCESS_METRICS = {
    "processing_speed": {
        "target": "< 10 seconds end-to-end",
        "measurement": "URL input to final results display",
        "acceptable": "< 15 seconds"
    },
    "vector_search_latency": {
        "target": "< 10ms",
        "measurement": "ChromaDB similarity search",
        "acceptable": "< 20ms"
    },
    "accuracy": {
        "target": "> 85% top-3 relevance",
        "measurement": "Manual evaluation of category matches",
        "acceptable": "> 75%"
    },
    "gpu_utilization": {
        "target": "> 80% during processing",
        "measurement": "Average GPU usage across 4x RTX 3090",
        "acceptable": "> 60%"
    },
    "memory_efficiency": {
        "target": "< 8GB peak usage",
        "measurement": "Maximum memory consumption",
        "acceptable": "< 12GB"
    }
}
```

### **11.2 Demo Quality Metrics**
```python
DEMO_METRICS = {
    "visual_appeal": {
        "criteria": ["Modern UI", "Smooth animations", "Clear visualizations"],
        "target": "Professional, polished appearance"
    },
    "user_experience": {
        "criteria": ["Intuitive interface", "Real-time feedback", "Error handling"],
        "target": "No explanation needed for basic usage"
    },
    "technical_depth": {
        "criteria": ["Architecture explanation", "Performance metrics", "Edge cases"],
        "target": "Demonstrates cutting-edge ML knowledge"
    },
    "business_relevance": {
        "criteria": ["Clear value proposition", "Practical applications", "ROI potential"],
        "target": "Obviously useful for advertising industry"
    }
}
```

### **11.3 Interview Readiness Checklist**
```python
INTERVIEW_CHECKLIST = {
    "live_demo": {
        "duration": "5-7 minutes",
        "scenarios": ["News article", "E-commerce page", "Corporate site"],
        "backup_plan": "Pre-recorded video if live demo fails"
    },
    "technical_explanation": {
        "architecture": "Can explain multimodal embeddings + vector search",
        "innovations": "Token-free processing, sub-10ms search, multi-GPU optimization",
        "trade_offs": "Understands accuracy vs speed vs cost decisions"
    },
    "business_value": {
        "problem": "Post-cookie contextual targeting challenge",
        "solution": "Real-time multimodal content understanding",
        "market_size": "Multi-billion programmatic advertising industry"
    },
    "future_work": {
        "scalability": "How to handle millions of requests",
        "accuracy": "Advanced training strategies",
        "applications": "Beyond advertising use cases"
    }
}
```

---

## **12. Risk Mitigation & Contingency Plans**

### **12.1 Technical Risk Mitigation**
```python
RISK_MITIGATION = {
    "model_loading_failures": {
        "risk": "CLIP or sentence transformer models fail to load",
        "probability": "Low",
        "impact": "High",
        "mitigation": [
            "Pre-download all models during setup",
            "Implement model loading retry logic",
            "Have backup smaller models ready",
            "Test on different CUDA versions"
        ]
    },
    "memory_issues": {
        "risk": "Out of memory during multi-GPU processing",
        "probability": "Medium", 
        "impact": "High",
        "mitigation": [
            "Implement dynamic batch sizing",
            "Add memory monitoring and alerts",
            "Use gradient checkpointing",
            "Fallback to single GPU processing"
        ]
    },
    "web_scraping_failures": {
        "risk": "Playwright fails on certain websites",
        "probability": "Medium",
        "impact": "Medium", 
        "mitigation": [
            "Robust error handling and retries",
            "Multiple extraction strategies",
            "Curated demo URLs that work reliably",
            "Graceful degradation for failed extractions"
        ]
    },
    "performance_degradation": {
        "risk": "System doesn't meet speed requirements",
        "probability": "Low",
        "impact": "Medium",
        "mitigation": [
            "Aggressive caching at multiple levels",
            "Pre-computed embeddings for demo scenarios", 
            "Performance monitoring and optimization",
            "Hardware-specific tuning"
        ]
    }
}
```

### **12.2 Demo Day Contingency Plans**
```python
DEMO_CONTINGENCIES = {
    "live_demo_failure": {
        "scenario": "Network issues or system crashes during live demo",
        "response": [
            "Pre-recorded demo video ready to play",
            "Screenshots of key results prepared", 
            "Offline demo with local test cases",
            "Focus on architecture discussion instead"
        ]
    },
    "performance_issues": {
        "scenario": "System runs slower than expected during demo",
        "response": [
            "Pre-computed results for demo scenarios",
            "Explain that performance is optimized for accuracy",
            "Show performance metrics from benchmarking",
            "Discuss production optimization strategies"
        ]
    },
    "accuracy_concerns": {
        "scenario": "Demo results show poor category matching",
        "response": [
            "Have curated examples with known good results",
            "Explain limitations and improvement strategies",
            "Focus on technical innovation over perfect accuracy",
            "Discuss training data quality challenges"
        ]
    },
    "technical_questions": {
        "scenario": "Interviewers ask about implementation details",
        "response": [
            "Detailed architecture diagrams prepared",
            "Code walkthrough capabilities",
            "Performance benchmarking data ready",
            "Future improvement roadmap"
        ]
    }
}
```

---

## **13. Post-Demo Extensions**

### **13.1 Advanced Features for Future Development**
```python
FUTURE_ENHANCEMENTS = {
    "advanced_ml": {
        "features": [
            "Custom embedding model training on advertising data",
            "Attention visualization for explainable targeting",
            "Multi-language content support",
            "Video content analysis beyond images"
        ],
        "timeline": "2-4 weeks additional development"
    },
    "production_features": {
        "features": [
            "API rate limiting and authentication",
            "Horizontal scaling with Kubernetes",
            "A/B testing framework for targeting strategies", 
            "Real-time analytics dashboard"
        ],
        "timeline": "4-8 weeks for production readiness"
    },
    "business_features": {
        "features": [
            "Integration with major ad platforms (Google, Facebook)",
            "Custom taxonomy management",
            "ROI tracking and optimization",
            "White-label deployment options"
        ],
        "timeline": "8-12 weeks for market readiness"
    }
}
```

---

## **14. Conclusion**

This technical design provides a comprehensive blueprint for building a cutting-edge contextual targeting system that showcases:

**🔥 Technical Innovation:**
- Token-free multimodal embeddings with CLIP + Sentence Transformers
- Sub-10ms vector search using optimized ChromaDB
- Multi-GPU processing leveraging 4x RTX 3090 cards
- Real-time WebSocket updates with performance monitoring

**✨ Dazzling User Experience:**
- Modern React frontend with Chakra UI and Framer Motion
- Glassmorphism design with smooth animations
- Real-time progress indicators and interactive visualizations
- One-click demo scenarios with curated examples

**💼 Business Relevance:**
- Addresses post-cookie advertising challenges
- Uses real advertising taxonomy (IAB + Google + Facebook)
- Demonstrates practical applications for DSP optimization
- Shows clear ROI potential for programmatic advertising

**⚡ Performance Excellence:**
- Optimized for 64-core EPYC CPU and 512GB RAM
- Multi-GPU acceleration for embedding generation
- Intelligent caching and memory management
- Sub-10-second end-to-end processing

This system will create a memorable demo that demonstrates both cutting-edge ML research implementation and practical business value, perfectly positioned for impressing Moloco's technical team while showcasing real-world advertising applications.

**Ready to build something that will absolutely dazzle!** 🌟
    fireEvent.change# **Technical Design: Real-Time Contextual Targeting System**

**Project**: MultiModal Vector Search for Post-Cookie Advertising  
**Stack**: FastAPI + React + ChromaDB + Multi-GPU Optimization  
**Timeline**: 7 Days  
**Hardware**: 4x RTX 3090, 64-core EPYC, 512GB RAM  

---

## **1. System Architecture Overview**

### **1.1 High-Level Architecture**
```
┌─ React Frontend ─┐    ┌─ FastAPI Backend ─┐    ┌─ ML Pipeline ─┐
│                  │    │                   │    │               │
│ • Dazzling UI    │───▶│ • REST API        │───▶│ • Multi-GPU   │
│ • Real-time UX   │    │ • WebSocket       │    │ • ChromaDB    │
│ • Visualizations │    │ • Task Queue      │    │ • Embeddings  │
│                  │    │                   │    │               │
└──────────────────┘    └───────────────────┘    └───────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─ Static Assets ──┐    ┌─ Redis Cache ─────┐    ┌─ Ad Taxonomy ─┐
│ • Animations     │    │ • Embedding Cache │    │ • IAB Categories│
│ • CSS/JS         │    │ • Results Cache   │    │ • Google Ads   │
│ • Demo Content   │    │ • Session Data    │    │ • Real Taxonomy│
└──────────────────┘    └───────────────────┘    └───────────────┘
```

### **1.2 Data Flow Architecture**
```
URL Input ──▶ Content Extraction ──▶ Multi-GPU Embeddings ──▶ ChromaDB Search ──▶ Results
    │              │                          │                      │              │
    │              ▼                          ▼                      ▼              ▼
[Validation] ──▶ [Playwright] ──▶ [CLIP + Transformers] ──▶ [Vector Search] ──▶ [React UI]
    │              │                          │                      │              │
    │              ▼                          ▼                      ▼              ▼
[WebSocket] ──▶ [Text+Images] ──▶ [512-dim vectors] ──▶ [Top-K matches] ──▶ [Visualizations]
```

---

## **2. Backend Architecture (FastAPI)**

### **2.1 FastAPI Application Structure**
```python
# Project Structure
contextual_targeting/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── analyze.py         # Content analysis endpoints
│   │   │   │   ├── demo.py            # Demo scenarios
│   │   │   │   └── health.py          # Health checks
│   │   │   └── websockets/
│   │   │       └── realtime.py        # Real-time updates
│   │   ├── core/
│   │   │   ├── config.py              # App configuration
│   │   │   ├── security.py            # CORS, rate limiting
│   │   │   └── logging.py             # Structured logging
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── content_extractor.py   # Playwright-based extraction
│   │   │   ├── embeddings.py          # Multi-GPU embedding generation
│   │   │   ├── vector_search.py       # ChromaDB integration
│   │   │   └── taxonomy.py            # Ad category management
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── requests.py            # Pydantic request models
│   │   │   └── responses.py           # Pydantic response models
│   │   └── utils/
│   │       ├── cache.py               # Redis caching
│   │       ├── async_utils.py         # Async helpers
│   │       └── performance.py         # Performance monitoring
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                          # React application
├── data/                              # Ad taxonomy and demo data
├── docker-compose.yml                 # Multi-service deployment
└── README.md
```

### **2.2 Core FastAPI Application**
```python
# backend/app/main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import asyncio
import uvloop

from app.api.routes import analyze, demo, health
from app.api.websockets import realtime
from app.core.config import settings
from app.ml.embeddings import EmbeddingManager
from app.ml.vector_search import VectorSearchEngine

# Global ML components (loaded once, shared across requests)
embedding_manager = None
search_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML components on startup"""
    global embedding_manager, search_engine
    
    # Initialize multi-GPU embedding manager
    embedding_manager = EmbeddingManager(
        device_ids=[0, 1, 2, 3],  # 4x RTX 3090
        batch_size=32
    )
    await embedding_manager.load_models()
    
    # Initialize ChromaDB vector search
    search_engine = VectorSearchEngine(
        persist_directory="./data/chroma_db",
        collection_name="ad_categories"
    )
    await search_engine.initialize()
    
    yield
    
    # Cleanup on shutdown
    await embedding_manager.cleanup()
    await search_engine.cleanup()

# FastAPI app with async context
app = FastAPI(
    title="Contextual Targeting API",
    description="Real-time multimodal content analysis for advertising",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(analyze.router, prefix="/api/v1", tags=["analysis"])
app.include_router(demo.router, prefix="/api/v1", tags=["demo"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])

# WebSocket for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await realtime.handle_connection(websocket, client_id)

if __name__ == "__main__":
    # Use uvloop for better async performance
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,  # Single worker due to GPU memory
        loop="uvloop"
    )
```

### **2.3 Content Analysis API Endpoints**
```python
# backend/app/api/routes/analyze.py
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
import asyncio
import time
from typing import Optional

from app.models.requests import AnalysisRequest
from app.models.responses import AnalysisResponse, AnalysisProgress
from app.ml.content_extractor import ContentExtractor
from app.utils.cache import get_cache, set_cache
from app.utils.performance import track_performance

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze webpage content for contextual ad targeting
    
    This endpoint orchestrates the full pipeline:
    1. Content extraction (Playwright)
    2. Multi-GPU embedding generation
    3. ChromaDB vector search
    4. Results formatting and caching
    """
    
    # Check cache first
    cache_key = f"analysis:{hash(request.url)}"
    cached_result = await get_cache(cache_key)
    if cached_result and not request.force_refresh:
        return AnalysisResponse.parse_obj(cached_result)
    
    start_time = time.time()
    
    try:
        # Step 1: Extract content using Playwright
        extractor = ContentExtractor()
        content = await extractor.extract_content(
            url=request.url,
            include_images=request.include_images,
            timeout=request.timeout or 30
        )
        
        # Step 2: Generate embeddings using multi-GPU
        from app.main import embedding_manager
        embeddings = await embedding_manager.generate_embeddings(
            text_content=content.text,
            images=content.images,
            layout_info=content.layout
        )
        
        # Step 3: Search ChromaDB for matching ad categories
        from app.main import search_engine
        matches = await search_engine.search_similar(
            embedding=embeddings.fused_embedding,
            top_k=request.top_k or 10,
            min_confidence=request.min_confidence or 0.5
        )
        
        # Step 4: Format response
        processing_time = time.time() - start_time
        response = AnalysisResponse(
            url=request.url,
            matches=matches,
            content_analysis=content.analysis,
            embedding_info=embeddings.metadata,
            processing_time=processing_time,
            timestamp=time.time()
        )
        
        # Cache result for 1 hour
        background_tasks.add_task(
            set_cache, 
            cache_key, 
            response.dict(), 
            expire=3600
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/analyze/progress/{task_id}")
async def get_analysis_progress(task_id: str):
    """Get real-time progress for long-running analysis"""
    # Implementation for progress tracking
    pass

@router.get("/analyze/batch")
async def batch_analyze(urls: list[str], max_concurrent: int = 5):
    """Analyze multiple URLs with concurrency control"""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def analyze_single(url: str):
        async with semaphore:
            request = AnalysisRequest(url=url)
            return await analyze_content(request, BackgroundTasks())
    
    results = await asyncio.gather(
        *[analyze_single(url) for url in urls],
        return_exceptions=True
    )
    
    return {"results": results}
```

---

## **3. Multi-GPU ML Pipeline**

### **3.1 Embedding Manager (Multi-GPU Optimized)**
```python
# backend/app/ml/embeddings.py
import torch
import torch.nn as nn
from torch.nn.parallel import DataParallel
import asyncio
import numpy as np
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from transformers import CLIPModel, CLIPProcessor
from sentence_transformers import SentenceTransformer
import logging

@dataclass
class EmbeddingResult:
    text_embedding: np.ndarray
    image_embeddings: List[np.ndarray]
    fused_embedding: np.ndarray
    metadata: Dict[str, Any]

class MultiGPUEmbedder(nn.Module):
    """Multi-GPU embedding generation using DataParallel"""
    
    def __init__(self, device_ids: List[int]):
        super().__init__()
        
        # Load CLIP model for multimodal embeddings
        self.clip_model = CLIPModel.from_pretrained(
            "openai/clip-vit-large-patch14",
            torch_dtype=torch.float16  # Use FP16 for memory efficiency
        )
        self.clip_processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-large-patch14"
        )
        
        # Load sentence transformer for text-only embeddings
        self.text_model = SentenceTransformer(
            'all-MiniLM-L6-v2',
            device=f'cuda:{device_ids[0]}'
        )
        
        # Enable multi-GPU processing
        if len(device_ids) > 1:
            self.clip_model = DataParallel(
                self.clip_model, 
                device_ids=device_ids
            )
        
        self.device_ids = device_ids
        self.primary_device = f'cuda:{device_ids[0]}'
        self.clip_model.to(self.primary_device)
        
    def forward(self, text: str, images: List[np.ndarray]) -> torch.Tensor:
        """Forward pass for embedding generation"""
        embeddings = []
        
        # Process text
        if text:
            text_emb = self.text_model.encode(
                text, 
                convert_to_tensor=True,
                device=self.primary_device
            )
            embeddings.append(text_emb)
        
        # Process images using CLIP
        if images:
            # Batch process images across GPUs
            image_inputs = self.clip_processor(
                images=images,
                return_tensors="pt",
                padding=True
            ).to(self.primary_device)
            
            with torch.no_grad():
                image_features = self.clip_model.get_image_features(**image_inputs)
                embeddings.append(image_features.mean(dim=0))
        
        # Fuse embeddings
        if len(embeddings) > 1:
            # Simple concatenation + projection
            fused = torch.cat(embeddings, dim=-1)
            # Project to standard 512-dim space
            fused = torch.nn.functional.normalize(fused, dim=-1)
        else:
            fused = embeddings[0] if embeddings else torch.zeros(512)
        
        return fused

class EmbeddingManager:
    """Async wrapper for multi-GPU embedding generation"""
    
    def __init__(self, device_ids: List[int], batch_size: int = 32):
        self.device_ids = device_ids
        self.batch_size = batch_size
        self.model = None
        self.logger = logging.getLogger(__name__)
        
        # Pre-allocate GPU memory
        self._warmup_gpus()
    
    def _warmup_gpus(self):
        """Pre-allocate GPU memory for consistent performance"""
        for device_id in self.device_ids:
            with torch.cuda.device(device_id):
                # Allocate some memory to avoid cold start
                dummy = torch.randn(1000, 1000, device=f'cuda:{device_id}')
                del dummy
                torch.cuda.empty_cache()
    
    async def load_models(self):
        """Load models asynchronously"""
        loop = asyncio.get_event_loop()
        
        # Load models in thread pool to avoid blocking
        self.model = await loop.run_in_executor(
            None, 
            lambda: MultiGPUEmbedder(self.device_ids)
        )
        
        self.logger.info(f"Loaded models on GPUs: {self.device_ids}")
    
    async def generate_embeddings(
        self, 
        text_content: str, 
        images: List[np.ndarray],
        layout_info: Optional[Dict] = None
    ) -> EmbeddingResult:
        """Generate embeddings asynchronously"""
        
        start_time = asyncio.get_event_loop().time()
        
        # Run embedding generation in thread pool
        loop = asyncio.get_event_loop()
        fused_embedding = await loop.run_in_executor(
            None,
            self._generate_sync,
            text_content,
            images
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return EmbeddingResult(
            text_embedding=fused_embedding[:384],  # Text portion
            image_embeddings=[fused_embedding[384:]],  # Image portion
            fused_embedding=fused_embedding,
            metadata={
                "processing_time": processing_time,
                "num_images": len(images),
                "text_length": len(text_content),
                "gpus_used": self.device_ids
            }
        )
    
    def _generate_sync(self, text: str, images: List[np.ndarray]) -> np.ndarray:
        """Synchronous embedding generation"""
        with torch.inference_mode():
            embedding_tensor = self.model(text, images)
            return embedding_tensor.cpu().numpy()
    
    async def cleanup(self):
        """Cleanup GPU memory"""
        if self.model:
            del self.model
            for device_id in self.device_ids:
                torch.cuda.empty_cache()
```

### **3.2 Content Extraction with Playwright**
```python
# backend/app/ml/content_extractor.py
import asyncio
from playwright.async_api import async_playwright, Page, Browser
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import aiohttp
import logging

@dataclass
class ExtractedContent:
    text: str
    images: List[np.ndarray]
    layout: Dict[str, Any]
    metadata: Dict[str, Any]
    analysis: Dict[str, Any]

class ContentExtractor:
    """Playwright-based content extraction with parallel processing"""
    
    def __init__(self):
        self.browser = None
        self.semaphore = asyncio.Semaphore(8)  # Limit concurrent extractions
        self.logger = logging.getLogger(__name__)
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._cleanup_browser()
    
    async def _init_browser(self):
        """Initialize Playwright browser"""
        if not self.browser:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                ]
            )
    
    async def _cleanup_browser(self):
        """Cleanup browser resources"""
        if self.browser:
            await self.browser.close()
            self.browser = None
    
    async def extract_content(
        self, 
        url: str, 
        include_images: bool = True,
        timeout: int = 30
    ) -> ExtractedContent:
        """Extract multimodal content from webpage"""
        
        async with self.semaphore:  # Limit concurrent extractions
            if not self.browser:
                await self._init_browser()
            
            context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            page = await context.new_page()
            
            try:
                # Navigate with timeout
                await page.goto(url, timeout=timeout * 1000, wait_until='networkidle')
                
                # Extract content in parallel
                tasks = [
                    self._extract_text(page),
                    self._extract_images(page) if include_images else asyncio.create_task(self._empty_images()),
                    self._extract_layout(page),
                    self._extract_metadata(page)
                ]
                
                text, images, layout, metadata = await asyncio.gather(*tasks)
                
                # Analyze extracted content
                analysis = await self._analyze_content(text, images, layout)
                
                return ExtractedContent(
                    text=text,
                    images=images,
                    layout=layout,
                    metadata=metadata,
                    analysis=analysis
                )
                
            except Exception as e:
                self.logger.error(f"Content extraction failed for {url}: {str(e)}")
                raise
            finally:
                await context.close()
    
    async def _extract_text(self, page: Page) -> str:
        """Extract and clean text content"""
        
        # Remove unwanted elements
        await page.evaluate("""
            () => {
                const unwanted = document.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement');
                unwanted.forEach(el => el.remove());
            }
        """)
        
        # Extract main content
        text_content = await page.evaluate("""
            () => {
                const content = document.querySelector('main, article, .content, .post, .entry') || document.body;
                return content.innerText;
            }
        """)
        
        return self._clean_text(text_content)
    
    async def _extract_images(self, page: Page) -> List[np.ndarray]:
        """Extract and process images"""
        
        # Get all relevant images
        image_urls = await page.evaluate("""
            () => {
                const images = Array.from(document.querySelectorAll('img'));
                return images
                    .filter(img => img.width > 100 && img.height > 100)  // Filter small images
                    .map(img => img.src)
                    .filter(src => src.startsWith('http'))
                    .slice(0, 10);  // Limit to first 10 images
            }
        """)
        
        # Download and process images in parallel
        images = []
        if image_urls:
            tasks = [self._download_image(url) for url in image_urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            images = [
                result for result in results 
                if isinstance(result, np.ndarray)
            ]
        
        return images
    
    async def _empty_images(self) -> List[np.ndarray]:
        """Return empty image list when images not requested"""
        return []
    
    async def _download_image(self, url: str) -> Optional[np.ndarray]:
        """Download and convert image to numpy array"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        image = Image.open(io.BytesIO(image_data))
                        
                        # Convert to RGB and resize
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        
                        # Resize for consistency (CLIP expects 224x224)
                        image = image.resize((224, 224))
                        return np.array(image)
                        
        except Exception as e:
            self.logger.warning(f"Failed to download image {url}: {str(e)}")
        
        return None
    
    async def _extract_layout(self, page: Page) -> Dict[str, Any]:
        """Analyze page layout and structure"""
        
        layout_info = await page.evaluate("""
            () => {
                const body = document.body;
                const viewport = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                
                const elements = {
                    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                    paragraphs: document.querySelectorAll('p').length,
                    images: document.querySelectorAll('img').length,
                    links: document.querySelectorAll('a').length,
                    lists: document.querySelectorAll('ul, ol').length
                };
                
                return {
                    viewport,
                    elements,
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    keywords: document.querySelector('meta[name="keywords"]')?.content || ''
                };
            }
        """)
        
        return layout_info
    
    async def _extract_metadata(self, page: Page) -> Dict[str, Any]:
        """Extract page metadata"""
        
        metadata = await page.evaluate("""
            () => {
                const metas = Array.from(document.querySelectorAll('meta'));
                const metaData = {};
                
                metas.forEach(meta => {
                    const name = meta.getAttribute('name') || meta.getAttribute('property');
                    const content = meta.getAttribute('content');
                    if (name && content) {
                        metaData[name] = content;
                    }
                });
                
                return {
                    title: document.title,
                    url: window.location.href,
                    meta: metaData,
                    timestamp: new Date().toISOString()
                };
            }
        """)
        
        return metadata
    
    async def _analyze_content(
        self, 
        text: str, 
        images: List[np.ndarray], 
        layout: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze extracted content for insights"""
        
        analysis = {
            "text_stats": {
                "word_count": len(text.split()),
                "char_count": len(text),
                "avg_word_length": np.mean([len(word) for word in text.split()]) if text else 0,
                "sentence_count": text.count('.') + text.count('!') + text.count('?')
            },
            "image_stats": {
                "count": len(images),
                "avg_size": np.mean([img.size for img in images]) if images else 0
            },
            "layout_stats": layout.get("elements", {}),
            "content_type": self._classify_content_type(text, layout),
            "language": "en",  # Could implement language detection
            "readability": self._calculate_readability(text)
        }
        
        return analysis
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Basic text cleaning
        import re
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?;:-]', '', text)
        
        return text.strip()
    
    def _classify_content_type(self, text: str, layout: Dict[str, Any]) -> str:
        """Classify the type of content (article, ecommerce, etc.)"""
        
        # Simple heuristic-based classification
        elements = layout.get("elements", {})
        
        if "product" in text.lower() or "buy" in text.lower() or "price" in text.lower():
            return "ecommerce"
        elif elements.get("headings", 0) > 3 and len(text.split()) > 500:
            return "article"
        elif "video" in text.lower() or "watch" in text.lower():
            return "media"
        elif "contact" in text.lower() or "about" in text.lower():
            return "corporate"
        else:
            return "general"
    
    def _calculate_readability(self, text: str) -> Dict[str, float]:
        """Calculate basic readability metrics"""
        
        if not text:
            return {"flesch_score": 0, "avg_sentence_length": 0}
        
        words = text.split()
        sentences = text.count('.') + text.count('!') + text.count('?')
        
        if sentences == 0:
            sentences = 1
        
        avg_sentence_length = len(words) / sentences
        
        # Simplified Flesch reading ease (rough approximation)
        syllables = sum([self._count_syllables(word) for word in words])
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * (syllables / len(words)))
        
        return {
            "flesch_score": max(0, min(100, flesch_score)),
            "avg_sentence_length": avg_sentence_length
        }
    
    def _count_syllables(self, word: str) -> int:
        """Rough syllable counting"""
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        
        if word[0] in vowels:
            count += 1
        
        for index in range(1, len(word)):
            if word[index] in vowels and word[index - 1] not in vowels:
                count += 1
        
        if word.endswith("e"):
            count -= 1
        
        if count == 0:
            count += 1
        
        return count
```

### **3.3 ChromaDB Vector Search Engine**
```python
# backend/app/ml/vector_search.py
import chromadb
from chromadb.config import Settings
import numpy as np
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
import aiofiles

@dataclass
class SearchMatch:
    category_id: str
    category_name: str
    similarity_score: float
    confidence: float
    metadata: Dict[str, Any]

class VectorSearchEngine:
    """ChromaDB-based vector search for ad categories"""
    
    def __init__(
        self, 
        persist_directory: str = "./data/chroma_db",
        collection_name: str = "ad_categories"
    ):
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self.logger = logging.getLogger(__name__)
        
        # Performance optimization settings
        self.chroma_settings = Settings(
            persist_directory=persist_directory,
            chroma_db_impl="duckdb+parquet",  # Fast local storage
            anonymized_telemetry=False
        )
    
    async def initialize(self):
        """Initialize ChromaDB client and collection"""
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=self.chroma_settings
        )
        
        # Get or create collection with custom embedding function
        try:
            self.collection = self.client.get_collection(
                name=self.collection_name
            )
            self.logger.info(f"Loaded existing collection: {self.collection_name}")
        except ValueError:
            # Collection doesn't exist, create it
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Ad category embeddings for contextual targeting"}
            )
            
            # Load ad taxonomy data
            await self._load_ad_taxonomy()
            self.logger.info(f"Created new collection: {self.collection_name}")
    
    async def _load_ad_taxonomy(self):
        """Load real ad taxonomy data into ChromaDB"""
        
        # Load IAB categories + Google Ads categories
        taxonomy_data = await self._load_taxonomy_data()
        
        if not taxonomy_data:
            self.logger.warning("No taxonomy data found, using sample categories")
            taxonomy_data = self._get_sample_categories()
        
        # Prepare data for ChromaDB
        documents = []
        metadatas = []
        ids = []
        
        for category in taxonomy_data:
            documents.append(category["description"])
            metadatas.append({
                "category_name": category["name"],
                "category_id": category["id"],
                "taxonomy_source": category.get("source", "unknown"),
                "parent_category": category.get("parent", ""),
                "level": category.get("level", 1)
            })
            ids.append(category["id"])
        
        # Add to collection in batches (ChromaDB is more efficient this way)
        batch_size = 1000
        for i in range(0, len(documents), batch_size):
            batch_end = min(i + batch_size, len(documents))
            
            self.collection.add(
                documents=documents[i:batch_end],
                metadatas=metadatas[i:batch_end],
                ids=ids[i:batch_end]
            )
        
        self.logger.info(f"Loaded {len(documents)} ad categories into ChromaDB")
    
    async def _load_taxonomy_data(self) -> List[Dict[str, Any]]:
        """Load real ad taxonomy from data files"""
        
        taxonomy_files = [
            "./data/iab_categories.json",
            "./data/google_ad_categories.json",
            "./data/custom_categories.json"
        ]
        
        all_categories = []
        
        for file_path in taxonomy_files:
            try:
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    all_categories.extend(data.get("categories", []))
                    self.logger.info(f"Loaded {len(data.get('categories', []))} categories from {file_path}")
            except FileNotFoundError:
                self.logger.warning(f"Taxonomy file not found: {file_path}")
            except Exception as e:
                self.logger.error(f"Error loading taxonomy from {file_path}: {str(e)}")
        
        return all_categories
    
    def _get_sample_categories(self) -> List[Dict[str, Any]]:
        """Fallback sample categories if real taxonomy not available"""
        
        return [
            {"id": "automotive_1", "name": "Automotive - Electric Vehicles", "description": "Electric cars, hybrid vehicles, charging stations, sustainable transportation", "source": "sample"},
            {"id": "automotive_2", "name": "Automotive - Luxury Cars", "description": "Luxury vehicles, premium automotive brands, high-end car features", "source": "sample"},
            {"id": "tech_1", "name": "Technology - Consumer Electronics", "description": "Smartphones, laptops, gadgets, consumer technology products", "source": "sample"},
            {"id": "tech_2", "name": "Technology - Software", "description": "Software applications, SaaS products, productivity tools, enterprise software", "source": "sample"},
            {"id": "finance_1", "name": "Finance - Investment", "description": "Investment services, wealth management, trading platforms, financial advisors", "source": "sample"},
            {"id": "finance_2", "name": "Finance - Banking", "description": "Banking services, credit cards, loans, financial institutions", "source": "sample"},
            {"id": "health_1", "name": "Health - Fitness", "description": "Fitness equipment, gym memberships, workout programs, health tracking", "source": "sample"},
            {"id": "health_2", "name": "Health - Medical", "description": "Healthcare services, medical devices, pharmaceuticals, health insurance", "source": "sample"},
            {"id": "retail_1", "name": "Retail - Fashion", "description": "Clothing, shoes, accessories, fashion brands, apparel", "source": "sample"},
            {"id": "retail_2", "name": "Retail - Home & Garden", "description": "Home improvement, furniture, gardening supplies, home decor", "source": "sample"},
            {"id": "travel_1", "name": "Travel - Hotels", "description": "Hotel bookings, accommodation, vacation rentals, hospitality", "source": "sample"},
            {"id": "travel_2", "name": "Travel - Airlines", "description": "Flight bookings, airlines, air travel, vacation packages", "source": "sample"},
            {"id": "food_1", "name": "Food - Restaurants", "description": "Restaurant dining, food delivery, culinary experiences, local dining", "source": "sample"},
            {"id": "food_2", "name": "Food - Groceries", "description": "Grocery shopping, food products, cooking ingredients, meal planning", "source": "sample"},
            {"id": "entertainment_1", "name": "Entertainment - Streaming", "description": "Video streaming, music streaming, digital entertainment, media services", "source": "sample"},
            {"id": "entertainment_2", "name": "Entertainment - Gaming", "description": "Video games, gaming consoles, gaming accessories, esports", "source": "sample"}
        ]
    
    async def search_similar(
        self, 
        embedding: np.ndarray, 
        top_k: int = 10,
        min_confidence: float = 0.5
    ) -> List[SearchMatch]:
        """Search for similar ad categories using vector similarity"""
        
        if self.collection is None:
            raise RuntimeError("VectorSearchEngine not initialized")
        
        # Convert numpy array to list for ChromaDB
        query_embedding = embedding.tolist()
        
        # Perform vector search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2,  # Get more results to filter by confidence
            include=["metadatas", "documents", "distances"]
        )
        
        # Process results
        matches = []
        if results["ids"] and results["ids"][0]:
            for i, (category_id, metadata, document, distance) in enumerate(zip(
                results["ids"][0],
                results["metadatas"][0],
                results["documents"][0],
                results["distances"][0]
            )):
                # Convert distance to similarity score (ChromaDB uses L2 distance)
                similarity_score = 1.0 / (1.0 + distance)
                
                # Calculate confidence based on similarity and position
                confidence = similarity_score * (1.0 - (i * 0.05))  # Slight penalty for lower ranks
                
                if confidence >= min_confidence:
                    matches.append(SearchMatch(
                        category_id=category_id,
                        category_name=metadata.get("category_name", "Unknown"),
                        similarity_score=similarity_score,
                        confidence=confidence,
                        metadata={
                            "description": document,
                            "source": metadata.get("taxonomy_source", "unknown"),
                            "parent_category": metadata.get("parent_category", ""),
                            "level": metadata.get("level", 1),
                            "distance": distance
                        }
                    ))
        
        # Sort by confidence and limit to top_k
        matches.sort(key=lambda x: x.confidence, reverse=True)
        return matches[:top_k]
    
    async def add_custom_category(
        self, 
        category_id: str, 
        name: str, 
        description: str,
        metadata: Dict[str, Any] = None
    ):
        """Add a custom ad category to the collection"""
        
        if self.collection is None:
            raise RuntimeError("VectorSearchEngine not initialized")
        
        metadata = metadata or {}
        metadata.update({
            "category_name": name,
            "category_id": category_id,
            "taxonomy_source": "custom"
        })
        
        self.collection.add(
            documents=[description],
            metadatas=[metadata],
            ids=[category_id]
        )
        
        self.logger.info(f"Added custom category: {category_id}")
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the current collection"""
        
        if self.collection is None:
            return {"error": "Collection not initialized"}
        
        count = self.collection.count()
        
        # Get sample of categories for analysis
        sample_results = self.collection.query(
            query_embeddings=[[0.0] * 512],  # Dummy query to get sample
            n_results=min(100, count),
            include=["metadatas"]
        )
        
        # Analyze taxonomy sources
        sources = {}
        if sample_results["metadatas"] and sample_results["metadatas"][0]:
            for metadata in sample_results["metadatas"][0]:
                source = metadata.get("taxonomy_source", "unknown")
                sources[source] = sources.get(source, 0) + 1
        
        return {
            "total_categories": count,
            "taxonomy_sources": sources,
            "collection_name": self.collection_name,
            "persist_directory": self.persist_directory
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.client:
            # ChromaDB automatically persists, no explicit cleanup needed
            self.logger.info("ChromaDB cleanup completed")

---

## **4. Frontend Architecture (React)**

### **4.1 React Project Structure**
```javascript
// frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/                    // Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Progress.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── analysis/              // Analysis-specific components
│   │   │   ├── URLInput.jsx
│   │   │   ├── ProcessingStatus.jsx
│   │   │   ├── ResultsDashboard.jsx
│   │   │   └── CategoryMatch.jsx
│   │   ├── visualization/         // Data visualization components
│   │   │   ├── ConfidenceChart.jsx
│   │   │   ├── EmbeddingPlot.jsx
│   │   │   ├── PerformanceMetrics.jsx
│   │   │   └── ComparisonView.jsx
│   │   └── demo/                  // Demo scenarios
│   │       ├── DemoSelector.jsx
│   │       └── DemoResults.jsx
│   ├── hooks/                     // Custom React hooks
│   │   ├── useWebSocket.js
│   │   ├── useAnalysis.js
│   │   └── usePerformance.js
│   ├── services/                  // API and external services
│   │   ├── api.js
│   │   ├── websocket.js
│   │   └── utils.js
│   ├── styles/                    // CSS and styling
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── animations.css
│   ├── utils/                     // Utility functions
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx                    // Main application component
│   ├── index.js                   // Application entry point
│   └── setupTests.js              // Test configuration
├── package.json
└── tailwind.config.js             // Tailwind CSS configuration
```

### **4.2 Main Application Component**
```javascript
// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { ChakraProvider, extendTheme, Box, Container } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

import URLInput from './components/analysis/URLInput';
import ProcessingStatus from './components/analysis/ProcessingStatus';
import ResultsDashboard from './components/analysis/ResultsDashboard';
import DemoSelector from './components/demo/DemoSelector';
import PerformanceMetrics from './components/visualization/PerformanceMetrics';

import { useAnalysis } from './hooks/useAnalysis';
import { useWebSocket } from './hooks/useWebSocket';

// Custom Chakra UI theme with glassmorphism
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('input'); // input, processing, results
  const [analysisData, setAnalysisData] = useState(null);
  
  const {
    analyzeURL,
    isLoading,
    error,
    progress
  } = useAnalysis();
  
  const { connectionStatus, lastMessage } = useWebSocket({
    url: 'ws://localhost:8000/ws/frontend-client',
    onMessage: (data) => {
      if (data.type === 'progress_update') {
        // Handle real-time progress updates
        console.log('Progress update:', data.progress);
      }
    }
  });

  const handleAnalysis = async (url, options = {}) => {
    setCurrentView('processing');
    
    try {
      const result = await analyzeURL(url, options);
      setAnalysisData(result);
      setCurrentView('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      setCurrentView('input');
    }
  };

  const handleReset = () => {
    setCurrentView('input');
    setAnalysisData(null);
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minHeight="100vh" position="relative" overflow="hidden">
        {/* Animated background particles */}
        <ParticleBackground />
        
        <Container maxW="7xl" py={8}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box textAlign="center" mb={12}>
              <motion.h1
                className="text-6xl font-bold text-white mb-4"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                🎯 Contextual Targeting 2025
              </motion.h1>
              <motion.p
                className="text-xl text-white/80 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Real-Time Multimodal Content Analysis for Post-Cookie Advertising
              </motion.p>
            </Box>
          </motion.div>

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
            {currentView === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <URLInput onAnalyze={handleAnalysis} />
                <DemoSelector onSelectDemo={handleAnalysis} />
              </motion.div>
            )}

            {currentView === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
              >
                <ProcessingStatus 
                  progress={progress}
                  isLoading={isLoading}
                  onCancel={handleReset}
                />
              </motion.div>
            )}

            {currentView === 'results' && analysisData && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <ResultsDashboard 
                  data={analysisData}
                  onReset={handleReset}
                />
                <PerformanceMetrics data={analysisData} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Status Indicator */}
          <motion.div
            className="fixed bottom-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <ConnectionIndicator status={connectionStatus} />
          </motion.div>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

// Particle background component for visual appeal
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated particles using CSS */}
      <div className="particles">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Connection status indicator
const ConnectionIndicator = ({ status }) => {
  const statusColors = {
    connected: 'green',
    connecting: 'yellow',
    disconnected: 'red'
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      bg="rgba(0,0,0,0.3)"
      backdropFilter="blur(10px)"
      px={3}
      py={2}
      borderRadius="full"
      color="white"
      fontSize="sm"
    >
      <Box
        w={2}
        h={2}
        borderRadius="full"
        bg={statusColors[status]}
        mr={2}
        className={status === 'connected' ? 'animate-pulse' : ''}
      />
      WebSocket: {status}
    </Box>
  );
};

export default App;
```

### **4.3 Dazzling URL Input Component**
```javascript
// frontend/src/components/analysis/URLInput.jsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Tooltip,
  FormControl,
  FormLabel,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Card,
  CardBody
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiLink, FiZap, FiSettings } from 'react-icons/fi';

const URLInput = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    includeImages: true,
    topK: 10,
    minConfidence: 0.5,
    timeout: 30
  });
  
  const inputRef = useRef(null);
  const toast = useToast();

  const validateUrl = (urlString) => {
    try {
      new URL(urlString);
      return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(validateUrl(newUrl));
  };

  const handleAnalyze = () => {
    if (!isValidUrl) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid HTTP or HTTPS URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onAnalyze(url, options);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isValidUrl) {
      handleAnalyze();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card maxW="4xl" mx="auto" mb={8}>
        <CardBody p={8}>
          <VStack spacing={6}>
            {/* Main URL Input */}
            <Box w="100%" position="relative">
              <FormControl>
                <FormLabel color="white" fontSize="lg" fontWeight="semibold">
                  Enter Webpage URL
                </FormLabel>
                <HStack>
                  <Box position="relative" flex="1">
                    <Input
                      ref={inputRef}
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={handleUrlChange}
                      onKeyPress={handleKeyPress}
                      size="lg"
                      bg="rgba(255,255,255,0.1)"
                      border="2px solid"
                      borderColor={
                        url ? (isValidUrl ? 'green.400' : 'red.400') : 'gray.600'
                      }
                      color="white"
                      _placeholder={{ color: 'gray.400' }}
                      _focus={{
                        borderColor: 'blue.400',
                        boxShadow: '0 0 0 1px blue.400',
                      }}
                      pr={12}
                    />
                    <Box
                      position="absolute"
                      right={4}
                      top="50%"
                      transform="translateY(-50%)"
                    >
                      <FiLink 
                        color={isValidUrl ? '#48BB78' : '#A0AEC0'} 
                        size={20} 
                      />
                    </Box>
                  </Box>
                  
                  <Tooltip label="Analyze webpage content" hasArrow>
                    <Button
                      onClick={handleAnalyze}
                      isDisabled={!isValidUrl}
                      size="lg"
                      px={8}
                      bg="linear-gradient(45deg, #667eea, #764ba2)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(45deg, #5a67d8, #6b46c1)",
                        transform: 'translateY(-2px)',
                      }}
                      _disabled={{
                        opacity: 0.5,
                        cursor: 'not-allowed',
                      }}
                      leftIcon={<FiZap />}
                      className="analyze-button"
                    >
                      Analyze
                    </Button>
                  </Tooltip>
                </HStack>
              </FormControl>
            </Box>

            {/* Advanced Options Toggle */}
            <HStack w="100%" justify="space-between">
              <Text color="white" fontSize="sm">
                Advanced Options
              </Text>
              <Switch
                isChecked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
                colorScheme="blue"
              />
            </HStack>

            {/* Advanced Options Panel */}
            <motion.div
              initial={false}
              animate={{
                height: showAdvanced ? 'auto' : 0,
                opacity: showAdvanced ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', width: '100%' }}
            >
              <VStack spacing={4} w="100%" pt={4}>
                <HStack w="100%" justify="space-between">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel color="white" fontSize="sm" mb={0}>
                      Include Images
                    </FormLabel>
                    <Switch
                      isChecked={options.includeImages}
                      onChange={(e) =>
                        setOptions({ ...options, includeImages: e.target.checked })
                      }
                      colorScheme="green"
                    />
                  </FormControl>
                </HStack>

                <Box w="100%">
                  <FormLabel color="white" fontSize="sm">
                    Results Count: {options.topK}
                  </FormLabel>
                  <Slider
                    value={options.topK}
                    onChange={(value) => setOptions({ ...options, topK: value })}
                    min={5}
                    max={20}
                    step={1}
                    colorScheme="blue"
                  >
                    <SliderTrack bg="gray.600">
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>

                <Box w="100%">
                  <FormLabel color="white" fontSize="sm">
                    Min Confidence: {(options.minConfidence * 100).toFixed(0)}%
                  </FormLabel>
                  <Slider
                    value={options.minConfidence}
                    onChange={(value) =>
                      setOptions({ ...options, minConfidence: value })
                    }
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    colorScheme="purple"
                  >
                    <SliderTrack bg="gray.600">
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </VStack>
            </motion.div>
          </VStack>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default URLInput;
```

---

## **5. Performance Optimization Strategy**

### **5.1 Multi-GPU Utilization**
```python
# Leverage all 4x RTX 3090 cards
GPU_STRATEGY = {
    "embedding_generation": {
        "clip_model": ["cuda:0", "cuda:1"],      # 2 GPUs for CLIP
        "text_model": ["cuda:2"],                # 1 GPU for sentence transformers
        "fusion_model": ["cuda:3"]               # 1 GPU for multimodal fusion
    },
    "memory_optimization": {
        "model_parallelism": True,               # Split large models across GPUs
        "gradient_checkpointing": True,          # Save memory during inference
        "mixed_precision": True,                 # Use FP16 for speed
        "batch_processing": True                 # Process multiple requests together
    }
}
```

### **5.2 CPU Parallelization (64-core EPYC)**
```python
# Maximize CPU utilization
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

CPU_STRATEGY = {
    "content_extraction": {
        "playwright_workers": 16,               # 16 parallel browser instances
        "image_processing": 32,                 # 32 threads for image downloading
        "text_processing": 16                   # 16 processes for NLP tasks
    },
    "data_preprocessing": {
        "parallel_tokenization": True,
        "async_io": True,                       # AsyncIO for I/O bound tasks
        "worker_processes": min(mp.cpu_count(), 32)
    }
}

# Example implementation
async def parallel_content_extraction(urls: List[str]) -> List[ExtractedContent]:
    semaphore = asyncio.Semaphore(16)  # Limit concurrent extractions
    
    async def extract_single(url: str):
        async with semaphore:
            extractor = ContentExtractor()
            return await extractor.extract_content(url)
    
    tasks = [extract_single(url) for url in urls]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

### **5.3 Memory Optimization (512GB RAM)**
```python
# Leverage massive RAM for caching
MEMORY_STRATEGY = {
    "embedding_cache": {
        "capacity": "50GB",                     # Cache 50GB of embeddings
        "eviction_policy": "LRU",
        "persistence": True                     # Persist cache to disk
    },
    "content_cache": {
        "capacity": "20GB",                     # Cache extracted content
        "compression": "lz4",                   # Fast compression
        "ttl": 3600                            # 1 hour TTL
    },
    "model_cache": {
        "preload_models": True,                # Keep models in memory
        "shared_memory": True                  # Share between processes
    }
}

# Redis configuration for caching
REDIS_CONFIG = {
    "maxmemory": "100gb",                      # Use 100GB for Redis
    "maxmemory-policy": "allkeys-lru",
    "save": "900 1 300 10 60 10000",          # Persistence settings
}
```

---

## **6. Real