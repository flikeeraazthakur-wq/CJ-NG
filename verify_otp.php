<?php
header('Content-Type: application/json');
require __DIR__ . '/db.php';

$email = trim($_POST['email'] ?? '');
$otp   = trim($_POST['otp']   ?? '');

if (!$email || !$otp) {
    echo json_encode(['success' => false, 'message' => 'Email and OTP are required.']);
    exit;
}

// Find a valid, unused, non-expired OTP (using UTC_TIMESTAMP for timezone safety)
$stmt = $conn->prepare(
    "SELECT id FROM otp_tokens
     WHERE email = ?
       AND otp = ?
       AND used = 0
       AND expires_at > UTC_TIMESTAMP()
     ORDER BY created_at DESC
     LIMIT 1"
);
$stmt->bind_param("ss", $email, $otp);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP.']);
    exit;
}

$stmt->bind_result($token_id);
$stmt->fetch();
$stmt->close();

// Mark OTP as used
$upd = $conn->prepare("UPDATE otp_tokens SET used = 1 WHERE id = ?");
$upd->bind_param("i", $token_id);
$upd->execute();
$upd->close();

echo json_encode(['success' => true, 'message' => 'OTP verified.']);