<?php
// get_restaurant_location.php — public endpoint, returns restaurant lat/lng
header('Content-Type: application/json');
require 'db.php';

// Create settings table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$res = $conn->query("SELECT `value` FROM settings WHERE `key` = 'restaurant_location'");
if ($res && $row = $res->fetch_assoc()) {
    $loc = json_decode($row['value'], true);
    echo json_encode(['success' => true, 'location' => $loc]);
} else {
    // Default to Kathmandu city center if not set
    echo json_encode([
        'success'  => true,
        'location' => ['lat' => 27.7172, 'lng' => 85.3240, 'name' => 'CJ-NJ Foods']
    ]);
}