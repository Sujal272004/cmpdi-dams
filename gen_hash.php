<?php
// Generate BCrypt hash for password123 using PHP
$password = 'password123';
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
echo "Hash for 'password123': " . $hash . "\n";

// Verify it works
$ok = password_verify($password, $hash);
echo "Verification: " . ($ok ? "OK" : "FAILED") . "\n";
