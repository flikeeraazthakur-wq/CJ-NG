<?php
// get_recommendation.php
// Returns an AI-generated dish recommendation that changes each day.
// Uses Groq API (FREE — no credit card needed).
// Sign up at console.groq.com to get your free API key.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require 'db.php';

// ── 1. Pull all available dishes ─────────────────────────────
$result = $conn->query("SELECT id, name, category, description, price, badge FROM dishes ORDER BY id");
if (!$result || $result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No dishes available']);
    exit;
}

$dishes = [];
while ($row = $result->fetch_assoc()) {
    $dishes[] = $row;
}

// ── 2. Pick today's dish (changes every day automatically) ────
$dayIndex  = (int)date('z'); // 0–365
$todayDish = $dishes[$dayIndex % count($dishes)];
$today     = date('l, F j'); // e.g. "Wednesday, May 14"

// ── 3. Your FREE Groq API key ─────────────────────────────────
// Get yours FREE at: console.groq.com (no credit card needed)
// Paste your key below:
// $env = parse_ini_file(__DIR__ . '/config.env'); $GROQ_API_KEY = $env['GROQ_API_KEY'];
    $env = parse_ini_file(__DIR__ . '/config.env');
$GROQ_API_KEY = $env['GROQ_API_KEY'];
// ── 4. Build the prompt ───────────────────────────────────────
$prompt = "You are the friendly voice of CJ-NJ Foods, a restaurant in Kathmandu, Nepal.

Today is {$today}. The dish of the day is: \"{$todayDish['name']}\" (category: {$todayDish['category']}).
Description: {$todayDish['description']}
Price: रू {$todayDish['price']}

Write a short, enticing 1-2 sentence recommendation for this dish that makes customers want to order it today.
Be warm, specific to the dish, and mention something about why it's great for today (day of week, season, or mood).
Keep it under 40 words. Do NOT use quotes around the dish name. Only return the recommendation text, nothing else.";

// ── 5. Call Groq API (free) ───────────────────────────────────
$payload = json_encode([
    'model'       => 'llama3-8b-8192', // free model on Groq
    'max_tokens'  => 120,
    'messages'    => [
        ['role' => 'user', 'content' => $prompt]
    ]
]);

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $GROQ_API_KEY
    ],
    CURLOPT_TIMEOUT        => 15,
]);

$raw      = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ── 6. Parse response ─────────────────────────────────────────
$aiText = '';
if ($httpCode === 200 && $raw) {
    $resp   = json_decode($raw, true);
    $aiText = trim($resp['choices'][0]['message']['content'] ?? '');
}

// Fallback if API fails or key not set yet
if (!$aiText) {
    $aiText = "Today we recommend " . $todayDish['name'] . " — a delicious {$todayDish['category']} dish you don't want to miss!";
}

// ── 7. Return to banner ───────────────────────────────────────
echo json_encode([
    'success' => true,
    'dish'    => [
        'id'       => $todayDish['id'],
        'name'     => $todayDish['name'],
        'category' => $todayDish['category'],
        'price'    => $todayDish['price'],
        'badge'    => $todayDish['badge'],
    ],
    'ai_text' => $aiText,
    'day'     => $today,
]);
