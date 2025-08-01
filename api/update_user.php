<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
error_log('Update user data received: ' . print_r($data, true));

$user_id = $data['user_id'] ?? null;
$full_name = $data['full_name'] ?? '';
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';

if (!$user_id || empty($full_name) || empty($username) || empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID and all fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// Check for duplicate email or username (excluding the current user)
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE (email = ? OR username = ?) AND id != ?");
    $stmt->execute([$email, $username, $user_id]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Email or username already exists']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET full_name = ?, username = ?, email = ? WHERE id = ?");
    $stmt->execute([$full_name, $username, $email, $user_id]);
    http_response_code(200);
    echo json_encode(['message' => 'User information updated successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update user information: ' . $e->getMessage()]);
    error_log('Database error: ' . $e->getMessage());
}
?>