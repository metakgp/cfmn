#!/bin/bash

# CFMN Development Shutdown Script
# This script gracefully stops all development services

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           CFMN Development Environment Shutdown               ║"
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

# Stop backend server
stop_backend() {
    print_section "Stopping Backend Server"

    # Check if tmux session exists
    if tmux has-session -t cfmn-backend 2>/dev/null; then
        tmux kill-session -t cfmn-backend
        print_success "Backend server stopped (tmux session killed)"
    else
        print_info "Backend tmux session not found"

        # Fallback: check for running processes
        if pgrep -f "cargo.*run" > /dev/null || pgrep -f "cargo-watch" > /dev/null; then
            print_warning "Found backend process running outside tmux, attempting to kill..."
            pkill -f "cargo-watch" || pkill -f "cargo.*run"
            sleep 1
            if pgrep -f "cargo.*run" > /dev/null || pgrep -f "cargo-watch" > /dev/null; then
                print_error "Failed to stop backend process. Kill manually with: pkill -9 -f cargo-watch"
            else
                print_success "Backend process stopped"
            fi
        else
            print_success "No backend process found"
        fi
    fi
}

# Stop frontend server
stop_frontend() {
    print_section "Stopping Frontend Dev Server"

    # Check if tmux session exists
    if tmux has-session -t cfmn-frontend 2>/dev/null; then
        tmux kill-session -t cfmn-frontend
        print_success "Frontend dev server stopped (tmux session killed)"
    else
        print_info "Frontend tmux session not found"

        # Fallback: check for running processes
        if pgrep -f "vite" > /dev/null; then
            print_warning "Found frontend process running outside tmux, attempting to kill..."
            pkill -f "vite"
            sleep 1
            if pgrep -f "vite" > /dev/null; then
                print_error "Failed to stop frontend process. Kill manually with: pkill -9 -f vite"
            else
                print_success "Frontend process stopped"
            fi
        else
            print_success "No frontend process found"
        fi
    fi
}

# Stop database container
stop_database() {
    print_section "Stopping PostgreSQL Database"

    cd "${PROJECT_ROOT}"

    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q '^cfmn-dev-db$'; then
        # Stop and remove the container
        if command_exists docker-compose; then
            docker-compose -f docker-compose.dev.yml down
        else
            docker compose -f docker-compose.dev.yml down
        fi
        print_success "PostgreSQL container stopped and removed"
    else
        print_info "Database container is not running"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════════╗"
    echo -e "║                                                                ║"
    echo -e "║                 ✓ Shutdown Complete!                           ║"
    echo -e "║                                                                ║"
    echo -e "╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    print_section "Status Summary"
    echo -e "  ${GREEN}✓${NC} Backend server stopped"
    echo -e "  ${GREEN}✓${NC} Frontend dev server stopped"
    echo -e "  ${GREEN}✓${NC} PostgreSQL container stopped"
    echo ""

    print_section "To Restart Development Environment"
    echo -e "  ${CYAN}./dev-startup.sh${NC}"
    echo ""

    print_info "All services have been shut down cleanly."
    echo ""
}

# Main execution
main() {
    print_banner
    stop_backend
    stop_frontend
    stop_database
    print_summary
}

# Run main function
main
