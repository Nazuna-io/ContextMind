# ContextMind Quick Start Guide

## 🚀 Get ContextMind Running in 3 Steps

### Prerequisites
- Python 3.11+ with pip
- NVIDIA GPU with CUDA support (optional but recommended)
- 8GB+ RAM
- Linux/macOS environment

---

## Step 1: Setup Environment

```bash
# Clone and navigate to project
cd ContextMind/backend

# Create and activate virtual environment  
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install
```

## Step 2: Initialize the System

```bash
# Create ad taxonomy (one-time setup)
python scripts/create_taxonomy.py

# Test the ML pipeline
python scripts/test_ml_pipeline.py

# Test the complete pipeline  
python scripts/test_pipeline.py
```

## Step 3: Start the API Server

```bash
# Development mode (with auto-reload)
python run_server.py --dev

# Production mode
python run_server.py --prod

# Custom configuration
python run_server.py --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🧪 Quick Test

Once the server is running, test it:

```bash
# Basic connectivity
curl http://localhost:8000/ping

# System health
curl http://localhost:8000/api/v1/health

# Analyze a URL
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "top_k": 5}'

# Quick demo
curl "http://localhost:8000/api/v1/demo?url=https://example.com"
```

---

## 📊 Web Interface

Open in your browser:
- **Landing Page**: http://localhost:8000/
- **API Documentation**: http://localhost:8000/docs  
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

---

## 🛠️ Advanced Testing

```bash
# Complete API test suite
python scripts/test_api.py

# Performance benchmarks
curl http://localhost:8000/api/v1/performance

# Batch analysis
curl -X POST "http://localhost:8000/api/v1/analyze/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com", "https://httpbin.org/html"],
    "top_k": 3
  }'
```

---

## 🔧 Troubleshooting

### Common Issues

1. **GPU Memory Issues**
   ```bash
   # Check GPU usage
   nvidia-smi
   
   # Reduce batch sizes in config if needed
   ```

2. **Port Already in Use**
   ```bash
   # Use different port
   python run_server.py --port 8001
   ```

3. **Dependencies Missing**
   ```bash
   # Reinstall requirements
   pip install -r requirements.txt --upgrade
   ```

4. **Playwright Issues**
   ```bash
   # Reinstall browsers
   playwright install --force
   ```

### Performance Optimization

- **Single GPU**: Set `device_ids=[0]` in configuration
- **CPU Only**: Models will automatically fall back to CPU
- **Memory Issues**: Reduce `max_concurrent_extractions` parameter

---

## 📈 Expected Performance

### With GPU (Recommended)
- **Initialization**: ~5-10 seconds
- **Single URL Analysis**: ~1-4 seconds  
- **Vector Search**: ~1-4ms
- **Throughput**: 680+ queries/second

### CPU Only
- **Initialization**: ~15-30 seconds
- **Single URL Analysis**: ~5-15 seconds
- **Vector Search**: ~10-50ms  
- **Throughput**: 20-100 queries/second

---

## 🎯 Production Deployment

### Environment Variables
```bash
export CONTEXTMIND_HOST=0.0.0.0
export CONTEXTMIND_PORT=8000
export CONTEXTMIND_WORKERS=4
```

### Docker (Coming Soon)
```bash
# Build and run container
docker build -t contextmind .
docker run -p 8000:8000 --gpus all contextmind
```

### Load Balancing
- Use multiple worker processes
- Deploy behind nginx/Apache
- Scale horizontally with container orchestration

---

## 📞 Support

- **Issues**: Check logs in `contextmind.log`
- **Performance**: Use `/api/v1/performance` endpoint
- **Health**: Monitor `/api/v1/health` endpoint
- **Debug**: Run with `--reload` for development

---

**🎉 You're now ready to analyze web content with ContextMind!** 