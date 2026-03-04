<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
$files = glob(__DIR__ . '/*.txt');
$names = array_map('basename', $files);
sort($names);
echo json_encode($names);