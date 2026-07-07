# Helper script to get your local IP address for mobile app configuration

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    RadiantClariX IP Configuration     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get all network adapters
$adapters = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -eq "Dhcp" }

if ($adapters.Count -eq 0) {
    # Try manual method if no DHCP found
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
}

if ($adapters.Count -eq 0) {
    Write-Host "❌ No network adapter found!" -ForegroundColor Red
    Write-Host "   Make sure you're connected to WiFi" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Your IP Address(es):" -ForegroundColor Green
Write-Host ""

$adapters | ForEach-Object {
    $ip = $_.IPAddress
    Write-Host "   🌐 $ip" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Configuration Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copy one of the IP addresses above" -ForegroundColor White
Write-Host "2. Open: services/api.js" -ForegroundColor White
Write-Host "3. Update these lines (around line 22-23):" -ForegroundColor White
Write-Host ""

$primaryIP = $adapters[0].IPAddress

Write-Host "   const DEVELOPMENT_API_URL = 'http://${primaryIP}:5000/api';" -ForegroundColor Cyan
Write-Host "   const MODEL_API_URL = 'http://${primaryIP}:8502';" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Make sure your phone is on the SAME WiFi network" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host ""

# Copy to clipboard if possible
try {
    $primaryIP | Set-Clipboard
    Write-Host "💾 Primary IP ($primaryIP) copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "💡 Tip: Manually copy the IP address above" -ForegroundColor Yellow
}

Write-Host ""
