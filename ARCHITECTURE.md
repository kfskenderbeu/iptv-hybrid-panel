# 📊 Arkitektura e Sistemit - IPTV Hybrid Panel

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Video      │  │   P2P        │  │  Statistics  │              │
│  │   Player     │  │   Manager    │  │   Monitor    │              │
│  │  (HLS.js)    │  │  (WebRTC)    │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             │ WebSocket + REST API
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                            │    SERVER LAYER (Node.js)              │
├────────────────────────────┼──────────────────────────────────────┤
│                            │                                          │
│  ┌────────────────────────▼────────────────────────┐                │
│  │         Express.js Server + Socket.IO            │                │
│  └────────────────┬────────────────┬────────────────┘                │
│                   │                │                                  │
│  ┌────────────────▼──────┐  ┌─────▼──────────────┐                 │
│  │   Authentication       │  │  Stream Manager     │                 │
│  │   - JWT Tokens         │  │  - Create/List      │                 │
│  │   - Bcrypt Hash        │  │  - Play/Monitor     │                 │
│  └────────────────────────┘  └─────────────────────┘                 │
│                                                                       │
│  ┌──────────────────────────────────────────────────┐               │
│  │              HIDDEN LAYER ENGINE                  │               │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │               │
│  │  │Node 1│→→│Node 2│→→│Node 3│→→│Node N│         │               │
│  │  │ RSA  │  │ RSA  │  │ RSA  │  │ RSA  │         │               │
│  │  └──────┘  └──────┘  └──────┘  └──────┘         │               │
│  │       Multi-Hop Encrypted Routing                 │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                       │
│  ┌────────────────────────┐  ┌─────────────────────┐               │
│  │   P2P Manager          │  │  CDN Manager         │               │
│  │  - Swarm Management    │  │  - Load Balancing    │               │
│  │  - Peer Discovery      │  │  - Failover Logic    │               │
│  │  - Chunk Distribution  │  │  - Node Selection    │               │
│  └────────────────────────┘  └─────────────────────┘               │
│                                                                       │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
┌───────────────────▼───┐  ┌─────────▼────────────────┐
│   P2P NETWORK         │  │   CDN NETWORK              │
├───────────────────────┤  ├────────────────────────────┤
│                       │  │                            │
│  ┌─────┐   ┌─────┐  │  │  ┌──────┐  ┌──────┐       │
│  │Peer1│◄─►│Peer2│  │  │  │ CDN  │  │ CDN  │       │
│  └─────┘   └─────┘  │  │  │Node1 │  │Node2 │       │
│     ▲         ▲      │  │  └──────┘  └──────┘       │
│     │         │      │  │      │         │           │
│  ┌──┴──┐   ┌─┴───┐ │  │  ┌───▼──┐  ┌──▼───┐       │
│  │Peer3│◄─►│Peer4│ │  │  │ CDN  │  │ CDN  │       │
│  └─────┘   └─────┘ │  │  │Node3 │  │Node4 │       │
│                     │  │  └──────┘  └──────┘       │
│  WebRTC Swarm      │  │   Multi-Region CDN        │
└───────────────────────┘  └────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌────────────┐
│   User     │
│  Request   │
└─────┬──────┘
      │
      ▼
┌─────────────────────────────┐
│  Authentication Layer        │
│  (JWT Token Verification)   │
└─────┬───────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│   Hidden Layer Routing      │
│  ┌──────────────────────┐  │
│  │ Request Encryption    │  │
│  │ Node1 → Node2 → Node3 │  │
│  │  RSA    RSA     RSA   │  │
│  └──────────────────────┘  │
└─────┬───────────────────────┘
      │
      ├─────────────┬──────────────┐
      │             │              │
      ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Check P2P│  │  Query   │  │  Load    │
│   Swarm  │  │   CDN    │  │ Balance  │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │              │
      └─────────────┴──────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Smart Router  │
            │  Selects:     │
            │  - P2P if >3  │
            │  - CDN if <3  │
            │  - Hybrid Mix │
            └───────┬───────┘
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ▼                            ▼
┌──────────────┐          ┌──────────────┐
│ P2P Delivery │          │ CDN Delivery │
│  (60-80%)    │          │  (20-40%)    │
└──────┬───────┘          └──────┬───────┘
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Chunk       │
            │  Assembly     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Video Player │
            │  (HLS.js)     │
            └───────────────┘
```

---

## 🔐 Hidden Layer Security Flow

```
┌────────────────────────────────────────────────────┐
│         ENCRYPTION LAYERS (Onion Routing)          │
├────────────────────────────────────────────────────┤
│                                                     │
│  Original Data: { streamId: "abc123", ... }       │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Layer 3: Encrypted with Node3's Public Key │    │
│  │  └──────────────────────────────────────┘  │    │
│  │     │ Layer 2: Encrypted with Node2 Key   │    │
│  │     │  └──────────────────────────────┘   │    │
│  │     │     │ Layer 1: Node1 Key          │    │
│  │     │     │  └─────────────────────┘   │    │
│  │     │     │     │ Original Data       │    │
│  │     │     │     └─────────────────────┘   │    │
│  │     │     └──────────────────────────┘   │    │
│  │     └──────────────────────────────────┘  │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Each node can only decrypt its own layer         │
│  No node knows the complete path                  │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 🌐 P2P Swarm Architecture

```
                    ┌──────────────┐
                    │   Tracker    │
                    │  (Socket.IO) │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼────┐    ┌───▼────┐    ┌───▼────┐
       │ Peer A  │    │ Peer B │    │ Peer C │
       │ Chunks: │    │Chunks: │    │Chunks: │
       │ 1,2,3,4 │    │ 2,3,5,6│    │ 1,4,5,7│
       └────┬────┘    └───┬────┘    └───┬────┘
            │             │             │
            └─────────────┼─────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
       ┌────▼────┐    ┌───▼────┐    ┌───▼────┐
       │ Peer D  │    │ Peer E │    │ Peer F │
       │ Chunks: │    │Chunks: │    │Chunks: │
       │ 3,6,7,8 │    │ 1,4,7,8│    │ 2,5,6,8│
       └─────────┘    └────────┘    └─────────┘

Each peer shares chunks with others (BitTorrent-like)
Reduces CDN load by 60-80%
```

---

## 📊 Request Flow Example

```
Step 1: User clicks "Play Stream"
   │
   ▼
Step 2: Frontend sends request to /api/streams/:id/play
   │
   ▼
Step 3: Server validates JWT token
   │
   ▼
Step 4: Hidden Layer processes request
   │   ├─ Encrypt with Node1 key
   │   ├─ Encrypt with Node2 key
   │   └─ Encrypt with Node3 key
   │
   ▼
Step 5: Request routed through Hidden Nodes
   │   ├─ Node1 decrypts → forwards
   │   ├─ Node2 decrypts → forwards
   │   └─ Node3 decrypts → forwards
   │
   ▼
Step 6: Check P2P Swarm
   │   ├─ If peers >= 3 → Use P2P
   │   └─ If peers < 3 → Use CDN
   │
   ▼
Step 7: Join P2P Swarm (WebSocket)
   │   ├─ Announce presence
   │   ├─ Get peer list
   │   └─ Establish WebRTC connections
   │
   ▼
Step 8: Start Video Playback
   │   ├─ Request chunks from peers (P2P)
   │   ├─ Fallback to CDN if needed
   │   └─ Buffer and play
   │
   ▼
Step 9: Monitor & Report Stats
   │   ├─ P2P vs CDN ratio
   │   ├─ Bandwidth usage
   │   └─ Peer connections
```

---

## 🎯 Component Interaction

```
┌────────────────────────────────────────────────┐
│              Frontend (React)                   │
├────────────────────────────────────────────────┤
│                                                 │
│  [Video Player] ←→ [P2P Manager] ←→ [Stats]   │
│        ↓              ↓              ↓         │
│     HLS.js        WebRTC         Socket.IO    │
│                                                 │
└────────────────────┬───────────────────────────┘
                     │
                     │ HTTP/WebSocket
                     │
┌────────────────────▼───────────────────────────┐
│              Backend (Node.js)                  │
├────────────────────────────────────────────────┤
│                                                 │
│  [Express] ←→ [Socket.IO] ←→ [JWT Auth]       │
│      ↓            ↓             ↓              │
│  REST API    WebSocket      Security          │
│      ↓            ↓             ↓              │
│  [Stream   ←  [P2P Mgr]  ← [Hidden Layer]     │
│   Manager]       ↓                             │
│                  ↓                             │
│             [CDN Manager]                      │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 💾 Data Storage Flow

```
┌─────────────┐
│    User     │
│   Action    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  In-Memory Store │  ← Fast Access
│  (Map/Set)       │
└──────┬───────────┘
       │
       │ (Optional)
       ▼
┌──────────────────┐
│  Redis Cache     │  ← Session & Temp Data
└──────┬───────────┘
       │
       │ (Optional)
       ▼
┌──────────────────┐
│  MongoDB         │  ← Persistent Storage
│  (Streams, Users)│
└──────────────────┘
```

---

## 🔄 Chunk Distribution Pattern

```
        CDN
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│Peer A│  │Peer B│
└───┬──┘  └──┬───┘
    │        │
    │   ┌────┴────┐
    │   │         │
    └───►Peer C◄──┘
        │
    ┌───┴───┐
    │       │
┌───▼──┐ ┌─▼────┐
│Peer D│ │Peer E│
└──────┘ └──────┘

Distribution Pattern:
1. Peer A downloads from CDN
2. Peer A shares with Peer B & C
3. Peer B & C share with others
4. Network grows organically
5. CDN usage drops significantly
```

---

**📊 Kjo arkitekturë garanton:**
- ✅ Latency të ulët (<100ms P2P, <200ms CDN)
- ✅ Sigurinë maksimale (RSA + Multi-hop)
- ✅ Skalabilitet (1000+ concurrent users)
- ✅ Efikasitet (60-80% P2P bandwidth savings)
- ✅ Reliability (CDN fallback automatik)
