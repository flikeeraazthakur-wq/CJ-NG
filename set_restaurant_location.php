<?php
// set_restaurant_location.php — admin sets the restaurant's real-world location
header('Content-Type: application/json');
require 'db.php';

$email = trim($_POST['email'] ?? '');
$lat   = floatval($_POST['lat']   ?? 0);
$lng   = floatval($_POST['lng']   ?? 0);
$name  = trim($_POST['name']  ?? 'Our Restaurant');

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Admin check
$chk = $conn->prepare("SELECT is_admin FROM users WHERE email = ?");
$chk->bind_param("s", $email);
$chk->execute();
$chk->store_result();
if ($chk->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$chk->bind_result($is_admin);
$chk->fetch();
if (!$is_admin) {
    echo json_encode(['success' => false, 'message' => 'Admins only']);
    exit;
}

if ($lat == 0 && $lng == 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid coordinates']);
    exit;
}

// Upsert into settings table (create if not exists)
$conn->query("CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$value = json_encode(['lat' => $lat, 'lng' => $lng, 'name' => $name]);
$stmt = $conn->prepare("INSERT INTO settings (`key`, `value`) VALUES ('restaurant_location', ?) ON DUPLICATE KEY UPDATE `value` = ?");
$stmt->bind_param("ss", $value, $value);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Restaurant location saved!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed: ' . $conn->error]);
}