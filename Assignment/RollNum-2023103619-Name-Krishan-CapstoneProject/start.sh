#!/bin/zsh
# Start the FastAPI backend and React frontend for the fullstack chatbot

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set directories
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo -e "${BLUE}🚀 Starting FastAPI-React TypeScript Chatbot${NC}"
echo -e "${BLUE}============================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js/npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Setup and start backend
echo -e "\n${YELLOW}📦 Setting up backend dependencies...${NC}"
cd "$BACKEND_DIR"

# Use .venv if it exists, otherwise create it
if [ ! -f "$BACKEND_DIR/.venv/bin/python" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv "$BACKEND_DIR/.venv"
    "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements_sqlite.txt" -q
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo -e "${YELLOW}🔥 Starting FastAPI backend server...${NC}"

# Start backend using .venv
"$BACKEND_DIR/.venv/bin/uvicorn" main_sqlite:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Setup and start frontend
echo -e "\n${YELLOW}📦 Setting up frontend dependencies...${NC}"
cd "$FRONTEND_DIR"

# Install npm dependencies
npm install

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo -e "${YELLOW}🚀 Starting React frontend server...${NC}"

# Start frontend
npm start &
FRONTEND_PID=$!

echo -e "\n${GREEN}🎉 Both servers are starting up!${NC}"
echo -e "${BLUE}Backend: http://localhost:8000${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}API Docs: http://localhost:8000/docs${NC}"

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🔄 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
