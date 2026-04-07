<?php
header('Content-Type: application/json');
require 'db.php';

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields required']);
    exit;
}

$stmt = $conn->prepare("SELECT id, name, password, is_admin FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Account does not exist. Please sign up first.']);
    exit;
}

$stmt->bind_result($id, $name, $hashed, $is_admin);
$stmt->fetch();

if (password_verify($password, $hashed)) {
    echo json_encode([
        'success'  => true,
        'message'  => "Welcome back, $name!",
        'name'     => $name,
        'is_admin' => (bool) $is_admin
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Incorrect password']);
}