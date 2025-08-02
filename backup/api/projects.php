<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Suppress PHP warnings to prevent invalid JSON
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

require_once '../config.php';

// Function to adjust image quality without resizing
function adjustImageQuality($image_data, $quality = 50) {
    $source = imagecreatefromstring($image_data);
    if ($source === false) return false;

    ob_start();
    imagejpeg($source, null, $quality);
    $adjusted_data = ob_get_clean();

    imagedestroy($source);
    return $adjusted_data;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && !isset($_POST['action'])) {
    // Handle new project creation
    error_log('projects.php POST: Raw POST data: ' . print_r($_POST, true));
    error_log('projects.php POST: Raw FILES data: ' . print_r($_FILES, true));

    $user_id = $_POST['user_id'] ?? 0;
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? '';
    $category = $_POST['category'] ?? '';
    $criteria = json_decode($_POST['criteria'] ?? '[]', true);
    $completed_criteria = json_decode($_POST['completed_criteria'] ?? '[]', true);
    $tags = json_decode($_POST['tags'] ?? '[]', true);
    $status = $_POST['status'] ?? 'active';
    $progress = $_POST['progress'] ?? 0;
    $plan_to_complete = $_POST['plan_to_complete'] ?? null;
    $plan_to_complete = ($plan_to_complete === '' || $plan_to_complete === null) ? null : $plan_to_complete;
    $logbook = json_decode($_POST['logbook'] ?? '[]', true);

    if (isset($_FILES['images']['name']) && in_array($name, $_FILES['images']['name'])) {
        error_log('projects.php POST: Name conflicts with image filename: ' . $name);
        http_response_code(400);
        echo json_encode(['error' => 'Project name cannot be an image filename']);
        exit;
    }

    error_log('projects.php POST: Received user_id=' . $user_id . ', name=' . $name . ', plan_to_complete=' . var_export($plan_to_complete, true));

    if (!$user_id || !$name || !$category) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID, name, and category are required']);
        error_log('projects.php POST: Missing required fields');
        exit;
    }

    if ($plan_to_complete !== null) {
        $date = DateTime::createFromFormat('Y-m-d', $plan_to_complete);
        if (!$date || $date->format('Y-m-d') !== $plan_to_complete) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid date format for plan_to_complete. Use YYYY-MM-DD.']);
            error_log('projects.php POST: Invalid date format: ' . $plan_to_complete);
            exit;
        }
    }

    $images = [];
    if (!empty($_FILES['images']['name'][0])) {
        foreach ($_FILES['images']['name'] as $key => $image_name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $tmp_name = $_FILES['images']['tmp_name'][$key];
                $image_data = file_get_contents($tmp_name);
                if ($image_data !== false) {
                    $adjusted_data = adjustImageQuality($image_data, 50);
                    if ($adjusted_data !== false) {
                        $images[] = $adjusted_data;
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Failed to adjust image quality for: ' . $image_name]);
                        error_log('projects.php POST: Failed to adjust image quality for: ' . $image_name);
                        exit;
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Failed to read image file: ' . $image_name]);
                    error_log('projects.php POST: Failed to read image file: ' . $image_name);
                    exit;
                }
            } else {
                error_log('projects.php POST: Image upload error for ' . $image_name . ': ' . $_FILES['images']['error'][$key]);
            }
        }
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO projects (user_id, name, description, category, status, progress, plan_to_complete)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$user_id, $name, $description, $category, $status, $progress, $plan_to_complete]);
        $project_id = $pdo->lastInsertId();

        foreach ($images as $image_data) {
            $stmt = $pdo->prepare("INSERT INTO project_images (project_id, image_data) VALUES (?, ?)");
            $stmt->execute([$project_id, $image_data]);
        }

        foreach ($criteria as $index => $criteria_text) {
            $is_completed = in_array($index, $completed_criteria) ? 1 : 0;
            $stmt = $pdo->prepare("INSERT INTO project_criteria (project_id, criteria_text, is_completed) VALUES (?, ?, ?)");
            $stmt->execute([$project_id, $criteria_text, $is_completed]);
        }

        foreach ($tags as $tag) {
            $stmt = $pdo->prepare("INSERT INTO project_tags (project_id, tag) VALUES (?, ?)");
            $stmt->execute([$project_id, $tag]);
        }

        foreach ($logbook as $entry) {
            $stmt = $pdo->prepare("INSERT INTO project_logbook (project_id, date, entry) VALUES (?, ?, ?)");
            $stmt->execute([$project_id, $entry['date'], $entry['entry']]);
        }

        $pdo->commit();
        http_response_code(201);
        $response = ['message' => 'Project created successfully', 'project_id' => $project_id];
        echo json_encode($response);
        error_log('projects.php POST: Success, project_id=' . $project_id);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create project: ' . $e->getMessage()]);
        error_log('projects.php POST: Database error: ' . $e->getMessage());
    }
} elseif ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? 0;
    error_log('projects.php GET: Received user_id=' . $user_id);

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        error_log('projects.php GET: Missing user_id');
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log('projects.php GET: Query result: ' . print_r($projects, true));

        foreach ($projects as &$project) {
            $stmt = $pdo->prepare("SELECT image_data FROM project_images WHERE project_id = ?");
            $stmt->execute([$project['id']]);
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $project['images'] = array_map(function($img) {
                return 'data:image/jpeg;base64,' . base64_encode($img['image_data']);
            }, $images);

            $stmt = $pdo->prepare("SELECT id, criteria_text, is_completed FROM project_criteria WHERE project_id = ? ORDER BY id");
            $stmt->execute([$project['id']]);
            $criteria = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $project['criteria'] = array_column($criteria, 'criteria_text');
            $project['criteria_ids'] = array_column($criteria, 'id');
            $project['completed_criteria'] = array_column(array_filter($criteria, fn($c) => $c['is_completed']), 'id');

            $stmt = $pdo->prepare("SELECT tag FROM project_tags WHERE project_id = ?");
            $stmt->execute([$project['id']]);
            $project['tags'] = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'tag');

            $stmt = $pdo->prepare("SELECT date, entry FROM project_logbook WHERE project_id = ?");
            $stmt->execute([$project['id']]);
            $project['logbook'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($projects);
        error_log('projects.php GET: Response: ' . json_encode($projects));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch projects: ' . $e->getMessage()]);
        error_log('projects.php GET: Database error: ' . $e->getMessage());
    }
} elseif ($method === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_logbook') {
    error_log('projects.php POST add_logbook: Raw POST data: ' . print_r($_POST, true));

    $project_id = $_POST['project_id'] ?? null;
    $date = $_POST['date'] ?? null;
    $entry = $_POST['entry'] ?? null;
    $user_id = $_POST['user_id'] ?? 0;

    if (!$project_id || !$date || !$entry || !$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: project_id, date, entry, user_id']);
        error_log('projects.php POST add_logbook: Missing required fields');
        exit;
    }

    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD.']);
        error_log('projects.php POST add_logbook: Invalid date format: ' . $date);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$project_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Project not found or not authorized']);
        error_log('projects.php POST add_logbook: Project not found or not authorized for project_id=' . $project_id . ', user_id=' . $user_id);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO project_logbook (project_id, date, entry) VALUES (?, ?, ?)");
        $stmt->execute([$project_id, $date, $entry]);
        http_response_code(201);
        echo json_encode(['message' => 'Logbook entry added successfully']);
        error_log('projects.php POST add_logbook: Success for project_id=' . $project_id);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add logbook entry: ' . $e->getMessage()]);
        error_log('projects.php POST add_logbook: Database error: ' . $e->getMessage());
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    error_log('projects.php PUT: Raw data: ' . print_r($data, true));

    $project_id = $data['project_id'] ?? null;
    $user_id = $data['user_id'] ?? 0;
    $completed_criteria = $data['completed_criteria'] ?? [];

    if (!$project_id || !$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing project_id or user_id']);
        error_log('projects.php PUT: Missing project_id or user_id');
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$project_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Project not found or not authorized']);
        error_log('projects.php PUT: Project not found or not authorized for project_id=' . $project_id . ', user_id=' . $user_id);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Update criteria completion status
        $stmt = $pdo->prepare("UPDATE project_criteria SET is_completed = 0 WHERE project_id = ?");
        $stmt->execute([$project_id]);
        error_log('projects.php PUT: Reset all criteria for project_id=' . $project_id);

        if (!empty($completed_criteria)) {
            $placeholders = implode(',', array_fill(0, count($completed_criteria), '?'));
            $stmt = $pdo->prepare("UPDATE project_criteria SET is_completed = 1 WHERE project_id = ? AND id IN ($placeholders)");
            $stmt->execute(array_merge([$project_id], $completed_criteria));
            error_log('projects.php PUT: Updated ' . count($completed_criteria) . ' criteria to complete for project_id=' . $project_id);
        }

        // Verify criteria state
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM project_criteria WHERE project_id = ?");
        $stmt->execute([$project_id]);
        $total_criteria = $stmt->fetchColumn();
        error_log('projects.php PUT: Total criteria for project_id=' . $project_id . ': ' . $total_criteria);

        $stmt = $pdo->prepare("SELECT COUNT(*) as completed FROM project_criteria WHERE project_id = ? AND is_completed = 1");
        $stmt->execute([$project_id]);
        $completed_count = $stmt->fetchColumn();
        error_log('projects.php PUT: Completed criteria for project_id=' . $project_id . ': ' . $completed_count);

        // Calculate progress
        $progress = $total_criteria > 0 ? round(($completed_count / $total_criteria) * 100) : 0;
        error_log('projects.php PUT: Calculated progress=' . $progress . ' for project_id=' . $project_id);

        // Update project with calculated progress only
        $stmt = $pdo->prepare("UPDATE projects SET progress = ? WHERE id = ?");
        $affected_rows = $stmt->execute([$progress, $project_id]);
        error_log('projects.php PUT: Updated project_id=' . $project_id . ' with progress=' . $progress . ', affected rows: ' . $affected_rows);

        $pdo->commit();
        echo json_encode(['message' => 'Criteria updated successfully', 'progress' => $progress]);
        error_log('projects.php PUT: Success for project_id=' . $project_id . ', progress=' . $progress);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update criteria: ' . $e->getMessage()]);
        error_log('projects.php PUT: Database error: ' . $e->getMessage());
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    error_log('projects.php DELETE: Raw data: ' . print_r($data, true));

    $project_id = $data['project_id'] ?? null;
    $user_id = $data['user_id'] ?? 0;

    if (!$project_id || !$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing project_id or user_id']);
        error_log('projects.php DELETE: Missing project_id or user_id');
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$project_id, $user_id]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Project not found or not authorized']);
        error_log('projects.php DELETE: Project not found or not authorized for project_id=' . $project_id . ', user_id=' . $user_id);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Delete related logbook entries
        $stmt = $pdo->prepare("DELETE FROM project_logbook WHERE project_id = ?");
        $stmt->execute([$project_id]);

        // Delete related tags
        $stmt = $pdo->prepare("DELETE FROM project_tags WHERE project_id = ?");
        $stmt->execute([$project_id]);

        // Delete related criteria
        $stmt = $pdo->prepare("DELETE FROM project_criteria WHERE project_id = ?");
        $stmt->execute([$project_id]);

        // Delete related images
        $stmt = $pdo->prepare("DELETE FROM project_images WHERE project_id = ?");
        $stmt->execute([$project_id]);

        // Delete the project
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$project_id]);

        $pdo->commit();
        http_response_code(200);
        echo json_encode(['message' => 'Project deleted successfully']);
        error_log('projects.php DELETE: Successfully deleted project_id=' . $project_id);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete project: ' . $e->getMessage()]);
        error_log('projects.php DELETE: Database error: ' . $e->getMessage());
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    error_log('projects.php: Method not allowed, received: ' . $method);
}
?>