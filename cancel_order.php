<?php
// cancel_order.php — allows a logged-in user to cancel their own pending/confirmed order
header('Content-Type: application/json');
require 'db.php';

$email    = trim($_POST['email']    ?? '');
$order_id = intval($_POST['order_id'] ?? 0);

if (!$email || !$order_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
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

// Make sure the order belongs to this user and is still cancellable
$chk2 = $conn->prepare("SELECT status FROM orders WHERE id = ? AND user_email = ?");
$chk2->bind_param("is", $order_id, $email);
$chk2->execute();
$chk2->store_result();

if ($chk2->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Order not found or does not belong to you']);
    exit;
}

$chk2->bind_result($status);
$chk2->fetch();

$cancellable = ['pending', 'confirmed'];
if (!in_array($status, $cancellable)) {
    echo json_encode(['success' => false, 'message' => 'Order cannot be cancelled at this stage (status: ' . $status . ')']);
    exit;
}

$stmt = $conn->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_email = ?");
$stmt->bind_param("is", $order_id, $email);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Order cancelled successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to cancel order: ' . $conn->error]);
}