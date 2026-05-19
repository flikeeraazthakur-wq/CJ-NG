<?php
header('Content-Type: application/json');
require 'db.php';

$email    = trim($_POST['email']    ?? '');
$password = $_POST['password']      ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
}

// Ensure the email actually exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Account not found.']);
    exit;
}
$check->close();

// Update password
$hashed = password_hash($password, PASSWORD_DEFAULT);
$upd    = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
$upd->bind_param("ss", $hashed, $email);

if ($upd->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password reset successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not update password. Try again.']);
}
$upd->close();