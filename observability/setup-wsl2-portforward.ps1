# WSL2 Port Forwarding Setup for AI Inference Platform Observability Stack
# Run this script as Administrator in PowerShell
# Right-click PowerShell -> "Run as administrator", then execute this file

# Step 1: Get the current WSL2 IP address dynamically
$wsl2Ip = (wsl hostname -I).Trim().Split(" ")[0]
Write-Host "WSL2 IP detected: $wsl2Ip" -ForegroundColor Cyan

# Step 2: Remove any stale port proxy rules for these ports (idempotent)
$ports = @(3001, 3100, 9090)
foreach ($port in $ports) {
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=127.0.0.1 2>$null
}

# Step 3: Add port proxy rules -> forward Windows localhost to WSL2 IP
foreach ($port in $ports) {
    netsh interface portproxy add v4tov4 `
        listenport=$port `
        listenaddress=127.0.0.1 `
        connectport=$port `
        connectaddress=$wsl2Ip
    Write-Host "Forwarded localhost:$port -> ${wsl2Ip}:$port" -ForegroundColor Green
}

# Step 4: Add Windows Firewall rules to allow inbound traffic on these ports
$firewallRuleName = "WSL2-Observability-Stack"
netsh advfirewall firewall delete rule name="$firewallRuleName" 2>$null
netsh advfirewall firewall add rule `
    name="$firewallRuleName" `
    dir=in `
    action=allow `
    protocol=TCP `
    localport="3001,3100,9090"
Write-Host "Firewall rule added for ports 3001, 3100, 9090" -ForegroundColor Green

# Step 5: Display all active port proxy rules
Write-Host "`nActive port proxy rules:" -ForegroundColor Yellow
netsh interface portproxy show all

Write-Host "`nDone! You can now access:" -ForegroundColor Cyan
Write-Host "  Grafana:    http://localhost:3001  (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Loki:       http://localhost:3100" -ForegroundColor White
