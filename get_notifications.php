<?php
// get_notifications.php — returns pending orders needing admin attention
header('Content-Type: application/json');
require 'db.php';

$email = trim($_GET['email'] ?? '');
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Verify admin
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

// Count of unread/new orders in "pending" state (these need admin action)
$res = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending'");
$row = $res->fetch_assoc();
$pendingCount = (int)$row['cnt'];

// Also return the 10 most recent pending orders with items
$stmt = $conn->prepare("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$result = $stmt->get_result();
$pending = [];
while ($o = $result->fetch_assoc()) {
    $li = $conn->prepare("SELECT dish_name, price, qty FROM order_items WHERE order_id = ?");
    $li->bind_param("i", $o['id']);
    $li->execute();
    $liRes = $li->get_result();
    $o['items'] = [];
    while ($item = $liRes->fetch_assoc()) {
        $o['items'][] = $item;
    }
    $pending[] = $o;
}

echo json_encode([
    'success'       => true,
    'pending_count' => $pendingCount,
    'pending_orders'=> $pending
]);