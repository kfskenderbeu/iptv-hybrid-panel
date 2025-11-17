import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Hls from 'hls.js';

const IPTVPlayer = () => {
    const [socket, setSocket] = useState(null);
    const [peerId, setPeerId] = useState(null);
    const [currentStream, setCurrentStream] = useState(null);
    const [streams, setStreams] = useState([]);
    const [peers, setPeers] = useState([]);
    const [stats, setStats] = useState({
        p2pRatio: 0,
        cdnRatio: 0,
        bandwidth: 0,
        buffered: 0
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const chunksCache = useRef(new Map());
    const API_URL = 'http://localhost:3000';

    // ========== AUTENTIFIKIMI ==========
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setIsAuthenticated(true);
                initializeP2P();
                loadStreams();
            } else {
                alert('Login dështoi');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...loginForm, email: `${loginForm.username}@example.com` })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setIsAuthenticated(true);
                initializeP2P();
                loadStreams();
            } else {
                alert('Regjistrimi dështoi');
            }
        } catch (error) {
            console.error('Register error:', error);
        }
    };

    // ========== P2P INITIALIZATION ==========
    const initializeP2P = () => {
        const newSocket = io(API_URL);
        
        newSocket.on('connect', () => {
            console.log('✅ WebSocket Connected');
            newSocket.emit('peer:register', {});
        });

        newSocket.on('peer:registered', (data) => {
            console.log('✅ Peer Registered:', data.peerId);
            setPeerId(data.peerId);
        });

        newSocket.on('peer:swarm-joined', (data) => {
            console.log('✅ Joined Swarm:', data.streamId);
            setPeers(data.peers);
        });

        newSocket.on('peer:new-peer', (data) => {
            console.log('📥 New Peer:', data.peerId);
            setPeers(prev => [...prev, { id: data.peerId }]);
        });

        newSocket.on('peer:peer-left', (data) => {
            console.log('📤 Peer Left:', data.peerId);
            setPeers(prev => prev.filter(p => p.id !== data.peerId));
        });

        newSocket.on('peer:chunk-available', (data) => {
            console.log('📦 Chunk Available:', data.chunkId);
        });

        newSocket.on('peer:chunk-request', (data) => {
            handleChunkRequest(data.chunkId, data.requesterId);
        });

        newSocket.on('peer:chunk-data', (data) => {
            handleChunkReceived(data.chunkId, data.chunkData);
            updateStats('p2p');
        });

        setSocket(newSocket);
    };

    // ========== CHUNK MANAGEMENT ==========
    const handleChunkRequest = (chunkId, requesterId) => {
        const chunk = chunksCache.current.get(chunkId);
        if (chunk && socket) {
            socket.emit('peer:send-chunk', {
                chunkId,
                chunkData: chunk,
                targetPeerId: requesterId
            });
        }
    };

    const handleChunkReceived = (chunkId, chunkData) => {
        chunksCache.current.set(chunkId, chunkData);
        console.log('✅ Chunk received via P2P:', chunkId);
    };

    const announceChunk = (chunkId) => {
        if (socket && currentStream) {
            socket.emit('peer:announce-chunk', {
                streamId: currentStream.id,
                chunkId
            });
        }
    };

    const requestChunkFromPeers = async (chunkId) => {
        if (!peers.length || !socket) return null;

        // Zgjedh peer random
        const randomPeer = peers[Math.floor(Math.random() * peers.length)];
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            
            socket.once('peer:chunk-data', (data) => {
                if (data.chunkId === chunkId) {
                    clearTimeout(timeout);
                    resolve(data.chunkData);
                }
            });

            socket.emit('peer:request-chunk', {
                streamId: currentStream.id,
                chunkId,
                targetPeerId: randomPeer.id
            });
        });
    };

    // ========== STREAM LOADING ==========
    const loadStreams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/streams/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStreams(data.streams);
            }
        } catch (error) {
            console.error('Error loading streams:', error);
        }
    };

    // ========== VIDEO PLAYER ==========
    const playStream = async (stream) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/streams/${stream.id}/play`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return;

            const data = await response.json();
            setCurrentStream(data.stream);

            // Join P2P swarm
            if (socket && data.stream.p2pEnabled) {
                socket.emit('peer:join-swarm', { streamId: stream.id });
            }

            // Initialize HLS player
            if (Hls.isSupported()) {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });

                // Custom loader për P2P
                hls.config.loader = class P2PLoader extends Hls.DefaultConfig.loader {
                    async load(context, config, callbacks) {
                        const chunkId = context.url.split('/').pop();
                        
                        // Provo të marrësh nga P2P
                        const p2pChunk = await requestChunkFromPeers(chunkId);
                        
                        if (p2pChunk) {
                            callbacks.onSuccess({
                                data: p2pChunk,
                                url: context.url
                            }, { code: 200 }, context);
                            updateStats('p2p');
                        } else {
                            // Fallback në CDN
                            super.load(context, config, callbacks);
                            updateStats('cdn');
                        }
                    }
                };

                hls.loadSource(data.stream.cdnUrl);
                hls.attachMedia(videoRef.current);

                hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                    const chunkId = data.frag.url.split('/').pop();
                    chunksCache.current.set(chunkId, data.frag.data);
                    announceChunk(chunkId);
                });

                hlsRef.current = hls;

                videoRef.current.play();
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = data.stream.cdnUrl;
                videoRef.current.play();
            }
        } catch (error) {
            console.error('Error playing stream:', error);
        }
    };

    const updateStats = (source) => {
        setStats(prev => {
            const total = prev.p2pRatio + prev.cdnRatio + 1;
            return {
                ...prev,
                p2pRatio: source === 'p2p' ? prev.p2pRatio + 1 : prev.p2pRatio,
                cdnRatio: source === 'cdn' ? prev.cdnRatio + 1 : prev.cdnRatio,
                bandwidth: ((prev.p2pRatio / total) * 100).toFixed(1)
            };
        });
    };

    // ========== CLEANUP ==========
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            initializeP2P();
            loadStreams();
        }

        return () => {
            if (socket) socket.disconnect();
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, []);

    // ========== UI RENDERING ==========
    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>🔒 IPTV Hybrid Panel</h1>
                    <p>P2P/CDN Hidden Layer System</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                            required
                        />
                        <button type="submit">Login</button>
                        <button type="button" onClick={handleRegister}>Register</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="iptv-panel">
            <header>
                <h1>📡 IPTV Hybrid Panel</h1>
                <div className="status">
                    <span className={peerId ? 'online' : 'offline'}>
                        {peerId ? `🟢 Peer ID: ${peerId.substring(0, 8)}` : '🔴 Offline'}
                    </span>
                </div>
            </header>

            <div className="main-content">
                <div className="video-section">
                    <video ref={videoRef} controls className="video-player" />
                    
                    {currentStream && (
                        <div className="stream-info">
                            <h3>{currentStream.name}</h3>
                            <div className="stats-bar">
                                <div className="stat">
                                    <span>P2P: {stats.bandwidth}%</span>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress p2p" 
                                            style={{width: `${stats.bandwidth}%`}}
                                        />
                                    </div>
                                </div>
                                <div className="stat">
                                    <span>CDN: {(100 - stats.bandwidth).toFixed(1)}%</span>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress cdn" 
                                            style={{width: `${100 - stats.bandwidth}%`}}
                                        />
                                    </div>
                                </div>
                                <div className="stat">
                                    <span>👥 Peers: {peers.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="streams-sidebar">
                    <h2>📺 Streams</h2>
                    <div className="streams-list">
                        {streams.map(stream => (
                            <div 
                                key={stream.id} 
                                className={`stream-item ${currentStream?.id === stream.id ? 'active' : ''}`}
                                onClick={() => playStream(stream)}
                            >
                                <div className="stream-info">
                                    <h4>{stream.name}</h4>
                                    <p>{stream.category} • {stream.quality}</p>
                                    <span className="viewers">👁 {stream.viewers}</span>
                                </div>
                                {stream.p2pEnabled && <span className="p2p-badge">P2P</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer>
                <p>🔒 Hidden Layer Active • 🌐 CDN: Multi-Region • ⚡ Hybrid P2P/CDN</p>
            </footer>
        </div>
    );
};

export default IPTVPlayer;
