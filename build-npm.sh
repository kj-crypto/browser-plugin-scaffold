#!/usr/bin/env bash
set -e
set -x

# ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}../")" && pwd)"
ROOT_DIR="$(pwd)"
home="$ROOT_DIR/plugin"

echo "🚀 Starting npm package build process..."

echo "📦 Compiling TypeScript..."
cd $home
npm run lint
npm run test
npm run build
cd ..

echo "📂 Preparing dist/configs folder..."
mkdir -p "$home/dist/configs"

echo "💾 Copying static configuration files..."
cp -R $ROOT_DIR/configs/* "$home/dist/configs/"

echo "📦 Packaging via npm pack..."
cd $home
npm pack
cd ..

mv $home/*.tgz .

echo "✅ Npm package built successfully!"
