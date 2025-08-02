<?php
// api/signup.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
error_log('Sign-up data received: ' . print_r($data, true)); // Debug log

$full_name = $data['name'] ?? '';
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['newPassword'] ?? '';

error_log('Parsed data: full_name=' . $full_name . ', username=' . $username . ', email=' . $email . ', password=' . ($password ? '[set]' : '[empty]')); // Debug log

if (empty($full_name) || empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

// Check for duplicate email or username
$stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? OR username = ?");
$stmt->execute([$email, $username]);
if ($stmt->fetchColumn() > 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Email or username already exists']);
    exit;
}

// Hash password
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// Insert user
try {
    $stmt = $pdo->prepare("INSERT INTO users (email, username, full_name, password_hash) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $username, $full_name, $password_hash]);
    http_response_code(201);
    echo json_encode(['message' => 'Account created successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create account: ' . $e->getMessage()]);
    error_log('Database error: ' . $e->getMessage()); // Debug log
}
?>