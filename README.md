# 📡 IPTV Hybrid Panel - P2P/CDN me Hidden Layer

Panel i avancuar IPTV që kombinon teknologjinë P2P (Peer-to-Peer), CDN (Content Delivery Network) dhe Hidden Layer për streaming të sigurt dhe efikas.

## 🎯 Veçoritë Kryesore

### 1. **Hybrid P2P/CDN Architecture**
- Streaming dinamik që zgjedh burimin më optimal (P2P ose CDN)
- Load balancing automatik midis peers dhe CDN nodes
- Reduktim i kostos së bandwidth deri në 70%

### 2. **Hidden Layer Security**
- Enkriptim RSA 2048-bit për të gjitha të dhënat
- Multi-hop routing për anonimitet
- Node routing me gjeografi të decentralizuar

### 3. **P2P Network**
- WebRTC për lidhje direkte peer-to-peer
- Chunk-based streaming me cache lokal
- Swarm management automatik
- Support për deri në 50+ peers simultane

### 4. **CDN Fallback**
- Multi-region CDN nodes
- Automatic failover në rast problemi P2P
- Low-latency streaming

### 5. **Real-time Statistics**
- Monitor të gjithë P2P/CDN ratio
- Bandwidth tracking
- Peer connection status
- Stream quality metrics

## 🚀 Instalimi

### Parakushtet
```bash
Node.js >= 16.x
npm >= 8.x
```

### Hapat e Instalimit

1. **Klono projektin**
```bash
cd iptv-panel
```

2. **Instalo varësitë**
```bash
npm install
```

3. **Konfiguro CDN Nodes**
Ndrysho CDN_NODES në `server.js`:
```javascript
CDN_NODES: [
    'https://cdn1.example.com',
    'https://cdn2.example.com',
    'https://cdn3.example.com'
]
```

4. **Start serverin**
```bash
npm start
```

Serveri do të startojë në `http://localhost:3000`

## 📋 Përdorimi

### 1. Regjistrimi/Login
- Hap `http://localhost:3000`
- Kliko "Register" për të krijuar një llogari të re
- Ose përdor kredencialet ekzistuese për login

### 2. Krijimi i Stream-eve
```javascript
POST /api/streams/create
Authorization: Bearer <token>

{
  "name": "Stream Name",
  "url": "https://stream-url.com/playlist.m3u8",
  "category": "Sports",
  "quality": "1080p"
}
```

### 3. Luajtja e Stream-eve
- Zgjedh një stream nga lista
- Sistemi automatikisht aktivizon P2P dhe Hidden Layer
- Monitorimi i statistikave në kohë reale

## 🔧 API Endpoints

### Autentifikimi
```
POST /api/auth/register - Regjistrim përdoruesi të ri
POST /api/auth/login    - Login përdoruesi
```

### Stream Management
```
POST   /api/streams/create      - Krijo stream të ri
GET    /api/streams/list        - Lista e stream-eve
GET    /api/streams/:id/play    - Merr info për luajtje
```

### Statistika
```
GET /api/stats - Statistika të sistemit
```

## 🏗️ Arkitektura

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌─────▼──────┐
│  WebSocket  │   │  REST API  │
│  (P2P Sync) │   │  (Control) │
└──────┬──────┘   └─────┬──────┘
       │                │
┌──────▼────────────────▼──────┐
│      Hidden Layer             │
│  (Encryption & Routing)       │
└──────┬────────────────┬──────┘
       │                │
┌──────▼──────┐   ┌────▼────────┐
│  P2P Network│   │  CDN Nodes  │
│  (Peers)    │   │  (Backup)   │
└─────────────┘   └─────────────┘
```

## 🔒 Siguria

### Hidden Layer Implementation
- **Multi-hop Routing**: Të dhënat kalojnë nëpër 3-5 node të ndërmjetëm
- **RSA Encryption**: Çdo hop enkriptohet me çelësa unikë
- **Node Anonymity**: Asnjë node nuk e di rrugën e plotë

### P2P Security
- **Peer Verification**: Token-based authentication
- **Chunk Validation**: Hash verification për çdo chunk
- **Rate Limiting**: Mbrojtje nga abuse

## 📊 Performance

### Optimizimet
- **Chunk Size**: 256KB për balancë optimal
- **Cache Strategy**: LRU cache për chunks të përdorur
- **Connection Pooling**: Reuse të lidhjeve P2P
- **Adaptive Streaming**: Quality adjustment based on bandwidth

### Benchmarks (Typical)
- P2P Ratio: 60-80% në swarm të shëndetshëm
- Latency: <100ms për P2P chunks
- CDN Fallback: <200ms
- Concurrent Viewers: 1000+ per stream

## 🛠️ Konfigurimi i Avancuar

### Hidden Layer Nodes
```javascript
// Rrit numrin e node-ve për siguri më të madhe
HiddenLayer.initializeNodes(10); // default: 5
```

### P2P Settings
```javascript
const CONFIG = {
    MAX_PEERS: 50,           // Maksimumi i peers per swarm
    CHUNK_SIZE: 256 * 1024,  // Madhësia e chunk-ut
    P2P_TIMEOUT: 5000,       // Timeout për P2P requests
    CACHE_SIZE: 100          // Numri i chunks në cache
};
```

### CDN Priority
```javascript
// Për të dhënë prioritet CDN
const CDN_PRIORITY = true; // P2P si backup
```

## 🐛 Troubleshooting

### Problem: P2P nuk funksionon
**Zgjidhje**: 
- Verifiko që WebSocket connection është aktiv
- Kontrollo firewall/NAT settings
- Sigurohu që ka peers të tjerë në swarm

### Problem: Stream buffering
**Zgjidhje**:
- Kontrollo bandwidth
- Rrit CHUNK_SIZE për connections më të ngadalta
- Enable CDN priority mode

### Problem: Hidden Layer latency
**Zgjidhje**:
- Redukto numrin e hops (default: 3)
- Optimizo node selection based on latency

## 📝 Development

### Struktura e Projektit
```
iptv-panel/
├── server.js           # Backend server (Node.js)
├── src/
│   └── IPTVPlayer.jsx # React frontend
├── public/
│   └── styles.css     # CSS styling
└── package.json       # Dependencies
```

### Testing
```bash
# Start në development mode
npm run dev

# Build production
npm run build
```

## 🌟 Features të Ardhshme

- [ ] WebTorrent integration
- [ ] IPFS support për decentralizim total
- [ ] AI-powered bitrate adaptation
- [ ] Blockchain-based authentication
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

## 📄 License

MIT License - open source dhe i lirë për përdorim komercial.

## 🤝 Kontributi

Pull requests janë të mirëpritura! Për ndryshime të mëdha, hap një issue fillimisht.

## 📧 Support

Për pyetje dhe support:
- GitHub Issues
- Email: support@example.com

---

**⚡ Built with Node.js, React, WebRTC, and WebSockets**

🔐 **Hidden Layer Active** | 🌐 **Multi-CDN** | ⚡ **P2P Accelerated**
