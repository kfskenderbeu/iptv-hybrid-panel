<?php
/**
 * IPTV Hybrid Panel Configuration
 * Rename this file to config.php and update with your settings
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'iptv_panel');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application Settings
define('APP_NAME', 'IPTV Hybrid Panel');
define('APP_URL', 'http://localhost');
define('ADMIN_EMAIL', 'admin@example.com');

// Security
define('SECRET_KEY', 'change-this-to-random-string');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Streaming Settings
define('MAX_BITRATE', '8000'); // kbps
define('BUFFER_SIZE', '30'); // seconds
define('ALLOWED_FORMATS', 'mp4,m3u8,ts,mkv');

// Paths
define('UPLOAD_PATH', __DIR__ . '/uploads/');
define('LOG_PATH', __DIR__ . '/logs/');

// Enable/Disable Features
define('ENABLE_REGISTRATION', true);
define('ENABLE_API', true);
define('DEBUG_MODE', false);
?>
