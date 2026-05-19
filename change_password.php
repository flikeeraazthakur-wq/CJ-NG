<?php
header('Content-Type: application/json');
require 'db.php';

$email      = trim($_POST['email']      ?? '');
$current_pw = $_POST['current_pw']      ?? '';
$new_pw     = $_POST['new_pw']          ?? '';

if (!$email || !$current_pw || !$new_pw) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (strlen($new_pw) < 6) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters.']);
    exit;
}

// Fetch the user's current hashed password
$stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Account not found.']);
    exit;
}

$stmt->bind_result($user_id, $hashed);
$stmt->fetch();
$stmt->close();

// Verify current password
if (!password_verify($current_pw, $hashed)) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
    exit;
}

// Prevent reuse of the same password
if (password_verify($new_pw, $hashed)) {
    echo json_encode(['success' => false, 'message' => 'New password must differ from your current password.']);
    exit;
}

// Update to new password
$new_hashed = password_hash($new_pw, PASSWORD_DEFAULT);
$upd = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
$upd->bind_param("si", $new_hashed, $user_id);

if ($upd->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not update password. Please try again.']);
}
$upd->close();