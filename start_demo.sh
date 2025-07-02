#!/bin/bash

# ContextMind Demo Startup Script
echo "🧠 Starting ContextMind Demo..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the ContextMind project root directory"
    exit 1
fi

print_status "Checking project structure..."
print_success "Found backend and frontend directories"

# Start Backend Server
print_status "Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Please run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Start backend in background with skip checks for demo
print_status "Activating virtual environment and starting backend..."
source venv/bin/activate

# Start with minimal checks for demo purposes
print_status "Starting FastAPI server on http://localhost:8000..."
python run_server.py --dev --skip-checks &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

cd ..

# Start Frontend Server  
print_status "Starting frontend development server..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Running npm install..."
    npm install
fi

print_status "Starting React development server on http://localhost:3000..."
npm start &
FRONTEND_PID=$!

cd ..

# Wait for servers to start
sleep 5

print_success "================================"
print_success "🎉 ContextMind Demo Started!"
print_success "================================"
echo ""
print_status "🔗 Frontend: http://localhost:3000"
print_status "🔗 Backend:  http://localhost:8000"
print_status "📚 API Docs: http://localhost:8000/docs"
echo ""
print_status "Backend PID: $BACKEND_PID"
print_status "Frontend PID: $FRONTEND_PID"
echo ""
print_warning "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    print_status "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_success "Servers stopped. Goodbye!"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup INT

# Wait for user to stop
wait 