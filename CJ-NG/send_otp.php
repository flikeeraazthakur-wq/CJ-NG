<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require __DIR__ . '/db.php';
require __DIR__ . '/mail_config.php';
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$email = trim($_POST['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Valid email is required.']);
    exit;
}

// 1. Check email exists in users table
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No account found with that email.']);
    exit;
}
$stmt->close();

// 2. Invalidate previous unused OTPs
$invalidate = $conn->prepare("UPDATE otp_tokens SET used = 1 WHERE email = ? AND used = 0");
$invalidate->bind_param("s", $email);
$invalidate->execute();
$invalidate->close();

// 3. Generate OTP and save (using UTC time)
$otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expires = gmdate('Y-m-d H:i:s', strtotime('+10 minutes'));

$ins = $conn->prepare("INSERT INTO otp_tokens (email, otp, expires_at) VALUES (?, ?, ?)");
$ins->bind_param("sss", $email, $otp, $expires);
$ins->execute();
$ins->close();

// 4. Send email
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = MAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USERNAME;
    $mail->Password   = MAIL_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = MAIL_PORT;

    $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'Your CJ-NG Password Reset OTP';
    $mail->Body    = "
        <div style='font-family:sans-serif;max-width:480px;margin:auto;'>
          <h2 style='color:#e67e22;'>Password Reset</h2>
          <p>Your OTP is valid for <strong>10 minutes</strong>.</p>
          <div style='font-size:2.2rem;font-weight:bold;letter-spacing:0.3rem;
                      background:#fdf3e3;padding:16px 24px;border-radius:8px;
                      display:inline-block;color:#333;'>
            {$otp}
          </div>
          <p style='color:#888;font-size:0.85rem;margin-top:24px;'>
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
    ";
    $mail->AltBody = "Your CJ-NG OTP is: {$otp} (valid 10 minutes)";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'OTP sent to your email.']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Mailer error: ' . $mail->ErrorInfo]);
}