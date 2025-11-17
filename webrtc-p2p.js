// webrtc-p2p.js - Modul i avancuar për P2P connections

class WebRTCP2P {
    constructor(socket, peerId) {
        this.socket = socket;
        this.peerId = peerId;
        this.peers = new Map();
        this.dataChannels = new Map();
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        this.chunkQueue = [];
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Merr offer nga peer tjetër
        this.socket.on('webrtc:offer', async (data) => {
            await this.handleOffer(data);
        });

        // Merr answer nga peer
        this.socket.on('webrtc:answer', async (data) => {
            await this.handleAnswer(data);
        });

        // Merr ICE candidate
        this.socket.on('webrtc:ice-candidate', async (data) => {
            await this.handleIceCandidate(data);
        });
    }

    async connectToPeer(remotePeerId) {
        try {
            const peerConnection = new RTCPeerConnection(this.config);
            this.peers.set(remotePeerId, peerConnection);

            // Setup data channel
            const dataChannel = peerConnection.createDataChannel('chunks', {
                ordered: false,
                maxRetransmits: 0
            });
            this.setupDataChannel(dataChannel, remotePeerId);

            // ICE candidate handler
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('webrtc:ice-candidate', {
                        candidate: event.candidate,
                        targetPeerId: remotePeerId,
                        fromPeerId: this.peerId
                    });
                }
            };

            // Connection state monitoring
            peerConnection.onconnectionstatechange = () => {
                console.log(`Connection state with ${remotePeerId}: ${peerConnection.connectionState}`);
                
                if (peerConnection.connectionState === 'disconnected' || 
                    peerConnection.connectionState === 'failed') {
                    this.closePeerConnection(remotePeerId);
                }
            };

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.socket.emit('webrtc:offer', {
                offer: offer,
                targetPeerId: remotePeerId,
                fromPeerId: this.peerId
            });

            return true;
        } catch (error) {
            console.error('Error connecting to peer:', error);
            return false;
        }
    }

    async handleOffer(data) {
        try {
            const { offer, fromPeerId } = data;
            
            const peerConnection = new RTCPeerConnection(this.config);
            this.peers.set(fromPeerId, peerConnection);

            // Setup data channel handler
            peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel, fromPeerId);
            };

            // ICE candidate handler
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('webrtc:ice-candidate', {
                        candidate: event.candidate,
                        targetPeerId: fromPeerId,
                        fromPeerId: this.peerId
                    });
                }
            };

            // Set remote description and create answer
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.socket.emit('webrtc:answer', {
                answer: answer,
                targetPeerId: fromPeerId,
                fromPeerId: this.peerId
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(data) {
        try {
            const { answer, fromPeerId } = data;
            const peerConnection = this.peers.get(fromPeerId);
            
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(data) {
        try {
            const { candidate, fromPeerId } = data;
            const peerConnection = this.peers.get(fromPeerId);
            
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    setupDataChannel(channel, peerId) {
        this.dataChannels.set(peerId, channel);

        channel.onopen = () => {
            console.log(`✅ Data channel open with peer: ${peerId}`);
            this.processChunkQueue(peerId);
        };

        channel.onclose = () => {
            console.log(`❌ Data channel closed with peer: ${peerId}`);
            this.dataChannels.delete(peerId);
        };

        channel.onerror = (error) => {
            console.error(`Data channel error with peer ${peerId}:`, error);
        };

        channel.onmessage = (event) => {
            this.handleChunkReceived(event.data, peerId);
        };
    }

    sendChunk(peerId, chunkData) {
        const channel = this.dataChannels.get(peerId);
        
        if (channel && channel.readyState === 'open') {
            try {
                channel.send(chunkData);
                return true;
            } catch (error) {
                console.error('Error sending chunk:', error);
                return false;
            }
        } else {
            // Queue për më vonë
            this.chunkQueue.push({ peerId, chunkData });
            return false;
        }
    }

    processChunkQueue(peerId) {
        const pendingChunks = this.chunkQueue.filter(item => item.peerId === peerId);
        
        pendingChunks.forEach(item => {
            this.sendChunk(item.peerId, item.chunkData);
        });

        this.chunkQueue = this.chunkQueue.filter(item => item.peerId !== peerId);
    }

    handleChunkReceived(data, fromPeerId) {
        try {
            const chunk = JSON.parse(data);
            console.log(`📦 Received chunk ${chunk.id} from peer ${fromPeerId}`);
            
            // Emit event për aplikacionin
            this.socket.emit('chunk:received', {
                chunkId: chunk.id,
                data: chunk.data,
                fromPeer: fromPeerId
            });
        } catch (error) {
            console.error('Error processing received chunk:', error);
        }
    }

    broadcastChunk(chunkId, chunkData) {
        const chunk = JSON.stringify({
            id: chunkId,
            data: chunkData,
            timestamp: Date.now()
        });

        let successCount = 0;
        this.dataChannels.forEach((channel, peerId) => {
            if (this.sendChunk(peerId, chunk)) {
                successCount++;
            }
        });

        return successCount;
    }

    closePeerConnection(peerId) {
        const peerConnection = this.peers.get(peerId);
        const dataChannel = this.dataChannels.get(peerId);

        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(peerId);
        }

        if (peerConnection) {
            peerConnection.close();
            this.peers.delete(peerId);
        }

        console.log(`🔌 Closed connection with peer: ${peerId}`);
    }

    getConnectionStats() {
        return {
            activePeers: this.peers.size,
            openChannels: this.dataChannels.size,
            queuedChunks: this.chunkQueue.length
        };
    }

    disconnect() {
        // Close të gjitha connections
        this.peers.forEach((_, peerId) => {
            this.closePeerConnection(peerId);
        });
        this.chunkQueue = [];
    }
}

// Export për përdorim në aplikacion
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCP2P;
}
