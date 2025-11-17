# 🚀 Deployment Guide - IPTV Hybrid Panel

## Opsionet e Deployment

### 1. 💻 Local Development

```bash
# 1. Instalo dependencies
npm install

# 2. Konfiguro environment
cp .env.example .env
# Ndrysho variablat në .env

# 3. Start serverin
npm start
```

Server: `http://localhost:3000`

---

### 2. 🐳 Docker Deployment (Rekomanduar)

#### Quick Start
```bash
# Build dhe start containers
docker-compose up -d

# Shiko logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Manual Build
```bash
# Build image
docker build -t iptv-hybrid-panel .

# Run container
docker run -d \
  --name iptv-panel \
  -p 3000:3000 \
  -e NODE_ENV=production \
  iptv-hybrid-panel
```

---

### 3. ☁️ Cloud Deployment

#### AWS EC2

```bash
# 1. Lidhu me EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Instalo Docker
sudo apt update
sudo apt install docker.io docker-compose -y

# 3. Clone projektin
git clone <your-repo-url>
cd iptv-panel

# 4. Start me Docker
docker-compose up -d

# 5. Konfiguro Security Group
# - Port 3000 (HTTP)
# - Port 80/443 (për Nginx)
```

#### DigitalOcean Droplet

```bash
# 1. Krijo Droplet (Ubuntu 22.04)
# 2. SSH në droplet
ssh root@your-droplet-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Clone dhe deploy
git clone <your-repo-url>
cd iptv-panel
docker-compose up -d
```

#### Heroku

```bash
# 1. Login në Heroku
heroku login

# 2. Krijo app
heroku create iptv-hybrid-panel

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set P2P_ENABLED=true

# 4. Deploy
git push heroku main
```

#### Google Cloud Run

```bash
# 1. Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/iptv-panel

# 2. Deploy
gcloud run deploy iptv-panel \
  --image gcr.io/YOUR_PROJECT_ID/iptv-panel \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated
```

---

### 4. 🔧 VPS Setup (Ubuntu/Debian)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Instalo Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalo PM2
sudo npm install -g pm2

# 4. Clone projektin
git clone <your-repo-url>
cd iptv-panel

# 5. Install dependencies
npm install

# 6. Konfiguro environment
nano .env
# Shto konfigurimin

# 7. Start me PM2
pm2 start server.js --name iptv-panel

# 8. Setup auto-start
pm2 startup
pm2 save

# 9. Konfiguro Nginx (optional)
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/iptv-panel
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/iptv-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Rekomanduar)

```bash
# 1. Instalo Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Merr SSL certificate
sudo certbot --nginx -d your-domain.com

# 3. Auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs iptv-panel
pm2 restart iptv-panel
```

### Docker Monitoring
```bash
docker stats iptv-hybrid-panel
docker logs -f iptv-hybrid-panel
```

---

## 🔧 Environment Variables

Variablat kryesore që duhet të konfigurosh:

```env
# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key-here

# CDN Nodes
CDN_NODE_1=https://cdn1.example.com
CDN_NODE_2=https://cdn2.example.com
CDN_NODE_3=https://cdn3.example.com

# P2P
P2P_ENABLED=true
MAX_PEERS=50
CHUNK_SIZE=262144

# Hidden Layer
HIDDEN_LAYER_ENABLED=true
HIDDEN_NODES=5
HIDDEN_HOPS=3

# Database (optional)
DB_HOST=localhost
DB_PORT=27017
DB_NAME=iptv_panel
```

---

## 🔥 Performance Tuning

### Node.js Optimization
```bash
# Increase memory limit
node --max-old-space-size=4096 server.js

# PM2 cluster mode
pm2 start server.js -i max --name iptv-panel
```

### Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g 
                 inactive=60m use_temp_path=off;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
}
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Gjej procesin
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix permissions
sudo chown -R $USER:$USER /path/to/iptv-panel
chmod +x setup.sh
```

### WebSocket Connection Issues
- Kontrollo firewall settings
- Verify proxy configuration për WebSocket
- Test me: `wscat -c ws://your-domain.com`

---

## 📝 Post-Deployment Checklist

- [ ] Update CDN URLs në .env
- [ ] Configure firewall rules
- [ ] Setup SSL certificate
- [ ] Configure monitoring
- [ ] Setup automated backups
- [ ] Test P2P functionality
- [ ] Verify Hidden Layer encryption
- [ ] Load testing
- [ ] Configure logging
- [ ] Setup error tracking

---

## 📞 Support

Për probleme dhe pyetje:
- GitHub Issues: [your-repo-url]/issues
- Email: support@example.com
- Documentation: README.md

---

**🎉 Deployment i suksesshëm! Happy Streaming!**
