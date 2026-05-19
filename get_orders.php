<?php
// get_orders.php — returns orders for a user, or all orders for admin
header('Content-Type: application/json');
require 'db.php';

$email = trim($_GET['email'] ?? '');
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if admin
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

// Fetch orders
if ($is_admin) {
    $res = $conn->query(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 200"
    );
} else {
    $stmt = $conn->prepare(
        "SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC"
    );
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
}

$orders = [];
while ($row = $res->fetch_assoc()) {
    // Fetch line items for each order
    $li = $conn->prepare(
        "SELECT dish_name, price, qty FROM order_items WHERE order_id = ?"
    );
    $li->bind_param("i", $row['id']);
    $li->execute();
    $liRes = $li->get_result();
    $row['items'] = [];
    while ($item = $liRes->fetch_assoc()) {
        $row['items'][] = $item;
    }
    $orders[] = $row;
}

echo json_encode(['success' => true, 'orders' => $orders]);