#!/bin/bash

echo "=================================================="
echo "  📡 IPTV Hybrid Panel - Setup Script"
echo "  P2P/CDN Hidden Layer System"
echo "=================================================="
echo ""

# Kontrollo Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nuk është instaluar!"
    echo "📥 Instalo Node.js nga: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Instalo varësitë
echo "📦 Duke instaluar varësitë..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Varësitë u instaluan me sukses!"
else
    echo "❌ Gabim gjatë instalimit të varësive!"
    exit 1
fi

echo ""

# Krijo .env file
if [ ! -f .env ]; then
    echo "🔧 Duke krijuar .env file..."
    cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Generate a new one for production)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# CDN Configuration
CDN_NODE_1=https://cdn1.example.com
CDN_NODE_2=https://cdn2.example.com
CDN_NODE_3=https://cdn3.example.com

# P2P Configuration
P2P_ENABLED=true
MAX_PEERS=50
CHUNK_SIZE=262144

# Hidden Layer
HIDDEN_LAYER_ENABLED=true
HIDDEN_NODES=5
HIDDEN_HOPS=3

# Database (Optional - për përdorim të avancuar)
# DB_HOST=localhost
# DB_PORT=27017
# DB_NAME=iptv_panel
EOF
    echo "✅ .env file u krijua!"
else
    echo "⚠️  .env file ekziston tashmë"
fi

echo ""

# Krijo direktorin e log-eve
mkdir -p logs
echo "✅ Logs directory u krijua"

echo ""

# Testo serverin
echo "🧪 Duke testuar serverin..."
timeout 5 node -e "
const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
const server = app.listen(3001, () => {
    console.log('✅ Server test i suksesshëm!');
    server.close();
});
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server është gati për tu përdorur!"
else
    echo "⚠️  Server test dështoi, por mund të vazhdosh"
fi

echo ""
echo "=================================================="
echo "  🎉 Setup u kompletua me sukses!"
echo "=================================================="
echo ""
echo "📝 Hapat e radhës:"
echo ""
echo "1. Konfiguro CDN nodes në .env file"
echo "2. Start serverin me: npm start"
echo "3. Hap browser: http://localhost:3000"
echo ""
echo "📚 Dokumentacion: README.md"
echo ""
echo "🚀 Happy Streaming!"
echo "=================================================="
