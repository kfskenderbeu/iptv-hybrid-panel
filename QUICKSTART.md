# ⚡ Quick Start Guide

## 🚀 Fillimi më i Shpejtë (5 minuta)

### Metoda 1: Automatic Setup (Rekomanduar)

```bash
# 1. Ekzekuto setup script
chmod +x setup.sh
./setup.sh

# 2. Start serverin
npm start
```

✅ **Gati!** Hap: `http://localhost:3000`

---

### Metoda 2: Docker (Më e Lehta)

```bash
# Start me një komandë
docker-compose up -d

# Kontrollo status
docker-compose ps

# Shiko logs
docker-compose logs -f
```

✅ **Gati!** Hap: `http://localhost:3000`

---

### Metoda 3: Manual Setup

```bash
# 1. Instalo dependencies
npm install

# 2. Krijo .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
P2P_ENABLED=true
HIDDEN_LAYER_ENABLED=true
EOF

# 3. Start
npm start
```

---

## 👤 Përdorimi i Parë

### 1. Regjistrohu
- Hap `http://localhost:3000`
- Kliko "Register"
- Vendos username dhe password
- ✅ Je gati!

### 2. Shto një Stream
```bash
# Me curl:
curl -X POST http://localhost:3000/api/streams/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Stream",
    "url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    "category": "Demo",
    "quality": "1080p"
  }'
```

Ose përdor panelin në browser për të shtuar streams.

### 3. Luaj një Stream
- Kliko në stream nga lista
- Video do të fillojë automatikisht
- Monitorim P2P/CDN në kohë reale

---

## 🎯 Demo Stream URLs

Për testim, përdor këto stream URLs falas:

```
# Big Buck Bunny
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

# Sintel
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4

# Elephants Dream
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
```

---

## 📊 Verifiko që Gjithçka Funksionon

### Health Check
```bash
curl http://localhost:3000/api/stats
```

Përgjigja duhet të jetë:
```json
{
  "totalStreams": 0,
  "activeStreams": 0,
  "totalPeers": 0,
  "hiddenNodes": 5,
  "cdnNodes": 3
}
```

### WebSocket Test
Hap browser console dhe shkruaj:
```javascript
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('✅ WebSocket Connected!'));
```

### P2P Test
- Hap 2+ tabs në browser
- Luaj të njëjtin stream në të gjitha
- Verifiko që P2P ratio rritet në statistics

---

## 🔧 Probleme të Zakonshme

### ❌ Port 3000 është i zënë
```bash
# Ndrysho portin në .env
PORT=3001
```

### ❌ npm install dështon
```bash
# Pastro cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ WebSocket nuk lidhet
```bash
# Verifiko firewall
sudo ufw allow 3000/tcp

# Ose disable CORS për development
# (tashmë e konfiguruar në server.js)
```

### ❌ P2P nuk funksionon
- Verifiko që ke të paktën 2 peers
- Kontrollo WebRTC support në browser
- Hap Developer Console për gabime

---

## 🎓 Hapat e Radhës

1. **Lexo dokumentacionin e plotë**: `README.md`
2. **Shiko deployment options**: `DEPLOYMENT.md`
3. **Konfiguro CDN nodes**: në `.env`
4. **Personalized Hidden Layer**: modifiko `server.js`
5. **Shto features të reja**: krijoni PR në GitHub

---

## 📞 Ndihmë

### Resurse
- 📖 Dokumentacion: `README.md`
- 🚀 Deployment: `DEPLOYMENT.md`
- 🐛 Issues: GitHub Issues
- 💬 Community: Discord/Slack (shto linqet)

### Komanda të Dobishme

```bash
# Shiko logs
npm start | bunyan  # (install bunyan: npm i -g bunyan)

# Development mode me auto-reload
npm run dev

# Build për production
npm run build

# Testo performance
npm run test

# Docker logs
docker-compose logs -f iptv-panel

# PM2 monitoring
pm2 monit
```

---

## ✅ Checklist i Fillimit

- [ ] Setup completed
- [ ] Server running
- [ ] Registered first user
- [ ] Created test stream
- [ ] Played stream successfully
- [ ] Verified P2P connections
- [ ] Checked Hidden Layer encryption
- [ ] Reviewed documentation

---

**🎉 Urime! Panel IPTV Hybrid është gati për përdorim!**

---

## 💡 Pro Tips

1. **Multi-tab Testing**: Hap 3+ tabs për të testuar P2P swarm
2. **Network Throttling**: Përdor Chrome DevTools për të testuar me bandwidth të ulët
3. **Hidden Layer**: Monitorimi i enkriptimit në Network tab
4. **Performance**: Aktivizo Production mode për performance maksimal
5. **Scaling**: Përdor PM2 cluster mode për load balancing

---

**Happy Streaming! 📡🚀**
