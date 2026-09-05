#!/bin/bash
# MedLens Google Cloud Run Deployment Script

set -e

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION=${2:-"us-central1"}
SERVICE_NAME="medlens"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP Project ID is required. Usage: ./deploy-cloudrun.sh YOUR_GCP_PROJECT_ID [REGION]"
  exit 1
fi

GEMINI_KEY=""
if [ -f ".env.local" ]; then
  GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env.local | cut -d '=' -f2- | tr -d '\r')
fi

echo "=================================================="
echo " Deploying MedLens to Google Cloud Run"
echo " Project: ${PROJECT_ID}"
echo " Region:  ${REGION}"
echo " Service: ${SERVICE_NAME}"
echo "=================================================="

# Step 1: Submit container build using Cloud Build
echo "Step 1/2: Building container image via Cloud Build..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

# Step 2: Deploy container to Cloud Run
echo "Step 2/2: Deploying container to Cloud Run..."
if [ -n "$GEMINI_KEY" ]; then
  gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY="${GEMINI_KEY}",GEMINI_MODEL="gemini-3.6-flash"
else
  gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --set-env-vars GEMINI_MODEL="gemini-3.6-flash"
fi

echo "=================================================="
echo " MedLens Cloud Run Deployment Complete!"
echo "=================================================="
