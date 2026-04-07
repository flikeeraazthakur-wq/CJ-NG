<?php
// update_order_status.php — admin only: change order status
header('Content-Type: application/json');
require 'db.php';

$email    = trim($_POST['email']    ?? '');
$order_id = intval($_POST['order_id'] ?? 0);
$status   = trim($_POST['status']   ?? '');

$allowed = ['pending','confirmed','preparing','ready','delivered','cancelled'];
if (!$email || !$order_id || !in_array($status, $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// Verify admin
$chk = $conn->prepare("SELECT is_admin FROM users WHERE email = ?");
$chk->bind_param("s", $email);
$chk->execute();
$chk->store_result();
$chk->bind_result($is_admin);
$chk->fetch();

if (!$is_admin) {
    echo json_encode(['success' => false, 'message' => 'Admins only']);
    exit;
}

$stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $order_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Status updated']);
} else {
    echo json_encode(['success' => false, 'message' => 'Update failed']);
}