/**
 * IPTV Hybrid Panel - Player JavaScript
 */

class IPTVPlayer {
    constructor() {
        this.player = document.getElementById('player');
        this.channelList = document.getElementById('channel-list');
        this.currentChannel = null;
        this.init();
    }

    init() {
        this.loadChannels();
        this.setupEventListeners();
    }

    async loadChannels() {
        try {
            // Fetch channels from API
            const response = await fetch('api/channels.php');
            const channels = await response.json();

            if (channels && channels.length > 0) {
                this.renderChannels(channels);
            } else {
                this.showSampleChannels();
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showSampleChannels();
        }
    }

    showSampleChannels() {
        const sampleChannels = [
            { id: 1, name: 'Channel 1', url: 'https://example.com/stream1.m3u8' },
            { id: 2, name: 'Channel 2', url: 'https://example.com/stream2.m3u8' },
            { id: 3, name: 'Channel 3', url: 'https://example.com/stream3.m3u8' }
        ];
        this.renderChannels(sampleChannels);
    }

    renderChannels(channels) {
        this.channelList.innerHTML = channels.map(channel => `
            <div class="channel-item" data-id="${channel.id}" data-url="${channel.url}">
                <strong>${channel.name}</strong>
                ${channel.category ? `<br><small>${channel.category}</small>` : ''}
            </div>
        `).join('');
    }

    setupEventListeners() {
        this.channelList.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (channelItem) {
                this.playChannel(channelItem.dataset.url, channelItem.dataset.id);
            }
        });
    }

    playChannel(url, channelId) {
        if (!url) {
            console.error('Invalid channel URL');
            return;
        }

        this.currentChannel = channelId;

        // Set video source
        this.player.src = url;
        this.player.load();
        this.player.play().catch(error => {
            console.error('Error playing channel:', error);
            alert('Unable to play this channel. Please check the stream URL.');
        });

        // Highlight active channel
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-id="${channelId}"]`)?.classList.add('active');
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new IPTVPlayer();
});
