"""
Multi-GPU Embedding System for ContextMind
Implements multimodal content understanding with CLIP + Sentence Transformers
"""

import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import time
from dataclasses import dataclass
from PIL import Image
import requests
from io import BytesIO

# ML Models
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
import cv2

# GPU monitoring
import GPUtil


@dataclass
class ContentBundle:
    """Container for multimodal content"""
    url: str
    text: str
    images: List[Image.Image]
    image_urls: List[str]
    metadata: Dict[str, Any]
    
    def __post_init__(self):
        if not self.images:
            self.images = []
        if not self.image_urls:
            self.image_urls = []
        if not self.metadata:
            self.metadata = {}


@dataclass
class EmbeddingResult:
    """Result container for embedding generation"""
    text_embedding: np.ndarray
    image_embeddings: List[np.ndarray]
    fused_embedding: np.ndarray
    processing_time: float
    metadata: Dict[str, Any]


class AttentionFusion(nn.Module):
    """Attention-based fusion of multimodal embeddings"""
    
    def __init__(self, text_dim: int = 384, image_dim: int = 512, output_dim: int = 512):
        super().__init__()
        self.text_dim = text_dim
        self.image_dim = image_dim
        self.output_dim = output_dim
        
        # Projection layers
        self.text_proj = nn.Linear(text_dim, output_dim)
        self.image_proj = nn.Linear(image_dim, output_dim)
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(output_dim, num_heads=8, batch_first=True)
        
        # Final fusion layers
        self.fusion_layer = nn.Sequential(
            nn.Linear(output_dim, output_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(output_dim, output_dim),
            nn.LayerNorm(output_dim)
        )
        
    def forward(self, text_emb: torch.Tensor, image_embs: List[torch.Tensor]) -> torch.Tensor:
        """
        Fuse text and image embeddings using attention
        
        Args:
            text_emb: Text embedding [1, text_dim]
            image_embs: List of image embeddings [1, image_dim]
        
        Returns:
            Fused embedding [1, output_dim]
        """
        batch_size = text_emb.shape[0]
        
        # Project embeddings to common dimension
        text_proj = self.text_proj(text_emb)  # [1, output_dim]
        
        if image_embs:
            # Stack and project image embeddings
            image_stack = torch.stack(image_embs)  # [num_images, 1, image_dim]
            image_stack = image_stack.squeeze(1)   # [num_images, image_dim]
            image_proj = self.image_proj(image_stack)  # [num_images, output_dim]
            
            # Combine text and image embeddings for attention
            all_embs = torch.cat([text_proj, image_proj], dim=0)  # [1+num_images, output_dim]
            all_embs = all_embs.unsqueeze(0)  # [1, 1+num_images, output_dim]
            
            # Apply self-attention
            attended, _ = self.attention(all_embs, all_embs, all_embs)
            
            # Global average pooling
            fused = attended.mean(dim=1)  # [1, output_dim]
        else:
            # Only text available
            fused = text_proj
        
        # Final fusion
        output = self.fusion_layer(fused)
        return output


class MultiGPUEmbedder:
    """
    Multi-GPU embedding system for contextual targeting
    - GPU 0-1: CLIP model (DataParallel)
    - GPU 2: Sentence transformers  
    - GPU 3: Multimodal fusion + inference
    """
    
    def __init__(self, device_ids: List[int] = [0, 1, 2, 3]):
        self.device_ids = device_ids
        self.clip_devices = device_ids[:2]  # GPUs 0-1 for CLIP
        self.text_device = device_ids[2]    # GPU 2 for sentence transformers
        self.fusion_device = device_ids[3]  # GPU 3 for fusion
        
        print(f"🔧 Initializing MultiGPU Embedder on devices: {device_ids}")
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize all models across GPUs"""
        print("📥 Loading models...")
        
        # CLIP Model (GPU 0-1 with DataParallel)
        print("  • Loading CLIP model...")
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
        
        if len(self.clip_devices) > 1:
            self.clip_model = nn.DataParallel(self.clip_model, device_ids=self.clip_devices)
        self.clip_model = self.clip_model.to(f"cuda:{self.clip_devices[0]}")
        self.clip_model.eval()
        
        # Sentence Transformer (GPU 2)
        print("  • Loading Sentence Transformer...")
        self.text_encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.text_encoder = self.text_encoder.to(f"cuda:{self.text_device}")
        
        # Fusion Layer (GPU 3)
        print("  • Initializing Fusion Layer...")
        self.fusion_layer = AttentionFusion(
            text_dim=384,  # all-MiniLM-L6-v2 output
            image_dim=768, # CLIP ViT-Large output
            output_dim=512
        )
        self.fusion_layer = self.fusion_layer.to(f"cuda:{self.fusion_device}")
        self.fusion_layer.eval()
        
        print("✅ All models loaded successfully")
        self._log_gpu_usage()
    
    def _log_gpu_usage(self):
        """Log current GPU memory usage"""
        gpus = GPUtil.getGPUs()
        print("\n📊 GPU Memory Usage:")
        for i, gpu in enumerate(gpus):
            if i in self.device_ids:
                print(f"  GPU {i}: {gpu.memoryUsed}MB / {gpu.memoryTotal}MB ({gpu.memoryUsed/gpu.memoryTotal*100:.1f}%)")
    
    async def embed_content(self, content: ContentBundle) -> EmbeddingResult:
        """
        Generate multimodal embeddings for content
        
        Args:
            content: ContentBundle with text and images
            
        Returns:
            EmbeddingResult with all embeddings and metadata
        """
        start_time = time.time()
        
        print(f"🧠 Generating embeddings for: {content.url}")
        
        # Generate text embedding (GPU 2)
        text_embedding = await self._embed_text(content.text)
        
        # Generate image embeddings (GPU 0-1)
        image_embeddings = await self._embed_images(content.images)
        
        # Fuse embeddings (GPU 3)
        fused_embedding = await self._fuse_embeddings(text_embedding, image_embeddings)
        
        processing_time = time.time() - start_time
        
        result = EmbeddingResult(
            text_embedding=text_embedding,
            image_embeddings=image_embeddings,
            fused_embedding=fused_embedding,
            processing_time=processing_time,
            metadata={
                "text_length": len(content.text),
                "num_images": len(content.images),
                "url": content.url
            }
        )
        
        print(f"✅ Embeddings generated in {processing_time:.2f}s")
        return result
    
    async def _embed_text(self, text: str) -> np.ndarray:
        """Generate text embedding using Sentence Transformer on GPU 2"""
        if not text.strip():
            # Return zero embedding for empty text
            return np.zeros(384, dtype=np.float32)
        
        with torch.no_grad():
            # Encode text
            embedding = self.text_encoder.encode([text], device=f"cuda:{self.text_device}")
            return embedding[0].astype(np.float32)
    
    async def _embed_images(self, images: List[Image.Image]) -> List[np.ndarray]:
        """Generate image embeddings using CLIP on GPU 0-1"""
        if not images:
            return []
        
        embeddings = []
        
        with torch.no_grad():
            for image in images:
                try:
                    # Preprocess image
                    inputs = self.clip_processor(images=image, return_tensors="pt")
                    inputs = {k: v.to(f"cuda:{self.clip_devices[0]}") for k, v in inputs.items()}
                    
                    # Get image features
                    image_features = self.clip_model.get_image_features(**inputs)
                    
                    # Normalize and convert to numpy
                    image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                    embedding = image_features.cpu().numpy()[0].astype(np.float32)
                    embeddings.append(embedding)
                    
                except Exception as e:
                    print(f"⚠️ Error processing image: {e}")
                    # Add zero embedding for failed images
                    embeddings.append(np.zeros(768, dtype=np.float32))
        
        return embeddings
    
    async def _fuse_embeddings(self, text_emb: np.ndarray, image_embs: List[np.ndarray]) -> np.ndarray:
        """Fuse text and image embeddings using attention fusion on GPU 3"""
        
        with torch.no_grad():
            # Convert to tensors
            text_tensor = torch.from_numpy(text_emb).unsqueeze(0).to(f"cuda:{self.fusion_device}")
            
            image_tensors = []
            for img_emb in image_embs:
                img_tensor = torch.from_numpy(img_emb).unsqueeze(0).to(f"cuda:{self.fusion_device}")
                image_tensors.append(img_tensor)
            
            # Apply fusion
            fused = self.fusion_layer(text_tensor, image_tensors)
            
            # Normalize output
            fused = fused / fused.norm(dim=-1, keepdim=True)
            
            return fused.cpu().numpy()[0].astype(np.float32)
    
    def get_embedding_dim(self) -> int:
        """Get the dimension of fused embeddings"""
        return 512
    
    async def embed_text_only(self, text: str) -> np.ndarray:
        """Generate embedding for text-only content"""
        content = ContentBundle(
            url="text_only",
            text=text,
            images=[],
            image_urls=[],
            metadata={}
        )
        result = await self.embed_content(content)
        return result.fused_embedding
    
    async def embed_categories(self, categories: List[Dict[str, Any]]) -> List[np.ndarray]:
        """Generate embeddings for ad categories"""
        print("🎯 Generating category embeddings...")
        
        embeddings = []
        for i, category in enumerate(categories):
            # Create text description for category
            text = f"{category['name']} {category['description']} {' '.join(category['keywords'])}"
            
            embedding = await self.embed_text_only(text)
            embeddings.append(embedding)
            
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(categories)} categories")
        
        print(f"✅ Generated embeddings for {len(categories)} categories")
        return embeddings
    
    def cleanup(self):
        """Clean up GPU memory"""
        if hasattr(self, 'clip_model'):
            del self.clip_model
        if hasattr(self, 'text_encoder'):
            del self.text_encoder
        if hasattr(self, 'fusion_layer'):
            del self.fusion_layer
        
        torch.cuda.empty_cache()
        print("🧹 GPU memory cleaned up") 