#!/bin/bash

clear
echo "════════════════════════════════════════════════"
echo "   🚀 IPTV PANEL - SERVER SETUP"
echo "════════════════════════════════════════════════"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please don't run as root. Run as normal user with sudo privileges."
    exit 1
fi

echo "📋 This script will:"
echo "   1. Install Node.js 18+"
echo "   2. Install PM2"
echo "   3. Setup the IPTV Panel"
echo "   4. Configure firewall"
echo "   5. Start the application"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "════════════════════════════════════════════════"
echo "📦 Step 1: Installing Node.js..."
echo "════════════════════════════════════════════════"

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js already installed: $NODE_VERSION"
else
    echo "📥 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    if [ $? -eq 0 ]; then
        echo "✅ Node.js installed: $(node --version)"
    else
        echo "❌ Failed to install Node.js"
        exit 1
    fi
fi

echo ""
echo "════════════════════════════════════════════════"
echo "📦 Step 2: Installing PM2..."
echo "════════════════════════════════════════════════"

if command -v pm2 &> /dev/null; then
    echo "✅ PM2 already installed"
else
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    
    if [ $? -eq 0 ]; then
        echo "✅ PM2 installed"
    else
        echo "❌ Failed to install PM2"
        exit 1
    fi
fi

echo ""
echo "════════════════════════════════════════════════"
echo "📁 Step 3: Project Setup..."
echo "════════════════════════════════════════════════"

# Check if project exists
if [ -d "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "❌ Error: Not in project directory"
    echo "   Please run this script from the iptv-panel directory"
    exit 1
fi

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
P2P_ENABLED=true
HIDDEN_LAYER_ENABLED=true
MAX_PEERS=50
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "🔥 Step 4: Configuring Firewall..."
echo "════════════════════════════════════════════════"

if command -v ufw &> /dev/null; then
    echo "🔒 Configuring UFW..."
    sudo ufw allow 3000/tcp
    sudo ufw allow 22/tcp  # Keep SSH open
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not installed, skipping firewall configuration"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "🚀 Step 5: Starting Application..."
echo "════════════════════════════════════════════════"

# Stop if already running
pm2 stop iptv-panel 2>/dev/null

# Start with PM2
pm2 start server.js --name iptv-panel

if [ $? -eq 0 ]; then
    # Setup auto-start
    pm2 startup | grep "sudo" | bash
    pm2 save
    
    echo ""
    echo "════════════════════════════════════════════════"
    echo "   ✅ SETUP COMPLETE!"
    echo "════════════════════════════════════════════════"
    echo ""
    echo "🌐 Access your panel:"
    echo "   Local: http://localhost:3000"
    echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "🔐 Demo Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: pm2 logs iptv-panel"
    echo "   Restart: pm2 restart iptv-panel"
    echo "   Stop: pm2 stop iptv-panel"
    echo "   Monitor: pm2 monit"
    echo ""
    echo "════════════════════════════════════════════════"
else
    echo ""
    echo "❌ Failed to start application"
    echo "   Check logs: pm2 logs"
    exit 1
fi
