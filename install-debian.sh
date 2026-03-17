#!/bin/bash

# وكيل المرجع الذكي - سكريبت التثبيت لـ Debian
# Installation script for Debian-based systems
# 
# © 2026 رضوان دالي حمدوني

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     وكيل المرجع الذكي - تثبيت Debian                       ║"
echo "║     Al-Marjaa AI Agent - Debian Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  لا ينصح بالتشغيل كمدير (root)"
  echo "سيتم المتابعة لكن يفضل استخدام مستخدم عادي"
  echo ""
fi

# Install system dependencies
echo "📦 تثبيت المتطلبات الأساسية..."
sudo apt update
sudo apt install -y curl git build-essential pkg-config libssl-dev

# Install Node.js
echo "📦 تثبيت Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "✓ Node.js $(node --version)"

# Install Bun
echo "📦 تثبيت Bun..."
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  source ~/.bashrc 2>/dev/null || source ~/.profile 2>/dev/null || true
fi
export PATH="$HOME/.bun/bin:$PATH"
echo "✓ Bun $(bun --version)"

# Install Rust
echo "📦 تثبيت Rust..."
if ! command -v rustc &> /dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env" 2>/dev/null || true
fi
export PATH="$HOME/.cargo/bin:$PATH"
echo "✓ Rust $(rustc --version)"

# Install project dependencies
echo "📦 تثبيت تبعيات المشروع..."
cd "$(dirname "$0")"
bun install

# Create sandbox directory
echo "📁 إنشاء مجلد العمل..."
mkdir -p sandbox

# Initialize database
echo "🗄️ تهيئة قاعدة البيانات..."
bun run db:push

# Start terminal service
echo "🔧 تشغيل خدمة الطرفية..."
cd mini-services/terminal-controller
bun install
nohup bun index.ts > /tmp/terminal-service.log 2>&1 &
cd ../..

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ اكتمل التثبيت!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 للتشغيل:"
echo "   bun run dev"
echo ""
echo "🌐 الواجهة: http://localhost:3000"
echo "⚡ الطرفية: http://localhost:3030"
echo ""
