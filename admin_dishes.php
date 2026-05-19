<?php
// admin_dishes.php — protected CRUD for dishes (admin only)
header('Content-Type: application/json');
session_start();
require 'db.php';

// ── Auth check ──────────────────────────────────────────────
$email = trim($_POST['email'] ?? '');
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$authStmt = $conn->prepare("SELECT is_admin FROM users WHERE email = ?");
$authStmt->bind_param("s", $email);
$authStmt->execute();
$authStmt->store_result();

if ($authStmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$authStmt->bind_result($is_admin);
$authStmt->fetch();

if (!$is_admin) {
    echo json_encode(['success' => false, 'message' => 'Access denied. Admins only.']);
    exit;
}

// ── Route by action ─────────────────────────────────────────
$action = $_POST['action'] ?? '';

switch ($action) {

    // ── ADD ──────────────────────────────────────────────────
    case 'add':
        $name        = trim($_POST['name']        ?? '');
        $category    = trim($_POST['category']    ?? '');
        $description = trim($_POST['description'] ?? '');
        $price       = floatval($_POST['price']   ?? 0);
        $badge       = trim($_POST['badge']       ?? '') ?: null;
        $image_path  = trim($_POST['image_path']  ?? '') ?: null;

        if (!$name || !$category || !$description || $price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        // Handle image upload if provided
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext     = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!in_array($ext, $allowed)) {
                echo json_encode(['success' => false, 'message' => 'Invalid image type']);
                exit;
            }
            $filename   = 'dish_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
            $uploadPath = 'images/' . $filename;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
                $image_path = $uploadPath;
            }
        }

        // FIX: single prepare + correct type string "sssdss" (removed duplicate & fixed space bug)
        $stmt = $conn->prepare(
            "INSERT INTO dishes (name, category, description, price, badge, image_path) VALUES (?,?,?,?,?,?)"
        );
        $stmt->bind_param("sssdss", $name, $category, $description, $price, $badge, $image_path);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Dish added!', 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add dish: ' . $conn->error]);
        }
        break;

    // ── EDIT ─────────────────────────────────────────────────
    case 'edit':
        $id          = intval($_POST['id']          ?? 0);
        $name        = trim($_POST['name']          ?? '');
        $category    = trim($_POST['category']      ?? '');
        $description = trim($_POST['description']   ?? '');
        $price       = floatval($_POST['price']     ?? 0);
        $badge       = trim($_POST['badge']         ?? '') ?: null;
        $image_path  = trim($_POST['image_path']    ?? '') ?: null;

        if (!$id || !$name || !$category || !$description || $price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        // Handle new image upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext     = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (in_array($ext, $allowed)) {
                $filename   = 'dish_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
                $uploadPath = 'images/' . $filename;
                if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
                    $image_path = $uploadPath;
                }
            }
        }

        $stmt = $conn->prepare(
            "UPDATE dishes SET name=?, category=?, description=?, price=?, badge=?, image_path=? WHERE id=?"
        );
        // FIX: "sssdssi" — removed the space that was between "ss" and "i"
        $stmt->bind_param("sssdssi", $name, $category, $description, $price, $badge, $image_path, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Dish updated!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update dish: ' . $conn->error]);
        }
        break;

    // ── DELETE ───────────────────────────────────────────────
    case 'delete':
        $id = intval($_POST['id'] ?? 0);
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'Invalid ID']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM dishes WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Dish deleted!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete dish: ' . $conn->error]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
}