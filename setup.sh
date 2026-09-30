#!/usr/bin/env bash
# JanSetu AI - 1-Click Automated Setup for Linux / macOS / Cloud Shell
set -e

echo "========================================================"
echo "   JanSetu AI (जनसेतु) - 1-Click Automated Setup"
echo "========================================================"

if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js v18+ (Node v20+ recommended) from https://nodejs.org/"
    exit 1
fi

node scripts/setup.js
