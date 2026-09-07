# PowerShell script to test AI Chat endpoints
Write-Host "🚀 Starting AI Chat Feature Tests" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow

$baseUrl = "http://localhost:3000"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNjAwMDAwMDAwfQ.example_token"
}

# Test 1: General AI Chat
Write-Host "`n🧪 Testing General AI Chat..." -ForegroundColor Cyan
$generalPayload = @{
    message = "Hello! Can you help me understand programming concepts?"
    conversationHistory = @()
    userMode = "fast"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai-chat/general" -Method POST -Body $generalPayload -Headers $headers
    Write-Host "✅ General AI Chat Success!" -ForegroundColor Green
    Write-Host "Response: $($response.data.response)" -ForegroundColor White
    Write-Host "Session ID: $($response.sessionId)" -ForegroundColor Gray
    Write-Host "Cost: $($response.data.cost)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ General AI Chat Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "Error Details: $errorText" -ForegroundColor Red
    }
}

# Test 2: Course AI Chat
Write-Host "`n🧪 Testing Course AI Chat..." -ForegroundColor Cyan
$coursePayload = @{
    message = "What are the main topics covered in this course?"
    courseId = "CSC101"
    context = @{
        courseCode = "CSC101"
        courseName = "Introduction to Computer Science"
        instructor = "Dr. Smith"
        department = "Computer Science"
        unitLoad = 3
        semester = 1
    }
    conversationHistory = @()
    userMode = "balanced"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai-chat/course" -Method POST -Body $coursePayload -Headers $headers
    Write-Host "✅ Course AI Chat Success!" -ForegroundColor Green
    Write-Host "Response: $($response.data.response)" -ForegroundColor White
    Write-Host "Session ID: $($response.sessionId)" -ForegroundColor Gray
    Write-Host "Cost: $($response.data.cost)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Course AI Chat Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "Error Details: $errorText" -ForegroundColor Red
    }
}

# Test 3: Get Chat Sessions
Write-Host "`n🧪 Testing Get Chat Sessions..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai-chat/sessions" -Method GET -Headers $headers
    Write-Host "✅ Get Chat Sessions Success!" -ForegroundColor Green
    Write-Host "Number of sessions: $($response.data.Length)" -ForegroundColor White
    if ($response.data.Length -gt 0) {
        Write-Host "Latest session title: $($response.data[0].title)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Get Chat Sessions Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host "✅ AI Chat Feature Testing Complete!" -ForegroundColor Green