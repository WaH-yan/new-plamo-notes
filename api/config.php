<?php
// config.php
$host = 'localhost';
$port = '8888'; // Try 8889 for MAMP MySQL
$dbname = 'model_kit_manager';
$username = 'root'; // Default MAMP MySQL username
$password = 'root'; // Default MAMP MySQL password

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Enable error reporting for debugging
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} catch (PDOException $e) {
    error_log('Connection failed: ' . $e->getMessage()); // Debug log
    die("Connection failed: " . $e->getMessage());
}
?>