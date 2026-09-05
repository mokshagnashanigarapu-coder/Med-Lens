# MedLens Google Cloud Run Deployment Script (PowerShell)

param (
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "medlens"
)

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project)
}

if (-not $ProjectId) {
    Write-Host "Error: GCP Project ID is required. Example: .\deploy-cloudrun.ps1 -ProjectId 'my-gcp-project'" -ForegroundColor Red
    exit 1
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Deploying MedLens to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId"
Write-Host " Region:  $Region"
Write-Host " Service: $ServiceName"
Write-Host "==================================================" -ForegroundColor Cyan

# Submit container build
gcloud builds submit --tag "gcr.io/$ProjectId/$ServiceName`:latest" .

# Deploy to Cloud Run
gcloud run deploy $ServiceName `
  --image "gcr.io/$ProjectId/$ServiceName`:latest" `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars GEMINI_MODEL="gemini-2.5-flash"

Write-Host "==================================================" -ForegroundColor Green
Write-Host " MedLens Cloud Run Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
