<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPTV Hybrid Panel</title>
    <link rel="stylesheet" href="public/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📡 IPTV Hybrid Panel</h1>
            <p>Modern IPTV Streaming Platform</p>
        </header>

        <main>
            <div class="player-section">
                <h2>Live Player</h2>
                <div id="video-container">
                    <video id="player" controls width="100%">
                        <source src="" type="application/x-mpegURL">
                        Your browser does not support HTML5 video.
                    </video>
                </div>
            </div>

            <div class="playlist-section">
                <h2>Channels</h2>
                <div id="channel-list">
                    <!-- Channels will be loaded dynamically -->
                    <p>Loading channels...</p>
                </div>
            </div>
        </main>

        <footer>
            <p>&copy; 2024 IPTV Hybrid Panel | <a href="admin/">Admin Panel</a></p>
        </footer>
    </div>

    <script src="public/js/player.js"></script>
</body>
</html>
