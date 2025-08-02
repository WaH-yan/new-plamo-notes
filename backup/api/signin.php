<?php
// api/signin.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    error_log('signin.php: Method not allowed, received: ' . $_SERVER['REQUEST_METHOD']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

error_log('signin.php: Received email=' . $email); // Debug input

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    error_log('signin.php: Missing email or password');
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, email, username, full_name AS name, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log('signin.php: Query result: ' . print_r($user, true)); // Debug query result

    if ($user && password_verify($password, $user['password_hash'])) {
        $response = ['user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'username' => $user['username'],
            'name' => $user['name']
        ]];
        echo json_encode($response);
        error_log('signin.php: Successful response: ' . json_encode($response)); // Debug response
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        error_log('signin.php: Invalid email or password for email=' . $email);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    error_log('signin.php: Database error: ' . $e->getMessage());
}
?>