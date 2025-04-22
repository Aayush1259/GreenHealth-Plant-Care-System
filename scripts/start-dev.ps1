# PowerShell script to safely start Next.js development server
# This script kills existing node processes and cleans cache before starting

Write-Host "Starting safe development server setup..." -ForegroundColor Green

# Check if we have admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "NOTE: Running without administrator privileges. Some operations may fail." -ForegroundColor Yellow
}

# Kill any existing Node.js processes that might be locking files
Write-Host "Checking for existing node processes..." -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found Node.js processes. Attempting to stop them..." -ForegroundColor Yellow
    
    try {
        $nodeProcesses | ForEach-Object {
            Write-Host "Stopping process with ID $($_.Id)..." -ForegroundColor Cyan
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Node.js processes stopped successfully" -ForegroundColor Green
    } catch {
        Write-Host "Error stopping some Node.js processes: $_" -ForegroundColor Red
        Write-Host "You may need to manually close them using Task Manager" -ForegroundColor Yellow
    }
} else {
    Write-Host "No running Node.js processes found" -ForegroundColor Green
}

# Directly delete the .next/trace file if it exists using native PowerShell commands
$tracePath = Join-Path -Path (Get-Location) -ChildPath ".next\trace"
if (Test-Path $tracePath) {
    Write-Host "Found problematic trace file. Attempting to remove..." -ForegroundColor Yellow
    
    try {
        Remove-Item -Path $tracePath -Force -ErrorAction Stop
        Write-Host "Successfully removed trace file" -ForegroundColor Green
    } catch {
        Write-Host "Could not delete trace file: $_" -ForegroundColor Red
        Write-Host "Using alternative method..." -ForegroundColor Yellow
        
        try {
            # Alternative deletion with cmd.exe
            cmd /c "del $tracePath /F /Q"
            Write-Host "Alternative deletion completed" -ForegroundColor Green
        } catch {
            Write-Host "Alternative deletion also failed" -ForegroundColor Red
        }
    }
}

# Set environment variables
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NEXT_TRACE_SILENT = "1"

# Run the development server
Write-Host "Starting Next.js development server on port 3001..." -ForegroundColor Green
npm run dev

# Note: The following line will only execute if the server is stopped
Write-Host "Development server has stopped" -ForegroundColor Red 