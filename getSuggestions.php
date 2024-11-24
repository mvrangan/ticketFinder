<?php
header('Content-Type: application/json');

// Enable error reporting for debugging purposes
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database connection settings
$servername = "localhost";
$username = //erased
$password = //erased
$dbname = //erased

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Check if the 'query' parameter is set in the URL
if (isset($_GET['query'])) {
    $query = $_GET['query'];
    
    // Prepare the SQL statement
    $stmt = $conn->prepare("SELECT artist FROM artists WHERE artist LIKE ?");
    if ($stmt === false) {
        echo json_encode(["error" => "Failed to prepare SQL statement: " . $conn->error]);
        exit();
    }
    
    $likeQuery = "%" . $query . "%";
    $stmt->bind_param("s", $likeQuery);
    
    // Execute the statement
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Fetch results and prepare JSON response
    $artists = [];
    while ($row = $result->fetch_assoc()) {
        $artists[] = $row['artist'];
    }
    
    // Close the statement and connection
    $stmt->close();
    $conn->close();
    
    // Output the JSON response
    echo json_encode($artists);
} else {
    echo json_encode(["error" => "Query parameter is missing"]);
}
?>
