<?php
/**
 * IPTV Hybrid Panel - Channels API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Sample response - replace with database query
$channels = [
    [
        'id' => 1,
        'name' => 'News Channel',
        'url' => 'https://example.com/news.m3u8',
        'category' => 'News',
        'logo' => 'https://via.placeholder.com/150?text=News'
    ],
    [
        'id' => 2,
        'name' => 'Sports HD',
        'url' => 'https://example.com/sports.m3u8',
        'category' => 'Sports',
        'logo' => 'https://via.placeholder.com/150?text=Sports'
    ],
    [
        'id' => 3,
        'name' => 'Movies Plus',
        'url' => 'https://example.com/movies.m3u8',
        'category' => 'Movies',
        'logo' => 'https://via.placeholder.com/150?text=Movies'
    ]
];

echo json_encode($channels);
?>
