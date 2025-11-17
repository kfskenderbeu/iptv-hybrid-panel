const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Konfigurimi
const CONFIG = {
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    CDN_NODES: [
        'https://cdn1.example.com',
        'https://cdn2.example.com',
        'https://cdn3.example.com'
    ],
    P2P_ENABLED: true,
    HIDDEN_LAYER_ENABLED: true,
    MAX_PEERS: 50,
    CHUNK_SIZE: 256 * 1024, // 256KB
    PORT: 3000
};

// Storage në memorie (në prodhim përdor database)
const users = new Map();
const streams = new Map();
const peers = new Map();
const hiddenNodes = new Map();

// ========== HIDDEN LAYER ==========
class HiddenLayer {
    constructor() {
        this.nodes = new Map();
        this.initializeNodes();
    }

    initializeNodes() {
        // Krijimi i node-ve të fshehur për enkriptim dhe routing
        for (let i = 0; i < 5; i++) {
            const nodeId = crypto.randomBytes(16).toString('hex');
            this.nodes.set(nodeId, {
                id: nodeId,
                publicKey: this.generateKeyPair().publicKey,
                privateKey: this.generateKeyPair().privateKey,
                connections: [],
                load: 0,
                region: ['EU', 'US', 'ASIA'][Math.floor(Math.random() * 3)]
            });
        }
    }

    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        return { publicKey, privateKey };
    }

    encryptData(data, nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        const encrypted = crypto.publicEncrypt(
            node.publicKey,
            Buffer.from(JSON.stringify(data))
        );
        return encrypted.toString('base64');
    }

    decryptData(encryptedData, nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        try {
            const decrypted = crypto.privateDecrypt(
                node.privateKey,
                Buffer.from(encryptedData, 'base64')
            );
            return JSON.parse(decrypted.toString());
        } catch (error) {
            return null;
        }
    }

    getOptimalNode(region = 'EU') {
        let bestNode = null;
        let minLoad = Infinity;

        for (const [id, node] of this.nodes) {
            if (node.region === region && node.load < minLoad) {
                minLoad = node.load;
                bestNode = node;
            }
        }

        return bestNode || Array.from(this.nodes.values())[0];
    }

    routeThrough(data, hops = 3) {
        let currentData = data;
        const route = [];

        for (let i = 0; i < hops; i++) {
            const node = this.getOptimalNode();
            route.push(node.id);
            currentData = this.encryptData(currentData, node.id);
        }

        return { data: currentData, route };
    }
}

const hiddenLayer = new HiddenLayer();

// ========== P2P MANAGER ==========
class P2PManager {
    constructor() {
        this.peers = new Map();
        this.swarms = new Map();
    }

    addPeer(peerId, socket) {
        this.peers.set(peerId, {
            id: peerId,
            socket: socket,
            bandwidth: 0,
            uploaded: 0,
            downloaded: 0,
            connected: Date.now(),
            streams: new Set()
        });
    }

    removePeer(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.streams.forEach(streamId => {
                const swarm = this.swarms.get(streamId);
                if (swarm) {
                    swarm.peers.delete(peerId);
                }
            });
        }
        this.peers.delete(peerId);
    }

    joinSwarm(peerId, streamId) {
        if (!this.swarms.has(streamId)) {
            this.swarms.set(streamId, {
                id: streamId,
                peers: new Set(),
                chunks: new Map(),
                seeders: new Set()
            });
        }

        const swarm = this.swarms.get(streamId);
        swarm.peers.add(peerId);

        const peer = this.peers.get(peerId);
        if (peer) {
            peer.streams.add(streamId);
        }

        return this.getSwarmPeers(streamId, peerId);
    }

    leaveSwarm(peerId, streamId) {
        const swarm = this.swarms.get(streamId);
        if (swarm) {
            swarm.peers.delete(peerId);
            swarm.seeders.delete(peerId);
        }

        const peer = this.peers.get(peerId);
        if (peer) {
            peer.streams.delete(streamId);
        }
    }

    getSwarmPeers(streamId, excludePeerId) {
        const swarm = this.swarms.get(streamId);
        if (!swarm) return [];

        return Array.from(swarm.peers)
            .filter(id => id !== excludePeerId)
            .slice(0, 10)
            .map(id => {
                const peer = this.peers.get(id);
                return {
                    id: id,
                    bandwidth: peer?.bandwidth || 0
                };
            });
    }

    announceChunk(streamId, chunkId, peerId) {
        const swarm = this.swarms.get(streamId);
        if (!swarm) return;

        if (!swarm.chunks.has(chunkId)) {
            swarm.chunks.set(chunkId, new Set());
        }
        swarm.chunks.get(chunkId).add(peerId);
    }

    findChunkPeers(streamId, chunkId) {
        const swarm = this.swarms.get(streamId);
        if (!swarm || !swarm.chunks.has(chunkId)) return [];

        return Array.from(swarm.chunks.get(chunkId));
    }
}

const p2pManager = new P2PManager();

// ========== CDN MANAGER ==========
class CDNManager {
    constructor(nodes) {
        this.nodes = nodes;
        this.nodeStats = new Map();
        
        nodes.forEach((node, index) => {
            this.nodeStats.set(node, {
                load: 0,
                latency: 0,
                available: true,
                lastCheck: Date.now()
            });
        });
    }

    getOptimalNode() {
        let bestNode = this.nodes[0];
        let minLoad = Infinity;

        for (const [node, stats] of this.nodeStats) {
            if (stats.available && stats.load < minLoad) {
                minLoad = stats.load;
                bestNode = node;
            }
        }

        return bestNode;
    }

    updateNodeLoad(node, load) {
        const stats = this.nodeStats.get(node);
        if (stats) {
            stats.load = load;
            stats.lastCheck = Date.now();
        }
    }

    getStreamUrl(streamId) {
        const node = this.getOptimalNode();
        return `${node}/stream/${streamId}/playlist.m3u8`;
    }
}

const cdnManager = new CDNManager(CONFIG.CDN_NODES);

// ========== AUTENTIFIKIMI ==========
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (users.has(username)) {
            return res.status(400).json({ error: 'Përdoruesi ekziston' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomBytes(16).toString('hex');

        users.set(username, {
            id: userId,
            username,
            password: hashedPassword,
            email,
            role: 'user',
            credits: 100,
            streams: [],
            created: Date.now()
        });

        const token = jwt.sign({ userId, username }, CONFIG.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId, username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = users.get(username);
        if (!user) {
            return res.status(401).json({ error: 'Kredencialet e gabuara' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Kredencialet e gabuara' });
        }

        const token = jwt.sign({ userId: user.id, username }, CONFIG.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId: user.id, username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware për autentifikim
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token mungon' });
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token i pavlefshëm' });
    }
};

// ========== STREAM MANAGEMENT ==========
app.post('/api/streams/create', authenticate, (req, res) => {
    try {
        const { name, url, category, quality } = req.body;
        const streamId = crypto.randomBytes(16).toString('hex');

        const stream = {
            id: streamId,
            name,
            url,
            category: category || 'general',
            quality: quality || '1080p',
            owner: req.user.userId,
            viewers: 0,
            p2pEnabled: CONFIG.P2P_ENABLED,
            hiddenLayer: CONFIG.HIDDEN_LAYER_ENABLED,
            created: Date.now(),
            active: true
        };

        streams.set(streamId, stream);

        res.json({ stream });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/streams/list', authenticate, (req, res) => {
    try {
        const streamList = Array.from(streams.values())
            .filter(s => s.active)
            .map(s => ({
                id: s.id,
                name: s.name,
                category: s.category,
                quality: s.quality,
                viewers: s.viewers,
                p2pEnabled: s.p2pEnabled
            }));

        res.json({ streams: streamList });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/streams/:streamId/play', authenticate, (req, res) => {
    try {
        const { streamId } = req.params;
        const stream = streams.get(streamId);

        if (!stream) {
            return res.status(404).json({ error: 'Stream nuk u gjet' });
        }

        // Përdor hidden layer për routing
        const hiddenNode = hiddenLayer.getOptimalNode();
        const cdnUrl = cdnManager.getStreamUrl(streamId);

        const playbackData = {
            streamId,
            cdnUrl,
            p2pEnabled: stream.p2pEnabled,
            hiddenNode: hiddenNode.id,
            quality: stream.quality
        };

        // Enkriptoj të dhënat përmes hidden layer
        const encrypted = hiddenLayer.routeThrough(playbackData);

        res.json({
            stream: playbackData,
            encryptedRoute: encrypted.route,
            p2pPeers: stream.p2pEnabled ? p2pManager.getSwarmPeers(streamId) : []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== WEBSOCKET P2P ==========
io.on('connection', (socket) => {
    console.log('Peer i lidhur:', socket.id);

    socket.on('peer:register', (data) => {
        p2pManager.addPeer(socket.id, socket);
        socket.emit('peer:registered', { peerId: socket.id });
    });

    socket.on('peer:join-swarm', (data) => {
        const { streamId } = data;
        const peers = p2pManager.joinSwarm(socket.id, streamId);
        
        socket.emit('peer:swarm-joined', { streamId, peers });
        socket.join(`swarm:${streamId}`);

        // Njofto peers të tjerë
        socket.to(`swarm:${streamId}`).emit('peer:new-peer', {
            peerId: socket.id
        });
    });

    socket.on('peer:leave-swarm', (data) => {
        const { streamId } = data;
        p2pManager.leaveSwarm(socket.id, streamId);
        socket.leave(`swarm:${streamId}`);

        socket.to(`swarm:${streamId}`).emit('peer:peer-left', {
            peerId: socket.id
        });
    });

    socket.on('peer:announce-chunk', (data) => {
        const { streamId, chunkId } = data;
        p2pManager.announceChunk(streamId, chunkId, socket.id);

        socket.to(`swarm:${streamId}`).emit('peer:chunk-available', {
            chunkId,
            peerId: socket.id
        });
    });

    socket.on('peer:request-chunk', (data) => {
        const { streamId, chunkId, targetPeerId } = data;
        
        io.to(targetPeerId).emit('peer:chunk-request', {
            chunkId,
            requesterId: socket.id
        });
    });

    socket.on('peer:send-chunk', (data) => {
        const { chunkId, chunkData, targetPeerId } = data;
        
        io.to(targetPeerId).emit('peer:chunk-data', {
            chunkId,
            chunkData,
            senderId: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log('Peer u shkëput:', socket.id);
        p2pManager.removePeer(socket.id);
    });
});

// ========== STATISTIKA ==========
app.get('/api/stats', authenticate, (req, res) => {
    try {
        const stats = {
            totalStreams: streams.size,
            activeStreams: Array.from(streams.values()).filter(s => s.active).length,
            totalPeers: p2pManager.peers.size,
            hiddenNodes: hiddenLayer.nodes.size,
            cdnNodes: cdnManager.nodes.length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Startimi i serverit
server.listen(CONFIG.PORT, () => {
    console.log(`🚀 IPTV Panel Hybrid duke funksionuar në portin ${CONFIG.PORT}`);
    console.log(`📡 P2P: ${CONFIG.P2P_ENABLED ? 'AKTIV' : 'JOAKTIV'}`);
    console.log(`🔒 Hidden Layer: ${CONFIG.HIDDEN_LAYER_ENABLED ? 'AKTIV' : 'JOAKTIV'}`);
    console.log(`🌐 CDN Nodes: ${CONFIG.CDN_NODES.length}`);
});
