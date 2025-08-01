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
error_log('Update password data received: ' . print_r($data, true));

$user_id = $data['user_id'] ?? null;
$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';

if (!$user_id || !$current_password || !$new_password) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID, current password, and new password are required']);
    exit;
}

if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be at least 6 characters']);
    exit;
}

try {
    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($current_password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid current password']);
        exit;
    }

    // Hash new password
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$new_password_hash, $user_id]);
    http_response_code(200);
    echo json_encode(['message' => 'Password updated successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update password: ' . $e->getMessage()]);
    error_log('Database error: ' . $e->getMessage());
}
?>