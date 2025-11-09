#!/bin/bash

# CFMN Development Startup Script
# This script sets up the development environment and starts all required services

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# Print banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║             CFMN Development Environment Setup                ║"
    echo "║           Can't Find My Notes - MetaKGP Project               ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print section header
print_section() {
    echo -e "\n${BLUE}${BOLD}▶ $1${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"

    local missing_prereqs=0

    # Check Docker
    if command_exists docker; then
        print_success "Docker is installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
    else
        print_error "Docker is not installed"
        print_info "Install from: https://docs.docker.com/get-docker/"
        missing_prereqs=1
    fi

    # Check docker-compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if command_exists docker-compose; then
            print_success "docker-compose is installed ($(docker-compose --version | cut -d' ' -f4 | tr -d ','))"
        else
            print_success "docker compose plugin is installed"
        fi
    else
        print_error "docker-compose is not installed"
        print_info "Install from: https://docs.docker.com/compose/install/"
        missing_prereqs=1
    fi

    # Check Rust
    if command_exists cargo; then
        print_success "Rust is installed ($(rustc --version | cut -d' ' -f2))"
    else
        print_error "Rust is not installed"
        print_info "Install from: https://rustup.rs/"
        missing_prereqs=1
    fi

    # Check Node.js
    if command_exists node; then
        print_success "Node.js is installed ($(node --version))"
    else
        print_error "Node.js is not installed"
        print_info "Install from: https://nodejs.org/"
        missing_prereqs=1
    fi

    # Check npm
    if command_exists npm; then
        print_success "npm is installed ($(npm --version))"
    else
        print_error "npm is not installed (should come with Node.js)"
        missing_prereqs=1
    fi

    if [ $missing_prereqs -eq 1 ]; then
        echo ""
        print_error "Please install missing prerequisites and try again"
        exit 1
    fi
}

# Install development tools
install_dev_tools() {
    print_section "Installing Development Tools"

    # Check and install sqlx-cli
    if command_exists sqlx; then
        print_success "sqlx-cli is already installed"
    else
        print_warning "sqlx-cli not found, installing..."
        cargo install sqlx-cli --no-default-features --features postgres
        print_success "sqlx-cli installed successfully"
    fi

    # Check and install cargo-watch
    if command_exists cargo-watch; then
        print_success "cargo-watch is already installed"
    else
        print_warning "cargo-watch not found, installing..."
        cargo install cargo-watch
        print_success "cargo-watch installed successfully"
    fi
}

# Validate environment files
validate_env_files() {
    print_section "Validating Environment Files"

    local missing_env=0

    # Check root .env
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        print_success "Root .env file exists"
    else
        print_error "Root .env file not found"
        if [ -f "${PROJECT_ROOT}/.env.template" ]; then
            print_info "Copy .env.template to .env and configure it"
            print_info "  cp .env.template .env"
        fi
        missing_env=1
    fi

    # Check frontend .env.local
    if [ -f "${FRONTEND_DIR}/.env.local" ]; then
        print_success "Frontend .env.local file exists"
    else
        print_warning "Frontend .env.local file not found"
        if [ -f "${FRONTEND_DIR}/.env.local.template" ]; then
            print_info "Copy .env.local.template to .env.local and configure it"
            print_info "  cp frontend/.env.local.template frontend/.env.local"
        else
            print_info "Create frontend/.env.local with required variables"
        fi
        missing_env=1
    fi

    if [ $missing_env -eq 1 ]; then
        echo ""
        print_error "Please create missing environment files and try again"
        exit 1
    fi
}

# Create required directories
create_directories() {
    print_section "Creating Required Directories"

    # Read STATIC_FILE_STORAGE_LOCATION from .env
    source "${PROJECT_ROOT}/.env" 2>/dev/null || true

    # Default paths if not set in .env
    STATIC_STORAGE="${STATIC_FILE_STORAGE_LOCATION:-${HOME}/static}"
    # Extract directory from LOG_LOCATION file path (e.g., /path/to/backend.log -> /path/to)
    LOG_FILE="${LOG_LOCATION:-${HOME}/log/backend.log}"
    LOG_DIR="$(dirname "${LOG_FILE}")"

    # Create directories
    mkdir -p "${STATIC_STORAGE}/cfmn/notes/uploaded"
    mkdir -p "${STATIC_STORAGE}/cfmn/previews/uploaded"
    mkdir -p "${LOG_DIR}"

    print_success "Created directory: ${STATIC_STORAGE}/cfmn/notes/uploaded"
    print_success "Created directory: ${STATIC_STORAGE}/cfmn/previews/uploaded"
    print_success "Created directory: ${LOG_DIR}"
}

# Start PostgreSQL container
start_database() {
    print_section "Starting PostgreSQL Database"

    cd "${PROJECT_ROOT}"

    # Check if container is already running
    if docker ps --format '{{.Names}}' | grep -q '^cfmn-dev-db$'; then
        print_warning "Database container is already running"
        return 0
    fi

    # Start the container
    if command_exists docker-compose; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker compose -f docker-compose.dev.yml up -d
    fi

    print_success "PostgreSQL container started"

    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec cfmn-dev-db pg_isready -U user -d cfmn >/dev/null 2>&1; then
            print_success "Database is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -n "."
    done

    echo ""
    print_error "Database failed to start within ${max_attempts} seconds"
    exit 1
}

# Run database migrations
run_migrations() {
    print_section "Running Database Migrations"

    cd "${BACKEND_DIR}"

    # Source the .env file for database connection
    set -a
    source "${PROJECT_ROOT}/.env"
    set +a

    # Construct DATABASE_URL
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

    # Run migrations
    if sqlx migrate run; then
        print_success "Database migrations completed"
    else
        print_error "Failed to run migrations"
        exit 1
    fi

    cd "${PROJECT_ROOT}"
}

# Check if frontend dependencies are installed
check_frontend_deps() {
    print_section "Checking Frontend Dependencies"

    cd "${FRONTEND_DIR}"

    if [ ! -d "node_modules" ]; then
        print_warning "Frontend dependencies not installed, installing..."
        npm install
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies are installed"
    fi

    cd "${PROJECT_ROOT}"
}

# Check if tmux is installed
check_tmux() {
    if ! command_exists tmux; then
        print_warning "tmux is not installed, installing..."

        # Detect OS and install tmux
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command_exists apt-get; then
                sudo apt-get update && sudo apt-get install -y tmux
            elif command_exists yum; then
                sudo yum install -y tmux
            elif command_exists pacman; then
                sudo pacman -S --noconfirm tmux
            else
                print_error "Could not install tmux automatically. Please install it manually."
                exit 1
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew install tmux
            else
                print_error "Homebrew not found. Please install tmux manually: brew install tmux"
                exit 1
            fi
        fi

        print_success "tmux installed successfully"
    fi
}

# Start backend server
start_backend() {
    print_section "Starting Backend Server"

    # Check if session already exists
    if tmux has-session -t cfmn-backend 2>/dev/null; then
        print_warning "Backend session already exists, killing old session..."
        tmux kill-session -t cfmn-backend
    fi

    # Create new tmux session for backend
    cd "${BACKEND_DIR}"
    tmux new-session -d -s cfmn-backend -n backend

    # Load environment and start cargo watch
    tmux send-keys -t cfmn-backend "cd ${BACKEND_DIR}" C-m
    tmux send-keys -t cfmn-backend "export \$(cat ${PROJECT_ROOT}/.env | xargs)" C-m
    tmux send-keys -t cfmn-backend "cargo watch -x run" C-m

    print_success "Backend server started in tmux session 'cfmn-backend'"

    # Wait a moment for cargo to start
    sleep 2
}

# Start frontend server
start_frontend() {
    print_section "Starting Frontend Dev Server"

    # Check if session already exists
    if tmux has-session -t cfmn-frontend 2>/dev/null; then
        print_warning "Frontend session already exists, killing old session..."
        tmux kill-session -t cfmn-frontend
    fi

    # Create new tmux session for frontend
    cd "${FRONTEND_DIR}"
    tmux new-session -d -s cfmn-frontend -n frontend

    # Start vite dev server
    tmux send-keys -t cfmn-frontend "cd ${FRONTEND_DIR}" C-m
    tmux send-keys -t cfmn-frontend "npm run dev" C-m

    print_success "Frontend dev server started in tmux session 'cfmn-frontend'"

    # Wait a moment for vite to start
    sleep 3
}

# Print instructions
print_instructions() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════════╗"
    echo -e "║                                                                ║"
    echo -e "║              ✓ Development Environment Running!                ║"
    echo -e "║                                                                ║"
    echo -e "╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    print_section "Running Services"
    echo -e "  ${GREEN}✓${NC} PostgreSQL: Running in Docker container"
    echo -e "  ${GREEN}✓${NC} Backend API: Running with cargo-watch (auto-reload)"
    echo -e "  ${GREEN}✓${NC} Frontend: Running with Vite dev server (HMR enabled)"
    echo ""

    print_section "Service URLs"
    echo -e "  ${BOLD}Frontend:${NC}     ${CYAN}http://localhost:5173${NC}"
    echo -e "  ${BOLD}Backend API:${NC}  ${CYAN}http://localhost:8085${NC}"
    echo -e "  ${BOLD}Database:${NC}     ${CYAN}postgresql://localhost:5432/cfmn${NC}"
    echo ""

    print_section "View Service Logs"
    echo -e "  ${BOLD}Backend logs:${NC}   ${CYAN}tmux attach -t cfmn-backend${NC}"
    echo -e "  ${BOLD}Frontend logs:${NC}  ${CYAN}tmux attach -t cfmn-frontend${NC}"
    echo -e "  ${BOLD}Database logs:${NC}  ${CYAN}docker logs -f cfmn-dev-db${NC}"
    echo ""
    echo -e "  ${YELLOW}Tip: Press Ctrl+B then D to detach from tmux session${NC}"
    echo ""

    print_section "Manage Services"
    echo -e "  ${BOLD}Stop all:${NC}           ${CYAN}./dev-shutdown.sh${NC}"
    echo -e "  ${BOLD}Restart backend:${NC}    ${CYAN}tmux send-keys -t cfmn-backend C-c 'cargo watch -x run' C-m${NC}"
    echo -e "  ${BOLD}Restart frontend:${NC}   ${CYAN}tmux send-keys -t cfmn-frontend C-c 'npm run dev' C-m${NC}"
    echo -e "  ${BOLD}List sessions:${NC}      ${CYAN}tmux ls${NC}"
    echo ""

    print_section "Useful Commands"
    echo -e "  ${BOLD}Connect to DB:${NC}        ${CYAN}docker exec -it cfmn-dev-db psql -U user -d cfmn${NC}"
    echo -e "  ${BOLD}Run migrations:${NC}       ${CYAN}cd backend && sqlx migrate run${NC}"
    echo -e "  ${BOLD}Prepare SQLx offline:${NC} ${CYAN}cd backend && cargo sqlx prepare${NC}"
    echo ""

    print_info "Happy coding! 🚀"
    print_info "All services are running in the background. Check the logs using tmux attach commands above."
    echo ""
}

# Main execution
main() {
    print_banner
    check_prerequisites
    check_tmux
    install_dev_tools
    validate_env_files
    create_directories
    start_database
    run_migrations
    check_frontend_deps
    start_backend
    start_frontend
    print_instructions
}

# Run main function
main
