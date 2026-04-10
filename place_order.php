<?php
// place_order.php — place a new order (logged-in users only)
header('Content-Type: application/json');
require 'db.php';

$email            = trim($_POST['email']            ?? '');
$name             = trim($_POST['name']             ?? '');
$phone            = trim($_POST['phone']            ?? '');
$delivery_address = trim($_POST['delivery_address'] ?? '');
$note             = trim($_POST['note']             ?? '');
$total            = floatval($_POST['total']        ?? 0);
$items            = json_decode($_POST['items']     ?? '[]', true);

if (!$email || !$name || !$phone || !$delivery_address || !$items || $total <= 0) {
    echo json_encode(['success' => false, 'message' => 'Missing required order details']);
    exit;
}

// Verify user exists
$chk = $conn->prepare("SELECT id FROM users WHERE email = ?");
$chk->bind_param("s", $email);
$chk->execute();
$chk->store_result();
if ($chk->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

// Insert order (with phone + delivery_address columns)
$stmt = $conn->prepare(
    "INSERT INTO orders (user_email, user_name, phone, delivery_address, total, note, status)
     VALUES (?,?,?,?,?,?,'pending')"
);
$stmt->bind_param("sssdss", $email, $name, $phone, $total, $delivery_address, $note);

// Note: column order in bind matches: email=s, name=s, phone=s, total=d, delivery_address=s, note=s
// Re-order to match SQL placeholders exactly:
$stmt = $conn->prepare(
    "INSERT INTO orders (user_email, user_name, phone, delivery_address, total, note, status)
     VALUES (?,?,?,?,?,?,'pending')"
);
$stmt->bind_param("ssssds", $email, $name, $phone, $delivery_address, $total, $note);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to create order: ' . $conn->error]);
    exit;
}

$order_id = $conn->insert_id;

// Insert order items
$li = $conn->prepare(
    "INSERT INTO order_items (order_id, dish_id, dish_name, price, qty) VALUES (?,?,?,?,?)"
);
foreach ($items as $item) {
    $dish_id   = intval($item['id']      ?? 0);
    $dish_name = trim($item['name']      ?? '');
    $price     = floatval($item['price'] ?? 0);
    $qty       = intval($item['qty']     ?? 1);
    $li->bind_param("iisdi", $order_id, $dish_id, $dish_name, $price, $qty);
    $li->execute();
}

echo json_encode(['success' => true, 'message' => 'Order placed!', 'order_id' => $order_id]);