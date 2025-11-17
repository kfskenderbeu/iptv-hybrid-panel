# IPTV Hybrid Panel

A modern IPTV management and streaming panel with admin controls and player interface.

## Features

- **Admin Panel** - Manage channels, playlists, and users
- **M3U Player** - HTML5 video player with playlist support
- **API Endpoints** - REST API for channel management
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Multi-format Support** - HLS, MPEG-DASH, and direct streams

## Structure

```
iptv-panel/
├── admin/      # Admin panel interface
├── api/        # REST API endpoints
├── database/   # Database schemas
├── docs/       # Documentation
├── public/     # Public assets (CSS, JS, images)
└── src/        # Core source code
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/iptv-hybrid-panel.git
   cd iptv-hybrid-panel
   ```

2. Configure your database settings in `config.php`

3. Import the database schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. Start your web server (Apache/Nginx with PHP support)

5. Access the admin panel at `http://localhost/admin`

## Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Modern web browser with HTML5 support

## License

MIT License

## Author

Created for IPTV streaming and management
