# Contributing to ContextMind

Thank you for your interest in contributing to ContextMind! We welcome contributions from the community and are excited to collaborate with you.

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Git** for version control
- **NVIDIA GPU** with CUDA (recommended for ML performance)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/contextmind.git
   cd contextmind
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m playwright install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Start Development Servers**
   ```bash
   # Option 1: One command (from project root)
   ./start_demo.sh
   
   # Option 2: Manual (separate terminals)
   # Terminal 1: Backend
   cd backend && source venv/bin/activate && python run_server.py --dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

## 🛠 Development Guidelines

### Code Style

#### **Backend (Python)**
- **PEP 8** compliance with 88-character line limit
- **Type hints** for all function signatures
- **Docstrings** for all classes and functions
- **pytest** for testing

#### **Frontend (TypeScript/React)**
- **ESLint + Prettier** configuration
- **TypeScript strict mode** enabled
- **Material-UI** component patterns
- **React Testing Library** for testing

### Project Structure

```
ContextMind/
├── backend/                 # FastAPI ML backend
│   ├── app/                # Application code
│   ├── scripts/            # Utility scripts
│   ├── tests/              # Test suites
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
└── docs/                  # Documentation
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Start both servers first
npm run test:integration
```

## 📝 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clear, concise commit messages
   - Include tests for new functionality
   - Update documentation as needed

3. **Test Thoroughly**
   - Run all test suites
   - Test frontend and backend integration
   - Verify performance hasn't regressed

4. **Submit Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## 🎯 Areas for Contribution

### **High Priority**
- [ ] **Performance Optimization**: Vector search improvements
- [ ] **Model Integration**: Additional embedding models
- [ ] **Scalability**: Kubernetes deployment configs
- [ ] **Testing**: Comprehensive test coverage

### **Medium Priority**
- [ ] **UI/UX**: Additional dashboard components
- [ ] **Analytics**: Advanced performance metrics
- [ ] **Documentation**: API guides and tutorials
- [ ] **Monitoring**: Prometheus/Grafana integration

### **Good First Issues**
- [ ] **Bug Fixes**: Minor UI/backend issues
- [ ] **Documentation**: README improvements
- [ ] **Examples**: Usage examples and demos
- [ ] **Configuration**: Environment setup scripts

## 📊 Performance Standards

Contributions should maintain or improve:

- **Vector Search**: Sub-10ms response times
- **API Throughput**: 500+ queries per second
- **Frontend Load**: <3 seconds initial page load
- **Memory Usage**: Efficient GPU memory management

## 🐛 Bug Reports

When filing a bug report, please include:

1. **Environment Details**
   - OS and version
   - Python/Node.js versions
   - GPU hardware (if applicable)

2. **Reproduction Steps**
   - Minimal code example
   - Expected vs actual behavior
   - Error messages/logs

3. **System Context**
   - Backend/frontend logs
   - Performance metrics
   - Browser console errors (for frontend)

## 💡 Feature Requests

For feature requests, please provide:

1. **Use Case**: Why is this feature needed?
2. **Implementation**: How should it work?
3. **Impact**: Who would benefit?
4. **Alternatives**: Other solutions considered?

## 📚 Documentation

### Code Documentation
- **Inline comments** for complex logic
- **API documentation** using OpenAPI/Swagger
- **Component docs** with usage examples

### User Documentation
- **README updates** for new features
- **Tutorial guides** for common use cases
- **API reference** documentation

## 🌍 Community

### Communication Channels
- **GitHub Discussions**: For questions and ideas
- **Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

### Code of Conduct
We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub repository** insights

## 📈 Roadmap

### **Q1 2025**
- [ ] WebSocket real-time updates
- [ ] Batch processing improvements
- [ ] Advanced analytics dashboard

### **Q2 2025**
- [ ] Mobile app support
- [ ] Cloud deployment templates
- [ ] Multi-language support

### **Q3 2025**
- [ ] Enterprise features
- [ ] Advanced ML models
- [ ] Performance optimizations

## 🤝 Getting Help

- **Documentation**: Check existing docs first
- **GitHub Discussions**: Ask questions
- **Issues**: Search existing issues
- **Code Review**: Learn from pull requests

Thank you for contributing to ContextMind! Together we're building the future of contextual advertising. 🚀

---

*ContextMind: Open-source contextual AI platform* 