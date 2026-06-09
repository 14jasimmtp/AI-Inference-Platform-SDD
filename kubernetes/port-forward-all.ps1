$ErrorActionPreference = "Stop"

Write-Host "Starting Kubernetes Port-Forwards..."
Write-Host "Press Ctrl+C to stop all forwards when done."
Write-Host ""

# Start background jobs for port forwarding
$jobs = @(
    Start-Job -Name "frontend" -ScriptBlock { wsl bash -c "minikube kubectl -- port-forward svc/frontend-service 3000:3000 -n ai-platform" }
    Start-Job -Name "backend" -ScriptBlock { wsl bash -c "minikube kubectl -- port-forward svc/backend-service 8000:8000 -n ai-platform" }
    Start-Job -Name "grafana" -ScriptBlock { wsl bash -c "minikube kubectl -- port-forward svc/prometheus-stack-grafana 3001:80 -n ai-platform" }
    Start-Job -Name "prometheus" -ScriptBlock { wsl bash -c "minikube kubectl -- port-forward svc/prometheus-stack-kube-prom-prometheus 9090:9090 -n ai-platform" }
)

Write-Host "Wait 5-10 seconds for connections to establish, then you can access:"
Write-Host "  - Frontend:   http://localhost:3000"
Write-Host "  - Backend:    http://localhost:8000"
Write-Host "  - Grafana:    http://localhost:3001 (admin/admin)"
Write-Host "  - Prometheus: http://localhost:9090"
Write-Host ""
Write-Host "Keep this window open to keep the ports forwarded."

try {
    # Keep script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping port-forwards..."
    $jobs | Stop-Job
    $jobs | Remove-Job
    Write-Host "Stopped."
}
