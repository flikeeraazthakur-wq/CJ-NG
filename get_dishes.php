<?php
// get_dishes.php — returns all dishes as JSON (public, used by menu.html)
header('Content-Type: application/json');
require 'db.php';

$result = $conn->query("SELECT * FROM dishes ORDER BY category, id");

$dishes = [];
while ($row = $result->fetch_assoc()) {
    $dishes[] = $row;
}

echo json_encode(['success' => true, 'dishes' => $dishes]);