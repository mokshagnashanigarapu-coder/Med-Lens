# MedLens Google Cloud Run Deployment Script (PowerShell)

param (
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "medlens",
    [string]$GeminiApiKey = ""
)

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null)
}

if (-not $ProjectId) {
    Write-Host "Error: GCP Project ID is required. Usage: .\deploy-cloudrun.ps1 -ProjectId 'YOUR_GCP_PROJECT_ID'" -ForegroundColor Red
    exit 1
}

# Read GEMINI_API_KEY from .env.local if not passed as argument
if (-not $GeminiApiKey -and (Test-Path ".env.local")) {
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -match "^GEMINI_API_KEY=(.+)$") {
            $GeminiApiKey = $matches[1].Trim()
        }
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Deploying MedLens to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId"
Write-Host " Region:  $Region"
Write-Host " Service: $ServiceName"
Write-Host "==================================================" -ForegroundColor Cyan

# Step 1: Submit container build using Cloud Build
Write-Host "Step 1/2: Building container image via Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag "gcr.io/$ProjectId/$ServiceName`:latest" .

# Step 2: Deploy container to Cloud Run
Write-Host "Step 2/2: Deploying container to Cloud Run..." -ForegroundColor Yellow
if ($GeminiApiKey) {
    gcloud run deploy $ServiceName `
      --image "gcr.io/$ProjectId/$ServiceName`:latest" `
      --platform managed `
      --region $Region `
      --allow-unauthenticated `
      --set-env-vars "GEMINI_API_KEY=$GeminiApiKey,GEMINI_MODEL=gemini-3.6-flash"
} else {
    gcloud run deploy $ServiceName `
      --image "gcr.io/$ProjectId/$ServiceName`:latest" `
      --platform managed `
      --region $Region `
      --allow-unauthenticated `
      --set-env-vars "GEMINI_MODEL=gemini-3.6-flash"
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host " MedLens Cloud Run Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
