<?php
header('Content-Type: application/json');
include '../config.php'; // Adjust path as needed

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Create a new event
        $data = json_decode(file_get_contents('php://input'), true);
        
        $user_id = $data['user_id'] ?? null;
        $title = $data['title'] ?? '';
        $date = $data['date'] ?? '';
        $location = $data['location'] ?? null;
        $description = $data['description'] ?? null;
        $plan = $data['plan'] ?? null;
        $type = $data['type'] ?? 'user-created';

        if (!$user_id || !$title || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: user_id, title, and date are required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare('
                INSERT INTO events (user_id, title, date, location, description, plan, type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$user_id, $title, $date, $location, $description, $plan, $type]);
            $event_id = $pdo->lastInsertId();
            echo json_encode(['event_id' => $event_id, 'message' => 'Event created successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create event: ' . $e->getMessage()]);
        }
        break;

    case 'GET':
        // Retrieve events for a user
        $user_id = $_GET['user_id'] ?? null;
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing user_id']);
            exit;
        }

        try {
            $stmt = $pdo->prepare('SELECT * FROM events WHERE user_id = ? ORDER BY date ASC');
            $stmt->execute([$user_id]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($events);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch events: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        error_log('events.php DELETE: Raw data: ' . print_r($data, true));

        $event_id = $data['event_id'] ?? null;
        $user_id = $data['user_id'] ?? 0;

        if (!$event_id || !$user_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing event_id or user_id']);
            error_log('events.php DELETE: Missing event_id or user_id');
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ? AND user_id = ?");
        $stmt->execute([$event_id, $user_id]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Event not found or not authorized']);
            error_log('events.php DELETE: Event not found or not authorized for event_id=' . $event_id . ', user_id=' . $user_id);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
            $stmt->execute([$event_id]);
            http_response_code(200);
            echo json_encode(['message' => 'Event deleted successfully']);
            error_log('events.php DELETE: Successfully deleted event_id=' . $event_id);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete event: ' . $e->getMessage()]);
            error_log('events.php DELETE: Database error: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>